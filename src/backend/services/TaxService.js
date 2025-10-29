import { Decimal } from '@prisma/client/runtime/library.js'

/**
 * TaxService: calcula y persiste tributos (retenciones/percepciones)
 * soportados por las reglas en `tax_rules` y los aplica a documentos.
 */
class TaxService {
  /**
   * Obtiene reglas activas para compañía/rol/provincia (válidas por fecha).
   */
  static async getActiveRules(tx, { companyId, counterpartyRole, provinceCode, at = new Date() }) {
    const rules = await tx.taxRule.findMany({
      where: {
        companyId,
        counterpartyRole,
        provinceCode,
        validFrom: { lte: at },
        OR: [{ validTo: null }, { validTo: { gte: at } }]
      },
      orderBy: [{ createdAt: 'asc' }]
    })
    return rules || []
  }

  /**
   * Redondeo según regla.
   */
  static round(amount, method) {
    const num = Number(amount)
    const factor = 100
    if (method === 'DOWN') return new Decimal(Math.floor(num * factor) / factor)
    if (method === 'UP') return new Decimal(Math.ceil(num * factor) / factor)
    // HALF_UP por defecto
    return new Decimal(Number(num.toFixed(2)))
  }

  /**
   * Calcula base imponible por regla en función del método.
   * items: deben tener snapshot de línea (subtotalNet, taxTotal, lineTotalGross) si disponible.
   */
  static computeBase(rule, { items, docSubtotal }) {
    if (rule.baseMethod === 'NET_PLUS_II') {
      let base = new Decimal(0)
      for (const it of items || []) {
        const subtotalNet = new Decimal(it.subtotalNet ?? it.subtotal ?? 0)
        const taxTotal = new Decimal(it.taxTotal ?? it.taxAmount ?? 0)
        const lineTotalGross = new Decimal(it.lineTotalGross ?? it.total ?? 0)
        // Impuestos internos estimados = bruto - neto - IVA
        const internalTaxes = lineTotalGross.sub(subtotalNet).sub(taxTotal)
        base = base.add(subtotalNet).add(internalTaxes)
      }
      return new Decimal(base.toFixed(2))
    }
    // NET por defecto: usar subtotal del documento
    const base = new Decimal(docSubtotal || 0)
    return new Decimal(base.toFixed(2))
  }

  /**
   * Crea líneas de tributo para un documento y actualiza totales del período.
   * params: { tx, companyId, provinceCode, counterpartyRole, issueDate, items, docSubtotal, docId, docType }
   */
  static async applyTaxesForDocument(tx, params) {
    const { companyId, provinceCode, counterpartyRole, issueDate, items, docSubtotal, docId, docType } = params
    const rules = await TaxService.getActiveRules(tx, { companyId, counterpartyRole, provinceCode, at: issueDate })
    if (!rules.length) return { created: 0 }

    const lines = []
    for (const rule of rules) {
      const base = TaxService.computeBase(rule, { items, docSubtotal })
      const amountRaw = base.mul(new Decimal(rule.rate)).div(new Decimal(100))
      const amount = TaxService.round(amountRaw, rule.rounding || 'HALF_UP')
      // Umbral mínimo opcional
      if (rule.minAmount && amount.lt(new Decimal(rule.minAmount))) {
        continue
      }
      const line = {
        companyId,
        taxType: rule.taxType,
        provinceCode,
        activityCode: rule.activityCode || null,
        counterpartyRole,
        rate: new Decimal(rule.rate),
        baseMethod: rule.baseMethod,
        baseAmount: base,
        amount: amount,
        rounding: rule.rounding || 'HALF_UP',
        ruleId: rule.id,
        // Referencias al documento
        invoiceId: docType === 'INVOICE' ? docId : null,
        salesOrderId: docType === 'SALE' ? docId : null
      }
      lines.push(line)
    }

    if (!lines.length) return { created: 0 }

    await tx.documentTaxLine.createMany({ data: lines })

    // Actualizar totales del período (YYYY-MM)
    const yyyy = issueDate.getFullYear()
    const mm = String(issueDate.getMonth() + 1).padStart(2, '0')
    const period = `${yyyy}-${mm}`
    for (const l of lines) {
      const existing = await tx.taxPeriodTotal.findFirst({
        where: { companyId, period, provinceCode: l.provinceCode, taxType: l.taxType }
      })
      if (existing) {
        await tx.taxPeriodTotal.update({
          where: { id: existing.id },
          data: { amountTotal: new Decimal(existing.amountTotal).add(new Decimal(l.amount)).toNumber() }
        })
      } else {
        await tx.taxPeriodTotal.create({
          data: {
            companyId,
            period,
            provinceCode: l.provinceCode,
            taxType: l.taxType,
            amountTotal: l.amount
          }
        })
      }
    }

    return { created: lines.length }
  }

  /**
   * Revierte tributos creando líneas negativas y ajustando totales del período.
   */
  static async revertTaxesForDocument(tx, { companyId, docId, docType }) {
    // Buscar líneas existentes
    const where = docType === 'INVOICE' ? { invoiceId: docId, companyId } : { salesOrderId: docId, companyId }
    const existing = await tx.documentTaxLine.findMany({ where })
    if (!existing.length) return { reversed: 0 }

    // Necesitamos issueDate para período; tomar del documento
    let issueDate = new Date()
    if (docType === 'INVOICE') {
      const inv = await tx.invoice.findUnique({ where: { id: docId }, select: { issueDate: true } })
      issueDate = inv?.issueDate || issueDate
    } else {
      const so = await tx.salesOrder.findUnique({ where: { id: docId }, select: { createdAt: true } })
      issueDate = so?.createdAt || issueDate
    }

    const negativeLines = existing.map(l => ({
      companyId,
      taxType: l.taxType,
      provinceCode: l.provinceCode,
      activityCode: l.activityCode || null,
      counterpartyRole: l.counterpartyRole,
      rate: l.rate,
      baseMethod: l.baseMethod,
      baseAmount: new Decimal(l.baseAmount).mul(new Decimal(-1)),
      amount: new Decimal(l.amount).mul(new Decimal(-1)),
      rounding: l.rounding,
      ruleId: l.ruleId || null,
      invoiceId: docType === 'INVOICE' ? docId : null,
      salesOrderId: docType === 'SALE' ? docId : null
    }))

    await tx.documentTaxLine.createMany({ data: negativeLines })

    // Ajustar totales del período
    const yyyy = issueDate.getFullYear()
    const mm = String(issueDate.getMonth() + 1).padStart(2, '0')
    const period = `${yyyy}-${mm}`
    for (const l of negativeLines) {
      const existingPeriod = await tx.taxPeriodTotal.findFirst({
        where: { companyId, period, provinceCode: l.provinceCode, taxType: l.taxType }
      })
      if (existingPeriod) {
        await tx.taxPeriodTotal.update({
          where: { id: existingPeriod.id },
          data: { amountTotal: new Decimal(existingPeriod.amountTotal).add(new Decimal(l.amount)).toNumber() }
        })
      } else {
        // Crear registro con monto negativo si no existía
        await tx.taxPeriodTotal.create({
          data: {
            companyId,
            period,
            provinceCode: l.provinceCode,
            taxType: l.taxType,
            amountTotal: l.amount
          }
        })
      }
    }

    return { reversed: negativeLines.length }
  }

  // Conveniences
  static async applyTaxesForInvoice(tx, { companyId, invoice, items, provinceCode }) {
    return TaxService.applyTaxesForDocument(tx, {
      companyId,
      provinceCode,
      counterpartyRole: 'CUSTOMER',
      issueDate: invoice.issueDate,
      items,
      docSubtotal: invoice.subtotal,
      docId: invoice.id,
      docType: 'INVOICE'
    })
  }

  static async applyTaxesForSale(tx, { companyId, sale, items, provinceCode }) {
    return TaxService.applyTaxesForDocument(tx, {
      companyId,
      provinceCode,
      counterpartyRole: 'CUSTOMER',
      issueDate: sale.createdAt,
      items,
      docSubtotal: sale.subtotal,
      docId: sale.id,
      docType: 'SALE'
    })
  }
}

export default TaxService
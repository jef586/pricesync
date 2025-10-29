import { Decimal } from '@prisma/client/runtime/library.js'

class TaxService {
  static periodFromDate(date) {
    const d = date instanceof Date ? date : new Date(date)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }

  static round(amount, method = 'HALF_UP') {
    const dec = amount instanceof Decimal ? amount : new Decimal(amount || 0)
    if (method === 'DOWN') {
      return dec.mul(100).floor().div(100)
    }
    if (method === 'UP') {
      return dec.mul(100).ceil().div(100)
    }
    return new Decimal(dec.toFixed(2))
  }

  static computeBase(rule, items = [], subtotal) {
    // Base imponible: por ahora NET y NET_PLUS_II usan subtotal del documento
    if (subtotal != null) {
      const s = subtotal instanceof Decimal ? subtotal : new Decimal(subtotal)
      return new Decimal(s.toFixed(2))
    }
    let sum = new Decimal(0)
    for (const it of items || []) {
      const v = it?.subtotal instanceof Decimal ? it.subtotal : new Decimal(it?.subtotal || 0)
      sum = sum.add(v)
    }
    return new Decimal(sum.toFixed(2))
  }

  static async getActiveRules(tx, { companyId, provinceCode, date, counterpartyRole = 'CUSTOMER' }) {
    const at = date instanceof Date ? date : new Date(date || Date.now())
    return tx.taxRule.findMany({
      where: {
        companyId,
        provinceCode: provinceCode || 'BA',
        counterpartyRole,
        validFrom: { lte: at },
        OR: [{ validTo: null }, { validTo: { gte: at } }]
      },
      orderBy: { createdAt: 'asc' }
    })
  }

  static async applyTaxesForDocument(tx, { companyId, doc, docType, items = [], provinceCode }) {
    const docDate = (doc?.issueDate || doc?.createdAt) ? new Date(doc.issueDate || doc.createdAt) : new Date()
    const rules = await TaxService.getActiveRules(tx, { companyId, provinceCode, date: docDate })
    if (!rules.length) return []

    const created = []
    for (const rule of rules) {
      const base = TaxService.computeBase(rule, items, doc?.subtotal)
      if (rule?.minAmount && base.lt(rule.minAmount)) continue

      const amount = TaxService.round(base.mul(rule.rate).div(100), rule.rounding)
      if (amount.eq(0)) continue

      const lineData = {
        companyId,
        taxType: rule.taxType,
        provinceCode: rule.provinceCode,
        activityCode: rule.activityCode || null,
        counterpartyRole: rule.counterpartyRole,
        rate: rule.rate,
        baseMethod: rule.baseMethod,
        baseAmount: base,
        amount,
        rounding: rule.rounding,
        ruleId: rule.id,
        createdAt: docDate
      }
      if (docType === 'INVOICE') lineData.invoiceId = doc.id
      if (docType === 'SALE') lineData.salesOrderId = doc.id

      const line = await tx.documentTaxLine.create({ data: lineData })
      created.push(line)

      const period = TaxService.periodFromDate(docDate)
      await tx.taxPeriodTotal.upsert({
        where: {
          companyId_period_provinceCode_taxType: {
            companyId,
            period,
            provinceCode: rule.provinceCode,
            taxType: rule.taxType
          }
        },
        update: { amountTotal: { increment: amount.toNumber() } },
        create: {
          companyId,
          period,
          provinceCode: rule.provinceCode,
          taxType: rule.taxType,
          amountTotal: amount
        }
      })
    }
    return created
  }

  static async applyTaxesForInvoice(tx, { companyId, invoice, items, provinceCode }) {
    return TaxService.applyTaxesForDocument(tx, {
      companyId,
      doc: invoice,
      docType: 'INVOICE',
      items,
      provinceCode
    })
  }

  static async applyTaxesForSale(tx, { companyId, sale, items, provinceCode }) {
    return TaxService.applyTaxesForDocument(tx, {
      companyId,
      doc: sale,
      docType: 'SALE',
      items,
      provinceCode
    })
  }

  static async revertTaxesForDocument(tx, { companyId, docId, docType }) {
    const whereDoc = docType === 'INVOICE' ? { id: docId } : { id: docId }
    const doc = docType === 'INVOICE'
      ? await tx.invoice.findUnique({ where: whereDoc })
      : await tx.salesOrder.findUnique({ where: whereDoc })

    if (!doc) return { reversed: 0 }

    const whereLines = docType === 'INVOICE' ? { invoiceId: docId } : { salesOrderId: docId }
    const lines = await tx.documentTaxLine.findMany({ where: { companyId, ...whereLines } })
    if (!lines.length) return { reversed: 0 }

    const reversalDate = new Date()
    const period = TaxService.periodFromDate(reversalDate)

    let count = 0
    for (const ln of lines) {
      const negBase = (ln.baseAmount instanceof Decimal ? ln.baseAmount : new Decimal(ln.baseAmount)).mul(-1)
      const negAmount = (ln.amount instanceof Decimal ? ln.amount : new Decimal(ln.amount)).mul(-1)
      const data = {
        companyId,
        taxType: ln.taxType,
        provinceCode: ln.provinceCode,
        activityCode: ln.activityCode || null,
        counterpartyRole: ln.counterpartyRole,
        rate: ln.rate,
        baseMethod: ln.baseMethod,
        baseAmount: negBase,
        amount: negAmount,
        rounding: ln.rounding,
        ruleId: ln.ruleId,
        createdAt: reversalDate
      }
      if (docType === 'INVOICE') data.invoiceId = docId
      if (docType === 'SALE') data.salesOrderId = docId
      await tx.documentTaxLine.create({ data })
      count++

      await tx.taxPeriodTotal.upsert({
        where: {
          companyId_period_provinceCode_taxType: {
            companyId,
            period,
            provinceCode: ln.provinceCode,
            taxType: ln.taxType
          }
        },
        update: { amountTotal: { increment: negAmount.toNumber() } },
        create: {
          companyId,
          period,
          provinceCode: ln.provinceCode,
          taxType: ln.taxType,
          amountTotal: negAmount
        }
      })
    }

    return { reversed: count }
  }
}

export default TaxService
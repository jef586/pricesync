import prisma from "../config/database.js";
import SalesService from "../services/SalesService.js";
import { randomUUID } from "crypto";
import StockService from "../services/StockService.js";
import UomService from "../services/UomService.js";
import { mapErrorToHttp } from "../utils/httpError.js";
import TaxService from "../services/TaxService.js";
import LoyaltyService from "../services/LoyaltyService.js";

class SalesController {
  static async create(req, res) {
    try {
      const companyId = req.user?.company?.id;
      if (!companyId) {
        return res.status(403).json({ success: false, message: "Empresa no determinada para el usuario" });
      }

      const { customerId, items, payments = [], notes, finalDiscount, surcharge_type, surcharge_value } = req.body;

      // Validar existencia del cliente en la compañía
      const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId } });
      if (!customer) {
        return res.status(404).json({ success: false, message: "Cliente no encontrado" });
      }

      // Validar artículos (soportando compatibilidad productId -> articleId)
      for (const item of items) {
        const refId = item.articleId ?? item.productId;
        if (refId) {
          const article = await prisma.article.findFirst({ where: { id: refId, companyId } });
          if (!article) {
            return res.status(404).json({ success: false, message: "Artículo no encontrado: " + refId });
          }
          if (!item.description) item.description = article.name;
          item.articleId = refId;
        } else {
          if (!item.description) {
            return res.status(400).json({ success: false, message: "Descripción requerida cuando no hay articleId" });
          }
        }
      }


      // Normalizar UoM/cantidad y descuentos por ítem; preparar ítems
      const preparedItems = [];
      for (const item of items) {
        // UoM y cantidad: normalizar/validar
        let uom
        let quantity
        try {
          uom = UomService.parseUom(item.uom || 'UN')
          quantity = UomService.normalizeQtyInput(uom, item.quantity).toNumber()
        } catch (e) {
          const code = e?.httpCode || 400
          return res.status(code).json({ success: false, message: e?.message || 'Cantidad/UoM inválida' })
        }

        const unitPrice = Number(item.unitPrice);
        const taxRate = Number(item.taxRate ?? 21);

        let isDiscountable = item.is_discountable;
        if (isDiscountable == null) isDiscountable = true;

        // Determinar tipo/valor efectivo (compat con `discount` porcentaje)
        let discountType = item.discount_type ?? item.discountType ?? (item.discount != null ? 'PERCENT' : undefined);
        let discountValue = item.discount_value ?? item.discountValue ?? (item.discount != null ? Number(item.discount) : 0);

        if (isDiscountable === false) {
          discountType = undefined;
          discountValue = 0;
        }

        // Validaciones de valor
        if (discountValue < 0) {
          return res.status(400).json({ success: false, message: 'discount_value debe ser >= 0' });
        }
        const lineGross = quantity * unitPrice;
        if (discountType === 'PERCENT') {
          if (discountValue < 0 || discountValue > 100) {
            return res.status(400).json({ success: false, message: 'discount_value (%) debe estar entre 0 y 100' });
          }
        } else if (discountType === 'ABS') {
          if (discountValue > lineGross) {
            return res.status(400).json({ success: false, message: 'discount_value ($) no puede superar el bruto de línea' });
          }
        }

        preparedItems.push({
          articleId: item.articleId ?? item.productId ?? null,
          description: item.description,
          uom,
          quantity,
          unitPrice,
          taxRate,
          discountType,
          discountValue,
          isDiscountable,
        });
      }

      // Normalizar y validar recargo final
      const rawType = surcharge_type;
      const rawValue = surcharge_value;
      let normType;
      if (rawType == null || rawType === '' || rawType === 'NONE' || rawType === 'none') {
        normType = undefined;
      } else {
        const up = String(rawType).toUpperCase();
        if (up === 'PERCENT' || up === 'ABS') {
          normType = up;
        } else {
          return res.status(400).json({ success: false, message: `surcharge_type inválido: ${rawType}` });
        }
      }
      const normValue = Number(rawValue || 0);
      if (!(normValue >= 0)) {
        return res.status(400).json({ success: false, message: 'surcharge_value debe ser >= 0' });
      }

      // Calcular totales (coexistencia: primero ítems, luego descuento final, luego recargo)
      const surcharge = { type: normType, value: normValue };
      const totals = SalesService.calculateTotals(preparedItems, finalDiscount, surcharge);
      const computedItems = totals.items || preparedItems;

      // Generar número secuencial de venta
      const nextNumber = await prisma.$transaction(async (tx) => {
        const last = await tx.salesOrder.findFirst({
          where: { companyId },
          orderBy: { createdAt: "desc" },
          select: { number: true }
        });
        const seq = last && last.number?.includes("-") ? parseInt(last.number.split("-")[1], 10) || 0 : 0;
        const nextSeq = seq + 1;
        return `SO-${String(nextSeq).padStart(8, "0")}`;
      });

            // Validación de precio mínimo eliminada: artículos no tienen minPrice


      if (Number(totals.totalRounded.toNumber()) < 0) {
        return res.status(400).json({ success: false, message: 'Total no puede ser negativo' });
      }

      // Persistencia transaccional
      const created = await prisma.$transaction(async (tx) => {
        const sale = await tx.salesOrder.create({
          data: {
            number: nextNumber,
            companyId,
            customerId,
            subtotal: totals.subtotal.toNumber(),
            taxAmount: totals.taxAmount.toNumber(),
            discountAmount: totals.discountAmount.toNumber(), // descuento final
            surchargeType: normType || null,
            surchargeValue: normValue,
            surchargeAmount: totals.surchargeAmount.toNumber(),
            total: totals.total.toNumber(),
            totalRounded: totals.totalRounded.toNumber(),
            status: "open",
            notes: notes || null,
            items: {
              create: computedItems.map((i) => ({
                // Usar relación article con connect cuando haya id
                ...(i.articleId ? { article: { connect: { id: i.articleId } } } : {}),
                description: i.description,
                uom: i.uom || 'UN',
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                discount: i.discountType === 'PERCENT' ? i.discountValue : 0, // compat
                discountType: i.discountType || null,
                discountValue: i.discountValue || 0,
                discountTotal: i.discountTotal?.toNumber ? i.discountTotal.toNumber() : (i.discountTotal || 0),
                isDiscountable: i.isDiscountable ?? true,
                taxRate: i.taxRate ?? 21,
                subtotal: i.subtotal.toNumber ? i.subtotal.toNumber() : i.subtotal,
                taxAmount: i.taxAmount.toNumber ? i.taxAmount.toNumber() : i.taxAmount,
                total: i.total.toNumber ? i.total.toNumber() : i.total,
              }))
            },
            payments: payments.length ? {
              create: payments.map(p => ({
                method: p.method,
                amount: p.amount,
                currency: p.currency || "ARS",
                reference: p.reference || null,
                paidAt: p.paidAt ? new Date(p.paidAt) : new Date(),
              }))
            } : undefined,
          },
          include: {
            items: true,
            payments: true,
          customer: { select: { id: true, name: true, email: true } }
          }
        });

        try {
          await StockService.createSaleOutForOrder(tx, {
            companyId,
            saleId: sale.id,
            createdBy: req.user?.id || 'system'
          })
        } catch (err) {
          throw Object.assign(err, { httpCode: err?.httpCode || 500 })
        }

        // Aplicar tributos (retenciones/percepciones) para la venta en best-effort:
        // no bloquear la creación de la venta si hay incompatibilidades de esquema
        try {
          const provinceCode = customer?.state || req.user?.company?.state || 'BA'
          await TaxService.applyTaxesForSale(tx, {
            companyId,
            sale,
            items: computedItems,
            provinceCode
          })
        } catch (taxErr) {
          console.warn('Tax apply failed (non-blocking):', taxErr?.message || taxErr)
        }

        return sale;
      });

      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      const errorRef = `SALE_CREATE-${Date.now()}`;
      console.error("Error creando venta:", { errorRef, message: error?.message, code: error?.code, meta: error?.meta });
      const { status, body } = mapErrorToHttp(error, "Error interno creando venta");
      return res.status(status).json({ ...body, errorRef });
    }
  }

  static async getById(req, res) {
    try {
      const companyId = req.user?.company?.id;
      const { id } = req.params;

      const sale = await prisma.salesOrder.findFirst({
        where: { id, companyId },
        include: {
          items: true,
          payments: true,
          customer: { select: { id: true, name: true, email: true } }
        }
      });

      if (!sale) {
        return res.status(404).json({ success: false, message: "Venta no encontrada" });
      }

      // Agregar campos calculados al response (line_total_net)
      const data = {
        ...sale,
        items: (sale.items || []).map(it => ({
          ...it,
          line_total_net: Number(it.subtotal || 0)
        }))
      };
      return res.json({ success: true, data });
    } catch (error) {
      console.error("Error obteniendo venta:", error);
      return res.status(500).json({ success: false, message: "Error interno obteniendo venta" });
    }
  }

  static async update(req, res) {
    try {
      const companyId = req.user?.company?.id;
      const { id } = req.params;
      const { customerId, items = [], payments = [], notes, status, finalDiscount, surcharge_type, surcharge_value } = req.body;

      const existing = await prisma.salesOrder.findFirst({ where: { id, companyId }, include: { items: true } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Venta no encontrada' });
      }

      // Preparar ítems si se envían
      let preparedItems = [];
      if (items && items.length) {
        for (const item of items) {
          // UoM y cantidad: normalizar/validar
          let uom
          try {
            uom = UomService.parseUom(item.uom || 'UN')
            const normQty = UomService.normalizeQtyInput(uom, item.quantity)
            item.quantity = normQty.toNumber()
          } catch (e) {
            const code = e?.httpCode || 400
            return res.status(code).json({ success: false, message: e?.message || 'Cantidad/UoM inválida' })
          }

          const quantity = Number(item.quantity);
          const unitPrice = Number(item.unitPrice);
          const taxRate = Number(item.taxRate ?? 21);
          let isDiscountable = item.is_discountable;
          if (isDiscountable == null) isDiscountable = true;

          let discountType = item.discount_type ?? item.discountType ?? (item.discount != null ? 'PERCENT' : undefined);
          let discountValue = item.discount_value ?? item.discountValue ?? (item.discount != null ? Number(item.discount) : 0);
          if (isDiscountable === false) { discountType = undefined; discountValue = 0; }

          const lineGross = quantity * unitPrice;
          if (discountValue < 0) return res.status(400).json({ success: false, message: 'discount_value debe ser >= 0' });
          if (discountType === 'PERCENT' && (discountValue < 0 || discountValue > 100)) {
            return res.status(400).json({ success: false, message: 'discount_value (%) debe estar entre 0 y 100' });
          }
          if (discountType === 'ABS' && discountValue > lineGross) {
            return res.status(400).json({ success: false, message: 'discount_value ($) no puede superar el bruto de línea' });
          }

          preparedItems.push({ articleId: item.articleId ?? item.productId ?? null, description: item.description, uom, quantity, unitPrice, taxRate, discountType, discountValue, isDiscountable });
        }
      }

      // Normalizar y validar recargo final
      const rawTypeU = surcharge_type;
      const rawValueU = surcharge_value;
      let normTypeU;
      if (rawTypeU == null || rawTypeU === '' || rawTypeU === 'NONE' || rawTypeU === 'none') {
        normTypeU = undefined;
      } else {
        const upU = String(rawTypeU).toUpperCase();
        if (upU === 'PERCENT' || upU === 'ABS') {
          normTypeU = upU;
        } else {
          return res.status(400).json({ success: false, message: `surcharge_type inválido: ${rawTypeU}` });
        }
      }
      const normValueU = Number(rawValueU || 0);
      if (!(normValueU >= 0)) {
        return res.status(400).json({ success: false, message: 'surcharge_value debe ser >= 0' });
      }

      const sc = { type: normTypeU, value: normValueU };
      const totals = preparedItems.length ? SalesService.calculateTotals(preparedItems, finalDiscount, sc) : null;

      if (preparedItems.length) {
        
        if (Number(totals.totalRounded.toNumber()) < 0) {
          return res.status(400).json({ success: false, message: 'Total no puede ser negativo' });
        }
      }

      const updated = await prisma.$transaction(async (tx) => {
        const data = {};
        if (customerId) data.customerId = customerId;
        if (notes !== undefined) data.notes = notes;
        if (status) data.status = status;
        if (totals) {
          data.subtotal = totals.subtotal.toNumber();
          data.taxAmount = totals.taxAmount.toNumber();
          data.discountAmount = totals.discountAmount.toNumber();
          data.surchargeType = normTypeU || null;
          data.surchargeValue = Number(normValueU || 0);
          data.surchargeAmount = totals.surchargeAmount.toNumber();
          data.total = totals.total.toNumber();
          data.totalRounded = totals.totalRounded.toNumber();
        }

        const sale = await tx.salesOrder.update({ where: { id }, data });

        if (preparedItems.length) {
          await tx.salesOrderItem.deleteMany({ where: { salesOrderId: id } });
          for (const i of preparedItems) {
            await tx.salesOrderItem.create({
              data: {
                salesOrderId: id,
                ...(i.articleId ? { article: { connect: { id: i.articleId } } } : {}),
                description: i.description,
                uom: i.uom || 'UN',
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                discount: i.discountType === 'PERCENT' ? i.discountValue : 0,
                discountType: i.discountType || null,
                discountValue: i.discountValue || 0,
                discountTotal: i.discountTotal?.toNumber ? i.discountTotal.toNumber() : (i.discountTotal || 0),
                isDiscountable: i.isDiscountable ?? true,
                taxRate: i.taxRate ?? 21,
                subtotal: i.subtotal.toNumber ? i.subtotal.toNumber() : i.subtotal,
                taxAmount: i.taxAmount.toNumber ? i.taxAmount.toNumber() : i.taxAmount,
                total: i.total.toNumber ? i.total.toNumber() : i.total,
              }
            });
          }
          // Recalcular tributos de la venta (best‑effort):
          // saltar si el esquema de tributos no está listo y no bloquear la actualización
          try {
            const schemaReady = await TaxService.isTaxSchemaReady(tx)
            if (schemaReady) {
              await tx.documentTaxLine.deleteMany({ where: { salesOrderId: id } })
              const cust = await tx.customer.findUnique({ where: { id: existing.customerId } })
              const provinceCode = cust?.state || req.user?.company?.state || 'BA'
              await TaxService.applyTaxesForSale(tx, {
                companyId,
                sale: { id, createdAt: existing.createdAt, subtotal: totals?.subtotal?.toNumber ? totals.subtotal.toNumber() : (totals?.subtotal || existing.subtotal) },
                items: preparedItems,
                provinceCode
              })
            } else {
              console.warn('Tax schema not ready; skipping tax recomputation for sale update')
            }
          } catch (taxErr) {
            console.warn('Tax recompute failed (non-blocking):', taxErr?.message || taxErr)
          }
        }

        // If sale transitioned to cancelled from any non-cancelled state, revert stock and loyalty
        if ((data.status === 'cancelled') && (existing.status !== 'cancelled')) {
          try {
            await StockService.createRevertForOrder(tx, {
              companyId,
              saleId: id,
              createdBy: req.user?.id || 'system'
            })
            // Reverse loyalty points for this sale (idempotent)
            try {
              await LoyaltyService.reverseForSale(tx, { companyId, saleId: id, createdBy: req.user?.id || 'system' })
            } catch (loyErr) {
              console.warn('Loyalty reverse failed:', loyErr?.message || loyErr)
            }
          } catch (err) {
            throw Object.assign(err, { httpCode: err?.httpCode || 500 })
          }
        }

        // Reversión de tributos cuando pasa a cancelada (best‑effort)
        if ((data.status === 'cancelled') && (existing.status !== 'cancelled')) {
          try {
            const schemaReady = await TaxService.isTaxSchemaReady(tx)
            if (schemaReady) {
              await TaxService.revertTaxesForDocument(tx, {
                companyId,
                docId: id,
                docType: 'SALE'
              })
            } else {
              console.warn('Tax schema not ready; skipping tax reversal for sale cancel')
            }
          } catch (taxErr) {
            console.warn('Tax reversal failed (non-blocking):', taxErr?.message || taxErr)
          }
        }
        return sale;
      });

      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error actualizando venta:', error);
      const { status, body } = mapErrorToHttp(error, 'Error interno actualizando venta');
      return res.status(status).json(body);
    }
  }

  static async park(req, res) {
    try {
      const companyId = req.user?.company?.id;
      const { id } = req.params;
      const existing = await prisma.salesOrder.findFirst({ where: { id, companyId } });
      if (!existing) return res.status(404).json({ success: false, message: 'Venta no encontrada' });

      const token = randomUUID();
      const parked = await prisma.salesOrder.update({
        where: { id },
        data: { status: 'parked', parkToken: token, parkedAt: new Date() }
      });
      return res.json({ success: true, data: parked });
    } catch (error) {
      console.error('Error parqueando venta:', error);
      const { status, body } = mapErrorToHttp(error, 'Error interno parqueando venta');
      return res.status(status).json(body);
    }
  }

  static async resume(req, res) {
    try {
      const companyId = req.user?.company?.id;
      const { token } = req.params;
      const sale = await prisma.salesOrder.findFirst({ where: { parkToken: token, companyId } });
      if (!sale) return res.status(404).json({ success: false, message: 'Venta no encontrada' });

      const resumed = await prisma.salesOrder.update({
        where: { id: sale.id },
        data: { status: 'open', parkToken: null, parkedAt: null }
      });
      return res.json({ success: true, data: resumed });
    } catch (error) {
      console.error('Error resumiendo venta:', error);
      const { status, body } = mapErrorToHttp(error, 'Error interno resumiendo venta');
      return res.status(status).json(body);
    }
  }

  static async listParked(req, res) {
    try {
      const companyId = req.user?.company?.id;
      const parked = await prisma.salesOrder.findMany({ where: { companyId, status: 'parked' }, orderBy: { parkedAt: 'desc' } });
      return res.json({ success: true, data: parked });
    } catch (error) {
      console.error('Error listando ventas parqueadas:', error);
      const { status, body } = mapErrorToHttp(error, 'Error interno listando ventas parqueadas');
      return res.status(status).json(body);
    }
  }
}

export default SalesController;

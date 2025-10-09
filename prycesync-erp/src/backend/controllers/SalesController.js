import prisma from "../config/database.js";
import SalesService from "../services/SalesService.js";

class SalesController {
  static async create(req, res) {
    try {
      const companyId = req.user?.company?.id;
      if (!companyId) {
        return res.status(403).json({ success: false, message: "Empresa no determinada para el usuario" });
      }

      const { customerId, items, payments = [], notes } = req.body;

      // Validar existencia del cliente en la compañía
      const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId } });
      if (!customer) {
        return res.status(404).json({ success: false, message: "Cliente no encontrado" });
      }

      // Validar productos (si se proveen productId)
      for (const item of items) {
        if (item.productId) {
          const product = await prisma.product.findFirst({ where: { id: item.productId, companyId } });
          if (!product) {
            return res.status(404).json({ success: false, message: `Producto no encontrado: ${item.productId}` });
          }
          // Si no hay descripción, usar la del producto
          if (!item.description) item.description = product.name;
        } else {
          if (!item.description) {
            return res.status(400).json({ success: false, message: "Descripción requerida cuando no hay productId" });
          }
        }
      }

      // Calcular totales y enriquecer items
      const totals = SalesService.calculateTotals(items);

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

      // Persistencia transaccional
      const created = await prisma.$transaction(async (tx) => {
        const sale = await tx.salesOrder.create({
          data: {
            number: nextNumber,
            companyId,
            customerId,
            subtotal: totals.subtotal.toNumber(),
            taxAmount: totals.taxAmount.toNumber(),
            discountAmount: totals.discountAmount.toNumber(),
            total: totals.total.toNumber(),
            totalRounded: totals.totalRounded.toNumber(),
            status: "open",
            notes: notes || null,
            items: {
              create: items.map((i) => ({
                productId: i.productId || null,
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                discount: i.discount ?? 0,
                taxRate: i.taxRate ?? 21,
                subtotal: i.subtotal.toNumber(),
                taxAmount: i.taxAmount.toNumber(),
                total: i.total.toNumber(),
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
        return sale;
      });

      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      console.error("Error creando venta:", error);
      return res.status(500).json({ success: false, message: "Error interno creando venta" });
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

      return res.json({ success: true, data: sale });
    } catch (error) {
      console.error("Error obteniendo venta:", error);
      return res.status(500).json({ success: false, message: "Error interno obteniendo venta" });
    }
  }
}

export default SalesController;

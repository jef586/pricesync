import prisma from "../config/database.js";
import SalesService from "../services/SalesService.js";
import { randomUUID } from "crypto";

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

  static async park(req, res) {
    try {
      const companyId = req.user?.company?.id;
      const { id } = req.params;
      const { updatedAt: clientUpdatedAt } = req.body || {};

      if (!companyId) {
        return res.status(403).json({ success: false, message: "Empresa no determinada para el usuario" });
      }

      const result = await prisma.$transaction(async (tx) => {
        const sale = await tx.salesOrder.findFirst({
          where: { id, companyId },
          include: { items: true, payments: true }
        });

        if (!sale) {
          return { error: { code: 404, message: "Venta no encontrada" } };
        }

        // Optimistic locking (opcional)
        if (clientUpdatedAt) {
          const clientTs = new Date(clientUpdatedAt).getTime();
          const serverTs = new Date(sale.updatedAt).getTime();
          if (clientTs !== serverTs) {
            return { error: { code: 409, message: "Conflicto: la venta cambió entre lectura y estacionar" } };
          }
        }

        // Idempotencia
        if (sale.status === "parked" && sale.parkToken) {
          const remaining = Number(sale.totalRounded) - Number(sale.paidTotal || 0);
          return {
            ok: true,
            saleId: sale.id,
            status: "PARKED",
            park_token: sale.parkToken,
            parked_at: sale.parkedAt,
            items_count: (sale.items || []).length,
            paid_total: Number(sale.paidTotal || 0),
            remaining: Number(remaining.toFixed(2))
          };
        }

        // Validaciones de estado
        if (!["open", "partially_paid"].includes(sale.status)) {
          return { error: { code: 409, message: "La venta no puede estacionarse en su estado actual" } };
        }

        // Token no predecible
        const token = randomUUID();

        const updated = await tx.salesOrder.update({
          where: { id: sale.id },
          data: {
            status: "parked",
            parkToken: token,
            parkedAt: new Date()
          },
          include: { items: true, payments: true }
        });

        const remaining = Number(updated.totalRounded) - Number(updated.paidTotal || 0);

        return {
          ok: true,
          saleId: updated.id,
          status: "PARKED",
          park_token: updated.parkToken,
          parked_at: updated.parkedAt,
          items_count: (updated.items || []).length,
          paid_total: Number(updated.paidTotal || 0),
          remaining: Number(remaining.toFixed(2))
        };
      });

      if (result?.error) {
        return res.status(result.error.code).json({ success: false, message: result.error.message });
      }
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error estacionando venta:", error);
      return res.status(500).json({ success: false, message: "Error interno estacionando venta" });
    }
  }

  static async resume(req, res) {
    try {
      const companyId = req.user?.company?.id;
      const { id } = req.params;
      const { token } = req.body || {};

      if (!companyId) {
        return res.status(403).json({ success: false, message: "Empresa no determinada para el usuario" });
      }

      const result = await prisma.$transaction(async (tx) => {
        const sale = await tx.salesOrder.findFirst({
          where: { id, companyId },
          include: { items: true, payments: true }
        });
        if (!sale) {
          return { error: { code: 404, message: "Venta no encontrada" } };
        }

        if (sale.status !== "parked") {
          return { error: { code: 409, message: "Conflicto: la venta no está estacionada" } };
        }
        if (token && sale.parkToken && token !== sale.parkToken) {
          return { error: { code: 409, message: "Token de estacionamiento inválido" } };
        }

        const paid = Number(sale.paidTotal || 0);
        const total = Number(sale.totalRounded || sale.total || 0);
        const remaining = Number((total - paid).toFixed(2));
        let newStatus = "open";
        if (paid >= total) newStatus = "paid";
        else if (paid > 0 && paid < total) newStatus = "partially_paid";
        else newStatus = "open";

        const updated = await tx.salesOrder.update({
          where: { id: sale.id },
          data: {
            status: newStatus,
            parkToken: null,
            parkedAt: null
          },
          include: { items: true, payments: true }
        });

        return {
          ok: true,
          saleId: updated.id,
          status: updated.status.toUpperCase(),
          items_count: (updated.items || []).length,
          paid_total: Number(updated.paidTotal || 0),
          remaining: Number((Number(updated.totalRounded) - Number(updated.paidTotal || 0)).toFixed(2))
        };
      });

      if (result?.error) {
        return res.status(result.error.code).json({ success: false, message: result.error.message });
      }
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error reanudando venta:", error);
      return res.status(500).json({ success: false, message: "Error interno reanudando venta" });
    }
  }

  static async listParked(req, res) {
    try {
      const companyId = req.user?.company?.id;
      if (!companyId) {
        return res.status(403).json({ success: false, message: "Empresa no determinada para el usuario" });
      }
      const { search = "", page = 1, limit = 20 } = req.query;
      const take = Math.max(1, Math.min(100, Number(limit)));
      const skip = (Math.max(1, Number(page)) - 1) * take;

      const where = {
        companyId,
        status: "parked",
        OR: search
          ? [
              { parkToken: { contains: String(search), mode: "insensitive" } },
              { customer: { name: { contains: String(search), mode: "insensitive" } } }
            ]
          : undefined
      };

      const [totalCount, rows] = await Promise.all([
        prisma.salesOrder.count({ where }),
        prisma.salesOrder.findMany({
          where,
          orderBy: { parkedAt: "desc" },
          skip,
          take,
          select: {
            id: true,
            parkToken: true,
            parkedAt: true,
            totalRounded: true,
            paidTotal: true,
            customer: { select: { id: true, name: true } }
          }
        })
      ]);

      const data = rows.map((r) => ({
        saleId: r.id,
        token: r.parkToken,
        customer: r.customer?.name || null,
        total: Number(r.totalRounded || 0),
        paid: Number(r.paidTotal || 0),
        remaining: Number(((Number(r.totalRounded || 0) - Number(r.paidTotal || 0))).toFixed(2)),
        parked_at: r.parkedAt
      }));

      return res.json({
        success: true,
        meta: { page: Number(page), limit: take, total: totalCount },
        data
      });
    } catch (error) {
      console.error("Error listando ventas estacionadas:", error);
      return res.status(500).json({ success: false, message: "Error interno listando ventas estacionadas" });
    }
  }
}

export default SalesController;

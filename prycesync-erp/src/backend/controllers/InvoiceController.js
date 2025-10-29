import prisma from '../config/database.js';
import { Decimal } from '@prisma/client/runtime/library.js';
import TaxService from '../services/TaxService.js';

class InvoiceController {
  // Crear nueva factura
  static async create(req, res) {
    try {
      const { customerId, type = 'B', items, notes, dueDate } = req.body;
      const companyId = req.user.company.id;

      // Validaciones básicas
      if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'customerId e items son requeridos'
        });
      }

      // Verificar que el cliente existe y pertenece a la empresa
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          companyId: companyId,
          deletedAt: null
        }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Generar número de factura secuencial único por compañía
      let nextNumber;
      let attempts = 0;
      const maxAttempts = 50;

      // Obtener el último número para esta compañía y tipo
      const lastInvoice = await prisma.invoice.findFirst({
        where: {
          companyId: companyId,
          type: type,
          deletedAt: null
        },
        orderBy: [
          { number: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      let baseNumber = 1;
      if (lastInvoice && lastInvoice.number) {
        // Extraer el número secuencial del formato "A-0001-00000002" o "00000001"
        const numberMatch = lastInvoice.number.match(/(\d+)$/);
        if (numberMatch) {
          baseNumber = parseInt(numberMatch[1]) + 1;
        }
      }

      // Buscar el próximo número disponible
      do {
        nextNumber = baseNumber.toString().padStart(8, '0');
        
        // Verificar que el número no existe ya para esta compañía
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            companyId: companyId,
            number: nextNumber,
            deletedAt: null
          }
        });

        if (!existingInvoice) {
          break; // Número único encontrado
        }

        baseNumber++;
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new Error('No se pudo generar un número de factura único después de varios intentos');
        }

      } while (attempts < maxAttempts);

      // Calcular totales de los items
      let subtotal = new Decimal(0);
      let taxAmount = new Decimal(0);
      const processedItems = [];

      for (const item of items) {
        const { articleId: rawArticleId, productId: rawProductId, description, quantity, unitPrice, discount = 0, taxRate } = item;
        const refId = rawArticleId ?? rawProductId ?? null;

        // Verificar que el artículo existe (compat productId)
        let article = null;
        if (refId) {
          article = await prisma.article.findFirst({
            where: { id: refId, companyId, deletedAt: null }
          });
          if (!article) {
            return res.status(404).json({ success: false, message: `Artículo con ID ${refId} no encontrado` });
          }
        }

        // Calcular montos del item
        const itemQuantity = new Decimal(quantity);
        const itemUnitPrice = new Decimal(unitPrice);
        const itemDiscountPct = new Decimal(discount);
        const effectiveTaxRate = new Decimal(
          taxRate != null ? taxRate : (article?.taxRate != null ? Number(article.taxRate) : 21)
        );

        const rawSubtotal = itemQuantity.mul(itemUnitPrice);
        const discountTotal = itemDiscountPct.gt(0) ? rawSubtotal.mul(itemDiscountPct.div(100)) : new Decimal(0);
        const itemSubtotal = rawSubtotal.sub(discountTotal);
        const itemTaxAmount = itemSubtotal.mul(effectiveTaxRate.div(100));
        const itemTotal = itemSubtotal.add(itemTaxAmount);

        processedItems.push({
          articleId: refId || null,
          description: description || (article ? article.name : null),
          quantity: itemQuantity,
          unitPrice: itemUnitPrice,
          discount: itemDiscountPct,
          taxRate: effectiveTaxRate,
          subtotal: itemSubtotal,
          taxAmount: itemTaxAmount,
          total: itemTotal,
          // Snapshots
          articleName: article?.name || null,
          sku: article?.sku || null,
          barcode: article?.barcode || null,
          uom: 'UN',
          uomFactor: new Decimal(1),
          qty: itemQuantity,
          qtyUn: itemQuantity,
          unitPriceNet: itemUnitPrice,
          unitPriceGross: itemUnitPrice.mul(new Decimal(1).add(effectiveTaxRate.div(100))),
          internalTaxType: article?.internalTaxType || null,
          internalTaxValue: article?.internalTaxValue != null ? new Decimal(article.internalTaxValue) : null,
          vatRate: effectiveTaxRate,
          discountType: itemDiscountPct.gt(0) ? 'PERCENT' : null,
          discountValue: itemDiscountPct,
          discountTotal: discountTotal,
          subtotalNet: itemSubtotal,
          taxTotal: itemTaxAmount,
          lineTotalGross: itemTotal
        });

        subtotal = subtotal.add(itemSubtotal);
        taxAmount = taxAmount.add(itemTaxAmount);
      }

      const total = subtotal.add(taxAmount);

      // Crear la factura con sus items en una transacción
      const invoice = await prisma.$transaction(async (tx) => {
        // Crear la factura
        const newInvoice = await tx.invoice.create({
          data: {
            number: nextNumber,
            type: type,
            status: 'draft',
            issueDate: new Date(),
            dueDate: dueDate ? new Date(dueDate) : null,
            subtotal: subtotal,
            taxAmount: taxAmount,
            total: total,
            notes: notes || null,
            companyId: companyId,
            customerId: customerId
          }
        });

        // Crear los items de la factura
        for (const item of processedItems) {
          await tx.invoiceItem.create({
            data: {
              invoiceId: newInvoice.id,
              articleId: item.articleId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxRate: item.taxRate,
              subtotal: item.subtotal,
              taxAmount: item.taxAmount,
              total: item.total,
              // Snapshots
              articleName: item.articleName,
              sku: item.sku,
              barcode: item.barcode,
              uom: item.uom,
              uomFactor: item.uomFactor,
              qty: item.qty,
              qtyUn: item.qtyUn,
              unitPriceNet: item.unitPriceNet,
              unitPriceGross: item.unitPriceGross,
              internalTaxType: item.internalTaxType,
              internalTaxValue: item.internalTaxValue,
              vatRate: item.vatRate,
              discountType: item.discountType ? 'PERCENT' : null,
              discountValue: item.discountValue,
              discountTotal: item.discountTotal,
              subtotalNet: item.subtotalNet,
              taxTotal: item.taxTotal,
              lineTotalGross: item.lineTotalGross
            }
          });
        }

        // Aplicar tributos (retenciones/percepciones) según reglas
        const provinceCode = customer?.state || req.user?.company?.state || 'BA'
        await TaxService.applyTaxesForInvoice(tx, {
          companyId,
          invoice: newInvoice,
          items: processedItems,
          provinceCode
        })

        return newInvoice;
      });

      // Obtener la factura completa con relaciones
      const completeInvoice = await prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              taxId: true,
              type: true
            }
          },
          items: {
            include: {
              article: { select: { id: true, name: true, sku: true, description: true, category: { select: { id: true, name: true } } } }
            }
          },
          company: { select: { id: true, name: true, taxId: true } },
          taxLines: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Factura creada exitosamente',
        data: completeInvoice
      });

    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Listar facturas con filtros y paginación
  static async list(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        type,
        customerId,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const companyId = req.user.company.id;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Construir filtros
      const where = {
        companyId: companyId,
        deletedAt: null,
        ...(status && { status }),
        ...(type && { type }),
        ...(customerId && { customerId }),
        ...(dateFrom || dateTo) && {
          issueDate: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) })
          }
        },
        ...(search && {
          OR: [
            { number: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
            { notes: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      // Obtener facturas y total
      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                taxId: true,
                type: true
              }
            },
            _count: {
              select: {
                items: true
              }
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip,
          take: parseInt(limit)
        }),
        prisma.invoice.count({ where })
      ]);

      // Calcular estadísticas
      const stats = await prisma.invoice.aggregate({
        where: {
          companyId: companyId,
          deletedAt: null
        },
        _sum: {
          total: true
        },
        _count: {
          _all: true
        }
      });

      const statusStats = await prisma.invoice.groupBy({
        by: ['status'],
        where: {
          companyId: companyId,
          deletedAt: null
        },
        _count: {
          status: true
        },
        _sum: {
          total: true
        }
      });

      res.json({
        success: true,
        data: {
          invoices,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          },
          stats: {
            totalInvoices: stats._count._all,
            totalAmount: stats._sum.total || 0,
            byStatus: statusStats.reduce((acc, stat) => {
              acc[stat.status] = {
                count: stat._count.status,
                amount: stat._sum.total || 0
              };
              return acc;
            }, {})
          }
        }
      });

    } catch (error) {
      console.error('Error listing invoices:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener factura por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const invoice = await prisma.invoice.findFirst({
        where: {
          id,
          companyId: companyId,
          deletedAt: null
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              taxId: true,
              type: true,
              address: true,
              city: true,
              state: true,
              country: true,
              zipCode: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  description: true,
                  category: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              taxId: true,
              address: true,
              city: true,
              state: true,
              country: true,
              zipCode: true,
              phone: true,
              email: true
            }
          },
          taxLines: true
        }
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      res.json({
        success: true,
        data: invoice
      });

    } catch (error) {
      console.error('Error getting invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Actualizar factura
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { type, customerId, dueDate, notes, items = [], status, paidDate } = req.body;
      const companyId = req.user.company.id;

      // Verificar que la factura existe y pertenece a la empresa
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          id,
          companyId: companyId,
          deletedAt: null
        },
        include: {
          items: true
        }
      });

      if (!existingInvoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      // No permitir modificar facturas pagadas o canceladas (excepto para cambios de estado)
      if ((existingInvoice.status === 'paid' || existingInvoice.status === 'cancelled') && 
          (type || customerId || items.length > 0)) {
        return res.status(400).json({
          success: false,
          message: 'No se puede modificar el contenido de una factura pagada o cancelada'
        });
      }

      // Si se están actualizando items, validar y procesar
      let processedItems = [];
      let subtotal = 0;
      let taxAmount = 0;
      let total = 0;

      if (items && items.length > 0) {
        for (const item of items) {
          if (!item.quantity || item.quantity <= 0) {
            return res.status(400).json({ success: false, message: 'La cantidad debe ser mayor a 0' });
          }
          if (item.unitPrice == null || item.unitPrice < 0) {
            return res.status(400).json({ success: false, message: 'El precio unitario debe ser mayor o igual a 0' });
          }

          const refId = item.articleId ?? item.productId ?? null;
          let article = null;
          if (refId) {
            article = await prisma.article.findFirst({ where: { id: refId, companyId, deletedAt: null } });
            if (!article) return res.status(404).json({ success: false, message: 'Artículo no encontrado: ' + refId });
            item.articleId = refId;
            if (!item.description) item.description = article.name;
          } else {
            if (!item.description) return res.status(400).json({ success: false, message: 'Descripción requerida cuando no hay articleId' });
          }

          const quantity = parseFloat(item.quantity);
          const unitPrice = parseFloat(item.unitPrice);
          const discount = parseFloat(item.discount || 0);
          const taxRate = parseFloat(item.taxRate != null ? item.taxRate : (article?.taxRate ?? 21));

          const itemSubtotalGross = quantity * unitPrice;
          const discountAmount = (itemSubtotalGross * discount) / 100;
          const itemSubtotalAfterDiscount = itemSubtotalGross - discountAmount;
          const itemTaxAmount = (itemSubtotalAfterDiscount * taxRate) / 100;
          const itemTotal = itemSubtotalAfterDiscount + itemTaxAmount;

          processedItems.push({
            articleId: item.articleId || null,
            quantity,
            unitPrice,
            discount,
            taxRate,
            subtotal: itemSubtotalAfterDiscount,
            taxAmount: itemTaxAmount,
            total: itemTotal,
            description: item.description || null,
            // Snapshots
            articleName: article?.name || null,
            sku: article?.sku || null,
            barcode: article?.barcode || null,
            uom: 'UN',
            uomFactor: new Decimal(1),
            qty: new Decimal(quantity),
            qtyUn: new Decimal(quantity),
            unitPriceNet: new Decimal(unitPrice),
            unitPriceGross: new Decimal(unitPrice * (1 + taxRate / 100)),
            internalTaxType: article?.internalTaxType || null,
            internalTaxValue: article?.internalTaxValue != null ? new Decimal(article.internalTaxValue) : null,
            vatRate: new Decimal(taxRate),
            discountType: discount > 0 ? 'PERCENT' : null,
            discountValue: new Decimal(discount),
            discountTotal: new Decimal(discountAmount),
            subtotalNet: new Decimal(itemSubtotalAfterDiscount),
            taxTotal: new Decimal(itemTaxAmount),
            lineTotalGross: new Decimal(itemTotal)
          });

          subtotal += itemSubtotalAfterDiscount;
          taxAmount += itemTaxAmount;
          total += itemTotal;
        }
      }

      // Actualizar usando transacción
      const updatedInvoice = await prisma.$transaction(async (tx) => {
        // Actualizar la factura principal
        const invoiceData = {};
        
        if (type) invoiceData.type = type;
        if (customerId) invoiceData.customerId = customerId;
        if (dueDate) invoiceData.dueDate = new Date(dueDate);
        if (notes !== undefined) invoiceData.notes = notes;
        if (status) invoiceData.status = status;
        if (paidDate) invoiceData.paidDate = new Date(paidDate);
        
        // Si hay items, actualizar totales
        if (processedItems.length > 0) {
          invoiceData.subtotal = subtotal;
          invoiceData.taxAmount = taxAmount;
          invoiceData.total = total;
        }

        const invoice = await tx.invoice.update({
          where: { id },
          data: invoiceData
        });

        // Si hay items, actualizar los items
        if (processedItems.length > 0) {
          // Eliminar items existentes
          await tx.invoiceItem.deleteMany({
            where: { invoiceId: id }
          });

          // Crear nuevos items
          for (const item of processedItems) {
            await tx.invoiceItem.create({
              data: {
                invoiceId: id,
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                taxRate: item.taxRate,
                subtotal: item.subtotal,
                taxAmount: item.taxAmount,
                total: item.total
              }
            });
          }
        }

        // Recalcular tributos si se actualizaron ítems
        if (processedItems.length > 0) {
          await tx.documentTaxLine.deleteMany({ where: { invoiceId: id } })
          const provinceCode = existingInvoice?.customerId
            ? (await tx.customer.findUnique({ where: { id: existingInvoice.customerId } }))?.state || req.user?.company?.state || 'BA'
            : req.user?.company?.state || 'BA'
          await TaxService.applyTaxesForInvoice(tx, {
            companyId,
            invoice: { id, issueDate: existingInvoice.issueDate, subtotal: new Decimal(subtotal) },
            items: processedItems,
            provinceCode
          })
        }

        return invoice;
      });

      // Obtener la factura completa actualizada
      const completeInvoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true, taxId: true, type: true, address: true, city: true, state: true, country: true, zipCode: true } },
          items: {
            include: {
              article: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  description: true,
                  category: { select: { id: true, name: true } }
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          company: { select: { id: true, name: true, taxId: true, address: true, city: true, state: true, country: true, zipCode: true, phone: true, email: true } },
          taxLines: true
        }
      });

      res.json({
        success: true,
        message: 'Factura actualizada exitosamente',
        data: completeInvoice
      });

    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Eliminar factura (soft delete)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      // Verificar que la factura existe y pertenece a la empresa
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          id,
          companyId: companyId,
          deletedAt: null
        }
      });

      if (!existingInvoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      // No permitir eliminar facturas pagadas
      if (existingInvoice.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar una factura pagada'
        });
      }

      // Soft delete + reversión de tributos en transacción
      await prisma.$transaction(async (tx) => {
        await tx.invoice.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            status: 'cancelled'
          }
        })

        await TaxService.revertTaxesForDocument(tx, {
          companyId,
          docId: id,
          docType: 'INVOICE'
        })
      })

      res.json({
        success: true,
        message: 'Factura eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error deleting invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Duplicar factura
  static async duplicate(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      // Obtener la factura original con sus items
      const originalInvoice = await prisma.invoice.findFirst({
        where: {
          id,
          companyId: companyId,
          deletedAt: null
        },
        include: {
          items: true
        }
      });

      if (!originalInvoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      // Generar nuevo número único
      let nextNumber;
      let attempts = 0;
      const maxAttempts = 50;

      // Obtener el último número para esta compañía y tipo
      const lastInvoice = await prisma.invoice.findFirst({
        where: {
          companyId: companyId,
          type: originalInvoice.type,
          deletedAt: null
        },
        orderBy: [
          { number: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      let baseNumber = 1;
      if (lastInvoice && lastInvoice.number) {
        // Extraer el número secuencial del formato "A-0001-00000002" o "00000001"
        const numberMatch = lastInvoice.number.match(/(\d+)$/);
        if (numberMatch) {
          baseNumber = parseInt(numberMatch[1]) + 1;
        }
      }

      // Buscar el próximo número disponible
      do {
        nextNumber = baseNumber.toString().padStart(8, '0');
        
        // Verificar que el número no existe ya para esta compañía
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            companyId: companyId,
            number: nextNumber,
            deletedAt: null
          }
        });

        if (!existingInvoice) {
          break; // Número único encontrado
        }

        baseNumber++;
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new Error('No se pudo generar un número de factura único para duplicar');
        }

      } while (attempts < maxAttempts);

      // Duplicar la factura
      const duplicatedInvoice = await prisma.$transaction(async (tx) => {
        // Crear nueva factura
        const newInvoice = await tx.invoice.create({
          data: {
            number: nextNumber,
            type: originalInvoice.type,
            status: 'draft',
            issueDate: new Date(),
            dueDate: null,
            paidDate: null,
            subtotal: originalInvoice.subtotal,
            taxAmount: originalInvoice.taxAmount,
            total: originalInvoice.total,
            notes: `Duplicado de factura ${originalInvoice.number}`,
            companyId: companyId,
            customerId: originalInvoice.customerId
          }
        });

        // Duplicar items
        for (const item of originalInvoice.items) {
          const articleId = item.articleId ?? item.productId ?? null;
          let taxRate = Number(item.taxRate ?? 21);
          const unitPrice = Number(item.unitPrice);
          const quantity = Number(item.quantity);
          const discount = Number(item.discount || 0);
          const gross = quantity * unitPrice;
          const discountTotal = (gross * discount) / 100;
          const net = gross - discountTotal;
          const taxAmount = (net * taxRate) / 100;
          const total = net + taxAmount;

          await tx.invoiceItem.create({
            data: {
              invoiceId: newInvoice.id,
              articleId: articleId,
              quantity: quantity,
              unitPrice: unitPrice,
              discount: discount,
              taxRate: taxRate,
              subtotal: net,
              taxAmount: taxAmount,
              total: total,
              // Snapshots
              uom: 'UN',
              uomFactor: new Decimal(1),
              qty: new Decimal(quantity),
              qtyUn: new Decimal(quantity),
              unitPriceNet: new Decimal(unitPrice),
              unitPriceGross: new Decimal(unitPrice * (1 + taxRate / 100)),
              vatRate: new Decimal(taxRate),
              discountType: discount > 0 ? 'PERCENT' : null,
              discountValue: new Decimal(discount),
              discountTotal: new Decimal(discountTotal),
              subtotalNet: new Decimal(net),
              taxTotal: new Decimal(taxAmount),
              lineTotalGross: new Decimal(total)
            }
          });
        }

        return newInvoice;
      });

      // Obtener la factura completa
      const completeInvoice = await prisma.invoice.findUnique({
        where: { id: duplicatedInvoice.id },
        include: {
          customer: { select: { id: true, name: true, email: true, taxId: true, type: true } },
          items: { include: { article: { select: { id: true, name: true, sku: true, description: true } } } }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Factura duplicada exitosamente',
        data: completeInvoice
      });

    } catch (error) {
      console.error('Error duplicating invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener reportes de facturación
  static async getReports(req, res) {
    try {
      const {
        period = 'month',
        dateFrom,
        dateTo,
        customerId,
        type,
        status
      } = req.query;

      const companyId = req.user.company.id;

      // Calcular fechas según el período
      let startDate, endDate;
      const now = new Date();

      if (dateFrom && dateTo) {
        startDate = new Date(dateFrom);
        endDate = new Date(dateTo);
      } else {
        switch (period) {
          case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case 'week':
            const weekStart = now.getDate() - now.getDay();
            startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
            endDate = new Date(now.getFullYear(), now.getMonth(), weekStart + 7);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
          case 'quarter':
            const quarterStart = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterStart, 1);
            endDate = new Date(now.getFullYear(), quarterStart + 3, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
      }

      // Construir filtros base
      const baseWhere = {
        companyId: companyId,
        deletedAt: null,
        issueDate: {
          gte: startDate,
          lt: endDate
        },
        ...(customerId && { customerId }),
        ...(type && { type }),
        ...(status && { status })
      };

      // Obtener estadísticas generales
      const generalStats = await prisma.invoice.aggregate({
        where: baseWhere,
        _count: {
          _all: true
        },
        _sum: {
          total: true,
          subtotal: true,
          taxAmount: true
        },
        _avg: {
          total: true
        }
      });

      // Estadísticas por estado
      const statusStats = await prisma.invoice.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: {
          status: true
        },
        _sum: {
          total: true
        }
      });

      // Estadísticas por tipo
      const typeStats = await prisma.invoice.groupBy({
        by: ['type'],
        where: baseWhere,
        _count: {
          type: true
        },
        _sum: {
          total: true
        }
      });

      // Top clientes
      const topCustomers = await prisma.invoice.groupBy({
        by: ['customerId'],
        where: baseWhere,
        _count: {
          customerId: true
        },
        _sum: {
          total: true
        },
        orderBy: {
          _sum: {
            total: 'desc'
          }
        },
        take: 10
      });

      // Obtener información de los clientes
      const customerIds = topCustomers.map(tc => tc.customerId);
      const customers = await prisma.customer.findMany({
        where: {
          id: { in: customerIds },
          companyId: companyId
        },
        select: {
          id: true,
          name: true,
          email: true,
          taxId: true
        }
      });

      const topCustomersWithInfo = topCustomers.map(tc => {
        const customer = customers.find(c => c.id === tc.customerId);
        return {
          customer,
          invoiceCount: tc._count.customerId,
          totalAmount: tc._sum.total || 0
        };
      });

      // Evolución temporal (últimos 12 períodos)
      const timeSeriesData = [];
      for (let i = 11; i >= 0; i--) {
        let periodStart, periodEnd, periodLabel;
        
        switch (period) {
          case 'day':
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
            periodLabel = periodStart.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + i * 7));
            periodStart = weekStartDate;
            periodEnd = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            periodLabel = `Semana ${weekStartDate.toISOString().split('T')[0]}`;
            break;
          case 'month':
            periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            periodLabel = periodStart.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
            break;
          case 'quarter':
            const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3 - i * 3;
            periodStart = new Date(now.getFullYear(), quarterStartMonth, 1);
            periodEnd = new Date(now.getFullYear(), quarterStartMonth + 3, 1);
            periodLabel = `Q${Math.floor(quarterStartMonth / 3) + 1} ${periodStart.getFullYear()}`;
            break;
          case 'year':
            periodStart = new Date(now.getFullYear() - i, 0, 1);
            periodEnd = new Date(now.getFullYear() - i + 1, 0, 1);
            periodLabel = periodStart.getFullYear().toString();
            break;
          default:
            periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            periodLabel = periodStart.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        }

        const periodStats = await prisma.invoice.aggregate({
          where: {
            ...baseWhere,
            issueDate: {
              gte: periodStart,
              lt: periodEnd
            }
          },
          _count: {
            _all: true
          },
          _sum: {
            total: true
          }
        });

        timeSeriesData.push({
          period: periodLabel,
          invoiceCount: periodStats._count._all,
          totalAmount: periodStats._sum.total || 0
        });
      }

      // Facturas vencidas
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          companyId: companyId,
          deletedAt: null,
          status: { in: ['sent', 'overdue'] },
          dueDate: {
            lt: new Date()
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          dueDate: 'asc'
        },
        take: 20
      });

      // Próximos vencimientos (próximos 30 días)
      const upcomingDue = await prisma.invoice.findMany({
        where: {
          companyId: companyId,
          deletedAt: null,
          status: { in: ['sent'] },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          dueDate: 'asc'
        },
        take: 20
      });

      res.json({
        success: true,
        data: {
          period: {
            type: period,
            startDate,
            endDate
          },
          summary: {
            totalInvoices: generalStats._count._all,
            totalAmount: generalStats._sum.total || 0,
            totalSubtotal: generalStats._sum.subtotal || 0,
            totalTaxAmount: generalStats._sum.taxAmount || 0,
            averageAmount: generalStats._avg.total || 0
          },
          byStatus: statusStats.reduce((acc, stat) => {
            acc[stat.status] = {
              count: stat._count.status,
              amount: stat._sum.total || 0
            };
            return acc;
          }, {}),
          byType: typeStats.reduce((acc, stat) => {
            acc[stat.type] = {
              count: stat._count.type,
              amount: stat._sum.total || 0
            };
            return acc;
          }, {}),
          topCustomers: topCustomersWithInfo,
          timeSeries: timeSeriesData,
          overdueInvoices: {
            count: overdueInvoices.length,
            invoices: overdueInvoices
          },
          upcomingDue: {
            count: upcomingDue.length,
            invoices: upcomingDue
          }
        }
      });

    } catch (error) {
      console.error('Error getting invoice reports:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default InvoiceController;
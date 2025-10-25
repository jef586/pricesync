import prisma from '../config/database.js';
import { getCompanyPricing, computeSalePrice, directPricing, inversePricing } from '../services/PricingService.js'
import StockService from '../services/StockService.js'

class ArticleController {
  // Buscar artículos
  static async searchArticles(req, res) {
    try {
      const { q: query, limit = 10 } = req.query;
      const companyId = req.user.company.id;

      if (!query || query.length < 2) {
        return res.json([]);
      }

      const articles = await prisma.article.findMany({
        where: {
          companyId,
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { barcode: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { barcodes: { some: { code: { contains: query, mode: 'insensitive' } } } }
          ]
        },
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          pricePublic: true,
          stock: true,
          active: true,
          type: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      });

      res.json(articles);
    } catch (error) {
      console.error('Error searching articles:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron buscar los artículos'
      });
    }
  }

  // Obtener artículos con filtros y paginación
  static async getArticles(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        type,
        active,
        categoryId,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        supplierSku
      } = req.query;

      const companyId = req.user.company.id;
      const skip = (page - 1) * limit;

      const where = {
        companyId,
        deletedAt: null,
        ...(active !== undefined && active !== '' ? { active: active === 'true' } : {}),
        ...(type && { type }),
        ...(categoryId && { categoryId }),
        ...(supplierSku && { suppliers: { some: { supplierSku: { contains: supplierSku, mode: 'insensitive' } } } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { barcodes: { some: { code: { contains: search, mode: 'insensitive' } } } },
            { suppliers: { some: { supplierSku: { contains: search, mode: 'insensitive' } } } }
          ]
        })
      };

      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          select: {
            id: true,
            sku: true,
            name: true,
            description: true,
            type: true,
            active: true,
            cost: true,
            pricePublic: true,
            stock: true,
            stockMin: true,
            stockMax: true,
            controlStock: true,
            taxRate: true,
            categoryId: true,
            category: { select: { id: true, name: true } },
            createdAt: true,
            updatedAt: true,
            _count: { select: { barcodes: true } }
          },
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.article.count({ where })
      ]);

      res.json({
        success: true,
        data: articles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los artículos'
      });
    }
  }

  // Obtener artículo por ID (incluye subrecursos)
  static async getArticleById(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const article = await prisma.article.findFirst({
        where: { id, companyId, deletedAt: null },
        include: {
          category: { select: { id: true, name: true, description: true } },
          barcodes: true,
          suppliers: { include: { supplier: { select: { id: true, code: true, name: true } } } },
          uoms: true,
          wholesaleTiers: true,
          bundleComponents: true
        }
      });

      if (!article) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Artículo no encontrado' });
      }

      res.json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ error: 'SERVER_ERROR', message: 'No se pudo obtener el artículo' });
    }
  }

  // Crear artículo
  static async createArticle(req, res) {
    try {
      const {
        name,
        description,
        type = 'PRODUCT',
        active = true,
        sku,
        barcode,
        barcodeType,
        taxRate = 21,
        cost,
        gainPct,
        pricePublic,
        stock = 0,
        stockMin,
        stockMax,
        controlStock,
        categoryId,
        supplierId,
        internalTaxType,
        internalTaxValue,
        subjectIIBB,
        subjectGanancias,
        subjectPercIVA,
        pointsPerUnit,
        imageUrl
      } = req.body;

      const companyId = req.user.company.id;

      if (!name) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Nombre es requerido' });
      }

      if (cost == null) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Cost es requerido' });
      }
      if (parseFloat(cost) < 0) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Cost debe ser >= 0' });
      }
      if (pricePublic != null && parseFloat(pricePublic) < 0) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'pricePublic debe ser >= 0' });
      }
      if (stockMax != null && stockMin != null && parseInt(stockMax) < parseInt(stockMin)) {
        return res.status(409).json({ error: 'CONFLICT', message: 'stockMax debe ser >= stockMin' });
      }

      // Validar categoría si se envía
      if (categoryId) {
        const category = await prisma.category.findFirst({ where: { id: categoryId, companyId, deletedAt: null } });
        if (!category) {
          return res.status(404).json({ error: 'NOT_FOUND', message: 'Categoría no encontrada' });
        }
      }

      // Pricing: directo o inverso
      let finalGainPct = gainPct != null ? parseFloat(gainPct) : 0
      let finalPricePublic
      if (pricePublic != null) {
        const inv = inversePricing({ pricePublic, cost, taxRate, internalTaxType, internalTaxValue })
        finalGainPct = inv.gainPct
        finalPricePublic = inv.pricePublic
      } else {
        const dir = directPricing({ cost, gainPct: finalGainPct, taxRate, internalTaxType, internalTaxValue })
        finalPricePublic = dir.pricePublic
      }

      // Generar SKU si no se envía o está vacío
      const rawSku = sku?.toString().trim()
      const finalSku = rawSku && rawSku.length > 0
        ? rawSku
        : `SKU-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`

      const article = await prisma.article.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          type,
          active: !!active,
          sku: finalSku,
          barcode: barcode?.trim() || null,
          barcodeType: barcodeType || null,
          taxRate: parseFloat(taxRate) || 21,
          cost: parseFloat(cost),
          gainPct: finalGainPct,
          pricePublic: finalPricePublic,
          stock: parseInt(stock) || 0,
          stockMin: stockMin != null ? parseInt(stockMin) : null,
          stockMax: stockMax != null ? parseInt(stockMax) : null,
          controlStock: !!controlStock,
          categoryId: categoryId || null,
          companyId,
          internalTaxType: internalTaxType || null,
          internalTaxValue: internalTaxValue != null ? parseFloat(internalTaxValue) : null,
          subjectIIBB: !!subjectIIBB,
          subjectGanancias: !!subjectGanancias,
          subjectPercIVA: !!subjectPercIVA,
          pointsPerUnit: pointsPerUnit != null ? parseInt(pointsPerUnit) : null,
          imageUrl: imageUrl || null
        },
        include: { category: { select: { id: true, name: true } } }
      })

      res.status(201).json(article)
    } catch (error) {
      console.error('Error creating article:', error)
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'CONFLICT', message: 'SKU o código de barras duplicado' })
      }
      res.status(500).json({ error: 'SERVER_ERROR', message: 'No se pudo crear el artículo' })
    }
  }

  // Actualizar artículo
  static async updateArticle(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        type,
        active,
        sku,
        barcode,
        barcodeType,
        taxRate,
        cost,
        gainPct,
        pricePublic,
        stock,
        stockMin,
        stockMax,
        controlStock,
        categoryId,
        supplierId,
        internalTaxType,
        internalTaxValue,
        subjectIIBB,
        subjectGanancias,
        subjectPercIVA,
        pointsPerUnit,
        imageUrl
      } = req.body;

      const companyId = req.user.company.id;

      const existing = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null } });
      if (!existing) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Artículo no encontrado' });
      }

      if (categoryId) {
        const category = await prisma.category.findFirst({ where: { id: categoryId, companyId, deletedAt: null } });
        if (!category) {
          return res.status(404).json({ error: 'NOT_FOUND', message: 'Categoría no encontrada' });
        }
      }

      if (cost != null && parseFloat(cost) < 0) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Cost debe ser >= 0' });
      }
      if (pricePublic != null && parseFloat(pricePublic) < 0) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'pricePublic debe ser >= 0' });
      }
      if (stockMax != null && stockMin != null && parseInt(stockMax) < parseInt(stockMin)) {
        return res.status(409).json({ error: 'CONFLICT', message: 'stockMax debe ser >= stockMin' });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (type !== undefined) updateData.type = type;
      if (active !== undefined) updateData.active = !!active;
      if (sku !== undefined) updateData.sku = sku?.trim() || existing.sku
      if (barcode !== undefined) updateData.barcode = barcode?.trim() || null;
      if (barcodeType !== undefined) updateData.barcodeType = barcodeType || null;
      if (taxRate !== undefined) updateData.taxRate = parseFloat(taxRate) || existing.taxRate || 21;
      if (cost !== undefined) updateData.cost = cost != null ? parseFloat(cost) : existing.cost;
      if (gainPct !== undefined) updateData.gainPct = gainPct != null ? parseFloat(gainPct) : existing.gainPct;
      if (stock !== undefined) updateData.stock = parseInt(stock) || 0;
      if (stockMin !== undefined) updateData.stockMin = stockMin != null ? parseInt(stockMin) : null;
      if (stockMax !== undefined) updateData.stockMax = stockMax != null ? parseInt(stockMax) : null;
      if (controlStock !== undefined) updateData.controlStock = !!controlStock;
      if (categoryId !== undefined) updateData.categoryId = categoryId || null;
      if (internalTaxType !== undefined) updateData.internalTaxType = internalTaxType || null;
      if (internalTaxValue !== undefined) updateData.internalTaxValue = internalTaxValue != null ? parseFloat(internalTaxValue) : null;
      if (subjectIIBB !== undefined) updateData.subjectIIBB = !!subjectIIBB;
      if (subjectGanancias !== undefined) updateData.subjectGanancias = !!subjectGanancias;
      if (subjectPercIVA !== undefined) updateData.subjectPercIVA = !!subjectPercIVA;
      if (pointsPerUnit !== undefined) updateData.pointsPerUnit = pointsPerUnit != null ? parseInt(pointsPerUnit) : null;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

      // Pricing directo/inverso en update
      if (pricePublic !== undefined) {
        // Inverso si viene pricePublic
        const inv = inversePricing({ pricePublic, cost: updateData.cost ?? existing.cost ?? 0, taxRate: updateData.taxRate ?? existing.taxRate, internalTaxType: updateData.internalTaxType ?? existing.internalTaxType, internalTaxValue: updateData.internalTaxValue ?? existing.internalTaxValue })
        updateData.gainPct = inv.gainPct
        updateData.pricePublic = inv.pricePublic
      } else if (updateData.cost !== undefined || updateData.gainPct !== undefined || updateData.taxRate !== undefined || updateData.internalTaxType !== undefined || updateData.internalTaxValue !== undefined) {
        // Directo si cambian parámetros relevantes
        const dir = directPricing({ cost: updateData.cost ?? existing.cost ?? 0, gainPct: updateData.gainPct ?? existing.gainPct ?? 0, taxRate: updateData.taxRate ?? existing.taxRate, internalTaxType: updateData.internalTaxType ?? existing.internalTaxType, internalTaxValue: updateData.internalTaxValue ?? existing.internalTaxValue })
        updateData.pricePublic = dir.pricePublic
      }

      const article = await prisma.article.update({
        where: { id },
        data: updateData,
        include: { category: { select: { id: true, name: true } } }
      });

      res.json(article);
    } catch (error) {
      console.error('Error updating article:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'CONFLICT', message: 'SKU o código de barras duplicado' });
      }
      res.status(500).json({ error: 'SERVER_ERROR', message: 'No se pudo actualizar el artículo' });
    }
  }

  // Eliminar artículo (soft delete)
  static async deleteArticle(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const article = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null } });
      if (!article) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      // Verificar uso en facturas
      const invoiceItems = await prisma.invoiceItem.findFirst({
        where: {
          articleId: id,
          invoice: { companyId, deletedAt: null }
        }
      });

      if (invoiceItems) {
        return res.status(400).json({ success: false, message: 'No se puede eliminar el artículo porque está siendo usado en facturas' });
      }

      await prisma.article.update({ where: { id }, data: { deletedAt: new Date(), active: false } });

      res.json({ success: true, message: 'Artículo eliminado exitosamente' });
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({ error: 'Error interno del servidor', message: 'No se pudo eliminar el artículo' });
    }
  }

  // Actualizar stock del artículo
  static async updateStock(req, res) {
    try {
      const { id } = req.params;
      const {
        stock,
        operation = 'set', // 'set', 'add', 'subtract'
        quantity,
        type,
        reason,
        uom = 'UN',
        warehouseId = null,
        override = false
      } = req.body || {}

      const companyId = req.user.company.id;
      const createdBy = req.user?.id || 'system'

      const inputQtyRaw = stock ?? quantity
      if (inputQtyRaw === undefined || inputQtyRaw === null) {
        return res.status(400).json({ success: false, message: 'Stock o cantidad es requerido' })
      }

      const article = await prisma.article.findFirst({
        where: { id, companyId, deletedAt: null },
        select: { id: true, name: true, stock: true, type: true, categoryId: true }
      })
      if (!article) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' })
      }
      if (article.type === 'SERVICE') {
        return res.status(400).json({ success: false, message: 'Los servicios no manejan stock' })
      }

      const op = (operation || type || 'set').toString()
      const inputQty = parseFloat(inputQtyRaw)
      if (!Number.isFinite(inputQty) || inputQty < 0) {
        return res.status(400).json({ success: false, message: 'Cantidad inválida' })
      }

      // Determinar delta y movimiento
      let delta = 0
      if (op === 'add') {
        delta = inputQty
      } else if (op === 'subtract') {
        delta = -inputQty
      } else {
        // set
        const newStock = parseFloat(inputQty)
        if (newStock < 0) {
          return res.status(400).json({ success: false, message: 'El stock no puede ser negativo' })
        }
        delta = newStock - parseFloat(article.stock || 0)
      }

      if (delta === 0) {
        // Sin cambios
        const fresh = await prisma.article.findFirst({ where: { id, companyId }, include: { category: { select: { id: true, name: true } } } })
        return res.json({ success: true, message: 'Sin cambios en stock', data: fresh })
      }

      const direction = delta > 0 ? 'IN' : 'OUT'
      const absQty = Math.abs(delta)
      // Motivo por defecto si no se envía: ajuste manual
      let finalReason = reason
      if (!finalReason) {
        finalReason = direction === 'IN' ? 'ADJUST_IN' : 'ADJUST_OUT'
      }

      // Si el entorno de pruebas no tiene tablas de stock o $transaction, hacer fallback directo
      const canStockMove = typeof prisma.$transaction === 'function' && prisma.stockMovement && prisma.stockBalance

      if (canStockMove) {
        try {
          await prisma.$transaction(async (tx) => {
            await StockService.createMovement(tx, {
              companyId,
              articleId: id,
              warehouseId,
              uom,
              qty: absQty,
              direction,
              reason: finalReason,
              documentId: null,
              documentType: null,
              comment: `Manual stock ${op}`,
              override: !!override,
              clientOperationId: null,
              createdBy
            })
          })
        } catch (err) {
          const code = err?.httpCode || 500
          const msg = err?.message || 'Error de stock'
          return res.status(code).json({ success: false, message: msg })
        }
      } else {
        // Fallback: actualizar stock directamente (modo legacy)
        const current = Number(article.stock || 0)
        const resultStock = current + delta
        if (resultStock < 0 && !override) {
          return res.status(409).json({ success: false, message: 'Stock insuficiente' })
        }
        await prisma.article.update({ where: { id }, data: { stock: resultStock } })
      }

      const updated = await prisma.article.findFirst({
        where: { id, companyId },
        include: { category: { select: { id: true, name: true } } }
      })

      res.json({ success: true, message: 'Stock actualizado exitosamente', data: updated })
    } catch (error) {
      console.error('Error updating stock:', error)
      res.status(500).json({ error: 'Error interno del servidor', message: 'No se pudo actualizar el stock' })
    }
  }

  // --- Subrecursos: Barcodes ---
  static async getBarcodes(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const exists = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      const barcodes = await prisma.articleBarcode.findMany({ where: { articleId: id }, orderBy: { createdAt: 'desc' } });
      res.json({ success: true, data: barcodes });
    } catch (error) {
      console.error('Error getting barcodes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async addBarcode(req, res) {
    try {
      const { id } = req.params;
      const { code, type = 'EAN13' } = req.body;
      const companyId = req.user.company.id;

      if (!code) {
        return res.status(400).json({ success: false, message: 'Código de barras es requerido' });
      }

      const exists = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      try {
        const barcode = await prisma.articleBarcode.create({ data: { articleId: id, code: code.trim(), type } });
        res.status(201).json({ success: true, message: 'Código de barras agregado', data: barcode });
      } catch (error) {
        if (error.code === 'P2002') {
          return res.status(400).json({ success: false, message: 'El código de barras ya existe' });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error adding barcode:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async deleteBarcode(req, res) {
    try {
      const { id, barcodeId } = req.params;
      const companyId = req.user.company.id;

      const exists = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      await prisma.articleBarcode.delete({ where: { id: barcodeId } });
      res.json({ success: true, message: 'Código de barras eliminado' });
    } catch (error) {
      console.error('Error deleting barcode:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // --- Subrecursos: Suppliers ---
  static async getSuppliers(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const exists = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      const links = await prisma.articleSupplier.findMany({
        where: { articleId: id },
        include: { supplier: { select: { id: true, code: true, name: true } } },
        orderBy: { isPrimary: 'desc' }
      });
      res.json({ success: true, data: links });
    } catch (error) {
      console.error('Error getting article suppliers:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async addSupplierLink(req, res) {
    try {
      const { id } = req.params;
      const { supplierId, supplierSku, isPrimary = false } = req.body;
      const companyId = req.user.company.id;

      if (!supplierId) {
        return res.status(400).json({ success: false, message: 'supplierId es requerido' });
      }

      const article = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null } });
      if (!article) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, companyId, deletedAt: null } });
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
      }

      try {
        const link = await prisma.articleSupplier.create({
          data: {
            articleId: id,
            supplierId,
            isPrimary: !!isPrimary,
            supplierSku: supplierSku?.trim() || `${article.sku || article.name}`
          },
          include: { supplier: { select: { id: true, code: true, name: true } } }
        });
        res.status(201).json({ success: true, message: 'Proveedor vinculado al artículo', data: link });
      } catch (error) {
        if (error.code === 'P2002') {
          return res.status(400).json({ success: false, message: 'Este proveedor ya está vinculado al artículo o supplierSku duplicado' });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error linking supplier:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async deleteSupplierLink(req, res) {
    try {
      const { id, linkId } = req.params;
      const companyId = req.user.company.id;

      const article = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null } });
      if (!article) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      await prisma.articleSupplier.delete({ where: { id: linkId } });
      res.json({ success: true, message: 'Proveedor desvinculado del artículo' });
    } catch (error) {
      console.error('Error unlinking supplier:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // --- NUEVO: Actualizar vínculo con proveedor ---
  static async updateSupplierLink(req, res) {
    try {
      const { id, linkId } = req.params;
      const { supplierSku, isPrimary } = req.body || {};
      const companyId = req.user.company.id;

      const article = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null } });
      if (!article) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      const link = await prisma.articleSupplier.findFirst({ where: { id: linkId, articleId: id }, include: { supplier: true } });
      if (!link) {
        return res.status(404).json({ success: false, message: 'Vínculo no encontrado' });
      }

      // Preparar datos de actualización
      const data = {};
      if (supplierSku !== undefined) data.supplierSku = supplierSku?.toString().trim();
      if (isPrimary !== undefined) data.isPrimary = !!isPrimary;

      try {
        const result = await prisma.$transaction(async (tx) => {
          // Si se establece como primario, desmarcar otros
          if (data.isPrimary === true) {
            await tx.articleSupplier.updateMany({
              where: { articleId: id, id: { not: linkId } },
              data: { isPrimary: false }
            })
          }
          const updated = await tx.articleSupplier.update({
            where: { id: linkId },
            data,
            include: { supplier: { select: { id: true, code: true, name: true } } }
          })
          return updated
        })

        return res.json({ success: true, message: 'Vínculo actualizado', data: result })
      } catch (error) {
        if (error?.code === 'P2002') {
          return res.status(409).json({ success: false, message: 'supplierSku duplicado para este proveedor' })
        }
        throw error
      }
    } catch (error) {
      console.error('Error updating supplier link:', error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  }

  // --- NUEVO: Resolver artículo ---
  static async resolveArticle(req, res) {
    try {
      const { barcode, sku, supplierId, supplierSku } = req.query || {};
      const companyId = req.user.company.id;

      const articleSelect = {
        id: true,
        sku: true,
        name: true,
        description: true,
        type: true,
        active: true,
        cost: true,
        pricePublic: true,
        stock: true,
        taxRate: true,
        category: { select: { id: true, name: true } }
      }

      // 1) Por barcode exacto (campo principal o tabla secundaria)
      if (barcode) {
        const byBarcode = await prisma.article.findFirst({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { barcode: barcode.toString().trim() },
              { barcodes: { some: { code: barcode.toString().trim() } } }
            ]
          },
          select: articleSelect
        })
        if (byBarcode) {
          return res.json({ success: true, data: byBarcode })
        }
      }

      // 2) Por SKU/código
      if (sku) {
        const bySku = await prisma.article.findFirst({
          where: { companyId, deletedAt: null, sku: sku.toString().trim() },
          select: articleSelect
        })
        if (bySku) {
          return res.json({ success: true, data: bySku })
        }
      }

      // 3) Por equivalencia de proveedor (estricto supplierId + supplierSku)
      if (supplierId && supplierSku) {
        const bySupplier = await prisma.articleSupplier.findFirst({
          where: {
            supplierId: supplierId.toString().trim(),
            supplierSku: supplierSku.toString().trim(),
            article: { companyId, deletedAt: null }
          },
          include: {
            article: { select: articleSelect }
          }
        })
        if (bySupplier?.article) {
          return res.json({ success: true, data: bySupplier.article })
        }
      }

      return res.status(404).json({ success: false, message: 'Artículo no encontrado' })
    } catch (error) {
      console.error('Error resolving article:', error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
}

export default ArticleController;
import prisma from '../config/database.js';
import { getCompanyPricing, computeSalePrice } from '../services/PricingService.js'

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
        sortOrder = 'desc'
      } = req.query;

      const companyId = req.user.company.id;
      const skip = (page - 1) * limit;

      const where = {
        companyId,
        deletedAt: null,
        ...(active !== undefined && active !== '' ? { active: active === 'true' } : {}),
        ...(type && { type }),
        ...(categoryId && { categoryId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { barcodes: { some: { code: { contains: search, mode: 'insensitive' } } } }
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
            taxRate: true,
            categoryId: true,
            category: { select: { id: true, name: true } },
            createdAt: true,
            updatedAt: true
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
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      res.json({ success: true, data: article });
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ error: 'Error interno del servidor', message: 'No se pudo obtener el artículo' });
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
        return res.status(400).json({ success: false, message: 'Nombre es requerido' });
      }

      // Validar categoría si se envía
      if (categoryId) {
        const category = await prisma.category.findFirst({ where: { id: categoryId, companyId, deletedAt: null } });
        if (!category) {
          return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        }
      }

      // Determinar precio público
      let finalPricePublic = pricePublic !== undefined && pricePublic !== null ? parseFloat(pricePublic) : null;
      try {
        if (finalPricePublic == null) {
          const pricing = await getCompanyPricing(companyId);
          const sale = computeSalePrice({
            costPrice: cost != null ? parseFloat(cost) : 0,
            listPrice: null,
            pricing,
            supplierId: supplierId ?? null
          });
          finalPricePublic = sale;
        }
      } catch (e) {
        console.warn('Pricing warning (createArticle):', e?.message || e);
      }

      const article = await prisma.article.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          type,
          active: !!active,
          sku: sku?.trim() || null,
          barcode: barcode?.trim() || null,
          barcodeType: barcodeType || null,
          taxRate: parseFloat(taxRate) || 21,
          cost: cost != null ? parseFloat(cost) : null,
          gainPct: gainPct != null ? parseFloat(gainPct) : null,
          pricePublic: finalPricePublic,
          stock: parseInt(stock) || 0,
          stockMin: stockMin != null ? parseInt(stockMin) : null,
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
      });

      res.status(201).json({ success: true, message: 'Artículo creado exitosamente', data: article });
    } catch (error) {
      console.error('Error creating article:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ success: false, message: 'SKU o código de barras duplicado' });
      }
      res.status(500).json({ error: 'Error interno del servidor', message: 'No se pudo crear el artículo' });
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
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      if (categoryId) {
        const category = await prisma.category.findFirst({ where: { id: categoryId, companyId, deletedAt: null } });
        if (!category) {
          return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        }
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (type !== undefined) updateData.type = type;
      if (active !== undefined) updateData.active = !!active;
      if (sku !== undefined) updateData.sku = sku?.trim() || null;
      if (barcode !== undefined) updateData.barcode = barcode?.trim() || null;
      if (barcodeType !== undefined) updateData.barcodeType = barcodeType || null;
      if (taxRate !== undefined) updateData.taxRate = parseFloat(taxRate) || 21;
      if (cost !== undefined) updateData.cost = cost != null ? parseFloat(cost) : null;
      if (gainPct !== undefined) updateData.gainPct = gainPct != null ? parseFloat(gainPct) : null;
      if (pricePublic !== undefined) updateData.pricePublic = parseFloat(pricePublic);
      if (stock !== undefined) updateData.stock = parseInt(stock) || 0;
      if (stockMin !== undefined) updateData.stockMin = stockMin != null ? parseInt(stockMin) : null;
      if (categoryId !== undefined) updateData.categoryId = categoryId || null;
      if (internalTaxType !== undefined) updateData.internalTaxType = internalTaxType || null;
      if (internalTaxValue !== undefined) updateData.internalTaxValue = internalTaxValue != null ? parseFloat(internalTaxValue) : null;
      if (subjectIIBB !== undefined) updateData.subjectIIBB = !!subjectIIBB;
      if (subjectGanancias !== undefined) updateData.subjectGanancias = !!subjectGanancias;
      if (subjectPercIVA !== undefined) updateData.subjectPercIVA = !!subjectPercIVA;
      if (pointsPerUnit !== undefined) updateData.pointsPerUnit = pointsPerUnit != null ? parseInt(pointsPerUnit) : null;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

      // Si se actualiza costo y no se envía pricePublic, aplicar pricing
      try {
        if (updateData.cost !== undefined && pricePublic === undefined) {
          const pricing = await getCompanyPricing(companyId);
          if (pricing.applyOnUpdate) {
            const sale = computeSalePrice({
              costPrice: updateData.cost ?? existing.cost ?? 0,
              listPrice: null,
              pricing,
              supplierId: supplierId ?? null
            });
            updateData.pricePublic = sale;
          }
        }
      } catch (e) {
        console.warn('Pricing warning (updateArticle):', e?.message || e);
      }

      const article = await prisma.article.update({
        where: { id },
        data: updateData,
        include: { category: { select: { id: true, name: true } } }
      });

      res.json({ success: true, message: 'Artículo actualizado exitosamente', data: article });
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ error: 'Error interno del servidor', message: 'No se pudo actualizar el artículo' });
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
      const { stock, operation = 'set' } = req.body; // 'set', 'add', 'subtract'
      const companyId = req.user.company.id;

      if (stock === undefined || stock === null) {
        return res.status(400).json({ success: false, message: 'Stock es requerido' });
      }

      const article = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null } });
      if (!article) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      let newStock;
      switch (operation) {
        case 'add':
          newStock = article.stock + parseInt(stock);
          break;
        case 'subtract':
          newStock = article.stock - parseInt(stock);
          break;
        default:
          newStock = parseInt(stock);
      }

      if (newStock < 0) {
        return res.status(400).json({ success: false, message: 'El stock no puede ser negativo' });
      }

      const updated = await prisma.article.update({
        where: { id },
        data: { stock: newStock },
        include: { category: { select: { id: true, name: true } } }
      });

      res.json({ success: true, message: 'Stock actualizado exitosamente', data: updated });
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ error: 'Error interno del servidor', message: 'No se pudo actualizar el stock' });
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
}

export default ArticleController;
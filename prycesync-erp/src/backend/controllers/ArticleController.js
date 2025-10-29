import prisma from '../config/database.js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getCompanyPricing, computeSalePrice, directPricing, inversePricing, forCombo } from '../services/PricingService.js'
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
          bundleComponents: true,
          // Include primary image relation for preview
          image: true
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
        imageUrl,
        comboOwnPrice,
        bundleComponents: bundleComponentsRaw,
        comboComponents
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

      // Resolver componentes de combo si se envían
      const componentsProvided = Array.isArray(bundleComponentsRaw) || Array.isArray(comboComponents)
      const incomingComponents = Array.isArray(bundleComponentsRaw ?? comboComponents) ? (bundleComponentsRaw ?? comboComponents) : []
      const normalizedComponents = []
      for (const c of incomingComponents) {
        if (!c) continue
        const qtyNum = Number(c.qty ?? c.quantity ?? 0)
        if (!(qtyNum > 0)) continue
        const code = c.componentArticleId || c.articleId || c.componentSku || c.sku || c.componentBarcode || c.barcode || c.code
        if (!code) continue
        // Buscar por id exacto, SKU o barcode
        const found = await prisma.article.findFirst({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { id: String(code) },
              { sku: String(code) },
              { barcode: String(code) }
            ]
          },
          select: { id: true }
        })
        if (!found) {
          return res.status(404).json({ error: 'NOT_FOUND', message: `Componente de combo no encontrado: ${code}` })
        }
        normalizedComponents.push({ articleId: found.id, qty: qtyNum })
      }

      // Pricing: directo/inverso o derivado por combo
      let finalGainPct = gainPct != null ? parseFloat(gainPct) : null
      let finalCost = cost != null ? parseFloat(cost) : null
      let finalPricePublic
      const tax = taxRate
      const intType = internalTaxType || null
      const intValue = internalTaxValue != null ? parseFloat(internalTaxValue) : null

      if (normalizedComponents.length > 0 && !comboOwnPrice) {
        const combo = await forCombo({ companyId, components: normalizedComponents, taxRate: tax, gainPct: finalGainPct, internalTaxType: intType, internalTaxValue: intValue })
        // Si no se especificó gainPct, usar el que efectivamente aplicó
        if (finalGainPct == null) {
          const companyPricing = await getCompanyPricing(companyId)
          finalGainPct = companyPricing.defaultMarginPercent
        }
        finalCost = combo.cost
        finalPricePublic = combo.pricePublic
      } else if (pricePublic != null) {
        const inv = inversePricing({ pricePublic, cost, taxRate: tax, internalTaxType: intType, internalTaxValue: intValue })
        finalGainPct = inv.gainPct
        finalPricePublic = inv.pricePublic
        finalCost = finalCost != null ? finalCost : parseFloat(cost)
      } else {
        const g = finalGainPct != null ? finalGainPct : 0
        const dir = directPricing({ cost: finalCost != null ? finalCost : parseFloat(cost), gainPct: g, taxRate: tax, internalTaxType: intType, internalTaxValue: intValue })
        finalGainPct = g
        finalPricePublic = dir.pricePublic
        finalCost = finalCost != null ? finalCost : parseFloat(cost)
      }

      // Generar SKU si no se envía o está vacío
      const rawSku = sku?.toString().trim()
      const finalSku = rawSku && rawSku.length > 0
        ? rawSku
        : `SKU-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`

      const article = await prisma.$transaction(async (tx) => {
        const created = await tx.article.create({
          data: {
            name: name.trim(),
            description: description?.trim() || null,
            type,
            active: !!active,
            sku: finalSku,
            barcode: barcode?.trim() || null,
            barcodeType: barcodeType || null,
          taxRate: parseFloat(tax) || 21,
          cost: finalCost != null ? finalCost : parseFloat(cost),
          gainPct: finalGainPct != null ? finalGainPct : 0,
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

        if (normalizedComponents.length > 0) {
          for (const nc of normalizedComponents) {
            await tx.articleBundleComponent.create({
              data: { articleId: created.id, componentArticleId: nc.articleId, qty: nc.qty }
            })
          }
        }

        return created
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
        imageUrl,
        comboOwnPrice,
        bundleComponents: bundleComponentsRaw,
        comboComponents
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

      // Resolver componentes entrantes
      const incomingComponents = Array.isArray(bundleComponentsRaw ?? comboComponents) ? (bundleComponentsRaw ?? comboComponents) : []
      const normalizedComponents = []
      for (const c of incomingComponents) {
        if (!c) continue
        const qtyNum = Number(c.qty ?? c.quantity ?? 0)
        if (!(qtyNum > 0)) continue
        const code = c.componentArticleId || c.articleId || c.componentSku || c.sku || c.componentBarcode || c.barcode || c.code
        if (!code) continue
        const found = await prisma.article.findFirst({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { id: String(code) },
              { sku: String(code) },
              { barcode: String(code) }
            ]
          },
          select: { id: true }
        })
        if (!found) {
          return res.status(404).json({ error: 'NOT_FOUND', message: `Componente de combo no encontrado: ${code}` })
        }
        normalizedComponents.push({ articleId: found.id, qty: qtyNum })
      }

      // Pricing en update: inverso/directo o derivado por combo si corresponde
      const baseCost = updateData.cost ?? existing.cost ?? 0
      const baseGain = updateData.gainPct ?? existing.gainPct ?? 0
      const baseTax = updateData.taxRate ?? existing.taxRate
      const baseInternalType = updateData.internalTaxType ?? existing.internalTaxType
      const baseInternalValue = updateData.internalTaxValue ?? existing.internalTaxValue

      if (normalizedComponents.length > 0 && !comboOwnPrice) {
        const result = await forCombo({ companyId, components: normalizedComponents, taxRate: baseTax, gainPct: baseGain, internalTaxType: baseInternalType, internalTaxValue: baseInternalValue })
        updateData.cost = result.cost
        updateData.pricePublic = result.pricePublic
        // Si gainPct venía vacío y el artículo lo tenía vacío, usar default de la empresa
        if (updateData.gainPct == null && existing.gainPct == null) {
          const companyPricing = await getCompanyPricing(companyId)
          updateData.gainPct = companyPricing.defaultMarginPercent
        }
      } else if (pricePublic !== undefined) {
        const inv = inversePricing({ pricePublic, cost: baseCost, taxRate: baseTax, internalTaxType: baseInternalType, internalTaxValue: baseInternalValue })
        updateData.gainPct = inv.gainPct
        updateData.pricePublic = inv.pricePublic
      } else if (updateData.cost !== undefined || updateData.gainPct !== undefined || updateData.taxRate !== undefined || updateData.internalTaxType !== undefined || updateData.internalTaxValue !== undefined) {
        const dir = directPricing({ cost: updateData.cost ?? baseCost, gainPct: updateData.gainPct ?? baseGain, taxRate: baseTax, internalTaxType: baseInternalType, internalTaxValue: baseInternalValue })
        updateData.pricePublic = dir.pricePublic
      }

      const article = await prisma.$transaction(async (tx) => {
        const updated = await tx.article.update({
          where: { id },
          data: updateData,
          include: { category: { select: { id: true, name: true } } }
        })

        if (componentsProvided) {
          // Sincronizar componentes: eliminar los que no estén, actualizar qty y crear nuevos
          const existingComps = await tx.articleBundleComponent.findMany({ where: { articleId: id } })
          const incomingMap = new Map(normalizedComponents.map(c => [c.articleId, c.qty]))

          // Eliminar
          for (const ex of existingComps) {
            if (!incomingMap.has(ex.componentArticleId)) {
              await tx.articleBundleComponent.delete({ where: { id: ex.id } })
            }
          }
          // Actualizar o crear
          for (const [compId, qty] of incomingMap.entries()) {
            const found = existingComps.find(e => e.componentArticleId === compId)
            if (found) {
              if (Number(found.qty) !== Number(qty)) {
                await tx.articleBundleComponent.update({ where: { id: found.id }, data: { qty } })
              }
            } else {
              await tx.articleBundleComponent.create({ data: { articleId: id, componentArticleId: compId, qty } })
            }
          }
        }

        return updated
      })

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

  // --- Subrecurso: Imagen principal ---
  static async uploadImage(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'Archivo de imagen requerido (campo "image")' });
      }

      const article = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
      if (!article) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      const ASSETS_DIR = process.env.ASSETS_DIR || (process.env.NODE_ENV === 'development'
        ? path.resolve(path.join(process.cwd(), 'assets'))
        : '/app/assets');
      const targetDir = path.join(ASSETS_DIR, 'articles', companyId, id);
      await fs.promises.mkdir(targetDir, { recursive: true });

      // Determinar extensión según mimetype
      const extMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      };
      const ext = extMap[file.mimetype] || 'jpg';

      const originalName = `original.${ext}`;
      const originalPath = path.join(targetDir, originalName);
      await fs.promises.writeFile(originalPath, file.buffer);

      // Generar thumbnail (webp)
      const thumbName = 'thumb.webp';
      const thumbPath = path.join(targetDir, thumbName);
      try {
        await sharp(file.buffer)
          .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
          .toFormat('webp', { quality: 80 })
          .toFile(thumbPath);
      } catch (err) {
        console.warn('Thumbnail generation failed, continuing without thumbnail:', err?.message);
      }

      const originalUrl = `/static/articles/${companyId}/${id}/${originalName}`;
      const thumbUrl = `/static/articles/${companyId}/${id}/${thumbName}`;

      // Obtener metadatos de la imagen
      let meta = {};
      try {
        meta = await sharp(file.buffer).metadata();
      } catch (err) {
        console.warn('Failed to read image metadata:', err?.message);
      }

      // Persistir en Prisma: ArticleImage y vincular imageId
      await prisma.$transaction(async (tx) => {
        const current = await tx.article.findUnique({ where: { id }, select: { imageId: true } });
        if (current?.imageId) {
          await tx.articleImage.update({
            where: { id: current.imageId },
            data: {
              imageUrl: originalUrl,
              thumbnailUrl: thumbUrl,
              mimeType: file.mimetype,
              sizeBytes: file.size ?? file.buffer?.length ?? null,
              width: meta?.width ?? null,
              height: meta?.height ?? null
            }
          });
          await tx.article.update({ where: { id }, data: { imageUrl: originalUrl } });
        } else {
          const createdImg = await tx.articleImage.create({
            data: {
              articleId: id,
              imageUrl: originalUrl,
              thumbnailUrl: thumbUrl,
              mimeType: file.mimetype,
              sizeBytes: file.size ?? file.buffer?.length ?? null,
              width: meta?.width ?? null,
              height: meta?.height ?? null
            }
          });
          await tx.article.update({ where: { id }, data: { imageUrl: originalUrl, imageId: createdImg.id } });
        }
      });

      return res.status(201).json({ success: true, message: 'Imagen cargada', data: { imageUrl: originalUrl, thumbnailUrl: thumbUrl, articleId: id } });
    } catch (error) {
      console.error('Error uploading article image:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  static async deleteImage(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const article = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true, imageId: true } });
      if (!article) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
      }

      const ASSETS_DIR = process.env.ASSETS_DIR || (process.env.NODE_ENV === 'development'
        ? path.resolve(path.join(process.cwd(), 'assets'))
        : '/app/assets');
      const targetDir = path.join(ASSETS_DIR, 'articles', companyId, id);

      // Borrar archivos y carpeta
      try {
        await fs.promises.rm(targetDir, { recursive: true, force: true });
      } catch (err) {
        console.warn('Delete image: nothing to remove or failed:', err?.message);
      }

      await prisma.$transaction(async (tx) => {
        if (article.imageId) {
          try {
            await tx.articleImage.delete({ where: { id: article.imageId } });
          } catch (err) {
            console.warn('Delete image record failed:', err?.message);
          }
        }
        await tx.article.update({ where: { id }, data: { imageUrl: null, imageId: null } });
      })

      return res.json({ success: true, message: 'Imagen eliminada' });
    } catch (error) {
      console.error('Error deleting article image:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
}

export default ArticleController;
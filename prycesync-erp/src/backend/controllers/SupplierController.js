import prisma from '../config/database.js';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

class SupplierController {
  // Obtener todos los proveedores con filtros y paginación
  static async getSuppliers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        status, 
        sortBy = 'name', 
        sortOrder = 'asc' 
      } = req.query;
      
      const skip = (page - 1) * limit;
      const companyId = req.user.company.id;

      const where = {
        companyId,
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { businessName: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(status && { status })
      };

      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: { [sortBy]: sortOrder },
          include: {
            _count: {
              select: { products: true }
            }
          }
        }),
        prisma.supplier.count({ where })
      ]);

      res.json({
        suppliers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting suppliers:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Buscar proveedores (para autocomplete)
  static async searchSuppliers(req, res) {
    try {
      const { q, limit = 10 } = req.query;
      const companyId = req.user.company.id;

      if (!q) {
        return res.json([]);
      }

      const suppliers = await prisma.supplier.findMany({
        where: {
          companyId,
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { businessName: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: parseInt(limit),
        select: {
          id: true,
          code: true,
          name: true,
          businessName: true,
          email: true,
          status: true
        },
        orderBy: { name: 'asc' }
      });

      res.json(suppliers);
    } catch (error) {
      console.error('Error searching suppliers:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener proveedor por ID
  static async getSupplierById(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const supplier = await prisma.supplier.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null
        },
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  salePrice: true
                }
              }
            },
            orderBy: { supplierName: 'asc' }
          },
          _count: {
            select: { products: true }
          }
        }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      res.json(supplier);
    } catch (error) {
      console.error('Error getting supplier:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear nuevo proveedor
  static async createSupplier(req, res) {
    try {
      const companyId = req.user.company.id;
      const {
        code,
        name,
        businessName,
        taxId,
        email,
        phone,
        website,
        address,
        city,
        state,
        postalCode,
        country = 'Argentina',
        status = 'active',
        paymentTerms,
        creditLimit,
        notes,
        tags = []
      } = req.body;

      // Validar campos requeridos
      if (!code || !name) {
        return res.status(400).json({ 
          error: 'Código y nombre son campos requeridos' 
        });
      }

      // Verificar que el código no exista
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          companyId,
          code,
          deletedAt: null
        }
      });

      if (existingSupplier) {
        return res.status(400).json({ 
          error: 'Ya existe un proveedor con este código' 
        });
      }

      // Verificar CUIT/Tax ID si se proporciona
      if (taxId) {
        const existingTaxId = await prisma.supplier.findFirst({
          where: {
            companyId,
            taxId,
            deletedAt: null
          }
        });

        if (existingTaxId) {
          return res.status(400).json({ 
            error: 'Ya existe un proveedor con este CUIT/Tax ID' 
          });
        }
      }

      const supplier = await prisma.supplier.create({
        data: {
          companyId,
          code,
          name,
          businessName,
          taxId,
          email,
          phone,
          website,
          address,
          city,
          state,
          postalCode,
          country,
          status,
          paymentTerms: paymentTerms ? parseInt(paymentTerms) : null,
          creditLimit: creditLimit ? parseFloat(creditLimit) : null,
          notes,
          tags
        }
      });

      res.status(201).json(supplier);
    } catch (error) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Actualizar proveedor
  static async updateSupplier(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;
      const updateData = req.body;

      // Verificar que el proveedor existe
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null
        }
      });

      if (!existingSupplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      // Verificar código único si se está actualizando
      if (updateData.code && updateData.code !== existingSupplier.code) {
        const codeExists = await prisma.supplier.findFirst({
          where: {
            companyId,
            code: updateData.code,
            deletedAt: null,
            id: { not: id }
          }
        });

        if (codeExists) {
          return res.status(400).json({ 
            error: 'Ya existe un proveedor con este código' 
          });
        }
      }

      // Verificar CUIT/Tax ID único si se está actualizando
      if (updateData.taxId && updateData.taxId !== existingSupplier.taxId) {
        const taxIdExists = await prisma.supplier.findFirst({
          where: {
            companyId,
            taxId: updateData.taxId,
            deletedAt: null,
            id: { not: id }
          }
        });

        if (taxIdExists) {
          return res.status(400).json({ 
            error: 'Ya existe un proveedor con este CUIT/Tax ID' 
          });
        }
      }

      // Procesar campos numéricos
      if (updateData.paymentTerms) {
        updateData.paymentTerms = parseInt(updateData.paymentTerms);
      }
      if (updateData.creditLimit) {
        updateData.creditLimit = parseFloat(updateData.creditLimit);
      }

      const supplier = await prisma.supplier.update({
        where: { id },
        data: updateData
      });

      res.json(supplier);
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Eliminar proveedor (soft delete)
  static async deleteSupplier(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const supplier = await prisma.supplier.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null
        }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      await prisma.supplier.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Proveedor eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener productos de un proveedor
  static async getSupplierProducts(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, search } = req.query;
      const companyId = req.user.company.id;
      const skip = (page - 1) * limit;

      // Verificar que el proveedor existe
      const supplier = await prisma.supplier.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null
        }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      const where = {
        supplierId: id,
        ...(search && {
          OR: [
            { supplierCode: { contains: search, mode: 'insensitive' } },
            { supplierName: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { oem: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const [products, total] = await Promise.all([
        prisma.supplierProduct.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                salePrice: true
              }
            }
          },
          orderBy: { supplierName: 'asc' }
        }),
        prisma.supplierProduct.count({ where })
      ]);

      res.json({
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting supplier products:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Agregar producto a proveedor
  static async addSupplierProduct(req, res) {
    try {
      const { id: supplierId } = req.params;
      const companyId = req.user.company.id;
      const {
        supplierCode,
        supplierName,
        description,
        costPrice,
        listPrice,
        currency = 'ARS',
        minQuantity,
        brand,
        model,
        year,
        oem,
        isActive = true,
        isAvailable = true,
        leadTime,
        productId
      } = req.body;

      // Verificar que el proveedor existe
      const supplier = await prisma.supplier.findFirst({
        where: {
          id: supplierId,
          companyId,
          deletedAt: null
        }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      // Validar campos requeridos
      if (!supplierCode || !supplierName || !costPrice) {
        return res.status(400).json({ 
          error: 'Código del proveedor, nombre y precio de costo son requeridos' 
        });
      }

      // Verificar que el código del producto no exista para este proveedor
      const existingProduct = await prisma.supplierProduct.findFirst({
        where: {
          supplierId,
          supplierCode
        }
      });

      if (existingProduct) {
        return res.status(400).json({ 
          error: 'Ya existe un producto con este código para este proveedor' 
        });
      }

      const supplierProduct = await prisma.supplierProduct.create({
        data: {
          supplierId,
          supplierCode,
          supplierName,
          description,
          costPrice: parseFloat(costPrice),
          listPrice: listPrice ? parseFloat(listPrice) : null,
          currency,
          minQuantity: minQuantity ? parseInt(minQuantity) : null,
          brand,
          model,
          year,
          oem,
          isActive,
          isAvailable,
          leadTime: leadTime ? parseInt(leadTime) : null,
          productId,
          lastImportDate: new Date()
        },
        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              salePrice: true
            }
          }
        }
      });

      // Aplicar reglas de pricing al producto interno si está vinculado
      try {
        if (supplierProduct.product?.id) {
          const { getCompanyPricing, computeSalePrice } = await import('../services/PricingService.js')
          const pricing = await getCompanyPricing(companyId)
          if (pricing.applyOnUpdate || pricing.applyOnImport) {
            const sale = computeSalePrice({
              costPrice: supplierProduct.costPrice,
              listPrice: supplierProduct.listPrice,
              pricing,
              supplierId
            })
            if (pricing.overwriteSalePrice || supplierProduct.product.salePrice == null) {
              await prisma.product.update({
                where: { id: supplierProduct.product.id },
                data: { salePrice: sale }
              })
            }
          }
        }
      } catch (e) {
        console.warn('Pricing warning (addSupplierProduct):', e?.message || e)
      }

      res.status(201).json(supplierProduct);
    } catch (error) {
      console.error('Error adding supplier product:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Actualizar producto de proveedor
  static async updateSupplierProduct(req, res) {
    try {
      const { supplierId, productId } = req.params;
      const companyId = req.user.company.id;
      const updateData = req.body;

      // Verificar que el proveedor existe
      const supplier = await prisma.supplier.findFirst({
        where: {
          id: supplierId,
          companyId,
          deletedAt: null
        }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      // Verificar que el producto del proveedor existe
      const existingProduct = await prisma.supplierProduct.findFirst({
        where: {
          id: productId,
          supplierId
        }
      });

      if (!existingProduct) {
        return res.status(404).json({ error: 'Producto del proveedor no encontrado' });
      }

      // Procesar campos numéricos
      if (updateData.costPrice) updateData.costPrice = parseFloat(updateData.costPrice);
      if (updateData.listPrice) updateData.listPrice = parseFloat(updateData.listPrice);
      if (updateData.minQuantity) updateData.minQuantity = parseInt(updateData.minQuantity);
      if (updateData.leadTime) updateData.leadTime = parseInt(updateData.leadTime);

      const supplierProduct = await prisma.supplierProduct.update({
        where: { id: productId },
        data: updateData,
        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              salePrice: true
            }
          }
        }
      });

      // Aplicar reglas de pricing al producto interno si corresponde
      try {
        if (supplierProduct.product?.id) {
          const { getCompanyPricing, computeSalePrice } = await import('../services/PricingService.js')
          const pricing = await getCompanyPricing(companyId)
          if (pricing.applyOnUpdate) {
            const sale = computeSalePrice({
              costPrice: supplierProduct.costPrice,
              listPrice: supplierProduct.listPrice,
              pricing,
              supplierId
            })
            if (pricing.overwriteSalePrice || supplierProduct.product.salePrice == null) {
              await prisma.product.update({
                where: { id: supplierProduct.product.id },
                data: { salePrice: sale }
              })
            }
          }
        }
      } catch (e) {
        console.warn('Pricing warning (updateSupplierProduct):', e?.message || e)
      }

      res.json(supplierProduct);
    } catch (error) {
      console.error('Error updating supplier product:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Eliminar producto de proveedor
  static async deleteSupplierProduct(req, res) {
    try {
      const { supplierId, productId } = req.params;
      const companyId = req.user.company.id;

      // Verificar que el proveedor existe
      const supplier = await prisma.supplier.findFirst({
        where: {
          id: supplierId,
          companyId,
          deletedAt: null
        }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      // Verificar que el producto del proveedor existe
      const existingProduct = await prisma.supplierProduct.findFirst({
        where: {
          id: productId,
          supplierId
        }
      });

      if (!existingProduct) {
        return res.status(404).json({ error: 'Producto del proveedor no encontrado' });
      }

      await prisma.supplierProduct.delete({
        where: { id: productId }
      });

      res.json({ message: 'Producto del proveedor eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting supplier product:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Vista previa de importación de Excel
  static async previewExcelImport(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
      }

      // Validar tipo de archivo
      const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          error: 'Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)' 
        });
      }

      // Validar tamaño del archivo (máximo 10MB)
      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ 
          error: 'El archivo es demasiado grande. Tamaño máximo: 10MB' 
        });
      }

      const companyId = req.user.company.id;
      const workbook = new ExcelJS.Workbook();
      
      try {
        // Leer el archivo desde el buffer con manejo de errores mejorado
        await workbook.xlsx.load(req.file.buffer);
      } catch (loadError) {
        console.error('Error loading Excel file:', loadError);
        return res.status(400).json({ 
          error: 'El archivo no es un Excel válido o está corrupto. Por favor, verifica que sea un archivo .xlsx válido.' 
        });
      }

      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        return res.status(400).json({ error: 'El archivo Excel no contiene hojas de trabajo' });
      }

      // Verificar que la hoja tenga datos
      if (worksheet.rowCount < 2) {
        return res.status(400).json({ 
          error: 'El archivo Excel debe contener al menos una fila de datos además de los encabezados' 
        });
      }

      const preview = [];
      const errors = [];
      let rowIndex = 0;

      // Preparar pricing y supplierId opcional para vista previa
      let pricing = null;
      let supplierIdForPricing = null;
      try {
        const { getCompanyPricing } = await import('../services/PricingService.js');
        pricing = await getCompanyPricing(companyId);
        supplierIdForPricing = req.body?.supplierId || req.query?.supplierId || null;
      } catch (e) {
        console.warn('Pricing warning (previewExcelImport):', e?.message || e);
      }

      worksheet.eachRow((row, rowNumber) => {
        rowIndex++;
        
        // Saltar la primera fila (encabezados)
        if (rowNumber === 1) return;
        
        // Limitar la vista previa a 50 filas
        if (preview.length >= 50) return;

        const rowData = {
          row: rowNumber,
          supplierCode: row.getCell(1).value?.toString()?.trim() || '',
          supplierName: row.getCell(2).value?.toString()?.trim() || '',
          description: row.getCell(3).value?.toString()?.trim() || '',
          costPrice: row.getCell(4).value || '',
          listPrice: row.getCell(5).value || '',
          brand: row.getCell(6).value?.toString()?.trim() || '',
          model: row.getCell(7).value?.toString()?.trim() || '',
          year: row.getCell(8).value?.toString()?.trim() || '',
          oem: row.getCell(9).value?.toString()?.trim() || '',
          minQuantity: row.getCell(10).value || '',
          leadTime: row.getCell(11).value || '',
          currency: row.getCell(12).value?.toString()?.trim() || 'ARS'
        };

        // Validaciones básicas
        const rowErrors = [];
        if (!rowData.supplierCode) rowErrors.push('Código requerido');
        if (!rowData.supplierName) rowErrors.push('Nombre requerido');
        if (!rowData.costPrice || isNaN(parseFloat(rowData.costPrice))) {
          rowErrors.push('Precio de costo inválido');
        }

        // Calcular precio de venta sugerido si es válido y se puede aplicar pricing
        let computedSalePrice = null;
        if (rowErrors.length === 0 && pricing && pricing.applyOnImport) {
          try {
            const { computeSalePrice } = await import('../services/PricingService.js');
            const cost = parseFloat(rowData.costPrice);
            const list = rowData.listPrice ? parseFloat(rowData.listPrice) : null;
            computedSalePrice = computeSalePrice({
              costPrice: cost,
              listPrice: list,
              pricing,
              supplierId: supplierIdForPricing || null
            });
          } catch (e) {
            console.warn('Pricing compute warning (previewExcelImport):', e?.message || e);
          }
        }

        preview.push({
          ...rowData,
          computedSalePrice,
          errors: rowErrors,
          isValid: rowErrors.length === 0
        });

        if (rowErrors.length > 0) {
          errors.push({
            row: rowNumber,
            errors: rowErrors
          });
        }
      });

      const totalRows = rowIndex - 1; // Excluir encabezados
      const validRows = preview.filter(row => row.isValid).length;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      res.json({
        preview,
        summary: {
          totalRows,
          validRows,
          invalidRows: totalRows - validRows,
          previewRows: preview.length
        },
        errors: errors.slice(0, 20) // Limitar errores mostrados
      });

    } catch (error) {
      console.error('Error previewing Excel import:', error);
      res.status(500).json({ 
        error: 'Error procesando el archivo Excel. Verifica que el archivo no esté corrupto y sea un Excel válido.' 
      });
    }
  }

  // Ejecutar importación de Excel
  static async executeExcelImport(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
      }

      const companyId = req.user.company.id;
      const { supplierId, updateExisting = false } = req.body;

      if (!supplierId) {
        return res.status(400).json({ error: 'ID del proveedor es requerido' });
      }

      // Verificar que el proveedor existe
      const supplier = await prisma.supplier.findFirst({
        where: {
          id: supplierId,
          companyId,
          deletedAt: null
        }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        return res.status(400).json({ error: 'El archivo Excel no contiene hojas de trabajo' });
      }

      const results = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: []
      };

      // Procesar cada fila
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        
        try {
          const rowData = {
            supplierCode: row.getCell(1).value?.toString()?.trim(),
            supplierName: row.getCell(2).value?.toString()?.trim(),
            description: row.getCell(3).value?.toString()?.trim() || null,
            costPrice: parseFloat(row.getCell(4).value) || 0,
            listPrice: row.getCell(5).value ? parseFloat(row.getCell(5).value) : null,
            brand: row.getCell(6).value?.toString()?.trim() || null,
            model: row.getCell(7).value?.toString()?.trim() || null,
            year: row.getCell(8).value?.toString()?.trim() || null,
            oem: row.getCell(9).value?.toString()?.trim() || null,
            minQuantity: row.getCell(10).value ? parseInt(row.getCell(10).value) : null,
            leadTime: row.getCell(11).value ? parseInt(row.getCell(11).value) : null,
            currency: row.getCell(12).value?.toString()?.trim() || 'ARS'
          };

          // Validar datos requeridos
          if (!rowData.supplierCode || !rowData.supplierName || !rowData.costPrice) {
            results.errors.push({
              row: rowNumber,
              error: 'Datos requeridos faltantes (código, nombre, precio)'
            });
            results.skipped++;
            continue;
          }

          // Verificar si el producto ya existe
          const existingProduct = await prisma.supplierProduct.findFirst({
            where: {
              supplierId,
              supplierCode: rowData.supplierCode
            }
          });

          if (existingProduct) {
            if (updateExisting) {
              // Actualizar producto existente
              await prisma.supplierProduct.update({
                where: { id: existingProduct.id },
                data: {
                  ...rowData,
                  lastImportDate: new Date()
                }
              });
              // Intentar aplicar pricing al producto vinculado durante importación
              try {
                if (existingProduct.productId) {
                  const { getCompanyPricing, computeSalePrice } = await import('../services/PricingService.js')
                  const pricing = await getCompanyPricing(companyId)
                  if (pricing.applyOnImport) {
                    const sale = computeSalePrice({
                      costPrice: rowData.costPrice,
                      listPrice: rowData.listPrice,
                      pricing,
                      supplierId
                    })
                    const current = await prisma.product.findUnique({
                      where: { id: existingProduct.productId },
                      select: { salePrice: true }
                    })
                    if (pricing.overwriteSalePrice || current?.salePrice == null) {
                      await prisma.product.update({
                        where: { id: existingProduct.productId },
                        data: { salePrice: sale }
                      })
                    }
                  }
                }
              } catch (e) {
                console.warn('Pricing import warning (update):', e?.message || e)
              }
              results.updated++;
            } else {
              results.skipped++;
            }
          } else {
            // Crear nuevo producto
            const created = await prisma.supplierProduct.create({
              data: {
                supplierId,
                ...rowData,
                lastImportDate: new Date()
              }
            });
            // Intentar aplicar pricing al producto vinculado durante importación
            try {
              if (created.productId) {
                const { getCompanyPricing, computeSalePrice } = await import('../services/PricingService.js')
                const pricing = await getCompanyPricing(companyId)
                if (pricing.applyOnImport) {
                  const sale = computeSalePrice({
                    costPrice: rowData.costPrice,
                    listPrice: rowData.listPrice,
                    pricing,
                    supplierId
                  })
                  const current = await prisma.product.findUnique({
                    where: { id: created.productId },
                    select: { salePrice: true }
                  })
                  if (pricing.overwriteSalePrice || current?.salePrice == null) {
                    await prisma.product.update({
                      where: { id: created.productId },
                      data: { salePrice: sale }
                    })
                  }
                }
              }
            } catch (e) {
              console.warn('Pricing import warning (create):', e?.message || e)
            }
            results.created++;
          }

        } catch (error) {
          results.errors.push({
            row: rowNumber,
            error: error.message
          });
          results.skipped++;
        }
      }

      res.json({
        message: 'Importación completada',
        results
      });

    } catch (error) {
      console.error('Error executing Excel import:', error);
      res.status(500).json({ error: 'Error ejecutando la importación' });
    }
  }

  // Descargar plantilla de importación
  static async downloadImportTemplate(req, res) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Plantilla Productos Proveedor');

      // Definir encabezados
      const headers = [
        'Código Proveedor',
        'Nombre Producto',
        'Descripción',
        'Precio Costo',
        'Precio Lista',
        'Marca',
        'Modelo',
        'Año',
        'Número OEM',
        'Cantidad Mínima',
        'Tiempo Entrega (días)',
        'Moneda'
      ];

      // Agregar encabezados
      worksheet.addRow(headers);

      // Formatear encabezados
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Agregar filas de ejemplo
      worksheet.addRow([
        'PROD001',
        'Filtro de Aceite Toyota',
        'Filtro de aceite para motor Toyota Corolla',
        '25.50',
        '35.00',
        'Toyota',
        'Corolla',
        '2020-2023',
        '90915-YZZD4',
        '1',
        '7',
        'ARS'
      ]);

      worksheet.addRow([
        'PROD002',
        'Pastillas de Freno Ford',
        'Pastillas de freno delanteras Ford Focus',
        '45.00',
        '65.00',
        'Ford',
        'Focus',
        '2018-2022',
        'CV6Z-2001-A',
        '2',
        '5',
        'ARS'
      ]);

      // Ajustar ancho de columnas
      worksheet.columns.forEach((column, index) => {
        column.width = Math.max(headers[index].length + 2, 15);
      });

      // Configurar respuesta
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=plantilla-productos-proveedor.xlsx'
      );

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).json({ error: 'Error generando la plantilla' });
    }
  }

  // Exportar proveedores a Excel
  static async exportSuppliersToExcel(req, res) {
    try {
      const companyId = req.user.company.id;

      const suppliers = await prisma.supplier.findMany({
        where: {
          companyId,
          deletedAt: null
        },
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Proveedores');

      // Definir encabezados
      const headers = [
        'Código',
        'Nombre',
        'Razón Social',
        'CUIT/Tax ID',
        'Email',
        'Teléfono',
        'Dirección',
        'Ciudad',
        'Estado',
        'País',
        'Estado',
        'Productos',
        'Fecha Creación'
      ];

      worksheet.addRow(headers);

      // Formatear encabezados
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Agregar datos
      suppliers.forEach(supplier => {
        worksheet.addRow([
          supplier.code,
          supplier.name,
          supplier.businessName || '',
          supplier.taxId || '',
          supplier.email || '',
          supplier.phone || '',
          supplier.address || '',
          supplier.city || '',
          supplier.state || '',
          supplier.country || '',
          supplier.status,
          supplier._count.products,
          supplier.createdAt.toLocaleDateString()
        ]);
      });

      // Ajustar ancho de columnas
      worksheet.columns.forEach((column, index) => {
        column.width = Math.max(headers[index].length + 2, 12);
      });

      // Configurar respuesta
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=proveedores.xlsx'
      );

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Error exporting suppliers:', error);
      res.status(500).json({ error: 'Error exportando proveedores' });
    }
  }

  // Vista previa de importación de productos de proveedores
  static async previewProductsImport(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
      }

      const { id: supplierId } = req.params;
      const companyId = req.user.company.id;

      // Verificar que el proveedor existe
      const supplier = await prisma.supplier.findFirst({
        where: {
          id: supplierId,
          companyId,
          deletedAt: null
        }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      // Validar tipo de archivo
      const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          error: 'Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)' 
        });
      }

      // Validar tamaño del archivo (máximo 10MB)
      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ 
          error: 'El archivo es demasiado grande. Tamaño máximo: 10MB' 
        });
      }

      const workbook = new ExcelJS.Workbook();
      
      try {
        await workbook.xlsx.load(req.file.buffer);
      } catch (loadError) {
        console.error('Error loading Excel file:', loadError);
        return res.status(400).json({ 
          error: 'El archivo no es un Excel válido o está corrupto. Por favor, verifica que sea un archivo .xlsx válido.' 
        });
      }

      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        return res.status(400).json({ error: 'El archivo Excel no contiene hojas de trabajo' });
      }

      // Verificar que la hoja tenga datos
      if (worksheet.rowCount < 2) {
        return res.status(400).json({ 
          error: 'El archivo Excel debe contener al menos una fila de datos además de los encabezados' 
        });
      }

      const preview = [];
      const errors = [];
      let rowIndex = 0;

      // Preparar pricing para vista previa con overrides del proveedor
      let pricing = null;
      try {
        const { getCompanyPricing } = await import('../services/PricingService.js');
        pricing = await getCompanyPricing(companyId);
      } catch (e) {
        console.warn('Pricing warning (previewProductsImport):', e?.message || e);
      }

      worksheet.eachRow((row, rowNumber) => {
        rowIndex++;
        
        // Saltar la primera fila (encabezados)
        if (rowNumber === 1) return;
        
        // Limitar la vista previa a 50 filas
        if (preview.length >= 50) return;

        const rowData = {
          row: rowNumber,
          supplierCode: row.getCell(1).value?.toString()?.trim() || '',
          supplierName: row.getCell(2).value?.toString()?.trim() || '',
          description: row.getCell(3).value?.toString()?.trim() || '',
          costPrice: row.getCell(4).value || '',
          listPrice: row.getCell(5).value || '',
          brand: row.getCell(6).value?.toString()?.trim() || '',
          model: row.getCell(7).value?.toString()?.trim() || '',
          year: row.getCell(8).value?.toString()?.trim() || '',
          oem: row.getCell(9).value?.toString()?.trim() || '',
          minQuantity: row.getCell(10).value || '',
          leadTime: row.getCell(11).value || '',
          currency: row.getCell(12).value?.toString()?.trim() || 'ARS'
        };

        // Validaciones específicas para productos de proveedores
        const rowErrors = [];
        if (!rowData.supplierCode) rowErrors.push('Código del proveedor requerido');
        if (!rowData.supplierName) rowErrors.push('Nombre del producto requerido');
        
        // Validar precio de costo
        if (!rowData.costPrice) {
          rowErrors.push('Precio de costo requerido');
        } else {
          const costPrice = parseFloat(rowData.costPrice);
          if (isNaN(costPrice) || costPrice <= 0) {
            rowErrors.push('Precio de costo debe ser un número mayor a 0');
          }
        }

        // Validar precio de lista si está presente
        if (rowData.listPrice) {
          const listPrice = parseFloat(rowData.listPrice);
          if (isNaN(listPrice) || listPrice < 0) {
            rowErrors.push('Precio de lista debe ser un número válido');
          }
        }

        // Validar cantidad mínima si está presente
        if (rowData.minQuantity) {
          const minQuantity = parseInt(rowData.minQuantity);
          if (isNaN(minQuantity) || minQuantity < 0) {
            rowErrors.push('Cantidad mínima debe ser un número entero válido');
          }
        }

        // Validar tiempo de entrega si está presente
        if (rowData.leadTime) {
          const leadTime = parseInt(rowData.leadTime);
          if (isNaN(leadTime) || leadTime < 0) {
            rowErrors.push('Tiempo de entrega debe ser un número entero válido');
          }
        }

        // Calcular precio de venta sugerido si es válido y se puede aplicar pricing
        let computedSalePrice = null;
        if (rowErrors.length === 0 && pricing && pricing.applyOnImport) {
          try {
            const { computeSalePrice } = await import('../services/PricingService.js');
            const cost = parseFloat(rowData.costPrice);
            const list = rowData.listPrice ? parseFloat(rowData.listPrice) : null;
            computedSalePrice = computeSalePrice({
              costPrice: cost,
              listPrice: list,
              pricing,
              supplierId
            });
          } catch (e) {
            console.warn('Pricing compute warning (previewProductsImport):', e?.message || e);
          }
        }

        preview.push({
          ...rowData,
          computedSalePrice,
          errors: rowErrors,
          hasErrors: rowErrors.length > 0
        });

        if (rowErrors.length > 0) {
          errors.push({
            row: rowNumber,
            errors: rowErrors
          });
        }
      });

      const totalRows = rowIndex - 1; // Excluir encabezados
      const validRows = preview.filter(row => !row.hasErrors).length;

      res.json({
        preview,
        summary: {
          totalRows,
          validRows,
          invalidRows: totalRows - validRows,
          previewRows: preview.length
        },
        errors: errors.slice(0, 20) // Limitar errores mostrados
      });

    } catch (error) {
      console.error('Error previewing products import:', error);
      res.status(500).json({ 
        error: 'Error procesando el archivo Excel. Verifica que el archivo no esté corrupto y sea un Excel válido.' 
      });
    }
  }

  // Ejecutar importación de productos de proveedores
  static async executeProductsImport(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
      }

      const { id: supplierId } = req.params;
      const companyId = req.user.company.id;
      const { updateExisting = false } = req.body;

      // Verificar que el proveedor existe
      const supplier = await prisma.supplier.findFirst({
        where: {
          id: supplierId,
          companyId,
          deletedAt: null
        }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        return res.status(400).json({ error: 'El archivo Excel no contiene hojas de trabajo' });
      }

      const results = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: []
      };

      // Procesar cada fila
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        
        try {
          const rowData = {
            supplierCode: row.getCell(1).value?.toString()?.trim(),
            supplierName: row.getCell(2).value?.toString()?.trim(),
            description: row.getCell(3).value?.toString()?.trim() || null,
            costPrice: parseFloat(row.getCell(4).value) || 0,
            listPrice: row.getCell(5).value ? parseFloat(row.getCell(5).value) : null,
            brand: row.getCell(6).value?.toString()?.trim() || null,
            model: row.getCell(7).value?.toString()?.trim() || null,
            year: row.getCell(8).value?.toString()?.trim() || null,
            oem: row.getCell(9).value?.toString()?.trim() || null,
            minQuantity: row.getCell(10).value ? parseInt(row.getCell(10).value) : null,
            leadTime: row.getCell(11).value ? parseInt(row.getCell(11).value) : null,
            currency: row.getCell(12).value?.toString()?.trim() || 'ARS',
            isActive: true,
            isAvailable: true
          };

          // Validar campos requeridos
          if (!rowData.supplierCode || !rowData.supplierName || !rowData.costPrice) {
            results.errors.push({
              row: rowNumber,
              error: 'Código, nombre y precio de costo son requeridos'
            });
            results.skipped++;
            continue;
          }

          // Verificar si el producto ya existe
          const existingProduct = await prisma.supplierProduct.findFirst({
            where: {
              supplierId,
              supplierCode: rowData.supplierCode
            }
          });

          if (existingProduct) {
            if (updateExisting) {
              await prisma.supplierProduct.update({
                where: { id: existingProduct.id },
                data: {
                  ...rowData,
                  lastImportDate: new Date()
                }
              });
              results.updated++;
            } else {
              results.skipped++;
            }
          } else {
            // Crear nuevo producto
            await prisma.supplierProduct.create({
              data: {
                supplierId,
                ...rowData,
                lastImportDate: new Date()
              }
            });
            results.created++;
          }

        } catch (error) {
          results.errors.push({
            row: rowNumber,
            error: error.message
          });
          results.skipped++;
        }
      }

      res.json({
        message: 'Importación de productos completada',
        results
      });

    } catch (error) {
      console.error('Error executing products import:', error);
      res.status(500).json({ error: 'Error ejecutando la importación de productos' });
    }
  }

  // Descargar plantilla para productos de proveedores
  static async downloadProductsTemplate(req, res) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Productos Proveedor');

      // Definir encabezados
      const headers = [
        'Código Proveedor',
        'Nombre Producto',
        'Descripción',
        'Precio Costo',
        'Precio Lista',
        'Marca',
        'Modelo',
        'Año',
        'Número OEM',
        'Cantidad Mínima',
        'Tiempo Entrega (días)',
        'Moneda'
      ];

      worksheet.addRow(headers);

      // Formatear encabezados
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Agregar filas de ejemplo
      const exampleRows = [
        ['PROD001', 'Filtro de Aceite', 'Filtro de aceite para motor', 25.50, 35.00, 'Toyota', 'Corolla', '2020', '90915-YZZD2', 1, 7, 'ARS'],
        ['PROD002', 'Pastillas de Freno', 'Pastillas de freno delanteras', 45.75, 65.00, 'Honda', 'Civic', '2019', '45022-S5A-000', 2, 5, 'ARS'],
        ['PROD003', 'Bujía', 'Bujía de encendido', 12.30, 18.50, 'NGK', 'BKR6E', '', 'BKR6E-11', 4, 3, 'ARS']
      ];

      exampleRows.forEach(row => {
        worksheet.addRow(row);
      });

      // Ajustar ancho de columnas
      worksheet.columns.forEach((column, index) => {
        column.width = Math.max(headers[index].length + 2, 15);
      });

      // Configurar respuesta
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=plantilla-productos-proveedor.xlsx'
      );

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Error generating products template:', error);
      res.status(500).json({ error: 'Error generando la plantilla' });
    }
  }
  static async exportSupplierProductsToExcel(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      // Verificar que el proveedor existe
      const supplier = await prisma.supplier.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null
        }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      const products = await prisma.supplierProduct.findMany({
        where: { supplierId: id },
        include: {
          product: {
            select: {
              code: true,
              name: true,
              salePrice: true
            }
          }
        },
        orderBy: { supplierName: 'asc' }
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Productos ${supplier.name}`);

      // Definir encabezados
      const headers = [
        'Código Proveedor',
        'Nombre Producto',
        'Descripción',
        'Precio Costo',
        'Precio Lista',
        'Marca',
        'Modelo',
        'Año',
        'Número OEM',
        'Cantidad Mínima',
        'Tiempo Entrega',
        'Moneda',
        'Activo',
        'Disponible',
        'Producto Interno',
        'Precio Venta',
        'Última Importación'
      ];

      worksheet.addRow(headers);

      // Formatear encabezados
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Agregar datos
      products.forEach(product => {
        worksheet.addRow([
          product.supplierCode,
          product.supplierName,
          product.description || '',
          product.costPrice,
          product.listPrice || '',
          product.brand || '',
          product.model || '',
          product.year || '',
          product.oem || '',
          product.minQuantity || '',
          product.leadTime || '',
          product.currency,
          product.isActive ? 'Sí' : 'No',
          product.isAvailable ? 'Sí' : 'No',
          product.product?.name || '',
          product.product?.salePrice || '',
          product.lastImportDate?.toLocaleDateString() || ''
        ]);
      });

      // Ajustar ancho de columnas
      worksheet.columns.forEach((column, index) => {
        column.width = Math.max(headers[index].length + 2, 12);
      });

      // Configurar respuesta
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=productos-${supplier.code}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Error exporting supplier products:', error);
      res.status(500).json({ error: 'Error exportando productos del proveedor' });
    }
  }
}

export default SupplierController;
import prisma from '../config/database.js';

class ProductController {
  // Buscar productos
  static async searchProducts(req, res) {
    try {
      const { q: query, limit = 10 } = req.query;
      const companyId = req.user.company.id;

      if (!query || query.length < 2) {
        return res.json([]);
      }

      const products = await prisma.product.findMany({
        where: {
          companyId,
          deletedAt: null,
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              code: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              description: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          salePrice: true,
          stock: true,
          status: true,
          type: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        take: parseInt(limit),
        orderBy: {
          name: 'asc'
        }
      });

      res.json(products);
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron buscar los productos'
      });
    }
  }

  // Obtener todos los productos
  static async getProducts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        type, 
        status = 'active',
        categoryId 
      } = req.query;
      
      const companyId = req.user.company.id;
      const skip = (page - 1) * limit;

      const where = {
        companyId,
        deletedAt: null,
        ...(status && { status }),
        ...(type && { type }),
        ...(categoryId && { categoryId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            type: true,
            status: true,
            costPrice: true,
            salePrice: true,
            stock: true,
            minStock: true,
            maxStock: true,
            taxRate: true,
            categoryId: true,
            category: {
              select: {
                id: true,
                name: true
              }
            },
            createdAt: true,
            updatedAt: true
          },
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.product.count({ where })
      ]);

      res.json({
        success: true,
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los productos'
      });
    }
  }

  // Obtener producto por ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const product = await prisma.product.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el producto'
      });
    }
  }

  // Crear nuevo producto
  static async createProduct(req, res) {
    try {
      const { 
        name, 
        description, 
        type = 'product', 
        status = 'active',
        costPrice,
        salePrice,
        stock = 0,
        minStock,
        maxStock,
        taxRate = 21,
        categoryId
      } = req.body;
      
      const companyId = req.user.company.id;

      // Validaciones básicas
      if (!name || !salePrice) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y precio de venta son requeridos'
        });
      }

      // Verificar que la categoría existe si se proporciona
      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: categoryId,
            companyId,
            deletedAt: null
          }
        });

        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Categoría no encontrada'
          });
        }
      }

      // Generar código único
      let code;
      let attempts = 0;
      const maxAttempts = 100;
      
      do {
        const productCount = await prisma.product.count({
          where: { companyId }
        });
        code = `PROD-${(productCount + attempts + 1).toString().padStart(4, '0')}`;
        
        const existingCode = await prisma.product.findFirst({
          where: { 
            companyId, 
            code,
            deletedAt: null 
          }
        });
        
        if (!existingCode) break;
        attempts++;
      } while (attempts < maxAttempts);
      
      if (attempts >= maxAttempts) {
        return res.status(500).json({
          error: 'Error interno',
          message: 'No se pudo generar un código único para el producto'
        });
      }

      const product = await prisma.product.create({
        data: {
          code,
          name: name.trim(),
          description: description?.trim() || null,
          type,
          status,
          costPrice: costPrice ? parseFloat(costPrice) : null,
          salePrice: parseFloat(salePrice),
          stock: parseInt(stock) || 0,
          minStock: minStock ? parseInt(minStock) : null,
          maxStock: maxStock ? parseInt(maxStock) : null,
          taxRate: parseFloat(taxRate) || 21,
          categoryId: categoryId || null,
          companyId
        },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product
      });
    } catch (error) {
      console.error('Error creating product:', error);
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un producto con ese código'
        });
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo crear el producto'
      });
    }
  }

  // Actualizar producto
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, 
        description, 
        type, 
        status,
        costPrice,
        salePrice,
        stock,
        minStock,
        maxStock,
        taxRate,
        categoryId
      } = req.body;
      
      const companyId = req.user.company.id;

      // Verificar que el producto existe
      const existingProduct = await prisma.product.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null
        }
      });

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Verificar que la categoría existe si se proporciona
      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: categoryId,
            companyId,
            deletedAt: null
          }
        });

        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Categoría no encontrada'
          });
        }
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (type !== undefined) updateData.type = type;
      if (status !== undefined) updateData.status = status;
      if (costPrice !== undefined) updateData.costPrice = costPrice ? parseFloat(costPrice) : null;
      if (salePrice !== undefined) updateData.salePrice = parseFloat(salePrice);
      if (stock !== undefined) updateData.stock = parseInt(stock) || 0;
      if (minStock !== undefined) updateData.minStock = minStock ? parseInt(minStock) : null;
      if (maxStock !== undefined) updateData.maxStock = maxStock ? parseInt(maxStock) : null;
      if (taxRate !== undefined) updateData.taxRate = parseFloat(taxRate) || 21;
      if (categoryId !== undefined) updateData.categoryId = categoryId || null;

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: product
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el producto'
      });
    }
  }

  // Eliminar producto (soft delete)
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const product = await prisma.product.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Verificar si el producto está siendo usado en facturas
      const invoiceItems = await prisma.invoiceItem.findFirst({
        where: {
          productId: id,
          invoice: {
            companyId,
            deletedAt: null
          }
        }
      });

      if (invoiceItems) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el producto porque está siendo usado en facturas'
        });
      }

      await prisma.product.update({
        where: { id },
        data: { 
          deletedAt: new Date(),
          status: 'inactive'
        }
      });

      res.json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar el producto'
      });
    }
  }

  // Actualizar stock
  static async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { stock, operation = 'set' } = req.body; // 'set', 'add', 'subtract'
      const companyId = req.user.company.id;

      if (stock === undefined || stock === null) {
        return res.status(400).json({
          success: false,
          message: 'Stock es requerido'
        });
      }

      const product = await prisma.product.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      let newStock;
      switch (operation) {
        case 'add':
          newStock = product.stock + parseInt(stock);
          break;
        case 'subtract':
          newStock = product.stock - parseInt(stock);
          break;
        default:
          newStock = parseInt(stock);
      }

      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'El stock no puede ser negativo'
        });
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { stock: newStock },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Stock actualizado exitosamente',
        data: updatedProduct
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el stock'
      });
    }
  }
}

export default ProductController;
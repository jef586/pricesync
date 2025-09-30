import prisma from '../config/database.js';

class CategoryController {
  // Buscar categorías
  static async searchCategories(req, res) {
    try {
      const { q: query, limit = 10 } = req.query;
      const companyId = req.user.company.id;

      if (!query || query.length < 2) {
        return res.json([]);
      }

      const categories = await prisma.category.findMany({
        where: {
          companyId,
          OR: [
            {
              name: {
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
          name: true,
          description: true,
          parentId: true,
          parent: {
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

      res.json(categories);
    } catch (error) {
      console.error('Error searching categories:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron buscar las categorías'
      });
    }
  }

  // Obtener todas las categorías
  static async getCategories(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        parentId,
        includeChildren = false
      } = req.query;
      
      const companyId = req.user.company.id;
      const skip = (page - 1) * limit;

      const where = {
        companyId,
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            parentId: true,
            parent: {
              select: {
                id: true,
                name: true
              }
            },
            ...(includeChildren === 'true' && {
              children: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }),
            _count: {
              select: {
                products: true
              }
            },
            createdAt: true,
            updatedAt: true
          },
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: {
            name: 'asc'
          }
        }),
        prisma.category.count({ where })
      ]);

      res.json({
        success: true,
        data: categories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las categorías'
      });
    }
  }

  // Obtener categoría por ID
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const category = await prisma.category.findFirst({
        where: {
          id,
          companyId
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          children: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          _count: {
            select: {
              products: true
            }
          }
        }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la categoría'
      });
    }
  }

  // Crear nueva categoría
  static async createCategory(req, res) {
    try {
      const { 
        name, 
        description, 
        parentId
      } = req.body;
      
      const companyId = req.user.company.id;

      // Validaciones básicas
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es requerido'
        });
      }

      // Verificar que la categoría padre existe si se proporciona
      if (parentId) {
        const parentCategory = await prisma.category.findFirst({
          where: {
            id: parentId,
            companyId
          }
        });

        if (!parentCategory) {
          return res.status(404).json({
            success: false,
            message: 'Categoría padre no encontrada'
          });
        }
      }

      // Verificar que no existe una categoría con el mismo nombre en el mismo nivel
      const existingCategory = await prisma.category.findFirst({
        where: {
          companyId,
          name: name.trim(),
          parentId: parentId || null
        }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre en este nivel'
        });
      }

      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          parentId: parentId || null,
          companyId
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: category
      });
    } catch (error) {
      console.error('Error creating category:', error);
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        });
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo crear la categoría'
      });
    }
  }

  // Actualizar categoría
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, 
        description, 
        parentId
      } = req.body;
      
      const companyId = req.user.company.id;

      // Verificar que la categoría existe
      const existingCategory = await prisma.category.findFirst({
        where: {
          id,
          companyId
        }
      });

      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      // Verificar que no se está intentando hacer la categoría padre de sí misma
      if (parentId === id) {
        return res.status(400).json({
          success: false,
          message: 'Una categoría no puede ser padre de sí misma'
        });
      }

      // Verificar que la categoría padre existe si se proporciona
      if (parentId) {
        const parentCategory = await prisma.category.findFirst({
          where: {
            id: parentId,
            companyId,
            deletedAt: null
          }
        });

        if (!parentCategory) {
          return res.status(404).json({
            success: false,
            message: 'Categoría padre no encontrada'
          });
        }

        // Verificar que no se está creando una referencia circular
        const isCircular = await checkCircularReference(id, parentId, companyId);
        if (isCircular) {
          return res.status(400).json({
            success: false,
            message: 'No se puede crear una referencia circular entre categorías'
          });
        }
      }

      // Verificar que no existe otra categoría con el mismo nombre en el mismo nivel
      if (name && name !== existingCategory.name) {
        const duplicateCategory = await prisma.category.findFirst({
          where: {
            companyId,
            name: name.trim(),
            parentId: parentId !== undefined ? (parentId || null) : existingCategory.parentId,
            id: { not: id },
            deletedAt: null
          }
        });

        if (duplicateCategory) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe una categoría con ese nombre en este nivel'
          });
        }
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (parentId !== undefined) updateData.parentId = parentId || null;

      const category = await prisma.category.update({
        where: { id },
        data: updateData,
        include: {
          parent: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: category
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar la categoría'
      });
    }
  }

  // Eliminar categoría (soft delete)
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const category = await prisma.category.findFirst({
        where: {
          id,
          companyId
        },
        include: {
          _count: {
            select: {
              products: true,
              children: true
            }
          }
        }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      // Verificar si la categoría tiene productos asociados
      if (category._count.products > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar la categoría porque tiene ${category._count.products} producto(s) asociado(s)`
        });
      }

      // Verificar si la categoría tiene subcategorías
      if (category._count.children > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar la categoría porque tiene ${category._count.children} subcategoría(s)`
        });
      }

      await prisma.category.update({
        where: { id },
        data: { 
          deletedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Categoría eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar la categoría'
      });
    }
  }

  // Obtener árbol de categorías
  static async getCategoryTree(req, res) {
    try {
      const companyId = req.user.company.id;

      const categories = await prisma.category.findMany({
        where: {
          companyId,
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          description: true,
          parentId: true,
          _count: {
            select: {
              products: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Construir árbol jerárquico
      const categoryMap = new Map();
      const rootCategories = [];

      // Crear mapa de categorías
      categories.forEach(category => {
        categoryMap.set(category.id, {
          ...category,
          children: []
        });
      });

      // Construir jerarquía
      categories.forEach(category => {
        if (category.parentId) {
          const parent = categoryMap.get(category.parentId);
          if (parent) {
            parent.children.push(categoryMap.get(category.id));
          }
        } else {
          rootCategories.push(categoryMap.get(category.id));
        }
      });

      res.json({
        success: true,
        data: rootCategories
      });
    } catch (error) {
      console.error('Error fetching category tree:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el árbol de categorías'
      });
    }
  }
}

// Función auxiliar para verificar referencias circulares
async function checkCircularReference(categoryId, parentId, companyId) {
  let currentParentId = parentId;
  const visited = new Set();

  while (currentParentId) {
    if (visited.has(currentParentId) || currentParentId === categoryId) {
      return true; // Referencia circular detectada
    }

    visited.add(currentParentId);

    const parent = await prisma.category.findFirst({
      where: {
        id: currentParentId,
        companyId
      },
      select: {
        parentId: true
      }
    });

    if (!parent) break;
    currentParentId = parent.parentId;
  }

  return false;
}

export default CategoryController;
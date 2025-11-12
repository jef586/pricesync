import prisma from '../config/database.js';
import RubroValidationService from './RubroValidationService.js';
import { AppError } from '../utils/httpError.js';
import crypto from 'crypto';

class RubroService {
  /**
   * Create a new rubro
   * @param {Object} data - Rubro data
   * @param {Object} user - User object with company info
   * @returns {Promise<Object>} - Created rubro
   */
  static async createRubro(data, user) {
    const { name, parentId, marginRate = 0, isActive = true } = data;
    const companyId = user.companyId || user.company?.id;

    // Validations
    if (!RubroValidationService.validateNameLength(name)) {
      throw new AppError('VALIDATION_ERROR', 'El nombre debe tener entre 2 y 100 caracteres', 'name');
    }

    if (!RubroValidationService.validateMarginRate(marginRate)) {
      throw new AppError('VALIDATION_ERROR', 'El margen debe estar entre 0 y 100', 'margin_rate');
    }

    const isUnique = await RubroValidationService.validateUniqueSiblingName(name, companyId, parentId);
    if (!isUnique) {
      throw new AppError('CONFLICT', 'Ya existe un rubro con ese nombre en este nivel', 'name');
    }

    if (parentId) {
      const parentExists = await RubroValidationService.validateParentExists(parentId, companyId);
      if (!parentExists) {
        throw new AppError('NOT_FOUND', 'Rubro padre no encontrado', 'parent_id');
      }
    }

    // Calculate level and path
    const rubroId = crypto.randomUUID();
    const { level, path } = await RubroValidationService.calculateLevelAndPath(parentId, rubroId, companyId);

    // Create rubro in transaction
    const rubro = await prisma.$transaction(async (tx) => {
      const created = await tx.category.create({
        data: {
          id: rubroId,
          name: name.trim(),
          parentId: parentId || null,
          level,
          path,
          isActive,
          marginRate,
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

      return created;
    });

    return rubro;
  }

  /**
   * List rubros with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {Object} user - User object with company info
   * @returns {Promise<Object>} - Paginated rubros list
   */
  static async listRubros(params, user) {
    const {
      page = 1,
      size = 20,
      q,
      parentId,
      status = 'active',
      includeDeleted = false
    } = params;

    const companyId = user.companyId || user.company?.id;
    const skip = (page - 1) * size;

    // Build where clause
    const where = {
      companyId
    };

    // Handle soft delete filtering
    if (!includeDeleted && status !== 'deleted') {
      where.deletedAt = null;
    }

    // Handle status filtering
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'deleted') {
      where.deletedAt = { not: null };
    }

    // Handle parent filtering
    if (parentId !== undefined) {
      where.parentId = parentId || null;
    }

    // Handle search
    if (q) {
      where.OR = [
        {
          name: {
            contains: q,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: q,
            mode: 'insensitive'
          }
        }
      ];
    }

    const [rubros, total] = await Promise.all([
      prisma.category.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          parentId: true,
          level: true,
          path: true,
          isActive: true,
          marginRate: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          parent: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              children: {
                where: {
                  deletedAt: null
                }
              },
              articles: {
                where: {
                  deletedAt: null
                }
              }
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(size),
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.category.count({ where })
    ]);

    return {
      items: rubros,
      total,
      page: parseInt(page),
      size: parseInt(size),
      pages: Math.ceil(total / size)
    };
  }

  /**
   * Get rubro by ID
   * @param {string} id - Rubro ID
   * @param {Object} user - User object with company info
   * @param {boolean} includeDeleted - Whether to include soft-deleted rubros
   * @returns {Promise<Object>} - Rubro data
   */
  static async getRubroById(id, user, includeDeleted = false) {
    const companyId = user.companyId || user.company?.id;

    const where = {
      id,
      companyId
    };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const rubro = await prisma.category.findFirst({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        children: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            level: true
          },
          orderBy: {
            name: 'asc'
          }
        },
        _count: {
          select: {
            children: {
              where: {
                deletedAt: null
              }
            },
            articles: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    });

    if (!rubro) {
      throw new AppError('NOT_FOUND', 'Rubro no encontrado');
    }

    return rubro;
  }

  /**
   * Update rubro
   * @param {string} id - Rubro ID
   * @param {Object} data - Update data
   * @param {Object} user - User object with company info
   * @returns {Promise<Object>} - Updated rubro
   */
  static async updateRubro(id, data, user) {
    const { name, parentId, marginRate, isActive } = data;
    const companyId = user.companyId || user.company?.id;

    // Check if rubro exists and belongs to company
    const existingRubro = await prisma.category.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingRubro) {
      throw new AppError('NOT_FOUND', 'Rubro no encontrado');
    }

    // Validations
    if (name !== undefined) {
      if (!RubroValidationService.validateNameLength(name)) {
        throw new AppError('VALIDATION_ERROR', 'El nombre debe tener entre 2 y 100 caracteres', 'name');
      }

      const isUnique = await RubroValidationService.validateUniqueSiblingName(
        name,
        companyId,
        parentId !== undefined ? (parentId || null) : existingRubro.parentId,
        id
      );

      if (!isUnique) {
        throw new AppError('CONFLICT', 'Ya existe un rubro con ese nombre en este nivel', 'name');
      }
    }

    if (marginRate !== undefined) {
      if (!RubroValidationService.validateMarginRate(marginRate)) {
        throw new AppError('VALIDATION_ERROR', 'El margen debe estar entre 0 y 100', 'margin_rate');
      }
    }

    // Check for circular reference if parent is being changed
    if (parentId !== undefined && parentId !== existingRubro.parentId) {
      if (parentId && parentId === id) {
        throw new AppError('VALIDATION_ERROR', 'Un rubro no puede ser padre de sí mismo', 'parent_id');
      }

      const isCircular = await RubroValidationService.checkCircularReference(id, parentId, companyId);
      if (isCircular) {
        throw new AppError('CONFLICT', 'No se puede crear una referencia circular entre rubros', 'parent_id');
      }

      if (parentId) {
        const parentExists = await RubroValidationService.validateParentExists(parentId, companyId);
        if (!parentExists) {
          throw new AppError('NOT_FOUND', 'Rubro padre no encontrado', 'parent_id');
        }
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (marginRate !== undefined) updateData.marginRate = marginRate;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle parent change with level/path recalculation
    let level = existingRubro.level;
    let path = existingRubro.path;

    if (parentId !== undefined && parentId !== existingRubro.parentId) {
      const newParentData = await RubroValidationService.calculateLevelAndPath(
        parentId || null,
        id,
        companyId
      );
      level = newParentData.level;
      path = newParentData.path;
      updateData.parentId = parentId || null;
      updateData.level = level;
      updateData.path = path;
    }

    // Update rubro
    const updatedRubro = await prisma.category.update({
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

    return updatedRubro;
  }

  /**
   * Soft delete rubro
   * @param {string} id - Rubro ID
   * @param {Object} user - User object with company info
   * @param {boolean} force - Whether to force delete even with children
   * @returns {Promise<void>}
   */
  static async softDeleteRubro(id, user, force = false) {
    const companyId = user.companyId || user.company?.id;

    // Check if rubro exists and belongs to company
    const rubro = await prisma.category.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            children: {
              where: {
                deletedAt: null
              }
            },
            articles: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    });

    if (!rubro) {
      throw new AppError('NOT_FOUND', 'Rubro no encontrado');
    }

    // Check for active children
    if (!force && rubro._count.children > 0) {
      throw new AppError('CONFLICT', 'No se puede eliminar el rubro porque tiene subrubros activos', 'HAS_CHILDREN');
    }

    // Check for associated articles
    if (rubro._count.articles > 0) {
      throw new AppError('CONFLICT', 'No se puede eliminar el rubro porque tiene artículos asociados', 'HAS_ARTICLES');
    }

    // Soft delete
    await prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    });
  }

  /**
   * Restore soft-deleted rubro
   * @param {string} id - Rubro ID
   * @param {Object} user - User object with company info
   * @returns {Promise<Object>} - Restored rubro
   */
  static async restoreRubro(id, user) {
    const companyId = user.companyId || user.company?.id;

    // Check if rubro exists and is deleted
    const rubro = await prisma.category.findFirst({
      where: {
        id,
        companyId,
        deletedAt: { not: null }
      }
    });

    if (!rubro) {
      throw new AppError('NOT_FOUND', 'Rubro no encontrado o no está eliminado');
    }

    // Check for name conflicts after restore
    const isUnique = await RubroValidationService.validateUniqueSiblingName(
      rubro.name,
      companyId,
      rubro.parentId,
      id
    );

    if (!isUnique) {
      throw new AppError('CONFLICT', 'Ya existe un rubro con ese nombre en este nivel');
    }

    // Restore rubro
    const restoredRubro = await prisma.category.update({
      where: { id },
      data: {
        deletedAt: null,
        isActive: true
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

    return restoredRubro;
  }
}

export default RubroService;
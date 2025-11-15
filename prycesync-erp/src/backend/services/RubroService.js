import prisma from '../config/database.js';
import RubroValidationService from './RubroValidationService.js';
import { AppError } from '../utils/httpError.js';
import AuditService from './AuditService.js';
import crypto from 'crypto';

class RubroService {
  /**
   * Create a new rubro
   * @param {Object} data - Rubro data
   * @param {Object} user - User object with company info
   * @returns {Promise<Object>} - Created rubro
   */
  static async createRubro(data, user) {
    const { name, parentId } = data;
    const companyId = user.companyId || user.company?.id;

    // Validations
    if (!RubroValidationService.validateNameLength(name)) {
      throw new AppError('VALIDATION_ERROR', 'El nombre debe tener entre 2 y 100 caracteres', 'name');
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
          isActive: true, // Default to active
          marginRate: 0,  // Default margin rate
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
      includeDeleted = false,
      sort = 'name',
      order = 'asc'
    } = params;

    const companyId = user.companyId || user.company?.id;
    
    // Sanitize page and size to valid ranges
    const sanitizedPage = Math.max(1, parseInt(page));
    const sanitizedSize = Math.max(10, Math.min(100, parseInt(size)));
    const skip = (sanitizedPage - 1) * sanitizedSize;

    // Build where clause
    const where = {
      companyId
    };

    // Handle status filtering according to requirements
    let sanitizedStatus = status;
    if (status === 'active') {
      where.deletedAt = null;
      where.isActive = true;
    } else if (status === 'inactive') {
      where.deletedAt = null;
      where.isActive = false;
    } else if (status === 'deleted') {
      where.deletedAt = { not: null };
    } else if (status === 'all') {
      // No deletedAt filter for 'all' status
    } else {
      // Default to active if invalid status
      sanitizedStatus = 'active';
      where.deletedAt = null;
      where.isActive = true;
    }

    // Handle parent filtering
    if (parentId !== undefined) {
      where.parentId = parentId || null;
    }

    // Handle search - normalize query and use ILIKE equivalent
    if (q) {
      const normalizedQuery = q.trim().toLowerCase();
      where.OR = [
        {
          name: {
            contains: normalizedQuery,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: normalizedQuery,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Build order by clause with stable ordering
    const orderBy = [];
    const validSortFields = ['name', 'level', 'createdAt'];
    const sortField = validSortFields.includes(sort) ? sort : 'name';
    const sortOrder = order === 'desc' ? 'desc' : 'asc';
    
    // Always prioritize by level first (parents before children)
    orderBy.push({ level: 'asc' });
    
    // Then apply the selected sort field
    orderBy.push({ [sortField]: sortOrder });
    
    // Add id as tiebreaker for stable pagination
    orderBy.push({ id: 'asc' });

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
        skip: skip,
        take: sanitizedSize,
        orderBy
      }),
      prisma.category.count({ where })
    ]);

    const calculatedPages = Math.ceil(total / sanitizedSize);
    
    return {
      items: rubros,
      total,
      page: sanitizedPage,
      size: sanitizedSize,
      pages: calculatedPages,
      filters: {
        q: q || '',
        parentId: parentId || null,
        status: sanitizedStatus,
        sort: sortField,
        order: sortOrder
      }
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
    const { name, parentId } = data;
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
  static async restoreRubro(id, user, cascade = false) {
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

    // Validate ancestors are active
    let parentId = rubro.parentId || null;
    while (parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: parentId, companyId },
        select: { id: true, deletedAt: true, isActive: true, parentId: true }
      });
      if (!parent || parent.deletedAt) {
        throw new AppError('CONFLICT', 'No se puede restaurar porque su padre está eliminado', 'PARENT_DELETED');
      }
      parentId = parent.parentId || null;
    }

    const restoredRubro = await prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({
        where: { id },
        data: { deletedAt: null, isActive: true },
        include: { parent: { select: { id: true, name: true } } }
      });

      if (cascade) {
        const basePath = updated.path || updated.id;
        await tx.category.updateMany({
          where: { companyId, deletedAt: { not: null }, path: { startsWith: `${basePath}.` } },
          data: { deletedAt: null, isActive: true }
        });
      }

      return updated;
    });

    await AuditService.log({
      actorId: user.id,
      actorName: user.name,
      targetId: id,
      targetName: restoredRubro?.name,
      actionType: 'RESTORE',
      payloadDiff: { entity: 'rubro', action: 'RESTORE', cascade },
      companyId
    });

    return restoredRubro;
  }

  /**
   * Permanent delete rubro with optional cascade
   */
  static async permanentDeleteRubro(id, user, force = false, meta = {}) {
    const companyId = user.companyId || user.company?.id;

    const rubro = await prisma.category.findFirst({
      where: { id, companyId },
      select: { id: true, name: true, path: true }
    });

    if (!rubro) {
      throw new AppError('NOT_FOUND', 'Rubro no encontrado');
    }

    const articlesCount = await prisma.article.count({
      where: { companyId, categoryId: id, deletedAt: null }
    });
    if (articlesCount > 0) {
      throw new AppError('CONFLICT', 'No se puede eliminar el rubro porque tiene artículos asociados', 'HAS_ARTICLES');
    }

    if (!force) {
      const childrenCount = await prisma.category.count({ where: { companyId, parentId: id } });
      if (childrenCount > 0) {
        throw new AppError('CONFLICT', 'No se puede eliminar el rubro porque tiene subrubros', 'HAS_CHILDREN');
      }
    }

    const affected = await prisma.$transaction(async (tx) => {
      let deletedChildren = 0;
      if (force) {
        const basePath = rubro.path || rubro.id;
        const delRes = await tx.category.deleteMany({
          where: { companyId, path: { startsWith: `${basePath}.` } }
        });
        deletedChildren = delRes.count || 0;
      }

      await tx.category.delete({ where: { id } });

      return deletedChildren + 1;
    });

    await AuditService.log({
      actorId: user.id,
      actorName: user.name,
      targetId: id,
      targetName: rubro?.name,
      actionType: 'DELETE_PERMANENT',
      payloadDiff: { entity: 'rubro', action: 'DELETE_PERMANENT', affected_count: affected, cascade: !!force },
      companyId,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  /**
   * Move rubro to a new parent, updating level/path and cascading to descendants
   * @param {string} id
   * @param {string|null} newParentId
   * @param {Object} user
   * @param {{ip?: string, userAgent?: string}} meta
   * @returns {Promise<Object>}
   */
  static async moveRubro(id, newParentId, user, meta = {}) {
    const companyId = user.companyId || user.company?.id;

    const rubro = await prisma.category.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true, name: true, parentId: true, level: true, path: true }
    });

    if (!rubro) {
      throw new AppError('NOT_FOUND', 'Rubro no encontrado');
    }

    const oldParentId = rubro.parentId || null;
    const oldPath = rubro.path || rubro.id;
    const oldLevel = rubro.level || 0;

    if (newParentId && newParentId === id) {
      throw new AppError('CONFLICT', 'Un rubro no puede ser padre de sí mismo', 'parent_id');
    }

    let parent = null;
    if (newParentId) {
      parent = await prisma.category.findFirst({
        where: { id: newParentId, companyId, deletedAt: null },
        select: { id: true, level: true, path: true }
      });

      if (!parent) {
        throw new AppError('NOT_FOUND', 'Rubro padre no encontrado', 'parent_id');
      }

      const segments = (parent.path || '').split('.').filter(Boolean);
      if (segments.includes(id)) {
        throw new AppError('CONFLICT', 'No se puede mover dentro de sus descendientes', 'parent_id');
      }
    }

    const { level: newLevel, path: newPath } = await RubroValidationService.calculateLevelAndPath(newParentId || null, id, companyId);
    const deltaLevel = (newLevel ?? 0) - (oldLevel ?? 0);

    const updated = await prisma.$transaction(async (tx) => {
      const moved = await tx.category.update({
        where: { id },
        data: { parentId: newParentId || null, level: newLevel, path: newPath },
        include: {
          parent: { select: { id: true, name: true } }
        }
      });

      const descendants = await tx.category.findMany({
        where: {
          companyId,
          deletedAt: null,
          path: { startsWith: `${oldPath}.` }
        },
        select: { id: true, path: true, level: true }
      });

      if (descendants.length > 0) {
        await Promise.all(
          descendants.map((d) => {
            const suffix = d.path.substring(oldPath.length);
            const nextPath = `${newPath}${suffix}`;
            const nextLevel = (d.level ?? 0) + deltaLevel;
            return tx.category.update({
              where: { id: d.id },
              data: { path: nextPath, level: nextLevel }
            });
          })
        );
      }

      return moved;
    });

    await AuditService.log({
      actorId: user.id,
      actorName: user.name,
      targetId: id,
      targetName: updated?.name,
      actionType: 'RUBRO_MOVE',
      payloadDiff: { entity: 'rubro', action: 'MOVE', old_parent_id: oldParentId, new_parent_id: newParentId, old_path: oldPath, new_path: newPath },
      companyId,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });

    return updated;
  }
}

export default RubroService;

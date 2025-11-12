import prisma from '../config/database.js';

class RubroValidationService {
  /**
   * Validate that a rubro name is unique among siblings (same parent and company)
   * @param {string} name - The rubro name to validate
   * @param {string} companyId - The company ID
   * @param {string|null} parentId - The parent ID (null for root level)
   * @param {string|null} excludeId - ID to exclude from uniqueness check (for updates)
   * @returns {Promise<boolean>} - True if unique, false otherwise
   */
  static async validateUniqueSiblingName(name, companyId, parentId = null, excludeId = null) {
    const where = {
      companyId,
      name: name.trim(),
      parentId: parentId || null,
      deletedAt: null
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await prisma.category.findFirst({ where });
    return !existing;
  }

  /**
   * Check if moving a rubro under a new parent would create a circular reference
   * @param {string} rubroId - The rubro ID that would be moved
   * @param {string|null} newParentId - The new parent ID (null for root level)
   * @param {string} companyId - The company ID
   * @returns {Promise<boolean>} - True if circular reference detected, false otherwise
   */
  static async checkCircularReference(rubroId, newParentId, companyId) {
    if (!newParentId) {
      return false; // Moving to root level can't create circular reference
    }

    if (rubroId === newParentId) {
      return true; // Can't be parent of itself
    }

    // Traverse up the hierarchy from the new parent to check if we reach the rubro
    let currentParentId = newParentId;
    const visited = new Set();

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        return true; // Circular reference detected (already visited)
      }
      
      if (currentParentId === rubroId) {
        return true; // Circular reference detected (reached ourselves)
      }

      visited.add(currentParentId);

      const parent = await prisma.category.findFirst({
        where: {
          id: currentParentId,
          companyId,
          deletedAt: null
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

  /**
   * Validate that a parent rubro exists and belongs to the same company
   * @param {string|null} parentId - The parent ID to validate
   * @param {string} companyId - The company ID
   * @returns {Promise<boolean>} - True if parent exists and is valid, false otherwise
   */
  static async validateParentExists(parentId, companyId) {
    if (!parentId) {
      return true; // Root level is always valid
    }

    const parent = await prisma.category.findFirst({
      where: {
        id: parentId,
        companyId,
        deletedAt: null
      }
    });

    return !!parent; // Returns true if parent exists, false otherwise
  }

  /**
   * Validate margin rate is within acceptable range (0-100)
   * @param {number|null} marginRate - The margin rate to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  static validateMarginRate(marginRate) {
    if (marginRate === null || marginRate === undefined) {
      return true; // Null is allowed
    }

    return typeof marginRate === 'number' && marginRate >= 0 && marginRate <= 100;
  }

  /**
   * Validate that a rubro name meets length requirements
   * @param {string} name - The name to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  static validateNameLength(name) {
    if (!name || typeof name !== 'string') {
      return false;
    }
    
    const trimmedName = name.trim();
    return trimmedName.length >= 2 && trimmedName.length <= 100;
  }

  /**
   * Calculate level and path for a rubro based on its parent
   * @param {string|null} parentId - The parent ID
   * @param {string} rubroId - The rubro ID
   * @param {string} companyId - The company ID
   * @returns {Promise<{level: number, path: string}>} - The calculated level and path
   */
  static async calculateLevelAndPath(parentId, rubroId, companyId) {
    if (!parentId) {
      return {
        level: 0,
        path: rubroId
      };
    }

    const parent = await prisma.category.findFirst({
      where: {
        id: parentId,
        companyId,
        deletedAt: null
      },
      select: {
        level: true,
        path: true
      }
    });

    if (!parent) {
      throw new Error('Parent rubro not found');
    }

    return {
      level: parent.level + 1,
      path: `${parent.path}.${rubroId}`
    };
  }

  /**
   * Check if a rubro has active children
   * @param {string} rubroId - The rubro ID to check
   * @param {string} companyId - The company ID
   * @returns {Promise<boolean>} - True if has active children, false otherwise
   */
  static async hasActiveChildren(rubroId, companyId) {
    const children = await prisma.category.findFirst({
      where: {
        parentId: rubroId,
        companyId,
        isActive: true,
        deletedAt: null
      }
    });

    return !!children;
  }

  /**
   * Ensure a rubro belongs to the specified company
   * @param {string} rubroId - The rubro ID
   * @param {string} companyId - The company ID
   * @returns {Promise<boolean>} - True if belongs to company, false otherwise
   */
  static async ensureSameCompany(rubroId, companyId) {
    const rubro = await prisma.category.findFirst({
      where: {
        id: rubroId,
        companyId
      }
    });

    return !!rubro;
  }
}

export default RubroValidationService;
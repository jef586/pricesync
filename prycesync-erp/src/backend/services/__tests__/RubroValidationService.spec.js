import { describe, it, expect, beforeEach, vi } from 'vitest';
import RubroValidationService from '../../services/RubroValidationService.js';
import prisma from '../../config/database.js';

// Mock prisma
vi.mock('../../config/database.js', () => ({
  default: {
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

describe('RubroValidationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUniqueSiblingName', () => {
    it('should return true when name is unique', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      const result = await RubroValidationService.validateUniqueSiblingName('Test Rubro', 'company-123', null);

      expect(result).toBe(true);
      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: {
          companyId: 'company-123',
          name: 'Test Rubro',
          parentId: null,
          deletedAt: null
        }
      });
    });

    it('should return false when name already exists', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'existing-id', name: 'Test Rubro' });

      const result = await RubroValidationService.validateUniqueSiblingName('Test Rubro', 'company-123', null);

      expect(result).toBe(false);
    });

    it('should exclude specified ID from uniqueness check', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await RubroValidationService.validateUniqueSiblingName('Test Rubro', 'company-123', null, 'exclude-id');

      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: {
          companyId: 'company-123',
          name: 'Test Rubro',
          parentId: null,
          deletedAt: null,
          id: { not: 'exclude-id' }
        }
      });
    });
  });

  describe('checkCircularReference', () => {
    it('should return false for root level move', async () => {
      const result = await RubroValidationService.checkCircularReference('rubro-123', null, 'company-123');
      expect(result).toBe(false);
    });

    it('should return true when trying to be parent of itself', async () => {
      const result = await RubroValidationService.checkCircularReference('rubro-123', 'rubro-123', 'company-123');
      expect(result).toBe(true);
    });

    it('should return false for valid parent assignment', async () => {
      prisma.category.findFirst
        .mockResolvedValueOnce({ parentId: 'parent-2' })  // parent-1's parent is parent-2
        .mockResolvedValueOnce({ parentId: null });     // parent-2's parent is null (root)

      const result = await RubroValidationService.checkCircularReference('rubro-123', 'parent-1', 'company-123');
      
      expect(result).toBe(false);
    });

    it('should return true when circular reference is detected', async () => {
      prisma.category.findFirst
        .mockResolvedValueOnce({ parentId: 'rubro-123' }); // parent-1 has rubro-123 as parent (circular!)

      const result = await RubroValidationService.checkCircularReference('rubro-123', 'parent-1', 'company-123');
      
      expect(result).toBe(true);
    });
  });

  describe('validateParentExists', () => {
    it('should return true for null parent (root level)', async () => {
      const result = await RubroValidationService.validateParentExists(null, 'company-123');
      expect(result).toBe(true);
    });

    it('should return true when parent exists', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'parent-123', name: 'Parent' });

      const result = await RubroValidationService.validateParentExists('parent-123', 'company-123');

      expect(result).toBe(true);
      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'parent-123',
          companyId: 'company-123',
          deletedAt: null
        }
      });
    });

    it('should return false when parent does not exist', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      const result = await RubroValidationService.validateParentExists('nonexistent', 'company-123');

      expect(result).toBe(false);
    });
  });

  describe('validateMarginRate', () => {
    it('should return true for valid margin rates', () => {
      expect(RubroValidationService.validateMarginRate(0)).toBe(true);
      expect(RubroValidationService.validateMarginRate(50)).toBe(true);
      expect(RubroValidationService.validateMarginRate(100)).toBe(true);
      expect(RubroValidationService.validateMarginRate(null)).toBe(true);
      expect(RubroValidationService.validateMarginRate(undefined)).toBe(true);
    });

    it('should return false for invalid margin rates', () => {
      expect(RubroValidationService.validateMarginRate(-1)).toBe(false);
      expect(RubroValidationService.validateMarginRate(101)).toBe(false);
      expect(RubroValidationService.validateMarginRate('50')).toBe(false);
    });
  });

  describe('validateNameLength', () => {
    it('should return true for valid names', () => {
      expect(RubroValidationService.validateNameLength('Test')).toBe(true);
      expect(RubroValidationService.validateNameLength('A'.repeat(100))).toBe(true);
      expect(RubroValidationService.validateNameLength('  Test  ')).toBe(true); // Should trim
    });

    it('should return false for invalid names', () => {
      expect(RubroValidationService.validateNameLength('')).toBe(false);
      expect(RubroValidationService.validateNameLength('A')).toBe(false); // Too short
      expect(RubroValidationService.validateNameLength('A'.repeat(101))).toBe(false); // Too long
      expect(RubroValidationService.validateNameLength(null)).toBe(false);
      expect(RubroValidationService.validateNameLength(undefined)).toBe(false);
      expect(RubroValidationService.validateNameLength(123)).toBe(false);
    });
  });

  describe('calculateLevelAndPath', () => {
    it('should calculate level and path for root rubro', async () => {
      const result = await RubroValidationService.calculateLevelAndPath(null, 'rubro-123', 'company-123');
      
      expect(result).toEqual({
        level: 0,
        path: 'rubro-123'
      });
    });

    it('should calculate level and path for child rubro', async () => {
      prisma.category.findFirst.mockResolvedValue({
        level: 2,
        path: 'parent-1.parent-2'
      });

      const result = await RubroValidationService.calculateLevelAndPath('parent-123', 'rubro-456', 'company-123');
      
      expect(result).toEqual({
        level: 3,
        path: 'parent-1.parent-2.rubro-456'
      });
    });

    it('should throw error when parent not found', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        RubroValidationService.calculateLevelAndPath('nonexistent', 'rubro-123', 'company-123')
      ).rejects.toThrow('Parent rubro not found');
    });
  });

  describe('hasActiveChildren', () => {
    it('should return true when rubro has active children', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'child-123' });

      const result = await RubroValidationService.hasActiveChildren('parent-123', 'company-123');

      expect(result).toBe(true);
      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: {
          parentId: 'parent-123',
          companyId: 'company-123',
          isActive: true,
          deletedAt: null
        }
      });
    });

    it('should return false when rubro has no active children', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      const result = await RubroValidationService.hasActiveChildren('parent-123', 'company-123');

      expect(result).toBe(false);
    });
  });

  describe('ensureSameCompany', () => {
    it('should return true when rubro belongs to company', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'rubro-123', companyId: 'company-123' });

      const result = await RubroValidationService.ensureSameCompany('rubro-123', 'company-123');

      expect(result).toBe(true);
      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'rubro-123',
          companyId: 'company-123'
        }
      });
    });

    it('should return false when rubro does not belong to company', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      const result = await RubroValidationService.ensureSameCompany('rubro-123', 'different-company');

      expect(result).toBe(false);
    });
  });
});
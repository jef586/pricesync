import { describe, it, expect, beforeEach, vi } from 'vitest';
import RubroService from '../../services/RubroService.js';
import RubroValidationService from '../../services/RubroValidationService.js';
import { AppError } from '../../utils/httpError.js';
import prisma from '../../config/database.js';

// Mock dependencies
vi.mock('../../services/RubroValidationService.js', () => ({
  default: {
    validateUniqueSiblingName: vi.fn(),
    validateParentExists: vi.fn(),
    checkCircularReference: vi.fn(),
    validateNameLength: vi.fn(),
    validateMarginRate: vi.fn(),
    calculateLevelAndPath: vi.fn(),
    hasActiveChildren: vi.fn(),
    ensureSameCompany: vi.fn()
  }
}));

vi.mock('../../config/database.js', () => ({
  default: {
    $transaction: vi.fn(),
    category: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    }
  }
}));

describe('RubroService', () => {
  const mockUser = {
    companyId: 'company-123',
    company: { id: 'company-123' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRubro', () => {
    it('should create a rubro successfully', async () => {
      const rubroData = {
        name: 'Test Rubro',
        parentId: null,
        marginRate: 15,
        isActive: true
      };

      RubroValidationService.validateNameLength.mockReturnValue(true);
      RubroValidationService.validateMarginRate.mockReturnValue(true);
      RubroValidationService.validateUniqueSiblingName.mockResolvedValue(true);
      RubroValidationService.calculateLevelAndPath.mockResolvedValue({ level: 0, path: 'rubro-id' });

      const createdRubro = {
        id: 'rubro-id',
        name: 'Test Rubro',
        level: 0,
        path: 'rubro-id'
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(prisma);
      });
      prisma.category.create.mockResolvedValue(createdRubro);

      const result = await RubroService.createRubro(rubroData, mockUser);

      expect(result).toEqual(createdRubro);
      expect(RubroValidationService.validateNameLength).toHaveBeenCalledWith('Test Rubro');
      expect(RubroValidationService.validateMarginRate).toHaveBeenCalledWith(15);
      expect(RubroValidationService.validateUniqueSiblingName).toHaveBeenCalledWith(
        'Test Rubro',
        'company-123',
        null
      );
    });

    it('should throw validation error for invalid name', async () => {
      const rubroData = { name: 'A', marginRate: 15 };

      RubroValidationService.validateNameLength.mockReturnValue(false);

      await expect(RubroService.createRubro(rubroData, mockUser))
        .rejects
        .toThrow(new AppError('VALIDATION_ERROR', 'El nombre debe tener entre 2 y 100 caracteres', 'name'));
    });

    it('should throw validation error for invalid margin rate', async () => {
      const rubroData = { name: 'Test Rubro', marginRate: 150 };

      RubroValidationService.validateNameLength.mockReturnValue(true);
      RubroValidationService.validateMarginRate.mockReturnValue(false);

      await expect(RubroService.createRubro(rubroData, mockUser))
        .rejects
        .toThrow(new AppError('VALIDATION_ERROR', 'El margen debe estar entre 0 y 100', 'margin_rate'));
    });

    it('should throw conflict error for duplicate name', async () => {
      const rubroData = { name: 'Test Rubro', marginRate: 15 };

      RubroValidationService.validateNameLength.mockReturnValue(true);
      RubroValidationService.validateMarginRate.mockReturnValue(true);
      RubroValidationService.validateUniqueSiblingName.mockResolvedValue(false);

      await expect(RubroService.createRubro(rubroData, mockUser))
        .rejects
        .toThrow(new AppError('CONFLICT', 'Ya existe un rubro con ese nombre en este nivel', 'name'));
    });
  });

  describe('listRubros', () => {
    it('should return paginated rubros list', async () => {
      const mockRubros = [
        { id: '1', name: 'Rubro 1', isActive: true },
        { id: '2', name: 'Rubro 2', isActive: true }
      ];

      prisma.category.findMany.mockResolvedValue(mockRubros);
      prisma.category.count.mockResolvedValue(2);

      const result = await RubroService.listRubros({ page: 1, size: 20 }, mockUser);

      expect(result).toEqual({
        items: mockRubros,
        total: 2,
        page: 1,
        size: 20,
        pages: 1
      });
    });

    it('should apply search filter', async () => {
      const mockRubros = [{ id: '1', name: 'Test Rubro' }];

      prisma.category.findMany.mockResolvedValue(mockRubros);
      prisma.category.count.mockResolvedValue(1);

      await RubroService.listRubros({ q: 'Test', page: 1, size: 20 }, mockUser);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-123',
            deletedAt: null,
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'Test' }) }),
              expect.objectContaining({ description: expect.objectContaining({ contains: 'Test' }) })
            ])
          })
        })
      );
    });

    it('should filter by status', async () => {
      prisma.category.findMany.mockResolvedValue([]);
      prisma.category.count.mockResolvedValue(0);

      await RubroService.listRubros({ status: 'inactive', page: 1, size: 20 }, mockUser);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-123',
            deletedAt: null,
            isActive: false
          })
        })
      );
    });

    it('should include deleted rubros when requested', async () => {
      prisma.category.findMany.mockResolvedValue([]);
      prisma.category.count.mockResolvedValue(0);

      await RubroService.listRubros({ includeDeleted: true, page: 1, size: 20 }, mockUser);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-123'
          })
        })
      );
      expect(prisma.category.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null
          })
        })
      );
    });
  });

  describe('getRubroById', () => {
    it('should return rubro by ID', async () => {
      const mockRubro = { id: 'rubro-123', name: 'Test Rubro' };

      prisma.category.findFirst.mockResolvedValue(mockRubro);

      const result = await RubroService.getRubroById('rubro-123', mockUser);

      expect(result).toEqual(mockRubro);
      expect(prisma.category.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'rubro-123',
            companyId: 'company-123',
            deletedAt: null
          }
        })
      );
    });

    it('should include deleted rubro when requested', async () => {
      const mockRubro = { id: 'rubro-123', name: 'Test Rubro', deletedAt: new Date() };

      prisma.category.findFirst.mockResolvedValue(mockRubro);

      await RubroService.getRubroById('rubro-123', mockUser, true);

      expect(prisma.category.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'rubro-123',
            companyId: 'company-123'
          }
        })
      );
    });

    it('should throw not found error when rubro does not exist', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(RubroService.getRubroById('nonexistent', mockUser))
        .rejects
        .toThrow(new AppError('NOT_FOUND', 'Rubro no encontrado'));
    });
  });

  describe('updateRubro', () => {
    it('should update rubro successfully', async () => {
      const existingRubro = { id: 'rubro-123', name: 'Old Name', parentId: null };
      const updatedRubro = { id: 'rubro-123', name: 'New Name', parentId: null };

      prisma.category.findFirst.mockResolvedValue(existingRubro);
      RubroValidationService.validateNameLength.mockReturnValue(true);
      RubroValidationService.validateUniqueSiblingName.mockResolvedValue(true);
      prisma.category.update.mockResolvedValue(updatedRubro);

      const result = await RubroService.updateRubro('rubro-123', { name: 'New Name' }, mockUser);

      expect(result).toEqual(updatedRubro);
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'rubro-123' },
        data: { name: 'New Name' },
        include: expect.any(Object)
      });
    });

    it('should throw not found error when rubro does not exist', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(RubroService.updateRubro('nonexistent', { name: 'New Name' }, mockUser))
        .rejects
        .toThrow(new AppError('NOT_FOUND', 'Rubro no encontrado'));
    });

    it('should check circular reference when changing parent', async () => {
      const existingRubro = { id: 'rubro-123', name: 'Test', parentId: null };

      prisma.category.findFirst.mockResolvedValue(existingRubro);
      RubroValidationService.checkCircularReference.mockResolvedValue(true);

      await expect(RubroService.updateRubro('rubro-123', { parentId: 'rubro-123' }, mockUser))
        .rejects
        .toThrow(new AppError('VALIDATION_ERROR', 'Un rubro no puede ser padre de sí mismo', 'parent_id'));
    });
  });

  describe('softDeleteRubro', () => {
    it('should soft delete rubro successfully', async () => {
      const rubro = {
        id: 'rubro-123',
        _count: { children: 0, articles: 0 }
      };

      prisma.category.findFirst.mockResolvedValue(rubro);
      prisma.category.update.mockResolvedValue({ id: 'rubro-123', deletedAt: new Date() });

      await RubroService.softDeleteRubro('rubro-123', mockUser);

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'rubro-123' },
        data: {
          deletedAt: expect.any(Date),
          isActive: false
        }
      });
    });

    it('should throw conflict error when rubro has active children', async () => {
      const rubro = {
        id: 'rubro-123',
        _count: { children: 2, articles: 0 }
      };

      prisma.category.findFirst.mockResolvedValue(rubro);

      await expect(RubroService.softDeleteRubro('rubro-123', mockUser))
        .rejects
        .toThrow(new AppError('CONFLICT', 'No se puede eliminar el rubro porque tiene subrubros activos', 'HAS_CHILDREN'));
    });

    it('should allow deletion with force flag even with children', async () => {
      const rubro = {
        id: 'rubro-123',
        _count: { children: 2, articles: 0 }
      };

      prisma.category.findFirst.mockResolvedValue(rubro);
      prisma.category.update.mockResolvedValue({ id: 'rubro-123', deletedAt: new Date() });

      await RubroService.softDeleteRubro('rubro-123', mockUser, true);

      expect(prisma.category.update).toHaveBeenCalled();
    });
  });

  describe('restoreRubro', () => {
    it('should restore soft-deleted rubro successfully', async () => {
      const deletedRubro = {
        id: 'rubro-123',
        name: 'Test Rubro',
        parentId: null,
        deletedAt: new Date()
      };

      prisma.category.findFirst.mockResolvedValue(deletedRubro);
      RubroValidationService.validateUniqueSiblingName.mockResolvedValue(true);
      prisma.category.update.mockResolvedValue({
        ...deletedRubro,
        deletedAt: null,
        isActive: true
      });

      const result = await RubroService.restoreRubro('rubro-123', mockUser);

      expect(result.deletedAt).toBeNull();
      expect(result.isActive).toBe(true);
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'rubro-123' },
        data: {
          deletedAt: null,
          isActive: true
        },
        include: expect.any(Object)
      });
    });

    it('should throw not found error when rubro is not deleted', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(RubroService.restoreRubro('rubro-123', mockUser))
        .rejects
        .toThrow(new AppError('NOT_FOUND', 'Rubro no encontrado o no está eliminado'));
    });

    it('should throw conflict error when name conflict exists after restore', async () => {
      const deletedRubro = {
        id: 'rubro-123',
        name: 'Test Rubro',
        parentId: null,
        deletedAt: new Date()
      };

      prisma.category.findFirst.mockResolvedValue(deletedRubro);
      RubroValidationService.validateUniqueSiblingName.mockResolvedValue(false);

      await expect(RubroService.restoreRubro('rubro-123', mockUser))
        .rejects
        .toThrow(new AppError('CONFLICT', 'Ya existe un rubro con ese nombre en este nivel'));
    });
  });

  describe('moveRubro', () => {
    it('should move rubro to new parent and update descendants', async () => {
      prisma.category.findFirst
        .mockResolvedValueOnce({ id: 'rubro-1', name: 'R1', parentId: null, level: 0, path: 'rubro-1' })
        .mockResolvedValueOnce({ id: 'parent-2', level: 1, path: 'root.parent-2' });

      RubroValidationService.calculateLevelAndPath.mockResolvedValue({ level: 2, path: 'root.parent-2.rubro-1' });

      prisma.$transaction.mockImplementation(async (cb) => cb(prisma));

      prisma.category.update
        .mockResolvedValueOnce({ id: 'rubro-1', name: 'R1', parentId: 'parent-2', level: 2, path: 'root.parent-2.rubro-1' })
        .mockResolvedValueOnce({ id: 'child-a', level: 3, path: 'root.parent-2.rubro-1.child-a' });

      prisma.category.findMany.mockResolvedValue([
        { id: 'child-a', path: 'rubro-1.child-a', level: 1 }
      ]);

      const result = await RubroService.moveRubro('rubro-1', 'parent-2', mockUser, {});

      expect(result.parentId).toBe('parent-2');
      expect(prisma.category.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ path: expect.objectContaining({ startsWith: 'rubro-1.' }) })
      }));
      expect(prisma.category.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ path: 'root.parent-2.rubro-1.child-a', level: 3 })
      }));
    });

    it('should reject moving into itself', async () => {
      prisma.category.findFirst.mockResolvedValueOnce({ id: 'rubro-1', name: 'R1', parentId: null, level: 0, path: 'rubro-1' });

      await expect(RubroService.moveRubro('rubro-1', 'rubro-1', mockUser)).rejects.toThrow(
        new AppError('CONFLICT', 'Un rubro no puede ser padre de sí mismo', 'parent_id')
      );
    });

    it('should reject cycle when parent path contains id', async () => {
      prisma.category.findFirst
        .mockResolvedValueOnce({ id: 'rubro-1', name: 'R1', parentId: null, level: 0, path: 'rubro-1' })
        .mockResolvedValueOnce({ id: 'child-a', level: 1, path: 'rubro-1.child-a' });

      await expect(RubroService.moveRubro('rubro-1', 'child-a', mockUser)).rejects.toThrow(
        new AppError('CONFLICT', 'No se puede mover dentro de sus descendientes', 'parent_id')
      );
    });
  });
});

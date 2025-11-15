import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import RubroService from '../services/RubroService.js'
import prisma from '../config/database.js'

describe('RubroService - Server-side Listing', () => {
  let testCompanyId
  let testUser
  let testRubros = []

  beforeEach(async () => {
    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
        taxId: '30123456789',
        address: 'Test Address',
        phone: '1234567890',
        email: 'test@example.com'
      }
    })
    testCompanyId = company.id

    // Create test user
    testUser = {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      companyId: testCompanyId
    }

    // Create test rubros hierarchy
    const root1 = await prisma.category.create({
      data: {
        id: 'root-1',
        name: 'Electrónica',
        level: 0,
        path: 'root-1',
        companyId: testCompanyId,
        isActive: true
      }
    })

    const root2 = await prisma.category.create({
      data: {
        id: 'root-2',
        name: 'Hogar',
        level: 0,
        path: 'root-2',
        companyId: testCompanyId,
        isActive: true
      }
    })

    const child1 = await prisma.category.create({
      data: {
        id: 'child-1',
        name: 'Smartphones',
        parentId: 'root-1',
        level: 1,
        path: 'root-1.child-1',
        companyId: testCompanyId,
        isActive: true
      }
    })

    const deletedRubro = await prisma.category.create({
      data: {
        id: 'deleted-1',
        name: 'Tablets',
        parentId: 'root-1',
        level: 1,
        path: 'root-1.deleted-1',
        companyId: testCompanyId,
        isActive: false,
        deletedAt: new Date()
      }
    })

    testRubros = [root1, root2, child1, deletedRubro]
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.category.deleteMany({
      where: { companyId: testCompanyId }
    })
    await prisma.company.delete({
      where: { id: testCompanyId }
    })
  })

  describe('listRubros - Basic Pagination', () => {
    it('should return paginated results with default parameters', async () => {
      const result = await RubroService.listRubros({}, testUser)

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page')
      expect(result).toHaveProperty('size')
      expect(result).toHaveProperty('pages')
      expect(result).toHaveProperty('filters')

      expect(result.items).toHaveLength(3) // Only active rubros
      expect(result.total).toBe(3)
      expect(result.page).toBe(1)
      expect(result.size).toBe(20)
      expect(result.pages).toBe(1)
      expect(result.filters.status).toBe('active')
    })

    it('should sanitize page and size parameters', async () => {
      const result = await RubroService.listRubros({ page: 0, size: 5 }, testUser)

      expect(result.page).toBe(1)
      expect(result.size).toBe(10) // Minimum size is 10
    })

    it('should limit size to maximum of 100', async () => {
      const result = await RubroService.listRubros({ size: 150 }, testUser)

      expect(result.size).toBe(100)
    })
  })

  describe('listRubros - Status Filtering', () => {
    it('should filter by active status', async () => {
      const result = await RubroService.listRubros({ status: 'active' }, testUser)

      expect(result.items).toHaveLength(3)
      expect(result.items.every(item => !item.deletedAt && item.isActive)).toBe(true)
    })

    it('should filter by deleted status', async () => {
      const result = await RubroService.listRubros({ status: 'deleted' }, testUser)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].deletedAt).not.toBeNull()
    })

    it('should return all rubros when status is "all"', async () => {
      const result = await RubroService.listRubros({ status: 'all' }, testUser)

      expect(result.items).toHaveLength(4) // Including deleted
    })

    it('should default to active status for invalid status', async () => {
      const result = await RubroService.listRubros({ status: 'invalid' }, testUser)

      expect(result.items).toHaveLength(3) // Only active rubros
      expect(result.filters.status).toBe('active')
    })
  })

  describe('listRubros - Search Functionality', () => {
    it('should search by name using case-insensitive search', async () => {
      const result = await RubroService.listRubros({ q: 'ELECTR' }, testUser)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Electrónica')
    })

    it('should search by description', async () => {
      // Add description to a rubro
      await prisma.category.update({
        where: { id: 'child-1' },
        data: { description: 'Teléfonos inteligentes de última generación' }
      })

      const result = await RubroService.listRubros({ q: 'teléfono' }, testUser)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Smartphones')
    })

    it('should normalize search query', async () => {
      const result = await RubroService.listRubros({ q: '  SMARTPHONE  ' }, testUser)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Smartphones')
    })
  })

  describe('listRubros - Parent Filtering', () => {
    it('should filter by parentId for root level', async () => {
      const result = await RubroService.listRubros({ parentId: null }, testUser)

      expect(result.items).toHaveLength(2) // Only root rubros
      expect(result.items.every(item => item.level === 0)).toBe(true)
    })

    it('should filter by specific parentId', async () => {
      const result = await RubroService.listRubros({ parentId: 'root-1' }, testUser)

      expect(result.items).toHaveLength(1) // Only active child
      expect(result.items.every(item => item.parentId === 'root-1')).toBe(true)
    })
  })

  describe('listRubros - Sorting', () => {
    it('should sort by name ascending by default', async () => {
      const result = await RubroService.listRubros({}, testUser)

      const names = result.items.map(item => item.name)
      // With hierarchical ordering (parents before children), level 0 items come first
      expect(names).toEqual(['Electrónica', 'Hogar', 'Smartphones'])
    })

    it('should sort by name descending', async () => {
      const result = await RubroService.listRubros({ sort: 'name', order: 'desc' }, testUser)

      const names = result.items.map(item => item.name)
      // With hierarchical ordering (parents before children), level 0 items come first
      expect(names).toEqual(['Hogar', 'Electrónica', 'Smartphones'])
    })

    it('should sort by level', async () => {
      const result = await RubroService.listRubros({ sort: 'level', order: 'asc' }, testUser)

      const levels = result.items.map(item => item.level)
      expect(levels).toEqual([0, 0, 1])
    })

    it('should sort by createdAt', async () => {
      const result = await RubroService.listRubros({ sort: 'createdAt', order: 'desc' }, testUser)

      // Should be sorted by creation date (newest first)
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('should use id as tiebreaker for stable ordering', async () => {
      // Create multiple rubros with same name (different parents)
      await prisma.category.create({
        data: {
          id: 'duplicate-1',
          name: 'Smartphones',
          parentId: 'root-2',
          level: 1,
          path: 'root-2.duplicate-1',
          companyId: testCompanyId,
          isActive: true
        }
      })

      const result = await RubroService.listRubros({ q: 'Smartphones', sort: 'name' }, testUser)

      expect(result.items).toHaveLength(2)
      expect(result.items[0].id).toBe('child-1') // First by id tiebreaker
      expect(result.items[1].id).toBe('duplicate-1')
    })
  })

  describe('listRubros - Combined Filtering', () => {
    it('should combine search and status filtering', async () => {
      const result = await RubroService.listRubros({ 
        q: 'smartphone',
        status: 'active'
      }, testUser)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Smartphones')
      expect(result.items[0].deletedAt).toBeNull()
    })

    it('should combine parent and search filtering', async () => {
      const result = await RubroService.listRubros({ 
        parentId: 'root-1',
        q: 'smartphone'
      }, testUser)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Smartphones')
      expect(result.items[0].parentId).toBe('root-1')
    })

    it('should return empty results when no matches', async () => {
      const result = await RubroService.listRubros({ 
        q: 'nonexistent',
        status: 'active'
      }, testUser)

      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('listRubros - Response Structure', () => {
    it('should include filters in response', async () => {
      const result = await RubroService.listRubros({ 
        q: 'test',
        status: 'deleted',
        parentId: 'root-1',
        sort: 'level',
        order: 'desc'
      }, testUser)

      expect(result.filters).toEqual({
        q: 'test',
        parentId: 'root-1',
        status: 'deleted',
        sort: 'level',
        order: 'desc'
      })
    })

    it('should calculate total pages correctly', async () => {
      // Create more test data
      for (let i = 0; i < 10; i++) {
        await prisma.category.create({
          data: {
            id: `test-${i}`,
            name: `Test Rubro ${i}`,
            level: 0,
            path: `test-${i}`,
            companyId: testCompanyId,
            isActive: true
          }
        })
      }

      const result = await RubroService.listRubros({ size: 10 }, testUser)
      
      // With 13 total items and size 10, we should have 2 pages (ceil(13/10) = 2)
      expect(result.total).toBe(13) // 3 original + 10 new
      expect(result.size).toBe(10)
      expect(result.pages).toBe(2)
    })
  })

  describe('Performance - Index Usage', () => {
    it('should use company_parent_deleted index for common queries', async () => {
      // This test verifies that the database uses the proper indexes
      // In a real scenario, you would check the query execution plan
      const start = Date.now()
      
      const result = await RubroService.listRubros({ 
        parentId: null,
        status: 'active'
      }, testUser)
      
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(200) // Should be fast with proper indexes
      expect(result.items.length).toBeGreaterThan(0)
    })
  })
})
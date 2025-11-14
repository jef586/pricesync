import { describe, it, expect } from 'vitest'
import { buildRubroTree, isDescendant } from '../rubroValidation.ts'

describe('rubroValidation', () => {
  describe('buildRubroTree', () => {
    it('should build correct tree structure', () => {
      const rubros = [
        { id: 'rubro1', parentId: null, name: 'Rubro 1' },
        { id: 'rubro2', parentId: 'rubro1', name: 'Rubro 2' },
        { id: 'rubro3', parentId: 'rubro1', name: 'Rubro 3' },
        { id: 'rubro4', parentId: 'rubro2', name: 'Rubro 4' }
      ]

      const tree = buildRubroTree(rubros)
      
      expect(tree.has('rubro1')).toBe(true)
      expect(tree.has('rubro2')).toBe(true)
      expect(tree.has('rubro3')).toBe(true)
      expect(tree.has('rubro4')).toBe(true)
      
      expect(tree.get('rubro1')).toEqual(new Set(['rubro2', 'rubro3']))
      expect(tree.get('rubro2')).toEqual(new Set(['rubro4']))
      expect(tree.get('rubro3')).toEqual(new Set())
      expect(tree.get('rubro4')).toEqual(new Set())
    })

    it('should handle empty array', () => {
      const tree = buildRubroTree([])
      expect(tree.size).toBe(0)
    })

    it('should handle single root rubro', () => {
      const rubros = [
        { id: 'rubro1', parentId: null, name: 'Rubro 1' }
      ]

      const tree = buildRubroTree(rubros)
      expect(tree.get('rubro1')).toEqual(new Set())
    })
  })

  describe('isDescendant', () => {
    it('should correctly identify direct children', () => {
      const tree = new Map([
        ['rubro1', new Set(['rubro2', 'rubro3'])],
        ['rubro2', new Set(['rubro4'])],
        ['rubro3', new Set()],
        ['rubro4', new Set()]
      ])

      expect(isDescendant(tree, 'rubro2', 'rubro1')).toBe(true)
      expect(isDescendant(tree, 'rubro3', 'rubro1')).toBe(true)
      expect(isDescendant(tree, 'rubro4', 'rubro2')).toBe(true)
    })

    it('should correctly identify grandchildren', () => {
      const tree = new Map([
        ['rubro1', new Set(['rubro2'])],
        ['rubro2', new Set(['rubro3'])],
        ['rubro3', new Set()]
      ])

      expect(isDescendant(tree, 'rubro3', 'rubro1')).toBe(true)
    })

    it('should return false for non-descendants', () => {
      const tree = new Map([
        ['rubro1', new Set(['rubro2'])],
        ['rubro2', new Set(['rubro3'])],
        ['rubro3', new Set()]
      ])

      expect(isDescendant(tree, 'rubro1', 'rubro2')).toBe(false)
      expect(isDescendant(tree, 'rubro2', 'rubro3')).toBe(false)
      expect(isDescendant(tree, 'rubro1', 'rubro3')).toBe(false)
    })

    it('should return false for same node', () => {
      const tree = new Map([
        ['rubro1', new Set(['rubro2'])],
        ['rubro2', new Set()]
      ])

      expect(isDescendant(tree, 'rubro1', 'rubro1')).toBe(false)
    })

    it('should handle circular references safely', () => {
      const tree = new Map([
        ['rubro1', new Set(['rubro2'])],
        ['rubro2', new Set(['rubro3'])],
        ['rubro3', new Set(['rubro1'])] // Circular reference
      ])

      // Should not hang or crash
      expect(isDescendant(tree, 'rubro1', 'rubro3')).toBe(true)
    })

    it('should handle disconnected nodes', () => {
      const tree = new Map([
        ['rubro1', new Set(['rubro2'])],
        ['rubro3', new Set(['rubro4'])],
        ['rubro2', new Set()],
        ['rubro4', new Set()]
      ])

      expect(isDescendant(tree, 'rubro3', 'rubro1')).toBe(false)
      expect(isDescendant(tree, 'rubro1', 'rubro3')).toBe(false)
    })
  })
})
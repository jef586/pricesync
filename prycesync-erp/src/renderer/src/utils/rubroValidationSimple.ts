/**
 * Simple standalone validation functions for rubros
 * These don't depend on external services
 */

/**
 * Helper to build a tree structure from flat rubros
 * Returns a Map where keys are rubro IDs and values are Sets of child IDs
 */
export function buildRubroTree(rubros: Array<{id: string, parentId: string | null}>): Map<string, Set<string>> {
  const tree = new Map<string, Set<string>>()
  
  // Initialize all nodes
  rubros.forEach(rubro => {
    tree.set(rubro.id, new Set<string>())
  })
  
  // Build parent-child relationships
  rubros.forEach(rubro => {
    if (rubro.parentId && tree.has(rubro.parentId)) {
      tree.get(rubro.parentId)!.add(rubro.id)
    }
  })
  
  return tree
}

/**
 * Helper to check if a rubro is a descendant of another rubro
 * Uses depth-first search to traverse the tree
 */
export function isDescendant(tree: Map<string, Set<string>>, rubroId: string, parentId: string): boolean {
  if (rubroId === parentId) return false
  
  const visited = new Set<string>()
  
  function dfs(currentId: string): boolean {
    if (currentId === rubroId) return true
    if (visited.has(currentId)) return false
    visited.add(currentId)
    
    const children = tree.get(currentId)
    if (!children) return false
    
    for (const childId of children) {
      if (dfs(childId)) return true
    }
    
    return false
  }
  
  return dfs(parentId)
}

/**
 * Mock version of ensureNoCycle for testing
 * In real implementation, this would check against the database
 */
export async function ensureNoCycle(rubroId: string, newParentId: string | null): Promise<boolean> {
  if (!newParentId) return false // Moving to root level can't create circular reference
  if (rubroId === newParentId) return true // Can't be parent of itself
  
  // For now, return false (no cycle detected)
  // In real implementation, this would fetch all rubros and check for cycles
  return false
}
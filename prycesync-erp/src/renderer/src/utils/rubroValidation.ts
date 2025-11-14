import { listRubros } from '@/services/rubros'

/**
 * Helper to check if moving a rubro under a new parent would create a circular reference
 * @param rubroId - The rubro ID that would be moved
 * @param newParentId - The new parent ID (null for root level)
 * @returns Promise<boolean> - True if circular reference detected, false otherwise
 */
export async function ensureNoCycle(rubroId: string, newParentId: string | null): Promise<boolean> {
  if (!newParentId) {
    return false // Moving to root level can't create circular reference
  }

  if (rubroId === newParentId) {
    return true // Can't be parent of itself
  }

  try {
    // Get all rubros to build the hierarchy
    const response = await listRubros({ 
      page: 1, 
      size: 1000, 
      status: 'active' 
    })
    
    const rubros = response.items
    const rubroMap = new Map(rubros.map(r => [r.id, r]))
    
    // Traverse up the hierarchy from the new parent to check if we reach the rubro
    let currentParentId = newParentId
    const visited = new Set<string>()

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        return true // Circular reference detected (already visited)
      }
      
      if (currentParentId === rubroId) {
        return true // Circular reference detected (reached ourselves)
      }

      visited.add(currentParentId)

      const parent = rubroMap.get(currentParentId)
      if (!parent || !parent.parentId) break
      
      currentParentId = parent.parentId
    }

    return false
  } catch (error) {
    console.error('Error checking for circular reference:', error)
    // In case of error, assume no cycle to allow the operation
    return false
  }
}

/**
 * Build a tree structure from flat rubro list for cycle detection
 */
export function buildRubroTree(rubros: Array<{id: string, parentId: string | null}>): Map<string, Set<string>> {
  const tree = new Map<string, Set<string>>()
  
  // Initialize all nodes
  rubros.forEach(rubro => {
    if (!tree.has(rubro.id)) {
      tree.set(rubro.id, new Set())
    }
  })
  
  // Build parent-child relationships
  rubros.forEach(rubro => {
    if (rubro.parentId) {
      const children = tree.get(rubro.parentId) || new Set()
      children.add(rubro.id)
      tree.set(rubro.parentId, children)
    }
  })
  
  return tree
}

/**
 * Check if a rubro is a descendant of another rubro
 */
export function isDescendant(
  tree: Map<string, Set<string>>, 
  potentialDescendant: string, 
  potentialAncestor: string
): boolean {
  if (potentialDescendant === potentialAncestor) {
    return false
  }
  
  const visited = new Set<string>()
  const queue = [potentialAncestor]
  
  while (queue.length > 0) {
    const current = queue.shift()!
    
    if (visited.has(current)) {
      continue
    }
    
    visited.add(current)
    
    const children = tree.get(current)
    if (!children) {
      continue
    }
    
    for (const child of children) {
      if (child === potentialDescendant) {
        return true
      }
      if (!visited.has(child)) {
        queue.push(child)
      }
    }
  }
  
  return false
}
import { test, expect } from '@playwright/test'

test.describe('Rubros Server-side Listing', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to rubros page
    await page.goto('/auth')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/rubros')
    await page.waitForLoadState('networkidle')
  })

  test('should display rubros list with server-side pagination', async ({ page }) => {
    // Verify that the page loads with initial data
    await expect(page.locator('h1')).toContainText('Gestión de Rubros')
    
    // Check that the data table is visible
    await expect(page.locator('.data-table')).toBeVisible()
    
    // Verify pagination controls are present
    await expect(page.locator('.pagination')).toBeVisible()
  })

  test('should filter rubros by search query', async ({ page }) => {
    // Search for a specific term
    await page.fill('input[placeholder*="Buscar"]', 'Electrónica')
    await page.waitForTimeout(500) // Debounce delay
    
    // Wait for results to load
    await page.waitForLoadState('networkidle')
    
    // Verify filtered results
    const rows = page.locator('.data-table tbody tr')
    await expect(rows.first()).toContainText('Electrónica')
  })

  test('should filter rubros by status', async ({ page }) => {
    // Open status filter
    await page.selectOption('select', 'deleted')
    await page.waitForLoadState('networkidle')
    
    // Verify deleted items are shown
    const rows = page.locator('.data-table tbody tr')
    const firstRow = rows.first()
    await expect(firstRow.locator('.badge-danger')).toContainText('Eliminado')
  })

  test('should paginate through results', async ({ page }) => {
    // Go to next page
    await page.click('.pagination button:has-text("2")')
    await page.waitForLoadState('networkidle')
    
    // Verify page change
    await expect(page.locator('.pagination .active')).toContainText('2')
    
    // Verify URL contains page parameter
    const url = page.url()
    expect(url).toContain('page=2')
  })

  test('should maintain filters in URL for deep-linking', async ({ page }) => {
    // Apply multiple filters
    await page.fill('input[placeholder*="Buscar"]', 'test')
    await page.waitForTimeout(500)
    await page.selectOption('select', 'deleted')
    await page.waitForLoadState('networkidle')
    
    // Verify URL contains all filters
    const url = page.url()
    expect(url).toContain('q=test')
    expect(url).toContain('status=deleted')
    
    // Navigate away and back
    await page.goto('/dashboard')
    await page.goto('/rubros?q=test&status=deleted')
    await page.waitForLoadState('networkidle')
    
    // Verify filters are applied
    await expect(page.locator('input[placeholder*="Buscar"]')).toHaveValue('test')
    await expect(page.locator('select')).toHaveValue('deleted')
  })

  test('should filter by parentId from tree selection', async ({ page }) => {
    // This test assumes there's a tree component that can be clicked
    // Click on a parent category in the tree
    const parentCategory = page.locator('.tree-node:has-text("Electrónica")').first()
    await parentCategory.click()
    await page.waitForLoadState('networkidle')
    
    // Verify URL contains parentId
    const url = page.url()
    expect(url).toMatch(/parentId=[a-f0-9-]+/)
    
    // Verify only children are shown
    const rows = page.locator('.data-table tbody tr')
    await expect(rows).toHaveCount.greaterThan(0)
  })

  test('should handle empty results gracefully', async ({ page }) => {
    // Search for non-existent term
    await page.fill('input[placeholder*="Buscar"]', 'nonexistentrubro12345')
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')
    
    // Verify empty state message
    await expect(page.locator('.data-table')).toContainText('No hay rubros creados')
    
    // Verify pagination is hidden or shows 0 results
    await expect(page.locator('.pagination')).toContainText('0')
  })

  test('should sort results by different columns', async ({ page }) => {
    // Click on name column header to sort
    await page.click('.data-table th:has-text("Nombre")')
    await page.waitForLoadState('networkidle')
    
    // Verify URL contains sort parameter
    const url = page.url()
    expect(url).toMatch(/sort=name/)
    
    // Click again to reverse sort
    await page.click('.data-table th:has-text("Nombre")')
    await page.waitForLoadState('networkidle')
    
    expect(url).toMatch(/order=desc/)
  })

  test('should reset filters when clearing search', async ({ page }) => {
    // Apply search filter
    await page.fill('input[placeholder*="Buscar"]', 'test')
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')
    
    // Clear search
    await page.fill('input[placeholder*="Buscar"]', '')
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')
    
    // Verify URL no longer contains search parameter
    const url = page.url()
    expect(url).not.toContain('q=')
  })

  test('should handle rapid filter changes', async ({ page }) => {
    // Rapidly change filters
    await page.fill('input[placeholder*="Buscar"]', 'a')
    await page.fill('input[placeholder*="Buscar"]', 'ab')
    await page.fill('input[placeholder*="Buscar"]', 'abc')
    
    // Wait for debounce and final result
    await page.waitForTimeout(1000)
    await page.waitForLoadState('networkidle')
    
    // Verify final search is applied
    await expect(page.locator('input[placeholder*="Buscar"]')).toHaveValue('abc')
  })

  test('should show loading state during data fetching', async ({ page }) => {
    // Clear any existing filters
    await page.goto('/rubros')
    await page.waitForLoadState('networkidle')
    
    // Apply filter that will trigger new request
    await page.fill('input[placeholder*="Buscar"]', 'loadingtest')
    
    // Verify loading indicator appears
    await expect(page.locator('.loading-spinner')).toBeVisible()
    
    // Wait for loading to complete
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.loading-spinner')).not.toBeVisible()
  })
})
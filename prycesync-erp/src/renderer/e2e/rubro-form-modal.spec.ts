import { test, expect } from '@playwright/test'

test.describe('RubroFormModal E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
    
    // Navigate to rubros page
    await page.goto('/rubros')
    await page.waitForLoadState('networkidle')
  })

  test('should create a root rubro', async ({ page }) => {
    // Click "Nuevo Rubro" button
    await page.click('button:has-text("Nuevo Rubro")')
    
    // Wait for modal to appear
    await expect(page.locator('h2:has-text("Crear Rubro")')).toBeVisible()
    
    // Fill form
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Electrónica')
    
    // Submit form
    await page.click('button:has-text("Crear")')
    
    // Wait for success notification
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
    
    // Verify rubro appears in table
    await expect(page.locator('text=Electrónica')).toBeVisible()
  })

  test('should create a subrubro', async ({ page }) => {
    // First create a parent rubro
    await page.click('button:has-text("Nuevo Rubro")')
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Electrónica')
    await page.click('button:has-text("Crear")')
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
    
    // Find the parent rubro and click "Subrubro" button
    const parentRow = page.locator('tr:has-text("Electrónica")')
    await parentRow.locator('button:has-text("Subrubro")').click()
    
    // Wait for modal to appear with parent pre-selected
    await expect(page.locator('h2:has-text("Crear Rubro")')).toBeVisible()
    
    // Fill form
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Smartphones')
    
    // Verify parent is selected (should show in dropdown)
    const parentSelect = page.locator('select').first()
    await expect(parentSelect).toContainText('Electrónica')
    
    // Submit form
    await page.click('button:has-text("Crear")')
    
    // Wait for success notification
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
    
    // Verify subrubro appears in table
    await expect(page.locator('text=Smartphones')).toBeVisible()
  })

  test('should edit a rubro', async ({ page }) => {
    // First create a rubro
    await page.click('button:has-text("Nuevo Rubro")')
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Electrónica')
    await page.click('button:has-text("Crear")')
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
    
    // Find the rubro and click "Editar" button
    const rubroRow = page.locator('tr:has-text("Electrónica")')
    await rubroRow.locator('button:has-text("Editar")').click()
    
    // Wait for edit modal to appear
    await expect(page.locator('h2:has-text("Editar Rubro")')).toBeVisible()
    
    // Clear and update name
    const nameInput = page.locator('input[placeholder="Ingrese el nombre del rubro"]')
    await nameInput.clear()
    await nameInput.fill('Electrónica Actualizada')
    
    // Submit form
    await page.click('button:has-text("Actualizar")')
    
    // Wait for success notification
    await expect(page.locator('text=Rubro actualizado exitosamente')).toBeVisible()
    
    // Verify updated name appears in table
    await expect(page.locator('text=Electrónica Actualizada')).toBeVisible()
    await expect(page.locator('text=Electrónica')).not.toBeVisible()
  })

  test('should validate name field', async ({ page }) => {
    // Click "Nuevo Rubro" button
    await page.click('button:has-text("Nuevo Rubro")')
    
    // Wait for modal to appear
    await expect(page.locator('h2:has-text("Crear Rubro")')).toBeVisible()
    
    // Try to submit empty form
    await page.click('button:has-text("Crear")')
    
    // Should show validation error
    await expect(page.locator('text=El nombre es requerido')).toBeVisible()
    
    // Try with short name
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'a')
    await page.click('button:has-text("Crear")')
    
    // Should show validation error
    await expect(page.locator('text=El nombre debe tener al menos 2 caracteres')).toBeVisible()
    
    // Try with valid name
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Electrónica')
    await page.click('button:has-text("Crear")')
    
    // Should succeed
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
  })

  test('should prevent duplicate names at same level', async ({ page }) => {
    // Create first rubro
    await page.click('button:has-text("Nuevo Rubro")')
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Electrónica')
    await page.click('button:has-text("Crear")')
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
    
    // Try to create another rubro with same name
    await page.click('button:has-text("Nuevo Rubro")')
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Electrónica')
    await page.click('button:has-text("Crear")')
    
    // Should show error
    await expect(page.locator('text=Ya existe un rubro con ese nombre')).toBeVisible()
  })

  test('should allow same name at different levels', async ({ page }) => {
    // Create parent rubro
    await page.click('button:has-text("Nuevo Rubro")')
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Electrónica')
    await page.click('button:has-text("Crear")')
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
    
    // Create subrubro with same name
    const parentRow = page.locator('tr:has-text("Electrónica")')
    await parentRow.locator('button:has-text("Subrubro")').click()
    
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Electrónica')
    await page.click('button:has-text("Crear")')
    
    // Should succeed (different levels allow same name)
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
  })

  test('should handle parent selection', async ({ page }) => {
    // Create multiple parent rubros
    await page.click('button:has-text("Nuevo Rubro")')
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Electrónica')
    await page.click('button:has-text("Crear")')
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
    
    await page.click('button:has-text("Nuevo Rubro")')
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Ropa')
    await page.click('button:has-text("Crear")')
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
    
    // Create subrubro with parent selection
    await page.click('button:has-text("Nuevo Rubro")')
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Smartphones')
    
    // Select parent from dropdown
    const parentSelect = page.locator('select').first()
    await parentSelect.selectOption({ label: /Electrónica/ })
    
    await page.click('button:has-text("Crear")')
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
  })

  test('should prevent circular references', async ({ page }) => {
    // Create rubro hierarchy
    await page.click('button:has-text("Nuevo Rubro")')
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Electrónica')
    await page.click('button:has-text("Crear")')
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
    
    // Create subrubro
    const parentRow = page.locator('tr:has-text("Electrónica")')
    await parentRow.locator('button:has-text("Subrubro")').click()
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Smartphones')
    await page.click('button:has-text("Crear")')
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
    
    // Try to edit Electrónica and make it a child of Smartphones (circular)
    const electronicsRow = page.locator('tr:has-text("Electrónica")')
    await electronicsRow.locator('button:has-text("Editar")').click()
    
    const parentSelect = page.locator('select').first()
    await parentSelect.selectOption({ label: /Smartphones/ })
    
    await page.click('button:has-text("Actualizar")')
    
    // Should show circular reference error
    await expect(page.locator('text=No se puede crear una referencia circular')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error by creating a rubro with invalid data
    await page.click('button:has-text("Nuevo Rubro")')
    
    // Try to create with very long name (would fail validation)
    const longName = 'a'.repeat(101)
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', longName)
    await page.click('button:has-text("Crear")')
    
    // Should show appropriate error message
    await expect(page.locator('text=Error al crear rubro')).toBeVisible()
  })

  test('should refresh table after successful creation', async ({ page }) => {
    // Create initial rubro
    await page.click('button:has-text("Nuevo Rubro")')
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Electrónica')
    await page.click('button:has-text("Crear")')
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
    
    // Verify table is refreshed
    const table = page.locator('table')
    const rows = table.locator('tbody tr')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('Electrónica')
    
    // Create another rubro
    await page.click('button:has-text("Nuevo Rubro")')
    await page.fill('input[placeholder="Ingrese el nombre del rubro"]', 'Ropa')
    await page.click('button:has-text("Crear")')
    await expect(page.locator('text=Rubro creado exitosamente')).toBeVisible()
    
    // Verify table shows both rubros
    await expect(rows).toHaveCount(2)
  })
})
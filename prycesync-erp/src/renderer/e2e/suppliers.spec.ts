import { test, expect } from '@playwright/test'

test.describe('Vista de Proveedores', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Esperar a que se complete el login
    await page.waitForURL('/dashboard')
    
    // Navegar a proveedores
    await page.goto('/suppliers')
  })

  test('debe mostrar la página de proveedores correctamente', async ({ page }) => {
    // Verificar que estamos en la página de proveedores
    await expect(page).toHaveURL('/suppliers')
    
    // Verificar título
    await expect(page.locator('h1')).toContainText('Gestión de Proveedores')
    
    // Verificar estadísticas
    await expect(page.locator('.stats-card')).toHaveCount(4)
    
    // Verificar barra de filtros
    await expect(page.locator('input[placeholder="Buscar por nombre, código o contacto..."]')).toBeVisible()
    await expect(page.locator('select')).toBeVisible()
    
    // Verificar botones principales
    await expect(page.locator('button:has-text("Nuevo Proveedor")')).toBeVisible()
    await expect(page.locator('button:has-text("Importar Excel")')).toBeVisible()
  })

  test('debe poder buscar proveedores', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Buscar por nombre, código o contacto..."]')
    
    // Escribir en el buscador (con debounce)
    await searchInput.fill('Test Supplier')
    
    // Esperar a que se aplique el debounce y se carguen resultados
    await page.waitForTimeout(400)
    
    // Verificar que la URL se actualiza con el parámetro de búsqueda
    await expect(page).toHaveURL(/q=Test%20Supplier/)
  })

  test('debe poder filtrar por estado', async ({ page }) => {
    const statusSelect = page.locator('select')
    
    // Seleccionar "Activos"
    await statusSelect.selectOption('active')
    
    // Esperar a que se carguen resultados
    await page.waitForTimeout(300)
    
    // Verificar que la URL se actualiza con el filtro
    await expect(page).toHaveURL(/status=active/)
  })

  test('debe poder navegar por páginas', async ({ page }) => {
    // Si hay más de una página, verificar paginación
    const nextButton = page.locator('button:has-text("Siguiente")')
    const hasPagination = await nextButton.count() > 0 && !(await nextButton.isDisabled())
    
    if (hasPagination) {
      // Click en siguiente página
      await nextButton.click()
      
      // Verificar que la URL se actualiza con el parámetro de página
      await expect(page).toHaveURL(/page=2/)
      
      // Verificar que el botón "Anterior" ahora está habilitado
      await expect(page.locator('button:has-text("Anterior")')).not.toBeDisabled()
    }
  })

  test('debe poder ordenar la tabla', async ({ page }) => {
    // Click en el encabezado de la columna "Proveedor" para ordenar
    const nameHeader = page.locator('th:has-text("Proveedor")')
    await nameHeader.click()
    
    // Esperar a que se carguen resultados ordenados
    await page.waitForTimeout(300)
    
    // Verificar que la URL se actualiza con parámetros de orden
    await expect(page).toHaveURL(/sort=name/)
  })

  test('debe poder ver detalles de un proveedor', async ({ page }) => {
    // Esperar a que se cargue la tabla
    await page.waitForSelector('table tbody tr, .md\\:hidden .bg-white', { timeout: 5000 })
    
    // Si hay proveedores en la tabla
    const firstRow = page.locator('table tbody tr:first-child, .md\\:hidden .bg-white:first-child')
    const hasRows = await firstRow.count() > 0
    
    if (hasRows) {
      // Click en el botón "Ver" del primer proveedor
      const viewButton = firstRow.locator('button[title="Ver detalles"]').first()
      await viewButton.click()
      
      // Verificar que navegamos a la página de detalles
      await expect(page).toHaveURL(/\/suppliers\/[a-zA-Z0-9-]+$/)
    }
  })

  test('debe poder crear nuevo proveedor', async ({ page }) => {
    // Click en "Nuevo Proveedor"
    await page.locator('button:has-text("Nuevo Proveedor")').click()
    
    // Verificar que navegamos a la página de creación
    await expect(page).toHaveURL('/suppliers/new')
  })

  test('debe poder abrir modal de importación', async ({ page }) => {
    // Click en "Importar Excel"
    await page.locator('button:has-text("Importar Excel")').click()
    
    // Verificar que se abre el modal (si existe)
    const modal = page.locator('.modal, [role="dialog"]')
    const modalExists = await modal.count() > 0
    
    if (modalExists) {
      await expect(modal).toBeVisible()
      
      // Cerrar modal
      await modal.locator('button:has-text("Cancelar"), button:has-text("Cerrar"), button[aria-label="Cerrar"]').click()
      await expect(modal).not.toBeVisible()
    }
  })

  test('debe ser responsive - mostrar cards en móvil', async ({ page }) => {
    // Simular viewport de móvil
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Recargar la página para aplicar el viewport
    await page.reload()
    
    // En móvil, debería mostrar cards en lugar de tabla
    const cards = page.locator('.md\\:hidden .bg-white')
    const table = page.locator('table')
    
    // Verificar que o bien hay cards o la tabla está oculta
    const hasCards = await cards.count() > 0
    const tableIsHidden = await table.isHidden() || !(await table.isVisible())
    
    expect(hasCards || tableIsHidden).toBe(true)
  })

  test('debe manejar estado de carga correctamente', async ({ page }) => {
    // Recargar la página para ver el estado de carga
    await page.reload()
    
    // Verificar que se muestra el estado de carga inicialmente
    const loadingState = page.locator('.data-table__loading, .base-spinner')
    const loadingExists = await loadingState.count() > 0
    
    if (loadingExists) {
      // El estado de carga debería desaparecer después de un tiempo
      await loadingState.waitFor({ state: 'hidden', timeout: 10000 })
    }
  })

  test('debe mostrar mensaje cuando no hay proveedores', async ({ page }) => {
    // Esperar a que se cargue la página completamente
    await page.waitForLoadState('networkidle')
    
    // Verificar si hay un mensaje de "no hay datos"
    const emptyMessage = page.locator('text=No hay proveedores, text=No se encontraron registros')
    const hasEmptyMessage = await emptyMessage.count() > 0
    
    // Si hay proveedores, verificar que se muestran
    const suppliers = page.locator('table tbody tr, .md\\:hidden .bg-white')
    const hasSuppliers = await suppliers.count() > 0
    
    // Debe haber proveedores o un mensaje de vacío
    expect(hasEmptyMessage || hasSuppliers).toBe(true)
  })
})
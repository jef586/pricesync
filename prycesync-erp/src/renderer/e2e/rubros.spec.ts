import { test, expect } from '@playwright/test'

test.describe('Rubros módulo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button:has-text("Ingresar")')
    await page.waitForURL('**/dashboard')
  })

  test('Expandir árbol y seleccionar rubro', async ({ page }) => {
    await page.goto('/inventory/rubros')
    await page.waitForSelector('.panel__title:text("Rubros")')
    const toggle = page.locator('.base-tree-node__toggle').first()
    if (await toggle.isVisible()) await toggle.click()
    await page.locator('.base-tree-node__row').first().click()
    await expect(page.locator('.data-table__tbody')).toBeVisible()
  })

  test('Filtrar y buscar', async ({ page }) => {
    await page.goto('/inventory/rubros')
    await page.fill('input[placeholder="Buscar"]', 'zzz')
    await page.click('button:has-text("Aplicar")')
    await expect(page.locator('.data-table__tbody tr')).toHaveCount(0)
  })

  test('Paginación', async ({ page }) => {
    await page.goto('/inventory/rubros')
    await page.click('text=Siguiente').catch(() => {})
    await expect(page.locator('.pagination-info')).toBeVisible()
  })

  test('Acciones básicas', async ({ page }) => {
    await page.goto('/inventory/rubros')
    const actions = page.locator('text=Editar')
    await expect(actions.first()).toBeVisible()
  })
})

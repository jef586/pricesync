import { test, expect } from '@playwright/test'

test('Precios & Listas (4) card aparece y abre modal L4', async ({ page }) => {
  await page.goto('/articles')
  await page.waitForSelector('text=Artículos')
  const firstRow = page.locator('table tbody tr').first()
  await firstRow.click()
  await page.waitForSelector('text=Precios & Listas (4)')
  const configurarBtn = page.locator('button:has-text("Configurar")')
  await configurarBtn.click()
  await expect(page.locator('text=Promoción por cantidad')).toBeVisible()
})


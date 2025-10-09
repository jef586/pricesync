import { test, expect } from '@playwright/test'

const BARCODE = '7791234567891'
const MOCK_PRODUCT = {
  id: 'p1',
  name: 'Producto Test',
  sku: BARCODE,
  code: BARCODE,
  barcode: BARCODE,
  salePrice: 1200,
  stockQuantity: 50,
}

async function mockProductRoutes(page) {
  // Exact barcode match
  await page.route('**/api/products?barcode=*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [MOCK_PRODUCT] }),
    })
  })
  // SKU fallback
  await page.route('**/api/products?sku=*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [MOCK_PRODUCT] }),
    })
  })
  // Name search fallback
  await page.route('**/api/products/search*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([MOCK_PRODUCT]),
    })
  })
}

test.describe('POS Barcode scanning', () => {
  test.beforeEach(async ({ page }) => {
    await mockProductRoutes(page)
    await page.goto('/pos')
  })

  test('happy path: 10/10 consecutive scans add to quantity', async ({ page }) => {
    // Ensure cart is empty
    await expect(page.getByText('No hay productos en el carrito')).toBeVisible()

    for (let i = 0; i < 10; i++) {
      await page.keyboard.type(BARCODE, { delay: 5 })
      await page.keyboard.press('Enter')
    }

    // There should be exactly one row with the product code
    const row = page.locator(`tbody tr:has-text("${BARCODE}")`)
    await expect(row).toHaveCount(1)

    // Quantity input (first number input in the row) should be 10
    const qtyInput = row.locator('input[type="number"]').first()
    await expect(qtyInput).toHaveValue('10')
  })

  test('human typing: delay 120ms without Enter does not add', async ({ page }) => {
    // Type barcode slowly without Enter
    await page.keyboard.type(BARCODE, { delay: 120 })

    // Cart remains empty
    await expect(page.getByText('No hay productos en el carrito')).toBeVisible()
  })

  test('accumulation: scanning same barcode 3 times increments quantity', async ({ page }) => {
    await expect(page.getByText('No hay productos en el carrito')).toBeVisible()

    for (let i = 0; i < 3; i++) {
      await page.keyboard.type(BARCODE, { delay: 5 })
      await page.keyboard.press('Enter')
    }

    const row = page.locator(`tbody tr:has-text("${BARCODE}")`)
    await expect(row).toHaveCount(1)
    const qtyInput = row.locator('input[type="number"]').first()
    await expect(qtyInput).toHaveValue('3')
  })

  test('normal input field typing remains unaffected', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Buscar producto por código o nombre"]')
    await expect(searchInput).toBeVisible()
    await searchInput.focus()
    await page.keyboard.type('Nota libre', { delay: 150 })
    await expect(searchInput).toHaveValue('Nota libre')

    // No cart addition while typing
    await expect(page.getByText('No hay productos en el carrito')).toBeVisible()
  })
})
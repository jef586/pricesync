import { describe, it, expect } from 'vitest'
import { PrintingSettingsSchema, defaultPrintingSettings } from '../../src/backend/core/settings/printing.schemas.js'

describe('PrintingSettingsSchema (backend)', () => {
  it('provides sensible defaults', () => {
    expect(defaultPrintingSettings).toMatchObject({
      defaultPrinter: null,
      paperWidth: 80,
      marginTop: 5,
      marginRight: 5,
      marginBottom: 5,
      marginLeft: 5,
      fontSize: 12,
      autoPrintAfterSale: false,
      branchId: null
    })
  })

  it('accepts valid config', () => {
    const payload = {
      defaultPrinter: 'EPSON_TM',
      paperWidth: 58,
      marginTop: 2,
      marginRight: 2,
      marginBottom: 2,
      marginLeft: 2,
      fontSize: 10,
      autoPrintAfterSale: true,
      branchId: 'BR-01'
    }
    const parsed = PrintingSettingsSchema.safeParse(payload)
    expect(parsed.success).toBe(true)
  })

  it('rejects out-of-range values', () => {
    const payload = {
      paperWidth: 200, // too large
      marginTop: -1,
      marginRight: 100,
      marginBottom: 51,
      marginLeft: -5,
      fontSize: 30,
      autoPrintAfterSale: true
    }
    const parsed = PrintingSettingsSchema.safeParse(payload)
    expect(parsed.success).toBe(false)
  })
})
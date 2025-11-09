import { describe, it, expect, vi, beforeEach } from 'vitest'
import SettingsController from '../../src/backend/controllers/SettingsController.js'

// Mock prisma dependency used by controller
vi.mock('../../src/backend/config/database.js', () => {
  const state: any = {
    company: {
      fiscalConfig: {
        printing: {
          default: {
            defaultPrinter: null,
            paperWidth: 80,
            marginTop: 5,
            marginRight: 5,
            marginBottom: 5,
            marginLeft: 5,
            fontSize: 12,
            autoPrintAfterSale: false
          },
          branches: {}
        }
      }
    }
  }
  return {
    default: {
      company: {
        findUnique: vi.fn(async () => state.company),
        update: vi.fn(async ({ data }) => {
          state.company.fiscalConfig = data.fiscalConfig
          return { fiscalConfig: state.company.fiscalConfig }
        })
      },
      $queryRaw: vi.fn(async () => 1)
    }
  }
})

function mockRes() {
  const res: any = {}
  res.statusCode = 200
  res.status = (code: number) => { res.statusCode = code; return res }
  res.jsonPayload = null
  res.json = (payload: any) => { res.jsonPayload = payload; return res }
  return res
}

describe('SettingsController printing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getPrintingSettings returns merged defaults and branchId', async () => {
    const req: any = { user: { company: { id: 'C1' } }, query: { branchId: null } }
    const res = mockRes()
    await SettingsController.getPrintingSettings(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.jsonPayload?.data).toMatchObject({
      defaultPrinter: null,
      paperWidth: 80,
      branchId: null
    })
  })

  it('updatePrintingSettings validates and persists default', async () => {
    const req: any = { user: { company: { id: 'C1' } }, body: {
      defaultPrinter: 'EPSON_TM',
      paperWidth: 58,
      marginTop: 3,
      marginRight: 3,
      marginBottom: 3,
      marginLeft: 3,
      fontSize: 11,
      autoPrintAfterSale: true
    } }
    const res = mockRes()
    await SettingsController.updatePrintingSettings(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.jsonPayload?.data).toMatchObject({
      defaultPrinter: 'EPSON_TM',
      paperWidth: 58,
      branchId: null
    })
  })

  it('updatePrintingSettings applies branch override when branchId provided', async () => {
    const req: any = { user: { company: { id: 'C1' } }, body: {
      branchId: 'BR-007',
      defaultPrinter: 'STAR',
      paperWidth: 80,
      marginTop: 5,
      marginRight: 5,
      marginBottom: 5,
      marginLeft: 5,
      fontSize: 12,
      autoPrintAfterSale: false
    } }
    const res = mockRes()
    await SettingsController.updatePrintingSettings(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.jsonPayload?.data).toMatchObject({
      defaultPrinter: 'STAR',
      paperWidth: 80,
      branchId: 'BR-007'
    })
  })

  it('updatePrintingSettings rejects invalid payload', async () => {
    const req: any = { user: { company: { id: 'C1' } }, body: {
      paperWidth: 200 // invalid
    } }
    const res = mockRes()
    await SettingsController.updatePrintingSettings(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.jsonPayload?.error?.code).toBe('VALIDATION_ERROR')
  })
})
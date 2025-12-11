import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCompanyStore } from '@/stores/company'

// Mock del servicio HTTP preservando el schema real
vi.mock('@/services/companyService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/companyService')>
    ('@/services/companyService')
  return {
    ...actual,
    getCompanyInfo: vi.fn(async () => ({
      commercialName: 'Empresa Test',
      legalName: 'Empresa Test S.A.',
      taxId: '20123456786',
      startDate: '2020-01-01',
      address: 'Calle Falsa 123',
      phone: '1134567890',
      email: 'info@empresa.com',
      contributorType: 'RESPONSABLE_INSCRIPTO',
      posAfip: 1
    })),
    updateCompanyInfo: vi.fn(async (payload: any) => payload)
  }
})

describe('useCompanyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('carga datos iniciales con GET /company/info', async () => {
    const store = useCompanyStore()
    await store.load()
    expect(store.info?.commercialName).toBe('Empresa Test')
    expect(store.error).toBeNull()
  })

  it('valida y guarda datos válidos', async () => {
    const store = useCompanyStore()
    await store.load()
    const draft = {
      ...store.info!,
      email: 'facturacion@empresa.com',
      posAfip: 5
    }
    const isValid = store.validate(draft)
    expect(isValid).toBe(true)
    const updated = await store.save(draft as any)
    expect(updated.email).toBe('facturacion@empresa.com')
    expect(store.info?.posAfip).toBe(5)
  })

  it('rechaza punto de venta fuera de rango', async () => {
    const actual = await vi.importActual<typeof import('@/services/companyService')>
      ('@/services/companyService')
    const { CompanyInfoSchema } = actual
    const invalid = {
      commercialName: 'Emp',
      legalName: 'Emp SA',
      taxId: '20123456786',
      startDate: '2020-01-01',
      address: 'Calle 1',
      phone: '12345678',
      email: 'a@b.com',
      contributorType: 'MONOTRIBUTO',
      posAfip: 0
    }
    const parsed = CompanyInfoSchema.safeParse(invalid)
    expect(parsed.success).toBe(false)
  })
})

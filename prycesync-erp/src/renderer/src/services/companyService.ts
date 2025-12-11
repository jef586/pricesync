import { apiClient } from './api'
import { z } from 'zod'

const normalizeDigits = (s: string) => String(s || '').replace(/[^0-9]/g, '')

function isValidCUIT(input: string): boolean {
  const cuit = normalizeDigits(input)
  if (cuit.length !== 11) return false
  const digits = cuit.split('').map((d) => Number(d))
  if (digits.some((n) => Number.isNaN(n))) return false
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0)
  let dv = 11 - (sum % 11)
  if (dv === 11) dv = 0
  else if (dv === 10) dv = 9
  return dv === digits[10]
}

export const CompanyInfoSchema = z.object({
  commercialName: z.string().min(2, 'Nombre comercial requerido'),
  legalName: z.string().min(2, 'Razón social requerida'),
  taxId: z
    .string()
    .min(11, 'CUIT debe tener 11 dígitos')
    .refine(isValidCUIT, 'CUIT inválido'),
  startDate: z
    .string()
    .refine((v) => {
      const d = new Date(String(v))
      return !Number.isNaN(d.getTime())
    }, 'Fecha inválida'),
  address: z.string().min(3, 'Dirección requerida'),
  phone: z
    .string()
    .min(6, 'Teléfono requerido')
    .refine((v) => /^\d{6,}$/.test(normalizeDigits(v)), 'Teléfono debe ser numérico'),
  email: z.string().email('Email inválido'),
  contributorType: z.enum(['MONOTRIBUTO', 'RESPONSABLE_INSCRIPTO', 'EXENTO', 'CONSUMIDOR_FINAL']),
  posAfip: z.number().int().min(1).max(9999)
})

export type CompanyInfo = z.infer<typeof CompanyInfoSchema>

export async function getCompanyInfo(): Promise<CompanyInfo> {
  const res = await apiClient.get('/company/info')
  const data = res.data?.data || res.data
  const parsed = CompanyInfoSchema.safeParse({
    ...data,
    posAfip: data?.posAfip == null ? 1 : Number(data.posAfip)
  })
  if (!parsed.success) {
    throw new Error('Datos de empresa inválidos')
  }
  return parsed.data
}

export async function updateCompanyInfo(payload: CompanyInfo): Promise<CompanyInfo> {
  const parsed = CompanyInfoSchema.safeParse(payload)
  if (!parsed.success) {
    const msg = parsed.error.errors?.[0]?.message || 'Validación inválida'
    throw new Error(msg)
  }
  const res = await apiClient.put('/company/info', parsed.data)
  const data = res.data?.data || res.data
  const parsedOut = CompanyInfoSchema.safeParse({
    ...data,
    posAfip: data?.posAfip == null ? 1 : Number(data.posAfip)
  })
  if (!parsedOut.success) {
    throw new Error('Respuesta inválida del servidor')
  }
  return parsedOut.data
}


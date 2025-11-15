import axios from 'axios'
import type { Paginated } from '@/types/rubro'
import type { RubroDTO, RubroListParams } from '@/types/rubro'

const rawBase = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.API_URL || 'http://backend:3000'
const base = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`

const api = axios.create({ baseURL: base })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      window.location.href = '/auth'
    }
    return Promise.reject(err)
  }
)

export async function listRubros(params: RubroListParams = {}): Promise<Paginated<RubroDTO>> {
  const { data } = await api.get('/rubros', { params })
  return data.data
}

export async function getRubroTree(): Promise<RubroDTO[]> {
  const { data } = await api.get('/rubros/tree')
  return data.data
}

export async function getRubro(id: string): Promise<RubroDTO> {
  const { data } = await api.get(`/rubros/${id}`)
  return data.data
}

export async function getRubroChildren(parentId: string | null, params: RubroListParams = {}): Promise<Paginated<RubroDTO>> {
  const query = { ...params, parentId }
  const { data } = await api.get('/rubros', { params: query })
  return data.data
}

export async function fetchRubrosList(params: RubroListParams = {}): Promise<Paginated<RubroDTO>> {
  const { data } = await api.get('/rubros', { params })
  return data.data
}

export async function createRubro(payload: Partial<RubroDTO>): Promise<RubroDTO> {
  const { data } = await api.post('/rubros', payload)
  return data.data
}

export async function updateRubro(id: string, payload: Partial<RubroDTO>): Promise<RubroDTO> {
  const { data } = await api.put(`/rubros/${id}`, payload)
  return data.data
}

export async function moveRubro(id: string, newParentId: string | null): Promise<RubroDTO> {
  const { data } = await api.put(`/rubros/${id}/move`, { new_parent_id: newParentId })
  return data.data
}

export async function deleteRubro(id: string): Promise<void> {
  await api.delete(`/rubros/${id}`)
}

export async function restoreRubro(id: string): Promise<RubroDTO> {
  const { data } = await api.post(`/rubros/${id}/restore`)
  return data.data
}

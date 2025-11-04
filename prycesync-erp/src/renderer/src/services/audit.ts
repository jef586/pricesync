import apiClient from './api'

export interface AuditLogItem {
  id: string
  actorId: string | null
  actorName: string | null
  targetId: string | null
  targetName: string | null
  actionType: string
  payloadDiff: any
  companyId: string | null
  ip: string | null
  userAgent: string | null
  createdAt: string
}

export interface AuditQueryParams {
  actorId?: string
  targetId?: string
  actionType?: string
  companyId?: string
  from?: string
  to?: string
  page?: number
  size?: number
}

export interface AuditResponse {
  items: AuditLogItem[]
  pagination: { page: number, size: number, total: number, pages: number }
}

export async function fetchAuditLogs(params: AuditQueryParams): Promise<AuditResponse> {
  const { data } = await apiClient.get('/audit', { params })
  return data
}

export default {
  fetchAuditLogs
}
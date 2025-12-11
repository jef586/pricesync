import { apiClient } from './api'

export interface SetupStatus {
  companyConfigured: boolean
  firstProductCreated: boolean
  supplierConfigured: boolean
  pricingConfigured: boolean
  firstSaleCompleted: boolean
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const res = await apiClient.get('/setup/status')
  const data = res.data?.data || res.data
  const payload: SetupStatus = {
    companyConfigured: Boolean(data?.companyConfigured),
    firstProductCreated: Boolean(data?.firstProductCreated),
    supplierConfigured: Boolean(data?.supplierConfigured),
    pricingConfigured: Boolean(data?.pricingConfigured),
    firstSaleCompleted: Boolean(data?.firstSaleCompleted)
  }
  return payload
}


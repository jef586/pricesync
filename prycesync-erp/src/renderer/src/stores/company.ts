import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type CompanyInfo, getCompanyInfo, updateCompanyInfo, CompanyInfoSchema } from '@/services/companyService'

export const useCompanyStore = defineStore('company', () => {
  const info = ref<CompanyInfo | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const validationErrors = ref<Record<keyof CompanyInfo, string>>({
    commercialName: '',
    legalName: '',
    taxId: '',
    startDate: '',
    address: '',
    phone: '',
    email: '',
    contributorType: '',
    posAfip: '' as any
  } as any)

  async function load() {
    loading.value = true
    error.value = null
    try {
      info.value = await getCompanyInfo()
    } catch (err: any) {
      error.value = err?.message || 'Error cargando datos de empresa'
    } finally {
      loading.value = false
    }
  }

  function validate(draft: Partial<CompanyInfo>): boolean {
    const res = CompanyInfoSchema.safeParse(draft)
    for (const key of Object.keys(validationErrors.value)) {
      validationErrors.value[key as keyof CompanyInfo] = ''
    }
    if (!res.success) {
      for (const issue of res.error.issues) {
        const path = (issue.path?.[0] as keyof CompanyInfo) || null
        if (path) validationErrors.value[path] = issue.message
      }
      return false
    }
    return true
  }

  async function save(draft: CompanyInfo) {
    saving.value = true
    error.value = null
    try {
      const updated = await updateCompanyInfo(draft)
      info.value = updated
      return updated
    } catch (err: any) {
      error.value = err?.message || 'Error guardando datos de empresa'
      throw err
    } finally {
      saving.value = false
    }
  }

  return {
    info,
    loading,
    saving,
    error,
    validationErrors,
    load,
    validate,
    save
  }
})


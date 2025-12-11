import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getPricingSettings,
  updatePricingSettings,
  computePreviewSale,
  type PricingSettings
} from '@/services/settingsService'

export const usePricingStore = defineStore('pricing', () => {
  const isLoading = ref(false)
  const isSaving = ref(false)
  const settings = ref<PricingSettings>({
    defaultMarginPercent: 35,
    priceSource: 'costPrice',
    applyOnImport: true,
    applyOnUpdate: true,
    roundingMode: 'nearest',
    roundingDecimals: 0,
    overwriteSalePrice: false,
    allowBelowCost: false,
    supplierOverrides: {}
  })

  const load = async () => {
    isLoading.value = true
    try {
      const data = await getPricingSettings()
      settings.value = data
      return data
    } finally {
      isLoading.value = false
    }
  }

  const save = async (payload?: Partial<PricingSettings>) => {
    isSaving.value = true
    try {
      const updated = await updatePricingSettings(payload ?? settings.value)
      settings.value = updated
      return updated
    } finally {
      isSaving.value = false
    }
  }

  const previewSale = (costPrice: number, listPrice: number | null, supplierId?: string | null) => {
    return computePreviewSale(costPrice, listPrice, settings.value, supplierId)
  }

  const roundingLabel = computed(() => {
    const m = settings.value.roundingMode
    const d = settings.value.roundingDecimals
    return `${m} (${d} dec.)`
  })

  return {
    isLoading,
    isSaving,
    settings,
    load,
    save,
    previewSale,
    roundingLabel
  }
})


<template>
  <DashboardLayout>
    <div class="pricing-settings-view">
      <PageHeader
        title="Configuración de Pricing"
        subtitle="Define márgenes, fuente de precio y reglas de redondeo"
      >
        <template #actions>
          <BaseButton
            variant="primary"
            :disabled="isSaving || isLoading"
            @click="saveSettings"
          >
            Guardar Cambios
          </BaseButton>
        </template>
      </PageHeader>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Formulario de configuración -->
        <div class="lg:col-span-2 ps-surface rounded-lg shadow border-default p-6">
          <h3 class="text-lg font-medium text-primary mb-4">Reglas Generales</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput
              v-model.number="settings.defaultMarginPercent"
              label="Margen por defecto (%)"
              type="number"
              step="0.01"
              min="0"
            />

            <BaseSelect
              v-model="settings.priceSource"
              label="Fuente de precio"
              :options="priceSourceOptions"
            />

            <BaseSelect
              v-model="settings.roundingMode"
              label="Modo de redondeo"
              :options="roundingModeOptions"
            />

            <BaseInput
              v-model.number="settings.roundingDecimals"
              label="Decimales de redondeo"
              type="number"
              min="0"
              max="4"
            />
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="settings.applyOnImport" />
              <span>Aplicar reglas al importar productos</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="settings.applyOnUpdate" />
              <span>Aplicar reglas al actualizar productos</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="settings.overwriteSalePrice" />
              <span>Sobre-escribir precio de venta existente</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="settings.allowBelowCost" />
              <span>Permitir precio por debajo del costo</span>
            </label>
          </div>

          <!-- Overrides por proveedor -->
          <div class="mt-8">
            <h3 class="text-lg font-medium text-primary">Overrides por proveedor</h3>
            <p class="text-sm text-secondary mb-4">Define márgenes específicos que sobrescriben el margen por defecto.</p>

            <div class="space-y-4">
              <div
                v-for="(row, idx) in overridesRows"
                :key="idx"
                class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
              >
                <div class="md:col-span-6">
                  <EntitySelector
                    label="Proveedor"
                    :options="suppliers"
                    :model-value="row.supplierId"
                    value-field="id"
                    label-field="name"
                    secondary-field="code"
                    :searchable="true"
                    :clearable="true"
                    @update:model-value="val => handleSupplierSelect(idx, val)"
                  />
                </div>
                <div class="md:col-span-4">
                  <BaseInput
                    v-model.number="row.marginPercent"
                    label="Margen (%)"
                    type="number"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div class="md:col-span-2">
                  <BaseButton variant="ghost" @click="removeOverrideRow(idx)">Eliminar</BaseButton>
                </div>
              </div>

              <BaseButton variant="secondary" @click="addOverrideRow">Agregar proveedor</BaseButton>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="ps-surface rounded-lg shadow border-default p-6">
          <h3 class="text-lg font-medium text-primary mb-4">Preview de Cálculo</h3>
          <div class="space-y-4">
            <EntitySelector
              label="Proveedor (opcional)"
              :options="suppliers"
              :model-value="selectedPreviewSupplierId"
              value-field="id"
              label-field="name"
              secondary-field="code"
              :searchable="true"
              :clearable="true"
              @update:model-value="val => selectedPreviewSupplierId = typeof val === 'object' ? val?.id : val"
            />
            <BaseInput
              v-model.number="previewCost"
              label="Costo"
              type="number"
              step="0.01"
              min="0"
            />
            <BaseInput
              v-model.number="previewList"
              label="Precio Lista (opcional)"
              type="number"
              step="0.01"
              min="0"
            />

            <div class="mt-2 p-4 ps-surface border-default rounded">
              <p class="text-sm text-secondary">Precio de Venta calculado:</p>
              <p class="text-2xl font-semibold text-primary">${{ formatCurrency(previewSale) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
  
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import EntitySelector from '@/components/molecules/EntitySelector.vue'
import { useNotifications } from '@/composables/useNotifications'
import { 
  getPricingSettings, 
  updatePricingSettings, 
  computePreviewSale, 
  type PricingSettings 
} from '@/services/settingsService'
import { useSuppliers } from '@/composables/useSuppliers'

const { success, error } = useNotifications()
const router = useRouter()

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

const priceSourceOptions = [
  { value: 'costPrice', label: 'Costo' },
  { value: 'listPrice', label: 'Precio Lista' }
]

const roundingModeOptions = [
  { value: 'nearest', label: 'Más Cercano' },
  { value: 'up', label: 'Hacia Arriba' },
  { value: 'down', label: 'Hacia Abajo' }
]

// Preview state
const previewCost = ref(100)
const previewList = ref<number | null>(null)
let selectedPreviewSupplierId = ref<string | null>(null)
const previewSale = computed(() => {
  return computePreviewSale(
    previewCost.value || 0,
    previewList.value,
    settings.value,
    selectedPreviewSupplierId.value
  )
})

function formatCurrency(value: number) {
  return (value || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

async function loadSettings() {
  isLoading.value = true
  try {
    const data = await getPricingSettings()
    settings.value = data
    // Hidratar filas de overrides desde settings
    const entries = Object.entries(settings.value.supplierOverrides || {})
    overridesRows.value = entries.map(([supplierId, conf]: [string, any]) => ({
      supplierId,
      marginPercent: Number(conf?.marginPercent ?? 0)
    }))
  } catch (e) {
    console.error('Error loading pricing settings', e)
    error('No se pudieron cargar los settings de pricing')
  } finally {
    isLoading.value = false
  }
}

async function saveSettings() {
  isSaving.value = true
  try {
    // Persistir overrides desde filas
    const overridesObj: Record<string, { marginPercent: number }> = {}
    for (const row of overridesRows.value) {
      const sid = String(row.supplierId || '')
      const mp = Number(row.marginPercent)
      if (sid && !Number.isNaN(mp) && mp >= 0) {
        overridesObj[sid] = { marginPercent: mp }
      }
    }
    settings.value.supplierOverrides = overridesObj

    const updated = await updatePricingSettings(settings.value)
    settings.value = updated
    success('Configuración guardada correctamente')
    router.push('/company')
  } catch (e) {
    console.error('Error saving pricing settings', e)
    error('No se pudo guardar la configuración')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  // Cargar settings y proveedores
  loadSettings()
  fetchSuppliers({ limit: 100, sortBy: 'name', sortOrder: 'asc' })
})

// --- Overrides por proveedor ---
type OverrideRow = { supplierId: string | null; marginPercent: number }
const overridesRows = ref<OverrideRow[]>([])

// Proveedores para selector
const { suppliers, fetchSuppliers } = useSuppliers()

function addOverrideRow() {
  overridesRows.value.push({ supplierId: null, marginPercent: Number(settings.value.defaultMarginPercent || 0) })
}

function removeOverrideRow(index: number) {
  overridesRows.value.splice(index, 1)
}

function handleSupplierSelect(index: number, val: any) {
  const selectedId = typeof val === 'object' ? val?.id : val
  if (!selectedId) {
    overridesRows.value[index].supplierId = null
    return
  }
  // Evitar duplicados
  const existsAt = overridesRows.value.findIndex((r, i) => i !== index && r.supplierId === selectedId)
  if (existsAt !== -1) {
    error('Ese proveedor ya tiene un override definido')
    return
  }
  overridesRows.value[index].supplierId = selectedId
}
</script>

<style scoped>
.pricing-settings-view {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
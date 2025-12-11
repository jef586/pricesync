<template>
  <div class="checklist-card">
    <div class="checklist-header">
      <h2 class="checklist-title">Setup inicial</h2>
      <div class="checklist-progress" v-if="loaded">
        <span class="progress-label">{{ completedCount }}/5</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${completionPct}%` }"></div>
        </div>
      </div>
    </div>

    <div v-if="error" class="checklist-error">
      <ExclamationTriangleIcon class="w-5 h-5" />
      <span>No se pudo cargar el estado de configuración</span>
    </div>

    <ul v-else class="checklist-list">
      <li class="checklist-item">
        <component :is="flagIcon(status.companyConfigured)" class="icon" />
        <div class="item-content">
          <div class="item-title">Empresa configurada</div>
          <div class="item-desc">Datos fiscales y comerciales completos</div>
        </div>
        <BaseBadge :variant="status.companyConfigured ? 'success' : 'neutral'">{{ status.companyConfigured ? 'Completado' : 'Pendiente' }}</BaseBadge>
      </li>
      <li class="checklist-item">
        <component :is="flagIcon(status.firstProductCreated)" class="icon" />
        <div class="item-content">
          <div class="item-title">Primer producto creado</div>
          <div class="item-desc">Al menos un artículo en inventario</div>
        </div>
        <BaseBadge :variant="status.firstProductCreated ? 'success' : 'neutral'">{{ status.firstProductCreated ? 'Completado' : 'Pendiente' }}</BaseBadge>
      </li>
      <li class="checklist-item">
        <component :is="flagIcon(status.supplierConfigured)" class="icon" />
        <div class="item-content">
          <div class="item-title">Proveedor configurado</div>
          <div class="item-desc">Proveedor con productos o importación realizada</div>
        </div>
        <BaseBadge :variant="status.supplierConfigured ? 'success' : 'neutral'">{{ status.supplierConfigured ? 'Completado' : 'Pendiente' }}</BaseBadge>
      </li>
      <li class="checklist-item">
        <component :is="flagIcon(status.pricingConfigured)" class="icon" />
        <div class="item-content">
          <div class="item-title">Pricing configurado</div>
          <div class="item-desc">Margen, fuente de precio y redondeo definidos</div>
        </div>
        <BaseBadge :variant="status.pricingConfigured ? 'success' : 'neutral'">{{ status.pricingConfigured ? 'Completado' : 'Pendiente' }}</BaseBadge>
      </li>
      <li class="checklist-item">
        <component :is="flagIcon(status.firstSaleCompleted)" class="icon" />
        <div class="item-content">
          <div class="item-title">Primera venta realizada</div>
          <div class="item-desc">Existe factura emitida (no borrador)</div>
        </div>
        <BaseBadge :variant="status.firstSaleCompleted ? 'success' : 'neutral'">{{ status.firstSaleCompleted ? 'Completado' : 'Pendiente' }}</BaseBadge>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { getSetupStatus, type SetupStatus } from '@/services/setupService'

const status = ref<SetupStatus>({
  companyConfigured: false,
  firstProductCreated: false,
  supplierConfigured: false,
  pricingConfigured: false,
  firstSaleCompleted: false
})

const error = ref<string | null>(null)
const loaded = ref(false)

const completedCount = computed(() => {
  const s = status.value
  return [s.companyConfigured, s.firstProductCreated, s.supplierConfigured, s.pricingConfigured, s.firstSaleCompleted].filter(Boolean).length
})
const completionPct = computed(() => Math.round((completedCount.value / 5) * 100))

const flagIcon = (ok: boolean) => ok ? CheckCircleIcon : ClockIcon

onMounted(async () => {
  try {
    const data = await getSetupStatus()
    status.value = data
    loaded.value = true
  } catch (e: any) {
    error.value = 'Error cargando estado'
  }
})
</script>

<style scoped>
.checklist-card { background: var(--ps-card); border: var(--ps-border-width) solid var(--ps-border); border-radius: .75rem; padding: 1rem; margin-bottom: 1rem; }
.checklist-header { display:flex; align-items:center; justify-content:space-between; margin-bottom: .5rem; }
.checklist-title { font-weight: 600; color: var(--ps-text-primary); }
.checklist-progress { display:flex; align-items:center; gap:.5rem; }
.progress-label { font-size:.75rem; color: var(--ps-text-secondary); }
.progress-bar { width: 120px; height: 8px; background: color-mix(in srgb, var(--ps-bg) 10%, var(--ps-card)); border-radius: 9999px; overflow:hidden; border: var(--ps-border-width) solid var(--ps-border); }
.progress-fill { height: 100%; background: var(--ps-primary); }
.checklist-error { display:flex; align-items:center; gap:.5rem; color: var(--ps-warning-contrast, #552); background: color-mix(in srgb, var(--ps-warning) 15%, var(--ps-card)); border: var(--ps-border-width) solid color-mix(in srgb, var(--ps-warning) 70%, var(--ps-border)); border-radius:.5rem; padding:.5rem; }
.checklist-list { display:flex; flex-direction:column; gap:.5rem; }
.checklist-item { display:flex; align-items:center; gap:.75rem; padding:.5rem; border-radius:.5rem; }
.checklist-item:hover { background: color-mix(in srgb, var(--ps-bg) 6%, transparent); }
.item-content { flex:1; }
.item-title { font-size:.875rem; font-weight:600; color: var(--ps-text-primary); }
.item-desc { font-size:.75rem; color: var(--ps-text-secondary); }
.icon { width: 20px; height: 20px; color: var(--ps-text-secondary); }
</style>


<template>
  <div class="revenue-chart">
    <div class="chart-header mb-4">
      <h3 class="chart-title">{{ title }}</h3>
      <div class="flex space-x-2">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="$emit('period-change', period.value)"
          :class="[
            'period-button',
            selectedPeriod === period.value ? 'is-selected' : ''
          ]"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 loading-spinner"></div>
      <span class="ml-2 loading-text">Cargando datos...</span>
    </div>

    <div v-else-if="error" class="flex justify-center items-center h-64 error-text">
      <div class="text-center">
        <div class="text-2xl mb-2">⚠️</div>
        <p>{{ error }}</p>
        <button 
          @click="$emit('retry')"
          class="mt-2 retry-link"
        >
          Reintentar
        </button>
      </div>
    </div>

    <!-- Resumen de métricas -->
    <div v-else-if="summary" class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div class="text-sm text-blue-600 font-medium">Total</div>
          <div class="text-2xl font-bold text-blue-900">
            {{ formatCurrency(summary.total) }}
          </div>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div class="text-sm text-green-600 font-medium">Promedio</div>
          <div class="text-2xl font-bold text-green-900">
            {{ formatCurrency(summary.average) }}
          </div>
        </div>
        <div class="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div class="text-sm text-purple-600 font-medium">Crecimiento</div>
          <div :class="[
            'text-2xl font-bold',
            summary.growth >= 0 ? 'text-green-600' : 'text-red-600'
          ]">
            {{ summary.growth >= 0 ? '+' : '' }}{{ summary.growth.toFixed(1) }}%
          </div>
        </div>
        <div class="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div class="text-sm text-orange-600 font-medium">Mejor Mes</div>
          <div class="text-2xl font-bold text-orange-900">
            {{ formatCurrency(summary.peak) }}
          </div>
        </div>
      </div>

      <!-- Tabla de datos detallados -->
      <div v-if="data && data.labels && data.datasets" class="mt-6">
        <h4 class="table-title">Detalle por Período</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full revenue-table">
            <thead class="revenue-thead">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium table-th">
                  Período
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium table-th">
                  Ingresos
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium table-th">
                  Variación
                </th>
              </tr>
            </thead>
            <tbody class="revenue-tbody">
              <tr 
                v-for="(label, index) in data.labels" 
                :key="index"
                class="table-row"
              >
                <td class="px-4 py-3 text-sm font-medium table-td">
                  {{ label }}
                </td>
                <td class="px-4 py-3 text-sm table-td text-right">
                  {{ formatCurrency(data.datasets[0].data[index]) }}
                </td>
                <td class="px-4 py-3 text-sm text-right">
                  <span v-if="index > 0" :class="[
                    'variation-badge',
                    getVariationClass(data.datasets[0].data[index], data.datasets[0].data[index - 1])
                  ]">
                    {{ getVariationText(data.datasets[0].data[index], data.datasets[0].data[index - 1]) }}
                  </span>
                  <span v-else class="variation-empty">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 empty-text">
      No hay datos disponibles para mostrar
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import reportsService from '../../services/reportsService'

interface RevenueData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    fill: boolean
    tension: number
  }[]
}

interface ChartSummary {
  total: number
  average: number
  growth: number
  peak: number
}

interface Props {
  title?: string
  selectedPeriod?: string
  loading?: boolean
  error?: string | null
  data?: RevenueData | null
  summary?: ChartSummary | null
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Ingresos por Período',
  selectedPeriod: 'month',
  loading: false,
  error: null,
  data: null,
  summary: null
})

const emit = defineEmits<{
  'period-change': [period: string]
  'retry': []
}>()

const periods = [
  { value: 'week', label: '7 días' },
  { value: 'month', label: '30 días' },
  { value: 'quarter', label: '3 meses' },
  { value: 'year', label: '12 meses' }
]

const formatCurrency = (amount: number): string => {
  return reportsService.formatCurrency(amount)
}

const getVariationClass = (current: number, previous: number): string => {
  const variation = ((current - previous) / previous) * 100
  if (variation > 0) return 'positive'
  if (variation < 0) return 'negative'
  return 'neutral'
}

const getVariationText = (current: number, previous: number): string => {
  const variation = ((current - previous) / previous) * 100
  const sign = variation >= 0 ? '+' : ''
  return `${sign}${variation.toFixed(1)}%`
}
</script>

<style scoped>
.revenue-chart {
  background: var(--ps-card);
  border: var(--ps-border-width) solid var(--ps-border);
  border-radius: var(--ps-radius-lg);
  box-shadow: var(--ps-shadow-sm);
  padding: 1.5rem;
}

.chart-header { display: flex; justify-content: space-between; align-items: center; }
.chart-title { color: var(--ps-text-primary); font-weight: 600; font-size: 1.125rem; }

.period-button { padding: 0.5rem 0.75rem; font-size: 0.875rem; border-radius: var(--ps-radius-md); transition: color .2s ease, background .2s ease, border-color .2s ease; color: var(--ps-text-secondary); }
.period-button:hover { color: var(--ps-text-primary); background: color-mix(in srgb, var(--ps-primary) 6%, transparent); }
.period-button.is-selected { background: color-mix(in srgb, var(--ps-primary) 14%, transparent); color: var(--ps-primary); border: var(--ps-border-width) solid var(--ps-primary); }

.loading-spinner { border-bottom-color: var(--ps-primary); }
.loading-text { color: var(--ps-text-secondary); }
.error-text { color: var(--ps-error); }
.retry-link { color: var(--ps-primary); text-decoration: underline; }

.table-title { font-size: 1rem; font-weight: 600; color: var(--ps-text-primary); margin-bottom: 0.75rem; }
.revenue-table { background: var(--ps-card); border: var(--ps-border-width) solid var(--ps-border); border-radius: var(--ps-radius-lg); overflow: hidden; }
.revenue-thead { background: color-mix(in srgb, var(--ps-primary) 6%, transparent); }
.table-th { color: var(--ps-text-secondary); text-transform: uppercase; letter-spacing: 0.03em; }
.revenue-tbody { border-top: var(--ps-border-width) solid var(--ps-border); }
.table-row:hover { background: color-mix(in srgb, var(--ps-primary) 6%, transparent); }
.table-td { color: var(--ps-text-primary); }

.variation-badge { display: inline-flex; align-items: center; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
.variation-badge.positive { background: color-mix(in srgb, var(--ps-success) 15%, transparent); color: var(--ps-success); }
.variation-badge.negative { background: color-mix(in srgb, var(--ps-error) 15%, transparent); color: var(--ps-error); }
.variation-badge.neutral { background: color-mix(in srgb, var(--ps-text-secondary) 15%, transparent); color: var(--ps-text-secondary); }
.variation-empty { color: var(--ps-text-secondary); opacity: 0.7; font-size: 0.75rem; }

.empty-text { color: var(--ps-text-secondary); }

@media (max-width: 768px) {
  .chart-header { flex-direction: column; gap: 0.75rem; align-items: flex-start; }
}
</style>
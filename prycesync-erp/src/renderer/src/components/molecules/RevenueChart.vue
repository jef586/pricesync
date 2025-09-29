<template>
  <div class="revenue-chart">
    <div class="chart-header mb-4">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <div class="flex space-x-2">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="$emit('period-change', period.value)"
          :class="[
            'px-3 py-1 text-sm rounded-md transition-colors',
            selectedPeriod === period.value
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          ]"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">Cargando datos...</span>
    </div>

    <div v-else-if="error" class="flex justify-center items-center h-64 text-red-600">
      <div class="text-center">
        <div class="text-2xl mb-2">⚠️</div>
        <p>{{ error }}</p>
        <button 
          @click="$emit('retry')"
          class="mt-2 text-blue-600 hover:text-blue-800 underline"
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
        <h4 class="text-md font-semibold text-gray-900 mb-3">Detalle por Período</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingresos
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variación
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr 
                v-for="(label, index) in data.labels" 
                :key="index"
                class="hover:bg-gray-50"
              >
                <td class="px-4 py-3 text-sm font-medium text-gray-900">
                  {{ label }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 text-right">
                  {{ formatCurrency(data.datasets[0].data[index]) }}
                </td>
                <td class="px-4 py-3 text-sm text-right">
                  <span v-if="index > 0" :class="[
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    getVariationClass(data.datasets[0].data[index], data.datasets[0].data[index - 1])
                  ]">
                    {{ getVariationText(data.datasets[0].data[index], data.datasets[0].data[index - 1]) }}
                  </span>
                  <span v-else class="text-gray-400 text-xs">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 text-gray-500">
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
  if (variation > 0) {
    return 'bg-green-100 text-green-800'
  } else if (variation < 0) {
    return 'bg-red-100 text-red-800'
  }
  return 'bg-gray-100 text-gray-800'
}

const getVariationText = (current: number, previous: number): string => {
  const variation = ((current - previous) / previous) * 100
  const sign = variation >= 0 ? '+' : ''
  return `${sign}${variation.toFixed(1)}%`
}
</script>

<style scoped>
.revenue-chart {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.chart-header {
  @apply flex justify-between items-center;
}

@media (max-width: 768px) {
  .chart-header {
    @apply flex-col space-y-3 items-start;
  }
}
</style>
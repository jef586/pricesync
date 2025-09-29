<template>
  <div class="invoice-status-chart">
    <div class="chart-header mb-4">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
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

    <!-- Vista de métricas por estado -->
    <div v-else-if="data && Object.keys(data).length > 0" class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div 
          v-for="(count, status) in data" 
          :key="status"
          :class="[
            'p-4 rounded-lg border-2 transition-all hover:shadow-md',
            getStatusStyle(status)
          ]"
        >
          <div class="flex items-center justify-between">
            <div>
              <div :class="['text-sm font-medium', getStatusTextColor(status)]">
                {{ getStatusLabel(status) }}
              </div>
              <div class="text-2xl font-bold text-gray-900 mt-1">
                {{ count }}
              </div>
              <div class="text-xs text-gray-600">
                {{ count === 1 ? 'factura' : 'facturas' }}
              </div>
            </div>
            <div :class="['w-3 h-3 rounded-full', getStatusDotColor(status)]"></div>
          </div>
        </div>
      </div>

      <!-- Resumen total -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex justify-between items-center">
          <span class="font-medium text-gray-900">Total de Facturas:</span>
          <span class="text-xl font-bold text-gray-900">{{ totalInvoices }}</span>
        </div>
        <div class="mt-2 text-sm text-gray-600">
          Distribución de estados de facturación
        </div>
      </div>

      <!-- Tabla detallada -->
      <div class="mt-6">
        <h4 class="text-md font-semibold text-gray-900 mb-3">Detalle por Estado</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Porcentaje
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr 
                v-for="(count, status) in data" 
                :key="status"
                class="hover:bg-gray-50"
              >
                <td class="px-4 py-3 text-sm font-medium text-gray-900">
                  <div class="flex items-center">
                    <div :class="['w-3 h-3 rounded-full mr-3', getStatusDotColor(status)]"></div>
                    {{ getStatusLabel(status) }}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 text-right">
                  {{ count }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 text-right">
                  {{ getPercentage(count) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 text-gray-500">
      No hay datos de facturas disponibles
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface InvoiceStatusData {
  [key: string]: number
}

interface Props {
  title?: string
  loading?: boolean
  error?: string | null
  data?: InvoiceStatusData | null
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Estado de Facturas',
  loading: false,
  error: null,
  data: null
})

const emit = defineEmits<{
  'retry': []
}>()

// Mapeo de estados a etiquetas en español
const statusLabels: Record<string, string> = {
  // Versiones en minúsculas (del backend)
  'draft': 'Borrador',
  'pending': 'Pendiente',
  'sent': 'Enviada',
  'paid': 'Pagada',
  'cancelled': 'Cancelada',
  'overdue': 'Vencida',
  // Versiones en mayúsculas (compatibilidad)
  'DRAFT': 'Borrador',
  'PENDING': 'Pendiente',
  'SENT': 'Enviada',
  'PAID': 'Pagada',
  'CANCELLED': 'Cancelada',
  'OVERDUE': 'Vencida'
}

const totalInvoices = computed(() => {
  if (!props.data) return 0
  return Object.values(props.data).reduce((sum, count) => sum + count, 0)
})

const getStatusLabel = (status: string): string => {
  return statusLabels[status] || status
}

const getStatusStyle = (status: string): string => {
  const styles: Record<string, string> = {
    'draft': 'bg-gray-50 border-gray-200',
    'pending': 'bg-yellow-50 border-yellow-200',
    'sent': 'bg-blue-50 border-blue-200',
    'paid': 'bg-green-50 border-green-200',
    'cancelled': 'bg-red-50 border-red-200',
    'overdue': 'bg-red-100 border-red-300',
    // Versiones en mayúsculas
    'DRAFT': 'bg-gray-50 border-gray-200',
    'PENDING': 'bg-yellow-50 border-yellow-200',
    'SENT': 'bg-blue-50 border-blue-200',
    'PAID': 'bg-green-50 border-green-200',
    'CANCELLED': 'bg-red-50 border-red-200',
    'OVERDUE': 'bg-red-100 border-red-300'
  }
  return styles[status] || 'bg-gray-50 border-gray-200'
}

const getStatusTextColor = (status: string): string => {
  const colors: Record<string, string> = {
    'draft': 'text-gray-600',
    'pending': 'text-yellow-600',
    'sent': 'text-blue-600',
    'paid': 'text-green-600',
    'cancelled': 'text-red-600',
    'overdue': 'text-red-700',
    // Versiones en mayúsculas
    'DRAFT': 'text-gray-600',
    'PENDING': 'text-yellow-600',
    'SENT': 'text-blue-600',
    'PAID': 'text-green-600',
    'CANCELLED': 'text-red-600',
    'OVERDUE': 'text-red-700'
  }
  return colors[status] || 'text-gray-600'
}

const getStatusDotColor = (status: string): string => {
  const colors: Record<string, string> = {
    'draft': 'bg-gray-400',
    'pending': 'bg-yellow-400',
    'sent': 'bg-blue-400',
    'paid': 'bg-green-400',
    'cancelled': 'bg-red-400',
    'overdue': 'bg-red-600',
    // Versiones en mayúsculas
    'DRAFT': 'bg-gray-400',
    'PENDING': 'bg-yellow-400',
    'SENT': 'bg-blue-400',
    'PAID': 'bg-green-400',
    'CANCELLED': 'bg-red-400',
    'OVERDUE': 'bg-red-600'
  }
  return colors[status] || 'bg-gray-400'
}

const getPercentage = (count: number): string => {
  if (totalInvoices.value === 0) return '0'
  return ((count / totalInvoices.value) * 100).toFixed(1)
}
</script>

<style scoped>
.invoice-status-chart {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.chart-header {
  @apply flex justify-between items-center;
}

@media (max-width: 768px) {
  .invoice-status-chart {
    @apply p-4;
  }
}
</style>
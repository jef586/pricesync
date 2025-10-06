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
            <tbody class="invoice-tbody">
              <tr 
                v-for="(count, status) in data" 
                :key="status"
                class="table-row"
              >
                <td class="px-4 py-3 text-sm font-medium text-gray-900">
                  <div class="flex items-center">
                    <div :class="['status-dot', getStatusDotClass(status)]"></div>
                    {{ getStatusLabel(status) }}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm table-td text-right">
                  {{ count }}
                </td>
                <td class="px-4 py-3 text-sm table-td text-right">
                  {{ getPercentage(count) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 empty-text">
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

// Color de texto por estado (usado en el template)
const getStatusTextColor = (status: string): string => {
  const map: Record<string, string> = {
    draft: 'text-gray-700',
    pending: 'text-yellow-700',
    sent: 'text-blue-700',
    paid: 'text-green-700',
    cancelled: 'text-red-700',
    overdue: 'text-red-700',
    // Mayúsculas
    DRAFT: 'text-gray-700',
    PENDING: 'text-yellow-700',
    SENT: 'text-blue-700',
    PAID: 'text-green-700',
    CANCELLED: 'text-red-700',
    OVERDUE: 'text-red-700'
  }
  return map[status] || 'text-gray-700'
}

const getStatusDotClass = (status: string): string => {
  const map: Record<string, string> = {
    draft: 'draft',
    pending: 'pending',
    sent: 'sent',
    paid: 'paid',
    cancelled: 'cancelled',
    overdue: 'overdue',
    // Mayúsculas
    DRAFT: 'draft',
    PENDING: 'pending',
    SENT: 'sent',
    PAID: 'paid',
    CANCELLED: 'cancelled',
    OVERDUE: 'overdue'
  }
  return map[status] || 'draft'
}

// Color de fondo de indicador por estado (usado en el template)
const getStatusDotColor = (status: string): string => {
  const map: Record<string, string> = {
    draft: 'bg-gray-400',
    pending: 'bg-yellow-500',
    sent: 'bg-blue-500',
    paid: 'bg-green-500',
    cancelled: 'bg-red-500',
    overdue: 'bg-red-600',
    // Mayúsculas
    DRAFT: 'bg-gray-400',
    PENDING: 'bg-yellow-500',
    SENT: 'bg-blue-500',
    PAID: 'bg-green-500',
    CANCELLED: 'bg-red-500',
    OVERDUE: 'bg-red-600'
  }
  return map[status] || 'bg-gray-400'
}

const getPercentage = (count: number): string => {
  if (totalInvoices.value === 0) return '0'
  return ((count / totalInvoices.value) * 100).toFixed(1)
}
</script>

<style scoped>
.invoice-status-chart {
  background: var(--ps-card);
  border: var(--ps-border-width) solid var(--ps-border);
  border-radius: var(--ps-radius-lg);
  box-shadow: var(--ps-shadow-sm);
  padding: 1.5rem;
}

.chart-header { display: flex; justify-content: space-between; align-items: center; }

.invoice-tbody { border-top: var(--ps-border-width) solid var(--ps-border); }
.table-row:hover { background: color-mix(in srgb, var(--ps-primary) 6%, transparent); }
.table-td { color: var(--ps-text-primary); }
.empty-text { color: var(--ps-text-secondary); }

.status-dot { width: 0.75rem; height: 0.75rem; border-radius: 9999px; margin-right: 0.75rem; }
.status-dot.draft { background: var(--ps-text-secondary); }
.status-dot.pending { background: var(--ps-warning); }
.status-dot.sent { background: var(--ps-primary); }
.status-dot.paid { background: var(--ps-success); }
.status-dot.cancelled { background: var(--ps-error); }
.status-dot.overdue { background: var(--ps-error); filter: saturate(1.2); }

@media (max-width: 768px) {
  .invoice-status-chart { padding: 1rem; }
}
</style>
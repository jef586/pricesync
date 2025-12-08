<template>
  <DashboardLayout>
    <div class="sales-view">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Ventas</h1>
          <p class="text-gray-600 dark:text-gray-300">Listado de ventas registradas</p>
        </div>
      </div>

      <FilterBar
        v-model="filters"
        :status-options="statusOptions"
        search-placeholder="Buscar por cliente o ID"
        @filter-change="applyFilters"
        @search="debouncedSearch"
        class="mb-6"
      />

      <DataTable
        :data="rows"
        :columns="tableColumns"
        :loading="loading"
        :paginated="true"
        :page-size="filters.limit"
        :show-header="false"
        @row-click="handleRowClick"
      >
        <template #cell-id="{ item }">
          <div class="font-mono text-sm">{{ item.id }}</div>
        </template>
        <template #cell-customer="{ item }">
          <div>
            <div class="font-medium">{{ item.customer?.name || item.customerName || '—' }}</div>
            <div class="text-xs text-gray-500">{{ item.customer?.taxId || '—' }}</div>
          </div>
        </template>
        <template #cell-subtotal="{ item }">
          <div class="text-right">{{ fmt(item.subtotal) }}</div>
        </template>
        <template #cell-total="{ item }">
          <div class="text-right font-semibold">{{ fmt(item.total) }}</div>
        </template>
        <template #cell-status="{ item }">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{{ item.status }}</span>
        </template>
        <template #cell-createdAt="{ item }">
          <div class="text-sm">{{ formatDate(item.createdAt) }}</div>
        </template>
        <template #actions="{ item }">
          <div class="flex items-center gap-2">
            <BaseButton variant="ghost" size="sm" @click.stop="goDetail(item.id)">Ver</BaseButton>
          </div>
        </template>
      </DataTable>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import FilterBar from '@/components/molecules/FilterBar.vue'
import DataTable from '@/components/atoms/DataTable.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import { apiClient } from '@/services/api'

const router = useRouter()
const rows = ref<any[]>([])
const loading = ref(false)
const lastEndpointUsed = ref<'sales' | 'invoices' | null>(null)
const filters = ref({
  search: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc'
})
const statusOptions = [
  { value: 'draft', label: 'Borrador' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' }
]
const tableColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'customer', label: 'Cliente', sortable: false },
  { key: 'subtotal', label: 'Subtotal', sortable: true, class: 'text-right' },
  { key: 'total', label: 'Total', sortable: true, class: 'text-right' },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'createdAt', label: 'Fecha', sortable: true }
]

function fmt(n: number) { return (Number(n || 0)).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) }
function formatDate(d: any) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleString('es-AR') }
function goDetail(id: string) {
  const base = lastEndpointUsed.value === 'invoices' ? '/invoices' : '/sales'
  router.push(`${base}/${id}`)
}

async function load() {
  loading.value = true
  try {
    const baseQ = new URLSearchParams()
    Object.entries(filters.value).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') baseQ.set(k, String(v))
    })
    baseQ.set('size', String(filters.value.limit))
    const qVariants: string[] = []
    qVariants.push(baseQ.toString())
    const q2 = new URLSearchParams(baseQ.toString())
    q2.delete('size')
    q2.set('pageSize', String(filters.value.limit))
    qVariants.push(q2.toString())
    const q3 = new URLSearchParams()
    q3.set('page', String(filters.value.page))
    q3.set('limit', String(filters.value.limit))
    qVariants.push(q3.toString())
    const candidates: string[] = []
    for (const qs of qVariants) {
      // Preferir facturas si el backend aún no expone listado de ventas
      candidates.push(`/invoices?${qs}`)
      // Alternativas comunes de ventas
      candidates.push(`/sales?${qs}`)
      candidates.push(`/sales/list?${qs}`)
    }
    let list: any[] = []
    for (const ep of candidates) {
      try {
        const res = await apiClient.get(ep)
        const raw = res.data
        const data = raw?.data || raw
        const items = data?.items || data?.sales || data?.rows || data
        if (Array.isArray(items) && items.length >= 0) {
          list = items
          lastEndpointUsed.value = ep.startsWith('/invoices') ? 'invoices' : 'sales'
          break
        }
      } catch {}
    }
    rows.value = list.map((it: any) => ({
      id: it.id || it.saleId || it._id || it.number || '—',
      customer: it.customer || { name: it.customerName || '—', taxId: it.customerTaxId || undefined },
      customerName: it.customerName,
      subtotal: Number(it.subtotal ?? it.net ?? 0),
      total: Number(it.total ?? it.totalRounded ?? 0),
      status: it.status || it.state || 'completed',
      createdAt: it.createdAt || it.date || it.issueDate || null
    }))
  } finally {
    loading.value = false
  }
}

let searchTimeout: any
const debouncedSearch = (query: string) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { filters.value.search = query; applyFilters() }, 500)
}
const applyFilters = () => { filters.value.page = 1; load() }
const handleRowClick = (sale: any) => { goDetail(sale.id) }

onMounted(() => { load() })
</script>

<style scoped>
.sales-view {}
</style>

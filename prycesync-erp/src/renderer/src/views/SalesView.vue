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
        :paginated="false"
        :page-size="filters.limit"
        :show-header="false"
        @row-click="handleRowClick"
        @sort="onSort"
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

      <div class="mt-4">
        <Pagination
          :current-page="filters.page"
          :total-pages="totalPages"
          :total-items="total"
          :items-per-page="filters.limit"
          @pageChange="onPageChange"
        />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import FilterBar from '@/components/molecules/FilterBar.vue'
import DataTable from '@/components/atoms/DataTable.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import Pagination from '@/components/atoms/Pagination.vue'
import { apiClient } from '@/services/api'

const router = useRouter()
const route = useRoute()
const rows = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const totalPages = ref(1)
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
function goDetail(id: string) { router.push(`/sales/${id}`) }

async function load() {
  loading.value = true
  try {
    const qs = new URLSearchParams()
    qs.set('page', String(filters.value.page))
    qs.set('limit', String(filters.value.limit))
    if (filters.value.sortBy) qs.set('sortBy', filters.value.sortBy)
    if (filters.value.sortOrder) qs.set('sortOrder', filters.value.sortOrder)
    if (filters.value.search) qs.set('q', filters.value.search)
    if (filters.value.dateFrom) qs.set('dateFrom', filters.value.dateFrom)
    if (filters.value.dateTo) qs.set('dateTo', filters.value.dateTo)
    if (filters.value.status) qs.set('status', filters.value.status)

    const res = await apiClient.get(`/sales/list?${qs.toString()}`)
    const payload = res.data?.items ? res.data : (res.data?.data || res.data)
    const items = payload.items || []
    rows.value = items.map((it: any) => ({
      id: it.id || it.saleId || it._id || it.number || '—',
      customer: it.customer || { name: it.customerName || '—', taxId: it.customerTaxId || undefined },
      customerName: it.customerName,
      subtotal: Number(it.subtotal ?? it.net ?? 0),
      total: Number(it.total ?? it.totalRounded ?? 0),
      status: it.status || it.state || 'completed',
      createdAt: it.createdAt || it.date || it.issueDate || null
    }))
    total.value = Number(payload.total || 0)
    filters.value.page = Number(payload.page || filters.value.page)
    filters.value.limit = Number(payload.limit || filters.value.limit)
    totalPages.value = Math.max(1, Math.ceil(total.value / filters.value.limit))
    router.replace({ query: {
      page: String(filters.value.page),
      limit: String(filters.value.limit),
      sortBy: filters.value.sortBy,
      sortOrder: filters.value.sortOrder,
      q: filters.value.search || undefined,
      dateFrom: filters.value.dateFrom || undefined,
      dateTo: filters.value.dateTo || undefined,
      status: filters.value.status || undefined
    } })
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
function onPageChange(p: number) { filters.value.page = p; load() }
function onSort(field: string, order: 'asc' | 'desc') { filters.value.sortBy = field; filters.value.sortOrder = order; filters.value.page = 1; load() }

onMounted(() => {
  const q = route.query
  if (q.page) filters.value.page = Number(q.page)
  if (q.limit) filters.value.limit = Number(q.limit)
  if (q.sortBy) filters.value.sortBy = String(q.sortBy)
  if (q.sortOrder) filters.value.sortOrder = String(q.sortOrder) as any
  if (q.q) filters.value.search = String(q.q)
  if (q.dateFrom) filters.value.dateFrom = String(q.dateFrom)
  if (q.dateTo) filters.value.dateTo = String(q.dateTo)
  if (q.status) filters.value.status = String(q.status)
  load()
})
</script>

<style scoped>
.sales-view {}
</style>

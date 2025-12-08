<template>
  <DashboardLayout>
    <div class="sales-view">
      <PageHeader title="Ventas" subtitle="Listado de ventas registradas">
        <template #actions>
          <div class="flex gap-2">
            <BaseButton variant="secondary" @click="refresh">Refrescar</BaseButton>
          </div>
        </template>
      </PageHeader>

      <BaseCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Listado</h3>
            <div class="flex gap-2">
              <BaseInput v-model="search" placeholder="Buscar por cliente o ID" />
              <BaseSelect v-model="status" :options="statusOptions" />
              <BaseButton variant="primary" @click="refresh">Buscar</BaseButton>
            </div>
          </div>
        </template>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th class="px-6 py-3" />
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="rows.length === 0">
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">Sin resultados</td>
              </tr>
              <tr v-else v-for="row in rows" :key="row.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900">{{ row.id }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ row.customer?.name || row.customerName || '—' }}</td>
                <td class="px-6 py-4 text-right text-sm text-gray-900">{{ fmt(row.subtotal) }}</td>
                <td class="px-6 py-4 text-right text-sm text-gray-900">{{ fmt(row.total) }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ row.status }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ formatDate(row.createdAt) }}</td>
                <td class="px-6 py-4 text-right">
                  <BaseButton variant="primary" size="sm" @click="goDetail(row.id)">Ver</BaseButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import { apiClient } from '@/services/api'

const router = useRouter()
const search = ref('')
const status = ref('')
const rows = ref<any[]>([])
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Borrador' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' }
]

function fmt(n: number) { return (Number(n || 0)).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) }
function formatDate(d: any) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleString('es-AR') }
function goDetail(id: string) { router.push(`/sales/${id}`) }

async function refresh() {
  const q = new URLSearchParams()
  if (search.value) q.set('search', search.value)
  if (status.value) q.set('status', status.value)
  const res = await apiClient.get(`/sales?${q.toString()}`)
  const list = res.data?.data || res.data?.items || res.data || []
  rows.value = Array.isArray(list) ? list : []
}

onMounted(() => { refresh() })
</script>

<style scoped>
.sales-view {}
</style>

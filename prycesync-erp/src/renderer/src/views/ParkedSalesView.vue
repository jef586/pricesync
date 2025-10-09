<template>
  <DashboardLayout>
    <div class="parked-sales-view">
      <PageHeader title="Ventas estacionadas" subtitle="Reanuda ventas pendientes">
        <template #actions>
          <BaseButton variant="secondary" @click="refresh">Refrescar</BaseButton>
        </template>
      </PageHeader>

      <BaseCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">Listado</h3>
            <div class="flex gap-2">
              <BaseInput v-model="search" placeholder="Buscar por token o cliente" />
              <BaseButton variant="primary" @click="refresh">Buscar</BaseButton>
            </div>
          </div>
        </template>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pagado</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Restante</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th class="px-6 py-3" />
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="rows.length === 0">
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">No hay ventas estacionadas</td>
              </tr>
              <tr v-else v-for="row in rows" :key="row.saleId" class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900">{{ row.token }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ row.customer || '—' }}</td>
                <td class="px-6 py-4 text-right text-sm text-gray-900">${{ fmt(row.total) }}</td>
                <td class="px-6 py-4 text-right text-sm text-gray-900">${{ fmt(row.paid) }}</td>
                <td class="px-6 py-4 text-right text-sm text-gray-900">${{ fmt(row.remaining) }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ formatDate(row.parked_at) }}</td>
                <td class="px-6 py-4 text-right">
                  <BaseButton variant="primary" size="sm" @click="resume(row)">Reanudar</BaseButton>
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
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import { useSalesStore } from '@/stores/modules/sales'

const sales = useSalesStore()
const search = ref('')
const rows = ref(sales.parkedList)

function fmt(n: number) { return (n || 0).toLocaleString('es-AR') }
function formatDate(d: any) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleString('es-AR') }

async function refresh() {
  await sales.fetchParked({ search: search.value, page: 1, limit: 20 })
  rows.value = sales.parkedList
}

async function resume(row: any) {
  await sales.resumeSale(row.saleId, row.token || undefined)
}

onMounted(() => { refresh() })
</script>

<style scoped>
.parked-sales-view {}
</style>
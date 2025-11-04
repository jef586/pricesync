<template>
  <DashboardLayout :key="$route.fullPath">
    <div class="p-4 space-y-4">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Auditoría</h1>

      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Actor ID</label>
          <input v-model="filters.actorId" type="text" class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400" placeholder="uuid" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Target ID</label>
          <input v-model="filters.targetId" type="text" class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400" placeholder="uuid" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Acción</label>
          <input v-model="filters.actionType" type="text" class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400" placeholder="p.ej. USER_CREATE" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Desde</label>
          <input v-model="filters.from" type="date" class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Hasta</label>
          <input v-model="filters.to" type="date" class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
        </div>
        <div class="flex items-end gap-2">
          <button @click="reload" class="px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded">Buscar</button>
          <button @click="resetFilters" class="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded">Limpiar</button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">Fecha</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">Acción</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">Actor</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">Target</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">Detalle</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in items" :key="item.id">
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{{ formatDate(item.createdAt) }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{{ item.actionType }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{{ item.actorName || item.actorId || '-' }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{{ item.targetName || item.targetId || '-' }}</td>
              <td class="px-4 py-2 text-xs text-gray-700 dark:text-gray-200">
                <pre class="whitespace-pre-wrap break-words">{{ pretty(item.payloadDiff) }}</pre>
              </td>
            </tr>
            <tr v-if="!items.length">
              <td colspan="5" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">Sin resultados</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600 dark:text-gray-300">Total: {{ pagination.total }} · Página {{ pagination.page }} de {{ pagination.pages }}</div>
        <div class="flex gap-2">
          <button :disabled="pagination.page<=1" @click="prevPage" class="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded disabled:opacity-50">Anterior</button>
          <button :disabled="pagination.page>=pagination.pages" @click="nextPage" class="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded disabled:opacity-50">Siguiente</button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { fetchAuditLogs, type AuditLogItem, type AuditResponse } from '../services/audit'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'

const filters = reactive({ actorId: '', targetId: '', actionType: '', from: '', to: '' })
const items = ref<AuditLogItem[]>([])
const pagination = reactive({ page: 1, size: 25, total: 0, pages: 0 })

async function reload(page = pagination.page) {
  const params: any = {
    page,
    size: pagination.size
  }
  if (filters.actorId) params.actorId = filters.actorId
  if (filters.targetId) params.targetId = filters.targetId
  if (filters.actionType) params.actionType = filters.actionType
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  const data: AuditResponse = await fetchAuditLogs(params)
  items.value = data.items
  Object.assign(pagination, data.pagination)
}

function resetFilters() {
  filters.actorId = ''
  filters.targetId = ''
  filters.actionType = ''
  filters.from = ''
  filters.to = ''
  reload(1)
}

function prevPage() { if (pagination.page > 1) reload(pagination.page - 1) }
function nextPage() { if (pagination.page < pagination.pages) reload(pagination.page + 1) }

function pretty(obj: any) {
  try { return JSON.stringify(obj, null, 2) } catch { return String(obj) }
}
function formatDate(iso: string) {
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

onMounted(() => {
  reload(1)
})
</script>

<style scoped>
</style>
<template>
  <DashboardLayout>
    <div class="article-edit-view">
      <PageHeader :title="t('inventory.article.edit.title')" :subtitle="t('inventory.article.edit.subtitle')">
        <template #actions>
          <BaseButton variant="secondary" @click="$router.push('/articles')">{{ t('inventory.article.actions.back') }}</BaseButton>
        </template>
      </PageHeader>

      <div v-if="loaded && article" class="space-y-4">
        <!-- Tabs -->
        <div class="border-b border-slate-200">
          <ul class="flex items-center gap-1">
            <li>
              <button
                class="px-3 py-1 text-sm rounded-t-md border border-b-0"
                :class="activeTab === 'edit' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold' : 'bg-slate-100 text-slate-700 border-slate-200'"
                @click="activeTab = 'edit'"
              >Editar</button>
            </li>
            <li>
              <button
                class="px-3 py-1 text-sm rounded-t-md border border-b-0"
                :class="activeTab === 'kardex' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold' : 'bg-slate-100 text-slate-700 border-slate-200'"
                @click="activeTab = 'kardex'"
              >Kardex</button>
            </li>
          </ul>
        </div>

        <!-- Edit tab -->
        <div v-show="activeTab === 'edit'" class="bg-white rounded-lg shadow p-4">
          <ArticleForm mode="edit" :initial="article" @saved="handleSaved" @cancel="goBack" />
        </div>

        <!-- Kardex tab -->
        <div v-show="activeTab === 'kardex'" class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Kardex</h3>
            <div class="flex items-center gap-2">
              <BaseButton variant="ghost" size="sm" :disabled="kardexLoading" @click="exportKardexFile('csv')">Exportar CSV</BaseButton>
              <BaseButton variant="ghost" size="sm" :disabled="kardexLoading" @click="exportKardexFile('json')">Exportar JSON</BaseButton>
            </div>
          </div>

          <!-- Filtros -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Desde</label>
              <input type="date" v-model="filters.from" class="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Hasta</label>
              <input type="date" v-model="filters.to" class="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Límite</label>
              <select v-model.number="filters.limit" class="w-full border rounded px-3 py-2 text-sm">
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </div>
            <div class="flex items-end">
              <BaseButton variant="primary" class="w-full" :disabled="kardexLoading" @click="reloadKardex">Aplicar</BaseButton>
            </div>
          </div>

          <!-- Tabla -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TipoDoc</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NroDoc</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UoM</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad (UN)</th>
                  <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo (UN)</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="kardexLoading">
                  <td colspan="9" class="px-4 py-6 text-center text-sm text-gray-500">Cargando kardex...</td>
                </tr>
                <tr v-else-if="kardexError">
                  <td colspan="9" class="px-4 py-6 text-center text-sm text-red-600">{{ kardexError }}</td>
                </tr>
                <tr v-else-if="kardex?.items?.length === 0">
                  <td colspan="9" class="px-4 py-6 text-center text-sm text-gray-500">Sin movimientos para los filtros seleccionados</td>
                </tr>
                <tr v-for="row in kardex?.items || []" :key="row.id">
                  <td class="px-4 py-2 text-sm text-gray-900">{{ formatDateTime(row.createdAt) }}</td>
                  <td class="px-4 py-2 text-sm text-gray-900">{{ row.documentType || '—' }}</td>
                  <td class="px-4 py-2 text-sm text-gray-900">{{ row.documentId || '—' }}</td>
                  <td class="px-4 py-2 text-sm text-gray-900">{{ row.reason }}</td>
                  <td class="px-4 py-2 text-sm text-gray-900">{{ row.uom }}</td>
                  <td class="px-4 py-2 text-sm text-right text-gray-900">{{ row.qty.toLocaleString('es-AR') }}</td>
                  <td class="px-4 py-2 text-sm text-right text-gray-900">{{ row.qtyUn.toLocaleString('es-AR') }}</td>
                  <td class="px-4 py-2 text-sm text-center">
                    <span :class="row.direction === 'IN' ? 'text-emerald-700' : 'text-red-700'">{{ row.direction }}</span>
                  </td>
                  <td class="px-4 py-2 text-sm text-right text-gray-900">{{ row.balanceUn.toLocaleString('es-AR') }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div class="mt-4" v-if="kardex && kardex.pagination && kardex.pagination.pages > 1">
            <Pagination
              :current-page="kardex.pagination.page"
              :total-pages="kardex.pagination.pages"
              :total-items="kardex.pagination.total"
              :items-per-page="kardex.pagination.limit"
              @pageChange="onKardexPageChange"
            />
          </div>

          <!-- Totales -->
          <div v-if="kardex" class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-xs text-gray-500">Saldo Inicial (UN)</div>
              <div class="text-lg font-semibold">{{ kardex.startingOnHandUn.toLocaleString('es-AR') }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-xs text-gray-500">Saldo Actual (UN)</div>
              <div class="text-lg font-semibold">{{ kardex.currentOnHandUn.toLocaleString('es-AR') }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-xs text-gray-500">Total Movimientos</div>
              <div class="text-lg font-semibold">{{ kardex.pagination.total }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="p-8 text-center text-gray-600">
        <span v-if="loading">Cargando artículo…</span>
        <span v-else>Artículo no encontrado</span>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import ArticleForm from '@/components/articles/ArticleForm.vue'
import { useArticleStore } from '@/stores/articles'
import Pagination from '@/components/atoms/Pagination.vue'
import { getKardex, exportKardex } from '@/services/stockService'

function t(key: string) {
  const dict: Record<string, string> = {
    'inventory.article.edit.title': 'Editar artículo',
    'inventory.article.edit.subtitle': 'Actualiza los datos del artículo',
    'inventory.article.actions.back': 'Volver'
  }
  return dict[key] || key
}

const store = useArticleStore()
const route = useRoute()
const article = ref<any | null>(null)
const loaded = ref(false)
const loading = ref(false)
const activeTab = ref<'edit' | 'kardex'>('edit')

// Kardex state
const kardex = ref<any | null>(null)
const kardexLoading = ref(false)
const kardexError = ref<string | null>(null)
const filters = ref<{ from?: string; to?: string; limit: number; page: number }>({ limit: 20, page: 1 })
const articleId = computed(() => String(route.params.id))

onMounted(async () => {
  const id = String(route.params.id)
  loading.value = true
  try {
    article.value = await store.get(id)
  } finally {
    loading.value = false
    loaded.value = true
  }
  await reloadKardex()
})

function goBack() {
  window.history.back()
}

function handleSaved(id: string) {
  window.location.assign(`/articles/${id}/edit`)
}

function formatDateTime(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

async function reloadKardex() {
  kardexLoading.value = true
  kardexError.value = null
  try {
    const res = await getKardex({
      articleId: articleId.value,
      from: filters.value.from,
      to: filters.value.to,
      page: filters.value.page,
      limit: filters.value.limit
    })
    kardex.value = res
  } catch (e: any) {
    kardexError.value = e?.message || 'Error al cargar kardex'
  } finally {
    kardexLoading.value = false
  }
}

async function exportKardexFile(fmt: 'csv' | 'json') {
  try {
    const { blob, filename } = await exportKardex({
      articleId: articleId.value,
      from: filters.value.from,
      to: filters.value.to
    }, fmt)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Error exportando kardex', e)
  }
}

function onKardexPageChange(page: number) {
  filters.value.page = page
  reloadKardex()
}
</script>
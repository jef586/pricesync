<template>
  <DashboardLayout>
    <div class="articles-view">
      <PageHeader
        :title="t('inventory.article.list.title')"
        :subtitle="t('inventory.article.list.subtitle')"
      >
        <template #actions>
          <BaseButton variant="primary" @click="$router.push('/articles/new')">
            {{ t('inventory.article.actions.new') }}
          </BaseButton>
        </template>
      </PageHeader>

      <div class="bg-white rounded-lg shadow p-4">
        <ArticleTable
          :loading="store.loading"
          :error="store.error"
          :items="store.items"
          :page="store.page"
          :page-size="store.pageSize"
          :total="store.total"
          :filters="store.filters"
          @search="handleSearch"
          @filter-change="handleFilterChange"
          @page-change="handlePageChange"
          @sort-change="handleSortChange"
          @edit="goEdit"
          @duplicate="duplicateItem"
          @toggle-active="toggleActive"
          @remove="removeItem"
          @reload="reload"
        />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import ArticleTable from '@/components/articles/ArticleTable.vue'
import { useArticleStore } from '@/stores/articles'
import { useNotifications } from '@/composables/useNotifications'

// Minimal i18n shim
function t(key: string) {
  const dict: Record<string, string> = {
    'inventory.article.list.title': 'Artículos',
    'inventory.article.list.subtitle': 'Listado, búsqueda y acciones',
    'inventory.article.actions.new': 'Nuevo'
  }
  return dict[key] || key
}

const store = useArticleStore()
const { success, error } = useNotifications()

onMounted(async () => {
  await store.list()
})

async function reload() {
  await store.list()
}

async function handleSearch(q: string) {
  store.setFilters({ q })
  await store.list({ ...store.filters, page: 1 })
}

async function handleFilterChange(newFilters: any) {
  store.setFilters(newFilters)
  await store.list({ ...store.filters, page: 1 })
}

async function handlePageChange(page: number) {
  store.setPage(page)
  await store.list({ ...store.filters, page })
}

function handleSortChange(sortBy: string, sortOrder: 'asc' | 'desc') {
  // Backend sort support for articles exists; pass via filters if implemented in service
  // For now, re-fetch and let server default sorting
  store.list({ ...store.filters })
}

function goEdit(id: string) {
  window.location.assign(`/articles/${id}/edit`)
}

async function duplicateItem(item: any) {
  try {
    const payload = { ...item, id: undefined, sku: undefined, barcode: undefined, name: item.name + ' (Copia)' }
    const created = await store.create(payload)
    success(`Artículo duplicado: ${created.name}`)
    await store.list({ ...store.filters })
  } catch (e: any) {
    error(e?.response?.data?.message || 'Error al duplicar')
  }
}

async function toggleActive(item: any) {
  try {
    await store.update(item.id, { active: !item.active })
    success(item.active ? 'Artículo desactivado' : 'Artículo activado')
    await store.list({ ...store.filters })
  } catch (e: any) {
    error(e?.response?.data?.message || 'Error al actualizar estado')
  }
}

async function removeItem(id: string) {
  try {
    await store.remove(id)
    success('Artículo eliminado')
    await store.list({ ...store.filters })
  } catch (e: any) {
    error(e?.response?.data?.message || 'Error al eliminar')
  }
}
</script>
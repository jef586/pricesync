<template>
  <DashboardLayout>
    <div class="article-edit-view">
      <PageHeader :title="t('inventory.article.edit.title')" :subtitle="t('inventory.article.edit.subtitle')">
        <template #actions>
          <BaseButton variant="secondary" @click="$router.push('/articles')">{{ t('inventory.article.actions.back') }}</BaseButton>
        </template>
      </PageHeader>

      <div class="bg-white rounded-lg shadow p-4" v-if="loaded && article">
        <ArticleForm mode="edit" :initial="article" @saved="handleSaved" @cancel="goBack" />
      </div>

      <div v-else class="p-8 text-center text-gray-600">
        <span v-if="loading">Cargando artículo…</span>
        <span v-else>Artículo no encontrado</span>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import ArticleForm from '@/components/articles/ArticleForm.vue'
import { useArticleStore } from '@/stores/articles'

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

onMounted(async () => {
  const id = String(route.params.id)
  loading.value = true
  try {
    article.value = await store.get(id)
  } finally {
    loading.value = false
    loaded.value = true
  }
})

function goBack() {
  window.history.back()
}

function handleSaved(id: string) {
  window.location.assign(`/articles/${id}/edit`)
}
</script>
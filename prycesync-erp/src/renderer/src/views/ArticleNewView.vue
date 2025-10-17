<template>
  <DashboardLayout>
    <div class="article-new-view">
      <PageHeader :title="t('inventory.article.new.title')" :subtitle="t('inventory.article.new.subtitle')">
        <template #actions>
          <BaseButton variant="secondary" @click="$router.push('/articles')">{{ t('inventory.article.actions.back') }}</BaseButton>
        </template>
      </PageHeader>
      <div class="bg-white rounded-lg shadow p-4">
        <ArticleForm mode="create" @saved="handleSaved" @cancel="goBack" />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import ArticleForm from '@/components/articles/ArticleForm.vue'

function t(key: string) {
  const dict: Record<string, string> = {
    'inventory.article.new.title': 'Nuevo artículo',
    'inventory.article.new.subtitle': 'Completa los campos y guarda',
    'inventory.article.actions.back': 'Volver'
  }
  return dict[key] || key
}

function goBack() {
  window.history.back()
}

function handleSaved(id: string) {
  window.location.assign(`/articles/${id}/edit`)
}
</script>
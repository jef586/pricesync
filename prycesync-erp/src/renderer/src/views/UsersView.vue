<template>
  <DashboardLayout>
    <div class="users-view">
      <!-- Header -->
      <PageHeader
        title="Usuarios"
        subtitle="Administra los usuarios de tu empresa"
      />

      <!-- Filters -->
      <UserFilters
        @update:filters="applyFilters"
      />

      <!-- Table -->
      <div class="mt-4">
        <UserTable
          :items="store.items"
          :page-size="store.pageSize"
          :loading="store.loading"
          @sort="onSort"
        />
      </div>

      <!-- Pagination -->
      <div class="mt-4">
        <Pagination
          :current-page="store.page"
          :page-size="store.pageSize"
          :total-items="store.total"
          @page-change="onPageChange"
        />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import Pagination from '@/components/atoms/Pagination.vue'
import UserFilters from '@/components/users/UserFilters.vue'
import UserTable from '@/components/users/UserTable.vue'
import { useUsersStore } from '@/stores/users'

const store = useUsersStore()

onMounted(async () => {
  await store.list()
})

async function applyFilters(filters: { q?: string; role?: string; status?: string }) {
  store.setFilters(filters)
  await store.list()
}

async function onSort({ sortBy, sortOrder }: { sortBy: string; sortOrder: 'asc' | 'desc' }) {
  store.setSort(sortBy as any, sortOrder)
  await store.list()
}

async function onPageChange(page: number) {
  store.setPage(page)
  await store.list()
}
</script>

<style scoped>
.users-view {
  @apply space-y-4;
}
</style>
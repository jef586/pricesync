<template>
  <DataTable
    :data="items"
    :columns="columns"
    :paginated="true"
    :page-size="pageSize"
    :loading="loading"
    row-key="id"
    :clickable-rows="clickableRows"
    @sort="onSort"
    @row-click="onRowClick"
  >
    <template #cell-status="{ value }">
      <span :class="statusClass(value)">{{ statusLabel(value) }}</span>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DataTable from '@/components/atoms/DataTable.vue'
import type { UserDTO } from '@/services/users'

interface Props {
  items: UserDTO[]
  pageSize?: number
  loading?: boolean
  clickableRows?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 20,
  loading: false,
  clickableRows: true
})

interface Emits {
  (e: 'sort', payload: { sortBy: string; sortOrder: 'asc' | 'desc' }): void
  (e: 'row-click', payload: UserDTO): void
}

const emit = defineEmits<Emits>()

const columns = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Rol', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'lastLogin', label: 'Último acceso', sortable: true },
  { key: 'createdAt', label: 'Creado', sortable: true },
]

function statusLabel(value: string) {
  const map: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido'
  }
  return map[value] || value
}

function statusClass(value: string) {
  const map: Record<string, string> = {
    active: 'text-green-600',
    inactive: 'text-gray-500',
    suspended: 'text-orange-600'
  }
  return map[value] || 'text-gray-700'
}

function onSort({ key, direction }: any) {
  emit('sort', { sortBy: key, sortOrder: direction })
}

function onRowClick(item: UserDTO) {
  emit('row-click', item)
}
</script>
<template>
  <FilterBar
    v-model="uiFilters"
    :status-options="statusOptions"
    :type-options="roleOptions"
    :show-date-range="false"
    search-placeholder="Buscar por nombre o email..."
    @filter-change="onFilterChange"
    @search="onSearch"
  />
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import FilterBar from '@/components/molecules/FilterBar.vue'

interface Emits {
  (e: 'update:filters', value: { q?: string; role?: string; status?: string }): void
}

const emit = defineEmits<Emits>()

// Estado local para FilterBar (usa keys search/status/type)
const uiFilters = ref<{ search?: string; status?: string; type?: string }>({
  search: '',
  status: '',
  type: ''
})

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'suspended', label: 'Suspendido' }
]

const roleOptions = [
  { value: '', label: 'Todos los roles' },
  { value: 'SUPERADMIN', label: 'Superadmin' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'SELLER', label: 'Vendedor' },
  { value: 'TECHNICIAN', label: 'Técnico' }
]

const onFilterChange = () => {
  emit('update:filters', {
    q: uiFilters.value.search || undefined,
    status: uiFilters.value.status || undefined,
    role: uiFilters.value.type || undefined
  })
}

const onSearch = (query: string) => {
  uiFilters.value.search = query
  onFilterChange()
}

// Emitir al iniciar para establecer valores vacíos
watchEffect(() => {
  emit('update:filters', { q: '', role: undefined, status: undefined })
})
</script>
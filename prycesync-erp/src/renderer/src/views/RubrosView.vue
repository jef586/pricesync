<template>
  <DashboardLayout>
    <div class="rubros-view">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Rubros</h1>
          <p class="text-gray-600 dark:text-gray-300">Administra los rubros y subrubros</p>
        </div>
        <div class="flex gap-3">
          <BaseButton variant="primary" @click="openCreateRoot">Nuevo Rubro</BaseButton>
        </div>
      </div>
    <div class="panel">
      
      <div class="panel__body space-y-3">
        <FilterBar
          :model-value="filterModel"
          :status-options="filterStatusOptions"
          :show-date-range="false"
          @update:modelValue="onFilterUpdate"
          @filter-change="onFilterChange"
          @search="onSearch"
        />
        <DataTable
          :data="items"
          :columns="columns"
          :paginated="false"
          :loading="loading"
          :show-header="false"
          class="mb-6"
        >
          <template #cell-status="{ item }">
            <BaseBadge :variant="item?.deletedAt ? 'danger' : item?.isActive ? 'success' : 'warning'">
              {{ item?.deletedAt ? 'Eliminado' : item?.isActive ? 'Activo' : 'Inactivo' }}
            </BaseBadge>
          </template>
          <template #cell-createdAt="{ value }">{{ formatDate(value) }}</template>
          <template #actions="{ item }">
            <div v-if="item" class="flex justify-center gap-1">
              <BaseButton variant="ghost" size="sm" @click="openCreateChild(item)" title="Crear Subrubro">Subrubro</BaseButton>
              <BaseButton variant="ghost" size="sm" @click="edit(item)" title="Editar">Editar</BaseButton>
              <BaseButton v-if="!item?.deletedAt" variant="ghost" size="sm" @click="remove(item)" title="Eliminar">Eliminar</BaseButton>
              <BaseButton v-else variant="ghost" size="sm" @click="restore(item)" title="Restaurar">Restaurar</BaseButton>
              <BaseButton variant="ghost" size="sm" @click="move(item)" title="Mover">Mover</BaseButton>
            </div>
          </template>
          <template #empty>
            <div class="text-center py-8 text-sm">No hay rubros creados</div>
          </template>
        </DataTable>
        <div class="mt-4">
          <Pagination
            :current-page="pagination.page"
            :total-pages="pagination.pages"
            :total-items="pagination.total"
            :items-per-page="pagination.size"
            @pageChange="onPageChange"
          />
        </div>
      </div>
    </div>

    <BaseModal v-model="modalRoot" title="Crear Rubro" size="sm">
      <div class="space-y-2">
        <BaseInput v-model="newRootName" placeholder="Nombre del rubro" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="modalRoot=false">Cancelar</BaseButton>
        <BaseButton variant="primary" @click="createRoot">Crear</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="modalChild" title="Crear Subrubro" size="sm">
      <div class="space-y-2">
        <div class="text-sm">Padre: {{ currentParent?.name }}</div>
        <BaseInput v-model="newChildName" placeholder="Nombre del subrubro" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="modalChild=false">Cancelar</BaseButton>
        <BaseButton variant="primary" @click="createChildConfirm">Crear</BaseButton>
      </template>
    </BaseModal>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRubrosStore } from '@/stores/rubros'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import BaseModal from '@/components/atoms/BaseModal.vue'
import FilterBar from '@/components/molecules/FilterBar.vue'
import DataTable from '@/components/atoms/DataTable.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import Pagination from '@/components/atoms/Pagination.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'

const store = useRubrosStore()
const filterModel = ref<{ search?: string; status?: string }>({ search: '', status: 'active' })
const newRootName = ref('')
const newChildName = ref('')
const modalRoot = ref(false)
const modalChild = ref(false)
const currentParent = ref<any | null>(null)

const tree = computed(() => store.tree)
const items = computed(() => store.filteredItems)
const loading = computed(() => store.loading)
const pagination = computed(() => store.pagination)
const totalActive = computed(() => store.totalActive)
const totalInactive = computed(() => store.totalInactive)
const totalDeleted = computed(() => store.totalDeleted)

const columns = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'level', label: 'Nivel', sortable: true },
  { key: 'status', label: 'Estado', sortable: false, formatter: (_: any, it: any) => (it.deletedAt ? 'Eliminado' : it.isActive ? 'Activo' : 'Inactivo') },
  { key: 'createdAt', label: 'Fecha creación', sortable: true }
]

const filterStatusOptions = [
  { label: 'Activos', value: 'active' },
  { label: 'Inactivos', value: 'inactive' },
  { label: 'Eliminados', value: 'deleted' }
]

onMounted(async () => {
  await store.fetchTree()
  await store.fetchChildren(null)
})

const onFilterUpdate = async (filters: any) => { filterModel.value = filters }
const onFilterChange = async () => {
  store.setFilters({ q: filterModel.value.search || '', status: (filterModel.value.status as any) || 'active' })
  await store.fetchChildren(store.selectedNode?.id ?? null)
}
const onSearch = async (q: string) => { store.setFilters({ q }); await store.fetchChildren(store.selectedNode?.id ?? null) }
const onPageChange = async (page: number) => { await store.setPage(page) }

const formatDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString() : '')

const edit = (item: any) => {}
const remove = async (item: any) => { await store.removeRubro(item.id) }
const restore = async (item: any) => { await store.restoreRubro(item.id) }
const openCreateChild = (item: any) => { currentParent.value = item; newChildName.value = ''; modalChild.value = true }
const createChildConfirm = async () => {
  const name = newChildName.value.trim() || 'Nuevo subrubro'
  await store.createSubrubro(currentParent.value?.id ?? null, { name })
  modalChild.value = false
  await store.fetchChildren(store.selectedNode?.id ?? null)
}
const move = async (item: any) => { await store.moveRubro(item.id, null) }
const openCreateRoot = () => { newRootName.value = ''; modalRoot.value = true }
const createRoot = async () => {
  const name = newRootName.value.trim() || 'Nuevo rubro'
  await store.createSubrubro(null, { name })
  newRootName.value = ''
  modalRoot.value = false
  await store.fetchTree()
  await store.fetchChildren(null)
}
</script>

<style scoped>
.panel { background: var(--ps-card); border: var(--ps-border-width) solid var(--ps-border); border-radius: var(--ps-radius-lg); }
.panel__header { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1rem; border-bottom: var(--ps-border-width) solid var(--ps-border); }
.panel__title { font-size:1rem; font-weight:600; color: var(--ps-text-primary); }
.panel__body { padding: .75rem; }
</style>

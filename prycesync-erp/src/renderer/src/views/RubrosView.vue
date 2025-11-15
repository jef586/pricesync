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
      
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Tree Panel (RUB-6) -->
        <div class="lg:col-span-1">
          <div class="panel">
            <div class="panel__header">
              <h2 class="panel__title">Árbol de Rubros</h2>
            </div>
            <div class="panel__body">
              <RubroTree
                :selected-node-id="selectedNodeId"
                @select="onTreeSelect"
              />
            </div>
          </div>
        </div>
        
        <!-- Listing Panel -->
        <div class="lg:col-span-3">
          <div class="panel">
            <div class="panel__header">
              <h2 class="panel__title">Listado de Rubros</h2>
              <div class="text-sm text-gray-500">
                Mostrando {{ items.length }} de {{ pagination.total }} rubros
              </div>
            </div>
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
                :show-header="true"
                class="mb-6"
              >
          <template #cell-status="{ item }">
            <BaseBadge :variant="item?.deletedAt ? 'danger' : item?.isActive ? 'success' : 'warning'">
              {{ item?.deletedAt ? 'Eliminado' : item?.isActive ? 'Activo' : 'Inactivo' }}
            </BaseBadge>
          </template>
          <template #cell-createdAt="{ value }">{{ formatDate(value) }}</template>
          <template #cell-name="{ item }">
            <div class="flex items-center">
              <span v-if="item.level > 0" class="text-gray-400 mr-2">
                {{ '—'.repeat(item.level) }}
              </span>
              <span>{{ item.name }}</span>
            </div>
          </template>
          <template #actions="{ item }">
            <div v-if="item" class="flex justify-center gap-1">
              <BaseButton 
                v-if="item.level === 0" 
                variant="ghost" 
                size="sm" 
                @click="openCreateChild(item)" 
                title="Crear Subrubro"
              >
                Subrubro
              </BaseButton>
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
    </div>
  </div>

    <!-- New RubroFormModal -->
    <RubroFormModal
      v-model="showModal"
      :mode="modalMode"
      :rubro="currentRubro"
      :default-parent-id="defaultParentId"
      @success="handleModalSuccess"
    />

    <!-- Legacy modals (to be removed) -->
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRubrosStore } from '@/stores/rubros'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import BaseModal from '@/components/atoms/BaseModal.vue'
import FilterBar from '@/components/molecules/FilterBar.vue'
import DataTable from '@/components/atoms/DataTable.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import Pagination from '@/components/atoms/Pagination.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import RubroFormModal from '@/components/rubros/RubroFormModal.vue'
import RubroTree from '@/components/rubros/RubroTree.vue'
import type { RubroDTO, RubroFilters } from '@/types/rubro'

const store = useRubrosStore()
const route = useRoute()
const router = useRouter()

const filterModel = ref<{ search?: string; status?: string }>({ search: '', status: 'active' })
const newRootName = ref('')
const newChildName = ref('')
const modalRoot = ref(false)
const modalChild = ref(false)
const currentParent = ref<any | null>(null)

// New modal state
const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const currentRubro = ref<RubroDTO | null>(null)
const defaultParentId = ref<string | null>(null)
const selectedNodeId = ref<string | null>(null)

const tree = computed(() => store.tree)
const items = computed(() => store.items) // Use server-side filtered items instead of local filtering
const loading = computed(() => store.loading)
const pagination = computed(() => store.pagination)
const totalActive = computed(() => store.totalActive)
const totalInactive = computed(() => store.totalInactive)
const totalDeleted = computed(() => store.totalDeleted)

// Tree selection handler
const onTreeSelect = async (rubro: any) => {
  if (rubro) {
    selectedNodeId.value = rubro.id
    store.filters.parentId = rubro.id
  } else {
    selectedNodeId.value = null
    store.filters.parentId = null
  }
  
  syncUrlWithFilters()
  await store.fetchList()
}

// Organizar rubros jerárquicamente para mostrar padres e hijos juntos
const hierarchicalItems = computed(() => {
  const result: RubroDTO[] = []
  const processed = new Set<string>()
  
  // Primero agregar todos los rubros raíz (level 0) ordenados alfabéticamente
  const rootItems = items.value
    .filter(item => item.level === 0)
    .sort((a, b) => a.name.localeCompare(b.name))
  
  // Función recursiva para agregar rubros y sus hijos
  const addRubroAndChildren = (rubro: RubroDTO) => {
    if (processed.has(rubro.id)) return
    
    result.push(rubro)
    processed.add(rubro.id)
    
    // Encontrar y agregar hijos directos (level = padre.level + 1) ordenados alfabéticamente
    const children = items.value
      .filter(item => 
        item.parentId === rubro.id && 
        item.level === rubro.level + 1 &&
        !processed.has(item.id)
      )
      .sort((a, b) => a.name.localeCompare(b.name))
    
    children.forEach(child => addRubroAndChildren(child))
  }
  
  // Procesar raíces primero
  rootItems.forEach(root => addRubroAndChildren(root))
  
  // Agregar cualquier rubro huérfano que no tenga padre en la lista
  items.value.forEach(item => {
    if (!processed.has(item.id)) {
      addRubroAndChildren(item)
    }
  })
  
  return result
})

const columns = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'level', label: 'Nivel', sortable: true },
  { key: 'status', label: 'Estado', sortable: false, formatter: (_: any, it: any) => (it.deletedAt ? 'Eliminado' : it.isActive ? 'Activo' : 'Inactivo') },
  { key: 'createdAt', label: 'Fecha creación', sortable: true }
]

const filterStatusOptions = [
  { label: 'Activos', value: 'active' },
  { label: 'Inactivos', value: 'inactive' },
  { label: 'Eliminados', value: 'deleted' },
  { label: 'Todos', value: 'all' }
]

// URL query params synchronization
const syncUrlWithFilters = () => {
  const query: any = {}
  
  if (store.filters.q) query.q = store.filters.q
  if (store.filters.status !== 'active') query.status = store.filters.status
  if (store.filters.parentId) query.parentId = store.filters.parentId
  if (store.filters.sort !== 'name') query.sort = store.filters.sort
  if (store.filters.order !== 'asc') query.order = store.filters.order
  if (store.pagination.page !== 1) query.page = store.pagination.page
  if (store.pagination.size !== 20) query.size = store.pagination.size
  
  router.replace({ query })
}

const loadFiltersFromUrl = () => {
  const query = route.query
  
  const filters: RubroFilters = {
    q: (query.q as string) || '',
    status: (query.status as RubroFilters['status']) || 'active',
    parentId: (query.parentId as string) || null,
    sort: (query.sort as RubroFilters['sort']) || 'name',
    order: (query.order as RubroFilters['order']) || 'asc'
  }
  
  store.setFilters(filters)
  filterModel.value.search = filters.q
  filterModel.value.status = filters.status
  
  if (query.page) {
    store.pagination.page = parseInt(query.page as string)
  }
  if (query.size) {
    store.pagination.size = parseInt(query.size as string)
  }
}

onMounted(async () => {
  loadFiltersFromUrl()
  await store.fetchList()
})

// Watch for URL changes
watch(() => route.query, () => {
  loadFiltersFromUrl()
  store.fetchList()
})

const onFilterUpdate = async (filters: any) => { 
  filterModel.value = filters 
}

const onFilterChange = async () => {
  const newFilters: RubroFilters = {
    q: filterModel.value.search || '',
    status: (filterModel.value.status as RubroFilters['status']) || 'active'
  }
  
  store.setFilters(newFilters)
  syncUrlWithFilters()
  await store.fetchList()
}

const onSearch = async (q: string) => { 
  store.setFilters({ q })
  syncUrlWithFilters()
  await store.fetchList()
}

const onPageChange = async (page: number) => { 
  store.pagination.page = page
  syncUrlWithFilters()
  await store.fetchList()
}

const formatDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString() : '')

// New modal functions
const openCreateRoot = () => {
  modalMode.value = 'create'
  currentRubro.value = null
  defaultParentId.value = null
  showModal.value = true
}

const openCreateChild = (item: RubroDTO) => {
  modalMode.value = 'create'
  currentRubro.value = null
  defaultParentId.value = item.id
  showModal.value = true
}

const edit = (item: RubroDTO) => {
  modalMode.value = 'edit'
  currentRubro.value = item
  defaultParentId.value = null
  showModal.value = true
}

const handleModalSuccess = async (rubro: RubroDTO) => {
  // Refresh data after successful creation/update
  if (rubro.parentId) {
    await store.fetchChildren(rubro.parentId)
  } else {
    await store.fetchTree()
    await store.fetchChildren(null)
  }
}

// Legacy functions (to be removed)
const remove = async (item: any) => { await store.removeRubro(item.id) }
const restore = async (item: any) => { await store.restoreRubro(item.id) }
const move = async (item: any) => { await store.moveRubro(item.id, null) }
const createChildConfirm = async () => {
  const name = newChildName.value.trim() || 'Nuevo subrubro'
  await store.createSubrubro(currentParent.value?.id ?? null, { name })
  modalChild.value = false
  await store.fetchChildren(store.selectedNode?.id ?? null)
}
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

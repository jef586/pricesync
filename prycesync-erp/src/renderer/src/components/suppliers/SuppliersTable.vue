<template>
  <div class="suppliers-table">
    <!-- Vista de tabla para pantallas grandes -->
    <div class="hidden md:block">
      <DataTable
        :columns="tableColumns"
        :data="suppliers"
        :loading="loading"
        :pagination="{
          page: currentPage,
          limit: pageSize,
          total: totalItems,
          totalPages: totalPages
        }"
        @page-change="handlePageChange"
        @sort="handleSort"
        clickable-rows
        @row-click="handleRowClick"
      >
        <!-- Columna Nombre/Código -->
        <template #cell-name="{ item }">
          <div>
            <div class="font-medium text-gray-900 dark:text-gray-100">{{ item.name }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">{{ item.code }}</div>
          </div>
        </template>

        <!-- Columna Contacto -->
        <template #cell-contact="{ item }">
          <div>
            <div class="text-sm text-gray-900 dark:text-gray-100">{{ item.email }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">{{ item.phone }}</div>
          </div>
        </template>

        <!-- Columna Última Lista -->
        <template #cell-lastList="{ item }">
          <div v-if="item.lastListName || item.lastListDate">
            <div class="text-sm text-gray-900 dark:text-gray-100">{{ item.lastListName }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(item.lastListDate) }}</div>
          </div>
          <div v-else class="text-sm text-gray-500 dark:text-gray-400">-</div>
        </template>

        <!-- Columna Estado -->
        <template #cell-status="{ item }">
          <BaseBadge :variant="item.status === 'active' ? 'success' : 'danger'">
            {{ item.status === 'active' ? 'Activo' : 'Inactivo' }}
          </BaseBadge>
        </template>

        <!-- Columna Acciones -->
        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2">
            <BaseButton
              variant="ghost"
              size="sm"
              @click.stop="viewSupplier(item.id)"
              title="Ver detalles"
              class="p-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </BaseButton>
            
            <BaseButton
              variant="ghost"
              size="sm"
              @click.stop="editSupplier(item.id)"
              title="Editar"
              class="p-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </BaseButton>
            
            <BaseButton
              variant="ghost"
              size="sm"
              @click.stop="confirmDelete(item)"
              title="Eliminar"
              class="p-1 text-red-600 hover:text-red-900"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </BaseButton>
            
            <BaseButton
              variant="ghost"
              size="sm"
              @click.stop="importProducts(item)"
              title="Importar lista"
              class="p-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </BaseButton>
          </div>
        </template>

        <!-- Estado vacío personalizado -->
        <template #empty>
          <div class="text-center py-12">
            <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay proveedores</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">Comienza creando tu primer proveedor</p>
            <BaseButton variant="primary" @click="$emit('edit-supplier', 'new')">
              Nuevo Proveedor
            </BaseButton>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Vista de cards para pantallas pequeñas -->
    <div class="md:hidden space-y-4">
      <div v-if="loading" class="flex justify-center py-8">
        <BaseSpinner />
      </div>
      
      <div v-else-if="suppliers.length === 0" class="text-center py-12">
        <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay proveedores</h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">Comienza creando tu primer proveedor</p>
        <BaseButton variant="primary" @click="$emit('edit-supplier', 'new')">
          Nuevo Proveedor
        </BaseButton>
      </div>

      <div v-else v-for="supplier in suppliers" :key="supplier.id" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex justify-between items-start mb-3">
          <div class="flex-1">
            <h3 class="font-medium text-gray-900 dark:text-gray-100">{{ supplier.name }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ supplier.code }}</p>
          </div>
          <BaseBadge :variant="supplier.status === 'active' ? 'success' : 'danger'">
            {{ supplier.status === 'active' ? 'Activo' : 'Inactivo' }}
          </BaseBadge>
        </div>

        <div class="space-y-2 mb-3">
          <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {{ supplier.email }}
          </div>
          <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {{ supplier.phone }}
          </div>
          <div v-if="supplier.lastListName || supplier.lastListDate" class="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span v-if="supplier.lastListName">{{ supplier.lastListName }}</span>
            <span v-if="supplier.lastListName && supplier.lastListDate"> - </span>
            <span v-if="supplier.lastListDate">{{ formatDate(supplier.lastListDate) }}</span>
          </div>
        </div>

        <div class="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <BaseButton
            variant="ghost"
            size="sm"
            @click="viewSupplier(supplier.id)"
            title="Ver detalles"
            class="flex-1"
          >
            Ver
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="editSupplier(supplier.id)"
            title="Editar"
            class="flex-1"
          >
            Editar
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="confirmDelete(supplier)"
            title="Eliminar"
            class="flex-1 text-red-600 hover:text-red-900"
          >
            Eliminar
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="importProducts(supplier)"
            title="Importar lista"
            class="flex-1"
          >
            Importar
          </BaseButton>
        </div>
      </div>

      <!-- Paginación para móvil -->
      <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-4">
        <BaseButton
          variant="ghost"
          size="sm"
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
        >
          Anterior
        </BaseButton>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        <BaseButton
          variant="ghost"
          size="sm"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
        >
          Siguiente
        </BaseButton>
      </div>
    </div>

    <!-- Modal de confirmación para eliminar -->
    <ConfirmModal
      v-if="showDeleteModal"
      :title="'Confirmar eliminación'"
      :message="`¿Estás seguro de que deseas eliminar al proveedor '${supplierToDelete?.name}'? Esta acción no se puede deshacer.`"
      :confirm-text="'Eliminar'"
      :cancel-text="'Cancelar'"
      :variant="'danger'"
      @confirm="deleteSupplier"
      @cancel="cancelDelete"
    />

    <!-- Modal de importación -->
    <UniversalImportModal
      v-if="showImportModal"
      :type="'suppliers'"
      :supplier-id="supplierToImport?.id"
      @close="closeImportModal"
      @success="handleImportSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSuppliersStore } from '@/stores/suppliers'
import type { Supplier } from '@/types/supplier'

// Components
import DataTable from '@/components/atoms/DataTable.vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseSpinner from '@/components/atoms/BaseSpinner.vue'
import ConfirmModal from '@/components/atoms/ConfirmModal.vue'
import UniversalImportModal from '@/components/suppliers/UniversalImportModal.vue'

interface Props {
  suppliers: Supplier[]
  loading?: boolean
  currentPage?: number
  pageSize?: number
  totalItems?: number
  totalPages?: number
}

interface Emits {
  (e: 'page-change', page: number): void
  (e: 'sort', sort: string, order: 'asc' | 'desc'): void
  (e: 'refresh'): void
  (e: 'edit-supplier', id: string): void
}

const props = withDefaults(defineProps<Props>(), {
  suppliers: () => [],
  loading: false,
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1
})

const emit = defineEmits<Emits>()
const suppliersStore = useSuppliersStore()
const router = useRouter()

// Estado para modales
const showDeleteModal = ref(false)
const supplierToDelete = ref<Supplier | null>(null)
const showImportModal = ref(false)
const supplierToImport = ref<Supplier | null>(null)

// Columnas de la tabla
const tableColumns = [
  { key: 'name', label: 'Proveedor', sortable: true },
  { key: 'contact', label: 'Contacto', sortable: false },
  { key: 'lastList', label: 'Última Lista', sortable: false },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'actions', label: 'Acciones', width: '160px' }
]

// Métodos
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('es-ES')
  } catch {
    return '-'
  }
}

const viewSupplier = (id: string) => {
  router.push(`/suppliers/${id}`)
}

const editSupplier = (id: string) => {
  emit('edit-supplier', id)
}

const createSupplier = () => {
  // This is handled by the parent component now
  // router.push('/suppliers/new')
}

const confirmDelete = (supplier: Supplier) => {
  supplierToDelete.value = supplier
  showDeleteModal.value = true
}

const cancelDelete = () => {
  supplierToDelete.value = null
  showDeleteModal.value = false
}

const deleteSupplier = async () => {
  if (!supplierToDelete.value) return
  
  try {
    await suppliersStore.remove(supplierToDelete.value.id)
    emit('refresh')
    // Notificación se maneja en el componente padre
  } catch (error) {
    console.error('Error al eliminar proveedor:', error)
    // El error se maneja en el store
  } finally {
    cancelDelete()
  }
}

const importProducts = (supplier: Supplier) => {
  supplierToImport.value = supplier
  showImportModal.value = true
}

const closeImportModal = () => {
  supplierToImport.value = null
  showImportModal.value = false
}

const handleImportSuccess = () => {
  closeImportModal()
  emit('refresh')
}

const handlePageChange = (page: number) => {
  emit('page-change', page)
}

const handleSort = (sort: string, order: 'asc' | 'desc') => {
  emit('sort', sort, order)
}

const handleRowClick = (item: Supplier) => {
  viewSupplier(item.id)
}
</script>

<style scoped>
.suppliers-table {
  @apply w-full;
}
</style>
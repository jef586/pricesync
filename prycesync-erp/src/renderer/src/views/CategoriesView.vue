<template>
  <DashboardLayout>
    <div class="categories-view space-y-6">
      <!-- Header (alineado al estilo de Proveedores) -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Categorías</h1>
          <p class="text-gray-600 dark:text-gray-300">Administra las categorías de productos</p>
        </div>
        <div class="flex gap-3">
          <button
            @click="$router.push('/categories/new')"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Categoría
          </button>
        </div>
      </div>

      <!-- Filters -->
      <FilterBar
        v-model="filters"
        search-placeholder="Buscar categorías..."
        @filter-change="applyFilters"
        @search="debouncedSearch"
        class="mb-6"
      >
        <template #extra-filters>
          <div class="flex gap-2">
            <BaseButton
              variant="ghost"
              @click="toggleView"
            >
              <component :is="viewMode === 'tree' ? ListBulletIcon : Squares2X2Icon" class="w-4 h-4 mr-2" />
              {{ viewMode === 'tree' ? 'Vista Lista' : 'Vista Árbol' }}
            </BaseButton>
          </div>
        </template>
      </FilterBar>

      <!-- Loading State -->
      <div v-if="isLoading && !hasCategories" class="bg-white rounded-lg shadow p-6">
        <div class="animate-pulse space-y-4">
          <div v-for="i in 5" :key="i" class="flex items-center space-x-4">
            <div class="w-8 h-8 bg-gray-200 rounded"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="bg-white rounded-lg shadow p-6">
        <div class="text-center">
          <ExclamationTriangleIcon class="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">Error al cargar categorías</h3>
          <p class="text-gray-600 mb-4">{{ categoriesError }}</p>
          <BaseButton @click="loadCategories">
            Reintentar
          </BaseButton>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasCategories" class="bg-white rounded-lg shadow p-6">
        <div class="text-center">
          <TagIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
          <p class="text-gray-600 mb-4">Comienza creando tu primera categoría de productos</p>
          <BaseButton
            variant="primary"
            @click="$router.push('/categories/new')"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Nueva Categoría
          </BaseButton>
        </div>
      </div>

      <!-- Categories Content -->
      <div v-else class="bg-white rounded-lg shadow">
        <!-- Tree View -->
        <div v-if="viewMode === 'tree'" class="p-6">
          <CategoryTree
            :categories="categoryTree"
            @edit="handleEdit"
            @delete="handleDelete"
            @add-child="handleAddChild"
          />
        </div>

        <!-- List View -->
        <div v-else>
          <!-- Table Header -->
          <div class="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div class="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div class="col-span-4">Nombre</div>
              <div class="col-span-3">Categoría Padre</div>
              <div class="col-span-2">Productos</div>
              <div class="col-span-2">Fecha Creación</div>
              <div class="col-span-1">Acciones</div>
            </div>
          </div>

          <!-- Table Body -->
          <div class="divide-y divide-gray-200">
            <div
              v-for="category in categories"
              :key="category.id"
              class="px-6 py-4 hover:bg-gray-50"
            >
              <div class="grid grid-cols-12 gap-4 items-center">
                <!-- Name -->
                <div class="col-span-4">
                  <div class="flex items-center">
                    <TagIcon class="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ category.name }}
                      </div>
                      <div v-if="category.description" class="text-sm text-gray-500">
                        {{ category.description }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Parent Category -->
                <div class="col-span-3">
                  <span v-if="category.parent" class="text-sm text-gray-600">
                    {{ category.parent.name }}
                  </span>
                  <span v-else class="text-sm text-gray-400">
                    Categoría raíz
                  </span>
                </div>

                <!-- Products Count -->
                <div class="col-span-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ category._count?.products || 0 }} productos
                  </span>
                </div>

                <!-- Created Date -->
                <div class="col-span-2">
                  <span class="text-sm text-gray-500">
                    {{ formatDate(category.createdAt) }}
                  </span>
                </div>

                <!-- Actions -->
                <div class="col-span-1">
                  <div class="flex items-center space-x-2">
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      @click="handleEdit(category)"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </BaseButton>
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      @click="handleDelete(category)"
                      :disabled="(category._count?.products || 0) > 0"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </BaseButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.pages > 1" class="px-6 py-3 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Mostrando {{ ((pagination.page - 1) * pagination.limit) + 1 }} a 
                {{ Math.min(pagination.page * pagination.limit, pagination.total) }} 
                de {{ pagination.total }} categorías
              </div>
              <div class="flex space-x-2">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="changePage(pagination.page - 1)"
                  :disabled="pagination.page <= 1"
                >
                  Anterior
                </BaseButton>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="changePage(pagination.page + 1)"
                  :disabled="pagination.page >= pagination.pages"
                >
                  Siguiente
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <ConfirmModal
        v-model="showDeleteModal"
        title="Eliminar Categoría"
        :message="`¿Estás seguro de que deseas eliminar la categoría '${categoryToDelete?.name}'? Esta acción no se puede deshacer.`"
        confirm-text="Eliminar"
        confirm-variant="danger"
        @confirm="confirmDelete"
      />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCategories } from '@/composables/useCategories'
import { useNotifications } from '@/composables/useNotifications'
import { debounce } from 'lodash-es'

// Icons
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
  Squares2X2Icon
} from '@heroicons/vue/24/outline'

// Components
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import FilterBar from '@/components/molecules/FilterBar.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import ConfirmModal from '@/components/atoms/ConfirmModal.vue'
import CategoryTree from '@/components/categories/CategoryTree.vue'

const router = useRouter()

// Composables
const {
  categories,
  categoryTree,
  isLoading,
  hasError,
  error: categoriesError,
  pagination,
  hasCategories,
  fetchCategories,
  fetchCategoryTree,
  deleteCategory
} = useCategories()

const { success, error } = useNotifications()

// State
const viewMode = ref<'list' | 'tree'>('list')
const showDeleteModal = ref(false)
const categoryToDelete = ref(null)

const filters = ref({
  search: '',
  page: 1,
  limit: 20,
  sortBy: 'name',
  sortOrder: 'asc' as 'asc' | 'desc'
})

// Computed
const debouncedSearch = debounce(() => {
  filters.value.page = 1
  loadCategories()
}, 300)

// Methods
const applyFilters = () => {
  filters.value.page = 1
  loadCategories()
}

const loadCategories = async () => {
  try {
    if (viewMode.value === 'tree') {
      await fetchCategoryTree()
    } else {
      await fetchCategories(filters.value)
    }
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const toggleView = async () => {
  viewMode.value = viewMode.value === 'list' ? 'tree' : 'list'
  await loadCategories()
}

const resetFilters = () => {
  filters.value = {
    search: '',
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'asc'
  }
  loadCategories()
}

const changePage = (page: number) => {
  filters.value.page = page
  loadCategories()
}

const handleEdit = (category: any) => {
  router.push(`/categories/${category.id}/edit`)
}

const handleDelete = (category: any) => {
  if ((category._count?.products || 0) > 0) {
    error('No se puede eliminar una categoría que tiene productos asociados')
    return
  }
  
  categoryToDelete.value = category
  showDeleteModal.value = true
}

const handleAddChild = (parentCategory: any) => {
  router.push(`/categories/new?parent=${parentCategory.id}`)
}

const confirmDelete = async () => {
  if (!categoryToDelete.value) return

  try {
    await deleteCategory(categoryToDelete.value.id)
    success('Categoría eliminada exitosamente')
    await loadCategories()
  } catch (err: any) {
    console.error('Error deleting category:', err)
    error(err.message || 'Error al eliminar la categoría')
  } finally {
    showDeleteModal.value = false
    categoryToDelete.value = null
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Lifecycle
onMounted(() => {
  loadCategories()
})
</script>
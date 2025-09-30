<template>
  <DashboardLayout>
    <div class="category-edit-view">
      <!-- Header -->
      <PageHeader
        :title="`Editar Categoría: ${currentCategory?.name || 'Cargando...'}`"
        subtitle="Modificar información de la categoría"
      >
        <template #actions>
          <BaseButton
            variant="ghost"
            @click="$router.push('/categories')"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="danger"
            @click="showDeleteModal = true"
            :disabled="isLoading || !canDelete"
          >
            Eliminar
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="handleSubmit"
            :loading="isLoading"
            :disabled="!isFormValid"
          >
            Guardar Cambios
          </BaseButton>
        </template>
      </PageHeader>

      <!-- Loading State -->
      <div v-if="isLoading && !currentCategory" class="bg-white rounded-lg shadow p-6">
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="bg-white rounded-lg shadow p-6">
        <div class="text-center">
          <ExclamationTriangleIcon class="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">Error al cargar categoría</h3>
          <p class="text-gray-600 mb-4">{{ error }}</p>
          <BaseButton @click="loadCategory">
            Reintentar
          </BaseButton>
        </div>
      </div>

      <!-- Form -->
      <div v-else-if="currentCategory" class="bg-white rounded-lg shadow">
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Nombre de la Categoría"
              required
              :error="errors.name"
            >
              <BaseInput
                v-model="form.name"
                placeholder="Ingrese el nombre de la categoría"
                :error="!!errors.name"
                @blur="validateField('name')"
              />
            </FormField>

            <FormField
              label="Categoría Padre"
              :error="errors.parentId"
            >
              <BaseSelect
                v-model="form.parentId"
                :options="parentCategoryOptions"
                placeholder="Seleccione una categoría padre (opcional)"
                :error="!!errors.parentId"
                @change="validateField('parentId')"
              />
            </FormField>
          </div>

          <FormField
            label="Descripción"
            :error="errors.description"
          >
            <BaseTextarea
              v-model="form.description"
              placeholder="Descripción de la categoría (opcional)"
              rows="3"
              :error="!!errors.description"
            />
          </FormField>

          <!-- Category Info -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Información de la Categoría</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="text-sm font-medium text-gray-500">Productos Asociados</div>
                <div class="text-2xl font-bold text-gray-900 mt-1">
                  {{ currentCategory._count?.products || 0 }}
                </div>
              </div>
              
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="text-sm font-medium text-gray-500">Subcategorías</div>
                <div class="text-2xl font-bold text-gray-900 mt-1">
                  {{ currentCategory.children?.length || 0 }}
                </div>
              </div>
              
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="text-sm font-medium text-gray-500">Fecha de Creación</div>
                <div class="text-sm text-gray-900 mt-1">
                  {{ formatDate(currentCategory.createdAt) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Subcategories -->
          <div v-if="currentCategory.children && currentCategory.children.length > 0" class="border-t pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Subcategorías</h3>
            <div class="space-y-2">
              <div
                v-for="child in currentCategory.children"
                :key="child.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center">
                  <TagIcon class="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ child.name }}</div>
                    <div v-if="child.description" class="text-xs text-gray-500">{{ child.description }}</div>
                  </div>
                </div>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="$router.push(`/categories/${child.id}/edit`)"
                >
                  Editar
                </BaseButton>
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="form.name" class="border-t pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Vista Previa</h3>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center">
                <TagIcon class="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ form.name }}
                  </div>
                  <div v-if="selectedParentCategory" class="text-xs text-gray-500">
                    Subcategoría de: {{ selectedParentCategory.label }}
                  </div>
                  <div v-if="form.description" class="text-xs text-gray-600 mt-1">
                    {{ form.description }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Delete Confirmation Modal -->
      <ConfirmModal
        v-model="showDeleteModal"
        title="Eliminar Categoría"
        :message="deleteMessage"
        confirm-text="Eliminar"
        confirm-variant="danger"
        @confirm="handleDelete"
      />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCategories } from '@/composables/useCategories'
import { useNotifications } from '@/composables/useNotifications'

// Icons
import { TagIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

// Components
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import FormField from '@/components/atoms/FormField.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import ConfirmModal from '@/components/atoms/ConfirmModal.vue'

const router = useRouter()
const route = useRoute()

// Composables
const {
  currentCategory,
  categoryTree,
  isLoading,
  hasError,
  error,
  fetchCategory,
  fetchCategoryTree,
  updateCategory,
  deleteCategory,
  getHierarchicalOptions
} = useCategories()

const { success, error } = useNotifications()

// State
const showDeleteModal = ref(false)

const form = ref({
  name: '',
  description: '',
  parentId: ''
})

const errors = ref({})

// Computed
const isFormValid = computed(() => {
  return form.value.name.trim() && Object.keys(errors.value).length === 0
})

const canDelete = computed(() => {
  if (!currentCategory.value) return false
  const hasProducts = (currentCategory.value._count?.products || 0) > 0
  const hasChildren = (currentCategory.value.children?.length || 0) > 0
  return !hasProducts && !hasChildren
})

const deleteMessage = computed(() => {
  if (!currentCategory.value) return ''
  
  const hasProducts = (currentCategory.value._count?.products || 0) > 0
  const hasChildren = (currentCategory.value.children?.length || 0) > 0
  
  if (hasProducts && hasChildren) {
    return `No se puede eliminar la categoría '${currentCategory.value.name}' porque tiene ${currentCategory.value._count?.products} productos asociados y ${currentCategory.value.children?.length} subcategorías.`
  } else if (hasProducts) {
    return `No se puede eliminar la categoría '${currentCategory.value.name}' porque tiene ${currentCategory.value._count?.products} productos asociados.`
  } else if (hasChildren) {
    return `No se puede eliminar la categoría '${currentCategory.value.name}' porque tiene ${currentCategory.value.children?.length} subcategorías.`
  }
  
  return `¿Estás seguro de que deseas eliminar la categoría '${currentCategory.value.name}'? Esta acción no se puede deshacer.`
})

const parentCategoryOptions = computed(() => {
  const options = getHierarchicalOptions(categoryTree.value)
  
  // Filter out current category and its descendants to prevent circular references
  const filteredOptions = options.filter(option => {
    if (!currentCategory.value) return true
    return option.value !== currentCategory.value.id && !isDescendant(option.value, currentCategory.value.id)
  })
  
  filteredOptions.unshift({ value: '', label: 'Sin categoría padre' })
  return filteredOptions
})

const selectedParentCategory = computed(() => {
  if (!form.value.parentId) return null
  return parentCategoryOptions.value.find(option => option.value === form.value.parentId)
})

// Helper function to check if a category is a descendant of another
const isDescendant = (categoryId: string, ancestorId: string): boolean => {
  // This would need to be implemented based on the category tree structure
  // For now, we'll use a simple approach
  return false
}

// Methods
const loadCategory = async () => {
  const categoryId = route.params.id as string
  if (categoryId) {
    await fetchCategory(categoryId)
  }
}

const populateForm = () => {
  if (currentCategory.value) {
    form.value = {
      name: currentCategory.value.name,
      description: currentCategory.value.description || '',
      parentId: currentCategory.value.parentId || ''
    }
  }
}

// Validation
const validateField = (field: string) => {
  const newErrors = { ...errors.value }
  
  switch (field) {
    case 'name':
      if (!form.value.name.trim()) {
        newErrors.name = 'El nombre es requerido'
      } else if (form.value.name.length < 2) {
        newErrors.name = 'El nombre debe tener al menos 2 caracteres'
      } else if (form.value.name.length > 100) {
        newErrors.name = 'El nombre no puede exceder 100 caracteres'
      } else {
        delete newErrors.name
      }
      break
    
    case 'description':
      if (form.value.description && form.value.description.length > 500) {
        newErrors.description = 'La descripción no puede exceder 500 caracteres'
      } else {
        delete newErrors.description
      }
      break
    
    case 'parentId':
      // Validation for circular reference would go here
      delete newErrors.parentId
      break
  }
  
  errors.value = newErrors
}

const validateForm = () => {
  Object.keys(form.value).forEach(field => {
    validateField(field)
  })
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    error('Por favor, corrija los errores en el formulario')
    return
  }

  try {
    const categoryId = route.params.id as string
    const categoryData = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      parentId: form.value.parentId || undefined
    }
    
    await updateCategory(categoryId, categoryData)
    
    success('Categoría actualizada exitosamente')
    router.push('/categories')
  } catch (err: any) {
    console.error('Error updating category:', err)
    error(err.message || 'Error al actualizar la categoría')
  }
}

const handleDelete = async () => {
  try {
    const categoryId = route.params.id as string
    await deleteCategory(categoryId)
    
    success('Categoría eliminada exitosamente')
    router.push('/categories')
  } catch (err: any) {
    console.error('Error deleting category:', err)
    error(err.message || 'Error al eliminar la categoría')
  } finally {
    showDeleteModal.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Lifecycle
onMounted(async () => {
  // Load category tree for parent selection
  try {
    await fetchCategoryTree()
  } catch (error) {
    console.error('Error loading category tree:', error)
  }
  
  // Load current category
  await loadCategory()
})

// Watch for category changes
watch(currentCategory, () => {
  if (currentCategory.value) {
    populateForm()
  }
}, { immediate: true })
</script>
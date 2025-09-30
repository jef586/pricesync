<template>
  <DashboardLayout>
    <div class="category-new-view">
      <!-- Header -->
      <PageHeader
        title="Nueva Categoría"
        subtitle="Crear una nueva categoría de productos"
      >
        <template #actions>
          <BaseButton
            variant="ghost"
            @click="$router.push('/categories')"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="handleSubmit"
            :loading="isLoading"
            :disabled="!isFormValid"
          >
            Crear Categoría
          </BaseButton>
        </template>
      </PageHeader>

      <!-- Form -->
      <div class="bg-white rounded-lg shadow">
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
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCategories } from '@/composables/useCategories'
import { useNotifications } from '@/composables/useNotifications'

// Icons
import { TagIcon } from '@heroicons/vue/24/outline'

// Components
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import FormField from '@/components/atoms/FormField.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

const router = useRouter()
const route = useRoute()

// Composables
const { 
  createCategory, 
  fetchCategoryTree, 
  getHierarchicalOptions,
  categoryTree,
  isLoading 
} = useCategories()
const { success, error } = useNotifications()

// Form state
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

const parentCategoryOptions = computed(() => {
  const options = getHierarchicalOptions(categoryTree.value)
  options.unshift({ value: '', label: 'Sin categoría padre' })
  return options
})

const selectedParentCategory = computed(() => {
  if (!form.value.parentId) return null
  return parentCategoryOptions.value.find(option => option.value === form.value.parentId)
})

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
      // No validation needed for parentId as it's optional
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

// Methods
const handleSubmit = async () => {
  if (!validateForm()) {
    error('Por favor, corrija los errores en el formulario')
    return
  }

  try {
    const categoryData = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      parentId: form.value.parentId || undefined
    }
    
    await createCategory(categoryData)
    
    success('Categoría creada exitosamente')
    router.push('/categories')
  } catch (err: any) {
    console.error('Error creating category:', err)
    error(err.message || 'Error al crear la categoría')
  }
}

// Lifecycle
onMounted(async () => {
  // Load categories for parent selection
  try {
    await fetchCategoryTree()
    
    // Check if parent category is specified in query params
    const parentId = route.query.parent as string
    if (parentId) {
      form.value.parentId = parentId
    }
  } catch (error) {
    console.error('Error loading categories:', error)
    error('Error al cargar las categorías')
  }
})
</script>
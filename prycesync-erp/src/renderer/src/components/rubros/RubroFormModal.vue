<template>
  <BaseModal
    v-model="isOpen"
    :title="modalTitle"
    size="md"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Parent Field - SOLO para subrubros o edición -->
      <FormField
        v-if="isSubrubro || props.mode === 'edit'"
        label="Rubro Padre"
        :error="errors.parent_id"
        :required="isSubrubro"
        :description="isSubrubro ? 'Seleccione el rubro padre para este subrubro' : (isEditingSubrubro ? 'Rubro padre (no se puede cambiar)' : 'Rubro padre actual')"
      >
        <BaseSelect
          v-model="form.parent_id"
          :options="parentOptions"
          :disabled="isSubmitting || isEditingSubrubro"
          placeholder="Seleccione un rubro padre"
          :clearable="!isEditingSubrubro"
        />
        <!-- Debug info -->
        <div v-if="true" class="text-xs text-gray-500 mt-1">
          Debug: disabled={{ isSubmitting || isEditingSubrubro }}, 
          isSubmitting={{ isSubmitting }}, 
          isEditingSubrubro={{ isEditingSubrubro }}, 
          rubroLevel={{ props.rubro?.level }}
        </div>
      </FormField>

      <!-- Name Field -->
      <FormField
        label="Nombre"
        :error="errors.name"
        required
      >
        <BaseInput
          v-model="form.name"
          :placeholder="isSubrubro ? 'Ingrese el nombre del subrubro' : 'Ingrese el nombre del rubro'"
          :disabled="isSubmitting"
          @blur="validateName"
        />
      </FormField>

      <!-- Error Alert -->
      <BaseAlert
        v-if="submitError"
        variant="danger"
        :title="submitErrorTitle"
      >
        {{ submitError }}
      </BaseAlert>
    </form>

    <!-- Modal de éxito para creación -->
    <RubroSuccessModal
      v-if="props.mode === 'create'"
      :rubro-name="lastCreatedRubroName"
      :open="showSuccessModal"
      @update:open="showSuccessModal = $event"
      @create-another="handleCreateAnother"
    />

    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton
          variant="ghost"
          @click="handleClose"
          :disabled="isSubmitting"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          @click="handleSubmit"
          :loading="isSubmitting"
          :disabled="!isFormValid"
        >
          {{ submitButtonText }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRubrosStore } from '@/stores/rubros'
import { listRubros } from '@/services/rubros'
import { useNotifications } from '@/composables/useNotifications'
import { ensureNoCycle } from '@/utils/rubroValidationSimple'
import BaseModal from '@/components/atoms/BaseModal.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import FormField from '@/components/atoms/FormField.vue'
import BaseAlert from '@/components/base/BaseAlert.vue'
import RubroSuccessModal from './RubroSuccessModal.vue'
import type { RubroDTO } from '@/types/rubro'

interface Props {
  modelValue: boolean
  mode: 'create' | 'edit'
  rubro?: RubroDTO | null
  defaultParentId?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success', rubro: RubroDTO): void
}

const props = withDefaults(defineProps<Props>(), {
  rubro: null,
  defaultParentId: null
})

const emit = defineEmits<Emits>()

// Store and composables
const store = useRubrosStore()
const notifications = useNotifications()

// Form state
const form = ref({
  name: '',
  parent_id: null as string | null
})

const errors = ref({
  name: '',
  parent_id: ''
})

const isSubmitting = ref(false)
const isLoadingParents = ref(false)
const submitError = ref('')
const parentOptions = ref<Array<{ value: string; label: string }>>([])
const parentCache = ref<Map<string, Array<{ value: string; label: string }>>>(new Map())
const showSuccessModal = ref(false)
const lastCreatedRubroName = ref('')

// Computed properties
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isSubrubro = computed(() => {
  return props.mode === 'create' && !!form.value.parent_id
})

const isEditingSubrubro = computed(() => {
  // Verificar que estamos en modo edición y que el rubro existe con level > 0
  const isEditMode = props.mode === 'edit'
  const hasRubro = !!props.rubro
  const isSubrubroLevel = hasRubro && props.rubro.level > 0
  
  console.log('Debug isEditingSubrubro:', {
    mode: props.mode,
    hasRubro,
    rubroLevel: props.rubro?.level,
    isEditMode,
    isSubrubroLevel,
    result: isEditMode && hasRubro && isSubrubroLevel
  })
  
  return isEditMode && hasRubro && isSubrubroLevel
})

const modalTitle = computed(() => {
  if (props.mode === 'edit') {
    const title = isEditingSubrubro.value ? 'Editar Sub-rubro' : 'Editar Rubro'
    console.log('Debug modalTitle:', {
      mode: props.mode,
      isEditingSubrubro: isEditingSubrubro.value,
      rubroLevel: props.rubro?.level,
      finalTitle: title
    })
    return title
  }
  return isSubrubro.value ? 'Crear Subrubro' : 'Crear Rubro'
})

const submitButtonText = computed(() => {
  return props.mode === 'create' ? 'Crear' : 'Actualizar'
})

const submitErrorTitle = computed(() => {
  return props.mode === 'create' ? 'Error al crear rubro' : 'Error al actualizar rubro'
})

const isFormValid = computed(() => {
  return form.value.name.trim().length >= 2 && 
         form.value.name.trim().length <= 100 &&
         !errors.value.name &&
         !errors.value.parent_id &&
         !isSubmitting.value
})

// Validation functions
const validateName = () => {
  const name = form.value.name.trim()
  
  if (!name) {
    errors.value.name = 'El nombre es requerido'
    return false
  }
  
  if (name.length < 2) {
    errors.value.name = 'El nombre debe tener al menos 2 caracteres'
    return false
  }
  
  if (name.length > 100) {
    errors.value.name = 'El nombre no puede exceder 100 caracteres'
    return false
  }
  
  errors.value.name = ''
  return true
}

const validateParent = async () => {
  // Para subrubros, el parent_id es requerido
  if (isSubrubro.value && !form.value.parent_id) {
    errors.value.parent_id = 'El rubro padre es requerido para subrubros'
    return false
  }

  // Para rubros normales o edición, si no hay parent_id, está bien
  if (!form.value.parent_id) {
    errors.value.parent_id = ''
    return true
  }

  // Check for self-reference (in edit mode)
  if (props.mode === 'edit' && props.rubro && form.value.parent_id === props.rubro.id) {
    errors.value.parent_id = 'Un rubro no puede ser padre de sí mismo'
    return false
  }

  // Check for circular reference (in edit mode)
  if (props.mode === 'edit' && props.rubro && form.value.parent_id) {
    const hasCycle = await checkCircularReference(props.rubro.id, form.value.parent_id)
    if (hasCycle) {
      errors.value.parent_id = 'No se puede crear una referencia circular'
      return false
    }
  }

  errors.value.parent_id = ''
  return true
}

// Circular reference check
const checkCircularReference = async (rubroId: string, newParentId: string): Promise<boolean> => {
  return await ensureNoCycle(rubroId, newParentId)
}

// Parent dropdown handling
const loadParentOptions = async (search = '') => {
  const cacheKey = search || 'default'
  
  // Check cache first
  if (parentCache.value.has(cacheKey)) {
    parentOptions.value = parentCache.value.get(cacheKey)!
    return
  }

  isLoadingParents.value = true
  try {
    const params: any = {
      page: 1,
      size: 50,
      status: 'active'
    }
    
    if (search) {
      params.q = search
    }

    // Exclude current rubro in edit mode to prevent self-reference
    if (props.mode === 'edit' && props.rubro) {
      // This would need backend support to exclude a specific ID
      // For now, we'll filter client-side
    }

    const response = await listRubros(params)
    
    let options = response.items.map(rubro => ({
      value: rubro.id,
      label: `${'—'.repeat(rubro.level)} ${rubro.name}`
    }))

    // Filter out self-reference in edit mode
    if (props.mode === 'edit' && props.rubro) {
      options = options.filter(opt => opt.value !== props.rubro!.id)
    }

    parentOptions.value = options
    parentCache.value.set(cacheKey, options)
  } catch (error) {
    console.error('Error loading parent options:', error)
    notifications.error('Error al cargar rubros padre')
  } finally {
    isLoadingParents.value = false
  }
}

const handleParentSearch = (search: string) => {
  loadParentOptions(search)
}

// Form submission
const handleSubmit = async () => {
  // Validate all fields
  const isNameValid = validateName()
  const isParentValid = await validateParent()
  
  if (!isNameValid || !isParentValid) {
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  try {
    const payload = {
      name: form.value.name.trim(),
      parentId: form.value.parent_id
    }

    let result: RubroDTO
    
    if (props.mode === 'create') {
      result = await store.createSubrubro(form.value.parent_id, payload)
      // Mostrar modal de éxito y guardar el nombre del rubro creado
      lastCreatedRubroName.value = result.name
      showSuccessModal.value = true
      // No cerrar el modal principal, solo reiniciar el formulario
      resetForm()
    } else {
      result = await store.updateRubro(props.rubro!.id, payload)
      notifications.success('Rubro actualizado exitosamente')
      // Cerrar el modal después de editar
      emit('success', result)
      handleClose()
    }
    
    // Refresh the tree/table
    if (form.value.parent_id) {
      await store.fetchChildren(form.value.parent_id)
    } else {
      await store.fetchTree()
      await store.fetchChildren(null)
    }
  } catch (error: any) {
    console.error('Error submitting form:', error)
    
    // Handle specific error codes
    const status = error.response?.status
    const code = error.response?.data?.code
    const field = error.response?.data?.field
    
    if (status === 400) {
      if (code === 'VALIDATION_ERROR') {
        if (field === 'name') {
          errors.value.name = error.response.data.error || 'Nombre inválido'
        } else if (field === 'parent_id') {
          errors.value.parent_id = error.response.data.error || 'Rubro padre inválido'
        }
      } else {
        submitError.value = error.response.data.error || 'Error de validación'
      }
    } else if (status === 403) {
      submitError.value = 'No tiene permisos para realizar esta acción'
    } else if (status === 404) {
      submitError.value = 'Rubro no encontrado'
    } else if (status === 409) {
      if (field === 'name') {
        errors.value.name = error.response.data.error || 'Ya existe un rubro con ese nombre'
      } else {
        submitError.value = error.response.data.error || 'Conflicto al guardar'
      }
    } else {
      submitError.value = error.response.data?.error || 'Error al guardar el rubro'
    }
    
    notifications.error('Error al guardar', submitError.value)
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  // Reiniciar el formulario manteniendo el parent_id actual para facilitar crear múltiples rubros
  const currentParentId = form.value.parent_id
  form.value = { name: '', parent_id: currentParentId }
  errors.value = { name: '', parent_id: '' }
  submitError.value = ''
  
  // Limpiar y recargar las opciones de padre para asegurar que estén actualizadas
  parentCache.value.clear()
  loadParentOptions()
}

const handleCreateAnother = () => {
  // El modal de éxito ya se cerró, solo necesitamos enfocar el campo de nombre
  showSuccessModal.value = false
  nextTick(() => {
    const nameInput = document.querySelector('input[placeholder="Ingrese el nombre del rubro"]') as HTMLInputElement
    nameInput?.focus()
  })
}

const handleClose = () => {
  isOpen.value = false
  // Reset form completely
  form.value = { name: '', parent_id: null }
  errors.value = { name: '', parent_id: '' }
  submitError.value = ''
  parentCache.value.clear()
}

// Watch for modal open/close
watch(isOpen, (open) => {
  if (open) {
    // Load parent options when modal opens
    loadParentOptions()
    
    // Populate form in edit mode
    if (props.mode === 'edit' && props.rubro) {
      form.value.name = props.rubro.name
      form.value.parent_id = props.rubro.parentId || null
    } else {
      // Reset form in create mode
      form.value = { name: '', parent_id: props.defaultParentId || null }
      errors.value = { name: '', parent_id: '' }
    }
  }
})

// Expose methods for parent component
defineExpose({
  validateName,
  validateParent,
  checkCircularReference,
  resetForm,
  handleCreateAnother
})
</script>
<template>
  <BaseModal
    v-model="isOpen"
    :title="modalTitle"
    size="lg"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Information -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Supplier Name -->
        <div class="md:col-span-2">
          <FormField
            label="Nombre del Proveedor"
            :error="errors.name"
            required
          >
            <BaseInput
              v-model="form.name"
              placeholder="Ej: Repuestos San Juan"
              :disabled="isSubmitting"
              @blur="validateSupplierName"
            />
          </FormField>
        </div>

        <!-- Supplier Code -->
        <div>
          <FormField
            label="Código de Proveedor"
            :error="errors.code"
            description="Código único dentro de la empresa (opcional)"
          >
            <BaseInput
              v-model="form.code"
              placeholder="Ej: RSJ01"
              :disabled="isSubmitting"
              @blur="validateSupplierCode"
            />
          </FormField>
        </div>


      </div>

      <!-- Contact Information -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Contact Email -->
        <div>
          <FormField
            label="Email de Contacto"
            :error="errors.email"
          >
            <BaseInput
              v-model="form.email"
              type="email"
              placeholder="ventas@rsj.com"
              :disabled="isSubmitting"
              @blur="validateContactEmail"
            />
          </FormField>
        </div>

        <!-- Contact Phone -->
        <div>
          <FormField
            label="Teléfono de Contacto"
            :error="errors.phone"
          >
            <BaseInput
              v-model="form.phone"
              type="tel"
              placeholder="2644001122"
              :disabled="isSubmitting"
              @blur="validateContactPhone"
            />
          </FormField>
        </div>
      </div>

      <!-- Additional Information -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Tax ID -->
        <div>
          <FormField
            label="CUIT/RUT/Tax ID"
            :error="errors.taxId"
          >
            <BaseInput
              v-model="form.taxId"
              placeholder="20-12345678-9"
              :disabled="isSubmitting"
            />
          </FormField>
        </div>

        <!-- Address -->
        <div>
          <FormField
            label="Dirección"
            :error="errors.address"
          >
            <BaseInput
              v-model="form.address"
              placeholder="Calle 123, Ciudad"
              :disabled="isSubmitting"
            />
          </FormField>
        </div>
      </div>

      <!-- Payment Terms -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Payment Terms -->
        <div>
          <FormField
            label="Términos de Pago (días)"
            :error="errors.paymentTerms"
            required
          >
            <BaseInput
              v-model.number="form.paymentTerms"
              type="number"
              min="0"
              placeholder="30"
              :disabled="isSubmitting"
              @blur="validatePaymentTerms"
            />
          </FormField>
        </div>

        <!-- Status -->
        <div class="flex items-end">
          <FormField
            label="Estado"
            :error="errors.status"
          >
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="isActive"
                :disabled="isSubmitting"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Proveedor activo</span>
            </label>
          </FormField>
        </div>
      </div>

      <!-- Error Alert -->
      <BaseAlert
        v-if="submitError"
        variant="danger"
        title="Error al guardar"
      >
        {{ submitError }}
      </BaseAlert>
    </form>

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
          :disabled="!isFormValid || isSubmitting"
        >
          {{ submitButtonText }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useSuppliersStore } from '@/stores/suppliers'
import { useNotifications } from '@/composables/useNotifications'
import BaseModal from '@/components/atoms/BaseModal.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import FormField from '@/components/atoms/FormField.vue'
import BaseAlert from '@/components/base/BaseAlert.vue'

interface Props {
  modelValue: boolean
  supplierId?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'supplier-saved'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  supplierId: null
})

const emit = defineEmits<Emits>()

// Stores and composables
const suppliersStore = useSuppliersStore()
const notifications = useNotifications()

// State
const isOpen = ref(false)
const isSubmitting = ref(false)
const isEditing = ref(false)
const submitError = ref<string | null>(null)

// Form data
const form = reactive({
  name: '',
  code: '',
  email: '',
  phone: '',
  taxId: '',
  address: '',
  paymentTerms: 30,
  status: 'active' as 'active' | 'inactive'
})

// Validation errors
const errors = reactive({
  name: '',
  code: '',
  email: '',
  phone: '',
  taxId: '',
  address: '',
  paymentTerms: '',
  status: ''
})

// Computed
const modalTitle = computed(() => {
  if (isEditing.value) {
    return form.name ? `Editar Proveedor: ${form.name}` : 'Editar Proveedor'
  }
  return 'Nuevo Proveedor'
})

const submitButtonText = computed(() => {
  return isEditing.value ? 'Actualizar' : 'Guardar cambios'
})

const isActive = computed({
  get: () => form.status === 'active',
  set: (value: boolean) => {
    form.status = value ? 'active' : 'inactive'
  }
})

const isFormValid = computed(() => {
  return (
    form.name.trim().length >= 2 &&
    form.name.trim().length <= 100 &&
    form.paymentTerms >= 0 &&
    (form.email === '' || isValidEmail(form.email))
  )
})

// Validation functions
const validateSupplierName = () => {
  const name = form.name.trim()
  if (!name) {
    errors.name = 'El nombre es requerido'
  } else if (name.length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres'
  } else if (name.length > 100) {
    errors.name = 'El nombre no puede exceder 100 caracteres'
  } else {
    errors.name = ''
  }
}

const validateSupplierCode = () => {
  const code = form.code.trim()
  if (code && code.length > 50) {
    errors.code = 'El código no puede exceder 50 caracteres'
  } else {
    errors.code = ''
  }
}

const validateContactEmail = () => {
  const email = form.email.trim()
  if (email && !isValidEmail(email)) {
    errors.email = 'El email no es válido'
  } else {
    errors.email = ''
  }
}

const validateContactPhone = () => {
  errors.phone = ''
}

const validatePaymentTerms = () => {
  const terms = form.paymentTerms
  if (terms < 0) {
    errors.paymentTerms = 'Los términos de pago deben ser mayores o iguales a 0'
  } else {
    errors.paymentTerms = ''
  }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Methods
const loadSupplierData = async () => {
  if (!props.supplierId) return
  
  console.log('Loading supplier data for ID:', props.supplierId)
  
  try {
    const supplier = await suppliersStore.get(props.supplierId)
    console.log('Loaded supplier data:', supplier)
    if (supplier && supplier.id) {
      Object.assign(form, {
        name: supplier.name || '',
        code: supplier.code || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        taxId: supplier.taxId || '',
        address: supplier.address || '',
        paymentTerms: supplier.paymentTerms || 30,
        status: supplier.status || 'active'
      })
    } else {
      console.warn('No supplier data found for ID:', props.supplierId)
      notifications.error('Error', 'Proveedor no encontrado')
      isEditing.value = false
    }
  } catch (error) {
    console.error('Error loading supplier data:', error)
    notifications.error('Error', 'No se pudo cargar la información del proveedor')
    // Reset to new supplier mode on error
    isEditing.value = false
  }
}

const handleSubmit = async () => {
  // Validate all fields
  validateSupplierName()
  validateSupplierCode()
  validateContactEmail()
  validateContactPhone()
  validatePaymentTerms()
  
  if (!isFormValid.value) {
    notifications.error('Error', 'Por favor complete todos los campos requeridos correctamente')
    return
  }

  try {
    isSubmitting.value = true
    submitError.value = null

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      taxId: form.taxId.trim(),
      address: form.address.trim(),
      paymentTerms: form.paymentTerms,
      status: form.status
    }

    if (isEditing.value && props.supplierId) {
      await suppliersStore.update(props.supplierId, payload)
      notifications.success('Éxito', 'Proveedor actualizado correctamente')
    } else {
      await suppliersStore.create(payload)
      notifications.success('Éxito', 'Proveedor creado correctamente')
    }

    emit('supplier-saved')
    handleClose()
  } catch (error: any) {
    console.error('Error saving supplier:', error)
    submitError.value = error.message || 'Error al guardar el proveedor'
    notifications.error('Error', submitError.value)
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  isOpen.value = false
  // Reset form
  Object.assign(form, {
    name: '',
    code: '',
    email: '',
    phone: '',
    taxId: '',
    address: '',
    paymentTerms: 30,
    status: 'active' as 'active' | 'inactive'
  })
  // Clear errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })
  submitError.value = null
  emit('update:modelValue', false)
}

// Watchers
watch(() => props.modelValue, async (newValue) => {
  console.log('Modal visibility changed:', newValue, 'Supplier ID:', props.supplierId)
  isOpen.value = newValue
  if (newValue && props.supplierId) {
    console.log('Opening in edit mode for supplier:', props.supplierId)
    isEditing.value = true
    await loadSupplierData()
  } else if (newValue) {
    console.log('Opening in create mode')
    isEditing.value = false
    // Reset form for new supplier
    Object.assign(form, {
      name: '',
      code: '',
      email: '',
      phone: '',
      taxId: '',
      address: '',
      paymentTerms: 30,
      status: 'active'
    })
  }
})

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue)
})

// Form validation watchers
watch(() => form.name, validateSupplierName)
watch(() => form.code, validateSupplierCode)
watch(() => form.email, validateContactEmail)
watch(() => form.phone, validateContactPhone)
watch(() => form.paymentTerms, validatePaymentTerms)

// Lifecycle
onMounted(() => {
  isOpen.value = props.modelValue
})
</script>
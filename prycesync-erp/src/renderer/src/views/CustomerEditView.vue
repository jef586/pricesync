<template>
  <DashboardLayout>
    <div class="customer-edit-view">
      <!-- Header -->
      <div class="page-header">
        <div class="flex items-center gap-4">
          <BaseButton
            variant="ghost"
            @click="$router.back()"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </BaseButton>
          <div>
            <h1 class="page-title">Editar Cliente</h1>
            <p class="page-subtitle" v-if="customer">{{ customer.name }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <BaseButton
            variant="ghost"
            @click="$router.back()"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="updateCustomer"
            :loading="isUpdating"
            :disabled="!isFormValid"
          >
            Guardar Cambios
          </BaseButton>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingCustomer" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Cargando cliente...</p>
        </div>
      </div>

      <form v-else @submit.prevent="updateCustomer" class="customer-form">
        <!-- Basic Information -->
        <BaseCard class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">Información Básica</h3>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput
              v-model="form.name"
              label="Nombre / Razón Social"
              placeholder="Ingrese el nombre del cliente"
              required
              :has-error="!!errors.name"
              :error-message="errors.name"
            />

            <BaseInput
              v-model="form.taxId"
              label="CUIT/CUIL/DNI"
              placeholder="XX-XXXXXXXX-X"
              required
              :has-error="!!errors.taxId"
              :error-message="errors.taxId"
            />

            <BaseSelect
              v-model="form.type"
              label="Tipo de Cliente"
              placeholder="Seleccionar tipo"
              :options="customerTypeOptions"
              required
              :has-error="!!errors.type"
              :error-message="errors.type"
            />

            <BaseSelect
              v-model="form.status"
              label="Estado"
              placeholder="Seleccionar estado"
              :options="statusOptions"
              required
              :has-error="!!errors.status"
              :error-message="errors.status"
            />
          </div>
        </BaseCard>

        <!-- Contact Information -->
        <BaseCard class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">Información de Contacto</h3>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput
              v-model="form.email"
              label="Email"
              type="email"
              placeholder="cliente@ejemplo.com"
              :has-error="!!errors.email"
              :error-message="errors.email"
            />

            <BaseInput
              v-model="form.phone"
              label="Teléfono"
              placeholder="+54 11 1234-5678"
              :has-error="!!errors.phone"
              :error-message="errors.phone"
            />
          </div>
        </BaseCard>

        <!-- Address Information -->
        <BaseCard class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">Dirección</h3>
          </template>

          <div class="space-y-6">
            <BaseInput
              v-model="form.address"
              label="Dirección"
              placeholder="Calle, número, piso, departamento"
              :has-error="!!errors.address"
              :error-message="errors.address"
            />

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BaseInput
                v-model="form.city"
                label="Ciudad"
                placeholder="Ciudad"
                :has-error="!!errors.city"
                :error-message="errors.city"
              />

              <BaseInput
                v-model="form.state"
                label="Provincia/Estado"
                placeholder="Provincia"
                :has-error="!!errors.state"
                :error-message="errors.state"
              />

              <BaseInput
                v-model="form.country"
                label="País"
                placeholder="País"
                :has-error="!!errors.country"
                :error-message="errors.country"
              />
            </div>
          </div>
        </BaseCard>

        <!-- Commercial Information -->
        <BaseCard class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">Información Comercial</h3>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput
              v-model="form.creditLimit"
              label="Límite de Crédito"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              :has-error="!!errors.creditLimit"
              :error-message="errors.creditLimit"
            />

            <BaseInput
              v-model="form.paymentTerms"
              label="Términos de Pago (días)"
              type="number"
              min="0"
              placeholder="30"
              :has-error="!!errors.paymentTerms"
              :error-message="errors.paymentTerms"
            />
          </div>
        </BaseCard>
      </form>

      <!-- Error Alert -->
      <div v-if="hasError" class="mb-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="text-sm font-medium text-red-800">Error al actualizar cliente</h3>
              <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import { useCustomers, type Customer, type CreateCustomerData } from '@/composables/useCustomers'

// Composables
const router = useRouter()
const route = useRoute()
const { 
  fetchCustomer, 
  updateCustomer: updateCustomerApi, 
  isLoading, 
  hasError, 
  error, 
  clearError 
} = useCustomers()

// State
const isLoadingCustomer = ref(false)
const isUpdating = ref(false)
const customer = ref<Customer | null>(null)

// Form data
const form = ref<CreateCustomerData>({
  name: '',
  taxId: '',
  type: 'individual',
  status: 'active',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: 'Argentina',
  creditLimit: 0,
  paymentTerms: 30
})

// Validation errors
const errors = ref<Record<string, string>>({})

// Options
const customerTypeOptions = [
  { value: 'individual', label: 'Persona Física' },
  { value: 'company', label: 'Empresa' },
  { value: 'government', label: 'Gobierno' }
]

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'suspended', label: 'Suspendido' }
]

// Computed
const isFormValid = computed(() => {
  return (
    form.value.name &&
    form.value.taxId &&
    form.value.type &&
    form.value.status
  )
})

// Methods
const loadCustomer = async () => {
  try {
    isLoadingCustomer.value = true
    clearError()
    const customerId = route.params.id as string
    const customerData = await fetchCustomer(customerId)
    
    customer.value = customerData
    
    // Populate form with customer data
    form.value = {
      name: customerData.name,
      taxId: customerData.taxId,
      type: customerData.type,
      status: customerData.status,
      email: customerData.email || '',
      phone: customerData.phone || '',
      address: customerData.address || '',
      city: customerData.city || '',
      state: customerData.state || '',
      country: customerData.country || 'Argentina',
      creditLimit: customerData.creditLimit || 0,
      paymentTerms: customerData.paymentTerms || 30
    }
    
  } catch (err) {
    console.error('Error loading customer:', err)
  } finally {
    isLoadingCustomer.value = false
  }
}

const validateForm = () => {
  errors.value = {}

  // Validación de nombre
  if (!form.value.name) {
    errors.value.name = 'El nombre es requerido'
  }

  // Validación de CUIT/CUIL/DNI
  if (!form.value.taxId) {
    errors.value.taxId = 'El CUIT/CUIL/DNI es requerido'
  } else if (!/^\d{2}-\d{8}-\d{1}$/.test(form.value.taxId) && !/^\d{11}$/.test(form.value.taxId)) {
    errors.value.taxId = 'Formato inválido. Use XX-XXXXXXXX-X o 11 dígitos'
  }

  // Validación de tipo
  if (!form.value.type) {
    errors.value.type = 'El tipo de cliente es requerido'
  }

  // Validación de estado
  if (!form.value.status) {
    errors.value.status = 'El estado es requerido'
  }

  // Validación de email (opcional pero debe ser válido si se proporciona)
  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'El formato del email es inválido'
  }

  // Validación de límite de crédito
  if (form.value.creditLimit && form.value.creditLimit < 0) {
    errors.value.creditLimit = 'El límite de crédito no puede ser negativo'
  }

  // Validación de términos de pago
  if (form.value.paymentTerms && form.value.paymentTerms < 0) {
    errors.value.paymentTerms = 'Los términos de pago no pueden ser negativos'
  }

  return Object.keys(errors.value).length === 0
}

const updateCustomer = async () => {
  if (!validateForm()) {
    return
  }

  try {
    isUpdating.value = true
    clearError()

    const customerId = route.params.id as string

    // Preparar datos para envío
    const customerData: Partial<CreateCustomerData> = {
      name: form.value.name,
      taxId: form.value.taxId,
      type: form.value.type,
      status: form.value.status,
      email: form.value.email || undefined,
      phone: form.value.phone || undefined,
      address: form.value.address || undefined,
      city: form.value.city || undefined,
      state: form.value.state || undefined,
      country: form.value.country || undefined,
      creditLimit: form.value.creditLimit || undefined,
      paymentTerms: form.value.paymentTerms || undefined
    }

    const updatedCustomer = await updateCustomerApi(customerId, customerData)
    customer.value = updatedCustomer
    
    // Redirigir a la vista de detalle del cliente
    router.push(`/customers/${updatedCustomer.id}`)
  } catch (err) {
    console.error('Error updating customer:', err)
    // Error is handled by the composable
  } finally {
    isUpdating.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadCustomer()
})
</script>

<style scoped>
.customer-edit-view {
  @apply p-6 max-w-4xl mx-auto;
}

.page-header {
  @apply flex items-center justify-between mb-6;
}

.page-title {
  @apply text-2xl font-bold text-gray-900;
}

.page-subtitle {
  @apply text-gray-600 mt-1;
}

.customer-form {
  @apply space-y-6;
}
</style>
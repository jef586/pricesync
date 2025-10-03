<template>
  <DashboardLayout>
    <div class="supplier-new-view">
      <!-- Header -->
      <PageHeader
        title="Nuevo Proveedor"
        subtitle="Crear un nuevo proveedor para la empresa"
      >
        <template #actions>
          <BaseButton
            variant="ghost"
            @click="$router.push('/suppliers')"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="handleSubmit"
            :loading="isLoading"
            :disabled="!isFormValid"
          >
            Crear Proveedor
          </BaseButton>
        </template>
      </PageHeader>

      <!-- Form -->
      <div class="bg-white rounded-lg shadow">
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Código"
              required
              :error="errors.code"
            >
              <BaseInput
                v-model="form.code"
                placeholder="Ej: PROV001"
                :error="!!errors.code"
                @blur="validateField('code')"
              />
            </FormField>

            <FormField
              label="RUC/DNI"
              required
              :error="errors.taxId"
            >
              <BaseInput
                v-model="form.taxId"
                placeholder="Ej: 20123456789"
                :error="!!errors.taxId"
                @blur="validateField('taxId')"
              />
            </FormField>
          </div>

          <FormField
            label="Nombre del Proveedor"
            required
            :error="errors.name"
          >
            <BaseInput
              v-model="form.name"
              placeholder="Nombre del proveedor"
              :error="!!errors.name"
              @blur="validateField('name')"
            />
          </FormField>

          <!-- Contact Information -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Email"
                :error="errors.email"
              >
                <BaseInput
                  v-model="form.email"
                  type="email"
                  placeholder="email@ejemplo.com"
                  :error="!!errors.email"
                  @blur="validateField('email')"
                />
              </FormField>

              <FormField
                label="Teléfono"
                :error="errors.phone"
              >
                <BaseInput
                  v-model="form.phone"
                  type="tel"
                  placeholder="Ej: +51 999 999 999"
                  :error="!!errors.phone"
                  @blur="validateField('phone')"
                />
              </FormField>
            </div>
          </div>

          <FormField
            label="Dirección"
            :error="errors.address"
          >
            <BaseTextarea
              v-model="form.address"
              placeholder="Dirección completa del proveedor"
              rows="3"
              :error="!!errors.address"
            />
          </FormField>

          <!-- Additional Information -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Información Adicional</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                label="Persona de Contacto"
                :error="errors.contactPerson"
              >
                <BaseInput
                  v-model="form.contactPerson"
                  placeholder="Nombre del contacto"
                  :error="!!errors.contactPerson"
                />
              </FormField>

              <FormField
                label="Sitio Web"
                :error="errors.website"
              >
                <BaseInput
                  v-model="form.website"
                  type="url"
                  placeholder="https://ejemplo.com"
                  :error="!!errors.website"
                />
              </FormField>

              <FormField
                label="Términos de Pago (días)"
                :error="errors.paymentTerms"
              >
                <BaseInput
                  v-model.number="form.paymentTerms"
                  type="number"
                  min="0"
                  placeholder="30"
                  :error="!!errors.paymentTerms"
                />
              </FormField>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField
                label="Límite de Crédito"
                :error="errors.creditLimit"
              >
                <BaseInput
                  v-model.number="form.creditLimit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  :error="!!errors.creditLimit"
                />
              </FormField>

              <div class="flex items-center">
                <input
                  id="isActive"
                  v-model="form.isActive"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="isActive" class="ml-2 block text-sm text-gray-900">
                  Proveedor activo
                </label>
              </div>
            </div>
          </div>

          <FormField
            label="Notas"
            :error="errors.notes"
          >
            <BaseTextarea
              v-model="form.notes"
              placeholder="Notas adicionales sobre el proveedor"
              rows="3"
              :error="!!errors.notes"
            />
          </FormField>
        </form>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'
import { useSuppliers } from '@/composables/useSuppliers'

// Components
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import FormField from '@/components/atoms/FormField.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

const router = useRouter()
const { success, notificationError } = useNotifications()
const { createSupplier, isLoading } = useSuppliers()

// Form state
const form = ref({
  code: '',
  name: '',
  taxId: '',
  email: '',
  phone: '',
  address: '',
  contactPerson: '',
  website: '',
  paymentTerms: 30,
  creditLimit: 0,
  isActive: true,
  notes: ''
})

const errors = ref<Record<string, string>>({})

// Validation
const validateField = (field: string) => {
  switch (field) {
    case 'code':
      if (!form.value.code.trim()) {
        errors.value.code = 'El código es requerido'
      } else {
        delete errors.value.code
      }
      break
    case 'name':
      if (!form.value.name.trim()) {
        errors.value.name = 'El nombre es requerido'
      } else {
        delete errors.value.name
      }
      break
    case 'taxId':
      if (!form.value.taxId.trim()) {
        errors.value.taxId = 'El RUC/DNI es requerido'
      } else {
        delete errors.value.taxId
      }
      break
    case 'email':
      if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
        errors.value.email = 'El email no es válido'
      } else {
        delete errors.value.email
      }
      break
    case 'website':
      if (form.value.website && !/^https?:\/\/.+/.test(form.value.website)) {
        errors.value.website = 'El sitio web debe comenzar con http:// o https://'
      } else {
        delete errors.value.website
      }
      break
  }
}

const validateForm = () => {
  validateField('code')
  validateField('name')
  validateField('taxId')
  validateField('email')
  validateField('website')
}

const isFormValid = computed(() => {
  return form.value.code.trim() && 
         form.value.name.trim() && 
         form.value.taxId.trim() &&
         Object.keys(errors.value).length === 0
})

// Submit handler
const handleSubmit = async () => {
  validateForm()
  
  if (!isFormValid.value) {
    notificationError('Por favor, corrija los errores en el formulario')
    return
  }

  try {
    const supplierData = {
      ...form.value,
      status: form.value.isActive ? 'active' : 'inactive'
    }
    
    await createSupplier(supplierData)
    success('Proveedor creado exitosamente')
    router.push('/suppliers')
  } catch (err) {
    console.error('Error creating supplier:', err)
    notificationError('Error al crear el proveedor')
  }
}

onMounted(() => {
  // Generate default code
  const timestamp = Date.now().toString().slice(-6)
  form.value.code = `PROV${timestamp}`
})
</script>
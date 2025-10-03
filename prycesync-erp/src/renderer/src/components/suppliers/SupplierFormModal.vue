<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor' }}
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="code" class="block text-sm font-medium text-gray-700 mb-1">
                Código *
              </label>
              <input
                id="code"
                v-model="form.code"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: PROV001"
              />
            </div>

            <div>
              <label for="taxId" class="block text-sm font-medium text-gray-700 mb-1">
                RUC/DNI *
              </label>
              <input
                id="taxId"
                v-model="form.taxId"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 20123456789"
              />
            </div>
          </div>

          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del proveedor"
            />
          </div>

          <!-- Contact Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@ejemplo.com"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: +51 999 999 999"
              />
            </div>
          </div>

          <div>
            <label for="address" class="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <textarea
              id="address"
              v-model="form.address"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Dirección completa del proveedor"
            ></textarea>
          </div>

          <!-- Additional Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="contactPerson" class="block text-sm font-medium text-gray-700 mb-1">
                Persona de Contacto
              </label>
              <input
                id="contactPerson"
                v-model="form.contactPerson"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre del contacto"
              />
            </div>

            <div>
              <label for="website" class="block text-sm font-medium text-gray-700 mb-1">
                Sitio Web
              </label>
              <input
                id="website"
                v-model="form.website"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://ejemplo.com"
              />
            </div>
          </div>

          <!-- Payment Terms -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="paymentTerms" class="block text-sm font-medium text-gray-700 mb-1">
                Términos de Pago (días)
              </label>
              <input
                id="paymentTerms"
                v-model.number="form.paymentTerms"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="30"
              />
            </div>

            <div>
              <label for="creditLimit" class="block text-sm font-medium text-gray-700 mb-1">
                Límite de Crédito
              </label>
              <input
                id="creditLimit"
                v-model.number="form.creditLimit"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Status -->
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

          <!-- Notes -->
          <div>
            <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              id="notes"
              v-model="form.notes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionales sobre el proveedor"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useSuppliers } from '@/composables/useSuppliers'

interface Props {
  supplier?: any
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'supplier-created', 'supplier-updated'])

const { createSupplier, updateSupplier } = useSuppliers()

// State
const isSubmitting = ref(false)
const isEditing = ref(!!props.supplier)

// Form data
const form = reactive({
  code: '',
  name: '',
  email: '',
  phone: '',
  taxId: '',
  address: '',
  contactPerson: '',
  website: '',
  paymentTerms: 30,
  creditLimit: 0,
  isActive: true,
  notes: ''
})

// Initialize form with supplier data if editing
if (props.supplier) {
  Object.assign(form, props.supplier)
}

// Methods
const handleSubmit = async () => {
  try {
    isSubmitting.value = true

    if (isEditing.value) {
      await updateSupplier(props.supplier.id, form)
      emit('supplier-updated')
    } else {
      await createSupplier(form)
      emit('supplier-created')
    }

  } catch (error) {
    console.error('Error saving supplier:', error)
    alert('Error al guardar el proveedor')
  } finally {
    isSubmitting.value = false
  }
}
</script>
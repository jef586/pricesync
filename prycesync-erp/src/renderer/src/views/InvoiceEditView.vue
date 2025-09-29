<template>
  <DashboardLayout>
    <div class="invoice-edit-view">
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
            <h1 class="page-title">Editar Factura {{ invoice?.number }}</h1>
            <p class="page-subtitle">Modifica los detalles de la factura</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <BaseButton
            variant="ghost"
            @click="saveDraft"
            :loading="isSavingDraft"
            :disabled="!canSaveDraft"
          >
            Guardar Borrador
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="updateInvoice"
            :loading="isUpdating"
            :disabled="!isFormValid"
          >
            Actualizar Factura
          </BaseButton>
        </div>
      </div>

      <div v-if="isLoadingInvoice" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <form v-else-if="invoice" @submit.prevent="updateInvoice" class="invoice-form">
        <!-- Invoice Details -->
        <BaseCard class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">Detalles de la Factura</h3>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BaseSelect
              v-model="form.type"
              label="Tipo de Factura"
              placeholder="Seleccionar tipo"
              :options="invoiceTypeOptions"
              required
              :has-error="!!errors.type"
              :error-message="errors.type"
            />

            <BaseInput
              v-model="form.number"
              label="Número de Factura"
              :disabled="true"
            />

            <BaseInput
              v-model="form.issueDate"
              label="Fecha de Emisión"
              type="date"
              required
              :error="errors.issueDate"
            />

            <BaseInput
              v-model="form.dueDate"
              label="Fecha de Vencimiento"
              type="date"
              :error="errors.dueDate"
            />

            <BaseInput
              v-model="form.paymentTerms"
              label="Términos de Pago (días)"
              type="number"
              min="0"
              @input="updateDueDate"
            />

            <BaseInput
              v-model="form.currency"
              label="Moneda"
              required
              :error="errors.currency"
            >
              <select v-model="form.currency" class="form-select">
                <option value="ARS">Peso Argentino (ARS)</option>
                <option value="USD">Dólar Estadounidense (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </BaseInput>
          </div>

          <div class="mt-6">
            <BaseInput
              v-model="form.notes"
              label="Notas"
              type="textarea"
              rows="3"
              placeholder="Notas adicionales sobre la factura..."
            />
          </div>
        </BaseCard>

        <!-- Customer Selection -->
        <BaseCard class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">Cliente</h3>
          </template>

          <div class="space-y-4">
            <div v-if="selectedCustomer" class="border rounded-lg p-4 bg-gray-50">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-gray-900">{{ selectedCustomer.name }}</h4>
                  <p class="text-sm text-gray-600">{{ selectedCustomer.email }}</p>
                  <p class="text-sm text-gray-600">CUIT: {{ selectedCustomer.taxId }}</p>
                </div>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="clearCustomer"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </BaseButton>
              </div>
            </div>

            <div v-else class="relative">
              <BaseInput
                v-model="customerSearch"
                label="Buscar Cliente"
                placeholder="Buscar por nombre, email o CUIT..."
                @input="searchCustomers"
                :error="errors.customerId"
              />

              <div v-if="customerResults.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                <div
                  v-for="customer in customerResults"
                  :key="customer.id"
                  @click="selectCustomer(customer)"
                  class="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div class="font-medium text-gray-900">{{ customer.name }}</div>
                  <div class="text-sm text-gray-600">{{ customer.email }}</div>
                  <div class="text-sm text-gray-600">CUIT: {{ customer.taxId }}</div>
                </div>
              </div>

              <div class="mt-2">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="showNewCustomerModal = true"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Nuevo Cliente
                </BaseButton>
              </div>
            </div>

            <div v-if="errors.customerId" class="text-red-600 text-sm">{{ errors.customerId }}</div>
          </div>
        </BaseCard>

        <!-- Invoice Items -->
        <BaseCard class="mb-6">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Productos/Servicios</h3>
              <BaseButton
                variant="ghost"
                @click="addItem"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Ítem
              </BaseButton>
            </div>
          </template>

          <div class="space-y-4">
            <div
              v-for="(item, index) in form.items"
              :key="item.tempId || item.id"
              class="border rounded-lg p-4 bg-gray-50"
            >
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div class="md:col-span-4">
                  <BaseInput
                    v-model="item.description"
                    label="Descripción"
                    required
                    :error="errors[`items.${index}.description`]"
                  />
                </div>

                <div class="md:col-span-2">
                  <BaseInput
                    v-model.number="item.quantity"
                    label="Cantidad"
                    type="number"
                    min="1"
                    step="1"
                    required
                    :error="errors[`items.${index}.quantity`]"
                    @input="calculateItemSubtotal(item)"
                  />
                </div>

                <div class="md:col-span-2">
                  <BaseInput
                    v-model.number="item.unitPrice"
                    label="Precio Unitario"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    :error="errors[`items.${index}.unitPrice`]"
                    @input="calculateItemSubtotal(item)"
                  />
                </div>

                <div class="md:col-span-1">
                  <BaseInput
                    v-model.number="item.taxRate"
                    label="IVA (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    @input="calculateItemSubtotal(item)"
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
                  <div class="text-lg font-semibold text-gray-900">
                    {{ formatCurrency(item.subtotal || 0) }}
                  </div>
                </div>

                <div class="md:col-span-1">
                  <BaseButton
                    variant="danger"
                    size="sm"
                    @click="removeItem(index)"
                    :disabled="form.items.length === 1"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </BaseButton>
                </div>
              </div>
            </div>

            <div v-if="errors.items" class="text-red-600 text-sm">{{ errors.items }}</div>
          </div>
        </BaseCard>

        <!-- Totals -->
        <BaseCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">Totales</h3>
          </template>

          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Subtotal:</span>
              <span class="font-medium">{{ formatCurrency(totals.subtotal) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">IVA:</span>
              <span class="font-medium">{{ formatCurrency(totals.tax) }}</span>
            </div>
            <div class="border-t pt-3">
              <div class="flex justify-between items-center">
                <span class="text-lg font-semibold text-gray-900">Total:</span>
                <span class="text-xl font-bold text-gray-900">{{ formatCurrency(totals.total) }}</span>
              </div>
            </div>
          </div>
        </BaseCard>
      </form>

      <!-- Error Alert -->
      <div v-if="hasError" class="fixed bottom-4 right-4 max-w-md">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800">{{ error }}</p>
            </div>
            <div class="ml-auto pl-3">
              <button
                @click="clearError"
                class="inline-flex text-red-400 hover:text-red-600"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../components/organisms/DashboardLayout.vue'
import BaseButton from '../components/atoms/BaseButton.vue'
import BaseCard from '../components/atoms/BaseCard.vue'
import BaseInput from '../components/atoms/BaseInput.vue'
import BaseSelect from '../components/atoms/BaseSelect.vue'
import { useInvoices, type Invoice, type CreateInvoiceData, type InvoiceItem } from '../composables/useInvoices'

const route = useRoute()
const router = useRouter()

// Composables
const {
  isLoading,
  hasError,
  error,
  fetchInvoice,
  updateInvoice: updateInvoiceAPI,
  clearError,
  formatCurrency
} = useInvoices()

// Local state
const isLoadingInvoice = ref(true)
const isUpdating = ref(false)
const isSavingDraft = ref(false)
const customerSearch = ref('')
const customerResults = ref<any[]>([])
const selectedCustomer = ref<any>(null)
const showNewCustomerModal = ref(false)
const invoice = ref<Invoice | null>(null)

// Form data
const form = ref<CreateInvoiceData & { number?: string }>({
  type: '',
  customerId: '',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  paymentTerms: 30,
  currency: 'ARS',
  notes: '',
  items: []
})

// Validation errors
const errors = ref<Record<string, string>>({})

// Invoice type options
const invoiceTypeOptions = [
  { value: 'A', label: 'Factura A' },
  { value: 'B', label: 'Factura B' },
  { value: 'C', label: 'Factura C' }
]

// Computed
const totals = computed(() => {
  const subtotal = form.value.items.reduce((sum, item) => {
    const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0)
    return sum + itemSubtotal
  }, 0)

  const tax = form.value.items.reduce((sum, item) => {
    const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0)
    const itemTax = itemSubtotal * ((item.taxRate || 0) / 100)
    return sum + itemTax
  }, 0)

  return {
    subtotal,
    tax,
    total: subtotal + tax
  }
})

const isFormValid = computed(() => {
  return (
    form.value.type &&
    form.value.customerId &&
    form.value.issueDate &&
    form.value.currency &&
    form.value.items.length > 0 &&
    form.value.items.every(item => 
      item.description && 
      item.quantity > 0 && 
      item.unitPrice >= 0
    )
  )
})

const canSaveDraft = computed(() => {
  return form.value.type || form.value.customerId || form.value.items.some(item => item.description)
})

// Methods
const loadInvoice = async () => {
  try {
    isLoadingInvoice.value = true
    clearError()
    const invoiceId = route.params.id as string
    const invoiceData = await fetchInvoice(invoiceId)
    
    invoice.value = invoiceData
    
    // Populate form with invoice data
    form.value = {
      type: invoiceData.type,
      customerId: invoiceData.customer.id,
      issueDate: invoiceData.issueDate.split('T')[0],
      dueDate: invoiceData.dueDate ? invoiceData.dueDate.split('T')[0] : '',
      paymentTerms: invoiceData.dueDate ? 
        Math.ceil((new Date(invoiceData.dueDate).getTime() - new Date(invoiceData.issueDate).getTime()) / (1000 * 60 * 60 * 24)) : 30,
      currency: 'ARS', // Default, could be from invoice data
      notes: invoiceData.notes || '',
      number: invoiceData.number,
      items: invoiceData.items.map(item => ({
        id: item.id,
        tempId: item.id,
        description: item.description || item.product?.name || item.product?.description || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        subtotal: item.subtotal
      }))
    }
    
    // Set selected customer
    selectedCustomer.value = invoiceData.customer
    
  } catch (err) {
    console.error('Error loading invoice:', err)
  } finally {
    isLoadingInvoice.value = false
  }
}

const updateDueDate = () => {
  if (form.value.issueDate && form.value.paymentTerms) {
    const issueDate = new Date(form.value.issueDate)
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + form.value.paymentTerms)
    form.value.dueDate = dueDate.toISOString().split('T')[0]
  }
}

const addItem = () => {
  form.value.items.push({
    tempId: Date.now().toString(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 21,
    subtotal: 0
  })
}

const removeItem = (index: number) => {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1)
  }
}

const calculateItemSubtotal = (item: any) => {
  const quantity = item.quantity || 0
  const unitPrice = item.unitPrice || 0
  item.subtotal = quantity * unitPrice
}

const searchCustomers = async () => {
  // TODO: Implement customer search
  console.log('Searching customers:', customerSearch.value)
}

const selectCustomer = (customer: any) => {
  form.value.customerId = customer.id
  selectedCustomer.value = customer
  customerResults.value = []
  customerSearch.value = ''
  delete errors.value.customerId
}

const clearCustomer = () => {
  form.value.customerId = ''
  selectedCustomer.value = null
  customerSearch.value = ''
}

const validateForm = () => {
  errors.value = {}

  // Validación de tipo de factura
  if (!form.value.type) {
    errors.value.type = 'El tipo de factura es requerido'
  }

  // Validación de cliente
  if (!form.value.customerId) {
    errors.value.customerId = 'Debe seleccionar un cliente'
  }

  // Validación de fecha de emisión
  if (!form.value.issueDate) {
    errors.value.issueDate = 'La fecha de emisión es requerida'
  } else {
    const issueDate = new Date(form.value.issueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (issueDate > today) {
      errors.value.issueDate = 'La fecha de emisión no puede ser futura'
    }
  }

  // Validación de fecha de vencimiento
  if (form.value.dueDate) {
    const issueDate = new Date(form.value.issueDate)
    const dueDate = new Date(form.value.dueDate)
    
    if (dueDate < issueDate) {
      errors.value.dueDate = 'La fecha de vencimiento no puede ser anterior a la fecha de emisión'
    }
  }

  // Validación de moneda
  if (!form.value.currency) {
    errors.value.currency = 'La moneda es requerida'
  }

  // Validación de ítems
  if (form.value.items.length === 0) {
    errors.value.items = 'Debe agregar al menos un ítem a la factura'
  } else {
    let hasValidItems = false
    form.value.items.forEach((item, index) => {
      if (!item.description?.trim()) {
        errors.value[`items.${index}.description`] = 'La descripción es requerida'
      } else if (item.description.length > 500) {
        errors.value[`items.${index}.description`] = 'La descripción no puede exceder 500 caracteres'
      }
      
      if (!item.quantity || item.quantity <= 0) {
        errors.value[`items.${index}.quantity`] = 'La cantidad debe ser mayor a 0'
      } else if (item.quantity > 999999) {
        errors.value[`items.${index}.quantity`] = 'La cantidad no puede exceder 999,999'
      }
      
      if (item.unitPrice < 0) {
        errors.value[`items.${index}.unitPrice`] = 'El precio unitario no puede ser negativo'
      } else if (item.unitPrice > 999999999) {
        errors.value[`items.${index}.unitPrice`] = 'El precio unitario es demasiado alto'
      }
      
      if (item.taxRate < 0 || item.taxRate > 100) {
        errors.value[`items.${index}.taxRate`] = 'El IVA debe estar entre 0% y 100%'
      }
      
      // Verificar si hay al menos un ítem válido
      if (item.description?.trim() && item.quantity > 0 && item.unitPrice >= 0) {
        hasValidItems = true
      }
    })
    
    if (!hasValidItems) {
      errors.value.items = 'Debe tener al menos un ítem válido con descripción, cantidad y precio'
    }
  }

  // Validación de totales
  if (totals.value.total <= 0) {
    errors.value.total = 'El total de la factura debe ser mayor a 0'
  } else if (totals.value.total > 999999999) {
    errors.value.total = 'El total de la factura es demasiado alto'
  }

  return Object.keys(errors.value).length === 0
}

// Validación en tiempo real para ítems
const validateItem = (item: any, index: number) => {
  // Limpiar errores previos del ítem
  Object.keys(errors.value).forEach(key => {
    if (key.startsWith(`items.${index}.`)) {
      delete errors.value[key]
    }
  })

  if (item.description?.trim() && item.quantity > 0 && item.unitPrice >= 0) {
    calculateItemSubtotal(item)
  }
}

const updateInvoice = async () => {
  if (!validateForm() || !invoice.value) return

  isUpdating.value = true
  try {
    const invoiceData = {
      type: form.value.type,
      customerId: form.value.customerId,
      dueDate: form.value.dueDate,
      notes: form.value.notes,
      items: form.value.items.map(item => ({
        id: item.id,
        productId: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxRate: item.taxRate || 21
      }))
    }

    await updateInvoiceAPI(invoice.value.id, invoiceData)
    router.push(`/invoices/${invoice.value.id}`)
  } catch (err) {
    // Error is handled by the composable
  } finally {
    isUpdating.value = false
  }
}

const saveDraft = async () => {
  if (!invoice.value) return
  
  isSavingDraft.value = true
  try {
    const invoiceData = {
      ...form.value,
      status: 'draft' as const,
      subtotal: totals.value.subtotal,
      tax: totals.value.tax,
      total: totals.value.total
    }

    await updateInvoiceAPI(invoice.value.id, invoiceData)
    router.push(`/invoices/${invoice.value.id}`)
  } catch (err) {
    // Error is handled by the composable
  } finally {
    isSavingDraft.value = false
  }
}

// Watchers
watch(() => form.value.paymentTerms, updateDueDate)
watch(() => form.value.issueDate, updateDueDate)

// Lifecycle
onMounted(() => {
  loadInvoice()
})
</script>

<style scoped>
.invoice-edit-view {
  @apply p-6 max-w-6xl mx-auto;
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

.invoice-form {
  @apply space-y-6;
}

.form-select {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}

.form-select:focus {
  @apply ring-2 ring-blue-500 border-blue-500;
}
</style>
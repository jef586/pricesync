<template>
  <DashboardLayout>
    <div class="sales-pos-view">
      <PageHeader
        title="Ventas (POS)"
        subtitle="Registrar ventas rápidas usando precios de lista"
      >
        <template #actions>
          <BaseButton variant="primary" @click="submitSale" :disabled="isSubmitting || cartItems.length === 0 || !selectedCustomer">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a5 5 0 00-10 0v2M5 9h14l1 12H4L5 9z" />
            </svg>
            Cobrar
          </BaseButton>
        </template>
      </PageHeader>

      <!-- Selección de cliente -->
      <BaseCard class="mb-6">
        <template #header>
          <h3 class="text-lg font-medium text-gray-900">Cliente</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2">
            <BaseInput v-model="customerQuery" placeholder="Buscar cliente por nombre o CUIT" @input="debouncedSearchCustomer" />
            <div v-if="customerResults.length > 0" class="mt-2 bg-white border rounded shadow">
              <ul>
                <li v-for="cust in customerResults" :key="cust.id" class="px-3 py-2 hover:bg-gray-50 cursor-pointer" @click="selectCustomer(cust)">
                  <div class="text-sm font-medium text-gray-900">{{ cust.name }}</div>
                  <div class="text-xs text-gray-500">CUIT: {{ cust.taxId }}</div>
                </li>
              </ul>
            </div>
          </div>
          <div class="md:col-span-1">
            <div class="p-3 bg-gray-50 rounded">
              <p class="text-xs text-gray-600">Cliente seleccionado</p>
              <p class="text-sm font-semibold text-gray-900" v-if="selectedCustomer">{{ selectedCustomer.name }}</p>
              <p class="text-sm text-gray-400" v-else>Ninguno</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Búsqueda y agregado de productos -->
      <BaseCard class="mb-6">
        <template #header>
          <h3 class="text-lg font-medium text-gray-900">Productos</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2">
            <BaseInput v-model="productQuery" placeholder="Buscar producto por código o nombre" @input="debouncedSearchProduct" />
            <div v-if="productResults.length > 0" class="mt-2 bg-white border rounded shadow max-h-64 overflow-y-auto">
              <ul>
                <li v-for="prod in productResults" :key="prod.id" class="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between" @click="addProductToCart(prod)">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ prod.name }}</div>
                    <div class="text-xs text-gray-500">{{ prod.code }}</div>
                  </div>
                  <div class="text-sm text-gray-700">${{ formatCurrency(prod.salePrice) }}</div>
                </li>
              </ul>
            </div>
          </div>
          <div class="md:col-span-1">
            <div class="p-3 bg-gray-50 rounded">
              <p class="text-xs text-gray-600">Items en carrito</p>
              <p class="text-2xl font-semibold text-gray-900">{{ cartItems.length }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Carrito -->
      <BaseCard>
        <template #header>
          <h3 class="text-lg font-medium text-gray-900">Carrito</h3>
        </template>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Desc.</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                <th class="px-6 py-3" />
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="cartItems.length === 0">
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">No hay productos en el carrito</td>
              </tr>
              <tr v-else v-for="(item, idx) in cartItems" :key="item.tempId" class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ item.name }}</div>
                  <div class="text-xs text-gray-500">{{ item.code }}</div>
                </td>
                <td class="px-6 py-4 text-right">
                  <BaseInput type="number" min="1" step="1" v-model.number="item.quantity" @input="updateItemTotals(item)" />
                </td>
                <td class="px-6 py-4 text-right">
                  <BaseInput type="number" min="0" step="0.01" v-model.number="item.unitPrice" @input="updateItemTotals(item)" />
                </td>
                <td class="px-6 py-4 text-right">
                  <BaseInput type="number" min="0" step="0.01" v-model.number="item.discount" @input="updateItemTotals(item)" />
                </td>
                <td class="px-6 py-4 text-right">
                  {{ formatCurrency(item.quantity * item.unitPrice - (item.discount || 0)) }}
                </td>
                <td class="px-6 py-4 text-right">
                  <BaseButton variant="ghost" size="sm" @click="removeFromCart(idx)">Eliminar</BaseButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totales -->
        <div class="mt-4 p-4 bg-gray-50 rounded grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-sm text-gray-600">Subtotal</p>
            <p class="text-lg font-semibold text-gray-900">${{ formatCurrency(totals.subtotal) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Impuestos (IVA)</p>
            <p class="text-lg font-semibold text-gray-900">${{ formatCurrency(totals.tax) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Total</p>
            <p class="text-2xl font-bold text-gray-900">${{ formatCurrency(totals.total) }}</p>
          </div>
        </div>
      </BaseCard>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import { useProducts } from '@/composables/useProducts'
import { useCustomers } from '@/composables/useCustomers'
import { useInvoices, type CreateInvoiceData } from '@/composables/useInvoices'
import { usePOS } from '@/composables/usePOS'

// Composables
const { searchProducts } = useProducts()
const { searchCustomers } = useCustomers()
const { createInvoice, formatCurrency } = useInvoices()
const { computeTotals, computeInvoicePayload } = usePOS()

// Estado local
const productQuery = ref('')
const productResults = ref<any[]>([])
const customerQuery = ref('')
const customerResults = ref<any[]>([])
const selectedCustomer = ref<any | null>(null)
const isSubmitting = ref(false)

// Carrito
const cartItems = ref<Array<{ tempId: string, productId: string, name: string, code: string, quantity: number, unitPrice: number, discount?: number }>>([])

// Totales
const totals = ref({ subtotal: 0, tax: 0, total: 0 })

// Métodos
const debounce = (fn: Function, ms = 300) => {
  let t: any
  return (...args: any[]) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

const debouncedSearchProduct = debounce(async () => {
  productResults.value = await searchProducts(productQuery.value, 10)
})

const debouncedSearchCustomer = debounce(async () => {
  customerResults.value = await searchCustomers(customerQuery.value, 10)
})

const selectCustomer = (cust: any) => {
  selectedCustomer.value = cust
  customerResults.value = []
  customerQuery.value = cust.name
}

const addProductToCart = (prod: any) => {
  const item = {
    tempId: Math.random().toString(36).slice(2),
    productId: prod.id,
    name: prod.name,
    code: prod.code,
    quantity: 1,
    unitPrice: prod.salePrice || 0,
    discount: 0
  }
  cartItems.value.push(item)
  productResults.value = []
  productQuery.value = ''
  recalcTotals()
}

const removeFromCart = (index: number) => {
  cartItems.value.splice(index, 1)
  recalcTotals()
}

const updateItemTotals = (_item: any) => {
  recalcTotals()
}

const recalcTotals = () => {
  totals.value = computeTotals(cartItems.value)
}

const submitSale = async () => {
  if (!selectedCustomer.value || cartItems.value.length === 0) return
  isSubmitting.value = true
  try {
    const payload: CreateInvoiceData = computeInvoicePayload(cartItems.value, selectedCustomer.value.id, 'B')
    const invoice = await createInvoice(payload)
    // Redirigir a detalle de factura
    window.location.href = `/invoices/${invoice.id}`
  } catch (err) {
    console.error('Error al registrar venta:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.sales-pos-view {
  @apply p-6 max-w-6xl mx-auto space-y-6;
}
</style>
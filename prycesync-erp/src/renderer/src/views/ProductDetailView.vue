<template>
  <DashboardLayout>
    <div class="product-detail-view">
      <!-- Loading State -->
      <div v-if="isLoading" class="bg-white rounded-lg shadow p-6">
        <div class="animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
            <div class="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>

      <!-- Product Details -->
      <div v-else-if="currentProduct" class="space-y-6">
        <!-- Header -->
        <PageHeader
          :title="currentProduct.name"
          :subtitle="`SKU: ${currentProduct.sku}`"
        >
          <template #actions>
            <BaseButton
              variant="ghost"
              @click="$router.push('/inventory')"
            >
              Volver al Inventario
            </BaseButton>
            <BaseButton
              variant="outline"
              @click="showStockModal = true"
            >
              Actualizar Stock
            </BaseButton>
            <BaseButton
              variant="primary"
              @click="$router.push(`/products/${currentProduct.id}/edit`)"
            >
              Editar Producto
            </BaseButton>
          </template>
        </PageHeader>

        <!-- Status Badge -->
        <div class="flex items-center gap-4">
          <span :class="[
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
            getStatusClasses(currentProduct.status)
          ]">
            {{ getStatusLabel(currentProduct.status) }}
          </span>
          
          <span v-if="isLowStock" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            Stock Bajo
          </span>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Product Information -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Basic Info -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Información del Producto</h3>
              <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt class="text-sm font-medium text-gray-500">Nombre</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ currentProduct.name }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">SKU</dt>
                  <dd class="mt-1 text-sm text-gray-900 font-mono">{{ currentProduct.sku }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Categoría</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    <span v-if="currentProduct.category" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {{ currentProduct.category.name }}
                    </span>
                    <span v-else class="text-gray-400">Sin categoría</span>
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Unidad</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ currentProduct.unit }}</dd>
                </div>
                <div v-if="currentProduct.description" class="md:col-span-2">
                  <dt class="text-sm font-medium text-gray-500">Descripción</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ currentProduct.description }}</dd>
                </div>
              </dl>
            </div>

            <!-- Pricing -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Precios</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-gray-50 rounded-lg p-4">
                  <dt class="text-sm font-medium text-gray-500">Precio de Costo</dt>
                  <dd class="mt-1 text-2xl font-semibold text-gray-900">
                    ${{ formatCurrency(currentProduct.costPrice) }}
                  </dd>
                </div>
                <div class="bg-blue-50 rounded-lg p-4">
                  <dt class="text-sm font-medium text-blue-600">Precio de Venta</dt>
                  <dd class="mt-1 text-2xl font-semibold text-blue-900">
                    ${{ formatCurrency(currentProduct.salePrice) }}
                  </dd>
                </div>
                <div class="bg-green-50 rounded-lg p-4">
                  <dt class="text-sm font-medium text-green-600">Margen</dt>
                  <dd class="mt-1 text-2xl font-semibold text-green-900">
                    {{ profitMargin.toFixed(1) }}%
                  </dd>
                  <dd class="text-sm text-green-600">
                    ${{ formatCurrency(profitAmount) }}
                  </dd>
                </div>
              </div>
            </div>

            <!-- Stock History (Placeholder) -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Historial de Stock</h3>
              <div class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h4 class="mt-2 text-sm font-medium text-gray-900">Historial no disponible</h4>
                <p class="mt-1 text-sm text-gray-500">
                  El historial de movimientos de stock estará disponible próximamente.
                </p>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Stock Info -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Stock</h3>
              <div class="space-y-4">
                <div class="text-center">
                  <div :class="[
                    'text-3xl font-bold',
                    isLowStock ? 'text-red-600' : 'text-gray-900'
                  ]">
                    {{ currentProduct.stockQuantity }}
                  </div>
                  <div class="text-sm text-gray-500">{{ currentProduct.unit }}</div>
                </div>
                
                <div class="border-t pt-4 space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Stock mínimo:</span>
                    <span class="text-gray-900">
                      {{ currentProduct.minStock || 'No definido' }}
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Stock máximo:</span>
                    <span class="text-gray-900">
                      {{ currentProduct.maxStock || 'No definido' }}
                    </span>
                  </div>
                </div>

                <BaseButton
                  variant="primary"
                  class="w-full"
                  @click="showStockModal = true"
                >
                  Actualizar Stock
                </BaseButton>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Estadísticas</h3>
              <div class="space-y-4">
                <div class="bg-blue-50 rounded-lg p-4">
                  <dt class="text-sm font-medium text-blue-600">Valor en Stock</dt>
                  <dd class="mt-1 text-xl font-semibold text-blue-900">
                    ${{ formatCurrency(stockValue) }}
                  </dd>
                </div>
                
                <!-- Placeholder for future metrics -->
                <div class="text-center py-4 text-sm text-gray-500">
                  Más estadísticas próximamente
                </div>
              </div>
            </div>

            <!-- Metadata -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Información del Sistema</h3>
              <dl class="space-y-2 text-sm">
                <div>
                  <dt class="text-gray-500">Creado:</dt>
                  <dd class="text-gray-900">{{ formatDate(currentProduct.createdAt) }}</dd>
                </div>
                <div>
                  <dt class="text-gray-500">Última actualización:</dt>
                  <dd class="text-gray-900">{{ formatDate(currentProduct.updatedAt) }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="bg-white rounded-lg shadow p-6">
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Error al cargar el producto</h3>
          <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
          <div class="mt-6">
            <BaseButton
              variant="primary"
              @click="loadProduct"
            >
              Reintentar
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Stock Update Modal -->
      <StockUpdateModal
        v-if="showStockModal"
        :product="currentProduct"
        @close="showStockModal = false"
        @updated="handleStockUpdated"
      />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProducts } from '@/composables/useProducts'

// Components
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import StockUpdateModal from '@/components/products/StockUpdateModal.vue'

const router = useRouter()
const route = useRoute()

// Composables
const {
  currentProduct,
  isLoading,
  hasError,
  error,
  fetchProduct
} = useProducts()

// State
const showStockModal = ref(false)

// Computed
const isLowStock = computed(() => {
  if (!currentProduct.value) return false
  return currentProduct.value.minStock && 
         currentProduct.value.stockQuantity <= currentProduct.value.minStock
})

const profitMargin = computed(() => {
  if (!currentProduct.value) return 0
  const { costPrice, salePrice } = currentProduct.value
  if (!costPrice || !salePrice) return 0
  return ((salePrice - costPrice) / costPrice) * 100
})

const profitAmount = computed(() => {
  if (!currentProduct.value) return 0
  return currentProduct.value.salePrice - currentProduct.value.costPrice
})

const stockValue = computed(() => {
  if (!currentProduct.value) return 0
  return currentProduct.value.costPrice * currentProduct.value.stockQuantity
})

// Methods
const loadProduct = async () => {
  const productId = route.params.id as string
  if (productId) {
    try {
      await fetchProduct(productId)
    } catch (error) {
      console.error('Error loading product:', error)
    }
  }
}

const handleStockUpdated = () => {
  showStockModal.value = false
  loadProduct() // Reload to get updated stock
}

const getStatusLabel = (status: string) => {
  const labels = {
    active: 'Activo',
    inactive: 'Inactivo',
    discontinued: 'Descontinuado'
  }
  return labels[status] || status
}

const getStatusClasses = (status: string) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    discontinued: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

// Lifecycle
onMounted(() => {
  loadProduct()
})
</script>
<template>
  <DashboardLayout>
    <div class="supplier-detail-view">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-4">
          <button
            @click="$router.go(-1)"
            class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <div v-if="supplier">
            <h1 class="text-2xl font-bold text-gray-900">{{ supplier.name }}</h1>
            <p class="text-gray-600">{{ supplier.code }} - Gestión de productos</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button
            @click="showImportModal = true"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Importar Productos
          </button>
          <button
            @click="showNewProductModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </button>
        </div>
      </div>

      <!-- Supplier Info Card -->
      <div v-if="supplier" class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Información del Proveedor</h3>
            <dl class="space-y-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">Código</dt>
                <dd class="text-sm text-gray-900">{{ supplier.code }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Nombre</dt>
                <dd class="text-sm text-gray-900">{{ supplier.name }}</dd>
              </div>
              <div v-if="supplier.email">
                <dt class="text-sm font-medium text-gray-500">Email</dt>
                <dd class="text-sm text-gray-900">{{ supplier.email }}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Contacto</h3>
            <dl class="space-y-2">
              <div v-if="supplier.phone">
                <dt class="text-sm font-medium text-gray-500">Teléfono</dt>
                <dd class="text-sm text-gray-900">{{ supplier.phone }}</dd>
              </div>
              <div v-if="supplier.taxId">
                <dt class="text-sm font-medium text-gray-500">RUC/DNI</dt>
                <dd class="text-sm text-gray-900">{{ supplier.taxId }}</dd>
              </div>
              <div v-if="supplier.address">
                <dt class="text-sm font-medium text-gray-500">Dirección</dt>
                <dd class="text-sm text-gray-900">{{ supplier.address }}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Estadísticas</h3>
            <dl class="space-y-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">Total Productos</dt>
                <dd class="text-sm text-gray-900">{{ supplier._count?.products || 0 }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Estado</dt>
                <dd>
                  <span :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]">
                    {{ supplier.status === 'active' ? 'Activo' : 'Inactivo' }}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <!-- Products Section -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Productos del Proveedor</h3>
        </div>
        
        <!-- Filters -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <input
                v-model="productFilters.search"
                @input="debouncedProductSearch"
                type="text"
                placeholder="Buscar por código, nombre, marca o OEM..."
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <button
              @click="fetchProducts"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>

        <!-- Products Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precios
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="isLoadingProducts">
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                  Cargando productos...
                </td>
              </tr>
              <tr v-else-if="products.length === 0">
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                  No hay productos para este proveedor
                </td>
              </tr>
              <tr v-else v-for="product in products" :key="product.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ product.supplierName }}</div>
                    <div class="text-sm text-gray-500">{{ product.supplierCode }}</div>
                    <div v-if="product.brand" class="text-xs text-gray-400">{{ product.brand }} {{ product.model }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm text-gray-900">Costo: ${{ product.costPrice }}</div>
                    <div v-if="product.listPrice" class="text-sm text-gray-500">Lista: ${{ product.listPrice }}</div>
                    <div class="text-xs text-gray-400">{{ product.currency }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div v-if="product.oem" class="text-sm text-gray-900">OEM: {{ product.oem }}</div>
                    <div v-if="product.year" class="text-sm text-gray-500">Año: {{ product.year }}</div>
                    <div v-if="product.minQuantity" class="text-xs text-gray-400">Min: {{ product.minQuantity }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-col gap-1">
                    <span :class="[
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    ]">
                      {{ product.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                    <span :class="[
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      product.isAvailable ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    ]">
                      {{ product.isAvailable ? 'Disponible' : 'No disponible' }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <button
                      @click="editProduct(product)"
                      class="text-blue-600 hover:text-blue-900"
                      title="Editar"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="deleteProduct(product)"
                      class="text-red-600 hover:text-red-900"
                      title="Eliminar"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="productPagination.total > 0" class="px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Mostrando {{ (productPagination.page - 1) * productPagination.limit + 1 }} a 
              {{ Math.min(productPagination.page * productPagination.limit, productPagination.total) }} 
              de {{ productPagination.total }} productos
            </div>
            <div class="flex gap-2">
              <button
                @click="previousPage"
                :disabled="productPagination.page <= 1"
                class="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                @click="nextPage"
                :disabled="productPagination.page >= productPagination.totalPages"
                class="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Import Modal -->
    <SupplierImportWizard
      v-if="showImportModal"
      v-model="showImportModal"
      :supplier-id="supplierId"
      :supplier-name="supplier?.name"
      @close="showImportModal = false"
      @success="handleImportSuccess"
    />

      <!-- New Product Modal -->
      <SupplierProductFormModal
        v-if="showNewProductModal"
        :supplier-id="supplierId"
        @close="showNewProductModal = false"
        @success="handleProductSuccess"
      />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { debounce } from 'lodash-es'
import DashboardLayout from '../components/organisms/DashboardLayout.vue'
import PageHeader from '../components/molecules/PageHeader.vue'
import StatsCard from '../components/atoms/StatsCard.vue'
import FilterBar from '../components/molecules/FilterBar.vue'
import DataTable from '../components/atoms/DataTable.vue'
import BaseButton from '../components/atoms/BaseButton.vue'
import SupplierImportWizard from '../components/suppliers/SupplierImportWizard.vue'
import SupplierProductFormModal from '../components/suppliers/SupplierProductFormModal.vue'
import { useSupplierDetail } from "../composables/useSupplierDetail";

const route = useRoute()
const supplierId = computed(() => route.params.id as string)

// Composables
const {
  supplier,
  products,
  isLoading,
  isLoadingProducts,
  productPagination,
  fetchSupplier,
  fetchProducts
} = useSupplierDetail(supplierId)

// State
const showImportModal = ref(false)
const showNewProductModal = ref(false)
const productFilters = ref({
  search: '',
  page: 1,
  limit: 20
})

// Methods
const debouncedProductSearch = debounce((event: Event) => {
  const target = event.target as HTMLInputElement
  productFilters.value.search = target.value
  productFilters.value.page = 1
  fetchProducts(productFilters.value)
}, 300)

const previousPage = () => {
  if (productFilters.value.page > 1) {
    productFilters.value.page--
    fetchProducts(productFilters.value)
  }
}

const nextPage = () => {
  if (productFilters.value.page < productPagination.value.totalPages) {
    productFilters.value.page++
    fetchProducts(productFilters.value)
  }
}

const editProduct = (product: any) => {
  // TODO: Implementar edición de producto
  console.log('Edit product:', product)
}

const deleteProduct = async (product: any) => {
  if (confirm(`¿Estás seguro de que quieres eliminar el producto "${product.supplierName}"?`)) {
    // TODO: Implementar eliminación de producto
    console.log('Delete product:', product)
  }
}

const handleImportSuccess = () => {
  showImportModal.value = false
  fetchProducts(productFilters.value)
  fetchSupplier()
}

const handleProductSuccess = () => {
  showNewProductModal.value = false
  fetchProducts(productFilters.value)
  fetchSupplier()
}

// Lifecycle
onMounted(() => {
  fetchSupplier()
  fetchProducts(productFilters.value)
})
</script>

<style scoped>
.supplier-detail-view {
  @apply space-y-6;
}
</style>

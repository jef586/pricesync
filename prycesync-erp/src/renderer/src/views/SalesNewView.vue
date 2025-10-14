<template>
  <DashboardLayout>
    <div class="h-full flex flex-col">
    <!-- Breadcrumb y acciones -->
    <div class="flex items-center justify-between mb-4">
      <nav class="text-sm text-slate-600 dark:text-slate-300" aria-label="Breadcrumb">
        <ol class="list-reset flex">
          <li><a href="#" class="hover:underline">Ventas</a></li>
          <li class="mx-2">/</li>
          <li class="font-semibold">Nueva venta</li>
        </ol>
      </nav>
      <div class="flex gap-2">
        <button class="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white" @click="openNewSaleTab" data-testid="new-sale-btn">Agregar nueva venta</button>
        <button class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white" @click="confirmAndCharge" data-testid="pay-btn">Confirmar y Cobrar (F2)</button>
        <button class="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100" @click="cancelSale">Cancelar (ESC)</button>
      </div>
    </div>

    <!-- Barra de pestañas internas: no abre nuevas ventanas, crea formularios locales -->
    <div class="mb-2 border-b border-slate-200 dark:border-slate-800">
      <ul class="flex items-center gap-1">
        <li v-for="tab in tabs" :key="tab.id" class="relative">
          <button
            class="px-3 py-1 text-sm rounded-t-md border border-b-0 transition-all duration-150"
            :class="tab.id === activeTabId
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-600 font-semibold shadow-sm ring-2 ring-emerald-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'"
            @click="activateTab(tab.id)"
            :aria-current="tab.id === activeTabId ? 'page' : undefined"
          >{{ tab.title }}</button>
          <!-- Indicador inferior eliminado para integrar visualmente la pestaña con el formulario -->
          <button
            class="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs flex items-center justify-center"
            title="Cerrar pestaña"
            @click="closeTab(tab.id)"
          >×</button>
        </li>
      </ul>
    </div>

    <!-- Formulario unificado: siempre se renderiza el mismo componente -->
    <div class="rounded-xl ring-2 ring-emerald-500 border border-emerald-500 p-3 flex-1 min-h-0">
      <keep-alive>
        <SalesForm :key="activeTabId" ref="activeFormRef" @sale-success="onSaleSuccess" />
      </keep-alive>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" class="fixed bottom-4 right-4 px-3 py-2 rounded-md bg-slate-900 text-white shadow-md">{{ toast.message }}</div>
      </div>
  </DashboardLayout>
  <!-- SplitPaymentsModal: manejo delegado al componente SalesForm -->
  <!-- Modal de éxito de venta -->
  <SaleSuccessModal :sale-id="successSaleId" :open="successModalOpen" :on-close="closeSuccessModal" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import SalesForm from '@/components/sales/SalesForm.vue'
import SaleSuccessModal from '@/components/pos/SaleSuccessModal.vue'
// SplitPaymentsModal se maneja dentro del formulario
import { useProducts } from '@/composables/useProducts'
import { useCustomers } from '@/composables/useCustomers'
import { useRouter } from 'vue-router'
import { apiClient } from '@/services/api'
// Pestañas locales
type Tab = { id: string; title: string }
const tabs = ref<Tab[]>([])
const activeTabId = ref<string>('')
const baseTabId = ref<string>('')
const activeFormRef = ref<any>(null)
// Modal de éxito tras cobrar venta
const successModalOpen = ref(false)
const successSaleId = ref<string>('')
const onSaleSuccess = (sid: string) => { successSaleId.value = sid; successModalOpen.value = true }
const closeSuccessModal = () => { successModalOpen.value = false }
let counter = 0
const activateTab = (id: string) => { activeTabId.value = id }
const closeTab = (id: string) => {
  const idx = tabs.value.findIndex(t => t.id === id)
  if (idx === -1) return
  const wasActive = tabs.value[idx].id === activeTabId.value
  tabs.value.splice(idx, 1)
  if (wasActive) {
    const next = tabs.value[idx] || tabs.value[idx - 1] || tabs.value[0]
    activeTabId.value = next?.id || ''
  }
}

type PriceList = { id: string; name: string; multiplier?: number; priceMap?: Record<string, number> }
type Row = { id: string; sku: string; desc: string; qty: number; price: number; manualLocked: boolean; disc: number }

// Fuente: aseguramos clase font-inter; el link se agrega en index.html

// Estado encabezado
const header = ref({
  date: new Date().toISOString().split('T')[0],
  type: 'Factura B',
  number: 'AUTO-0001',
  client: '',
  ivaCondition: '',
  saleCondition: 'Contado' as 'Contado' | 'Cuenta Corriente'
})

// Listas de precios (mock)
const priceLists = ref<PriceList[]>([
  { id: 'l1', name: 'Lista 1', multiplier: 1.0 },
  { id: 'l2', name: 'Lista 2', multiplier: 1.1 },
  { id: 'l3', name: 'Lista 3', multiplier: 1.2 },
  { id: 'l4', name: 'Lista 4', multiplier: 1.3, priceMap: { 'SKU-001': 1200, 'SKU-XYZ': 9900 } }
])
const selectedPriceListId = ref<string>('')
const selectedPriceList = computed(() => priceLists.value.find(p => p.id === selectedPriceListId.value))

// Productos y filas
const rows = ref<Row[]>([])
const searchQuery = ref('')
const productResults = ref<any[]>([])
let searchTimer: any = null
const barcode = ref('')
const newQty = ref(1)
// Imagen seleccionada para el visor
const selectedImageUrl = ref<string | null>(null)

// Productos API
const { searchProducts } = useProducts()
const { searchCustomers } = useCustomers()
const router = useRouter()
// Modal de selección de cliente
const showCustomerModal = ref(false)

// Búsqueda con debounce
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    if (!searchQuery.value || searchQuery.value.length < 2) {
      productResults.value = []
      return
    }
    productResults.value = await searchProducts(searchQuery.value, 10)
  }, 300)
}

// Al seleccionar, insertar fila en la tabla
const onProductSelected = (p: any) => {
  addRowFromProduct(p)
  productResults.value = []
  searchQuery.value = ''
  selectedImageUrl.value = p?.imageUrl || p?.image || p?.photo || null
}

// Cliente
const customerQuery = ref('')
const customerResults = ref<any[]>([])
let customerSearchTimer: any = null
const selectedCustomer = ref<any | null>(null)

const debouncedSearchCustomer = () => {
  if (customerSearchTimer) clearTimeout(customerSearchTimer)
  customerSearchTimer = setTimeout(async () => {
    if (!customerQuery.value || customerQuery.value.length < 2) {
      customerResults.value = []
      return
    }
    customerResults.value = await searchCustomers(customerQuery.value, 10)
  }, 300)
}

const onCustomerSelected = (cust: any) => {
  selectedCustomer.value = cust
  header.value.client = cust?.name || ''
  customerQuery.value = cust?.name || ''
  customerResults.value = []
}

// Selección de cliente desde el modal
const onCustomerSelectedFromModal = (cust: any) => {
  selectedCustomer.value = cust
  header.value.client = cust?.name || ''
  customerQuery.value = cust?.name || ''
  customerResults.value = []
  showCustomerModal.value = false
}

// Abrir nueva pestaña interna (formulario local)
const cryptoRandom = () => Math.random().toString(36).slice(2)
const openNewSaleTab = () => {
  counter += 1
  const id = cryptoRandom()
  const title = `Comprobante Nuevo ${counter}`
  tabs.value.push({ id, title })
  activeTabId.value = id
}

// Base price mock
const basePriceForSku = (sku: string): number => {
  const map: Record<string, number> = { 'SKU-001': 1000, 'SKU-XYZ': 9000 }
  return map[sku] ?? 1500
}

// Añadir producto seleccionado (mock)
const addSelectedProduct = () => {
  showToast('Seleccioná un producto de la lista y hacé clic en el resultado')
}

const addRowFromBarcode = () => {
  if (!barcode.value) return
  const sku = barcode.value
  const desc = 'Producto por código'
  const pl = selectedPriceList.value
  const price = computePriceForSku(sku, pl)
  rows.value.push({ id: cryptoRandom(), sku, desc, qty: newQty.value || 1, price, manualLocked: false, disc: 0 })
  barcode.value = ''
  syncTotals()
  selectedImageUrl.value = null
}

const addRowFromProduct = (product: any) => {
  const sku = product.sku || product.code || product.id
  const desc = product.name || 'Producto'
  const pl = selectedPriceList.value
  const price = computePriceForProduct(product, pl)
  rows.value.push({ id: cryptoRandom(), sku, desc, qty: newQty.value || 1, price, manualLocked: false, disc: 0 })
  newQty.value = 1
  syncTotals()
}

const computePriceForSku = (sku: string, pl?: PriceList): number => {
  if (!pl) return basePriceForSku(sku)
  if (pl.priceMap && pl.priceMap[sku] !== undefined) return pl.priceMap[sku]
  const base = basePriceForSku(sku)
  const mult = pl.multiplier ?? 1
  return Math.round(base * mult)
}

const computePriceForProduct = (p: any, pl?: PriceList): number => {
  if (!pl) return Math.round(p?.salePrice || 0)
  const sku = p?.sku || p?.code
  if (sku && pl.priceMap && pl.priceMap[sku] !== undefined) return pl.priceMap[sku]
  const base = Number(p?.salePrice || 0)
  const mult = pl.multiplier ?? 1
  return Math.round(base * mult)
}

// Totales
const lineTotal = (r: Row) => r.qty * r.price * (1 - (r.disc || 0) / 100)
const subtotal = computed(() => rows.value.reduce((sum, r) => sum + r.qty * r.price, 0))
const totalDiscount = computed(() => rows.value.reduce((sum, r) => sum + r.qty * r.price * ((r.disc || 0) / 100), 0))
const grandTotal = computed(() => rows.value.reduce((sum, r) => sum + lineTotal(r), 0))

const pay = ref({ type: 'Efectivo', received: 0 })
const changeDisplay = computed(() => {
  const change = (pay.value.received || 0) - grandTotal.value
  return (change > 0 ? '$' + change.toLocaleString('es-AR') : '$0')
})

// Bloqueo de precio al editar manualmente
const lockPrice = (r: Row) => { r.manualLocked = true; syncTotals() }
const priceOriginTitle = (r: Row) => r.manualLocked ? 'Origen: Manual' : `Origen: ${selectedPriceList.value?.name ?? '—'}`

// Recalcular al cambiar lista
const modal = ref({ show: false, nextId: '' as string })
const handlePriceListChange = () => {
  if (rows.value.length === 0) { applyNewPriceList(); return }
  modal.value = { show: true, nextId: selectedPriceListId.value }
}
const modalCancel = () => { modal.value.show = false }
const modalConfirm = () => { applyNewPriceList(); modal.value.show = false }
const applyNewPriceList = () => {
  const pl = priceLists.value.find(p => p.id === selectedPriceListId.value)
  let affected = 0
  rows.value = rows.value.map(r => {
    if (r.manualLocked) return r
    affected++
    return { ...r, price: computePriceForSku(r.sku, pl) }
  })
  showToast(`Precios actualizados por ${pl?.name ?? '—'} · ${affected} filas`)
}

// Toast simple
const toast = ref({ show: false, message: '' })
const showToast = (msg: string) => {
  toast.value = { show: true, message: msg }
  setTimeout(() => (toast.value.show = false), 2500)
}

// Sincronizar totales (placeholder por si luego hay side-effects)
const syncTotals = () => {/* no-op, computeds se actualizan solos */}

// Acciones
const removeRow = (idx: number) => { rows.value.splice(idx, 1) }
// Delegamos las acciones en el formulario activo para mantener una sola implementación
const cancelSale = () => { activeFormRef.value?.cancelSale?.() }
// Estado de venta persistida y pagos
const saleId = ref<string>('')
const saleStatus = ref<string>('open')
const paidTotal = ref<number>(0)
const paymentsModalOpen = ref(false)

const buildSalePayload = () => ({
  customerId: selectedCustomer.value?.id,
  items: rows.value.map(r => ({
    productId: null,
    description: r.desc,
    quantity: r.qty,
    unitPrice: r.price,
    discount: Math.round((r.disc || 0) * r.qty * r.price) // backend recalcula
  })),
  notes: 'Venta POS'
})

const saveSale = async () => { activeFormRef.value?.saveSale?.() }

const confirmAndCharge = async () => { activeFormRef.value?.confirmAndCharge?.() }

function onPaymentsConfirmed(payload: any) { /* manejado en SalesForm */ }

// Atajos de teclado
const handleKey = (e: KeyboardEvent) => {
  if (e.key === 'F2') { e.preventDefault(); confirmAndCharge() }
  if (e.key === 'Escape') { e.preventDefault(); cancelSale() }
}
onMounted(() => { window.addEventListener('keydown', handleKey) })
// Inicializar con una pestaña base que usa el formulario actual de la vista
onMounted(() => {
  counter = 1
  const id = cryptoRandom()
  baseTabId.value = id
  tabs.value.push({ id, title: `Comprobante Nuevo ${counter}` })
  activeTabId.value = id
})
watch(() => selectedPriceListId.value, () => { header.value; /* keep header sync if needed */ })

// Utils
</script>

<style scoped>
.font-inter { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'; }
</style>

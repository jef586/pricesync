<template>
  <!-- Layout principal: A/B/C del formulario de venta -->
  <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 font-inter">
    <!-- Card A: Encabezado / Cliente -->
    <section class="xl:col-span-3 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-4" aria-label="Encabezado del comprobante">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Encabezado</h2>
        <span class="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300">Lista de Precios: {{ selectedPriceList?.name || '—' }}</span>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-300">Fecha</label>
          <input type="date" v-model="header.date" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Fecha" tabindex="1" />
        </div>

        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-300">Tipo de comprobante</label>
          <select v-model="header.type" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Tipo de comprobante" tabindex="2">
            <option>Factura A</option>
            <option>Factura B</option>
            <option>Factura C</option>
            <option>Ticket</option>
            <option>Presupuesto</option>
          </select>
        </div>

        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-300">N° Comprobante</label>
          <input type="text" :value="header.number" readonly class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Número de comprobante" tabindex="-1" />
        </div>

        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-300">Cliente</label>
          <div class="relative mt-1">
            <input
              type="text"
              v-model="customerQuery"
              @input="debouncedSearchCustomer"
              placeholder="Buscar por nombre, CUIT o email..."
              class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              aria-label="Cliente"
              tabindex="3"
            />
            <!-- Resultados: overlay absoluto que no empuja los demás inputs -->
            <div
              v-if="customerResults.length > 0"
              class="absolute left-0 right-0 top-full mt-1 z-20 max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg"
            >
              <ul>
                <li
                  v-for="cust in customerResults"
                  :key="cust.id"
                  class="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                  @click="onCustomerSelected(cust)"
                >
                  <div class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ cust.name }}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-300">CUIT: {{ cust.taxId }}</div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-300">Condición de IVA</label>
          <input type="text" :value="header.ivaCondition || '—'" readonly class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Condición de IVA" tabindex="-1" />
        </div>

        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-300">Condición de venta</label>
          <select v-model="header.saleCondition" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Condición de venta" tabindex="5">
            <option>Contado</option>
            <option>Cuenta Corriente</option>
          </select>
        </div>

        <div>
          <label for="price-list-select" class="block text-xs text-slate-600 dark:text-slate-300">Lista de Precios</label>
          <select id="price-list-select" v-model="selectedPriceListId" @change="handlePriceListChange" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Lista de Precios" data-testid="price-list-select" tabindex="6">
            <option disabled value="">Seleccionar…</option>
            <option v-for="pl in priceLists" :key="pl.id" :value="pl.id">{{ pl.name }}</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Card B: Productos -->
    <section class="xl:col-span-6 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-4" aria-label="Productos">
      <div class="flex flex-wrap items-end gap-3 mb-4">
        <div class="flex-1 min-w-[220px] relative">
          <label class="block text-xs text-slate-600 dark:text-slate-300">Buscar producto</label>
          <input
            type="text"
            v-model="searchQuery"
            @input="debouncedSearch"
            placeholder="Buscar por nombre o SKU..."
            class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            aria-label="Buscar producto"
            tabindex="7"
          />
          <!-- Resultados: overlay absoluto que no empuja los demás inputs -->
          <div
            v-if="productResults.length > 0"
            class="absolute left-0 right-0 top-full mt-1 z-20 max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg"
          >
            <ul>
              <li
                v-for="prod in productResults"
                :key="prod.id"
                class="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                @click="onProductSelected(prod)"
              >
                <div>
                  <div class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ prod.name }}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-300">SKU: {{ prod.sku || prod.code }}</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="w-40">
          <label class="block text-xs text-slate-600 dark:text-slate-300">Código de barras</label>
          <input type="text" v-model="barcode" placeholder="Escanear / escribir" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Código de barras" tabindex="8" />
        </div>
        <div class="w-28">
          <label class="block text-xs text-slate-600 dark:text-slate-300">Cantidad</label>
          <input type="number" min="1" v-model.number="newQty" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Cantidad para agregar" tabindex="9" />
        </div>
        <div>
          <label class="block text-xs opacity-0">Agregar</label>
          <button class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white" @click="addRowFromBarcode">Agregar</button>
        </div>
      </div>

      <!-- Tabla -->
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="text-xs text-slate-500">
              <th class="text-left py-2 pr-4">Cant.</th>
              <th class="text-left py-2 pr-4">Artículo</th>
              <th class="text-left py-2 pr-4">Precio</th>
              <th class="text-left py-2 pr-4">Desc%</th>
              <th class="text-left py-2 pr-4">Total</th>
              <th class="text-left py-2 pr-4">#</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in rows" :key="r.id" class="border-t border-slate-200 dark:border-slate-700">
              <td class="py-2 pr-4">
                <input type="number" min="1" v-model.number="r.qty" @change="syncTotals" class="w-20 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" aria-label="Cantidad" />
              </td>
              <td class="py-2 pr-4">
                <input type="text" v-model="r.desc" class="w-64 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" aria-label="Artículo" />
                <div class="text-xs text-slate-500">SKU: {{ r.sku }}</div>
              </td>
              <td class="py-2 pr-4">
                <div class="flex items-center gap-2">
                  <input type="number" min="0" v-model.number="r.price" @change="lockPrice(r)" :title="priceOriginTitle(r)" data-testid="row-price-input" class="w-28 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" aria-label="Precio" />
                  <span v-if="r.manualLocked" class="inline-flex items-center px-2 py-1 text-xs rounded-md bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" title="🔒 Origen: Manual">🔒</span>
                </div>
              </td>
              <td class="py-2 pr-4">
                <input type="number" min="0" max="100" v-model.number="r.disc" @change="syncTotals" class="w-20 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" aria-label="Descuento" />
              </td>
              <td class="py-2 pr-4">
                <span class="inline-block min-w-[80px]">${{ (r.qty * r.price * (1 - (r.disc || 0)/100)).toLocaleString('es-AR') }}</span>
              </td>
              <td class="py-2 pr-4">
                <button class="px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" @click="removeRow(idx)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Card C: Resumen / Pago -->
    <section class="xl:col-span-3 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-4" aria-label="Resumen y pago">
      <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Resumen</h2>
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-600 dark:text-slate-300">Subtotal</span>
          <span class="text-xl font-semibold text-slate-900 dark:text-white">${{ subtotal.toLocaleString('es-AR') }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-600 dark:text-slate-300">Descuento total</span>
          <span class="text-xl font-semibold text-slate-900 dark:text-white">${{ totalDiscount.toLocaleString('es-AR') }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-600 dark:text-slate-300">Impuestos</span>
          <span class="text-xl font-semibold text-slate-900 dark:text-white">$0</span>
        </div>
        <div class="flex items-center justify-between text-sm mt-2">
          <span class="text-slate-900 dark:text-slate-100 font-semibold">TOTAL</span>
          <span class="text-5xl font-extrabold text-slate-900 dark:text-white" data-testid="grand-total">${{ grandTotal.toLocaleString('es-AR') }}</span>
        </div>
      </div>

      <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2">Tipo de pago</h2>
      <div>
        <select v-model="pay.type" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
          <option>Efectivo</option>
          <option>Tarjeta</option>
          <option>Transferencia</option>
          <option>Mixto</option>
        </select>
      </div>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-300">Monto recibido</label>
          <input type="number" min="0" v-model.number="pay.received" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-300">Vuelto</label>
          <input type="text" :value="changeDisplay" readonly class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
        </div>
      </div>

      <div v-if="header.saleCondition === 'Cuenta Corriente'" class="mt-3 text-sm text-amber-700 dark:text-amber-300">Adeuda ${{ grandTotal.toLocaleString('es-AR') }}</div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button class="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100" @click="cancelSale">Cancelar</button>
        <button class="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100" @click="saveSale">Guardar venta</button>
        <button class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white" @click="confirmAndCharge" data-testid="pay-btn">Confirmar y Cobrar</button>
      </div>
    </section>
  </div>

  <!-- Modal cambio lista -->
  <div v-if="modal.show" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 w-[90%] max-w-md">
      <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">Cambiar Lista de Precios</h3>
      <p class="text-sm text-slate-600 dark:text-slate-300">Cambiar la lista actualizará los precios no editados. ¿Continuar?</p>
      <div class="mt-4 flex justify-end gap-2">
        <button class="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100" @click="modalCancel">Cancelar</button>
        <button class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white" @click="modalConfirm">Continuar</button>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div v-if="toast.show" class="fixed bottom-4 right-4 px-3 py-2 rounded-md bg-slate-900 text-white shadow-md">{{ toast.message }}</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useProducts } from '@/composables/useProducts'
import { useCustomers } from '@/composables/useCustomers'

type PriceList = { id: string; name: string; multiplier?: number; priceMap?: Record<string, number> }
type Row = { id: string; sku: string; desc: string; qty: number; price: number; manualLocked: boolean; disc: number }

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

// Productos API
const { searchProducts } = useProducts()
const { searchCustomers } = useCustomers()

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

// Base price mock
const basePriceForSku = (sku: string): number => {
  const map: Record<string, number> = { 'SKU-001': 1000, 'SKU-XYZ': 9000 }
  return map[sku] ?? 1500
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
const cancelSale = () => { rows.value = []; pay.value = { type: 'Efectivo', received: 0 }; showToast('Venta cancelada') }
const saveSale = () => { /* POST /sales */ showToast('Venta guardada') }
const confirmAndCharge = () => { /* POST /sales */ showToast('Venta cobrada') }

// Atajos de teclado
const handleKey = (e: KeyboardEvent) => {
  if (e.key === 'F2') { e.preventDefault(); confirmAndCharge() }
  if (e.key === 'Escape') { e.preventDefault(); cancelSale() }
}
onMounted(() => { window.addEventListener('keydown', handleKey) })

// Utils
const cryptoRandom = () => Math.random().toString(36).slice(2)
</script>

<style scoped>
.font-inter { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'; }
</style>
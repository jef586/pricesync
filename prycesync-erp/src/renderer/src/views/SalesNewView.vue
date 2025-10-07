<template>
  <DashboardLayout>
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
        <button class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white" @click="confirmAndCharge" data-testid="pay-btn">Confirmar y Cobrar (F2)</button>
        <button class="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100" @click="cancelSale">Cancelar (ESC)</button>
      </div>
    </div>

    <!-- Layout principal: A/B/C -->
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
            <div class="flex gap-2 mt-1">
              <input type="text" v-model="header.client" class="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Cliente" tabindex="3" />
              <button class="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-white" @click="searchClient" aria-label="Buscar cliente" tabindex="4">Buscar</button>
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
          <div class="flex-1 min-w-[220px]">
            <label class="block text-xs text-slate-600 dark:text-slate-300">Buscar producto</label>
            <input type="text" v-model="searchQuery" @input="debouncedSearch" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Buscar producto" tabindex="7" />
          </div>
          <div class="w-40">
            <label class="block text-xs text-slate-600 dark:text-slate-300">Código de barras</label>
            <input type="text" v-model="barcode" @keydown.enter.prevent="addRowFromBarcode" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Código de barras" tabindex="8" />
          </div>
          <div class="w-32">
            <label class="block text-xs text-slate-600 dark:text-slate-300">Cantidad</label>
            <input type="number" min="1" v-model.number="newQty" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Cantidad" tabindex="9" />
          </div>
          <button class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white" @click="addSelectedProduct" data-testid="add-row-btn" tabindex="10">Agregar</button>
        </div>

        <div v-if="rows.length === 0" class="text-sm text-slate-600 dark:text-slate-300">Sin productos</div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-slate-600 dark:text-slate-300">
                <th class="py-2 pr-4">Cantidad</th>
                <th class="py-2 pr-4">Artículo</th>
                <th class="py-2 pr-4">Precio $</th>
                <th class="py-2 pr-4">Desc %</th>
                <th class="py-2 pr-4">Total $</th>
                <th class="py-2 pr-4">#</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
              <tr v-for="(r, idx) in rows" :key="r.id" class="text-slate-900 dark:text-slate-100">
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
                <td class="py-2 pr-4 font-mono">${{ lineTotal(r).toLocaleString('es-AR') }}</td>
                <td class="py-2 pr-4">
                  <button class="px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" @click="removeRow(idx)" aria-label="Eliminar fila">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Card C: Resumen y Pago -->
      <section class="xl:col-span-3 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-4" aria-label="Resumen y Pago">
        <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Resumen</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-slate-600 dark:text-slate-300">Subtotal</dt><dd class="font-mono">${{ subtotal.toLocaleString('es-AR') }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-600 dark:text-slate-300">Descuento total</dt><dd class="font-mono">${{ totalDiscount.toLocaleString('es-AR') }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-600 dark:text-slate-300">Impuestos</dt><dd class="font-mono">—</dd></div>
          <div class="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800"><dt class="text-slate-900 dark:text-slate-100 font-semibold">TOTAL</dt><dd class="text-3xl font-bold" data-testid="total-amount">${{ grandTotal.toLocaleString('es-AR') }}</dd></div>
        </dl>

        <div class="mt-4">
          <label class="block text-xs text-slate-600 dark:text-slate-300">Tipo de pago</label>
          <select v-model="pay.type" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
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
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'

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
const barcode = ref('')
const newQty = ref(1)

// Autosuggest mock
const debouncedSearch = () => {/* hook GET /products?query=abc */}

// Base price mock
const basePriceForSku = (sku: string): number => {
  const map: Record<string, number> = { 'SKU-001': 1000, 'SKU-XYZ': 9000 }
  return map[sku] ?? 1500
}

// Añadir producto seleccionado (mock)
const addSelectedProduct = () => {
  const sku = searchQuery.value.trim() || 'SKU-001'
  const desc = 'Producto ' + (searchQuery.value || 'Genérico')
  const pl = selectedPriceList.value
  const price = computePriceForSku(sku, pl)
  rows.value.push({ id: cryptoRandom(), sku, desc, qty: newQty.value || 1, price, manualLocked: false, disc: 0 })
  searchQuery.value = ''
  newQty.value = 1
  syncTotals()
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

const computePriceForSku = (sku: string, pl?: PriceList): number => {
  if (!pl) return basePriceForSku(sku)
  if (pl.priceMap && pl.priceMap[sku] !== undefined) return pl.priceMap[sku]
  const base = basePriceForSku(sku)
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
watch(() => selectedPriceListId.value, () => { header.value; /* keep header sync if needed */ })

// Utils
const cryptoRandom = () => Math.random().toString(36).slice(2)
</script>

<style scoped>
.font-inter { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'; }
</style>
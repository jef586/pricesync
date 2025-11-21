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
          <BaseButton class="ml-2" variant="warning" :disabled="!canPark" @click="confirmPark">Estacionar venta</BaseButton>
          <router-link to="/pos/parked" class="inline-block ml-2">
            <BaseButton variant="secondary">Ventas estacionadas</BaseButton>
          </router-link>
        </template>
      </PageHeader>

      <!-- SelecciÃƒÂ³n de cliente -->
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

      <!-- BÃƒÂºsqueda y agregado de productos -->
      <BaseCard class="mb-6">
        <template #header>
          <h3 class="text-lg font-medium text-gray-900">Productos</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2">
            <BaseInput id="pos-product-search" v-model="productQuery" placeholder="Buscar producto por cÃƒÂ³digo o nombre" @input="debouncedSearchProduct" />
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
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Desc. (%/$)</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Neto</th>
                <th class="px-6 py-3"></th>
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
                  <div v-if="item.bulkInfo?.applied" class="mt-1">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Precio x Mayor</span>
                  </div>
                  <div class="mt-1 flex gap-1 items-center">
                    <span v-if="rowAlerts[item.tempId]?.state === 'insufficient'" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Insuficiente</span>
                    <span v-else-if="rowAlerts[item.tempId]?.state === 'low'" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Stock mínimo</span>
                    <span v-else-if="rowAlerts[item.tempId]?.state === 'near'" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Cerca del mínimo</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <BaseInput type="number" min="1" step="1" v-model.number="item.quantity" @input="onQtyChanged(item)" />
                </td>
                <td class="px-6 py-4 text-right">
                  <BaseInput type="number" min="0" step="0.01" v-model.number="item.unitPrice" @input="onUnitPriceEdited(item)" />
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <select v-model="item.discountType" @change="updateItemTotals(item)" class="px-2 py-1 border rounded text-xs">
                      <option value="PERCENT">%</option>
                      <option value="ABS">$</option>
                    </select>
                    <BaseInput type="number" min="0" step="0.01" v-model.number="item.discountValue" @input="updateItemTotals(item)" />
                    <label class="inline-flex items-center text-xs text-gray-500 gap-1">
                      <input type="checkbox" v-model="item.isDiscountable" @change="updateItemTotals(item)" /> Desc.
                    </label>
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  {{ formatCurrency(lineNet(item)) }}
                </td>
                <td class="px-6 py-4 text-right">
                  <BaseButton variant="ghost" size="sm" @click="removeFromCart(idx)">Eliminar</BaseButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totales -->
        <div class="mt-4 p-4 bg-gray-50 rounded grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-600">Subtotal bruto</p>
            <p class="text-lg font-semibold text-gray-900">${{ formatCurrency(totals.subtotalGross) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Desc. por ítems</p>
            <p class="text-lg font-semibold text-red-600">${{ formatCurrency(totals.itemsDiscountTotal) }}</p>
          </div>
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center gap-2">
              <p class="text-sm text-gray-600">Descuento final</p>
              <select v-model="finalDiscount.type" class="px-2 py-1 border rounded text-xs">
                <option value="NONE">Sin Desc.</option>
                <option value="PERCENT">%</option>
                <option value="ABS">$</option>
              </select>
              <BaseInput type="number" min="0" step="0.01" v-model.number="finalDiscount.value" />
              <span class="ml-auto text-sm text-gray-600">Monto: </span>
              <span class="text-lg font-semibold text-red-600">${{ formatCurrency(totals.finalDiscountAmount) }}</span>
            </div>
          </div>
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center gap-2">
              <p class="text-sm text-gray-600">Recargo</p>
              <select v-model="surcharge.type" class="px-2 py-1 border rounded text-xs">
                <option value="NONE">Sin Recargo</option>
                <option value="PERCENT">%</option>
                <option value="ABS">$</option>
              </select>
              <BaseInput type="number" min="0" step="0.01" v-model.number="surcharge.value" />
              <span class="ml-auto text-sm text-gray-600">Monto: </span>
              <span class="text-lg font-semibold text-emerald-600">${{ formatCurrency(totals.surchargeAmount) }}</span>
            </div>
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
    <!-- Confirmar estacionamiento -->
    <ConfirmModal
      v-if="showConfirmPark"
      title="Estacionar venta"
      message="La venta quedará congelada hasta que la reanudes. ¿Confirmas?"
      @confirm="doPark"
      @cancel="showConfirmPark = false"
    />
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick, onActivated, onDeactivated } from 'vue'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import { useNotifications } from '@/composables/useNotifications'
import ConfirmModal from '@/components/atoms/ConfirmModal.vue'
import { useProducts } from '@/composables/useProducts'
import { useCustomers } from '@/composables/useCustomers'
import { useInvoices, type CreateInvoiceData } from '@/composables/useInvoices'
import { usePOS } from '@/composables/usePOS'
import { useBarcodeListener } from '@/composables/useBarcodeListener'
import { getPosBarcodeSettings } from '@/services/posBarcodeSettings'
import { useSalesStore } from '@/stores/modules/sales'
import { resolveBulk } from '@/services/bulkPricingService'
import { getArticle } from '@/services/articles'
import { apiClient } from '@/services/api'

// Composables
const { searchProducts, searchByBarcode } = useProducts()
const { searchCustomers } = useCustomers()
const { createInvoice, formatCurrency } = useInvoices()
const { computeTotals, computeInvoicePayload } = usePOS()
const notify = useNotifications()

// Estado local
const productQuery = ref('')
const productResults = ref<any[]>([])
const customerQuery = ref('')
const customerResults = ref<any[]>([])
const selectedCustomer = ref<any | null>(null)
const isSubmitting = ref(false)
const showConfirmPark = ref(false)

// Carrito (local view state, synced from sales store)
const cartItems = ref<Array<{
  tempId: string,
  productId: string,
  articleId?: string,
  name: string,
  code: string,
  quantity: number,
  unitPrice: number,
  basePrice?: number,
  uom?: 'UN' | 'BU' | 'KG' | 'LT',
  discountType?: 'PERCENT' | 'ABS',
  discountValue?: number,
  isDiscountable?: boolean,
  _unitPriceEdited?: boolean,
  bulkInfo?: { applied: boolean, rule?: any }
}>>([])
const rowAlerts = ref<Record<string, { state: 'ok' | 'near' | 'low' | 'insufficient', stock: number, min: number, available: number }>>({})
const sales = useSalesStore()
let barcodeCtrl: ReturnType<typeof useBarcodeListener> | null = null

onMounted(async () => {
  const raw = await getPosBarcodeSettings()
  const settings: any = {
    enabled: raw?.enabled ?? true,
    windowMsMin: raw?.windowMsMin ?? 50,
    interKeyTimeout: (raw as any)?.interKeyTimeout ?? raw?.windowMsMax ?? 200,
    minLength: raw?.minLength ?? 6,
    suffix: (raw as any)?.suffix ?? 'none',
    preventInInputs: raw?.preventInInputs ?? true,
    forceFocus: (raw as any)?.forceFocus ?? true,
    autoSelectSingle: (raw as any)?.autoSelectSingle ?? true,
  }
  barcodeCtrl = useBarcodeListener(settings)
  barcodeCtrl.onScan(async (code) => {
    productQuery.value = code
    if (settings.forceFocus) {
      const el = document.getElementById('pos-product-search') as HTMLInputElement | null
      el?.focus()
    }
    const results = await searchByBarcode(code)
    if (Array.isArray(results) && results.length > 0) {
      if (results.length === 1 && settings.autoSelectSingle) {
        await sales.addItemByBarcode(code)
        productResults.value = []
        productQuery.value = ''
      } else {
        productResults.value = results
      }
    } else {
      notify.error(`Producto no encontrado: ${code}`)
    }
  })
  barcodeCtrl.start()
})
onBeforeUnmount(() => {
  barcodeCtrl?.stop()
})

onDeactivated(() => {
  try { barcodeCtrl?.stop() } catch (_) {}
})

onActivated(() => {
  try { barcodeCtrl?.start() } catch (_) {}
})

// Totales (debe inicializarse antes del watcher con immediate:true)
const totals = ref({ subtotalGross: 0, itemsDiscountTotal: 0, netSubtotal: 0, finalDiscountAmount: 0, surchargeAmount: 0, tax: 0, total: 0 })
const finalDiscount = ref<{ type: 'NONE' | 'PERCENT' | 'ABS', value: number }>({ type: 'NONE', value: 0 })
const surcharge = ref<{ type: 'NONE' | 'PERCENT' | 'ABS', value: number }>({ type: 'NONE', value: 0 })

// Sync store items to local cartItems for display and totals
watch(
  () => sales.currentSale?.items,
  (items) => {
    cartItems.value = (items || []).map((it) => ({
      tempId: it.tempId,
      productId: it.productId,
      name: it.name,
      code: it.code,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      basePrice: it.unitPrice, // usar precio de lista como base
      uom: 'UN',
      discountType: it.discountType ?? (it.discount != null ? 'PERCENT' : undefined),
      discountValue: it.discountValue ?? (it.discount || 0),
      isDiscountable: it.isDiscountable !== false,
      _unitPriceEdited: false
    }))
    // Intentar resolver mayorista para nuevos/actualizados (evita pisar precio manual)
    nextTick(async () => {
      for (const it of cartItems.value) {
        if (!it._unitPriceEdited && Number(it.quantity) > 0) {
          await maybeResolveBulk(it)
        }
        await refreshStockAlerts(it)
      }
      recalcTotals()
    })
  },
  { deep: true, immediate: true }
)

// Sync global adjustments to store
watch(finalDiscount, (fd) => {
  sales.setFinalDiscount(fd.type, fd.value || 0)
}, { deep: true })
watch(surcharge, (sc) => {
  sales.setSurcharge(sc.type, sc.value || 0)
}, { deep: true })

// Park button availability
const canPark = computed(() => {
  const status = (sales.currentSale?.status || '').toLowerCase()
  const blocked = status === 'paid' || status === 'cancelled' || status === 'void'
  return !!sales.activeSaleId && !blocked
})

const confirmPark = () => { showConfirmPark.value = true }
const doPark = async () => {
  const id = sales.activeSaleId
  if (!id) { showConfirmPark.value = false; return }
  await sales.parkSale(id)
  showConfirmPark.value = false
}

// MÃƒÂ©todos
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

const addProductToCart = async (prod: any) => {
  // Keep local behavior for manual add, but also sync store for consistency
  const item: any = {
    tempId: Math.random().toString(36).slice(2),
    productId: prod.id,
    articleId: prod.id, // asegurar payload con articleId
    name: prod.name,
    code: prod.code,
    quantity: 1,
    unitPrice: prod.salePrice || 0,
    basePrice: prod.salePrice || 0,
    uom: 'UN',
    discount: 0,
    _unitPriceEdited: false
  }
  cartItems.value.push(item)
  productResults.value = []
  productQuery.value = ''
  await maybeResolveBulk(item)
  await refreshStockAlerts(item)
  recalcTotals()
}

const removeFromCart = (index: number) => {
  cartItems.value.splice(index, 1)
  recalcTotals()
}

const updateItemTotals = (_item: any) => {
  recalcTotals()
}

function lineNet(it: any) {
  const qty = Number(it?.quantity || 0)
  const unit = Number(it?.unitPrice || 0)
  const gross = qty * unit
  const isDisc = it?.isDiscountable !== false
  if (!isDisc) return gross
  if (it?.discountType === 'ABS') {
    const abs = Math.min(Math.max(Number(it?.discountValue || 0), 0), gross)
    return gross - abs
  }
  const pct = Math.min(Math.max(Number(it?.discountValue || 0), 0), 100)
  return gross - gross * (pct / 100)
}

async function maybeResolveBulk(item: any) {
  try {
    const articleId = String(item.articleId || item.productId || '')
    if (!articleId) return
    if (item._unitPriceEdited) return // respetar precio manual
    const uom = item.uom || 'UN'
    const qty = Number(item.quantity || 0)
    const basePrice = typeof item.basePrice === 'number' ? item.basePrice : Number(item.unitPrice || 0)
    if (!qty || !isFinite(basePrice)) return
    const res = await resolveBulk({ articleId, uom, qty, basePrice })
    if (res && typeof res.finalUnitPrice === 'number' && isFinite(res.finalUnitPrice) && res.finalUnitPrice > 0) {
      // solo actualizar si cambia para evitar parpadeos
      if (Math.abs(Number(item.unitPrice) - Number(res.finalUnitPrice)) > 0.0001) {
        item.unitPrice = Number(res.finalUnitPrice)
      }
    }
    if (res?.appliedRule) {
      item.bulkInfo = { applied: true, rule: res.appliedRule }
    } else {
      item.bulkInfo = undefined
    }
  } catch (err) {
    console.error('Error resolviendo precio mayorista', err)
    item.bulkInfo = undefined
  }
}

function onQtyChanged(item: any) {
  // Recalcular totales y aplicar mayorista segÃºn cantidad
  maybeResolveBulk(item).finally(async () => {
    await refreshStockAlerts(item)
    updateItemTotals(item)
  })
}

function onUnitPriceEdited(item: any) {
  // Si el usuario toca el precio, no pisar con mayorista
  item._unitPriceEdited = true
  item.bulkInfo = undefined
  updateItemTotals(item)
}

function recalcTotals() {
  const gross = cartItems.value.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0)
  const itemDisc = cartItems.value.reduce((acc, it) => {
    const isDisc = it.isDiscountable !== false
    if (!isDisc) return acc
    const lineGross = it.quantity * it.unitPrice
    if (it.discountType === 'ABS') return acc + Math.min(Math.max(it.discountValue || 0, 0), lineGross)
    const pct = Math.min(Math.max(it.discountValue || 0, 0), 100)
    return acc + lineGross * (pct / 100)
  }, 0)
  const net = gross - itemDisc
  let finalDisc = 0
  if (finalDiscount.value.type === 'ABS') finalDisc = Math.min(Math.max(finalDiscount.value.value || 0, 0), net)
  else if (finalDiscount.value.type === 'PERCENT') finalDisc = net * Math.min(Math.max(finalDiscount.value.value || 0, 0), 100) / 100
  const taxBase = net - finalDisc
  let surchargeAmount = 0
  if (surcharge.value.type === 'ABS') surchargeAmount = Math.min(Math.max(surcharge.value.value || 0, 0), taxBase)
  else if (surcharge.value.type === 'PERCENT') surchargeAmount = taxBase * Math.min(Math.max(surcharge.value.value || 0, 0), 100) / 100
  const tax = (taxBase + surchargeAmount) * 0.21
  const total = taxBase + surchargeAmount + tax
  totals.value = { subtotalGross: gross, itemsDiscountTotal: itemDisc, netSubtotal: net, finalDiscountAmount: finalDisc, surchargeAmount, tax, total }
}

async function refreshStockAlerts(item: any) {
  try {
    const id = String(item.articleId || item.productId || '')
    if (!id) return
    let stock = 0
    let min = 0
    try {
      const art = await getArticle(id)
      stock = Number(art?.stock || 0)
      min = Number(art?.stockMin || 0)
    } catch (_) {}
    let available = stock
    let insufficient = false
    try {
      const payload = { items: [{ articleId: id, qty: Number(item.quantity || 0), uom: item.uom || 'UN' }] }
      const res = await apiClient.post('/stock/can-fulfill', payload)
      const r = (res.data?.data?.results || [])[0]
      if (r) {
        available = Number(r.availableUn || available)
        insufficient = !r.canFulfill
      }
    } catch (_) {}
    const nearFactor = 1.2
    let state: 'ok' | 'near' | 'low' | 'insufficient' = 'ok'
    if (insufficient) state = 'insufficient'
    else if (typeof min === 'number' && min > 0) {
      if (available <= min) state = 'low'
      else if (available <= min * nearFactor) state = 'near'
    }
    rowAlerts.value[item.tempId] = { state, stock, min, available }
  } catch (_) {}
}

const submitSale = async () => {
  if (!selectedCustomer.value || cartItems.value.length === 0) return
  isSubmitting.value = true
  try {
    // Construir payload compatible con backend /sales
    const items = cartItems.value.map(it => ({
      productId: it.productId,
      articleId: it.articleId || it.productId,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discountType: it.isDiscountable !== false ? it.discountType : undefined,
      discountValue: it.isDiscountable !== false ? (it.discountValue || 0) : 0,
      is_discountable: it.isDiscountable !== false,
      taxRate: 21
    }))
    const fd = finalDiscount.value.type === 'NONE' ? undefined : { type: finalDiscount.value.type, value: finalDiscount.value.value || 0 }
    const scType = surcharge.value.type === 'NONE' ? undefined : surcharge.value.type
    const scValue = surcharge.value.type === 'NONE' ? undefined : (surcharge.value.value || 0)
    const payload = { customerId: selectedCustomer.value.id, items, finalDiscount: fd, surcharge_type: scType, surcharge_value: scValue }
    const res = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error('Error registrando venta')
    const data = await res.json()
    window.location.href = `/sales/${data?.data?.id || ''}`
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








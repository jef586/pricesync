<template>
  <div class="rounded-lg border p-4 space-y-4" aria-label="Precios & Listas (4)">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-md font-semibold">Precios & Listas (4)</h3>
        <p class="text-sm text-slate-600">Modo directo ↔ inverso por lista; L4 desde promoción por cantidad</p>
      </div>
      <div class="flex items-center gap-2">
        <label class="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="showGross" />
          <span>Mostrar con IVA</span>
        </label>
        <BaseButton variant="secondary" :disabled="status.loading || status.saving" @click="applyUnlocked">Aplicar a listas desbloqueadas</BaseButton>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-5 gap-2" role="group" aria-label="Parámetros base">
      <div>
        <label class="block text-xs mb-1">Costo</label>
        <input v-model.number="base.cost" type="number" step="0.01" min="0" class="border rounded compact-input compact-input--sm" />
      </div>
      <div>
        <label class="block text-xs mb-1">Imp. Interno (monto)</label>
        <input v-model.number="base.internalTaxAmount" type="number" step="0.01" min="0" class="border rounded compact-input compact-input--sm" />
      </div>
      <div>
        <label class="block text-xs mb-1">Imp. Interno (%)</label>
        <input v-model.number="base.internalTaxPct" type="number" step="0.01" min="0" class="border rounded compact-input compact-input--sm" />
      </div>
      <div>
        <label class="block text-xs mb-1">IVA %</label>
        <input v-model.number="base.vatPct" type="number" step="0.01" min="0" class="border rounded compact-input compact-input--sm" />
      </div>
      <div>
        <label class="block text-xs mb-1">Redondeo</label>
        <BaseSelect v-model="base.rounding" :options="roundingOptions" />
      </div>
    </div>

    <div v-if="status.error" class="p-2 bg-red-50 text-red-700 text-sm" role="alert">{{ status.error }}</div>

    <div class="overflow-x-auto" aria-label="Tabla de listas">
      <table class="min-w-full text-sm">
        <thead>
          <tr>
            <th class="text-left py-2 px-2 text-xs">Lista</th>
            <th class="text-left py-2 px-2 text-xs">Modo</th>
            <th class="text-right py-2 px-2 text-xs">Margen %</th>
            <th class="text-right py-2 px-2 text-xs">Precio neto</th>
            <th class="text-right py-2 px-2 text-xs">Precio final</th>
            <th class="py-2 px-2 text-xs">🔒</th>
            <th class="py-2 px-2 text-xs">⟳</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rowsEditable" :key="row.key">
            <td class="py-2 px-2">{{ row.label }}</td>
            <td class="py-2 px-3">
              <BaseSelect v-model="row.mode" :options="modeOptions" @update:model-value="onModeChange(row)" />
            </td>
            <td class="py-2 px-2 text-right">
              <input v-model.number="row.marginPct" type="number" step="0.01" min="0" class="border rounded compact-input compact-input--sm text-right" :disabled="row.mode === 'inverse'" @input="onRowInput(row, 'marginPct')" />
            </td>
            <td class="py-2 px-2 text-right">
              <span>{{ formatCurrency(computeNet(row)) }}</span>
            </td>
            <td class="py-2 px-2 text-right">
              <input v-model.number="row.finalPrice" type="number" step="0.01" min="0" class="border rounded compact-input compact-input--price text-right" :disabled="row.mode === 'direct'" @input="onRowInput(row, 'finalPrice')" />
              <div class="text-xs text-slate-500 mt-1">{{ showGross ? 'c/IVA' : 'neto → c/IVA' }}</div>
            </td>
            <td class="py-2 px-2 text-center">
              <input type="checkbox" v-model="row.locked" @change="onLockToggle(row)" />
            </td>
            <td class="py-2 px-2 text-center">
              <BaseButton variant="ghost" @click="forceRecalc(row)">Recalc</BaseButton>
            </td>
          </tr>
          <tr>
            <td class="py-2 px-2">L4 Promo x Cant.</td>
            <td class="py-2 px-2">
              <span class="text-xs">read-only</span>
            </td>
            <td class="py-2 px-2 text-right">—</td>
            <td class="py-2 px-2 text-right">
              <span>{{ formatCurrency(l4NetPrice) }}</span>
            </td>
            <td class="py-2 px-2 text-right">
              <span>{{ formatCurrency(applyVat(l4NetPrice)) }}</span>
            </td>
            <td class="py-2 px-2 text-center">
              <span>{{ promoLoaded && promoTiers.length ? '✓' : '—' }}</span>
            </td>
            <td class="py-2 px-2 text-center">
              <BaseButton variant="secondary" @click="configureL4">Configurar</BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="rounded border p-3" aria-label="Simulador">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label class="block text-sm mb-1">Cantidad</label>
          <input v-model.number="sim.qty" type="number" step="1" min="1" class="border rounded compact-input compact-input--sm" />
        </div>
        <div>
          <label class="block text-sm mb-1">Lista aplicada</label>
          <input type="text" class="border rounded px-3 py-2 w-full" :value="sim.result.listLabel || '—'" disabled />
        </div>
        <div>
          <label class="block text-sm mb-1">Precio resultante</label>
          <input type="text" class="border rounded px-3 py-2 w-full" :value="formatCurrency(sim.result.price || 0)" disabled />
        </div>
        <div>
          <BaseButton variant="secondary" :loading="sim.loading" @click="runSimulation">Simular</BaseButton>
        </div>
      </div>
      <div v-if="sim.result.appliedPromo" class="text-xs text-slate-600 mt-2">Aplicó promo L4: desde {{ sim.result.appliedPromo.minQtyUn }} UN</div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import { getArticle } from '@/services/articles'
import { getPromotion, listTiers, type ArticleQuantityPromoTierDto } from '@/services/quantityPromotionService'
import { apiClient } from '@/services/api'

type Mode = 'direct' | 'inverse'

const props = defineProps<{ articleId?: string; vatPct?: number; cost?: number; internalTaxType?: 'NONE'|'FIXED'|'PERCENT'; internalTaxValue?: number }>()
const emits = defineEmits(['configure-l4'])

const roundingOptions = [
  { label: '2 dec. HALF_UP', value: 'HALF_UP' },
  { label: '2 dec. UP', value: 'UP' },
  { label: '2 dec. DOWN', value: 'DOWN' }
]
const modeOptions = [
  { label: 'Directo', value: 'direct' },
  { label: 'Inverso', value: 'inverse' }
]

const status = reactive({ loading: false, saving: false, error: '' })
const showGross = ref(true)

const base = reactive<{ cost: number; internalTaxAmount: number; internalTaxPct: number; vatPct: number; rounding: 'HALF_UP'|'UP'|'DOWN' }>({
  cost: Number(props.cost ?? 0),
  internalTaxAmount: 0,
  internalTaxPct: 0,
  vatPct: Number(props.vatPct ?? 21),
  rounding: 'HALF_UP'
})

type Row = { key: 'L1'|'L2'|'L3'; label: string; mode: Mode; marginPct: number | null; finalPrice: number | null; locked: boolean }
const rowsEditable = reactive<Row[]>([
  { key: 'L1', label: 'L1 Minorista', mode: 'direct', marginPct: 0, finalPrice: null, locked: false },
  { key: 'L2', label: 'L2 Mayorista 1', mode: 'direct', marginPct: 0, finalPrice: null, locked: false },
  { key: 'L3', label: 'L3 Mayorista 2', mode: 'direct', marginPct: 0, finalPrice: null, locked: false }
])

const promoLoaded = ref(false)
const promoTiers = reactive<ArticleQuantityPromoTierDto[]>([])

function roundHalfUp(n: number): number { return Math.round(n * 100) / 100 }
function roundUp(n: number): number { const f = 100; return Math.ceil(n * f) / f }
function roundDown(n: number): number { const f = 100; return Math.floor(n * f) / f }
function applyRounding(n: number): number {
  if (base.rounding === 'UP') return roundUp(n)
  if (base.rounding === 'DOWN') return roundDown(n)
  return roundHalfUp(n)
}

function internalTaxAmount(): number {
  const amt = Number(base.internalTaxAmount || 0)
  const pct = Number(base.internalTaxPct || 0)
  const addPct = pct > 0 ? Number(base.cost || 0) * (pct / 100) : 0
  return Number(base.cost || 0) >= 0 ? amt + addPct : amt
}

function netBase(): number { return Number(base.cost || 0) + internalTaxAmount() }
function applyVat(neto: number): number { return applyRounding(neto * (1 + Number(base.vatPct || 0) / 100)) }

function computeNet(row: Row): number {
  const neto = netBase() * (1 + Number(row.marginPct || 0) / 100)
  return applyRounding(neto)
}

function recalcDirect(row: Row) {
  if (row.marginPct == null) return
  const neto = computeNet(row)
  const final = applyVat(neto)
  row.finalPrice = showGross.value ? final : neto
}

function recalcInverse(row: Row) {
  const final = Number(row.finalPrice || 0)
  const precioNeto = final / (1 + Number(base.vatPct || 0) / 100)
  const neto = netBase()
  const margen = (precioNeto / neto - 1) * 100
  row.marginPct = applyRounding(margen)
}

function onRowInput(row: Row, field: 'marginPct'|'finalPrice') {
  status.error = ''
  if (field === 'marginPct' && row.mode === 'direct') {
    recalcDirect(row)
    saveRow(row)
  } else if (field === 'finalPrice' && row.mode === 'inverse') {
    // Validación inverso: costo+imp > 0
    if (netBase() <= 0) { status.error = 'Para inverso: costo+impInterno debe ser > 0'; return }
    recalcInverse(row)
    saveRow(row)
  }
}

function onModeChange(row: Row) {
  if (row.mode === 'direct') {
    row.finalPrice = null
  } else {
    row.marginPct = null
  }
  saveRow(row)
}

function forceRecalc(row: Row) {
  if (row.mode === 'direct') recalcDirect(row)
  else recalcInverse(row)
}

function applyUnlocked() {
  rowsEditable.forEach((r) => { if (!r.locked) forceRecalc(r) })
  rowsEditable.forEach((r) => { if (!r.locked) saveRow(r) })
}

watch([
  () => base.cost,
  () => base.internalTaxAmount,
  () => base.internalTaxPct,
  () => base.vatPct,
  () => base.rounding
], () => {
  rowsEditable.forEach((r) => { if (!r.locked) forceRecalc(r) })
  rowsEditable.forEach((r) => { if (!r.locked) saveRow(r) })
})

const l4NetPrice = ref(0)
function computeL4NetFromTiers(): number {
  if (!promoTiers.length) return 0
  const prices = promoTiers
    .map((t) => (t.pricePerUnit != null && Number(t.pricePerUnit) > 0) ? Number(t.pricePerUnit) : null)
    .filter((x) => x != null) as number[]
  if (!prices.length) return 0
  const min = Math.min(...prices)
  return applyRounding(min / (1 + Number(base.vatPct || 0) / 100))
}

async function loadFixedPrices() {
  if (!props.articleId) return
  try {
    status.loading = true
    const { data } = await apiClient.get(`/articles/${props.articleId}/prices-fixed`)
    const payload = data?.data || data || null
    if (payload) {
      rowsEditable[0].marginPct = Number(payload.l1MarginPct ?? rowsEditable[0].marginPct)
      rowsEditable[0].finalPrice = Number(payload.l1FinalPrice ?? rowsEditable[0].finalPrice)
      rowsEditable[0].locked = !!payload.l1Locked
      rowsEditable[1].marginPct = Number(payload.l2MarginPct ?? rowsEditable[1].marginPct)
      rowsEditable[1].finalPrice = Number(payload.l2FinalPrice ?? rowsEditable[1].finalPrice)
      rowsEditable[1].locked = !!payload.l2Locked
      rowsEditable[2].marginPct = Number(payload.l3MarginPct ?? rowsEditable[2].marginPct)
      rowsEditable[2].finalPrice = Number(payload.l3FinalPrice ?? rowsEditable[2].finalPrice)
      rowsEditable[2].locked = !!payload.l3Locked
      rowsEditable.forEach((r) => forceRecalc(r))
    }
  } catch (err: any) {
    status.error = err?.response?.data?.message || 'Error al cargar precios fijos'
  } finally {
    status.loading = false
  }
}

function payloadForRow(row: Row): any {
  const key = row.key === 'L1' ? 'l1' : row.key === 'L2' ? 'l2' : 'l3'
  const payload: any = {}
  payload[`${key}Locked`] = !!row.locked
  if (row.mode === 'direct') {
    payload[`${key}MarginPct`] = row.marginPct != null ? Number(row.marginPct) : null
    payload[`${key}FinalPrice`] = null
  } else {
    payload[`${key}FinalPrice`] = row.finalPrice != null ? Number(row.finalPrice) : null
    payload[`${key}MarginPct`] = null
  }
  return payload
}

async function saveRow(row: Row) {
  if (!props.articleId) return
  try {
    status.saving = true
    const payload = payloadForRow(row)
    await apiClient.put(`/articles/${props.articleId}/prices-fixed`, payload)
  } catch (err: any) {
    status.error = err?.response?.data?.message || 'Error al guardar lista'
  } finally {
    status.saving = false
  }
}

function onLockToggle(row: Row) { saveRow(row) }

async function loadPromo() {
  if (!props.articleId) return
  try {
    const promo = await getPromotion(props.articleId)
    const tiers = await listTiers(props.articleId)
    promoLoaded.value = !!promo
    promoTiers.splice(0, promoTiers.length, ...tiers.sort((a,b) => Number(a.sort||0) - Number(b.sort||0)))
    l4NetPrice.value = computeL4NetFromTiers()
  } catch (_) {
    promoLoaded.value = false
    promoTiers.splice(0, promoTiers.length)
    l4NetPrice.value = 0
  }
}

async function runSimulation() {
  sim.loading = true
  sim.result = { listLabel: '', price: 0, appliedPromo: null }
  try {
    const qty = Number(sim.qty || 1)
    const results: Array<{ label: string; finalUnitPrice: number; appliedPromo: any | null }> = []
    for (const r of rowsEditable) {
      const listKey = r.key === 'L1' ? 'l1' : r.key === 'L2' ? 'l2' : 'l3'
      const url = `/pricing/preview?articleId=${encodeURIComponent(String(props.articleId||''))}&qty=${qty}&priceList=${listKey}`
      try {
        const { data } = await apiClient.get(url)
        const payload = data?.data || data
        results.push({ label: r.label, finalUnitPrice: Number(payload.finalUnitPrice || 0), appliedPromo: payload.appliedPromo || null })
      } catch (_) {
        const neto = r.mode === 'direct' ? computeNet(r) : (Number(r.finalPrice || 0) / (1 + Number(base.vatPct||0)/100))
        const final = applyVat(neto)
        results.push({ label: r.label, finalUnitPrice: final, appliedPromo: null })
      }
    }
    if (results.length) {
      results.sort((a, b) => a.finalUnitPrice - b.finalUnitPrice)
      const best = results[0]
      sim.result = { listLabel: best.label, price: best.finalUnitPrice, appliedPromo: best.appliedPromo }
    }
  } finally {
    sim.loading = false
  }
}

function configureL4() { emits('configure-l4') }

const sim = reactive<{ qty: number; loading: boolean; result: { listLabel: string; price: number; appliedPromo: any | null } }>({ qty: 1, loading: false, result: { listLabel: '', price: 0, appliedPromo: null } })

function formatCurrency(n: number): string { const x = Number(n || 0); return x.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

onMounted(async () => {
  if (props.articleId) {
    await Promise.all([loadFixedPrices(), loadPromo()])
  } else {
    rowsEditable.forEach((r) => forceRecalc(r))
  }
})
</script>

<style scoped>
.compact-input { width: 6rem; padding: 0.25rem 0.5rem; font-size: 0.875rem; }
.compact-input--sm { width: 4.75rem; }
.compact-input--price { width: 6.75rem; }
</style>

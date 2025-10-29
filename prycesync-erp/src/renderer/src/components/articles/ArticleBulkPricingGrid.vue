<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-md font-semibold">Reglas Mayorista</h3>
      <span class="text-xs text-slate-500">UoM, cantidad mínima y precio/desc.</span>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead>
          <tr class="text-left">
            <th class="px-3 py-2">UoM</th>
            <th class="px-3 py-2 text-right">Cant. mínima</th>
            <th class="px-3 py-2">Modo</th>
            <th class="px-3 py-2 text-right">Precio/%</th>
            <th class="px-3 py-2">Vigencia</th>
            <th class="px-3 py-2">Activa</th>
            <th class="px-3 py-2 text-right">Prioridad</th>
            <th class="px-3 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <!-- New row -->
          <tr>
            <td class="px-3 py-2">
              <select v-model="draft.uom" class="border rounded px-2 py-1">
                <option value="UN">UN</option>
                <option value="BU">BU</option>
                <option value="KG">KG</option>
                <option value="LT">LT</option>
              </select>
            </td>
            <td class="px-3 py-2 text-right">
              <input v-model.number="draft.minQty" type="number" step="0.001" min="0.001" class="border rounded px-2 py-1 w-28 text-right" />
              <div v-if="errors.minQty" class="text-xs text-red-600">{{ errors.minQty }}</div>
            </td>
            <td class="px-3 py-2">
              <select v-model="draft.mode" class="border rounded px-2 py-1">
                <option value="UNIT_PRICE">UNIT_PRICE</option>
                <option value="PERCENT_OFF">PERCENT_OFF</option>
              </select>
            </td>
            <td class="px-3 py-2 text-right">
              <input v-if="draft.mode==='UNIT_PRICE'" v-model.number="draft.unitPrice" type="number" step="0.01" min="0" class="border rounded px-2 py-1 w-28 text-right" />
              <input v-else v-model.number="draft.percentOff" type="number" step="0.01" min="0.01" max="100" class="border rounded px-2 py-1 w-28 text-right" />
              <div v-if="errors.value" class="text-xs text-red-600">{{ errors.value }}</div>
            </td>
            <td class="px-3 py-2">
              <div class="flex gap-1 items-center">
                <input v-model="draft.validFrom" type="date" class="border rounded px-2 py-1" />
                <span>-</span>
                <input v-model="draft.validTo" type="date" class="border rounded px-2 py-1" />
              </div>
              <div v-if="errors.valid" class="text-xs text-red-600">{{ errors.valid }}</div>
            </td>
            <td class="px-3 py-2">
              <input type="checkbox" v-model="draft.active" />
            </td>
            <td class="px-3 py-2 text-right">
              <input v-model.number="draft.priority" type="number" step="1" class="border rounded px-2 py-1 w-20 text-right" />
            </td>
            <td class="px-3 py-2">
              <button class="px-3 py-1 rounded bg-emerald-600 text-white" @click="createRule">Agregar</button>
            </td>
          </tr>

          <!-- Rows -->
          <tr v-for="r in rules" :key="r.id">
            <td class="px-3 py-2">
              <span class="px-2 py-1 rounded bg-slate-100">{{ r.uom }}</span>
            </td>
            <td class="px-3 py-2 text-right">
              <input v-model.number="r.minQty" type="number" step="0.001" min="0.001" class="border rounded px-2 py-1 w-28 text-right" />
            </td>
            <td class="px-3 py-2">
              <select v-model="r.mode" class="border rounded px-2 py-1">
                <option value="UNIT_PRICE">UNIT_PRICE</option>
                <option value="PERCENT_OFF">PERCENT_OFF</option>
              </select>
            </td>
            <td class="px-3 py-2 text-right">
              <input v-if="r.mode==='UNIT_PRICE'" v-model.number="r.unitPrice" type="number" step="0.01" min="0" class="border rounded px-2 py-1 w-28 text-right" />
              <input v-else v-model.number="r.percentOff" type="number" step="0.01" min="0.01" max="100" class="border rounded px-2 py-1 w-28 text-right" />
            </td>
            <td class="px-3 py-2">
              <div class="flex gap-1 items-center">
                <input v-model="(r as any).validFrom" type="date" class="border rounded px-2 py-1" />
                <span>-</span>
                <input v-model="(r as any).validTo" type="date" class="border rounded px-2 py-1" />
              </div>
            </td>
            <td class="px-3 py-2 text-center">
              <input type="checkbox" v-model="r.active" />
            </td>
            <td class="px-3 py-2 text-right">
              <input v-model.number="r.priority" type="number" step="1" class="border rounded px-2 py-1 w-20 text-right" />
            </td>
            <td class="px-3 py-2">
              <div class="flex gap-2">
                <button class="px-3 py-1 rounded bg-blue-600 text-white" @click="saveRule(r)">Guardar</button>
                <button class="px-3 py-1 rounded bg-red-600 text-white" @click="removeRule(r)">Eliminar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import type { BulkPricingRule } from '@/services/bulkPricingService'
import { listArticleRules, createArticleRule, updateArticleRule, deleteArticleRule } from '@/services/bulkPricingService'

const props = defineProps<{ articleId: string }>()

const rules = ref<BulkPricingRule[]>([])
const loading = ref(false)
const errors = reactive<{ minQty?: string, value?: string, valid?: string }>({})

const today = new Date().toISOString().slice(0,10)
const draft = reactive<BulkPricingRule>({
  uom: 'UN',
  minQty: 1,
  mode: 'UNIT_PRICE',
  unitPrice: 0,
  percentOff: null,
  active: true,
  priority: 0,
  validFrom: today,
  validTo: null
})

function resetDraft() {
  draft.uom = 'UN'
  draft.minQty = 1
  draft.mode = 'UNIT_PRICE'
  draft.unitPrice = 0
  draft.percentOff = null
  draft.active = true
  draft.priority = 0
  draft.validFrom = today
  draft.validTo = null
  errors.minQty = undefined
  errors.value = undefined
  errors.valid = undefined
}

function validateRow(row: BulkPricingRule): boolean {
  errors.minQty = undefined
  errors.value = undefined
  errors.valid = undefined
  if (!row.minQty || row.minQty <= 0) {
    errors.minQty = 'minQty debe ser > 0'
    return false
  }
  if (row.mode === 'UNIT_PRICE') {
    if (row.unitPrice == null || row.unitPrice < 0) {
      errors.value = 'unitPrice >= 0 requerido'
      return false
    }
    row.percentOff = null
  } else if (row.mode === 'PERCENT_OFF') {
    if (row.percentOff == null || row.percentOff <= 0 || row.percentOff > 100) {
      errors.value = 'percentOff: 0 < x <= 100'
      return false
    }
    row.unitPrice = null
  }
  if (row.validFrom && row.validTo) {
    if (new Date(row.validFrom) > new Date(row.validTo)) {
      errors.valid = 'validFrom debe ser <= validTo'
      return false
    }
  }
  return true
}

async function load() {
  loading.value = true
  try {
    rules.value = await listArticleRules(props.articleId)
  } finally {
    loading.value = false
  }
}

async function createRule() {
  const row: BulkPricingRule = {
    uom: draft.uom,
    minQty: draft.minQty,
    mode: draft.mode,
    unitPrice: draft.unitPrice ?? null,
    percentOff: draft.percentOff ?? null,
    active: draft.active,
    priority: draft.priority ?? 0,
    validFrom: draft.validFrom || null,
    validTo: draft.validTo || null,
  }
  if (!validateRow(row)) return
  await createArticleRule(props.articleId, row)
  await load()
  resetDraft()
}

async function saveRule(r: BulkPricingRule) {
  const patch: Partial<BulkPricingRule> = {
    uom: r.uom,
    minQty: r.minQty,
    mode: r.mode,
    unitPrice: r.mode === 'UNIT_PRICE' ? (r.unitPrice ?? 0) : null,
    percentOff: r.mode === 'PERCENT_OFF' ? (r.percentOff ?? 0) : null,
    active: r.active,
    priority: r.priority ?? 0,
    validFrom: (r as any).validFrom || null,
    validTo: (r as any).validTo || null,
  }
  if (!validateRow(patch as BulkPricingRule)) return
  await updateArticleRule(props.articleId, r.id!, patch)
  await load()
}

async function removeRule(r: BulkPricingRule) {
  if (!r.id) return
  await deleteArticleRule(props.articleId, r.id)
  await load()
}

onMounted(load)
</script>

<style scoped>
table th, table td { border-bottom: 1px solid rgba(0,0,0,0.06) }
</style>
<template>
  <BaseModal :open="open" @close="onClose">
    <template #title>Registrar Pagos</template>
    <div class="space-y-3">
      <div class="grid grid-cols-3 gap-3 p-2 bg-slate-50 rounded">
        <div>
          <div class="text-xs text-slate-600">Total</div>
          <div class="text-lg font-semibold">${{ format(total) }}</div>
        </div>
        <div>
          <div class="text-xs text-slate-600">Pagado</div>
          <div class="text-lg font-semibold">${{ format(alreadyPaid) }}</div>
        </div>
        <div>
          <div class="text-xs text-slate-600">Restante</div>
          <div class="text-lg font-semibold" :class="remainingClass">${{ format(remaining) }}</div>
        </div>
      </div>

      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-slate-600">
            <th class="py-2 pr-2">Método</th>
            <th class="py-2 pr-2">Monto</th>
            <th class="py-2 pr-2">Detalles</th>
            <th class="py-2 pr-2">#</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in rows" :key="row.id">
            <td class="py-2 pr-2">
              <select v-model="row.method" class="px-2 py-1 rounded-md border w-40">
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="MERCADO_PAGO">MercadoPago (Mock)</option>
              </select>
            </td>
            <td class="py-2 pr-2">
              <input type="number" min="0" step="0.01" v-model.number="row.amount" class="px-2 py-1 rounded-md border w-28" />
            </td>
            <td class="py-2 pr-2">
              <input type="text" v-model="row.detailsStr" placeholder="brand,last4,auth_code | bank_ref | payer_email" class="w-96 px-2 py-1 rounded-md border" />
            </td>
            <td class="py-2 pr-2">
              <button class="px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-200" @click="removeRow(idx)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="flex gap-2">
        <button class="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300" @click="addRow">Añadir método</button>
        <button class="px-3 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50" :disabled="!canConfirm" @click="confirm">Confirmar</button>
        <button class="px-3 py-2 rounded-md bg-slate-200" @click="onClose">Cancelar</button>
      </div>
    </div>
  </BaseModal>
  
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import BaseModal from '@/components/atoms/BaseModal.vue'
import { apiClient } from '@/services/api'

const props = defineProps<{ open: boolean, saleId: string, total: number, alreadyPaid: number }>()
const emit = defineEmits(['close', 'confirmed'])

const rows = ref<Array<{ id: string, method: string, amount: number, detailsStr: string }>>([])
const tolerance = 0.01

const remaining = computed(() => {
  const sum = rows.value.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  return Number((props.total - props.alreadyPaid - sum).toFixed(2))
})

const canConfirm = computed(() => Math.abs(remaining.value) <= tolerance && rows.value.length > 0 && rows.value.every(r => r.amount > 0))
const remainingClass = computed(() => Math.abs(remaining.value) <= tolerance ? 'text-emerald-700' : 'text-amber-700')

const format = (n: number) => (n || 0).toLocaleString('es-AR')

function parseDetails(row: { method: string, detailsStr: string }) {
  const map: Record<string, any> = {}
  const parts = (row.detailsStr || '').split(',').map(s => s.trim()).filter(Boolean)
  for (const p of parts) {
    const [k, v] = p.includes(':') ? p.split(':') : [p, true]
    map[k] = v
  }
  if (row.method === 'CARD') {
    // expected: brand,last4,auth_code
    if (map.brand) map.brand = String(map.brand)
    if (map.last4) map.last4 = String(map.last4)
    if (map.auth_code) map.auth_code = String(map.auth_code)
  }
  if (row.method === 'TRANSFER') {
    if (map.bank_ref) map.bank_ref = String(map.bank_ref)
  }
  if (row.method === 'MERCADO_PAGO') {
    if (map.payer_email) map.payer_email = String(map.payer_email)
  }
  return map
}

async function fetchSummary() {
  try {
    const res = await apiClient.get(`/sales/${props.saleId}/payments`)
    const data = res.data?.data
    if (data?.payments?.length) {
      // no auto load into rows; keep manual
    }
  } catch (e) {
    console.error('Error obteniendo pagos', e)
  }
}

function addRow() {
  rows.value.push({ id: Math.random().toString(36).slice(2), method: 'CASH', amount: 0, detailsStr: '' })
}
function removeRow(i: number) { rows.value.splice(i, 1) }

function resetRows() { rows.value = [{ id: Math.random().toString(36).slice(2), method: 'CASH', amount: 0, detailsStr: '' }] }

watch(() => props.open, (open) => { if (open) { resetRows(); fetchSummary() } })

function onClose() { emit('close') }

async function confirm() {
  try {
    const payload = {
      payments: rows.value.map(r => ({
        method: r.method,
        amount: r.amount,
        currency: 'ARS',
        method_details: parseDetails(r)
      }))
    }
    const res = await apiClient.post(`/sales/${props.saleId}/payments`, payload)
    const data = res.data?.data
    emit('confirmed', data)
    emit('close')
  } catch (e: any) {
    console.error('Error registrando pagos', e?.response?.data || e)
    alert(e?.response?.data?.message || 'Error registrando pagos')
  }
}

onMounted(() => { if (props.open) { fetchSummary() } })

</script>

<style scoped>
</style>
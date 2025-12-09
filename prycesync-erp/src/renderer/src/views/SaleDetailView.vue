<template>
  <DashboardLayout>
    <div class="sale-detail-view">
      <nav class="text-sm text-slate-600 dark:text-slate-300 mb-2" aria-label="Breadcrumb">
        <ol class="list-reset flex">
          <li><a href="#" class="hover:underline" @click.prevent="router.push('/sales')">Ventas</a></li>
          <li class="mx-2">/</li>
          <li>{{ createdYear }}</li>
          <li class="mx-2">/</li>
          <li>{{ createdMonth }}</li>
          <li class="mx-2">/</li>
          <li class="font-semibold">{{ sale?.displayCode || sale?.humanCode || sale?.number || '—' }}</li>
        </ol>
      </nav>

      <PageHeader
        :title="`Venta ${sale?.displayCode || sale?.humanCode || sale?.number || ''}`"
        :subtitle="subtitle"
        :badges="headerBadges"
      >
        <template #actions>
          <BaseButton variant="ghost" @click="copyCode" title="Copiar Nº">Copiar Nº</BaseButton>
          <BaseButton variant="outline" @click="duplicate" title="Duplicar">Duplicar</BaseButton>
          <BaseButton variant="secondary" @click="openPdf">PDF</BaseButton>
          <BaseButton variant="primary" @click="printTicket">Imprimir ticket</BaseButton>
          <BaseButton variant="ghost" @click="showTech=true" title="Ver detalles técnicos">⋯</BaseButton>
        </template>
      </PageHeader>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseCard class="md:col-span-2">
          <template #header>
            <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100">Ítems</h3>
          </template>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead class="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Descripción</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Cant.</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Precio</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Total</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200 dark:bg-slate-900 dark:divide-slate-700">
                <tr v-for="it in items" :key="it.id || it.tempId">
                  <td class="px-4 py-2 text-sm text-slate-900 dark:text-slate-100">{{ it.description || it.product?.name || '—' }}</td>
                  <td class="px-4 py-2 text-right text-sm text-slate-900 dark:text-slate-100">{{ it.quantity }}</td>
                  <td class="px-4 py-2 text-right text-sm text-slate-900 dark:text-slate-100">{{ fmt(it.unitPrice) }}</td>
                  <td class="px-4 py-2 text-right text-sm text-slate-900 dark:text-slate-100">{{ fmt((it.quantity || 0) * (it.unitPrice || 0)) }}</td>
                </tr>
                <tr v-if="items.length === 0">
                  <td colspan="4" class="px-4 py-2 text-center text-gray-500 dark:text-slate-400">Sin ítems</td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>
            <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100">Resumen</h3>
          </template>
          <div class="space-y-2 text-sm text-slate-900 dark:text-slate-100">
            <div class="flex justify-between"><span>Subtotal</span><span>{{ fmt(sale?.subtotal) }}</span></div>
            <div class="flex justify-between"><span>Impuestos</span><span>{{ fmt(sale?.taxAmount || sale?.tax) }}</span></div>
            <div class="flex justify-between font-semibold"><span>Total</span><span>{{ fmt(sale?.total) }}</span></div>
            <div class="flex justify-between"><span>Estado</span><span>{{ sale?.status }}</span></div>
            <div class="flex justify-between"><span>Cliente</span><span>{{ sale?.customer?.name || sale?.customerName || '—' }}</span></div>
            <div class="flex justify-between"><span>Fecha</span><span>{{ formatDate(sale?.createdAt) }}</span></div>
          </div>
          <div class="mt-3 flex gap-2"></div>
        </BaseCard>
      </div>
      <BaseModal v-model="showTech" title="Detalles técnicos" size="lg">
        <div class="space-y-3">
          <div class="text-sm">ID (UUID): <span class="font-mono">{{ sale?.id }}</span></div>
          <pre class="text-xs overflow-auto max-h-[50vh] p-2 rounded border" v-if="isDev">{{ JSON.stringify(sale, null, 2) }}</pre>
          <div v-else class="text-xs text-slate-500">No disponible fuera de entorno de desarrollo</div>
        </div>
      </BaseModal>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import { apiClient } from '@/services/api'
import { fetchSalePdf } from '@/services/salesService'
import BaseModal from '@/components/atoms/BaseModal.vue'

const route = useRoute()
const router = useRouter()
const sale = ref<any | null>(null)
const items = ref<any[]>([])
const showTech = ref(false)

function fmt(n: number) { return (Number(n || 0)).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) }
function formatDate(d: any) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleString('es-AR') }
function goBack() { router.back() }

async function load() {
  const id = String(route.params.id || '')
  if (!id) return
  const res = await apiClient.get(`/sales/${id}`)
  const data = res.data?.data || res.data
  sale.value = data
  items.value = Array.isArray(data?.items) ? data.items : []
}

async function openPdf() {
  const id = String(sale.value?.id || '')
  if (!id) return
  const blob = await fetchSalePdf(id)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

function copyCode() {
  const code = sale.value?.displayCode || sale.value?.humanCode
  if (!code) return
  try { navigator.clipboard.writeText(String(code)) } catch (_) {}
}

async function duplicate() {
  console.log('Duplicate sale', sale.value?.id)
}

const isDev = import.meta.env.DEV
const createdYear = computed(() => sale.value?.createdAt ? new Date(sale.value.createdAt).getFullYear() : '—')
const createdMonth = computed(() => {
  if (!sale.value?.createdAt) return '—'
  const m = new Date(sale.value.createdAt).toLocaleString('es-AR', { month: 'long' })
  return m.charAt(0).toUpperCase() + m.slice(1)
})
const subtitle = computed(() => {
  if (!sale.value) return 'Detalle de venta'
  const dt = sale.value.createdAt ? formatDate(sale.value.createdAt) : '—'
  const cust = sale.value.customer?.name || '—'
  const pay = Array.isArray(sale.value.payments) && sale.value.payments.length ? sale.value.payments[0]?.method || '—' : '—'
  const seller = sale.value.cashier || sale.value.user || '—'
  const list = sale.value.listName || '—'
  const branch = sale.value.branchName || '—'
  return `${dt} · ${cust} · ${pay} · ${seller} · ${list} · ${branch}`
})
const headerBadges = computed(() => {
  const s = (sale.value?.state || 'open')
  const stateLabel = s === 'paid' ? 'Pagada' : (s === 'cancelled' ? 'Anulada' : 'Open')
  const stateVar = s === 'paid' ? 'success' : (s === 'cancelled' ? 'danger' : 'neutral')
  const origin = (sale.value?.origin || 'POS')
  return [
    { label: stateLabel, variant: stateVar as any },
    { label: origin.toUpperCase(), variant: 'neutral' as any }
  ]
})

async function printTicket() {
  const id = String(sale.value?.id || '')
  if (!id) return
  try {
    const w: any = window as any
    if (w.pos && typeof w.pos.print === 'function') {
      await w.pos.print(id)
      return
    }
    await openPdf()
  } catch {}
}

onMounted(() => { load() })
</script>

<style scoped>
.sale-detail-view {}
</style>

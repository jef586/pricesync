<template>
  <DashboardLayout>
    <div class="sale-detail-view">
      <PageHeader :title="`Venta ${sale?.id || ''}`" subtitle="Detalle de venta">
        <template #actions>
          <BaseButton variant="secondary" @click="goBack">Volver</BaseButton>
        </template>
      </PageHeader>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseCard class="md:col-span-2">
          <template #header>
            <h3 class="text-lg font-medium">Ítems</h3>
          </template>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="it in items" :key="it.id || it.tempId">
                  <td class="px-4 py-2 text-sm">{{ it.description || it.product?.name || '—' }}</td>
                  <td class="px-4 py-2 text-right text-sm">{{ it.quantity }}</td>
                  <td class="px-4 py-2 text-right text-sm">{{ fmt(it.unitPrice) }}</td>
                  <td class="px-4 py-2 text-right text-sm">{{ fmt((it.quantity || 0) * (it.unitPrice || 0)) }}</td>
                </tr>
                <tr v-if="items.length === 0">
                  <td colspan="4" class="px-4 py-2 text-center text-gray-500">Sin ítems</td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>
            <h3 class="text-lg font-medium">Resumen</h3>
          </template>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span>Subtotal</span><span>{{ fmt(sale?.subtotal) }}</span></div>
            <div class="flex justify-between"><span>Impuestos</span><span>{{ fmt(sale?.taxAmount || sale?.tax) }}</span></div>
            <div class="flex justify-between font-semibold"><span>Total</span><span>{{ fmt(sale?.total) }}</span></div>
            <div class="flex justify-between"><span>Estado</span><span>{{ sale?.status }}</span></div>
            <div class="flex justify-between"><span>Cliente</span><span>{{ sale?.customer?.name || sale?.customerName || '—' }}</span></div>
            <div class="flex justify-between"><span>Fecha</span><span>{{ formatDate(sale?.createdAt) }}</span></div>
          </div>
          <div class="mt-3 flex gap-2">
            <BaseButton variant="primary" @click="printTicket">Imprimir Ticket</BaseButton>
            <BaseButton variant="secondary" @click="openPdf">PDF</BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import { apiClient } from '@/services/api'
import { fetchSalePdf } from '@/services/salesService'

const route = useRoute()
const router = useRouter()
const sale = ref<any | null>(null)
const items = ref<any[]>([])

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

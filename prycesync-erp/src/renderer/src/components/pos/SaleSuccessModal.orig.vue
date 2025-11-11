<template>
  <BaseModal
    v-model="isOpen"
    :title="'¡Venta registrada!'"
    size="md"
    :closable="!loadingAction"
    :close-on-overlay="true"
    @close="handleClose"
  >
    <div
      ref="dialogRef"
      class="space-y-4"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="descId"
    >
      <!-- Header status/icon -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 :id="titleId" class="text-lg font-semibold text-gray-900">¡Venta registrada!</h3>
          <p :id="descId" class="text-sm text-gray-600">ID de venta: <span class="font-mono text-gray-900">{{ saleId }}</span></p>
        </div>
      </div>

      <!-- Acciones -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <BaseButton
          ref="firstActionRef"
          :disabled="!!loadingAction"
          :loading="loadingAction === 'pdf'"
          loading-text="Generando PDF…"
          variant="primary"
          @click="exportPdf"
        >
          Exportar PDF
        </BaseButton>
        <BaseButton
          :disabled="!!loadingAction"
          :loading="loadingAction === 'email'"
          loading-text="Enviando…"
          variant="secondary"
          @click="toggleEmailForm"
        >
          Enviar email
        </BaseButton>
        <BaseButton
          :disabled="!!loadingAction"
          :loading="loadingAction === 'print'"
          loading-text="Imprimiendo…"
          variant="ghost"
          @click="printSale"
        >
          Imprimir
        </BaseButton>
      </div>

      <!-- Mini form email -->
      <div v-if="showEmailForm" class="mt-2 p-3 border rounded-md bg-gray-50">
        <label class="block text-xs text-gray-600 mb-1">Email destino (opcional)</label>
        <input
          type="email"
          v-model="emailTo"
          placeholder="cliente@correo.com"
          class="w-full px-3 py-2 rounded-md border border-gray-300"
        />
        <div class="mt-3 flex justify-end gap-2">
          <BaseButton variant="ghost" @click="toggleEmailForm">Cancelar</BaseButton>
          <BaseButton :disabled="!!loadingAction" :loading="loadingAction === 'email'" @click="sendEmail">Enviar</BaseButton>
        </div>
      </div>

      <!-- Toast simple -->
      <div v-if="toast.show" class="fixed bottom-4 right-4 px-3 py-2 rounded-md" :class="toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'">{{ toast.message }}</div>

    </div>
    <!-- Footer slot debe ser hijo directo de BaseModal -->
    <template #footer>
      <BaseButton variant="secondary" :disabled="!!loadingAction" @click="handleClose">Cerrar</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import BaseModal from '@/components/atoms/BaseModal.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import { fetchSalePdf, sendSaleEmail } from '@/services/salesService'
import { usePrintingStore } from '@/stores/printing'

interface Props {
  saleId: string
  open: boolean
  onClose?: () => void
}

const props = defineProps<Props>()

const isOpen = ref(!!props.open)
watch(() => props.open, (v) => { isOpen.value = !!v })

const loadingAction = ref<null | 'pdf' | 'email' | 'print'>(null)
const toast = ref<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' })
const showEmailForm = ref(false)
const emailTo = ref('')
const dialogRef = ref<HTMLElement | null>(null)
const firstActionRef = ref<HTMLElement | null>(null)
const titleId = computed(() => `sale-success-title-${props.saleId}`)
const descId = computed(() => `sale-success-desc-${props.saleId}`)

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { show: true, type, message }
  setTimeout(() => (toast.value.show = false), 2500)
}

const handleClose = () => {
  isOpen.value = false
  try { props.onClose && props.onClose() } catch (_) {}
}

const toggleEmailForm = () => { showEmailForm.value = !showEmailForm.value }

const exportPdf = async () => {
  if (!props.saleId) return
  loadingAction.value = 'pdf'
  try {
    const blob = await fetchSalePdf(props.saleId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `venta-${props.saleId}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('PDF generado')
  } catch (err: any) {
    console.error('Error generando PDF', err)
    showToast('Error generando PDF', 'error')
  } finally {
    loadingAction.value = null
  }
}

const sendEmail = async () => {
  if (!props.saleId) return
  loadingAction.value = 'email'
  try {
    await sendSaleEmail(props.saleId, emailTo.value || undefined)
    showToast('Email enviado')
    showEmailForm.value = false
  } catch (err: any) {
    console.error('Error enviando email', err)
    showToast('Error enviando email', 'error')
  } finally {
    loadingAction.value = null
  }
}

const printingStore = usePrintingStore()

const printSale = async () => {
  if (!props.saleId) return
  loadingAction.value = 'print'
  try {
    printingStore.loadFromLocalStorage()
    const res = await printingStore.printTicket(props.saleId)
    if (res.ok && res.queued) {
      showToast('Ticket en cola: se imprimirá al reconectar')
    } else if (res.ok) {
      showToast('Ticket de venta enviado a la impresora')
    } else {
      showToast('No se pudo imprimir el ticket', 'error')
    }
  } catch (err: any) {
    console.error('Error imprimiendo', err)
    showToast('Error de impresión', 'error')
  } finally {
    loadingAction.value = null
  }
}

// Focus trap y ESC
const handleKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    handleClose()
    return
  }
  if (e.key === 'Tab' && dialogRef.value) {
    const focusable = dialogRef.value.querySelectorAll<HTMLElement>(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const list = Array.from(focusable).filter(el => el.offsetParent !== null)
    if (list.length === 0) return
    const first = list[0]
    const last = list[list.length - 1]
    const isShift = e.shiftKey
    const active = document.activeElement as HTMLElement | null
    if (!isShift && active === last) { e.preventDefault(); first.focus() }
    else if (isShift && active === first) { e.preventDefault(); last.focus() }
  }
}

watch(isOpen, async (open) => {
  if (open) {
    await nextTick()
    try { firstActionRef.value?.focus() } catch (_) {}
  }
})

onMounted(() => { window.addEventListener('keydown', handleKeydown) })
onBeforeUnmount(() => { window.removeEventListener('keydown', handleKeydown) })
</script>

<style scoped>
/* No styles adicionales: usamos BaseModal + utilidades */
</style>
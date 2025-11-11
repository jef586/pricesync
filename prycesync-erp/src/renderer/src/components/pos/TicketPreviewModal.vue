<template>
  <BaseModal
    v-model="isOpen"
    :title="'Vista previa de ticket'"
    size="md"
    :closable="true"
    :close-on-overlay="true"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div class="rounded-md border border-slate-200 dark:border-slate-700 p-2 bg-white dark:bg-gray-900">
        <div
          class="mx-auto overflow-y-auto"
          :style="{ width: paperWidthMm + 'mm', maxHeight: '60vh' }"
        >
          <div v-if="isLoading" class="h-[50vh] flex items-center justify-center">
            <div class="w-8 h-8 border-4 border-slate-300 border-t-emerald-500 rounded-full animate-spin" aria-label="Cargando"></div>
          </div>
          <div v-else-if="error" class="h-[50vh] flex items-center justify-center">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>
          <div v-else class="ticket-preview" v-html="ticketHtml" />
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <BaseButton variant="primary" :disabled="isLoading" @click="reprint">
          Reimprimir ticket
        </BaseButton>
        <BaseButton variant="outline" @click="handleClose">Cerrar</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/atoms/BaseModal.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import { useTicketPreview } from '@/composables/useTicketPreview'
import { usePrintingStore } from '@/stores/printing'
import { useNotifications } from '@/composables/useNotifications'

interface Props {
  invoiceId: string
  open: boolean
  onClose?: () => void
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>()

const isOpen = ref(!!props.open)
watch(() => props.open, (v) => { isOpen.value = !!v })

const printingStore = usePrintingStore()
const { info, error: notifyError, success } = useNotifications()
const paperWidthMm = computed(() => printingStore.settings.paperWidth || 80)

const { ticketHtml, isLoading, error, loadPreview } = useTicketPreview(props.invoiceId)

watch(isOpen, (open) => { if (open) loadPreview() })

const handleClose = () => {
  isOpen.value = false
  emit('update:open', false)
  try { props.onClose && props.onClose() } catch (_) {}
}

const reprint = async () => {
  if (!props.invoiceId) return
  printingStore.loadFromLocalStorage()
  if (!printingStore.settings.defaultPrinter) {
    info('No hay impresora predeterminada')
  }
  try {
    const res = await printingStore.printTicket(props.invoiceId)
    if (res.ok && res.queued) {
      success('Ticket en cola: se imprimirá cuando haya conexión')
    } else if (res.ok) {
      success('Ticket de venta enviado a la impresora')
    } else {
      notifyError('No se pudo imprimir el ticket')
    }
  } catch (err: any) {
    console.error('Error reimprimiendo', err)
    notifyError('Error de impresión')
  }
}
</script>

<style scoped>
.ticket-preview :deep(html),
.ticket-preview :deep(body) {
  margin: 0;
  padding: 0;
  background: transparent;
}
.ticket-preview :deep(*) {
  max-width: 100%;
}
</style>
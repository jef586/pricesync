<template>
  <DashboardLayout>
    <div class="printing-settings-view">
      <PageHeader
        title="Configuración de Impresión de Tickets"
        subtitle="Define impresora, tamaño de papel, márgenes y comportamiento"
        :dense="true"
      >
        <template v-slot:actions>
          <BaseButton
            variant="primary"
            :disabled="isSaving || isLoading"
            @click="saveSettings"
          >
            Guardar Cambios
          </BaseButton>
        </template>
      </PageHeader>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <!-- Parámetros (izquierda) -->
        <div class="ps-surface rounded-lg shadow border-default p-3">
          <h3 class="text-lg font-medium text-primary mb-4">Parámetros de Impresión</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseSelect
              v-model="settings.defaultPrinter"
              label="Impresora por defecto"
              :options="printerOptions"
              dense
            />

            <BaseInput
              v-model.number="settings.paperWidth"
              label="Ancho de papel (mm)"
              type="number"
              min="30"
              max="120"
              dense
            />

            <BaseInput v-model.number="settings.marginTop" label="Margen superior (mm)" type="number" min="0" max="50" dense />
            <BaseInput v-model.number="settings.marginRight" label="Margen derecho (mm)" type="number" min="0" max="50" dense />
            <BaseInput v-model.number="settings.marginBottom" label="Margen inferior (mm)" type="number" min="0" max="50" dense />
            <BaseInput v-model.number="settings.marginLeft" label="Margen izquierdo (mm)" type="number" min="0" max="50" dense />

            <BaseInput v-model.number="settings.fontSize" label="Tamaño de fuente (pt)" type="number" min="8" max="24" dense />
          </div>

          <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseCheckbox v-model="settings.autoPrintAfterSale" label="Imprimir automáticamente después de la venta" />
          </div>

          <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput v-model="branchId" label="Sucursal (branchId opcional)" placeholder="Ej.: BR-001" dense />
          </div>
        </div>

        <!-- Columna derecha: Detectar Impresoras + Historial -->
        <div class="flex flex-col gap-4">
          <!-- Detectar Impresoras -->
          <div class="ps-surface rounded-lg shadow border-default p-3">
            <h3 class="text-lg font-medium text-primary mb-4">Detectar Impresoras</h3>
            <div class="space-y-3">
              <BaseButton variant="secondary" @click="refreshPrinters">Buscar impresoras</BaseButton>
              <p class="text-sm text-secondary">Detectadas: {{ printers.length }}</p>
              <ul class="text-sm text-primary list-disc ml-5">
                <li v-for="p in printers" :key="p.name">{{ p.name }} ({{ p.description || '—' }})</li>
              </ul>
              <div class="pt-4 border-t border-default">
                <BaseButton
                  variant="primary"
                  :disabled="isTesting || isLoading"
                  @click="printTest"
                >
                  Imprimir página de prueba
                </BaseButton>
                <p class="text-xs text-secondary mt-2">
                  Usa la impresora seleccionada como defecto.
                </p>
              </div>
            </div>
          </div>

          <!-- Historial de Impresión -->
          <div class="ps-surface rounded-lg shadow border-default p-3 flex flex-col h-full min-h-[520px]">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-primary">Historial de Impresión</h3>
            <div class="flex gap-2">
              <BaseButton variant="ghost" @click="resetFilters">Limpiar filtros</BaseButton>
              <BaseButton variant="secondary" @click="exportCsv">Exportar CSV</BaseButton>
            </div>
          </div>
          <!-- Filtros -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-2 filters-condensed">
            <BaseInput v-model="filters.invoiceNumber" label="N° Comprobante" placeholder="Ej.: A-0001-000123" dense />
            <BaseInput v-model="filters.printerName" label="Impresora" placeholder="Nombre de impresora" dense />
            <BaseSelect v-model="filters.status" label="Estado" :options="statusOptions" dense />
            <BaseInput v-model="filters.dateFrom" label="Desde" type="datetime-local" dense />
            <BaseInput v-model="filters.dateTo" label="Hasta" type="datetime-local" dense />
            <BaseInput v-model="filters.userId" label="Usuario (ID)" placeholder="cuid() del usuario" dense />
          </div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-secondary">{{ total }} registros</p>
            <div class="flex items-center gap-2">
              <label class="text-xs text-secondary">Orden</label>
              <BaseSelect v-model="sort" :options="sortOptions" dense />
              <label class="text-xs text-secondary">Por página</label>
              <BaseSelect v-model.number="pageSize" :options="pageSizeOptions" dense />
              <BaseButton variant="primary" @click="fetchLogs">Aplicar</BaseButton>
            </div>
          </div>

          <!-- Tabla / Estados -->
          <div class="overflow-x-auto flex-1">
            <!-- Estado: Cargando -->
            <div v-if="loadingLogs" class="px-3 py-6 text-center text-secondary">Cargando…</div>

            <!-- Estado: Vacío -->
            <div v-else-if="items.length === 0" class="px-3 py-6 text-center text-secondary">No hay registros</div>

            <!-- Tabla: Datos -->
            <table v-else class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-3 py-2 text-left text-sm font-medium text-secondary">Fecha</th>
                  <th class="px-3 py-2 text-left text-sm font-medium text-secondary">N° Comprobante</th>
                  <th class="px-3 py-2 text-left text-sm font-medium text-secondary">Impresora</th>
                  <th class="px-3 py-2 text-left text-sm font-medium text-secondary">Estado</th>
                  <th class="px-3 py-2 text-left text-sm font-medium text-secondary">Intentos</th>
                  <th class="px-3 py-2 text-left text-sm font-medium text-secondary">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in items" :key="log.id" class="hover:bg-gray-50">
                  <td class="px-3 py-2 text-sm">{{ formatDate(log.printed_at) }}</td>
                  <td class="px-3 py-2 text-sm">{{ log.invoice_full_number || '—' }}</td>
                  <td class="px-3 py-2 text-sm">{{ log.printer_name || '—' }}</td>
                  <td class="px-3 py-2 text-sm">
                    <span :class="badgeClass(log.status)">{{ statusLabel(log.status) }}</span>
                  </td>
                  <td class="px-3 py-2 text-sm">{{ log.attempts || 1 }}</td>
                  <td class="px-3 py-2 text-sm">
                    <div class="flex gap-2">
                      <BaseButton size="sm" variant="ghost" @click="onPreview(log)">Preview</BaseButton>
                      <BaseButton v-if="hasIPC" size="sm" variant="secondary" @click="onRetry(log)">Retry</BaseButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div class="mt-2">
            <Pagination
              :current-page="page"
              :total-pages="totalPages"
              :total-items="total"
              :items-per-page="pageSize"
              @pageChange="onPageChange"
            />
          </div>
        </div>
      </div>
      </div>

      <!-- Modal de Vista Previa -->
      <TicketPreviewModal
        v-model="previewVisible"
        :html="previewHtml"
        :loading="previewLoading"
        :error="previewError"
        @close="previewVisible = false"
      ></TicketPreviewModal>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseCheckbox from '@/components/atoms/BaseCheckbox.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import Pagination from '@/components/atoms/Pagination.vue'
import TicketPreviewModal from '@/components/printing/TicketPreviewModal.vue'
import { useNotifications } from '@/composables/useNotifications'
import { PrintingSettingsSchema, type PrintingSettings } from '@/services/settingsService'
import { usePrintingStore } from '@/stores/printing'
import { usePrintLogsStore } from '@/stores/printLogs'

const { success, error } = useNotifications()

const printingStore = usePrintingStore()
const isLoading = ref(false)
const isSaving = ref(false)
const isTesting = ref(false)
const branchId = ref<string | null>(null)
const settings = printingStore.settings

const printers = ref<Array<{ name: string; description?: string }>>([])
const printerOptions = ref<Array<{ value: string | null; label: string }>>([])

// Print Logs store
const logsStore = usePrintLogsStore()
const { items, total, page, pageSize, sort, filters, loading: loadingLogs } = logsStore
const { fetch: fetchLogs, exportCsv } = logsStore
const { previewHtml, previewLoading, previewVisible, previewError, selectedLog } = logsStore
const hasIPC = computed(() => typeof window !== 'undefined' && (window as any).system && typeof (window as any).system.printTicket === 'function')
const totalPages = computed(() => Math.max(1, Math.ceil((total as number) / (pageSize as number))))
const statusOptions = [
  { value: null, label: 'Todos' },
  { value: 'success', label: 'Exitoso' },
  { value: 'error', label: 'Error' },
  { value: 'pending', label: 'Pendiente' }
]
const sortOptions = [
  { value: 'printed_at:desc', label: 'Fecha desc' },
  { value: 'printed_at:asc', label: 'Fecha asc' }
]
const pageSizeOptions = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' }
]

async function refreshPrinters() {
  try {
    if (typeof window !== 'undefined' && (window as any).system && typeof (window as any).system.listPrinters === 'function') {
      const res = await (window as any).system.listPrinters()
      if (res?.ok) {
        printers.value = (res.printers || []).map((p: any) => ({ name: p.name, description: p.description }))
        printerOptions.value = [{ value: null, label: '— Seleccionar —' }, ...printers.value.map(p => ({ value: p.name, label: p.name }))]
      } else {
        error('No se pudieron listar las impresoras', res?.error || '')
      }
    } else {
      // Fallback en entorno sin Electron
      printers.value = []
      printerOptions.value = [{ value: null, label: '— Seleccionar —' }]
    }
  } catch (e: any) {
    error('Error listando impresoras', e?.message || '')
  }
}

async function loadSettings() {
  isLoading.value = true
  try {
    const data = await printingStore.load(branchId.value || undefined)
    branchId.value = data.branchId || null
  } catch (e) {
    console.error('Error loading printing settings', e)
    error('No se pudieron cargar los settings de impresión')
  } finally {
    isLoading.value = false
  }
}

async function saveSettings() {
  isSaving.value = true
  try {
    // Validar con Zod
    const current = (settings as any).value ?? settings
    const parsed = PrintingSettingsSchema.safeParse({ ...current, branchId: branchId.value })
    if (!parsed.success) {
      error('Por favor, corrija los errores en el formulario')
      return
    }
    const updated = await printingStore.save({ ...current, branchId: branchId.value || null })
    success('Configuración guardada correctamente')
  } catch (e) {
    console.error('Error saving printing settings', e)
    error('No se pudo guardar la configuración')
  } finally {
    isSaving.value = false
  }
}

async function printTest() {
  isTesting.value = true
  try {
    const current = (settings as any).value ?? settings
    const printerName = current.defaultPrinter || null
    const hasIPC = typeof window !== 'undefined' && (window as any).system && typeof (window as any).system.printTest === 'function'
    if (!hasIPC) {
      error('Función de impresión no disponible en este entorno')
      return
    }
    const res = await (window as any).system.printTest({
      printerName,
      text: 'Prueba de impresión: configuración de tickets PryceSync ERP'
    })
    if (res?.ok) {
      success('Página de prueba enviada a la impresora')
    } else {
      error('No se pudo imprimir la página de prueba', res?.error || '')
    }
  } catch (e: any) {
    console.error('Error en impresión de prueba', e)
    error('Error al intentar imprimir la página de prueba', e?.message || '')
  } finally {
    isTesting.value = false
  }
}

onMounted(() => {
  loadSettings()
  refreshPrinters()
  fetchLogs()
})

function resetFilters() {
  filters.invoiceNumber = ''
  filters.printerName = ''
  filters.status = null
  filters.dateFrom = null
  filters.dateTo = null
  filters.userId = null
  fetchLogs()
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth()+1).padStart(2,'0')
    const dd = String(d.getDate()).padStart(2,'0')
    const hh = String(d.getHours()).padStart(2,'0')
    const mi = String(d.getMinutes()).padStart(2,'0')
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
  } catch { return iso }
}

function badgeClass(status: 'success'|'error'|'pending') {
  switch (status) {
    case 'success': return 'inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700'
    case 'error': return 'inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-700'
    default: return 'inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700'
  }
}
function statusLabel(status: 'success'|'error'|'pending') {
  switch (status) {
    case 'success': return 'Exitoso'
    case 'error': return 'Error'
    default: return 'Pendiente'
  }
}

function onPreview(log: any) { logsStore.preview(log) }
function onRetry(log: any) { logsStore.retry(log) }
function onPageChange(p: number) { logsStore.setPage(p) }
</script>

<style scoped>
.printing-settings-view { max-width: 1200px; margin: 0 auto; }
/* Condensar altura y tipografías de los filtros para ganar espacio a la tabla */
.filters-condensed :deep(label) {
  font-size: 0.75rem; /* text-xs */
}
.filters-condensed :deep(input),
.filters-condensed :deep(select),
.filters-condensed :deep(textarea) {
  height: 2rem; /* ~32px -> 32px a 28-32 según estilo base */
  padding: 0.25rem 0.5rem; /* py-1 px-2 */
  font-size: 0.75rem; /* text-xs */
}
.filters-condensed :deep(.ps-input),
.filters-condensed :deep(.ps-select) {
  min-height: 2rem;
}
</style>
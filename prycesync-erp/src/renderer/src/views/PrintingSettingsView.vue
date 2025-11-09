<template>
  <DashboardLayout>
    <div class="printing-settings-view">
      <PageHeader
        title="Configuración de Impresión de Tickets"
        subtitle="Define impresora, tamaño de papel, márgenes y comportamiento"
      >
        <template #actions>
          <BaseButton
            variant="primary"
            :disabled="isSaving || isLoading"
            @click="saveSettings"
          >
            Guardar Cambios
          </BaseButton>
        </template>
      </PageHeader>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Formulario -->
        <div class="lg:col-span-2 ps-surface rounded-lg shadow border-default p-6">
          <h3 class="text-lg font-medium text-primary mb-4">Parámetros de Impresión</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseSelect
              v-model="settings.defaultPrinter"
              label="Impresora por defecto"
              :options="printerOptions"
            />

            <BaseInput
              v-model.number="settings.paperWidth"
              label="Ancho de papel (mm)"
              type="number"
              min="30"
              max="120"
            />

            <BaseInput v-model.number="settings.marginTop" label="Margen superior (mm)" type="number" min="0" max="50" />
            <BaseInput v-model.number="settings.marginRight" label="Margen derecho (mm)" type="number" min="0" max="50" />
            <BaseInput v-model.number="settings.marginBottom" label="Margen inferior (mm)" type="number" min="0" max="50" />
            <BaseInput v-model.number="settings.marginLeft" label="Margen izquierdo (mm)" type="number" min="0" max="50" />

            <BaseInput v-model.number="settings.fontSize" label="Tamaño de fuente (pt)" type="number" min="8" max="24" />
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseCheckbox v-model="settings.autoPrintAfterSale" label="Imprimir automáticamente después de la venta" />
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput v-model="branchId" label="Sucursal (branchId opcional)" placeholder="Ej.: BR-001" />
          </div>
        </div>

        <!-- Ayuda / Preview simple -->
        <div class="ps-surface rounded-lg shadow border-default p-6">
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
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseCheckbox from '@/components/atoms/BaseCheckbox.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import { useNotifications } from '@/composables/useNotifications'
import { PrintingSettingsSchema, type PrintingSettings } from '@/services/settingsService'
import { usePrintingStore } from '@/stores/printing'

const { success, error } = useNotifications()

const printingStore = usePrintingStore()
const isLoading = ref(false)
const isSaving = ref(false)
const isTesting = ref(false)
const branchId = ref<string | null>(null)
const settings = printingStore.settings

const printers = ref<Array<{ name: string; description?: string }>>([])
const printerOptions = ref<Array<{ value: string | null; label: string }>>([])

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
})
</script>

<style scoped>
.printing-settings-view { max-width: 1200px; margin: 0 auto; }
</style>
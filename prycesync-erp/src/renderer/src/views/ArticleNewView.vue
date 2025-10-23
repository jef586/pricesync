<template>
  <DashboardLayout>
    <div class="article-new-view">
      <PageHeader :title="t('inventory.article.new.title')" :subtitle="t('inventory.article.new.subtitle')">
        <template #actions>
          <div class="flex gap-2">
            <BaseButton variant="secondary" @click="goBack">{{ t('actions.close') }}</BaseButton>
            <BaseButton variant="primary" @click="onSave">{{ t('actions.save') }}</BaseButton>
          </div>
        </template>
      </PageHeader>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Izquierda: Div1 (básicos) + Div2 (precios) en el formulario -->
        <div class="ps-card p-4">
          <ArticleForm
            ref="formRef"
            mode="create"
            @saved="handleSaved"
            @cancel="goBack"
            @price-change="onPriceChange"
          />
        </div>

        <!-- Derecha: Div3 (opciones avanzadas - toggle) + Div4 (resumen precio) -->
        <div class="grid grid-rows-2 gap-4">
          <!-- Div3: Opciones avanzadas (control) -->
          <div class="ps-card p-4 flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold">Opciones avanzadas</h3>
              <BaseButton variant="ghost" @click="toggleAdvanced">
                {{ t('inventory.article.actions.toggleAdvanced') }}
              </BaseButton>
            </div>
            <p class="text-sm text-secondary">Ocultas por defecto, accesibles con el toggle.</p>
            <p class="text-xs text-secondary">Atajos: Ctrl+S (guardar), Esc (cerrar), Alt+N (nuevo proveedor).</p>
          </div>

          <!-- Div4: Resumen de precio, simulador y alertas -->
          <div class="ps-card p-4">
            <h3 class="text-base font-semibold mb-2">Resumen precio</h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>Neto: <strong>{{ currency(summary.neto) }}</strong></div>
              <div>IVA: <strong>{{ currency(summary.iva) }}</strong></div>
              <div>Base (costo + interno): <strong>{{ currency(summary.base) }}</strong></div>
              <div>Público: <strong>{{ currency(summary.publico) }}</strong></div>
            </div>

            <div class="mt-4">
              <h4 class="text-sm font-semibold mb-2">Simular precio</h4>
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                <div>
                  <label class="block text-xs mb-1">Cant</label>
                  <input v-model.number="simQty" type="number" min="1" step="1" class="w-full px-2 py-1 rounded border-default bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500" />
                </div>
                <div>
                  <label class="block text-xs mb-1">UoM</label>
                  <select v-model="simUom" class="w-full px-2 py-1 rounded border-default bg-white text-gray-900 dark:bg-slate-900 dark:text-slate-100">
                    <option v-for="opt in uomOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs mb-1">Factor</label>
                  <input v-model.number="simFactor" type="number" min="1" step="0.01" class="w-full px-2 py-1 rounded border-default bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500" />
                </div>
                <div>
                  <label class="block text-xs mb-1">Override precio</label>
                  <input v-model.number="simOverridePrice" type="number" min="0" step="0.01" class="w-full px-2 py-1 rounded border-default bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500" />
                </div>
              </div>
              <div class="mt-2 text-sm">Total simulado → <strong>{{ currency(simTotal) }}</strong></div>
            </div>

            <div class="mt-4">
              <h4 class="text-sm font-semibold mb-1">Alertas</h4>
              <ul class="list-disc ml-5 text-sm text-secondary">
                <li v-if="!summary.publico">Precio público sin calcular</li>
                <li>Se mostrarán alertas de stock y proveedor aquí.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import ArticleForm from '@/components/articles/ArticleForm.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Fallback de i18n mínimo local
function t(key: string) {
  const dict: Record<string, string> = {
    'inventory.article.new.title': 'Nuevo artículo',
    'inventory.article.new.subtitle': 'Completa los campos y guarda',
    'inventory.article.actions.toggleAdvanced': 'Mostrar/Ocultar',
    'actions.save': 'Guardar',
    'actions.close': 'Cerrar'
  }
  return dict[key] || key
}

// Form ref y API expuesta
const formRef = ref<InstanceType<typeof ArticleForm> | null>(null)

// Estado resumen de precio
const summary = ref({ neto: 0, iva: 0, publico: 0, base: 0 })

// Simulador sencillo (placeholder hasta integrar con UoM real)
const simQty = ref(1)
const simUom = ref('unit')
const simFactor = ref(1)
const simOverridePrice = ref<number | null>(null)
const uomOptions = [
  { value: 'unit', label: 'Unidad' },
  { value: 'box', label: 'Caja' },
  { value: 'pack', label: 'Pack' },
]
const simTotal = computed(() => {
  const base = simOverridePrice.value ?? summary.value.publico
  return Math.max(0, Number(base || 0) * Math.max(1, simQty.value) * Math.max(1, simFactor.value))
})

// Eventos del formulario
function onPriceChange(payload: any) {
  summary.value = payload || { neto: 0, iva: 0, publico: 0, base: 0 }
}

// Acciones del header
function goBack() { router.back() }
function onSave() { formRef.value?.submit?.() }
function toggleAdvanced() { formRef.value?.toggleAdvanced?.() }
function handleSaved() { router.push('/articles') }

// Formato moneda
function currency(v: number) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0) }
</script>
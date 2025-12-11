<template>
  <DashboardLayout>
    <div class="company-view">
      <PageHeader title="Configuración de Empresa">
        <template #actions>
          <RouterLink to="/company/pricing" class="btn-primary">Configurar Pricing</RouterLink>
          <RouterLink to="/company/settings/printing" class="btn-primary" style="margin-left: 0.5rem;">Impresión</RouterLink>
        </template>
      </PageHeader>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-1">
          <ChecklistSetupInicial />
        </div>

        <div class="md:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-6">
        <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="onSubmit">
          <FormField label="Nombre comercial" :error="errors.commercialName" required>
            <template #default="{ fieldId }">
              <BaseInput :id="fieldId" v-model="form.commercialName" placeholder="Ej: Empresa SA" :has-error="!!errors.commercialName" :error-message="errors.commercialName" :disabled="!isEditMode || saving" />
            </template>
          </FormField>

          <FormField label="Razón social" :error="errors.legalName" required>
            <template #default="{ fieldId }">
              <BaseInput :id="fieldId" v-model="form.legalName" placeholder="Ej: Empresa Sociedad Anónima" :has-error="!!errors.legalName" :error-message="errors.legalName" :disabled="!isEditMode || saving" />
            </template>
          </FormField>

          <FormField label="CUIT" :error="errors.taxId" required>
            <template #default="{ fieldId }">
              <BaseInput :id="fieldId" v-model="form.taxId" placeholder="20123456789" :has-error="!!errors.taxId" :error-message="errors.taxId" :disabled="!isEditMode || saving" />
            </template>
          </FormField>

          <FormField label="Inicio de actividades" :error="errors.startDate" required>
            <template #default="{ fieldId }">
              <input :id="fieldId" v-model="form.startDate" type="date" class="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" :disabled="!isEditMode || saving" />
            </template>
          </FormField>

          <FormField label="Dirección comercial" :error="errors.address" required>
            <template #default="{ fieldId }">
              <BaseInput :id="fieldId" v-model="form.address" placeholder="Calle 123, Ciudad" :has-error="!!errors.address" :error-message="errors.address" :disabled="!isEditMode || saving" />
            </template>
          </FormField>

          <FormField label="Teléfono" :error="errors.phone" required>
            <template #default="{ fieldId }">
              <BaseInput :id="fieldId" v-model="form.phone" type="tel" placeholder="1134567890" :has-error="!!errors.phone" :error-message="errors.phone" :disabled="!isEditMode || saving" />
            </template>
          </FormField>

          <FormField label="Email" :error="errors.email" required>
            <template #default="{ fieldId }">
              <BaseInput :id="fieldId" v-model="form.email" type="email" placeholder="facturacion@empresa.com" :has-error="!!errors.email" :error-message="errors.email" :disabled="!isEditMode || saving" />
            </template>
          </FormField>

          <FormField label="Tipo de contribuyente" :error="errors.contributorType" required>
            <template #default>
              <BaseSelect v-model="form.contributorType" :disabled="!isEditMode || saving">
                <option value="MONOTRIBUTO">Monotributo</option>
                <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
                <option value="EXENTO">Exento</option>
                <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
              </BaseSelect>
            </template>
          </FormField>

          <FormField label="Punto de venta AFIP" :error="errors.posAfip" required>
            <template #default="{ fieldId }">
              <BaseInput :id="fieldId" v-model.number="form.posAfip" type="number" placeholder="1" :min="1" :max="9999" step="1" :has-error="!!errors.posAfip" :error-message="errors.posAfip" :disabled="!isEditMode || saving" />
            </template>
          </FormField>

          <div class="md:col-span-2 flex justify-end gap-3 mt-4">
            <template v-if="isEditMode">
              <BaseButton variant="secondary" @click="cancelEdit" :disabled="saving">Cancelar</BaseButton>
              <BaseButton variant="primary" type="submit" :loading="saving" :disabled="saving">Guardar</BaseButton>
            </template>
            <template v-else>
              <BaseButton variant="primary" @click="startEdit">Editar</BaseButton>
            </template>
          </div>

          <div v-if="loading" class="mt-4 text-sm text-slate-600 dark:text-slate-300">Cargando datos...</div>
        </form>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import DashboardLayout from '../components/organisms/DashboardLayout.vue'
import PageHeader from '../components/molecules/PageHeader.vue'
import FormField from '@/components/atoms/FormField.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import ChecklistSetupInicial from '@/components/molecules/ChecklistSetupInicial.vue'
import { useCompanyStore } from '@/stores/company'
import { type CompanyInfo, CompanyInfoSchema } from '@/services/companyService'
import { useNotifications } from '@/composables/useNotifications'

const store = useCompanyStore()
const { success, error } = useNotifications()

const form = ref<CompanyInfo>({
  commercialName: '',
  legalName: '',
  taxId: '',
  startDate: new Date().toISOString().slice(0, 10),
  address: '',
  phone: '',
  email: '',
  contributorType: 'CONSUMIDOR_FINAL',
  posAfip: 1
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)
const saving = ref(false)
const isEditMode = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    await store.load()
    if (store.info) Object.assign(form.value, store.info)
  } catch {}
  loading.value = false
  isEditMode.value = !store.info
})

watch(form, () => {
  errors.value = {}
}, { deep: true })

function resetForm() {
  if (store.info) Object.assign(form.value, store.info)
}

function startEdit() {
  isEditMode.value = true
}

function cancelEdit() {
  resetForm()
  isEditMode.value = false
}

async function onSubmit() {
  const parsed = CompanyInfoSchema.safeParse(form.value)
  errors.value = {}
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      errors.value[key] = issue.message
    }
    error('Corregir los errores del formulario')
    return
  }
  saving.value = true
  try {
    const updated = await store.save(parsed.data)
    Object.assign(form.value, updated)
    success('Información guardada correctamente')
    isEditMode.value = false
  } catch (err: any) {
    error('Error al guardar', err?.message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.company-view {
  max-width: 1200px;
  margin: 0 auto;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.content-placeholder {
  background: var(--ps-card);
  border-radius: 0.75rem;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: var(--ps-shadow-sm);
  border: var(--ps-border-width) solid var(--ps-border);
  color: var(--ps-text-primary);
}

.placeholder-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  color: #9ca3af;
}

.placeholder-icon svg {
  width: 100%;
  height: 100%;
}

.content-placeholder h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.content-placeholder p {
  color: #6b7280;
  margin-bottom: 0.5rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}
</style>

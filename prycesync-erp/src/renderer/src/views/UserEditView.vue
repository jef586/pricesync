<template>
  <DashboardLayout>
    <div class="user-edit-view">
      <PageHeader
        :title="`Editar Usuario`"
        :subtitle="user ? user.email : 'Cargando...'"
      />

      <div v-if="hasError" class="mb-4 p-3 border rounded bg-red-50 border-red-200 text-red-700">
        {{ errorMsg }}
      </div>

      <div v-if="!user" class="p-6 text-center text-gray-500">Cargando usuario...</div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BaseCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Perfil y Permisos</h3>
              <span class="text-xs text-gray-500">Último acceso: {{ lastLoginLabel }}</span>
            </div>
          </template>

          <form @submit.prevent="confirmAndSave" class="space-y-4">
            <FormField label="Nombre" :required="true">
              <BaseInput v-model="form.name" placeholder="Nombre completo" required />
            </FormField>

            <FormField label="Email">
              <BaseInput :model-value="user.email" readonly />
            </FormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Rol" :required="true">
                <BaseSelect v-model="form.role" :options="roleOptions" :disabled="disableRoleStatus" />
              </FormField>

              <FormField label="Estado" :required="true">
                <BaseSelect v-model="statusDraft" :options="statusOptions" :disabled="disableRoleStatus" />
              </FormField>
            </div>

            <div class="flex justify-end gap-2">
              <BaseButton variant="secondary" @click="goBack">Volver</BaseButton>
              <BaseButton
                variant="danger"
                @click="confirmRevokeSessions"
                aria-keyshortcuts="Alt+R"
                aria-controls="revokeConfirmModal"
              >
                Revocar sesiones
              </BaseButton>
              <BaseButton variant="primary" type="submit" :loading="isSaving">Guardar Cambios</BaseButton>
            </div>
          </form>
        </BaseCard>
      </div>

      <!-- Confirmaciones -->
      <ConfirmModal
        id="revokeConfirmModal"
        v-model="showConfirm"
        :title="confirmTitle"
        :message="confirmMessage"
        :details="confirmDetails"
        :variant="confirmVariant"
        :loading="isSaving"
        @confirm="applyConfirmedChange"
      />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import FormField from '@/components/atoms/FormField.vue'
import ConfirmModal from '@/components/atoms/ConfirmModal.vue'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/composables/useNotifications'
import { revokeSessions } from '@/services/users'

const route = useRoute()
const router = useRouter()
const users = useUsersStore()
const auth = useAuthStore()
const { success, error } = useNotifications()

const id = String(route.params.id)
const user = ref<import('@/services/users').UserDTO & { isLastSuperadmin?: boolean } | null>(null)

const form = ref({ name: '', role: 'SELLER' })
const statusDraft = ref<'active' | 'inactive' | 'suspended'>('active')
const isSaving = ref(false)
const hasError = ref(false)
const errorMsg = ref('')

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'suspended', label: 'Suspendido' }
]

const ROLE_PRIORITY: Record<string, number> = {
  SUPERADMIN: 5,
  ADMIN: 4,
  SUPERVISOR: 3,
  SELLER: 2,
  TECHNICIAN: 2,
  admin: 4,
  manager: 3,
  user: 1,
  viewer: 1
}

const allRoles = ['SUPERADMIN','ADMIN','SUPERVISOR','SELLER','TECHNICIAN']
const roleOptions = computed(() => {
  const actorRole = auth.user?.role || 'user'
  const actorPriority = ROLE_PRIORITY[actorRole] ?? 0
  return allRoles
    .filter(r => (ROLE_PRIORITY[r] ?? 0) <= actorPriority)
    .map(r => ({ value: r, label: r === 'SUPERADMIN' ? 'Superadmin' : r === 'ADMIN' ? 'Admin' : r.charAt(0) + r.slice(1).toLowerCase() }))
})

const disableRoleStatus = computed(() => !!user.value?.isLastSuperadmin)
const lastLoginLabel = computed(() => {
  const d = (user.value?.lastLogin as any) || (user.value as any)?.lastLoginAt
  if (!d) return 'N/A'
  try { return new Date(d).toLocaleString() } catch { return String(d) }
})

// Confirm modal state
const showConfirm = ref(false)
const confirmTitle = ref('Confirmar cambios')
const confirmMessage = ref('¿Deseas aplicar estos cambios?')
const confirmDetails = ref('')
const confirmVariant = ref<'info'|'warning'|'danger'>('warning')
let pendingAction: null | 'updateUser' | 'updateStatus' | 'revokeSessions' = null

onMounted(async () => {
  try {
    const fetched = await users.getById(id)
    user.value = fetched as any
    form.value.name = fetched.name
    form.value.role = String(fetched.role)
    statusDraft.value = (fetched.status as any) || 'active'
  } catch (e: any) {
    hasError.value = true
    errorMsg.value = e?.response?.data?.error || e?.message || 'Error cargando usuario'
  }

  window.addEventListener('keydown', handleShortcut)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleShortcut)
})

watch(() => route.params.id, async (newId) => {
  if (!newId) return
  try {
    const fetched = await users.getById(String(newId))
    user.value = fetched as any
    form.value.name = fetched.name
    form.value.role = String(fetched.role)
    statusDraft.value = (fetched.status as any) || 'active'
  } catch (e: any) {
    hasError.value = true
    errorMsg.value = e?.response?.data?.error || e?.message || 'Error cargando usuario'
  }
})

function goBack() { router.back() }

function confirmAndSave() {
  if (!form.value.name || !form.value.role) return
  const roleChanged = form.value.role !== String(user.value?.role)
  const details = [
    form.value.name !== user.value?.name ? `Nombre: '${user.value?.name}' → '${form.value.name}'` : null,
    roleChanged ? `Rol: ${String(user.value?.role)} → ${form.value.role}` : null
  ].filter(Boolean).join('\n')
  confirmTitle.value = 'Confirmar cambios de usuario'
  confirmMessage.value = roleChanged ? 'Estás cambiando rol. Revisa el resumen:' : 'Guardar cambios del perfil'
  confirmDetails.value = details
  confirmVariant.value = roleChanged ? 'warning' : 'info'
  pendingAction = 'updateUser'
  showConfirm.value = true
}

async function applyConfirmedChange() {
  try {
    if (pendingAction === 'updateUser' && user.value) {
      isSaving.value = true
      const updated = await users.updateUser(user.value.id, { name: form.value.name, role: form.value.role })
      success('Usuario actualizado', 'Nombre/Rol actualizados correctamente')
      showConfirm.value = false
    } else if (pendingAction === 'updateStatus' && user.value) {
      isSaving.value = true
      const updated = await users.updateStatus(user.value.id, statusDraft.value)
      success('Estado actualizado', `Nuevo estado: ${updated.status}`)
      showConfirm.value = false
    } else if (pendingAction === 'revokeSessions' && user.value) {
      isSaving.value = true
      const res = await revokeSessions(user.value.id)
      success('Sesiones revocadas', res.message || 'Las sesiones activas han sido revocadas')
      showConfirm.value = false
    }
  } catch (e: any) {
    error('Error', e?.response?.data?.error || e?.message || 'Error al aplicar cambios')
  } finally {
    isSaving.value = false
    pendingAction = null
  }
}

function confirmRevokeSessions() {
  if (!user.value) return
  pendingAction = 'revokeSessions'
  confirmTitle.value = 'Revocar Sesiones'
  confirmMessage.value = `¿Estás seguro de que quieres revocar todas las sesiones activas para ${user.value.email}?`
  confirmDetails.value = 'Esta acción cerrará la sesión del usuario en todos los dispositivos. El usuario deberá volver a iniciar sesión.'
  confirmVariant.value = 'danger'
  showConfirm.value = true
}

function handleShortcut(e: KeyboardEvent) {
  // Alt+R para abrir la confirmación de Revocar sesiones
  const key = e.key?.toLowerCase()
  if (e.altKey && key === 'r') {
    e.preventDefault()
    confirmRevokeSessions()
  }
}

// Acciones directas de estado con confirmación
watch(statusDraft, (newStatus) => {
  if (!user.value) return
  if (newStatus !== user.value.status) {
    confirmTitle.value = 'Confirmar cambio de estado'
    confirmMessage.value = `Vas a cambiar el estado a '${newStatus}'.`
    confirmDetails.value = `Usuario: ${user.value.email}\nEstado actual: ${user.value.status} → ${newStatus}`
    confirmVariant.value = newStatus === 'suspended' ? 'danger' : 'warning'
    pendingAction = 'updateStatus'
    showConfirm.value = true
  }
})
</script>

<style scoped>
.user-edit-view { @apply p-4 space-y-4; }
</style>








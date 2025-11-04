<template>
  <DashboardLayout :key="$route.fullPath">
    <div class="users-view">
      <!-- Header -->
      <PageHeader
        title="Usuarios"
        subtitle="Administra los usuarios de tu empresa"
      >
        <template #actions>
          <BaseButton v-if="auth.hasPermission('admin:audit')" class="mr-2" variant="secondary" @click="goToAudit">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-6h13M5 7h4V3H5v4zm0 14h4v-4H5v4z" />
            </svg>
            Auditoría
          </BaseButton>
          <BaseButton class="mr-2" variant="secondary" @click="goToRoles">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l8 4v6a8 8 0 11-16 0V6l8-4z" />
            </svg>
            Roles y Permisos
          </BaseButton>
          <BaseButton variant="primary" @click="showCreateModal = true">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo usuario
          </BaseButton>
          <BaseButton class="ml-2" :variant="viewDeleted ? 'secondary' : 'ghost'" @click="toggleDeletedView">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5h16M4 12h10M4 19h16" />
            </svg>
            {{ viewDeleted ? 'Ver activos' : 'Ver eliminados' }}
          </BaseButton>
        </template>
      </PageHeader>

      <!-- Filters -->
      <UserFilters
        class="mb-6"
        @update:filters="applyFilters"
      />

      <!-- Table -->
      <UserTable
        :items="store.items"
        :page-size="store.pageSize"
        :loading="store.loading"
        :loading-ids="store.loadingIds"
        :deleted-mode="viewDeleted"
        @sort="onSort"
        @row-click="onRowClick"
        @edit="onEditUser"
        @delete="openDeleteUser"
        @toggle-status="onToggleStatus"
        @restore="openRestoreUser"
        @reset-password="openResetUser"
      />

      <!-- Pagination -->
      <Pagination
        :current-page="store.page"
        :page-size="store.pageSize"
        :total-items="store.total"
        @page-change="onPageChange"
      />

      <!-- Create User Modal -->
      <BaseModal v-model="showCreateModal" title="Crear nuevo usuario" size="md">
        <form @submit.prevent="handleCreateUser" class="space-y-4">
          <FormField label="Nombre" :required="true">
            <BaseInput v-model="form.name" placeholder="Nombre completo" required />
          </FormField>
          <FormField label="Email" :required="true">
            <BaseInput v-model="form.email" type="email" placeholder="usuario@empresa.com" required />
          </FormField>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Rol" :required="true">
              <BaseSelect v-model="form.role" :options="roleOptions" placeholder="Seleccionar rol" required />
            </FormField>
            <FormField label="Estado">
              <BaseSelect v-model="form.status" :options="statusOptions" />
            </FormField>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <BaseButton variant="ghost" @click="closeModal">Cancelar</BaseButton>
            <BaseButton variant="primary" type="submit" :loading="isCreating">Crear Usuario</BaseButton>
          </div>
        </form>

        <template #footer>
          <!-- Footer handled in form buttons -->
        </template>
      </BaseModal>

      <!-- Edit User Modal -->
      <BaseModal v-model="showEditModal" :title="editTitle" size="md">
        <form v-if="editForm.id" @submit.prevent="handleUpdateUser" class="space-y-4">
          <FormField label="Nombre" :required="true">
            <BaseInput v-model="editForm.name" placeholder="Nombre completo" required />
          </FormField>
          <FormField label="Email">
            <BaseInput :model-value="editForm.email" readonly />
          </FormField>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Rol" :required="true">
              <BaseSelect v-model="editForm.role" :options="roleOptions" required />
            </FormField>
            <FormField label="Estado" :required="true">
              <BaseSelect v-model="editForm.status" :options="statusOptions" required />
            </FormField>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <BaseButton variant="ghost" @click="closeEditModal">Cancelar</BaseButton>
            <BaseButton
              variant="danger"
              @click="openRevokeSessions"
              aria-keyshortcuts="Alt+R"
            >
              Revocar sesiones
            </BaseButton>
            <BaseButton variant="primary" type="submit" :loading="isUpdating">Guardar Cambios</BaseButton>
          </div>
        </form>
        <template #footer></template>
      </BaseModal>

      <!-- Confirmación de borrado -->
      <ConfirmModal
        v-model="showDeleteModal"
        title="Eliminar usuario"
        :message="deleteMessage"
        :details="deleteDetails"
        variant="danger"
        confirm-text="Eliminar"
        cancel-text="Cancelar"
        :loading="isDeleting"
        @confirm="confirmDeleteUser"
        @cancel="cancelDeleteUser"
      />

      <!-- Confirmación de cambio de estado -->
      <ConfirmModal
        v-model="showStatusModal"
        :title="statusModalTitle"
        :message="statusModalMessage"
        variant="warning"
        :confirm-text="statusConfirmText"
        cancel-text="Cancelar"
        :loading="isStatusUpdating"
        @confirm="confirmToggleStatus"
        @cancel="cancelToggleStatus"
      />

      <!-- Confirmación de restauración -->
      <ConfirmModal
        v-model="showRestoreModal"
        title="Restaurar usuario"
        :message="restoreMessage"
        :details="restoreDetails"
        variant="warning"
        confirm-text="Restaurar"
        cancel-text="Cancelar"
        :loading="isRestoring"
        @confirm="confirmRestoreUser"
        @cancel="cancelRestoreUser"
      />

      <!-- Confirmación de revocar sesiones -->
      <ConfirmModal
        v-model="showRevokeModal"
        title="Revocar sesiones"
        :message="revokeMessage"
        :details="revokeDetails"
        variant="danger"
        confirm-text="Revocar"
        cancel-text="Cancelar"
        :loading="isRevoking"
        @confirm="confirmRevokeSessions"
        @cancel="cancelRevokeSessions"
      />

      <!-- Reset de contraseña (modal con opción de notificar) -->
      <BaseModal v-model="showResetModal" title="Generar link de reset de contraseña" size="md">
        <form @submit.prevent="handleResetPassword" class="space-y-4">
          <p>
            Se generará un token de reseteo para
            <strong>{{ resetTargetEmail || 'usuario' }}</strong>.
          </p>
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="resetNotify" />
            <span>Notificar al usuario por email (si está configurado)</span>
          </label>
          <div class="flex justify-end gap-2 mt-4">
            <BaseButton variant="ghost" @click="cancelResetUser">Cancelar</BaseButton>
            <BaseButton variant="primary" type="submit" :loading="isResetting">Generar link</BaseButton>
          </div>
        </form>
        <template #footer></template>
      </BaseModal>

      <!-- Resultado del reset: mostrar link para copiar -->
      <BaseModal v-model="showResetResultModal" title="Link generado" size="md">
        <div class="space-y-3">
          <p>Copia y comparte el siguiente enlace al usuario:</p>
          <BaseInput :model-value="resetResultLink" readonly />
          <div class="flex justify-end gap-2 mt-2">
            <BaseButton variant="ghost" @click="showResetResultModal = false">Cerrar</BaseButton>
            <BaseButton variant="secondary" @click="copyResetLink">Copiar</BaseButton>
          </div>
        </div>
        <template #footer></template>
      </BaseModal>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import Pagination from '@/components/atoms/Pagination.vue'
import UserFilters from '@/components/users/UserFilters.vue'
import UserTable from '@/components/users/UserTable.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseModal from '@/components/atoms/BaseModal.vue'
import FormField from '@/components/atoms/FormField.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import { useUsersStore } from '@/stores/users'
import { createUser, listRoles, resetPassword as resetPasswordApi, revokeSessions } from '@/services/users'
import { useNotifications } from '@/composables/useNotifications'
import ConfirmModal from '@/components/atoms/ConfirmModal.vue'
import { useAuthStore } from '@/stores/auth'
import { getUserById } from '@/services/users'

const store = useUsersStore()
const router = useRouter()
const { success, error } = useNotifications()
const auth = useAuthStore()

const showCreateModal = ref(false)
const isCreating = ref(false)
const form = ref({ name: '', email: '', role: 'SELLER', status: 'active' })

// Estado de edición (modal)
const showEditModal = ref(false)
const isUpdating = ref(false)
const editForm = ref<{ id: string | null; name: string; email: string; role: string; status: 'active'|'inactive'|'suspended' }>({ id: null, name: '', email: '', role: 'SELLER', status: 'active' })
const editTitle = computed(() => 'Editar Usuario')

// Estado para eliminación
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const deleteTargetId = ref<string | null>(null)
const deleteTargetEmail = ref<string | null>(null)
const deleteMessage = computed(() => '¿Seguro que deseas eliminar este usuario?')
const deleteDetails = computed(() => deleteTargetEmail.value ? `Se eliminará ${deleteTargetEmail.value}. Esta acción no se puede deshacer.` : '')

// Estado para toggle de estado
const showStatusModal = ref(false)
const isStatusUpdating = ref(false)
const statusTarget = ref<import('@/services/users').UserDTO | null>(null)
const statusNext = ref<'active'|'inactive'|'suspended'>('active')
const statusModalTitle = computed(() => 'Cambiar estado de usuario')
const statusModalMessage = computed(() => {
  if (!statusTarget.value) return ''
  const action = statusNext.value === 'active' ? 'Activar' : 'Suspender'
  return `${action} usuario ${statusTarget.value.email}`
})
const statusConfirmText = computed(() => (statusNext.value === 'active' ? 'Activar' : 'Suspender'))

const roleOptions = ref<{ value: string; label: string }[]>([])
const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'suspended', label: 'Suspendido' }
]

// Estado de restauración y vista de eliminados
const showRestoreModal = ref(false)
const isRestoring = ref(false)
const restoreTargetId = ref<string | null>(null)
const restoreTargetEmail = ref<string | null>(null)
const restoreMessage = computed(() => '¿Seguro que deseas restaurar este usuario?')
const restoreDetails = computed(() => restoreTargetEmail.value ? `Se restaurará ${restoreTargetEmail.value}.` : '')

// Revocar sesiones
const showRevokeModal = ref(false)
const isRevoking = ref(false)
const revokeTargetId = ref<string | null>(null)
const revokeTargetEmail = ref<string | null>(null)
const revokeMessage = computed(() => '¿Estás seguro de que quieres revocar todas las sesiones activas?')
const revokeDetails = computed(() => revokeTargetEmail.value ? `Usuario: ${revokeTargetEmail.value}. Esta acción cerrará sesión en todos los dispositivos.` : '')

// Reset de contraseña
const showResetModal = ref(false)
const resetNotify = ref(false)
const isResetting = ref(false)
const resetTargetId = ref<string | null>(null)
const resetTargetEmail = ref<string | null>(null)
const showResetResultModal = ref(false)
const resetResultLink = ref<string>('')

// Vista: ¿mostrar usuarios eliminados?
const viewDeleted = computed(() => router.currentRoute.value.query.view === 'deleted')

onMounted(async () => {
  // Inicializar listado respetando query ?view=deleted
  store.setFilters({ deleted: viewDeleted.value })
  await store.list({ deleted: viewDeleted.value })
  try {
    const roles = await listRoles()
    const LABELS: Record<string, string> = {
      SUPERADMIN: 'Superadmin',
      ADMIN: 'Admin',
      SUPERVISOR: 'Supervisor',
      SELLER: 'Vendedor',
      TECHNICIAN: 'Técnico'
    }
    roleOptions.value = roles.map(r => ({ value: r, label: LABELS[r] || r }))
  } catch (e) {
    // fallback a nuevo RBAC
    roleOptions.value = [
      { value: 'SUPERADMIN', label: 'Superadmin' },
      { value: 'ADMIN', label: 'Admin' },
      { value: 'SUPERVISOR', label: 'Supervisor' },
      { value: 'SELLER', label: 'Vendedor' },
      { value: 'TECHNICIAN', label: 'Técnico' }
    ]
  }

  // Atajo de teclado Alt+R dentro del modal de edición
  window.addEventListener('keydown', handleShortcut)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleShortcut)
})

function goToRoles() {
  router.push({ name: 'RolesMatrix' })
}

function goToAudit() {
  // Ruta anidada dentro del módulo de usuarios
  router.push({ name: 'AuditLogsUsers' })
}

function statusLabel(value: string) {
  const map: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido'
  }
  return map[value] || value
}

async function applyFilters(filters: { q?: string; role?: string; status?: string }) {
  store.setFilters({ ...filters, deleted: viewDeleted.value })
  await store.list({ ...filters, deleted: viewDeleted.value })
}

async function onSort({ sortBy, sortOrder }: { sortBy: string; sortOrder: 'asc' | 'desc' }) {
  store.setSort(sortBy as any, sortOrder)
  await store.list({ deleted: viewDeleted.value })
}

async function onPageChange(page: number) {
  store.setPage(page)
  await store.list({ deleted: viewDeleted.value })
}

async function handleCreateUser() {
  if (!form.value.name || !form.value.email || !form.value.role) return
  try {
    isCreating.value = true
    const user = await createUser({
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      status: form.value.status
    })
    success('Usuario creado', `Se creó ${user?.email || form.value.email}`)
    closeModal()
    await store.list()
  } catch (e: any) {
    error('Error al crear usuario', e?.response?.data?.error || e?.message)
  } finally {
    isCreating.value = false
  }
}

function closeModal() {
  showCreateModal.value = false
  form.value = { name: '', email: '', role: 'SELLER', status: 'active' }
}

function onRowClick(item: any) {
  if (!item?.id) return
  openEditUser(item.id)
}

function onEditUser(user: any) {
  if (!user?.id) return
  openEditUser(user.id)
}

function openDeleteUser(user: any) {
  deleteTargetId.value = user?.id || null
  deleteTargetEmail.value = user?.email || null
  showDeleteModal.value = !!deleteTargetId.value
}

async function onToggleStatus(user: any) {
  try {
    if (!user?.id) return
    const target = await getUserById(String(user.id))
    const next = user.status === 'active' ? 'suspended' : 'active'
    // Bloquear último SUPERADMIN en UI si intenta pasar a no-activo
    if ((target as any).isLastSuperadmin && String(target.role) === 'SUPERADMIN' && next !== 'active') {
      error('Acción bloqueada', 'No se puede suspender al último SUPERADMIN activo')
      return
    }
    // Anti-escalación UI: rol editor < rol target
    const ROLE_PRIORITY: Record<string, number> = { SUPERADMIN:5, ADMIN:4, SUPERVISOR:3, SELLER:2, TECHNICIAN:2, admin:4, manager:3, user:2, viewer:1 }
    const actorRole = auth.user?.role || 'viewer'
    if ((ROLE_PRIORITY[String(actorRole)] ?? 0) < (ROLE_PRIORITY[String(target.role)] ?? 0)) {
      error('Permiso insuficiente', 'No puedes cambiar el estado de un usuario con mayor privilegio que el tuyo')
      return
    }
    statusTarget.value = user
    statusNext.value = next as any
    showStatusModal.value = true
  } catch (e: any) {
    error('No se pudo preparar la acción', e?.response?.data?.error || e?.message)
  }
}

async function confirmToggleStatus() {
  if (!statusTarget.value?.id) return
  try {
    isStatusUpdating.value = true
    await store.updateStatus(String(statusTarget.value.id), statusNext.value as any)
    success('Estado actualizado', `${statusTarget.value.email} → ${statusLabel(statusNext.value)}`)
    showStatusModal.value = false
  } catch (e: any) {
    error('Error al cambiar estado', e?.response?.data?.error || e?.message)
  } finally {
    isStatusUpdating.value = false
    statusTarget.value = null
  }
}

function cancelToggleStatus() {
  showStatusModal.value = false
  statusTarget.value = null
}

async function confirmDeleteUser() {
  if (!deleteTargetId.value) return
  try {
    isDeleting.value = true
    const ok = await store.removeUser(deleteTargetId.value)
    if (ok) {
      success('Usuario eliminado', deleteTargetEmail.value ? `Se eliminó ${deleteTargetEmail.value}` : 'Eliminado')
      await store.list({ deleted: viewDeleted.value })
    } else {
      error('No se pudo eliminar el usuario')
    }
  } catch (e: any) {
    error('Error al eliminar usuario', e?.response?.data?.error || e?.message)
  } finally {
    isDeleting.value = false
    cancelDeleteUser()
  }
}

function cancelDeleteUser() {
  showDeleteModal.value = false
  deleteTargetId.value = null
  deleteTargetEmail.value = null
}

// --- Restauración de usuarios ---
function openRestoreUser(user: any) {
  restoreTargetId.value = user?.id || null
  restoreTargetEmail.value = user?.email || null
  showRestoreModal.value = !!restoreTargetId.value
}

async function confirmRestoreUser() {
  if (!restoreTargetId.value) return
  try {
    isRestoring.value = true
    const ok = await store.restoreUser(restoreTargetId.value)
    if (ok) {
      success('Usuario restaurado', restoreTargetEmail.value ? `Se restauró ${restoreTargetEmail.value}` : 'Restaurado')
      await store.list({ deleted: viewDeleted.value })
    } else {
      error('No se pudo restaurar el usuario')
    }
  } catch (e: any) {
    error('Error al restaurar usuario', e?.response?.data?.error || e?.message)
  } finally {
    isRestoring.value = false
    cancelRestoreUser()
  }
}

function cancelRestoreUser() {
  showRestoreModal.value = false
  restoreTargetId.value = null
  restoreTargetEmail.value = null
}

// --- Reset de contraseña ---
function openResetUser(user: any) {
  resetTargetId.value = user?.id || null
  resetTargetEmail.value = user?.email || null
  showResetModal.value = !!resetTargetId.value
}

async function handleResetPassword() {
  if (!resetTargetId.value) return
  try {
    isResetting.value = true
    const res = await resetPasswordApi(resetTargetId.value, { notify: resetNotify.value })
    if (res?.ok) {
      success('Token generado', 'Se creó el token de reset de contraseña')
      resetResultLink.value = res?.link || ''
      showResetResultModal.value = !!resetResultLink.value
      showResetModal.value = false
    } else {
      error('No se pudo generar el token', res?.message || 'Error desconocido')
    }
  } catch (e: any) {
    error('Error al generar token', e?.response?.data?.error || e?.message)
  } finally {
    isResetting.value = false
    resetNotify.value = false
    resetTargetId.value = null
  }
}

function cancelResetUser() {
  showResetModal.value = false
  resetNotify.value = false
  resetTargetId.value = null
  resetTargetEmail.value = null
}

async function copyResetLink() {
  try {
    await navigator.clipboard.writeText(resetResultLink.value)
    success('Copiado', 'El enlace se copió al portapapeles')
  } catch {
    error('No se pudo copiar el enlace')
  }
}

function toggleDeletedView() {
  const next = !viewDeleted.value
  const q = { ...router.currentRoute.value.query, view: next ? 'deleted' : undefined }
  if (!next) delete (q as any).view
  router.push({ path: router.currentRoute.value.path, query: q })
  store.setFilters({ deleted: next })
  store.list({ deleted: next })
}

// ---- Edición de usuario (modal) ----
async function openEditUser(id: string) {
  try {
    const u = await store.getById(id)
    editForm.value = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: String(u.role),
      status: (u.status as any) || 'active'
    }
    showEditModal.value = true
  } catch (e: any) {
    error('No se pudo cargar el usuario', e?.response?.data?.error || e?.message)
  }
}

function closeEditModal() {
  showEditModal.value = false
  editForm.value = { id: null, name: '', email: '', role: 'SELLER', status: 'active' }
}

async function handleUpdateUser() {
  if (!editForm.value.id || !editForm.value.name || !editForm.value.role) return
  try {
    isUpdating.value = true
    await store.updateUser(editForm.value.id, { name: editForm.value.name, role: editForm.value.role })
    await store.updateStatus(editForm.value.id, editForm.value.status)
    success('Usuario actualizado', editForm.value.email ? `Se actualizó ${editForm.value.email}` : 'Actualizado')
    closeEditModal()
    await store.list()
  } catch (e: any) {
    error('Error al actualizar usuario', e?.response?.data?.error || e?.message)
  } finally {
    isUpdating.value = false
  }
}

function openRevokeSessions() {
  if (!editForm.value.id) return
  revokeTargetId.value = editForm.value.id
  revokeTargetEmail.value = editForm.value.email
  showRevokeModal.value = true
}

async function confirmRevokeSessions() {
  if (!revokeTargetId.value) return
  try {
    isRevoking.value = true
    const res = await revokeSessions(revokeTargetId.value)
    success('Sesiones revocadas', res?.message || 'Las sesiones activas han sido revocadas')
    showRevokeModal.value = false
  } catch (e: any) {
    error('Error al revocar sesiones', e?.response?.data?.error || e?.message)
  } finally {
    isRevoking.value = false
    revokeTargetId.value = null
    revokeTargetEmail.value = null
  }
}

function cancelRevokeSessions() {
  showRevokeModal.value = false
  revokeTargetId.value = null
  revokeTargetEmail.value = null
}

function handleShortcut(e: KeyboardEvent) {
  const key = e.key?.toLowerCase()
  if (showEditModal.value && e.altKey && key === 'r') {
    e.preventDefault()
    openRevokeSessions()
  }
}
</script>

<style scoped>
.users-view {
  @apply space-y-6;
}
</style>
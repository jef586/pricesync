<template>
  <DashboardLayout>
    <div class="users-view">
      <!-- Header -->
      <PageHeader
        title="Usuarios"
        subtitle="Administra los usuarios de tu empresa"
      >
        <template #actions>
          <BaseButton variant="primary" @click="showCreateModal = true">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo usuario
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
        @sort="onSort"
        @row-click="onRowClick"
        @edit="onEditUser"
        @delete="openDeleteUser"
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
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
import { createUser, listRoles, deleteUser } from '@/services/users'
import { useNotifications } from '@/composables/useNotifications'
import ConfirmModal from '@/components/atoms/ConfirmModal.vue'

const store = useUsersStore()
const router = useRouter()
const { success, error } = useNotifications()

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

const roleOptions = ref<{ value: string; label: string }[]>([])
const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'suspended', label: 'Suspendido' }
]

onMounted(async () => {
  await store.list()
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
})

async function applyFilters(filters: { q?: string; role?: string; status?: string }) {
  store.setFilters(filters)
  await store.list()
}

async function onSort({ sortBy, sortOrder }: { sortBy: string; sortOrder: 'asc' | 'desc' }) {
  store.setSort(sortBy as any, sortOrder)
  await store.list()
}

async function onPageChange(page: number) {
  store.setPage(page)
  await store.list()
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

async function confirmDeleteUser() {
  if (!deleteTargetId.value) return
  try {
    isDeleting.value = true
    const ok = await deleteUser(deleteTargetId.value)
    if (ok) {
      success('Usuario eliminado', deleteTargetEmail.value ? `Se eliminó ${deleteTargetEmail.value}` : 'Eliminado')
      await store.list()
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
</script>

<style scoped>
.users-view {
  @apply space-y-6;
}
</style>
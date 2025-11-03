<template>
  <DashboardLayout>
    <div class="users-view">
      <!-- Header -->
      <PageHeader
        title="Usuarios"
        subtitle="Administra los usuarios de tu empresa"
      />
      <div class="flex justify-end mt-2">
        <BaseButton variant="primary" @click="showCreateModal = true">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo usuario
        </BaseButton>
      </div>

      <!-- Filters -->
      <UserFilters
        @update:filters="applyFilters"
      />

      <!-- Table -->
      <div class="mt-4">
        <UserTable
          :items="store.items"
          :page-size="store.pageSize"
          :loading="store.loading"
          @sort="onSort"
        />
      </div>

      <!-- Pagination -->
      <div class="mt-4">
        <Pagination
          :current-page="store.page"
          :page-size="store.pageSize"
          :total-items="store.total"
          @page-change="onPageChange"
        />
      </div>

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
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
import { createUser, listRoles } from '@/services/users'
import { useNotifications } from '@/composables/useNotifications'

const store = useUsersStore()
const { success, error } = useNotifications()

const showCreateModal = ref(false)
const isCreating = ref(false)
const form = ref({ name: '', email: '', role: 'user', status: 'active' })

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
    roleOptions.value = roles.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))
  } catch (e) {
    // fallback
    roleOptions.value = [
      { value: 'admin', label: 'Admin' },
      { value: 'manager', label: 'Manager' },
      { value: 'user', label: 'Usuario' },
      { value: 'viewer', label: 'Viewer' }
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
  form.value = { name: '', email: '', role: 'user', status: 'active' }
}
</script>

<style scoped>
.users-view {
  @apply space-y-4;
}
</style>
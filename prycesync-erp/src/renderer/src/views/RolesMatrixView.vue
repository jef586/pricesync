<template>
  <DashboardLayout :key="$route.fullPath">
  <div class="p-4 space-y-4">
  <BaseCard variant="elevated">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="section-title text-lg font-semibold">Roles y Permisos</h1>
          <div class="flex items-center gap-3">
            <BaseButton variant="ghost" @click="goBack">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 18l-6-6 6-6" />
              </svg>
              Volver
            </BaseButton>
            <BaseButton
              variant="primary"
              :disabled="!canViewEditor"
              title="Ir al editor de matriz de permisos"
              class="whitespace-nowrap"
              @click="goToEditor"
            >
              Editar matriz
            </BaseButton>
            <BaseInput v-model="search" placeholder="Buscar permisos…" />
            <BaseSelect v-model="selectedGroup" :options="groupOptions" placeholder="Grupo" />
          </div>
        </div>
      </template>

      <div v-if="store.loading" class="p-6 text-center loading-text">Cargando…</div>
      <ErrorState v-else-if="store.error" :message="store.error" @retry="reload" />
      <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Roles -->
        <div class="md:col-span-1 space-y-2">
          <h2 class="section-subtitle text-sm font-medium">Roles</h2>
          <div v-if="store.catalog.length === 0 && store.roles.length === 0">
            <EmptyState message="No hay roles para mostrar" />
          </div>
          <div v-else class="space-y-2">
            <RoleBadge
              v-for="r in roleItems"
              :key="r.code"
              :role="r.code"
              :label="r.label"
              :description="r.description"
              :selected="store.selectedRole === r.code"
              @select="onSelectRole"
            />
          </div>
        </div>

        <!-- Matriz (permiso vs rol seleccionado) -->
        <div class="md:col-span-3">
          <h2 class="section-subtitle text-sm font-medium">Permisos</h2>
          <div v-if="filtered.length === 0">
            <EmptyState message="No hay permisos que coincidan con el filtro" />
          </div>
          <div v-else class="space-y-2">
            <div v-for="p in filtered" :key="p.code" class="permission-item flex items-center justify-between p-2 border rounded">
              <div>
                <div class="permission-item__title text-sm font-medium">{{ p.label || p.code }}</div>
                <div class="permission-item__subtitle text-xs">{{ p.group || 'Sin grupo' }}</div>
              </div>
              <PermissionChip :code="p.code" :label="p.label" :active="store.roleHas(store.selectedRole, p.code)" />
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import RoleBadge from '@/components/users/RoleBadge.vue'
import PermissionChip from '@/components/users/PermissionChip.vue'
import ErrorState from '@/components/users/ErrorState.vue'
import EmptyState from '@/components/users/EmptyState.vue'
import { useRolesStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'

const store = useRolesStore()
const router = useRouter()
const auth = useAuthStore()

const search = ref('')
const selectedGroup = ref('')

const groupOptions = computed(() => [{ value: '', label: 'Todos' }, ...store.groups.map(g => ({ value: g, label: g }))])

const roleItems = computed(() => {
  if (store.catalog.length) return store.catalog
  const LABELS: Record<string, string> = {
    SUPERADMIN: 'Superadmin',
    ADMIN: 'Admin',
    SUPERVISOR: 'Supervisor',
    SELLER: 'Vendedor',
    TECHNICIAN: 'Técnico'
  }
  return store.roles.map(code => ({ code, label: LABELS[code] || code }))
})

const filtered = computed(() => store.filteredPermissions)

const canViewEditor = computed(() => auth.hasScope('admin:roles'))

function onSelectRole(code: string) {
  store.setSelectedRole(code)
}

async function reload() {
  await Promise.all([store.fetchRoles(), store.fetchMatrix()])
}

onMounted(async () => {
  await reload()
})

watch(search, (q) => store.setSearch(q))
watch(selectedGroup, (g) => store.setSelectedGroup(g))

function goBack() {
  router.push({ name: 'Users' })
}

function goToEditor() {
  router.push({ name: 'RolesMatrixEditor' })
}
</script>

<style scoped>
/* Mejorar legibilidad en oscuro usando tokens */
.section-title { color: var(--ps-text-primary); }
.section-subtitle { color: var(--ps-text-secondary); }
.loading-text { color: var(--ps-text-secondary); }
.permission-item { background: var(--ps-card); border-color: var(--ps-border); }
.permission-item__title { color: var(--ps-text-primary); }
.permission-item__subtitle { color: var(--ps-text-secondary); }
</style>
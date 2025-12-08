<template>
  <DataTable
    :data="items"
    :columns="columns"
    :paginated="true"
    :page-size="pageSize"
    :loading="loading"
    :show-header="false"
    row-key="id"
    :clickable-rows="clickableRows"
    @sort="onSort"
    @row-click="onRowClick"
  >
    <!-- Región en vivo para anunciar cambios de sort/paginación -->
    <template #above>
      <div class="sr-only" aria-live="polite">{{ liveAnnouncement }}</div>
    </template>
    <!-- Encabezados semánticos cuando DataTable renderiza table internamente -->
    <template #thead="{ cols }">
      <thead>
        <tr>
          <th v-for="c in cols" :key="c.key" scope="col" class="text-left px-4 py-2">
            {{ c.label }}
          </th>
          <th scope="col" class="text-center px-4 py-2">Acciones</th>
        </tr>
      </thead>
    </template>

    <!-- Filas con role=row para mejor navegación por lectores -->
    <template #row="{ item }">
      <tr role="row">
        <td role="cell" class="px-4 py-2">{{ item.name }}</td>
        <td role="cell" class="px-4 py-2">{{ item.email }}</td>
        <td role="cell" class="px-4 py-2">{{ item.role }}</td>
        <td v-if="!deletedMode" role="cell" class="px-4 py-2">
          <span :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
        </td>
        <td v-if="!deletedMode" role="cell" class="px-4 py-2">{{ formatDateTimeAR(item.lastLogin) }}</td>
        <td role="cell" class="px-4 py-2">{{ formatDateTimeAR(item.createdAt) }}</td>
        <td v-if="deletedMode" role="cell" class="px-4 py-2">{{ formatDateTimeAR(item.deletedAt) }}</td>
        <td role="cell" class="px-4 py-2">
          <!-- Reutilizamos el slot de acciones existente -->
          <slot name="actions" :item="item" />
        </td>
      </tr>
    </template>

    <!-- Estado sin resultados -->
    <template #empty>
      <div class="text-center py-8" role="status" aria-live="polite">
        <p class="text-gray-700">No hay usuarios que coincidan.</p>
        <p class="text-sm text-gray-500">Puedes ajustar la búsqueda o limpiar filtros.</p>
        <div class="mt-4 flex justify-center gap-2">
          <BaseButton variant="primary" @click="$emit('clear-filters')">Limpiar filtros</BaseButton>
          <BaseButton variant="secondary" @click="$emit('create-new')">Crear usuario</BaseButton>
        </div>
      </div>
    </template>

    <template #cell-status="{ value }">
      <span :class="statusClass(value)">{{ statusLabel(value) }}</span>
    </template>
    <template #cell-lastLogin="{ value }">
      {{ formatDateTimeAR(value) }}
    </template>
    <template #cell-createdAt="{ value }">
      {{ formatDateTimeAR(value) }}
    </template>
    <template #cell-deletedAt="{ value }">
      {{ formatDateTimeAR(value) }}
    </template>
    <!-- Acciones por fila: Editar / Borrar / Restaurar -->
    <template #actions="{ item }">
      <div class="flex items-center justify-center gap-2">
        <!-- Toggle estado: Suspender/Activar (solo en modo activos) -->
        <BaseButton
          v-if="canSeeToggle && !deletedMode"
          :variant="toggleVariant(item)"
          size="sm"
          :aria-label="toggleAria(item)"
          :title="toggleAria(item)"
          :disabled="isRowLoading(item) || isToggleBlocked(item)"
          @click.stop="onToggle(item)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span class="ml-1">{{ toggleLabel(item) }}</span>
        </BaseButton>
        <!-- Reset contraseña: colocar junto a Suspender/Activar -->
        <BaseButton v-if="!deletedMode && canSeeToggle" variant="secondary" size="sm" aria-label="Reset contraseña" title="Reset contraseña" @click.stop="onReset(item)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <!-- icono de candado -->
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11V7a4 4 0 118 0v4M6 11h12v10H6V11z" />
          </svg>
          <span class="ml-1">Reset contraseña</span>
        </BaseButton>
        <BaseButton v-if="!deletedMode" variant="ghost" size="sm" aria-label="Editar" title="Editar" @click.stop="onEdit(item)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </BaseButton>
        <BaseButton v-if="!deletedMode" variant="danger" size="sm" aria-label="Borrar" title="Borrar" @click.stop="onDelete(item)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h10" />
          </svg>
        </BaseButton>
        <!-- Restaurar (solo en modo eliminados) -->
        <BaseButton v-if="deletedMode" variant="primary" size="sm" aria-label="Restaurar" title="Restaurar" @click.stop="onRestore(item)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v6h6M20 20v-6h-6M5 13a7 7 0 0012 0" />
          </svg>
          <span class="ml-1">Restaurar</span>
        </BaseButton>
      </div>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DataTable from '@/components/atoms/DataTable.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import type { UserDTO } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { formatDateTimeAR } from '@/utils/date'

interface Props {
  items: UserDTO[]
  pageSize?: number
  loading?: boolean
  clickableRows?: boolean
  loadingIds?: string[]
  deletedMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 8,
  loading: false,
  clickableRows: true,
  loadingIds: () => [],
  deletedMode: false
})

interface Emits {
  (e: 'sort', payload: { sortBy: string; sortOrder: 'asc' | 'desc' }): void
  (e: 'row-click', payload: UserDTO): void
  (e: 'edit', payload: UserDTO): void
  (e: 'delete', payload: UserDTO): void
  (e: 'toggle-status', payload: UserDTO): void
  (e: 'restore', payload: UserDTO): void
  (e: 'reset-password', payload: UserDTO): void
  (e: 'clear-filters'): void
  (e: 'create-new'): void
}

const emit = defineEmits<Emits>()
const auth = useAuthStore()

const columns = computed(() =>
  props.deletedMode
    ? [
        { key: 'name', label: 'Nombre', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'role', label: 'Rol', sortable: true },
        { key: 'deletedAt', label: 'Eliminado el', sortable: true },
      ]
    : [
        { key: 'name', label: 'Nombre', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'role', label: 'Rol', sortable: true },
        { key: 'status', label: 'Estado', sortable: true },
        { key: 'lastLogin', label: 'Último acceso', sortable: true },
        { key: 'createdAt', label: 'Creado', sortable: true },
      ]
)

function statusLabel(value: string) {
  const map: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido'
  }
  return map[value] || value
}

function statusClass(value: string) {
  const map: Record<string, string> = {
    active: 'text-green-600',
    inactive: 'text-gray-500',
    suspended: 'text-orange-600'
  }
  return map[value] || 'text-gray-700'
}

function onSort({ key, direction }: any) {
  emit('sort', { sortBy: key, sortOrder: direction })
  liveAnnouncement.value = `Ordenado por ${key} ${direction === 'asc' ? 'ascendente' : 'descendente'}`
}

function onRowClick(item: UserDTO) {
  emit('row-click', item)
}

function onEdit(item: UserDTO) {
  emit('edit', item)
}

function onDelete(item: UserDTO) {
  emit('delete', item)
}

function onRestore(item: UserDTO) {
  emit('restore', item)
}
function onReset(item: UserDTO) {
  emit('reset-password', item)
}

// --- Toggle helpers ---
const ROLE_PRIORITY: Record<string, number> = {
  SUPERADMIN: 5,
  ADMIN: 4,
  SUPERVISOR: 3,
  SELLER: 2,
  TECHNICIAN: 2,
  admin: 4,
  manager: 3,
  user: 2,
  viewer: 1
}

const canSeeToggle = computed(() => auth.hasScope('admin:users'))
function isRowLoading(item: UserDTO) {
  return props.loadingIds?.includes(item.id)
}
function isToggleBlocked(item: UserDTO) {
  const actorRole = auth.user?.role || 'viewer'
  const actorPriority = ROLE_PRIORITY[String(actorRole)] ?? 0
  const targetPriority = ROLE_PRIORITY[String(item.role)] ?? 0
  return actorPriority < targetPriority
}
function nextStatus(item: UserDTO): 'active' | 'suspended' | 'inactive' {
  return item.status === 'active' ? 'suspended' : 'active'
}
function toggleLabel(item: UserDTO) {
  return item.status === 'active' ? 'Suspender' : 'Activar'
}
function toggleAria(item: UserDTO) {
  const action = toggleLabel(item)
  return `${action} usuario ${item.email}`
}
function toggleVariant(item: UserDTO) {
  // Usar 'secondary' para Suspender y evitar confusión con el botón Borrar (danger)
  return item.status === 'active' ? 'secondary' : 'primary'
}
function onToggle(item: UserDTO) {
  emit('toggle-status', item)
}

// Live announcement state
import { ref, watch } from 'vue'
const liveAnnouncement = ref('')
// Anunciar cambios en carga o items
watch(() => props.loading, (isLoading) => {
  liveAnnouncement.value = isLoading ? 'Cargando usuarios…' : 'Lista actualizada'
})
</script>

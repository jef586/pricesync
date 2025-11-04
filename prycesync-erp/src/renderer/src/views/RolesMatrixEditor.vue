<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRolesStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import MatrixToolbar from '@/components/roles/MatrixToolbar.vue'
import DiffSummary from '@/components/roles/DiffSummary.vue'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'

const rolesStore = useRolesStore()
const auth = useAuthStore()

const canWrite = computed(() => auth.hasScope('admin:roles:write'))
const showDiff = ref(false)

onMounted(async () => {
  await rolesStore.fetchAll()
})

function toggleEdit() {
  if (!rolesStore.editing) rolesStore.startEdit()
  else rolesStore.cancelEdit()
}

function onToggle(role: string, perm: string) {
  const draft = rolesStore.draftMatrix.length ? rolesStore.draftMatrix : rolesStore.matrix.map(r => ({ role: r.role, permissions: [...r.permissions] }))
  const row = draft.find(r => r.role === role)
  if (!row) draft.push({ role, permissions: [perm] })
  else {
    const has = row.permissions.includes(perm)
    row.permissions = has ? row.permissions.filter(p => p !== perm) : [...row.permissions, perm]
  }
  rolesStore.applyDraft(draft)
}

const diffByRole = computed(() => rolesStore.computeDiff(rolesStore.matrix, rolesStore.draftMatrix))

async function saveAll() {
  showDiff.value = false
  await rolesStore.saveAllChanges()
}

// Navegación por teclado entre checkboxes en la grilla
function onArrow(role: string, permCode: string, dir: 'left' | 'right' | 'up' | 'down') {
  const roleIdx = rolesStore.roles.indexOf(role)
  const permIdx = rolesStore.filteredPermissions.findIndex(p => p.code === permCode)
  if (roleIdx === -1 || permIdx === -1) return

  let nextRoleIdx = roleIdx
  let nextPermIdx = permIdx
  if (dir === 'left') nextRoleIdx = Math.max(0, roleIdx - 1)
  if (dir === 'right') nextRoleIdx = Math.min(rolesStore.roles.length - 1, roleIdx + 1)
  if (dir === 'up') nextPermIdx = Math.max(0, permIdx - 1)
  if (dir === 'down') nextPermIdx = Math.min(rolesStore.filteredPermissions.length - 1, permIdx + 1)

  const nextId = `chk-${rolesStore.roles[nextRoleIdx]}-${rolesStore.filteredPermissions[nextPermIdx].code}`
  const el = document.getElementById(nextId)
  if (el && typeof (el as HTMLElement).focus === 'function') (el as HTMLElement).focus()
}
</script>

<template>
  <DashboardLayout>
  <div class="p-4 space-y-4">
    <h1 class="text-xl font-semibold">Roles y Permisos</h1>
    <MatrixToolbar
      :editing="rolesStore.editing"
      :can-write="canWrite"
      :saving="rolesStore.saving"
      :groups="rolesStore.groups"
      :selected-group="rolesStore.selectedGroup"
      :search="rolesStore.search"
      @toggle-edit="toggleEdit"
      @search="rolesStore.setSearch"
      @group="rolesStore.setSelectedGroup"
      @save-all="() => { showDiff = true }"
      @cancel="rolesStore.cancelEdit"
    />

    <div v-if="rolesStore.loading" class="text-sm text-gray-500">Cargando matriz...</div>
    <div v-else>
      <div class="overflow-auto border rounded">
        <table class="min-w-full text-sm" aria-label="Matriz de roles y permisos">
          <thead>
            <tr>
              <th class="text-left p-2 w-64" scope="col" id="perm-col">Permiso</th>
              <th v-for="role in rolesStore.roles" :key="role" class="p-2 text-left" scope="col" :id="`role-col-${role}`">{{ role }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="perm in rolesStore.filteredPermissions" :key="perm.code" class="border-t">
              <td class="p-2" :id="`perm-${perm.code}`">
                <div class="font-medium">{{ perm.label }}</div>
                <div class="text-xs text-gray-500">{{ perm.code }}<span v-if="perm.group"> · {{ perm.group }}</span></div>
              </td>
              <td v-for="role in rolesStore.roles" :key="role" class="p-2">
                <input
                  :id="`chk-${role}-${perm.code}`"
                  type="checkbox"
                  :aria-labelledby="`perm-${perm.code} role-col-${role}`"
                  :disabled="!rolesStore.editing || !canWrite || rolesStore.saving"
                  :checked="(rolesStore.editing ? rolesStore.draftMatrix : rolesStore.matrix).find(r => r.role === role)?.permissions.includes(perm.code)"
                  @change="onToggle(role, perm.code)"
                  @keydown.left.prevent="onArrow(role, perm.code, 'left')"
                  @keydown.right.prevent="onArrow(role, perm.code, 'right')"
                  @keydown.up.prevent="onArrow(role, perm.code, 'up')"
                  @keydown.down.prevent="onArrow(role, perm.code, 'down')"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <DiffSummary
      v-if="rolesStore.editing && showDiff"
      :diff="diffByRole"
      :roles="rolesStore.roles"
      @confirm="saveAll"
      @close="() => { showDiff = false }"
    />

    <div v-if="rolesStore.error" class="text-sm text-red-600">{{ rolesStore.error }}</div>
  </div>
  </DashboardLayout>
</template>

<style scoped>
table th, table td { white-space: nowrap; }
</style>
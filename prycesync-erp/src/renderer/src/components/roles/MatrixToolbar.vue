<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ 
  editing: boolean,
  canWrite: boolean,
  saving: boolean,
  groups: string[],
  selectedGroup: string,
  search: string
}>()

const emit = defineEmits(['toggle-edit','save-all','cancel','group','search'])

const editLabel = computed(() => props.editing ? 'Cancelar' : 'Editar')

function onToggleEdit() {
  emit('toggle-edit')
}

function onSaveAll() {
  emit('save-all')
}

function onCancel() {
  emit('cancel')
}

function onGroupChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  emit('group', v)
}

function onSearchChange(e: Event) {
  const v = (e.target as HTMLInputElement).value
  emit('search', v)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button class="px-3 py-1 border rounded" :disabled="!canWrite || saving" @click="onToggleEdit">{{ editLabel }}</button>
    <button class="px-3 py-1 border rounded bg-blue-600 text-white" :disabled="!editing || !canWrite || saving" @click="onSaveAll">Guardar cambios</button>
    <button class="px-3 py-1 border rounded" :disabled="!editing || saving" @click="onCancel">Cancelar</button>
    <div class="ml-auto flex items-center gap-2">
      <input class="px-2 py-1 border rounded" type="text" :value="search" placeholder="Buscar permiso..." @input="onSearchChange" />
      <select class="px-2 py-1 border rounded" :value="selectedGroup" @change="onGroupChange">
        <option value="">Todos los grupos</option>
        <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
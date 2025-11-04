<script setup lang="ts">
const props = defineProps<{ diff: Record<string, { added: string[]; removed: string[] }>, roles: string[] }>()
const emit = defineEmits(['confirm','close'])
</script>

<template>
  <div class="fixed inset-0 bg-black/30 flex items-center justify-center">
    <div class="bg-white rounded shadow p-4 w-[720px] max-h-[80vh] overflow-auto">
      <h2 class="text-lg font-semibold mb-2">Resumen de cambios</h2>
      <p class="text-sm text-gray-600 mb-4">Se guardarán los siguientes cambios por rol.</p>
      <div class="space-y-3">
        <div v-for="role in roles" :key="role" class="border rounded p-2">
          <div class="font-medium mb-1">{{ role }}</div>
          <div class="text-sm">
            <div><span class="font-semibold">Añadidos:</span> {{ (props.diff[role]?.added || []).join(', ') || '—' }}</div>
            <div><span class="font-semibold">Removidos:</span> {{ (props.diff[role]?.removed || []).join(', ') || '—' }}</div>
          </div>
        </div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button class="px-3 py-1 border rounded" @click="emit('close')">Cerrar</button>
        <button class="px-3 py-1 border rounded bg-blue-600 text-white" @click="emit('confirm')">Confirmar y guardar</button>
      </div>
    </div>
  </div>
</template>
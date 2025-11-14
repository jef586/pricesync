<template>
  <BaseModal
    v-model="isOpen"
    title="¡Rubro creado exitosamente!"
    size="sm"
    :closable="true"
    :close-on-overlay="true"
    @close="handleClose"
  >
    <div class="space-y-4 text-center">
      <!-- Icono de éxito -->
      <div class="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <!-- Mensaje de éxito -->
      <div>
        <h3 class="text-lg font-semibold text-gray-900">¡Rubro creado!</h3>
        <p class="text-sm text-gray-600 mt-1">
          El rubro "<span class="font-medium">{{ rubroName }}</span>" ha sido creado correctamente.
        </p>
        <p class="text-xs text-gray-500 mt-2">
          Puede continuar creando más rubros o cerrar este mensaje.
        </p>
      </div>
      
      <!-- Acciones rápidas -->
      <div class="grid grid-cols-2 gap-3 pt-2">
        <BaseButton
          variant="secondary"
          @click="handleCreateAnother"
          class="w-full"
        >
          Crear otro rubro
        </BaseButton>
        <BaseButton
          variant="primary"
          @click="handleClose"
          class="w-full"
        >
          Cerrar
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/atoms/BaseModal.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

interface Props {
  rubroName: string
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'create-another'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = ref(!!props.open)

watch(() => props.open, (value) => {
  isOpen.value = value
})

const handleClose = () => {
  isOpen.value = false
  emit('update:open', false)
}

const handleCreateAnother = () => {
  isOpen.value = false
  emit('update:open', false)
  emit('create-another')
}
</script>
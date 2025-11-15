<template>
  <BaseModal
    :show="true"
    :title="title"
    @close="handleCancel"
  >
    <div class="confirm-modal">
      <div class="confirm-modal__content">
        <div class="confirm-modal__icon" :class="`confirm-modal__icon--${variant}`">
          <svg v-if="variant === 'danger'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else-if="variant === 'warning'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <p class="confirm-modal__message">{{ message }}</p>
      </div>
      
      <div class="confirm-modal__actions">
        <BaseButton
          variant="ghost"
          @click="handleCancel"
        >
          {{ cancelText }}
        </BaseButton>
        <BaseButton
          :variant="variant === 'danger' ? 'danger' : 'primary'"
          @click="handleConfirm"
          :loading="loading"
        >
          {{ confirmText }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'danger' | 'warning' | 'neutral'
  loading?: boolean
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'neutral',
  loading: false
})

const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.confirm-modal {
  @apply p-6;
}

.confirm-modal__content {
  @apply text-center mb-6;
}

.confirm-modal__icon {
  @apply mx-auto mb-4;
}

.confirm-modal__icon--danger {
  @apply text-red-500;
}

.confirm-modal__icon--warning {
  @apply text-yellow-500;
}

.confirm-modal__icon--primary {
  @apply text-blue-500;
}

.confirm-modal__icon--neutral {
  @apply text-gray-500;
}

.confirm-modal__message {
  @apply text-gray-700 dark:text-gray-300 text-lg;
}

.confirm-modal__actions {
  @apply flex justify-end gap-3;
}
</style>
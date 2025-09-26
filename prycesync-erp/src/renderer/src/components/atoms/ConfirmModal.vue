<template>
  <BaseModal
    v-model="isOpen"
    :title="title"
    size="sm"
    :closable="!loading"
    :close-on-overlay="!loading"
  >
    <div class="confirm-modal">
      <!-- Icon -->
      <div class="confirm-modal__icon">
        <div :class="[
          'confirm-modal__icon-container',
          `confirm-modal__icon-container--${variant}`
        ]">
          <svg v-if="variant === 'danger'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <svg v-else-if="variant === 'warning'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <!-- Content -->
      <div class="confirm-modal__content">
        <h4 class="confirm-modal__title">{{ title }}</h4>
        <p class="confirm-modal__message">{{ message }}</p>
        <div v-if="details" class="confirm-modal__details">
          {{ details }}
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton
        variant="ghost"
        :disabled="loading"
        @click="cancel"
      >
        {{ cancelText }}
      </BaseButton>
      <BaseButton
        :variant="confirmVariant"
        :loading="loading"
        @click="confirm"
      >
        {{ confirmText }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

interface Props {
  modelValue: boolean
  title: string
  message: string
  details?: string
  variant?: 'info' | 'warning' | 'danger'
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  loading: false
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const confirmVariant = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'danger'
    case 'warning':
      return 'secondary'
    default:
      return 'primary'
  }
})

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped>
.confirm-modal {
  @apply flex gap-4;
}

.confirm-modal__icon {
  @apply flex-shrink-0;
}

.confirm-modal__icon-container {
  @apply w-12 h-12 rounded-full flex items-center justify-center;
}

.confirm-modal__icon-container--info {
  @apply bg-blue-100 text-blue-600;
}

.confirm-modal__icon-container--warning {
  @apply bg-yellow-100 text-yellow-600;
}

.confirm-modal__icon-container--danger {
  @apply bg-red-100 text-red-600;
}

.confirm-modal__content {
  @apply flex-1;
}

.confirm-modal__title {
  @apply text-lg font-semibold text-gray-900 mb-2;
}

.confirm-modal__message {
  @apply text-gray-600 mb-3;
}

.confirm-modal__details {
  @apply text-sm text-gray-500 bg-gray-50 p-3 rounded-md border;
}
</style>
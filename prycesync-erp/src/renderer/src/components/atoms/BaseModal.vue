<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div
        v-if="modelValue"
        class="modal-overlay"
        @click="handleOverlayClick"
      >
        <div
          ref="containerRef"
          :class="[
            'modal-container',
            `modal-container--${size}`
          ]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          @keydown.tab.prevent.stop="handleKeydown"
          @click.stop
        >
          <!-- Header -->
          <div class="modal-header">
            <h3 :id="titleId" class="modal-title">
              <slot name="title">{{ title }}</slot>
            </h3>
            <button
              v-if="closable"
              class="modal-close"
              @click="close"
              aria-label="Cerrar modal"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="modal-content">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onUnmounted, ref, nextTick } from 'vue'
import { useId } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  closeOnOverlay?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  closeOnOverlay: true
})

const emit = defineEmits<Emits>()

const containerRef = ref<HTMLElement | null>(null)
const previouslyFocusedEl = ref<HTMLElement | null>(null)
const titleId = `modal-${useId()}-title`

const close = () => {
  emit('update:modelValue', false)
  emit('close')
  // Restaurar el foco al elemento previo si es posible
  const el = previouslyFocusedEl.value
  if (el && typeof el.focus === 'function') {
    el.focus()
  }
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close()
  }
}

// Prevent body scroll when modal is open
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    // Guardar foco actual y mover foco dentro del diálogo
    previouslyFocusedEl.value = (document.activeElement as HTMLElement) || null
    await nextTick()
    focusFirstElement()
    // Escuchar Escape mientras está abierto
    document.addEventListener('keydown', onEscapeGlobal)
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onEscapeGlobal)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onEscapeGlobal)
})

function onEscapeGlobal(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closable) {
    e.preventDefault()
    close()
  }
}

function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ]
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selectors.join(',')))
  // Solo elementos visibles
  return nodes.filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length))
}

function focusFirstElement() {
  const root = containerRef.value
  const focusables = getFocusableElements(root)
  if (focusables.length) {
    focusables[0].focus()
  } else if (root) {
    root.focus()
  }
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  /* Themed container using design tokens for light/dark */
  background: var(--ps-card);
  color: var(--ps-text-primary);
  border: var(--ps-border-width) solid var(--ps-border);
  border-radius: var(--ps-radius-lg);
  box-shadow: var(--ps-shadow-lg);
  @apply max-h-[90vh] overflow-hidden flex flex-col;
}

.modal-container--sm {
  @apply w-full max-w-md;
}

.modal-container--md {
  @apply w-full max-w-lg;
}

.modal-container--lg {
  @apply w-full max-w-2xl;
}

.modal-container--xl {
  @apply w-full max-w-4xl;
}

.modal-container--full {
  @apply w-full max-w-6xl h-full max-h-[95vh];
}

.modal-header {
  @apply flex items-center justify-between p-6;
  border-bottom: var(--ps-border-width) solid var(--ps-border);
}

.modal-title {
  @apply text-lg font-semibold;
  color: var(--ps-text-primary);
}

.modal-close {
  @apply transition-colors duration-200 p-1 rounded-md;
  color: var(--ps-text-secondary);
}
.modal-close:hover { 
  background: color-mix(in srgb, var(--ps-card) 92%, var(--ps-primary));
  color: var(--ps-text-primary);
}

.modal-content {
  @apply flex-1 overflow-y-auto p-6;
}

.modal-footer {
  @apply flex items-center justify-end gap-3 p-6;
  border-top: var(--ps-border-width) solid var(--ps-border);
  background: var(--ps-card);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(-20px);
}
</style>
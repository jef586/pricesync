<template>
  <div
    :class="[
      'base-card',
      `base-card--${variant}`,
      {
        'base-card--hoverable': hoverable,
        'base-card--clickable': clickable
      }
    ]"
    @click="handleClick"
  >
    <div v-if="$slots.header" class="base-card__header">
      <slot name="header" />
    </div>
    
    <div class="base-card__content">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'bordered' | 'elevated'
  hoverable?: boolean
  clickable?: boolean
}

interface Emits {
  (e: 'click', event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  hoverable: false,
  clickable: false
})

const emit = defineEmits<Emits>()

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style scoped>
.base-card {
  @apply bg-white rounded-lg overflow-hidden;
}

.base-card--default {
  @apply border border-gray-200;
}

.base-card--bordered {
  @apply border-2 border-gray-300;
}

.base-card--elevated {
  @apply shadow-lg border border-gray-100;
}

.base-card--hoverable {
  @apply transition-shadow duration-200 hover:shadow-md;
}

.base-card--clickable {
  @apply cursor-pointer transition-transform duration-200 hover:scale-[1.02];
}

.base-card__header {
  @apply px-6 py-4 border-b border-gray-200 bg-gray-50;
}

.base-card__content {
  @apply px-6 py-4;
}

.base-card__footer {
  @apply px-6 py-4 border-t border-gray-200 bg-gray-50;
}
</style>
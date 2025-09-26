<template>
  <div class="user-avatar" :class="avatarClasses">
    <span class="avatar-initials">{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  role?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const initials = computed(() => {
  if (!props.name) return ''
  return props.name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const avatarClasses = computed(() => [
  'user-avatar',
  `user-avatar--${props.size}`
])
</script>

<style scoped>
.user-avatar {
  @apply rounded-full flex items-center justify-center font-semibold;
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
}

.user-avatar--sm {
  @apply w-8 h-8 text-xs;
}

.user-avatar--md {
  @apply w-10 h-10 text-sm;
}

.user-avatar--lg {
  @apply w-12 h-12 text-base;
}

.avatar-initials {
  @apply select-none;
}
</style>
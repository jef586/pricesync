<template>
  <div class="base-spinner" :class="{ 'base-spinner--inline': inline }">
    <div class="base-spinner__circle"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  inline?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'white'
}

const props = withDefaults(defineProps<Props>(), {
  inline: false,
  size: 'md',
  color: 'primary'
})
</script>

<style scoped>
.base-spinner {
  @apply flex justify-center items-center;
}

.base-spinner--inline {
  @apply inline-flex;
}

.base-spinner__circle {
  @apply border-2 border-current border-t-transparent rounded-full animate-spin;
}

/* Sizes */
.base-spinner__circle {
  width: 1.25rem;
  height: 1.25rem;
  border-width: 2px;
}

.base-spinner__circle:where([data-size='sm']) {
  width: 1rem;
  height: 1rem;
  border-width: 1px;
}

.base-spinner__circle:where([data-size='lg']) {
  width: 2rem;
  height: 2rem;
  border-width: 3px;
}

/* Colors using design tokens */
.base-spinner {
  color: var(--ps-primary);
}

.base-spinner:where([data-color='secondary']) {
  color: var(--ps-text-secondary);
}

.base-spinner:where([data-color='white']) {
  color: white;
}

/* Apply data attributes based on props */
.base-spinner__circle {
  width: v-bind("size === 'sm' ? '1rem' : size === 'lg' ? '2rem' : '1.25rem'");
  height: v-bind("size === 'sm' ? '1rem' : size === 'lg' ? '2rem' : '1.25rem'");
  border-width: v-bind("size === 'sm' ? '1px' : size === 'lg' ? '3px' : '2px'");
}

.base-spinner {
  color: v-bind("color === 'secondary' ? 'var(--ps-text-secondary)' : color === 'white' ? 'white' : 'var(--ps-primary)'");
}
</style>
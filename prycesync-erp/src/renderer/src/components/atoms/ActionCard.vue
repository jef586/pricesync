<template>
  <component 
    :is="to ? 'router-link' : 'button'"
    :to="to"
    :disabled="disabled"
    class="action-card"
    @click="handleClick"
  >
    <div class="action-icon">
      <slot name="icon">
        <component :is="icon" v-if="icon" />
      </slot>
    </div>
    <div class="action-content">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
  </component>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  to?: string
  icon?: any
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  if (!props.disabled && !props.to) {
    emit('click')
  }
}
</script>

<style scoped>
.action-card {
  background: var(--ps-card);
  border-radius: var(--ps-radius-lg);
  padding: 1.5rem;
  box-shadow: var(--ps-shadow-sm);
  border: var(--ps-border-width) solid var(--ps-border);
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  cursor: pointer;
  width: 100%;
}

.action-card:hover:not(:disabled) { box-shadow: var(--ps-shadow-md); transform: translateY(-1px); border-color: var(--ps-primary); }

.action-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-icon {
  width: 48px;
  height: 48px;
  background: color-mix(in srgb, var(--ps-primary) 12%, transparent);
  border-radius: var(--ps-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ps-primary);
  flex-shrink: 0;
}

.action-icon svg {
  width: 24px;
  height: 24px;
}

.action-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ps-text-primary);
  margin: 0 0 0.25rem 0;
}

.action-content p {
  font-size: 0.875rem;
  color: var(--ps-text-secondary);
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .action-card {
    padding: 1rem;
  }
}
</style>
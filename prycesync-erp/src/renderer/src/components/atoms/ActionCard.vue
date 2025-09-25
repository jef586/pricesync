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
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  cursor: pointer;
  width: 100%;
}

.action-card:hover:not(:disabled) {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
  border-color: #3b82f6;
}

.action-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  flex-shrink: 0;
}

.action-icon svg {
  width: 24px;
  height: 24px;
}

.action-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.action-content p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .action-card {
    padding: 1rem;
  }
}
</style>
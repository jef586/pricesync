<template>
  <div class="stat-card">
    <div :class="['stat-icon', variant]">
      <slot name="icon">
        <component :is="icon" v-if="icon" />
      </slot>
    </div>
    <div class="stat-content">
      <div class="stat-value">{{ formattedValue }}</div>
      <div class="stat-label">{{ label }}</div>
      <div v-if="change !== undefined" :class="['stat-change', changeType]">
        {{ changeText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number | string
  label: string
  variant: 'invoices' | 'revenue' | 'pending' | 'products'
  change?: number
  icon?: any
  formatAsCurrency?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  formatAsCurrency: false
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  
  if (props.formatAsCurrency) {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(props.value)
  }
  
  return props.value.toLocaleString('es-ES')
})

const changeType = computed(() => {
  if (props.change === undefined) return 'neutral'
  if (props.change > 0) return 'positive'
  if (props.change < 0) return 'negative'
  return 'neutral'
})

const changeText = computed(() => {
  if (props.change === undefined) return ''
  const sign = props.change > 0 ? '+' : ''
  return `${sign}${props.change}% vs mes anterior`
})
</script>

<style scoped>
.stat-card {
  background: var(--ps-card);
  border-radius: var(--ps-radius-lg);
  padding: 1.5rem;
  box-shadow: var(--ps-shadow-sm);
  border: var(--ps-border-width) solid var(--ps-border);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: var(--ps-shadow-md);
  transform: translateY(-1px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--ps-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.invoices {
  background: color-mix(in srgb, var(--ps-primary) 20%, transparent);
  color: var(--ps-primary);
}

.stat-icon.revenue {
  background: color-mix(in srgb, var(--ps-success) 20%, transparent);
  color: var(--ps-success);
}

.stat-icon.pending {
  background: color-mix(in srgb, var(--ps-warning) 20%, transparent);
  color: var(--ps-warning);
}

.stat-icon.products {
  background: color-mix(in srgb, var(--ps-primary) 10%, transparent);
  color: var(--ps-primary);
}

.stat-content { flex: 1; }

.stat-value {
  font-size: 2rem;
  font-weight: var(--ps-weight-bold);
  color: var(--ps-text-primary);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--ps-text-secondary);
  font-weight: var(--ps-weight-medium);
  margin-bottom: 0.5rem;
}

.stat-change {
  font-size: 0.75rem;
  font-weight: var(--ps-weight-medium);
}

.stat-change.positive { color: var(--ps-success); }
.stat-change.negative { color: var(--ps-error); }
.stat-change.neutral { color: var(--ps-text-secondary); }

@media (max-width: 768px) {
  .stat-card { padding: 1rem; }
  .stat-value { font-size: 1.5rem; }
}
</style>
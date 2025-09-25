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
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
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
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.stat-icon.products {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.stat-change {
  font-size: 0.75rem;
  font-weight: 500;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.stat-change.neutral {
  color: #6b7280;
}

/* Responsive Design */
@media (max-width: 768px) {
  .stat-card {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
<template>
  <div class="stats-card" :class="cardClasses">
    <div class="stats-card-content">
      <div class="stats-card-icon" :class="iconClasses">
        <component :is="iconComponent" class="w-6 h-6" />
      </div>
      
      <div class="stats-card-info">
        <h3 class="stats-card-title">{{ title }}</h3>
        <p class="stats-card-value">{{ formattedValue }}</p>
        
        <div v-if="change !== undefined" class="stats-card-change" :class="changeClasses">
          <component :is="changeIcon" class="w-4 h-4" />
          <span>{{ Math.abs(change) }}%</span>
          <span class="text-xs">vs mes anterior</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CubeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/vue/24/outline'

interface Props {
  title: string
  value: number | string
  icon: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
  format?: 'number' | 'currency' | 'percentage'
  change?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  format: 'number'
})

// Icon mapping
const iconMap = {
  cube: CubeIcon,
  'exclamation-triangle': ExclamationTriangleIcon,
  'check-circle': CheckCircleIcon,
  'currency-dollar': CurrencyDollarIcon,
  'user-group': UserGroupIcon,
  'document-text': DocumentTextIcon,
  'chart-bar': ChartBarIcon
}

// Computed properties
const iconComponent = computed(() => {
  return iconMap[props.icon as keyof typeof iconMap] || CubeIcon
})

const cardClasses = computed(() => {
  const colorClasses = {
    blue: 'border-blue-300 dark:border-blue-800',
    green: 'border-green-300 dark:border-green-800',
    yellow: 'border-yellow-300 dark:border-yellow-800',
    red: 'border-red-300 dark:border-red-800',
    purple: 'border-purple-300 dark:border-purple-800',
    indigo: 'border-indigo-300 dark:border-indigo-800'
  }
  return colorClasses[props.color]
})

const iconClasses = computed(() => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
  }
  return colorClasses[props.color]
})

const formattedValue = computed(() => {
  // If value is a non-numeric string (e.g., 'Nunca', '28/07/2024'), show as-is
  if (typeof props.value === 'string') {
    const numeric = Number(props.value)
    if (!Number.isFinite(numeric)) {
      return props.value
    }
  }

  const numValue = typeof props.value === 'string' ? parseFloat(props.value) : props.value
  
  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(numValue)
    case 'percentage':
      return `${numValue}%`
    default:
      return new Intl.NumberFormat('es-ES').format(numValue)
  }
})

const changeClasses = computed(() => {
  if (props.change === undefined) return ''
  
  return props.change >= 0 
    ? 'text-green-600 dark:text-green-300' 
    : 'text-red-600 dark:text-red-300'
})

const changeIcon = computed(() => {
  if (props.change === undefined) return null
  
  return props.change >= 0 ? ArrowUpIcon : ArrowDownIcon
})
</script>

<style scoped>
.stats-card {
  background: var(--ps-card);
  border: var(--ps-border-width) solid var(--ps-border);
  border-radius: var(--ps-radius-lg);
  box-shadow: var(--ps-shadow-sm);
  transition: box-shadow 0.2s ease;
}

.stats-card-content {
  @apply p-6 flex items-start space-x-4;
}

.stats-card-icon {
  @apply flex-shrink-0 p-3 rounded-lg;
}

.stats-card-info {
  @apply flex-1 min-w-0;
}

.stats-card-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ps-text-secondary);
  margin-bottom: 0.25rem;
}

.stats-card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ps-text-primary);
  margin-bottom: 0.5rem;
}

.stats-card-change {
  @apply flex items-center space-x-1 text-sm font-medium;
}

@media (max-width: 640px) {
  .stats-card-content {
    @apply p-4 space-x-3;
  }
  
  .stats-card-icon {
    @apply p-2;
  }
  
  .stats-card-value {
    @apply text-xl;
  }
}
</style>

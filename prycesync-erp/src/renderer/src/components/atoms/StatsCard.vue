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
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    red: 'border-red-200 bg-red-50',
    purple: 'border-purple-200 bg-purple-50',
    indigo: 'border-indigo-200 bg-indigo-50'
  }
  
  return colorClasses[props.color]
})

const iconClasses = computed(() => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600'
  }
  
  return colorClasses[props.color]
})

const formattedValue = computed(() => {
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
    ? 'text-green-600' 
    : 'text-red-600'
})

const changeIcon = computed(() => {
  if (props.change === undefined) return null
  
  return props.change >= 0 ? ArrowUpIcon : ArrowDownIcon
})
</script>

<style scoped>
.stats-card {
  @apply bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200;
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
  @apply text-sm font-medium text-gray-600 mb-1;
}

.stats-card-value {
  @apply text-2xl font-bold text-gray-900 mb-2;
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
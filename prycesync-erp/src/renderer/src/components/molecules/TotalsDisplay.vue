<template>
  <div class="totals-display" :class="containerClasses">
    <!-- Header opcional -->
    <div v-if="title || $slots.header" class="totals-header mb-4">
      <slot name="header">
        <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
      </slot>
    </div>

    <!-- Líneas de totales -->
    <div class="totals-content space-y-2">
      <!-- Totales configurados via props -->
      <div
        v-for="total in processedTotals"
        :key="total.key"
        class="total-line flex justify-between items-center"
        :class="getTotalLineClasses(total)"
      >
        <div class="total-label flex items-center">
          <component 
            v-if="total.icon" 
            :is="total.icon" 
            class="w-4 h-4 mr-2 text-gray-500"
          />
          <span :class="getTotalLabelClasses(total)">{{ total.label }}</span>
          
          <!-- Tooltip o descripción -->
          <div 
            v-if="total.description" 
            class="ml-2 text-gray-400 cursor-help"
            :title="total.description"
          >
            <InformationCircleIcon class="w-4 h-4" />
          </div>
        </div>
        
        <div class="total-value" :class="getTotalValueClasses(total)">
          <slot 
            :name="`value-${total.key}`" 
            :total="total" 
            :formatted-value="formatValue(total.value, total)"
          >
            {{ formatValue(total.value, total) }}
          </slot>
        </div>
      </div>

      <!-- Slot para totales personalizados -->
      <slot name="custom-totals" />

      <!-- Separador antes del total final -->
      <div 
        v-if="showFinalSeparator && finalTotal" 
        class="border-t border-gray-300 my-3"
      ></div>

      <!-- Total final destacado -->
      <div 
        v-if="finalTotal"
        class="final-total flex justify-between items-center pt-2"
        :class="finalTotalClasses"
      >
        <div class="final-label flex items-center">
          <component 
            v-if="finalTotal.icon" 
            :is="finalTotal.icon" 
            class="w-5 h-5 mr-2"
          />
          <span class="text-lg font-semibold">{{ finalTotal.label }}</span>
        </div>
        
        <div class="final-value text-lg font-bold">
          <slot 
            name="final-value" 
            :total="finalTotal" 
            :formatted-value="formatValue(finalTotal.value, finalTotal)"
          >
            {{ formatValue(finalTotal.value, finalTotal) }}
          </slot>
        </div>
      </div>
    </div>

    <!-- Footer opcional -->
    <div v-if="$slots.footer" class="totals-footer mt-4 pt-4 border-t border-gray-200">
      <slot name="footer" />
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { InformationCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  // Configuración básica
  title: {
    type: String,
    default: ''
  },
  
  // Totales a mostrar
  totals: {
    type: Array,
    default: () => []
  },
  
  // Total final destacado
  finalTotal: {
    type: Object,
    default: null
  },
  
  // Configuración de formato
  currency: {
    type: String,
    default: 'USD'
  },
  locale: {
    type: String,
    default: 'es-ES'
  },
  
  // Configuración visual
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'card', 'compact', 'bordered'].includes(value)
  },
  
  // Configuración de separadores
  showFinalSeparator: {
    type: Boolean,
    default: true
  },
  
  // Estados
  loading: {
    type: Boolean,
    default: false
  },
  
  // Configuración de formato personalizado
  formatters: {
    type: Object,
    default: () => ({})
  },
  
  // Clases personalizadas
  customClasses: {
    type: Object,
    default: () => ({})
  }
})

// Computed
const containerClasses = computed(() => {
  const classes = ['totals-display', 'relative']
  
  switch (props.variant) {
    case 'card':
      classes.push('bg-white rounded-lg shadow-sm border border-gray-200 p-4')
      break
    case 'compact':
      classes.push('p-2')
      break
    case 'bordered':
      classes.push('border border-gray-200 rounded-md p-4')
      break
    default:
      classes.push('bg-gray-50 rounded-md p-4')
  }
  
  if (props.customClasses.container) {
    classes.push(props.customClasses.container)
  }
  
  return classes
})

const processedTotals = computed(() => {
  return props.totals.map(total => ({
    key: total.key || total.label?.toLowerCase().replace(/\s+/g, '-'),
    label: total.label,
    value: total.value,
    type: total.type || 'currency',
    variant: total.variant || 'default',
    icon: total.icon,
    description: total.description,
    formatter: total.formatter
  }))
})

const finalTotalClasses = computed(() => {
  const classes = ['border-t-2', 'border-gray-400']
  
  if (props.finalTotal?.variant === 'success') {
    classes.push('text-green-700', 'bg-green-50')
  } else if (props.finalTotal?.variant === 'warning') {
    classes.push('text-yellow-700', 'bg-yellow-50')
  } else if (props.finalTotal?.variant === 'error') {
    classes.push('text-red-700', 'bg-red-50')
  } else {
    classes.push('text-gray-900')
  }
  
  return classes
})

// Métodos
const getTotalLineClasses = (total) => {
  const classes = ['py-1']
  
  if (total.variant === 'subtle') {
    classes.push('text-gray-600')
  } else if (total.variant === 'highlight') {
    classes.push('bg-blue-50', 'px-2', 'rounded')
  }
  
  return classes
}

const getTotalLabelClasses = (total) => {
  const classes = []
  
  if (total.variant === 'bold') {
    classes.push('font-medium')
  } else if (total.variant === 'subtle') {
    classes.push('text-gray-600')
  }
  
  return classes
}

const getTotalValueClasses = (total) => {
  const classes = ['font-mono']
  
  if (total.variant === 'bold') {
    classes.push('font-semibold')
  } else if (total.variant === 'subtle') {
    classes.push('text-gray-600')
  }
  
  // Colores basados en el valor
  if (typeof total.value === 'number') {
    if (total.value < 0) {
      classes.push('text-red-600')
    } else if (total.value > 0 && total.type === 'currency') {
      classes.push('text-green-600')
    }
  }
  
  return classes
}

const formatValue = (value, total) => {
  // Usar formatter personalizado si existe
  if (total.formatter && typeof total.formatter === 'function') {
    return total.formatter(value)
  }
  
  // Usar formatter global si existe
  if (props.formatters[total.type]) {
    return props.formatters[total.type](value)
  }
  
  // Formatters por defecto
  switch (total.type) {
    case 'currency':
      return new Intl.NumberFormat(props.locale, {
        style: 'currency',
        currency: props.currency
      }).format(value || 0)
      
    case 'percentage':
      return new Intl.NumberFormat(props.locale, {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format((value || 0) / 100)
      
    case 'number':
      return new Intl.NumberFormat(props.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0)
      
    case 'integer':
      return new Intl.NumberFormat(props.locale, {
        maximumFractionDigits: 0
      }).format(value || 0)
      
    default:
      return value?.toString() || '0'
  }
}
</script>

<style scoped>
.totals-display {
  @apply min-w-0;
}

.total-line {
  @apply transition-colors duration-150;
}

.total-line:hover {
  @apply bg-gray-50 rounded px-2 -mx-2;
}

.final-total {
  @apply transition-all duration-200;
}

.font-mono {
  font-variant-numeric: tabular-nums;
}
</style>
<template>
  <div class="form-section" :class="sectionClasses">
    <!-- Header de la sección -->
    <div v-if="title || $slots.header" class="form-section-header" :class="headerClasses">
      <slot name="header">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <component 
              v-if="icon" 
              :is="icon" 
              class="w-5 h-5 mr-2 text-gray-600"
            />
            <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
          </div>
          
          <div v-if="$slots.actions" class="flex items-center space-x-2">
            <slot name="actions" />
          </div>
        </div>
      </slot>
      
      <p v-if="description" class="mt-1 text-sm text-gray-500">
        {{ description }}
      </p>
    </div>

    <!-- Contenido de la sección -->
    <div class="form-section-content" :class="contentClasses">
      <slot />
    </div>

    <!-- Footer de la sección -->
    <div v-if="$slots.footer" class="form-section-footer" :class="footerClasses">
      <slot name="footer" />
    </div>

    <!-- Indicador de error -->
    <div v-if="error" class="form-section-error mt-2">
      <div class="bg-red-50 border border-red-200 rounded-md p-3">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <p class="text-sm text-red-800">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicador de éxito -->
    <div v-if="success" class="form-section-success mt-2">
      <div class="bg-green-50 border border-green-200 rounded-md p-3">
        <div class="flex">
          <CheckCircleIcon class="h-5 w-5 text-green-400" />
          <div class="ml-3">
            <p class="text-sm text-green-800">{{ success }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  // Contenido de la sección
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: [String, Object],
    default: null
  },
  
  // Estados
  error: {
    type: String,
    default: ''
  },
  success: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  
  // Variantes de estilo
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'card', 'bordered', 'minimal'].includes(value)
  },
  
  // Espaciado
  spacing: {
    type: String,
    default: 'normal',
    validator: (value) => ['tight', 'normal', 'loose'].includes(value)
  },
  
  // Clases personalizadas
  customClasses: {
    type: Object,
    default: () => ({})
  },
  
  // Configuración de colapso
  collapsible: {
    type: Boolean,
    default: false
  },
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-collapse'])

// Computed classes
const sectionClasses = computed(() => {
  const classes = ['form-section']
  
  // Variantes
  switch (props.variant) {
    case 'card':
      classes.push('bg-white rounded-lg shadow-sm border border-gray-200')
      break
    case 'bordered':
      classes.push('border border-gray-200 rounded-md')
      break
    case 'minimal':
      classes.push('border-b border-gray-200 last:border-b-0')
      break
    default:
      classes.push('bg-gray-50 rounded-md')
  }
  
  // Espaciado
  switch (props.spacing) {
    case 'tight':
      classes.push('p-3')
      break
    case 'loose':
      classes.push('p-6')
      break
    default:
      classes.push('p-4')
  }
  
  // Estados
  if (props.disabled) {
    classes.push('opacity-50 pointer-events-none')
  }
  
  if (props.loading) {
    classes.push('relative')
  }
  
  // Clases personalizadas
  if (props.customClasses.section) {
    classes.push(props.customClasses.section)
  }
  
  return classes
})

const headerClasses = computed(() => {
  const classes = []
  
  if (props.collapsible) {
    classes.push('cursor-pointer select-none')
  }
  
  if (props.customClasses.header) {
    classes.push(props.customClasses.header)
  }
  
  return classes
})

const contentClasses = computed(() => {
  const classes = []
  
  if (props.title || props.$slots.header) {
    classes.push('mt-4')
  }
  
  if (props.collapsed) {
    classes.push('hidden')
  }
  
  if (props.customClasses.content) {
    classes.push(props.customClasses.content)
  }
  
  return classes
})

const footerClasses = computed(() => {
  const classes = ['mt-4', 'pt-4', 'border-t', 'border-gray-200']
  
  if (props.customClasses.footer) {
    classes.push(props.customClasses.footer)
  }
  
  return classes
})

// Métodos
const toggleCollapse = () => {
  if (props.collapsible) {
    emit('toggle-collapse', !props.collapsed)
  }
}
</script>

<style scoped>
.form-section {
  @apply relative;
}

.form-section.loading::after {
  content: '';
  @apply absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' stroke='currentColor' stroke-width='4' class='opacity-25'%3E%3C/circle%3E%3Cpath fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' class='opacity-75'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 24px 24px;
}

.form-section-header:hover {
  @apply transition-colors duration-200;
}

.form-section-content {
  @apply transition-all duration-300 ease-in-out;
}
</style>
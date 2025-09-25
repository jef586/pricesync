<template>
  <div class="activity-item">
    <div class="activity-icon">
      <slot name="icon">
        <component :is="icon" v-if="icon" />
      </slot>
    </div>
    <div class="activity-content">
      <div class="activity-title">{{ title }}</div>
      <div class="activity-description">{{ description }}</div>
      <div class="activity-time">{{ formattedTime }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  description: string
  time: string | Date
  icon?: any
}

const props = defineProps<Props>()

const formattedTime = computed(() => {
  if (typeof props.time === 'string') {
    return props.time
  }
  
  // Si es una fecha, formatearla relativamente
  const now = new Date()
  const diff = now.getTime() - props.time.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return 'Ahora mismo'
  if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
  if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`
  
  return props.time.toLocaleDateString('es-ES')
})
</script>

<style scoped>
.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}

.activity-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  flex-shrink: 0;
}

.activity-icon svg {
  width: 20px;
  height: 20px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.activity-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.activity-time {
  font-size: 0.75rem;
  color: #9ca3af;
}
</style>
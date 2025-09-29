<template>
  <Teleport to="body">
    <div class="notification-container">
      <TransitionGroup
        name="notification"
        tag="div"
        class="space-y-3"
      >
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="getNotificationClasses(notification.type)"
          class="notification-item"
        >
          <div class="flex items-start">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <component :is="getIcon(notification.type)" class="w-5 h-5" />
            </div>
            
            <!-- Content -->
            <div class="ml-3 flex-1">
              <h4 class="notification-title">
                {{ notification.title }}
              </h4>
              <p v-if="notification.message" class="notification-message">
                {{ notification.message }}
              </p>
            </div>
            
            <!-- Close button -->
            <div class="ml-4 flex-shrink-0">
              <button
                @click="removeNotification(notification.id)"
                class="notification-close-btn"
              >
                <span class="sr-only">Cerrar</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotifications, type Notification } from '@/composables/useNotifications'

// Composables
const { notifications, removeNotification } = useNotifications()

// Computed
const getNotificationClasses = (type: Notification['type']) => {
  const baseClasses = 'notification-base'
  
  const typeClasses = {
    success: 'notification-success',
    error: 'notification-error',
    warning: 'notification-warning',
    info: 'notification-info'
  }
  
  return `${baseClasses} ${typeClasses[type]}`
}

const getIcon = (type: Notification['type']) => {
  const icons = {
    success: 'CheckCircleIcon',
    error: 'XCircleIcon',
    warning: 'ExclamationTriangleIcon',
    info: 'InformationCircleIcon'
  }
  
  return icons[type]
}

// Icon components (inline SVG)
const CheckCircleIcon = {
  template: `
    <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `
}

const XCircleIcon = {
  template: `
    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `
}

const ExclamationTriangleIcon = {
  template: `
    <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  `
}

const InformationCircleIcon = {
  template: `
    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `
}
</script>

<style scoped>
.notification-container {
  @apply fixed top-4 right-4 z-50 max-w-sm w-full space-y-3;
}

.notification-base {
  @apply max-w-sm w-full bg-white shadow-lg rounded-lg p-4 border-l-4;
}

.notification-success {
  @apply border-green-400 bg-green-50;
}

.notification-error {
  @apply border-red-400 bg-red-50;
}

.notification-warning {
  @apply border-yellow-400 bg-yellow-50;
}

.notification-info {
  @apply border-blue-400 bg-blue-50;
}

.notification-title {
  @apply text-sm font-medium text-gray-900;
}

.notification-message {
  @apply mt-1 text-sm text-gray-600;
}

.notification-close-btn {
  @apply inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150;
}

/* Transiciones */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
import { ref, reactive } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

// Estado global de notificaciones
const notifications = ref<Notification[]>([])

export function useNotifications() {
  // Generar ID único para notificaciones
  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Agregar notificación
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      id: generateId(),
      duration: 5000, // 5 segundos por defecto
      persistent: false,
      ...notification
    }

    notifications.value.push(newNotification)

    // Auto-remover después del tiempo especificado (si no es persistente)
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, newNotification.duration)
    }

    return newNotification.id
  }

  // Remover notificación
  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  // Limpiar todas las notificaciones
  const clearNotifications = () => {
    notifications.value = []
  }

  // Métodos de conveniencia
  const success = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options
    })
  }

  const error = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 8000, // Errores duran más tiempo
      ...options
    })
  }

  const warning = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...options
    })
  }

  const info = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  return {
    notifications: notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    success,
    error,
    warning,
    info
  }
}
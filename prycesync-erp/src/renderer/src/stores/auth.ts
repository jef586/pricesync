import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  email: string
  name: string
  role: string
  status: string
  company: {
    id: string
    name: string
    taxId: string
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  confirmPassword: string
  companyId: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role || null)

  // Actions
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error en el login')
      }

      const data = await response.json()
      
      // Guardar token y usuario según la estructura de respuesta de la API
      const accessToken = data.data.tokens.accessToken
      const userData = data.data.user
      
      token.value = accessToken
      user.value = userData
      localStorage.setItem('token', accessToken)
      localStorage.setItem('user', JSON.stringify(userData))

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
          role: 'admin',
          companyId: credentials.companyId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error en el registro')
      }

      const data = await response.json()
      
      // Guardar token y usuario según la estructura de respuesta de la API
      const accessToken = data.data.tokens.accessToken
      const userData = data.data.user
      
      token.value = accessToken
      user.value = userData
      localStorage.setItem('token', accessToken)
      localStorage.setItem('user', JSON.stringify(userData))

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const getCurrentUser = async () => {
    if (!token.value) {
      return { success: false, error: 'No token available' }
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('http://localhost:3002/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token inválido o expirado
          logout()
          throw new Error('Sesión expirada')
        }
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al obtener usuario')
      }

      const data = await response.json()
      user.value = data.data.user

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    if (token.value) {
      try {
        await fetch('http://localhost:3002/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`,
          },
        })
      } catch (err) {
        // Ignorar errores de logout en el servidor
        console.warn('Error during logout:', err)
      }
    }

    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const initializeAuth = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
      } catch (err) {
        // Si hay error al parsear, limpiar localStorage
        logout()
      }
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    userRole,
    // Actions
    login,
    register,
    logout,
    getCurrentUser,
    initializeAuth,
    clearError,
  }
})
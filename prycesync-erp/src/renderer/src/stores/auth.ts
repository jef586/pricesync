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
  const isAuthenticated = computed(() => {
    const result = !!token.value && !!user.value
    console.log('🔐 isAuthenticated check:', {
      hasToken: !!token.value,
      hasUser: !!user.value,
      result,
      token: token.value ? `${token.value.substring(0, 20)}...` : null,
      user: user.value ? user.value.email : null
    })
    return result
  })
  const userRole = computed(() => user.value?.role || null)

  // Basic permission helpers
  const isAdmin = computed(() => ['SUPERADMIN','ADMIN','admin'].includes(String(userRole.value)))
  const hasRole = (role: string) => userRole.value === role
  const hasAnyRole = (roles: string[]) => roles.includes(String(userRole.value))

  // Scopes por rol (alineado con backend y compatible con legado)
  const ROLE_SCOPES: Record<string, Set<string>> = {
    // Legado
    admin: new Set([
      'article:read', 'article:write', 'stock:read', 'stock:write', 'stock:override', 'stock:kardex', 'stock:export',
      'imports:read', 'imports:write', 'purchases:resolve',
      'admin:users', 'admin:roles'
    ]),
    manager: new Set([
      'article:read', 'article:write', 'stock:read', 'stock:write', 'stock:kardex', 'stock:export',
      'imports:read', 'imports:write', 'purchases:resolve'
    ]),
    user: new Set(['article:read', 'stock:read', 'stock:kardex', 'imports:read', 'purchases:resolve']),
    viewer: new Set(['article:read', 'stock:read', 'stock:kardex', 'imports:read', 'purchases:resolve']),

    // Nuevo RBAC
    SUPERADMIN: new Set([
      'article:read', 'article:write', 'stock:read', 'stock:write', 'stock:override', 'stock:kardex', 'stock:export',
      'imports:read', 'imports:write', 'purchases:resolve',
      'admin:users', 'admin:roles'
    ]),
    ADMIN: new Set([
      'article:read', 'article:write', 'stock:read', 'stock:write', 'stock:kardex', 'stock:export',
      'imports:read', 'imports:write', 'purchases:resolve',
      'admin:users', 'admin:roles'
    ]),
    SUPERVISOR: new Set([
      'article:read', 'article:write', 'stock:read', 'stock:kardex', 'stock:export',
      'imports:read', 'imports:write', 'purchases:resolve'
    ]),
    SELLER: new Set([
      // Ventas básicas; las rutas actualmente no usan requiresScope, pero conservamos coherencia
      'sales:create'
    ]),
    TECHNICIAN: new Set([
      'config:view'
    ])
  }

  const hasScope = (scope: string): boolean => {
    const role = userRole.value || 'viewer'
    const scopes = ROLE_SCOPES[role] || new Set()
    return scopes.has(scope)
  }

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
    console.log('🚀 Initializing auth...')
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    console.log('📦 Stored data:', {
      hasStoredToken: !!storedToken,
      hasStoredUser: !!storedUser,
      storedToken: storedToken ? `${storedToken.substring(0, 20)}...` : null,
      storedUser: storedUser ? JSON.parse(storedUser).email : null
    })

    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        console.log('✅ Auth initialized successfully')
      } catch (err) {
        console.error('❌ Error parsing stored user data:', err)
        // Si hay error al parsear, limpiar localStorage
        logout()
      }
    } else {
      console.log('⚠️ No stored auth data found')
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
    isAdmin,
    // Actions
    login,
    register,
    logout,
    getCurrentUser,
    initializeAuth,
    clearError,
    // Helpers
    hasRole,
    hasAnyRole,
    hasScope,
  }
})
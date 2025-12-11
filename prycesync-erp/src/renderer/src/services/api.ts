import axios from 'axios';

// API Base URL (compatible con Docker y Vite)
const rawBase = (import.meta as any)?.env?.VITE_API_URL || (import.meta as any)?.env?.API_URL || 'http://localhost:3002'
const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    try {
      const rid = (response.headers?.['x-request-id'] || response.headers?.['X-Request-Id']) as any
      // stash for debugging
      ;(response as any).__requestId = rid
    } catch {}
    return response
  },
  (error) => {
    try {
      const hdrs = error?.response?.headers || {}
      const rid = hdrs['x-request-id'] || hdrs['X-Request-Id']
      ;(error as any).requestId = rid
    } catch {}
    console.log('🚨 API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      console.log('🚨 401 Unauthorized - redirecting to /auth');
      // Handle unauthorized - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

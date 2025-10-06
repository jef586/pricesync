<template>
  <DashboardLayout>
    <div class="dashboard-overview">
      <!-- Estado de carga -->
      <div v-if="loading" class="flex justify-center items-center py-12 mb-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Cargando datos del dashboard...</span>
      </div>

      <!-- Estado de error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex items-center">
          <div class="text-red-400 mr-3">⚠️</div>
          <div>
            <h3 class="text-red-800 font-medium">Error al cargar datos</h3>
            <p class="text-red-600 text-sm mt-1">{{ error }}</p>
            <button 
              @click="loadDashboardData" 
              class="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>

      

      <div v-else>
        <!-- Acciones Rápidas (moved inside v-else para mantener adyacencia) -->
        <div class="quick-actions">
          <h2 class="section-title">Acciones Rápidas</h2>
          <div class="actions-grid">
            <ActionCard
              title="Nueva Factura"
              description="Crear una nueva factura para un cliente"
              to="/invoices/new"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </template>
            </ActionCard>

            <ActionCard
              title="Ver Facturas"
              description="Gestionar todas las facturas existentes"
              to="/invoices"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 11H15M9 15H15M17 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H12.586C12.8512 3.00006 13.1055 3.10545 13.293 3.293L18.707 8.707C18.8946 8.89449 18.9999 9.14881 19 9.414V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </template>
            </ActionCard>

            <ActionCard
              title="Inventario"
              description="Controlar stock y productos"
              to="/inventory"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 11V7C16 5.93913 15.5786 4.92172 14.8284 4.17157C14.0783 3.42143 13.0609 3 12 3C10.9391 3 9.92172 3.42143 9.17157 4.17157C8.42143 4.92172 8 5.93913 8 7V11M5 9H19L18 21H6L5 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </template>
            </ActionCard>

            <ActionCard
              title="Configuración"
              description="Ajustar configuración de la empresa"
              to="/company"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.325 4.317C10.751 2.561 13.249 2.561 13.675 4.317C13.7389 4.5808 13.8642 4.82578 14.0407 5.032C14.2172 5.23822 14.4399 5.39985 14.6907 5.50375C14.9414 5.60764 15.2132 5.65085 15.4838 5.62987C15.7544 5.60889 16.0162 5.5243 16.248 5.383C17.791 4.443 19.558 6.209 18.618 7.753C18.4769 7.98466 18.3924 8.24634 18.3715 8.51677C18.3506 8.78721 18.3938 9.05877 18.4975 9.30938C18.6013 9.55999 18.7627 9.78258 18.9687 9.95905C19.1747 10.1355 19.4194 10.2609 19.683 10.325C21.439 10.751 21.439 13.249 19.683 13.675C19.4192 13.7389 19.1742 13.8642 18.968 14.0407C18.7618 14.2172 18.6001 14.4399 18.4963 14.6907C18.3924 14.9414 18.3491 15.2132 18.3701 15.4838C18.3911 15.7544 18.4757 16.0162 18.617 16.248C19.557 17.791 17.791 19.558 16.247 18.618C16.0153 18.4769 15.7537 18.3924 15.4832 18.3715C15.2128 18.3506 14.9412 18.3938 14.6906 18.4975C14.44 18.6013 14.2174 18.7627 14.0409 18.9687C13.8645 19.1747 13.7391 19.4194 13.675 19.683C13.249 21.439 10.751 21.439 10.325 19.683C10.2611 19.4192 10.1358 19.1742 9.95929 18.968C9.7828 18.7618 9.56011 18.6001 9.30935 18.4963C9.05859 18.3924 8.78683 18.3491 8.51621 18.3701C8.24559 18.3911 7.98375 18.4757 7.752 18.617C6.209 19.557 4.442 17.791 5.382 16.247C5.5231 16.0153 5.60755 15.7537 5.62848 15.4832C5.64942 15.2128 5.60624 14.9412 5.50247 14.6906C5.3987 14.44 5.23726 14.2174 5.03127 14.0409C4.82529 13.8645 4.58056 13.7391 4.317 13.675C2.561 13.249 2.561 10.751 4.317 10.325C4.5808 10.2611 4.82578 10.1358 5.032 9.95929C5.23822 9.7828 5.39985 9.56011 5.50375 9.30935C5.60764 9.05859 5.65085 8.78683 5.62987 8.51621C5.60889 8.24559 5.5243 7.98375 5.383 7.752C4.443 6.209 6.209 4.442 7.753 5.382C7.98466 5.5231 8.24634 5.60755 8.51677 5.62848C8.78721 5.64942 9.05877 5.60624 9.30938 5.50247C9.55999 5.3987 9.78258 5.23726 9.95905 5.03127C10.1355 4.82529 10.2609 4.58056 10.325 4.317Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
              </template>
            </ActionCard>
          </div>
        </div>
        <!-- Stats Cards -->
        <div class="stats-grid">
        <StatCard
          :value="stats.totalInvoices"
          label="Total Facturas"
          variant="invoices"
        >
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
        </StatCard>

        <StatCard
          :value="stats.totalRevenue"
          label="Ingresos Totales"
          variant="revenue"
          :format-as-currency="true"
        >
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M17 5H9.5C8.57 5 7.68 5.37 7.03 6.03C6.37 6.68 6 7.57 6 8.5C6 9.43 6.37 10.32 7.03 10.97C7.68 11.63 8.57 12 9.5 12H14.5C15.43 12 16.32 12.37 16.97 13.03C17.63 13.68 18 14.57 18 15.5C18 16.43 17.63 17.32 16.97 17.97C16.32 18.63 15.43 19 14.5 19H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
        </StatCard>

        <StatCard
          :value="stats.pendingInvoices"
          label="Facturas Pendientes"
          variant="pending"
        >
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
        </StatCard>

        <StatCard
          :value="stats.totalCustomers"
          label="Total Clientes"
          variant="customers"
        >
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 = 17.9391 4 = 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 = 4.79086 16 = 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
        </StatCard>
        </div>

      <!-- Gráficos y Analytics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Gráfico de Ingresos -->
        <RevenueChart
          :loading="loading"
          :error="error"
          :data="revenueChartData"
          :summary="revenueSummary"
          :selected-period="selectedPeriod"
          @period-change="handlePeriodChange"
          @retry="loadDashboardData"
        />

        <!-- Gráfico de Estado de Facturas -->
        <InvoiceStatusChart
          :loading="loading"
          :error="error"
          :data="invoiceStatusData"
          @retry="loadDashboardData"
        />
      </div>

      

      <!-- Recent Activity -->
      <div class="recent-activity">
        <h2 class="section-title">Actividad Reciente</h2>
        <div class="activity-list">
          <ActivityItem
            v-for="(activity, index) in recentActivity"
            :key="index"
            :title="activity.title"
            :description="activity.description"
            :time="activity.time"
          >
            <template #icon>
              <div v-html="getActivityIcon(activity.type)"></div>
            </template>
          </ActivityItem>
        </div>
      </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import DashboardLayout from '../components/organisms/DashboardLayout.vue'
import StatCard from '../components/atoms/StatCard.vue'
import ActionCard from '../components/atoms/ActionCard.vue'
import ActivityItem from '../components/atoms/ActivityItem.vue'
import RevenueChart from '../components/molecules/RevenueChart.vue'
import InvoiceStatusChart from '../components/molecules/InvoiceStatusChart.vue'
import reportsService, { type DashboardMetrics } from '../services/reportsService'

const authStore = useAuthStore()

// Estado de carga y datos
const loading = ref(true)
const error = ref<string | null>(null)
const dashboardData = ref<DashboardMetrics | null>(null)
const selectedPeriod = ref('month')

// Stats computadas desde los datos reales
const stats = computed(() => {
  if (!dashboardData.value) {
    return {
      totalInvoices: 0,
      totalRevenue: 0,
      pendingInvoices: 0,
      totalProducts: 0,
      totalCustomers: 0,
      averageInvoiceValue: 0,
      conversionRate: 0
    }
  }

  return {
    totalInvoices: dashboardData.value.totalInvoices,
    totalRevenue: dashboardData.value.totalRevenue,
    pendingInvoices: dashboardData.value.pendingInvoices,
    totalProducts: dashboardData.value.totalProducts,
    totalCustomers: dashboardData.value.totalCustomers,
    averageInvoiceValue: dashboardData.value.averageInvoiceValue,
    conversionRate: dashboardData.value.conversionRate
  }
})

// Datos para el gráfico de ingresos
const revenueChartData = computed(() => {
  if (!dashboardData.value?.revenueChart) return null

  const chart = dashboardData.value.revenueChart
  return {
    labels: chart.labels,
    datasets: [{
      label: 'Ingresos',
      data: chart.data,
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  }
})

// Resumen de ingresos
const revenueSummary = computed(() => {
  if (!dashboardData.value?.revenueChart) return null

  const data = dashboardData.value.revenueChart.data
  const total = data.reduce((sum, value) => sum + value, 0)
  const average = data.length > 0 ? total / data.length : 0
  const peak = Math.max(...data)
  
  // Calcular crecimiento (comparar último vs primer valor)
  const growth = data.length >= 2 
    ? ((data[data.length - 1] - data[0]) / data[0]) * 100 
    : 0

  return {
    total,
    average,
    growth,
    peak
  }
})

// Datos para el gráfico de estado de facturas
const invoiceStatusData = computed(() => {
  if (!dashboardData.value?.invoiceStatusChart) return null

  // Convertir array de objetos a objeto con formato { [status]: count }
  const statusData: { [key: string]: number } = {}
  
  dashboardData.value.invoiceStatusChart.forEach(item => {
    statusData[item.status] = item.count
  })

  return statusData
})

// Actividad reciente computada desde facturas recientes
const recentActivity = computed(() => {
  if (!dashboardData.value?.recentInvoices) {
    return [
      {
        title: "Sistema inicializado correctamente",
        description: "Base de datos configurada y datos de prueba creados",
        time: "Hace 5 minutos",
        type: "system"
      },
      {
        title: `Empresa '${authStore.user?.company?.name}' configurada`,
        description: "Datos de empresa listos para facturación",
        time: "Hace 10 minutos",
        type: "company"
      },
      {
        title: "Usuario administrador creado",
        description: "Acceso completo al sistema configurado",
        time: "Hace 15 minutos",
        type: "user"
      }
    ]
  }

  // Convertir facturas recientes en actividad
  const invoiceActivity = dashboardData.value.recentInvoices.map(invoice => ({
    title: `Factura ${invoice.number} ${getStatusLabel(invoice.status)}`,
    description: `Cliente: ${invoice.customer.name} - ${reportsService.formatCurrency(invoice.total)}`,
    time: formatRelativeTime(invoice.createdAt),
    type: "invoice"
  }))

  return invoiceActivity
})

// Cargar datos del dashboard
const loadDashboardData = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Obtener métricas del período seleccionado
    const dateRange = reportsService.getDateRange(selectedPeriod.value)
    dashboardData.value = await reportsService.getDashboardMetrics(dateRange)
    
  } catch (err) {
    console.error('Error loading dashboard data:', err)
    error.value = 'Error al cargar los datos del dashboard'
  } finally {
    loading.value = false
  }
}

// Manejar cambio de período
const handlePeriodChange = async (period: string) => {
  selectedPeriod.value = period
  await loadDashboardData()
}

// Métodos auxiliares
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'DRAFT': 'en borrador',
    'PENDING': 'pendiente',
    'PAID': 'pagada',
    'CANCELLED': 'cancelada',
    'OVERDUE': 'vencida'
  }
  return labels[status] || status.toLowerCase()
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'DRAFT': '#6B7280',     // Gray
    'PENDING': '#F59E0B',   // Amber
    'PAID': '#10B981',      // Emerald
    'CANCELLED': '#EF4444', // Red
    'OVERDUE': '#DC2626'    // Dark Red
  }
  return colors[status] || '#6B7280'
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Hace un momento'
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
  
  return date.toLocaleDateString('es-AR')
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'invoice':
      return `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
    case 'company':
      return `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21L12 17L16 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
    case 'user':
      return `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
    default:
      return `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard-overview {
  max-width: 1200px;
  margin: 0 auto;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

/* Section Titles */
.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

/* Quick Actions title: default color for light mode; override in app dark mode */
.dark .quick-actions .section-title {
  color: #f9fafb; /* near-white for strong contrast on dark backgrounds */
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 3rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Recent Activity */
.recent-activity {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .actions-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .section-title {
    font-size: 1.25rem;
  }
}
</style>
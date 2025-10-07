<template>
  <DashboardLayout>
    <div class="dashboard space-y-6 bg-gray-50 dark:bg-[#0C1322] p-4 sm:p-6">
      <!-- Encabezado -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p class="text-sm text-gray-600 dark:text-[#9CA3AF]">Resumen accionable de PryceSync ERP</p>
        </div>
        <div class="hidden sm:flex items-center gap-2 text-xs text-gray-500">
          <span>Última actualización: {{ lastUpdate }}</span>
        </div>
      </div>

      <!-- Acciones rápidas (tarjetas debajo del título) -->
      <div class="space-y-3">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white">Acciones rápidas</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <button class="card flex items-center gap-3 hover:shadow-md transition" @click="goTo('/sales/new')">
            <DocumentTextIcon class="h-6 w-6 text-[#3B82F6]" />
            <div>
              <div class="font-semibold text-gray-900 dark:text-white">Nueva Venta</div>
              <div class="text-xs text-gray-500 dark:text-[#9CA3AF]">Crear una venta para cliente</div>
            </div>
          </button>
          <button class="card flex items-center gap-3 hover:shadow-md transition" @click="goTo('/company/pricing')">
            <BoltIcon class="h-6 w-6 text-[#3B82F6]" />
            <div>
              <div class="font-semibold text-gray-900 dark:text-white">Analizar Precios</div>
              <div class="text-xs text-gray-500 dark:text-[#9CA3AF]">Ejecutar IA de pricing</div>
            </div>
          </button>
          <button class="card flex items-center gap-3 hover:shadow-md transition" @click="goTo('/inventory')">
            <CubeIcon class="h-6 w-6 text-[#10B981]" />
            <div>
              <div class="font-semibold text-gray-900 dark:text-white">Cargar Stock</div>
              <div class="text-xs text-gray-500 dark:text-[#9CA3AF]">Actualizar inventario y productos</div>
            </div>
          </button>
          <button class="card flex items-center gap-3 hover:shadow-md transition" @click="goTo('/invoices')">
            <ChartBarIcon class="h-6 w-6 text-[#3B82F6]" />
            <div>
              <div class="font-semibold text-gray-900 dark:text-white">Ver Reportes</div>
              <div class="text-xs text-gray-500 dark:text-[#9CA3AF]">Revisar KPIs y rendimiento</div>
            </div>
          </button>
        </div>
      </div>

      <!-- TOP ROW - 4 Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <!-- Ventas Hoy -->
        <div class="card hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <CurrencyDollarIcon class="h-6 w-6 text-green-600" />
              <div>
                <div class="text-sm text-gray-500 dark:text-gray-400">💰 Ventas Hoy</div>
                <div class="text-2xl font-semibold text-gray-900 dark:text-white">${{ formatNumber(metrics.salesToday) }}</div>
              </div>
            </div>
            <span class="text-xs font-medium text-green-600 dark:text-green-400">+{{ metrics.salesVsYesterday }}% vs ayer</span>
          </div>
          <div class="mt-2 text-xs text-gray-500 dark:text-[#9CA3AF]">{{ metrics.invoicesToday }} facturas</div>
        </div>

        <!-- IA en Uso -->
        <div class="card hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <BoltIcon class="h-6 w-6 text-indigo-600" />
              <div>
                <div class="text-sm text-gray-500 dark:text-gray-400">🤖 IA en Uso</div>
                <div class="text-2xl font-semibold text-gray-900 dark:text-white">{{ metrics.aiUsage }}% activo</div>
              </div>
            </div>
            <span class="text-xs font-medium text-[#3B82F6]">{{ metrics.aiAnalyses }} análisis</span>
          </div>
          <div class="mt-2 text-xs text-gray-500 dark:text-[#9CA3AF]">${{ formatNumber(metrics.aiValue) }} en IA</div>
        </div>

        <!-- Alertas Críticas -->
        <div class="card hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <ExclamationTriangleIcon class="h-6 w-6 text-red-600" />
              <div>
                <div class="text-sm text-gray-500 dark:text-gray-400">⚠️ Alertas</div>
                <div class="text-2xl font-semibold text-gray-900 dark:text-white">{{ metrics.criticalAlerts }} críticas</div>
              </div>
            </div>
            <span class="text-xs font-medium text-gray-500 dark:text-[#9CA3AF]">{{ metrics.lowStock }} stock bajo</span>
          </div>
          <div class="mt-2 text-xs text-gray-500 dark:text-[#9CA3AF]">{{ metrics.priceIssues }} precios desactualizados</div>
        </div>

        <!-- Margen Promedio -->
        <div class="card hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <ChartBarIcon class="h-6 w-6 text-blue-600" />
              <div>
                <div class="text-sm text-gray-500 dark:text-gray-400">📈 Margen Prom</div>
                <div class="text-2xl font-semibold text-gray-900 dark:text-white">{{ metrics.avgMargin }}%</div>
              </div>
            </div>
            <span class="text-xs font-medium text-[#9CA3AF]">Target: {{ metrics.marginTarget }}%</span>
          </div>
          <div class="mt-2 text-xs" :class="metrics.marginDelta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ metrics.marginDelta >= 0 ? '+' : '' }}{{ metrics.marginDelta }}% vs mes</div>
          <div class="mt-3">
            <div class="h-2 w-full bg-[#0C1322] rounded-full overflow-hidden">
              <div class="h-2 bg-[#3B82F6]" :style="{ width: marginProgress + '%' }"></div>
            </div>
            <div class="mt-1 flex justify-between text-[11px] text-gray-500 dark:text-[#9CA3AF]">
              <span>Target: {{ metrics.marginTarget }}%</span>
              <span>{{ metrics.avgMargin }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT - Tabla Análisis IA -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">🤖 Análisis IA Recientes - Oportunidades de Pricing</h2>
            <p class="text-sm text-gray-600 dark:text-[#9CA3AF]">Comparativa con mercado y sugerencias accionables</p>
          </div>
          <button class="text-sm text-[#3B82F6] hover:underline" @click="viewAllAnalyses">Ver todos</button>
        </div>

        <div class="overflow-x-auto -mx-4 sm:mx-0">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr class="text-left text-xs text-gray-500 dark:text-gray-400">
                <th class="py-2 pr-4">Producto</th>
                <th class="py-2 pr-4">Tu $</th>
                <th class="py-2 pr-4">ML Comp</th>
                <th class="py-2 pr-4">Sugerido</th>
                <th class="py-2 pr-4">Δ%</th>
                <th class="py-2 pr-4">Confianza</th>
                <th class="py-2 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="(row, idx) in aiTable" :key="idx" :class="[row.opportunity ? 'bg-green-50 dark:bg-green-900/10' : '', row.underMarket ? 'bg-red-50 dark:bg-red-900/10' : '']">
                <td class="py-3 pr-4">
                  <div class="font-medium text-gray-900 dark:text-white">{{ row.product }}</div>
                  <div class="text-xs text-gray-500 dark:text-[#9CA3AF]">{{ row.brand }}</div>
                </td>
                <td class="py-3 pr-4 font-mono">${{ formatNumber(row.currentPrice) }}</td>
                <td class="py-3 pr-4">
                  <div class="font-mono">${{ row.marketRange }}</div>
                  <div class="text-xs text-gray-500 dark:text-[#9CA3AF]">{{ row.competitors }} comp.</div>
                </td>
                <td class="py-3 pr-4 font-mono">${{ formatNumber(row.suggestedPrice) }}</td>
                <td class="py-3 pr-4">
                  <span :class="row.delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-mono">{{ row.delta >= 0 ? '+' : '' }}{{ row.delta.toFixed(1) }}%</span>
                </td>
                <td class="py-3 pr-4">
                  <span :class="confidenceClass(row.confidence)" class="text-xs font-medium px-2 py-1 rounded">
                    {{ row.confidence }}
                  </span>
                </td>
                <td class="py-3 pr-4">
                  <button class="btn-primary" @click="applySuggestion(row)">Aplicar</button>
                  <button class="btn-light ml-2" @click="viewDetail(row)">Ver</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 4 Widgets -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Gráfico ventas 7 días -->
        <div class="card">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">📊 Performance Ventas (7 días)</h3>
            <span class="text-xs text-gray-600 dark:text-[#9CA3AF]">Pico: Lunes $18k | Bajo: Dom $8k</span>
          </div>
          <div class="h-40 w-full">
            <!-- Chart.js line chart via vue-chartjs -->
            <Line :data="salesChartData" :options="salesChartOptions" />
          </div>
        </div>

        <!-- Top 5 productos del mes -->
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">🏆 Top 5 Productos del Mes</h3>
          <ul class="space-y-2">
            <li v-for="(p, i) in topProducts" :key="p.name" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 dark:text-[#9CA3AF] w-6">{{ i + 1 }}.</span>
                <span class="text-gray-900 dark:text-white">{{ p.name }}</span>
              </div>
              <div class="text-sm text-gray-600 dark:text-[#9CA3AF] font-mono">{{ p.units }} u. ${{ formatNumber(p.amount) }}</div>
            </li>
          </ul>
          <button class="text-sm text-[#3B82F6] hover:underline mt-3" @click="goToFullReport">Ver reporte completo</button>
        </div>


        <!-- Alertas priorizadas -->
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">🔔 Alertas Priorizadas</h3>
          <div class="space-y-4">
            <div>
              <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon class="h-5 w-5" />
                <span class="font-medium">Crítico ({{ alerts.critical.length }})</span>
              </div>
              <ul class="mt-2 text-sm text-gray-700 dark:text-[#9CA3AF] space-y-1">
                <li v-for="(a, idx) in alerts.critical" :key="'c'+idx">• {{ a }}</li>
              </ul>
            </div>
            <div>
              <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <InformationCircleIcon class="h-5 w-5" />
                <span class="font-medium">Info ({{ alerts.info.length }})</span>
              </div>
              <ul class="mt-2 text-sm text-gray-700 dark:text-[#9CA3AF] space-y-1">
                <li v-for="(a, idx) in alerts.info" :key="'i'+idx">• {{ a }}</li>
              </ul>
            </div>
            <button class="text-sm text-[#3B82F6] hover:underline" @click="goTo('/inventory')">Ver todas</button>
          </div>
        </div>

        <!-- Últimos movimientos / acciones -->
        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">📝 Últimos movimientos</h3>
            <button class="text-sm text-[#3B82F6] hover:underline" @click="goTo('/invoices')">Ver todos</button>
          </div>
          <div class="overflow-x-auto -mx-4 sm:mx-0">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr class="text-left text-xs text-gray-500 dark:text-gray-400">
                  <th class="py-2 pr-4">Fecha</th>
                  <th class="py-2 pr-4">Acción</th>
                  <th class="py-2 pr-4">Usuario</th>
                  <th class="py-2 pr-4">Detalle</th>
                  <th class="py-2 pr-4">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="(mov, i) in recentActions" :key="'m'+i" class="hover:bg-white/5">
                  <td class="py-3 pr-4 text-gray-500 dark:text-[#9CA3AF]">{{ mov.date }}</td>
                  <td class="py-3 pr-4 text-gray-900 dark:text-white">{{ mov.action }}</td>
                  <td class="py-3 pr-4 text-gray-500 dark:text-[#9CA3AF]">{{ mov.user }}</td>
                  <td class="py-3 pr-4">
                    <div class="text-gray-900 dark:text-white">{{ mov.entity }}</div>
                    <div v-if="mov.amount" class="text-xs text-gray-600 dark:text-[#9CA3AF]">${{ formatNumber(mov.amount) }}</div>
                  </td>
                  <td class="py-3 pr-4">
                    <span :class="statusClass(mov.status)" class="text-xs font-medium px-2 py-1 rounded">{{ mov.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler } from 'chart.js'
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler)
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'

// Heroicons
import { BoltIcon, ChartBarIcon, CubeIcon, DocumentTextIcon, CurrencyDollarIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()

// Mock de datos
const lastUpdate = ref(new Date().toLocaleString())
const metrics = ref({
  salesToday: 45320,
  salesVsYesterday: 12,
  invoicesToday: 18,
  aiUsage: 89,
  aiAnalyses: 47,
  aiValue: 12500,
  criticalAlerts: 12,
  lowStock: 8,
  priceIssues: 4,
  avgMargin: 34.5,
  marginTarget: 35,
  marginDelta: 2.3
})

type Confidence = '✅ Óptimo' | '🔥 Oportunidad' | '⚠️ Revisar'
type Status = 'Completado' | 'Pendiente' | 'Procesado'

const aiTable = ref<Array<{
  product: string
  brand: string
  currentPrice: number
  marketRange: string
  suggestedPrice: number
  delta: number
  competitors: number
  confidence: Confidence
  opportunity?: boolean
  underMarket?: boolean
}>>([
  { product: 'Filtro Aceite', brand: 'Toyota', currentPrice: 8500, marketRange: '$7800 - $9200', suggestedPrice: 8800, delta: 3.5, competitors: 12, confidence: '✅ Óptimo', opportunity: true },
  { product: 'Pastilla Freno', brand: 'Brembo', currentPrice: 12300, marketRange: '$11000 - $14000', suggestedPrice: 13500, delta: 9.7, competitors: 8, confidence: '🔥 Oportunidad', opportunity: true },
  { product: 'Amortiguador', brand: 'Monroe', currentPrice: 45000, marketRange: '$48000 - $52000', suggestedPrice: 49000, delta: 8.8, competitors: 5, confidence: '⚠️ Revisar', underMarket: true },
  { product: 'Bujía', brand: 'NGK', currentPrice: 2100, marketRange: '$1900 - $2400', suggestedPrice: 2300, delta: 9.5, competitors: 15, confidence: '✅ Óptimo', opportunity: true },
  { product: 'Disco Freno', brand: 'Bosch', currentPrice: 15800, marketRange: '$16000 - $19000', suggestedPrice: 16900, delta: 6.9, competitors: 9, confidence: '🔥 Oportunidad', opportunity: true },
])

const topProducts = ref([
  { name: 'Filtros aceite', units: 89, amount: 24000 },
  { name: 'Pastillas freno', units: 67, amount: 18000 },
  { name: 'Bujías NGK', units: 45, amount: 12000 },
  { name: 'Amortiguadores', units: 23, amount: 34000 },
  { name: 'Discos freno', units: 19, amount: 15000 },
])

const alerts = ref({
  critical: [
    'Stock mínimo: Filtros Toyota',
    'Precio desact: Pastillas Bosch',
    'Sin análisis IA: 23 productos'
  ],
  info: [
    'Proveedores actualizaron lista',
    '5 facturas pendientes de cobro',
    'Margen en target para 60% de productos',
    '2 ajustes de precios programados',
    'Inventario por debajo del mínimo en 5 ítems',
    'Nuevos clientes registrados esta semana',
    'Ventas con tendencia positiva',
    'Reglas de pricing revisadas',
    'Backlog de reportes actualizado'
  ]
})

// Últimos movimientos (mock)
const recentActions = ref<Array<{ date: string; action: string; user: string; entity: string; status: Status; amount?: number }>>([
  { date: 'Hoy 10:12', action: 'Nueva factura', user: 'Admin', entity: '#INV-1023', status: 'Completado', amount: 125000 },
  { date: 'Hoy 09:40', action: 'Ajuste de precio', user: 'Martín', entity: 'Bujías NGK', status: 'Pendiente' },
  { date: 'Ayer 18:22', action: 'Actualización stock', user: 'Lucía', entity: 'Pastillas Brembo', status: 'Completado' },
  { date: 'Ayer 15:05', action: 'Análisis IA', user: 'Sistema', entity: 'Catálogo completo', status: 'Procesado' },
  { date: 'Ayer 11:48', action: 'Nuevo cliente', user: 'Ana', entity: 'Taller López', status: 'Completado' },
])

// Chart.js data
const weeklySales = ref([8, 14, 12, 15, 18, 11, 9])
const isDark = computed(() => document.documentElement.classList.contains('dark'))
const baseline = computed(() => Math.min(...weeklySales.value) * 0.9)
const salesChartData = computed(() => ({
  labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  datasets: [
    {
      label: 'Ventas',
      data: weeklySales.value,
      borderColor: isDark.value ? '#60A5FA' : '#2563eb',
      backgroundColor: isDark.value ? 'rgba(96,165,250,0.15)' : 'rgba(37,99,235,0.12)',
      fill: false,
      tension: 0.35,
      borderWidth: 3,
      pointRadius: 0
    },
    {
      label: 'Base',
      data: weeklySales.value.map(() => baseline.value),
      borderColor: isDark.value ? '#93c5fd' : '#93c5fd',
      borderDash: [6, 6],
      borderWidth: 2,
      pointRadius: 0
    }
  ]
}))
const salesChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: true,
      callbacks: {
        label: (ctx: any) => ` $${ctx.parsed.y}k`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: isDark.value ? '#9CA3AF' : '#6B7280' }
    },
    y: {
      grid: { color: isDark.value ? 'rgba(255,255,255,0.06)' : '#E5E7EB' },
      ticks: { color: isDark.value ? '#9CA3AF' : '#6B7280' }
    }
  }
}))

// Progreso hacia el target de margen
const marginProgress = computed(() => {
  const current = metrics.value.avgMargin
  const target = metrics.value.marginTarget || 1
  const pct = (current / target) * 100
  return Math.max(0, Math.min(100, Number(pct.toFixed(1))))
})

// Métodos
const formatNumber = (n: number) => n.toLocaleString('es-AR')
const confidenceClass = (c: Confidence) => {
  switch (c) {
    case '✅ Óptimo': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
    case '🔥 Oportunidad': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
    case '⚠️ Revisar': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-[#E6EAF5]'
  }
}

const statusClass = (s: Status) => {
  switch (s) {
    case 'Completado': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
    case 'Pendiente': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
    case 'Procesado': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
    default: return 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-[#E6EAF5]'
  }
}

const applySuggestion = (row: any) => {
  alert(`Aplicado precio sugerido $${formatNumber(row.suggestedPrice)} para ${row.product} (${row.brand})`)
}
const viewDetail = (row: any) => {
  router.push('/inventory')
}
const viewAllAnalyses = () => {
  router.push('/company/pricing')
}
const goTo = (path: string) => router.push(path)
</script>

<style scoped>
.card {
  background-color: #ffffff; /* light */
  border-radius: 0.75rem; /* rounded-xl */
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  padding: 1rem; /* p-4 */
  transition: transform .2s ease, box-shadow .2s ease;
}
.dark .card {
  background-color: #141C2E; /* dark */
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
@media (min-width: 640px) {
  .card { padding: 1.5rem; } /* sm:p-6 */
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}
.dark .card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
.btn-primary {
  background-color: #3B82F6; /* acento azul */
  color: #0B1220;
  border-radius: 0.5rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
}
.dark .btn-primary { color: #E6EAF5; }
.btn-primary:hover { background-color: #2563eb; }
.btn-light {
  background: #F3F4F6;
  color: #1F2937;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}
.dark .btn-light {
  background: rgba(255,255,255,0.06);
  color: #E6EAF5;
  border: 1px solid rgba(255,255,255,0.1);
}
.quick-btn {
  @apply flex items-center gap-2 justify-center px-3 py-3 rounded-lg text-sm;
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  color: #1F2937;
}
.dark .quick-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #E6EAF5;
}
</style>
import { apiClient } from './api';

export interface DashboardMetrics {
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  paidInvoices: number;
  totalCustomers: number;
  totalProducts: number;
  averageInvoiceValue: number;
  conversionRate: number;
  recentInvoices: Array<{
    id: string;
    number: string;
    total: number;
    status: string;
    createdAt: string;
    customer: {
      name: string;
      email: string;
    };
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface RevenueChartData {
  chartData: Array<{
    period: string;
    revenue: number;
    invoiceCount: number;
  }>;
  period: string;
  totalRevenue: number;
  totalInvoices: number;
}

export interface InvoicesChartData {
  chartData: Array<{
    status: string;
    count: number;
    total: number;
    label: string;
  }>;
  totalInvoices: number;
  totalAmount: number;
}

export interface SalesSummary {
  summary: {
    totalRevenue: number;
    totalSubtotal: number;
    totalTax: number;
    totalInvoices: number;
    averageInvoiceValue: number;
  };
  topProducts: Array<{
    productId: string;
    _sum: {
      quantity: number;
      total: number;
    };
    product: {
      name: string;
      code: string;
    };
  }>;
  topCustomers: Array<{
    customerId: string;
    _sum: {
      total: number;
    };
    _count: {
      id: number;
    };
    customer: {
      name: string;
      email: string;
    };
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface SalesByPeriod {
  salesData: Array<{
    period: string;
    revenue: number;
    subtotal: number;
    tax: number;
    invoiceCount: number;
    avgInvoiceValue: number;
  }>;
  period: string;
  groupBy: string;
  summary: {
    totalRevenue: number;
    totalInvoices: number;
    averageDaily: number;
  };
}

export interface SalesTrends {
  current: {
    revenue: number;
    invoices: number;
    averageValue: number;
  };
  previous: {
    revenue: number;
    invoices: number;
    averageValue: number;
  };
  trends: {
    revenueGrowth: number;
    invoiceGrowth: number;
    avgValueGrowth: number;
  };
  period: string;
}

export interface TopCustomers {
  topCustomers: Array<{
    customer: {
      name: string;
      email: string;
      phone?: string;
    };
    totalRevenue: number;
    invoiceCount: number;
    averageInvoiceValue: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface CustomerActivity {
  month: string;
  activeCustomers: number;
  totalInvoices: number;
  totalRevenue: number;
}

export interface MonthlyInvoiceSummary {
  year: number;
  monthlySummary: Array<{
    month: number;
    monthName: string;
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    cancelledInvoices: number;
    totalAmount: number;
    paidAmount: number;
  }>;
  yearTotal: {
    invoices: number;
    revenue: number;
  };
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
  groupBy?: 'day' | 'week' | 'month';
  limit?: number;
}

class ReportsService {
  // Métricas del dashboard
  async getDashboardMetrics(filters?: ReportFilters): Promise<DashboardMetrics> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/reports/dashboard/metrics?${params}`);
    return response.data.data;
  }

  // Gráfico de ingresos
  async getRevenueChart(filters?: ReportFilters): Promise<RevenueChartData> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/reports/revenue/chart?${params}`);
    return response.data.data;
  }

  // Gráfico de facturas por estado
  async getInvoicesChart(filters?: ReportFilters): Promise<InvoicesChartData> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/reports/invoices/chart?${params}`);
    return response.data.data;
  }

  // Resumen de ventas
  async getSalesSummary(filters?: ReportFilters): Promise<SalesSummary> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/reports/sales/summary?${params}`);
    return response.data.data;
  }

  // Ventas por período
  async getSalesByPeriod(filters?: ReportFilters): Promise<SalesByPeriod> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/reports/sales/period?${params}`);
    return response.data.data;
  }

  // Tendencias de ventas
  async getSalesTrends(filters?: ReportFilters): Promise<SalesTrends> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);

    const response = await apiClient.get(`/reports/sales/trends?${params}`);
    return response.data.data;
  }

  // Distribución de estados de facturas
  async getInvoiceStatusDistribution(): Promise<InvoicesChartData['chartData']> {
    const response = await apiClient.get('/reports/invoices/status-distribution');
    return response.data.data;
  }

  // Resumen mensual de facturas
  async getMonthlyInvoiceSummary(year?: number): Promise<MonthlyInvoiceSummary> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await apiClient.get(`/reports/invoices/monthly-summary?${params}`);
    return response.data.data;
  }

  // Mejores clientes
  async getTopCustomers(filters?: ReportFilters): Promise<TopCustomers> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/reports/customers/top?${params}`);
    return response.data.data;
  }

  // Actividad de clientes
  async getCustomerActivity(): Promise<CustomerActivity[]> {
    const response = await apiClient.get('/reports/customers/activity');
    return response.data.data;
  }

  // Método auxiliar para formatear fechas
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Método auxiliar para obtener rango de fechas predefinido
  getDateRange(period: 'week' | 'month' | 'quarter' | 'year'): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    return {
      startDate: this.formatDateForAPI(startDate),
      endDate: this.formatDateForAPI(endDate)
    };
  }

  // Método auxiliar para formatear moneda
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }

  // Método auxiliar para formatear porcentajes
  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  // Método auxiliar para obtener color según el crecimiento
  getGrowthColor(growth: number): string {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  // Método auxiliar para obtener icono según el crecimiento
  getGrowthIcon(growth: number): string {
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '➡️';
  }
}

export const reportsService = new ReportsService();
export default reportsService;
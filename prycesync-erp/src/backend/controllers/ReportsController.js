import prisma from '../config/database.js';

class ReportsController {
  // Métricas principales del dashboard
  static async getDashboardMetrics(req, res) {
    try {
      const companyId = req.companyId || req.user?.company?.id || req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID no encontrado en el usuario'
        });
      }
      
      const { startDate, endDate } = req.query;

      // Configurar fechas por defecto (último mes)
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);

      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : defaultEndDate;

      // Obtener métricas en paralelo
      const [
        totalInvoices,
        totalRevenue,
        pendingInvoices,
        paidInvoices,
        totalCustomers,
        totalProducts,
        recentInvoices,
        invoiceStatusChart,
        revenueChartData
      ] = await Promise.all([
        // Total de facturas
        prisma.invoice.count({
          where: {
            companyId,
            createdAt: { gte: start, lte: end }
          }
        }),

        // Ingresos totales
        prisma.invoice.aggregate({
          where: {
            companyId,
            status: 'paid',
            createdAt: { gte: start, lte: end }
          },
          _sum: { total: true }
        }),

        // Facturas pendientes
        prisma.invoice.count({
          where: {
            companyId,
            status: 'pending'
          }
        }),

        // Facturas pagadas
        prisma.invoice.count({
          where: {
            companyId,
            status: 'paid',
            createdAt: { gte: start, lte: end }
          }
        }),

        // Total de clientes
        prisma.customer.count({
          where: { companyId }
        }),

        // Total de productos
        prisma.product.count({
          where: { companyId }
        }),

        // Facturas recientes
        prisma.invoice.findMany({
          where: { companyId },
          include: {
            customer: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),

        // Distribución por estado para el gráfico
        prisma.invoice.groupBy({
          by: ['status'],
          where: {
            companyId,
            createdAt: { gte: start, lte: end }
          },
          _count: { status: true },
          _sum: { total: true }
        }),

        // Datos para gráfico de ingresos (últimos 7 días)
        prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            SUM(total) as revenue,
            COUNT(*) as invoice_count
          FROM invoices 
          WHERE company_id = ${companyId}
            AND status = 'paid'
            AND created_at >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `
      ]);

      // Calcular métricas adicionales
      const averageInvoiceValue = totalInvoices > 0 
        ? (totalRevenue._sum.total || 0) / paidInvoices 
        : 0;

      const conversionRate = totalInvoices > 0 
        ? (paidInvoices / totalInvoices) * 100 
        : 0;

      // Formatear datos del gráfico de estado de facturas
      const formattedInvoiceStatusChart = invoiceStatusChart.map(item => ({
        status: item.status,
        count: item._count.status,
        amount: parseFloat(item._sum.total) || 0,
        label: ReportsController.getStatusLabel(item.status)
      }));

      // Formatear datos del gráfico de ingresos
      const formattedRevenueChart = {
        labels: revenueChartData.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric' 
          });
        }),
        data: revenueChartData.map(item => parseFloat(item.revenue) || 0)
      };

      res.json({
        success: true,
        data: {
          totalInvoices,
          totalRevenue: totalRevenue._sum.total || 0,
          pendingInvoices,
          paidInvoices,
          totalCustomers,
          totalProducts,
          averageInvoiceValue: Math.round(averageInvoiceValue * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          recentInvoices,
          invoiceStatusChart: formattedInvoiceStatusChart,
          revenueChart: formattedRevenueChart,
          period: {
            startDate: start.toISOString(),
            endDate: end.toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener métricas del dashboard',
        details: error.message
      });
    }
  }

  // Gráfico de ingresos por período
  static async getRevenueChart(req, res) {
    try {
      const companyId = req.companyId || req.user?.company?.id || req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID no encontrado en el usuario'
        });
      }
      const { period = 'month', startDate, endDate } = req.query;

      // Configurar fechas
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      
      switch (period) {
        case 'week':
          defaultStartDate.setDate(defaultStartDate.getDate() - 7);
          break;
        case 'month':
          defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);
          break;
        case 'quarter':
          defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);
          break;
        case 'year':
          defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);
          break;
      }

      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : defaultEndDate;

      // Query para obtener ingresos agrupados por fecha
      const revenueData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC(${period}, created_at) as period,
          SUM(total) as revenue,
          COUNT(*) as invoice_count
        FROM invoices 
        WHERE company_id = ${companyId}
          AND status = 'paid'
          AND created_at >= ${start}
          AND created_at <= ${end}
        GROUP BY DATE_TRUNC(${period}, created_at)
        ORDER BY period ASC
      `;

      // Formatear datos para el gráfico
      const chartData = revenueData.map(item => ({
        period: item.period.toISOString().split('T')[0],
        revenue: parseFloat(item.revenue) || 0,
        invoiceCount: parseInt(item.invoice_count) || 0
      }));

      res.json({
        success: true,
        data: {
          chartData,
          period,
          totalRevenue: chartData.reduce((sum, item) => sum + item.revenue, 0),
          totalInvoices: chartData.reduce((sum, item) => sum + item.invoiceCount, 0)
        }
      });

    } catch (error) {
      console.error('Error getting revenue chart:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener gráfico de ingresos',
        details: error.message
      });
    }
  }

  // Gráfico de facturas por estado
  static async getInvoicesChart(req, res) {
    try {
      const companyId = req.companyId || req.user?.company?.id || req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID no encontrado en el usuario'
        });
      }
      const { startDate, endDate } = req.query;

      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);

      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : defaultEndDate;

      // Obtener distribución por estado
      const statusDistribution = await prisma.invoice.groupBy({
        by: ['status'],
        where: {
          companyId,
          createdAt: { gte: start, lte: end }
        },
        _count: { status: true },
        _sum: { total: true }
      });

      // Formatear datos
      const chartData = statusDistribution.map(item => ({
        status: item.status,
        count: item._count.status,
        total: parseFloat(item._sum.total) || 0,
        label: ReportsController.getStatusLabel(item.status)
      }));

      res.json({
        success: true,
        data: {
          chartData,
          totalInvoices: chartData.reduce((sum, item) => sum + item.count, 0),
          totalAmount: chartData.reduce((sum, item) => sum + item.total, 0)
        }
      });

    } catch (error) {
      console.error('Error getting invoices chart:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener gráfico de facturas',
        details: error.message
      });
    }
  }

  // Resumen de ventas
  static async getSalesSummary(req, res) {
    try {
      const companyId = req.user?.company?.id || req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID no encontrado en el usuario'
        });
      }
      const { startDate, endDate } = req.query;

      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);

      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : defaultEndDate;

      // Obtener resumen de ventas
      const [salesSummary, topProducts, topCustomers] = await Promise.all([
        // Resumen general
        prisma.invoice.aggregate({
          where: {
            companyId,
            status: 'paid',
            createdAt: { gte: start, lte: end }
          },
          _sum: {
            total: true,
            subtotal: true,
            taxAmount: true
          },
          _count: {
            id: true
          },
          _avg: {
            total: true
          }
        }),

        // Productos más vendidos
        prisma.invoiceItem.groupBy({
          by: ['productId'],
          where: {
            invoice: {
              companyId,
              status: 'paid',
              createdAt: { gte: start, lte: end }
            }
          },
          _sum: { quantity: true, total: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 10
        }),

        // Mejores clientes
        prisma.invoice.groupBy({
          by: ['customerId'],
          where: {
            companyId,
            status: 'paid',
            createdAt: { gte: start, lte: end }
          },
          _sum: { total: true },
          _count: { id: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 10
        })
      ]);

      // Obtener detalles de productos y clientes
      const productIds = topProducts.map(p => p.productId).filter(Boolean);
      const customerIds = topCustomers.map(c => c.customerId);

      const [products, customers] = await Promise.all([
        productIds.length > 0 ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, code: true }
        }) : [],
        
        prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true, email: true }
        })
      ]);

      // Mapear datos
      const topProductsWithDetails = topProducts.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          ...item,
          product: product || { name: 'Producto eliminado', code: 'N/A' }
        };
      });

      const topCustomersWithDetails = topCustomers.map(item => {
        const customer = customers.find(c => c.id === item.customerId);
        return {
          ...item,
          customer: customer || { name: 'Cliente eliminado', email: 'N/A' }
        };
      });

      res.json({
        success: true,
        data: {
          summary: {
            totalRevenue: parseFloat(salesSummary._sum.total) || 0,
            totalSubtotal: parseFloat(salesSummary._sum.subtotal) || 0,
            totalTax: parseFloat(salesSummary._sum.taxAmount) || 0,
            totalInvoices: salesSummary._count.id,
            averageInvoiceValue: parseFloat(salesSummary._avg.total) || 0
          },
          topProducts: topProductsWithDetails,
          topCustomers: topCustomersWithDetails,
          period: {
            startDate: start.toISOString(),
            endDate: end.toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Error getting sales summary:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener resumen de ventas',
        details: error.message
      });
    }
  }

  // Ventas por período
  static async getSalesByPeriod(req, res) {
    try {
      const companyId = req.user?.company?.id || req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID no encontrado en el usuario'
        });
      }
      const { period = 'month', startDate, endDate, groupBy = 'day' } = req.query;

      // Configurar fechas
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      
      switch (period) {
        case 'week':
          defaultStartDate.setDate(defaultStartDate.getDate() - 7);
          break;
        case 'month':
          defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);
          break;
        case 'quarter':
          defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);
          break;
        case 'year':
          defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);
          break;
      }

      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : defaultEndDate;

      // Query para ventas por período
      const salesData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC(${groupBy}, created_at) as period,
          SUM(total) as revenue,
          SUM(subtotal) as subtotal,
          SUM(tax_amount) as tax,
          COUNT(*) as invoice_count,
          AVG(total) as avg_invoice_value
        FROM invoices 
        WHERE company_id = ${companyId}
          AND status = 'paid'
          AND created_at >= ${start}
          AND created_at <= ${end}
        GROUP BY DATE_TRUNC(${groupBy}, created_at)
        ORDER BY period ASC
      `;

      // Formatear datos
      const formattedData = salesData.map(item => ({
        period: item.period.toISOString().split('T')[0],
        revenue: parseFloat(item.revenue) || 0,
        subtotal: parseFloat(item.subtotal) || 0,
        tax: parseFloat(item.tax) || 0,
        invoiceCount: parseInt(item.invoice_count) || 0,
        avgInvoiceValue: parseFloat(item.avg_invoice_value) || 0
      }));

      res.json({
        success: true,
        data: {
          salesData: formattedData,
          period,
          groupBy,
          summary: {
            totalRevenue: formattedData.reduce((sum, item) => sum + item.revenue, 0),
            totalInvoices: formattedData.reduce((sum, item) => sum + item.invoiceCount, 0),
            averageDaily: formattedData.length > 0 
              ? formattedData.reduce((sum, item) => sum + item.revenue, 0) / formattedData.length 
              : 0
          }
        }
      });

    } catch (error) {
      console.error('Error getting sales by period:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener ventas por período',
        details: error.message
      });
    }
  }

  // Tendencias de ventas
  static async getSalesTrends(req, res) {
    try {
      const companyId = req.user?.company?.id || req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID no encontrado en el usuario'
        });
      }
      const { period = 'month' } = req.query;

      // Obtener datos del período actual y anterior para comparación
      const currentEnd = new Date();
      const currentStart = new Date();
      const previousStart = new Date();
      const previousEnd = new Date();

      switch (period) {
        case 'month':
          currentStart.setMonth(currentStart.getMonth() - 1);
          previousStart.setMonth(previousStart.getMonth() - 2);
          previousEnd.setMonth(previousEnd.getMonth() - 1);
          break;
        case 'quarter':
          currentStart.setMonth(currentStart.getMonth() - 3);
          previousStart.setMonth(previousStart.getMonth() - 6);
          previousEnd.setMonth(previousEnd.getMonth() - 3);
          break;
        case 'year':
          currentStart.setFullYear(currentStart.getFullYear() - 1);
          previousStart.setFullYear(previousStart.getFullYear() - 2);
          previousEnd.setFullYear(previousEnd.getFullYear() - 1);
          break;
      }

      // Obtener métricas de ambos períodos
      const [currentPeriod, previousPeriod] = await Promise.all([
        prisma.invoice.aggregate({
          where: {
            companyId,
            status: 'paid',
            createdAt: { gte: currentStart, lte: currentEnd }
          },
          _sum: { total: true },
          _count: { id: true },
          _avg: { total: true }
        }),

        prisma.invoice.aggregate({
          where: {
            companyId,
            status: 'paid',
            createdAt: { gte: previousStart, lte: previousEnd }
          },
          _sum: { total: true },
          _count: { id: true },
          _avg: { total: true }
        })
      ]);

      // Calcular tendencias
      const currentRevenue = parseFloat(currentPeriod._sum.total) || 0;
      const previousRevenue = parseFloat(previousPeriod._sum.total) || 0;
      const revenueGrowth = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      const currentInvoices = currentPeriod._count.id;
      const previousInvoices = previousPeriod._count.id;
      const invoiceGrowth = previousInvoices > 0 
        ? ((currentInvoices - previousInvoices) / previousInvoices) * 100 
        : 0;

      const currentAvg = parseFloat(currentPeriod._avg.total) || 0;
      const previousAvg = parseFloat(previousPeriod._avg.total) || 0;
      const avgGrowth = previousAvg > 0 
        ? ((currentAvg - previousAvg) / previousAvg) * 100 
        : 0;

      res.json({
        success: true,
        data: {
          current: {
            revenue: currentRevenue,
            invoices: currentInvoices,
            averageValue: currentAvg
          },
          previous: {
            revenue: previousRevenue,
            invoices: previousInvoices,
            averageValue: previousAvg
          },
          trends: {
            revenueGrowth: Math.round(revenueGrowth * 100) / 100,
            invoiceGrowth: Math.round(invoiceGrowth * 100) / 100,
            avgValueGrowth: Math.round(avgGrowth * 100) / 100
          },
          period
        }
      });

    } catch (error) {
      console.error('Error getting sales trends:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener tendencias de ventas',
        details: error.message
      });
    }
  }

  // Distribución de estados de facturas
  static async getInvoiceStatusDistribution(req, res) {
    try {
      const companyId = req.user?.company?.id || req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID no encontrado en el usuario'
        });
      }

      const { startDate, endDate } = req.query;

      // Configurar fechas por defecto (último mes)
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);

      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : defaultEndDate;

      const distribution = await prisma.invoice.groupBy({
        by: ['status'],
        where: { 
          companyId,
          createdAt: { gte: start, lte: end }
        },
        _count: { status: true },
        _sum: { total: true }
      });

      const formattedData = distribution.map(item => ({
        status: item.status,
        count: item._count.status,
        total: parseFloat(item._sum.total) || 0,
        label: ReportsController.getStatusLabel(item.status)
      }));

      res.json({
        success: true,
        data: {
          distribution: formattedData,
          period: {
            startDate: start.toISOString(),
            endDate: end.toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Error getting invoice status distribution:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener distribución de estados',
        details: error.message
      });
    }
  }

  // Resumen mensual de facturas
  static async getMonthlyInvoiceSummary(req, res) {
    try {
      const companyId = req.user?.company?.id || req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID no encontrado en el usuario'
        });
      }

      const { year = new Date().getFullYear(), startDate, endDate } = req.query;

      let whereClause = `company_id = ${companyId}`;
      
      if (startDate && endDate) {
        // Si se proporcionan fechas específicas, usar esas fechas
        const start = new Date(startDate);
        const end = new Date(endDate);
        whereClause += ` AND created_at >= '${start.toISOString()}' AND created_at <= '${end.toISOString()}'`;
      } else {
        // Si no se proporcionan fechas, usar el año especificado
        whereClause += ` AND EXTRACT(YEAR FROM created_at) = ${parseInt(year)}`;
      }

      const monthlySummary = await prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM created_at) as month,
          COUNT(*) as total_invoices,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_invoices,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_invoices,
          SUM(total) as total_amount,
          SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_amount
        FROM invoices 
        WHERE ${whereClause}
        GROUP BY EXTRACT(MONTH FROM created_at)
        ORDER BY month ASC
      `;

      const formattedData = monthlySummary.map(item => ({
        month: parseInt(item.month),
        monthName: ReportsController.getMonthName(parseInt(item.month)),
        totalInvoices: parseInt(item.total_invoices),
        paidInvoices: parseInt(item.paid_invoices),
        pendingInvoices: parseInt(item.pending_invoices),
        cancelledInvoices: parseInt(item.cancelled_invoices),
        totalAmount: parseFloat(item.total_amount) || 0,
        paidAmount: parseFloat(item.paid_amount) || 0
      }));

      res.json({
        success: true,
        data: {
          year: startDate && endDate ? null : parseInt(year),
          monthlySummary: formattedData,
          yearTotal: {
            invoices: formattedData.reduce((sum, item) => sum + item.totalInvoices, 0),
            revenue: formattedData.reduce((sum, item) => sum + item.paidAmount, 0)
          },
          period: startDate && endDate ? {
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString()
          } : {
            year: parseInt(year)
          }
        }
      });

    } catch (error) {
      console.error('Error getting monthly invoice summary:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener resumen mensual',
        details: error.message
      });
    }
  }

  // Mejores clientes
  static async getTopCustomers(req, res) {
    try {
      const companyId = req.user?.company?.id || req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID no encontrado en el usuario'
        });
      }
      const { limit = 10, startDate, endDate } = req.query;

      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(defaultStartDate.getMonth() - 3); // Últimos 3 meses

      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : defaultEndDate;

      const topCustomers = await prisma.invoice.groupBy({
        by: ['customerId'],
        where: {
          companyId,
          status: 'paid',
          createdAt: { gte: start, lte: end }
        },
        _sum: { total: true },
        _count: { id: true },
        _avg: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: parseInt(limit)
      });

      // Obtener detalles de clientes
      const customerIds = topCustomers.map(item => item.customerId);
      const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, email: true, phone: true }
      });

      const formattedData = topCustomers.map(item => {
        const customer = customers.find(c => c.id === item.customerId);
        return {
          customer: customer || { name: 'Cliente eliminado', email: 'N/A' },
          totalRevenue: parseFloat(item._sum.total) || 0,
          invoiceCount: item._count.id,
          averageInvoiceValue: parseFloat(item._avg.total) || 0
        };
      });

      res.json({
        success: true,
        data: {
          topCustomers: formattedData,
          period: {
            startDate: start.toISOString(),
            endDate: end.toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Error getting top customers:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener mejores clientes',
        details: error.message
      });
    }
  }

  // Actividad de clientes
  static async getCustomerActivity(req, res) {
    try {
      const companyId = req.user?.company?.id || req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID no encontrado en el usuario'
        });
      }

      const { startDate, endDate, period = '12 months' } = req.query;

      // Configurar fechas
      let start, end;
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        end = new Date();
        start = new Date();
        
        // Configurar período por defecto
        switch (period) {
          case '3 months':
            start.setMonth(start.getMonth() - 3);
            break;
          case '6 months':
            start.setMonth(start.getMonth() - 6);
            break;
          case '12 months':
          default:
            start.setMonth(start.getMonth() - 12);
            break;
          case '24 months':
            start.setMonth(start.getMonth() - 24);
            break;
        }
      }

      const activity = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(DISTINCT customer_id) as active_customers,
          COUNT(*) as total_invoices,
          SUM(total) as total_revenue
        FROM invoices 
        WHERE company_id = ${companyId}
          AND status = 'paid'
          AND created_at >= ${start}
          AND created_at <= ${end}
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
      `;

      const formattedData = activity.map(item => ({
        month: item.month.toISOString().split('T')[0],
        activeCustomers: parseInt(item.active_customers),
        totalInvoices: parseInt(item.total_invoices),
        totalRevenue: parseFloat(item.total_revenue) || 0
      }));

      res.json({
        success: true,
        data: {
          activity: formattedData,
          period: {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            periodType: startDate && endDate ? 'custom' : period
          }
        }
      });

    } catch (error) {
      console.error('Error getting customer activity:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener actividad de clientes',
        details: error.message
      });
    }
  }

  // Métodos auxiliares
  static getStatusLabel(status) {
    const labels = {
      'draft': 'Borrador',
      'pending': 'Pendiente',
      'paid': 'Pagada',
      'cancelled': 'Cancelada',
      'overdue': 'Vencida'
    };
    return labels[status] || status;
  }

  static getMonthName(month) {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || `Mes ${month}`;
  }
}

export default ReportsController;
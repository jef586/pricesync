import express from 'express';
import { authenticate } from '../middleware/auth.js';
import ReportsController from '../controllers/ReportsController.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Métricas del dashboard
router.get('/dashboard/metrics', ReportsController.getDashboardMetrics);

// Gráficos de ingresos y tendencias
router.get('/revenue/chart', ReportsController.getRevenueChart);
router.get('/invoices/chart', ReportsController.getInvoicesChart);
router.get('/sales/trends', ReportsController.getSalesTrends);

// Reportes de ventas
router.get('/sales/summary', ReportsController.getSalesSummary);
router.get('/sales/period', ReportsController.getSalesByPeriod);

// Reportes de facturas
router.get('/invoices/status-distribution', ReportsController.getInvoiceStatusDistribution);
router.get('/invoices/monthly-summary', ReportsController.getMonthlyInvoiceSummary);

// Reportes de clientes
router.get('/customers/top', ReportsController.getTopCustomers);
router.get('/customers/activity', ReportsController.getCustomerActivity);

export default router;
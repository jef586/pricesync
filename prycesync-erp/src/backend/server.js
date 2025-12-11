import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { connectDatabase } from './config/database.js';
import prisma from './config/database.js';
import authRoutes from './routes/auth.js';
import invoiceRoutes from './routes/invoices.js';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import articlesRoutes from './routes/articles.js';
import categoryRoutes from './routes/categories.js';
import reportRoutes from './routes/reports.js';
import supplierRoutes from './routes/suppliers.js';
import afipRoutes from './routes/afip.js';
import printRoutes from './routes/print.js';
import printLogsRoutes from './routes/print-logs.js';
import importsRoutes from './routes/imports.js'
import opsRoutes from './routes/ops.js'
import aiRoutes from './routes/ai.js';
import pricingRoutes from './routes/pricing.js';
import settingsRoutes from './routes/settings.js';
import usersRoutes from './routes/users.js';
import rolesRoutes from './routes/roles.js';
import auditRoutes from './routes/audit.js';
import adminRoutes from './routes/admin.js';
import companyRoutes from './routes/company.js';
import setupRoutes from './routes/setup.js';

import salesRoutes from './routes/sales.js';
import stockRoutes from './routes/stock.js';
import stockEstimatorRoutes from './routes/stock-estimator.js';
import rubrosRoutes from './routes/rubros.js';
import { randomUUID } from 'crypto';

const app = express();
const PORT = process.env.PORT || 3002;

// Static assets for articles (images)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = process.env.ASSETS_DIR || (process.env.NODE_ENV === 'development'
  ? path.resolve(__dirname, '../../assets')
  : '/app/assets');
const ARTICLES_ASSETS_DIR = path.join(ASSETS_DIR, 'articles');

// Middleware CORS configurable por entorno
const allowedOrigins = String(process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  exposedHeaders: ['x-request-id']
}));

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de requestId
app.use((req, res, next) => {
  const rid = req.headers['x-request-id'] || randomUUID();
  req.requestId = rid;
  res.setHeader('x-request-id', rid);
  next();
});

// Static route to serve article images
app.use('/static/articles', express.static(ARTICLES_ASSETS_DIR, {
  maxAge: '7d',
  immutable: true,
  index: false,
  setHeaders: (res, filePath) => {
    // Basic security headers and content type best-effort
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Middleware de logging bÃ¡sico
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Conectar a la base de datos
await connectDatabase();

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/rubros', rubrosRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/stock', stockEstimatorRoutes);
app.use('/api/afip', afipRoutes);
app.use('/api/print', printRoutes);
app.use('/api/print/logs', printLogsRoutes);
app.use('/api/imports', importsRoutes)
app.use('/api/ai', aiRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/setup', setupRoutes);

// Ops endpoints
app.use('/ops', opsRoutes)


// Endpoint de health check
app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexiÃ³n a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint raÃ­z
app.get('/', (req, res) => {
  res.json({ 
    message: 'PryceSync ERP API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      invoices: '/api/invoices',
      docs: 'https://github.com/your-repo/docs'
    }
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`ðŸš€ API Server running on http://localhost:${PORT}`);
  console.log(`ðŸ“Š Health check available at http://localhost:${PORT}/api/health`);
  console.log(`ðŸŒ Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, server };
export default app;

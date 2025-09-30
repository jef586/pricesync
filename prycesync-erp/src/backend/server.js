import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database.js';
import prisma from './config/database.js';
import authRoutes from './routes/auth.js';
import invoiceRoutes from './routes/invoices.js';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import reportRoutes from './routes/reports.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware CORS para permitir conexiones desde el frontend Vue (puerto 5173)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging básico
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
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);

// Endpoint de health check
app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
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

// Endpoint raíz
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
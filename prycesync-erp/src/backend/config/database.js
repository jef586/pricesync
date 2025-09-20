import { PrismaClient } from '@prisma/client';

// Configuración del cliente Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Manejo de conexión y desconexión
process.on('beforeExit', async () => {
  console.log('🔌 Cerrando conexión a la base de datos...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('🔌 Cerrando conexión a la base de datos...');
  await prisma.$disconnect();
  process.exit(0);
});

// Función para verificar la conexión
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    return false;
  }
};

export default prisma;
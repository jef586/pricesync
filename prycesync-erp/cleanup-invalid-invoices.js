import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupInvalidInvoices() {
  try {
    console.log('🧹 Limpiando facturas con números inválidos...');
    
    // Buscar facturas con números que contengan "NaN"
    const invalidInvoices = await prisma.invoice.findMany({
      where: {
        number: {
          contains: 'NaN'
        }
      }
    });
    
    console.log(`📋 Encontradas ${invalidInvoices.length} facturas con números inválidos:`);
    invalidInvoices.forEach(invoice => {
      console.log(`  - ID: ${invoice.id}, Número: ${invoice.number}, Tipo: ${invoice.type}`);
    });
    
    if (invalidInvoices.length > 0) {
      // Eliminar facturas inválidas
      const deleteResult = await prisma.invoice.deleteMany({
        where: {
          number: {
            contains: 'NaN'
          }
        }
      });
      
      console.log(`✅ Eliminadas ${deleteResult.count} facturas con números inválidos`);
    }
    
    // Mostrar facturas restantes
    console.log('\n📄 Facturas restantes:');
    const remainingInvoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    remainingInvoices.forEach(invoice => {
      console.log(`  - ID: ${invoice.id}, Número: ${invoice.number}, Tipo: ${invoice.type}, Estado: ${invoice.status}`);
    });
    
    console.log('\n✨ Limpieza completada');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupInvalidInvoices();
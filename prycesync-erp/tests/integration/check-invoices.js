import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInvoices() {
  try {
    console.log('🔍 Consultando facturas en la base de datos...');
    
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        number: true,
        type: true,
        status: true,
        customerId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total de facturas encontradas: ${invoices.length}`);
    
    if (invoices.length > 0) {
      console.log('\n📋 Lista de facturas:');
      invoices.forEach((invoice, index) => {
        console.log(`${index + 1}. ID: ${invoice.id}`);
        console.log(`   Número: ${invoice.number}`);
        console.log(`   Tipo: ${invoice.type}`);
        console.log(`   Estado: ${invoice.status}`);
        console.log(`   Cliente ID: ${invoice.customerId}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ No se encontraron facturas en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error al consultar facturas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvoices();
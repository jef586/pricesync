import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInvoices() {
  try {
    console.log('🔍 Verificando facturas existentes...\n');
    
    // Obtener facturas existentes
    const invoices = await prisma.invoice.findMany({
      select: { 
        id: true, 
        number: true, 
        type: true, 
        companyId: true,
        status: true,
        total: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('📄 Últimas 10 facturas:');
    if (invoices.length === 0) {
      console.log('   No hay facturas en la base de datos');
    } else {
      invoices.forEach((inv, i) => {
        console.log(`  ${i+1}. ID: ${inv.id}`);
        console.log(`     Número: ${inv.number}`);
        console.log(`     Tipo: ${inv.type}`);
        console.log(`     CompanyId: ${inv.companyId}`);
        console.log(`     Estado: ${inv.status}`);
        console.log(`     Total: $${inv.total}`);
        console.log(`     Creada: ${inv.createdAt.toISOString()}`);
        console.log('');
      });
    }
    
    // Obtener empresas
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, taxId: true }
    });
    
    console.log('🏢 Empresas registradas:');
    companies.forEach((comp, i) => {
      console.log(`  ${i+1}. ID: ${comp.id}`);
      console.log(`     Nombre: ${comp.name}`);
      console.log(`     CUIT: ${comp.taxId}`);
      console.log('');
    });
    
    // Verificar constraint único
    console.log('🔍 Verificando constraint único (company_id, number):');
    const duplicates = await prisma.$queryRaw`
      SELECT company_id, number, COUNT(*) as count
      FROM invoices 
      GROUP BY company_id, number 
      HAVING COUNT(*) > 1
    `;
    
    if (duplicates.length === 0) {
      console.log('   ✅ No hay duplicados de (company_id, number)');
    } else {
      console.log('   ❌ Duplicados encontrados:');
      duplicates.forEach(dup => {
        console.log(`     CompanyId: ${dup.company_id}, Number: ${dup.number}, Count: ${dup.count}`);
      });
    }
    
    // Obtener el próximo número para cada tipo
    console.log('\n🔢 Próximos números de factura:');
    const types = ['A', 'B', 'C'];
    
    for (const type of types) {
      const lastInvoice = await prisma.invoice.findFirst({
        where: { type: type },
        orderBy: { number: 'desc' }
      });
      
      const nextNumber = lastInvoice ? 
        (parseInt(lastInvoice.number) + 1).toString().padStart(8, '0') : 
        '00000001';
        
      console.log(`   Tipo ${type}: ${nextNumber} (último: ${lastInvoice?.number || 'ninguno'})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvoices();
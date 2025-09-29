import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestCustomer() {
  try {
    console.log('🔍 Buscando empresa existente...');
    
    // Buscar la primera empresa activa
    const company = await prisma.company.findFirst({
      where: {
        status: 'active',
        deletedAt: null
      }
    });

    if (!company) {
      console.error('❌ No se encontró ninguna empresa activa');
      return;
    }

    console.log(`✅ Empresa encontrada: ${company.name} (ID: ${company.id})`);

    // Verificar si ya existe un cliente de prueba
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        companyId: company.id,
        email: 'cliente.prueba@example.com',
        deletedAt: null
      }
    });

    if (existingCustomer) {
      console.log('✅ Cliente de prueba ya existe:');
      console.log(`   - ID: ${existingCustomer.id}`);
      console.log(`   - Nombre: ${existingCustomer.name}`);
      console.log(`   - Email: ${existingCustomer.email}`);
      console.log(`   - CUIT: ${existingCustomer.taxId}`);
      return existingCustomer;
    }

    // Generar código único para el cliente
    const customerCount = await prisma.customer.count({
      where: {
        companyId: company.id,
        deletedAt: null
      }
    });

    const customerCode = `CLI-${(customerCount + 1).toString().padStart(4, '0')}`;

    // Crear cliente de prueba
    console.log('🏗️ Creando cliente de prueba...');
    
    const newCustomer = await prisma.customer.create({
      data: {
        code: customerCode,
        name: 'Cliente de Prueba S.A.',
        type: 'business',
        status: 'active',
        taxId: '20-12345678-9',
        taxCategory: 'Responsable Inscripto',
        email: 'cliente.prueba@example.com',
        phone: '+54 11 1234-5678',
        mobile: '+54 9 11 1234-5678',
        website: 'https://www.clienteprueba.com',
        address: 'Av. Corrientes 1234',
        city: 'Buenos Aires',
        state: 'CABA',
        country: 'AR',
        zipCode: 'C1043AAZ',
        creditLimit: 100000.00,
        paymentTerms: 30,
        discount: 5.00,
        companyId: company.id
      }
    });

    console.log('✅ Cliente de prueba creado exitosamente:');
    console.log(`   - ID: ${newCustomer.id}`);
    console.log(`   - Código: ${newCustomer.code}`);
    console.log(`   - Nombre: ${newCustomer.name}`);
    console.log(`   - Email: ${newCustomer.email}`);
    console.log(`   - CUIT: ${newCustomer.taxId}`);
    console.log(`   - Tipo: ${newCustomer.type}`);
    console.log(`   - Límite de crédito: $${newCustomer.creditLimit}`);
    console.log(`   - Términos de pago: ${newCustomer.paymentTerms} días`);

    return newCustomer;

  } catch (error) {
    console.error('❌ Error creando cliente de prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestCustomer()
    .then(() => {
      console.log('\n🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en el proceso:', error);
      process.exit(1);
    });
}

export default createTestCustomer;
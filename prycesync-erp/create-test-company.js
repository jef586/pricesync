// Script para crear una empresa de prueba
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestCompany() {
  try {
    console.log('🏢 Creando empresa de prueba...');
    
    // Verificar si ya existe una empresa de prueba
    const existingCompany = await prisma.company.findFirst({
      where: {
        taxId: '20-12345678-9'
      }
    });
    
    if (existingCompany) {
      console.log('✅ Empresa de prueba ya existe:', existingCompany);
      return existingCompany;
    }
    
    // Crear nueva empresa de prueba
    const company = await prisma.company.create({
      data: {
        name: 'Empresa Test S.A.',
        taxId: '20-12345678-9',
        email: 'admin@empresatest.com',
        phone: '+54 11 1234-5678',
        address: 'Av. Corrientes 1234',
        city: 'Buenos Aires',
        state: 'CABA',
        country: 'Argentina',
        status: 'active'
      }
    });
    
    console.log('✅ Empresa de prueba creada exitosamente:', company);
    return company;
    
  } catch (error) {
    console.error('❌ Error creando empresa de prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
createTestCompany().catch(console.error);
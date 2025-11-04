// Script para crear un usuario administrador de prueba
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('👤 Creando usuario administrador de prueba...');
    
    // Buscar la empresa de prueba
    const company = await prisma.company.findFirst({
      where: {
        taxId: '20-12345678-9'
      }
    });
    
    if (!company) {
      throw new Error('Empresa de prueba no encontrada. Ejecuta create-test-company.js primero.');
    }
    
    console.log('🏢 Empresa encontrada:', company.name);
    
    // Verificar si ya existe el usuario
    const existingUser = await prisma.user.findFirst({
      where: {
        email: 'admin@empresatest.com'
      }
    });
    
    if (existingUser) {
      console.log('✅ Usuario administrador ya existe:', existingUser.email);
      return existingUser;
    }
    
    // Hash de la contraseña
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    // Crear nuevo usuario administrador
    const user = await prisma.user.create({
      data: {
        email: 'admin@empresatest.com',
        passwordHash: passwordHash,
        name: 'Admin Test',
        role: 'ADMIN',
        status: 'active',
        companyId: company.id
      }
    });
    
    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('📧 Email:', user.email);
    console.log('👤 Nombre:', user.name);
    console.log('🔑 Rol:', user.role);
    console.log('🏢 Empresa:', company.name);
    
    return user;
    
  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
createTestUser().catch(console.error);
// Script para crear un usuario administrador de prueba usando SQL crudo
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function createTestUserRaw() {
  try {
    console.log('👤 Creando usuario admin (raw SQL) ...')

    // Buscar la empresa de prueba
    const company = await prisma.company.findFirst({ where: { taxId: '20-12345678-9' } })
    if (!company) {
      throw new Error('Empresa de prueba no encontrada. Ejecuta create-test-company.js primero.')
    }
    console.log('🏢 Empresa encontrada:', company.name)

    // Verificar si ya existe el usuario
    const existing = await prisma.user.findFirst({ where: { email: 'admin@empresatest.com' } })
    if (existing) {
      console.log('✅ Usuario administrador ya existe:', existing.email)
      return existing
    }

    // Preparar datos
    const id = 'seed_' + crypto.randomUUID()
    const email = 'admin@empresatest.com'
    const name = 'Admin Test'
    const passwordHash = await bcrypt.hash('admin123', 12)
    const role = 'admin' // Enum en la BD (schema previo)
    const status = 'active'
    const companyId = company.id

    // Insertar con SQL crudo para sortear el mismatch del enum UserRole
    await prisma.$executeRawUnsafe(
      `INSERT INTO users (id, email, password_hash, name, role, status, company_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::"UserRole", $6::"UserStatus", $7, NOW(), NOW())`,
      id, email, passwordHash, name, role, status, companyId
    )

    console.log('✅ Usuario administrador creado exitosamente:')
    console.log('📧 Email:', email)
    console.log('👤 Nombre:', name)
    console.log('🔑 Rol:', role)
    console.log('🏢 Empresa:', company.name)

  } catch (err) {
    console.error('❌ Error creando usuario admin (raw):', err)
    throw err
  } finally {
    await prisma.$disconnect()
  }
}

createTestUserRaw().catch(console.error)
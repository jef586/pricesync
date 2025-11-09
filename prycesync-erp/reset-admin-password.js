// Script para resetear la contraseña del usuario admin de prueba
// Ejecutar dentro del contenedor Docker: node reset-admin-password.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetAdminPassword() {
  const email = process.env.TEST_EMAIL || 'admin@empresatest.com'
  const newPass = process.env.TEST_PASSWORD || 'admin123'
  try {
    console.log('🔐 Reset de contraseña para usuario:', email)

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, status: true, companyId: true }
    })

    if (!user) {
      console.error('❌ Usuario no encontrado:', email)
      process.exitCode = 1
      return
    }

    const hash = await bcrypt.hash(newPass, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        status: 'active'
      }
    })

    console.log('✅ Contraseña actualizada y estado activado para:', email)
  } catch (err) {
    console.error('❌ Error reseteando contraseña:', err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword().catch((e) => {
  console.error('❌ Error inesperado:', e)
  process.exitCode = 1
})
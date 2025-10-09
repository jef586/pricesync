// Crea una venta de prueba directamente con Prisma, evitando el controlador
// Ejecutar: node scripts/create-test-sale.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Obtener empresa de prueba (por nombre) o la primera
    let company = await prisma.company.findFirst({ where: { name: 'Empresa Test S.A.' } })
    if (!company) {
      company = await prisma.company.findFirst()
    }
    if (!company) throw new Error('No se encontró ninguna empresa')

    // Obtener/crear cliente de prueba
    let customer = await prisma.customer.findFirst({ where: { companyId: company.id } })
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyId: company.id,
          code: `CUST-${Math.floor(Math.random() * 100000)}`,
          name: 'Cliente Prisma Test',
          type: 'individual',
          status: 'active'
        }
      })
    }

    // Calcular totales simples para un item
    const quantity = 1
    const unitPrice = 1000
    const taxRate = 21
    const subtotal = unitPrice * quantity
    const taxAmount = (subtotal * taxRate) / 100
    const discountAmount = 0
    const total = subtotal + taxAmount - discountAmount
    const totalRounded = total

    // Generar número secuencial basado en máximo actual
    const last = await prisma.salesOrder.findFirst({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
      select: { number: true }
    })
    const seq = last && last.number?.includes('-') ? parseInt(last.number.split('-')[1], 10) || 0 : 0
    const nextSeq = seq + 1
    const number = `SO-${String(nextSeq).padStart(8, '0')}`

    const sale = await prisma.salesOrder.create({
      data: {
        number,
        companyId: company.id,
        customerId: customer.id,
        subtotal,
        taxAmount,
        discountAmount,
        total,
        totalRounded,
        status: 'open',
        items: {
          create: [
            {
              productId: null,
              description: 'Producto Demo',
              quantity,
              unitPrice,
              discount: 0,
              taxRate,
              subtotal,
              taxAmount,
              total
            }
          ]
        }
      },
      include: { items: true }
    })

    console.log('✅ Venta creada (Prisma):', sale.id)
  } catch (e) {
    console.error('❌ Error creando venta (Prisma):', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
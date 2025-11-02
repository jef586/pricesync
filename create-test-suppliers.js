// Script para crear proveedores de prueba
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestSuppliers() {
  try {
    console.log('🏭 Creando proveedores de prueba...')

    // Usar empresa de prueba existente o la primera activa
    const company = await prisma.company.findFirst({
      where: { status: 'active', deletedAt: null }
    })

    if (!company) {
      console.error('❌ No se encontró ninguna empresa activa. Ejecuta primero create-test-company.js')
      return
    }

    console.log(`📊 Usando empresa: ${company.name} (${company.id})`)

    const suppliersData = [
      {
        code: 'SUP001',
        name: 'Proveedor Global S.A.',
        businessName: 'Proveedor Global S.A.',
        taxId: '30-11111111-9',
        email: 'contacto@proveedorglobal.com',
        phone: '+54 11 4000-0001',
        address: 'Av. Libertador 1000',
        city: 'Buenos Aires',
        state: 'CABA',
        country: 'Argentina',
        status: 'active',
        paymentTerms: 30,
        creditLimit: 500000
      },
      {
        code: 'SUP002',
        name: 'Distribuidora Centro',
        businessName: 'Distribuidora Centro SRL',
        taxId: '30-22222222-7',
        email: 'ventas@dcentro.com',
        phone: '+54 351 500-0002',
        address: 'Bv. San Juan 250',
        city: 'Córdoba',
        state: 'Córdoba',
        country: 'Argentina',
        status: 'active',
        paymentTerms: 15,
        creditLimit: 250000
      },
      {
        code: 'SUP003',
        name: 'Tecno Norte',
        businessName: 'Tecno Norte SRL',
        taxId: '30-33333333-5',
        email: 'info@tecnonorte.com',
        phone: '+54 379 600-0003',
        address: 'Av. Costanera 800',
        city: 'Corrientes',
        state: 'Corrientes',
        country: 'Argentina',
        status: 'active',
        paymentTerms: 45,
        creditLimit: 300000
      },
      {
        code: 'SUP004',
        name: 'Textiles del Sur',
        businessName: 'Textiles del Sur S.A.',
        taxId: '30-44444444-3',
        email: 'administracion@textilessur.com',
        phone: '+54 11 7000-0004',
        address: 'Av. Mitre 1200',
        city: 'Avellaneda',
        state: 'Buenos Aires',
        country: 'Argentina',
        status: 'active',
        paymentTerms: 60,
        creditLimit: 750000
      },
      {
        code: 'SUP005',
        name: 'Librería Andina',
        businessName: 'Librería Andina SRL',
        taxId: '30-55555555-1',
        email: 'compras@libreriaandina.com',
        phone: '+54 261 800-0005',
        address: 'Av. Las Heras 500',
        city: 'Mendoza',
        state: 'Mendoza',
        country: 'Argentina',
        status: 'active',
        paymentTerms: 20,
        creditLimit: 150000
      }
    ]

    const created = []
    for (const data of suppliersData) {
      const existing = await prisma.supplier.findFirst({
        where: { companyId: company.id, code: data.code, deletedAt: null }
      })
      if (existing) {
        console.log(`↪️  Ya existe proveedor ${data.code} (${existing.name})`)
        created.push(existing)
        continue
      }
      const supplier = await prisma.supplier.create({
        data: { ...data, companyId: company.id }
      })
      console.log(`✅ Proveedor creado: ${supplier.code} - ${supplier.name}`)
      created.push(supplier)
    }

    console.log(`\n📦 Total proveedores de prueba: ${created.length}`)
    return created
  } catch (error) {
    console.error('❌ Error creando proveedores de prueba:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestSuppliers()
    .then(() => {
      console.log('\n🎉 Proceso completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Error en el proceso:', error)
      process.exit(1)
    })
}

export default createTestSuppliers
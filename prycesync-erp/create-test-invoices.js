// Script para crear facturas de prueba
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestInvoices() {
  try {
    console.log('📄 Creando facturas de prueba...');
    
    // Buscar la empresa y usuario de prueba
    const company = await prisma.company.findFirst({
      where: { taxId: '20-12345678-9' }
    });
    
    const user = await prisma.user.findFirst({
      where: { email: 'admin@empresatest.com' }
    });
    
    if (!company || !user) {
      throw new Error('Empresa o usuario de prueba no encontrados');
    }
    
    console.log('🏢 Empresa encontrada:', company.name);
    console.log('👤 Usuario encontrado:', user.name);
    
    // Crear algunos clientes de prueba
    const customers = [];
    
    const customer1 = await prisma.customer.upsert({
      where: { 
        companyId_code: {
          companyId: company.id,
          code: 'CLI001'
        }
      },
      update: {},
      create: {
        code: 'CLI001',
        name: 'Cliente Test 1',
        email: 'cliente1@test.com',
        taxId: '20-11111111-1',
        type: 'business',
        phone: '+54 11 1111-1111',
        address: 'Av. Test 123',
        city: 'Buenos Aires',
        state: 'CABA',
        country: 'Argentina',
        status: 'active',
        companyId: company.id
      }
    });
    customers.push(customer1);
    
    const customer2 = await prisma.customer.upsert({
      where: { 
        companyId_code: {
          companyId: company.id,
          code: 'CLI002'
        }
      },
      update: {},
      create: {
        code: 'CLI002',
        name: 'Cliente Test 2',
        email: 'cliente2@test.com',
        taxId: '20-22222222-2',
        type: 'individual',
        phone: '+54 11 2222-2222',
        address: 'Calle Test 456',
        city: 'Buenos Aires',
        state: 'CABA',
        country: 'Argentina',
        status: 'active',
        companyId: company.id
      }
    });
    customers.push(customer2);
    
    console.log('👥 Clientes creados:', customers.length);
    
    // Crear algunos productos de prueba
    const products = [];
    
    const product1 = await prisma.product.upsert({
      where: { 
        companyId_code: {
          companyId: company.id,
          code: 'PROD001'
        }
      },
      update: {},
      create: {
        code: 'PROD001',
        name: 'Producto Test 1',
        description: 'Descripción del producto test 1',
        salePrice: 1000.00,
        costPrice: 600.00,
        stock: 100,
        minStock: 10,
        status: 'active',
        companyId: company.id
      }
    });
    products.push(product1);
    
    const product2 = await prisma.product.upsert({
      where: { 
        companyId_code: {
          companyId: company.id,
          code: 'PROD002'
        }
      },
      update: {},
      create: {
        code: 'PROD002',
        name: 'Producto Test 2',
        description: 'Descripción del producto test 2',
        salePrice: 2500.00,
        costPrice: 1500.00,
        stock: 50,
        minStock: 5,
        status: 'active',
        companyId: company.id
      }
    });
    products.push(product2);
    
    console.log('📦 Productos creados:', products.length);
    
    // Crear facturas de prueba
    const invoices = [];
    
    // Factura 1
    const invoice1 = await prisma.invoice.create({
      data: {
        number: 'A-0001-00000001',
        type: 'A',
        status: 'sent',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        subtotal: 1000.00,
        taxAmount: 210.00,
        total: 1210.00,
        notes: 'Factura de prueba 1',
        customerId: customer1.id,
        companyId: company.id,
        items: {
          create: [{
            productId: product1.id,
            quantity: 1,
            unitPrice: 1000.00,
            discount: 0,
            taxRate: 21.00,
            subtotal: 1000.00,
            taxAmount: 210.00,
            total: 1210.00
          }]
        }
      }
    });
    invoices.push(invoice1);
    
    // Factura 2
    const invoice2 = await prisma.invoice.create({
      data: {
        number: 'B-0001-00000001',
        type: 'B',
        status: 'paid',
        issueDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-20'),
        paidDate: new Date('2024-01-25'),
        subtotal: 5000.00,
        taxAmount: 1050.00,
        total: 6050.00,
        notes: 'Factura de prueba 2 - Pagada',
        customerId: customer2.id,
        companyId: company.id,
        items: {
          create: [{
            productId: product2.id,
            quantity: 2,
            unitPrice: 2500.00,
            discount: 0,
            taxRate: 21.00,
            subtotal: 5000.00,
            taxAmount: 1050.00,
            total: 6050.00
          }]
        }
      }
    });
    invoices.push(invoice2);
    
    // Factura 3 - Draft
    const invoice3 = await prisma.invoice.create({
      data: {
        number: 'A-0001-00000002',
        type: 'A',
        status: 'draft',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        subtotal: 3500.00,
        taxAmount: 735.00,
        total: 4235.00,
        notes: 'Factura borrador',
        customerId: customer1.id,
        companyId: company.id,
        items: {
          create: [
            {
              productId: product1.id,
              quantity: 1,
              unitPrice: 1000.00,
              discount: 0,
              taxRate: 21.00,
              subtotal: 1000.00,
              taxAmount: 210.00,
              total: 1210.00
            },
            {
              productId: product2.id,
              quantity: 1,
              unitPrice: 2500.00,
              discount: 0,
              taxRate: 21.00,
              subtotal: 2500.00,
              taxAmount: 525.00,
              total: 3025.00
            }
          ]
        }
      }
    });
    invoices.push(invoice3);
    
    console.log('✅ Facturas de prueba creadas exitosamente:');
    invoices.forEach((invoice, index) => {
      console.log(`📄 Factura ${index + 1}:`);
      console.log(`   - Número: ${invoice.number}`);
      console.log(`   - Tipo: ${invoice.type}`);
      console.log(`   - Estado: ${invoice.status}`);
      console.log(`   - Total: $${invoice.total}`);
    });
    
    return invoices;
    
  } catch (error) {
    console.error('❌ Error creando facturas de prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
createTestInvoices().catch(console.error);
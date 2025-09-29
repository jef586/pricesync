// Script para crear más facturas de prueba con números únicos
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMoreTestInvoices() {
  try {
    console.log('📄 Creando más facturas de prueba...');
    
    // Buscar la empresa y usuario de prueba
    const company = await prisma.company.findFirst({
      where: { taxId: '20-12345678-9' }
    });
    
    if (!company) {
      throw new Error('Empresa de prueba no encontrada');
    }
    
    console.log('🏢 Empresa encontrada:', company.name);
    
    // Buscar clientes existentes
    const customers = await prisma.customer.findMany({
      where: { companyId: company.id },
      take: 2
    });
    
    if (customers.length === 0) {
      throw new Error('No hay clientes disponibles');
    }
    
    // Buscar productos existentes
    const products = await prisma.product.findMany({
      where: { companyId: company.id },
      take: 2
    });
    
    if (products.length === 0) {
      throw new Error('No hay productos disponibles');
    }
    
    console.log('👥 Clientes encontrados:', customers.length);
    console.log('📦 Productos encontrados:', products.length);
    
    // Obtener el último número de factura para cada tipo
    const lastInvoiceA = await prisma.invoice.findFirst({
      where: { 
        companyId: company.id,
        type: 'A'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const lastInvoiceB = await prisma.invoice.findFirst({
      where: { 
        companyId: company.id,
        type: 'B'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Generar números únicos
    let nextNumberA = 3;
    let nextNumberB = 2;
    
    if (lastInvoiceA) {
      const match = lastInvoiceA.number.match(/(\d+)$/);
      if (match) {
        nextNumberA = parseInt(match[1]) + 1;
      }
    }
    
    if (lastInvoiceB) {
      const match = lastInvoiceB.number.match(/(\d+)$/);
      if (match) {
        nextNumberB = parseInt(match[1]) + 1;
      }
    }
    
    console.log('🔢 Próximo número A:', nextNumberA);
    console.log('🔢 Próximo número B:', nextNumberB);
    
    // Crear facturas con diferentes estados y fechas
    const invoices = [];
    
    // Factura pagada reciente
    const invoice1 = await prisma.invoice.create({
      data: {
        number: `A-0001-${String(nextNumberA).padStart(8, '0')}`,
        type: 'A',
        status: 'paid',
        issueDate: new Date('2024-12-01'),
        dueDate: new Date('2024-12-31'),
        paidDate: new Date('2024-12-05'),
        subtotal: 2500.00,
        taxAmount: 525.00,
        total: 3025.00,
        notes: 'Factura pagada - Diciembre 2024',
        customerId: customers[0].id,
        companyId: company.id,
        items: {
          create: [{
            productId: products[0].id,
            quantity: 2,
            unitPrice: 1250.00,
            discount: 0,
            taxRate: 21.00,
            subtotal: 2500.00,
            taxAmount: 525.00,
            total: 3025.00
          }]
        }
      }
    });
    invoices.push(invoice1);
    nextNumberA++;
    
    // Factura pendiente
    const invoice2 = await prisma.invoice.create({
      data: {
        number: `B-0001-${String(nextNumberB).padStart(8, '0')}`,
        type: 'B',
        status: 'pending',
        issueDate: new Date('2024-12-10'),
        dueDate: new Date('2025-01-10'),
        subtotal: 1800.00,
        taxAmount: 378.00,
        total: 2178.00,
        notes: 'Factura pendiente de pago',
        customerId: customers[1].id,
        companyId: company.id,
        items: {
          create: [{
            productId: products[1].id,
            quantity: 1,
            unitPrice: 1800.00,
            discount: 0,
            taxRate: 21.00,
            subtotal: 1800.00,
            taxAmount: 378.00,
            total: 2178.00
          }]
        }
      }
    });
    invoices.push(invoice2);
    nextNumberB++;
    
    // Factura vencida
    const invoice3 = await prisma.invoice.create({
      data: {
        number: `A-0001-${String(nextNumberA).padStart(8, '0')}`,
        type: 'A',
        status: 'overdue',
        issueDate: new Date('2024-11-01'),
        dueDate: new Date('2024-11-30'),
        subtotal: 3200.00,
        taxAmount: 672.00,
        total: 3872.00,
        notes: 'Factura vencida - Noviembre 2024',
        customerId: customers[0].id,
        companyId: company.id,
        items: {
          create: [{
            productId: products[0].id,
            quantity: 3,
            unitPrice: 1066.67,
            discount: 0,
            taxRate: 21.00,
            subtotal: 3200.00,
            taxAmount: 672.00,
            total: 3872.00
          }]
        }
      }
    });
    invoices.push(invoice3);
    nextNumberA++;
    
    // Factura cancelada
    const invoice4 = await prisma.invoice.create({
      data: {
        number: `B-0001-${String(nextNumberB).padStart(8, '0')}`,
        type: 'B',
        status: 'cancelled',
        issueDate: new Date('2024-12-05'),
        dueDate: new Date('2025-01-05'),
        subtotal: 1500.00,
        taxAmount: 315.00,
        total: 1815.00,
        notes: 'Factura cancelada por el cliente',
        customerId: customers[1].id,
        companyId: company.id,
        items: {
          create: [{
            productId: products[1].id,
            quantity: 1,
            unitPrice: 1500.00,
            discount: 0,
            taxRate: 21.00,
            subtotal: 1500.00,
            taxAmount: 315.00,
            total: 1815.00
          }]
        }
      }
    });
    invoices.push(invoice4);
    nextNumberB++;
    
    // Más facturas pagadas para generar datos históricos
    const dates = [
      { issue: '2024-11-15', due: '2024-12-15', paid: '2024-11-20' },
      { issue: '2024-11-20', due: '2024-12-20', paid: '2024-11-25' },
      { issue: '2024-12-01', due: '2024-12-31', paid: '2024-12-03' },
      { issue: '2024-12-15', due: '2025-01-15', paid: '2024-12-18' }
    ];
    
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const amount = 1000 + (i * 500);
      const tax = amount * 0.21;
      const total = amount + tax;
      
      const invoice = await prisma.invoice.create({
        data: {
          number: `A-0001-${String(nextNumberA).padStart(8, '0')}`,
          type: 'A',
          status: 'paid',
          issueDate: new Date(date.issue),
          dueDate: new Date(date.due),
          paidDate: new Date(date.paid),
          subtotal: amount,
          taxAmount: tax,
          total: total,
          notes: `Factura histórica ${i + 1}`,
          customerId: customers[i % customers.length].id,
          companyId: company.id,
          items: {
            create: [{
              productId: products[i % products.length].id,
              quantity: 1,
              unitPrice: amount,
              discount: 0,
              taxRate: 21.00,
              subtotal: amount,
              taxAmount: tax,
              total: total
            }]
          }
        }
      });
      invoices.push(invoice);
      nextNumberA++;
    }
    
    console.log(`✅ Creadas ${invoices.length} facturas de prueba exitosamente`);
    
    // Mostrar resumen
    const summary = await prisma.invoice.groupBy({
      by: ['status'],
      where: { companyId: company.id },
      _count: { status: true },
      _sum: { total: true }
    });
    
    console.log('\n📊 Resumen de facturas por estado:');
    summary.forEach(item => {
      console.log(`   ${item.status}: ${item._count.status} facturas, Total: $${item._sum.total || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Error creando facturas de prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createMoreTestInvoices().catch(console.error);
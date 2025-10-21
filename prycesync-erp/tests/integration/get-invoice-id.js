import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getInvoiceId() {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { deletedAt: null },
      select: { id: true, number: true }
    });
    
    if (invoice) {
      console.log('ID de factura encontrado:', invoice.id);
      console.log('Número de factura:', invoice.number);
      console.log('Longitud del ID:', invoice.id.length);
      console.log('Patrón CUID:', /^c[a-z0-9]{24}$/.test(invoice.id));
    } else {
      console.log('No se encontraron facturas');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getInvoiceId();
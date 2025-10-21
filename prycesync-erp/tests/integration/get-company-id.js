import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCompanyId() {
  try {
    const company = await prisma.company.findFirst({
      where: { name: 'Empresa Test S.A.' }
    });
    
    if (company) {
      console.log('Company ID:', company.id);
      console.log('Company Name:', company.name);
      console.log('Company Email:', company.email);
    } else {
      console.log('No se encontró la empresa de prueba');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCompanyId();
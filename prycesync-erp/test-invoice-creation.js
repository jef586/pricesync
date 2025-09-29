import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function authenticate() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@empresatest.com',
      password: 'admin123'
    });
    
    if (response.data && response.data.data && response.data.data.tokens) {
      return response.data.data.tokens.accessToken;
    }
    return null;
  } catch (error) {
    console.error('Error en autenticación:', error.response?.data || error.message);
    return null;
  }
}

async function checkExistingInvoices(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 FACTURAS EXISTENTES:');
    console.log('Total:', response.data.data.total);
    response.data.data.invoices.forEach(invoice => {
      console.log(`  - ID: ${invoice.id}, Número: ${invoice.number}, Tipo: ${invoice.type}, Estado: ${invoice.status}`);
    });
    
    return response.data.data.invoices;
  } catch (error) {
    console.error('Error obteniendo facturas:', error.response?.data || error.message);
    return [];
  }
}

async function createInvoice(token, invoiceData) {
  try {
    console.log('\n🔨 INTENTANDO CREAR FACTURA:');
    console.log('Datos:', JSON.stringify(invoiceData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/invoices`, invoiceData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Factura creada exitosamente:');
    console.log(`  - ID: ${response.data.data.id}`);
    console.log(`  - Número: ${response.data.data.number}`);
    console.log(`  - Tipo: ${response.data.data.type}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creando factura:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 DIAGNÓSTICO DE CREACIÓN DE FACTURAS');
  console.log('======================================================================');
  
  // Autenticar
  console.log('🔐 Autenticando...');
  const token = await authenticate();
  if (!token) {
    console.error('❌ No se pudo autenticar');
    return;
  }
  console.log('✅ Autenticación exitosa');
  
  // Verificar facturas existentes
  const existingInvoices = await checkExistingInvoices(token);
  
  // Intentar crear facturas de diferentes tipos
  const testInvoices = [
    {
      type: 'A',
      customerId: 'cmg1797f5000imiofrltijhte',
      items: [
        {
          description: 'Producto Test A',
          quantity: 1,
          unitPrice: 100.00,
          taxRate: 21.00
        }
      ]
    },
    {
      type: 'B',
      customerId: 'cmg1797f5000imiofrltijhte',
      items: [
        {
          description: 'Producto Test B',
          quantity: 2,
          unitPrice: 50.00,
          taxRate: 21.00
        }
      ]
    },
    {
      type: 'C',
      customerId: 'cmg1797f5000imiofrltijhte',
      items: [
        {
          description: 'Producto Test C',
          quantity: 1,
          unitPrice: 75.00,
          taxRate: 21.00
        }
      ]
    }
  ];
  
  for (const invoiceData of testInvoices) {
    console.log(`\n📝 Probando creación de factura tipo ${invoiceData.type}:`);
    await createInvoice(token, invoiceData);
    
    // Pequeña pausa entre creaciones
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📋 FACTURAS DESPUÉS DE LAS PRUEBAS:');
  await checkExistingInvoices(token);
  
  console.log('\n✨ DIAGNÓSTICO COMPLETADO');
}

main().catch(console.error);
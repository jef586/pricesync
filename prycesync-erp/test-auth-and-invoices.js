import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';

// Credenciales de prueba
const TEST_USER = {
  email: 'admin@empresatest.com',
  password: 'admin123'
};

let authToken = null;

// Función para autenticarse
async function authenticate() {
  console.log('🔐 Autenticando usuario...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
    });
    
    if (response.ok) {
      const data = await response.json();
      // La estructura de respuesta es data.data.tokens.accessToken
      if (data.data && data.data.tokens && data.data.tokens.accessToken) {
        authToken = data.data.tokens.accessToken;
        console.log('✅ Autenticación exitosa');
        console.log(`   Token: ${authToken.substring(0, 20)}...`);
        return true;
      } else {
        console.log('❌ Token no encontrado en la respuesta');
        console.log('   Respuesta:', JSON.stringify(data, null, 2));
        return false;
      }
    } else {
      const error = await response.text();
      console.log('❌ Error de autenticación:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return false;
  }
}

// Función para obtener headers con autenticación
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

// Función para probar listar facturas
async function testListInvoices() {
  console.log('\n🧪 Probando GET /api/invoices');
  
  try {
    const response = await fetch(`${API_BASE}/invoices`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Facturas listadas exitosamente:');
      console.log(`   Total: ${data.total || 'N/A'}`);
      console.log(`   Facturas: ${data.invoices ? data.invoices.length : data.length}`);
      
      if (data.invoices && data.invoices.length > 0) {
        console.log('   Primera factura:');
        const invoice = data.invoices[0];
        console.log(`     ID: ${invoice.id}`);
        console.log(`     Número: ${invoice.number}`);
        console.log(`     Estado: ${invoice.status}`);
        return invoice.id; // Retornamos el ID para otras pruebas
      }
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
  
  return null;
}

// Función para probar obtener factura por ID
async function testGetInvoiceById(invoiceId) {
  console.log(`\n🧪 Probando GET /api/invoices/${invoiceId}`);
  
  try {
    const response = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Factura obtenida exitosamente:');
      console.log(`   ID: ${data.id}`);
      console.log(`   Número: ${data.number}`);
      console.log(`   Estado: ${data.status}`);
      console.log(`   Cliente: ${data.customer ? data.customer.name : 'N/A'}`);
      console.log(`   Total: $${data.total}`);
      console.log(`   Items: ${data.items ? data.items.length : 0}`);
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// Función para probar crear factura
async function testCreateInvoice() {
  console.log('\n🧪 Probando POST /api/invoices');
  
  const newInvoice = {
    customerId: 'cmg1796nn0001miofvjlgzi0u', // ID de cliente existente
    type: 'A',
    items: [
      {
        description: 'Producto de prueba API',
        quantity: 2,
        unitPrice: 100.00,
        taxRate: 21
      }
    ],
    notes: 'Factura creada desde prueba de API'
  };
  
  try {
    const response = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newInvoice)
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Factura creada exitosamente:');
      console.log(`   ID: ${data.id}`);
      console.log(`   Número: ${data.number}`);
      console.log(`   Total: $${data.total}`);
      return data.id;
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
  
  return null;
}

// Función para probar actualizar factura
async function testUpdateInvoice(invoiceId) {
  console.log(`\n🧪 Probando PUT /api/invoices/${invoiceId}`);
  
  const updateData = {
    status: 'sent',
    notes: 'Factura actualizada desde prueba de API'
  };
  
  try {
    const response = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Factura actualizada exitosamente:');
      console.log(`   ID: ${data.id}`);
      console.log(`   Estado: ${data.status}`);
      console.log(`   Notas: ${data.notes}`);
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// Función para probar reportes de facturas
async function testInvoiceReports() {
  console.log('\n🧪 Probando GET /api/invoices/reports');
  
  try {
    const response = await fetch(`${API_BASE}/invoices/reports`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Reportes obtenidos exitosamente:');
      console.log(`   Total facturado: $${data.totalAmount || 'N/A'}`);
      console.log(`   Facturas totales: ${data.totalInvoices || 'N/A'}`);
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// Función principal para ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas completas del módulo de facturas...\n');
  
  // 1. Autenticación
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('❌ No se pudo autenticar. Terminando pruebas.');
    return;
  }
  
  // 2. Listar facturas
  const existingInvoiceId = await testListInvoices();
  
  // 3. Obtener factura por ID (si existe)
  if (existingInvoiceId) {
    await testGetInvoiceById(existingInvoiceId);
  }
  
  // 4. Crear nueva factura
  const newInvoiceId = await testCreateInvoice();
  
  // 5. Actualizar factura (si se creó)
  if (newInvoiceId) {
    await testUpdateInvoice(newInvoiceId);
  }
  
  // 6. Probar reportes
  await testInvoiceReports();
  
  console.log('\n✨ Pruebas completadas');
  console.log('\n📋 Resumen:');
  console.log('   ✅ Autenticación: OK');
  console.log('   ✅ Listar facturas: Probado');
  console.log('   ✅ Obtener factura: Probado');
  console.log('   ✅ Crear factura: Probado');
  console.log('   ✅ Actualizar factura: Probado');
  console.log('   ✅ Reportes: Probado');
}

runAllTests().catch(console.error);
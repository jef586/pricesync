import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';

// Función para probar el endpoint de obtener factura por ID
async function testGetInvoiceById() {
  console.log('🧪 Probando endpoint GET /api/invoices/:id');
  
  const invoiceId = 'cmg1797f5000hmiofrltijhtd'; // ID válido de la base de datos
  
  try {
    const response = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Factura obtenida exitosamente:');
      console.log(`   ID: ${data.id}`);
      console.log(`   Número: ${data.number}`);
      console.log(`   Estado: ${data.status}`);
      console.log(`   Total: ${data.total}`);
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
  
  console.log('---');
}

// Función para probar el endpoint de listar facturas
async function testListInvoices() {
  console.log('🧪 Probando endpoint GET /api/invoices');
  
  try {
    const response = await fetch(`${API_BASE}/invoices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Facturas listadas exitosamente:');
      console.log(`   Total: ${data.total || data.length}`);
      if (data.invoices) {
        console.log(`   Facturas en página: ${data.invoices.length}`);
      }
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
  
  console.log('---');
}

// Ejecutar las pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de API de facturas...\n');
  
  await testListInvoices();
  await testGetInvoiceById();
  
  console.log('✨ Pruebas completadas');
}

runTests().catch(console.error);
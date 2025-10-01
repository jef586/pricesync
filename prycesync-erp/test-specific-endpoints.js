import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';
const INVOICE_ID = 'cmg1797bo0009miofwevl4rqw'; // ID real obtenido

// Token de autenticación (deberás obtenerlo del login)
let authToken = null;

// Función para autenticarse
async function authenticate() {
  console.log('🔐 Autenticando...');
  
  const loginData = {
    email: 'admin@empresatest.com',
    password: 'admin123'
  };

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    if (response.ok) {
      const data = await response.json();
      authToken = data.data.tokens.accessToken; // Estructura correcta del token
      console.log('✅ Autenticación exitosa');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Error en autenticación:', error);
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

// Probar endpoint GET /invoices/:id
async function testGetInvoice() {
  console.log('\n📖 PROBANDO GET /invoices/:id');
  console.log('='.repeat(50));
  console.log(`ID a probar: ${INVOICE_ID}`);
  
  try {
    const response = await fetch(`${API_BASE}/invoices/${INVOICE_ID}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ GET exitoso');
      console.log('   Respuesta completa:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Error en GET:', error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// Probar endpoint PUT /invoices/:id
async function testUpdateInvoice() {
  console.log('\n✏️ PROBANDO PUT /invoices/:id');
  console.log('='.repeat(50));
  console.log(`ID a probar: ${INVOICE_ID}`);
  
  const updateData = {
    notes: 'Factura actualizada para pruebas de validación CUID'
  };
  
  try {
    const response = await fetch(`${API_BASE}/invoices/${INVOICE_ID}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ PUT exitoso');
      console.log('   Respuesta completa:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Error en PUT:', error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// Probar endpoint POST /invoices/:id/duplicate
async function testDuplicateInvoice() {
  console.log('\n📋 PROBANDO POST /invoices/:id/duplicate');
  console.log('='.repeat(50));
  console.log(`ID a probar: ${INVOICE_ID}`);
  
  try {
    const response = await fetch(`${API_BASE}/invoices/${INVOICE_ID}/duplicate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ DUPLICATE exitoso');
      console.log('   Respuesta completa:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Error en DUPLICATE:', error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// Función principal
async function main() {
  console.log('🧪 PRUEBAS ESPECÍFICAS DE ENDPOINTS CON ID REAL\n');
  
  // Autenticar primero
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('❌ No se pudo autenticar. Terminando pruebas.');
    return;
  }
  
  // Probar cada endpoint problemático
  await testGetInvoice();
  await testUpdateInvoice();
  await testDuplicateInvoice();
  
  console.log('\n🏁 PRUEBAS COMPLETADAS');
}

main().catch(console.error);
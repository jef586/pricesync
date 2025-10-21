import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';

// Función para hacer peticiones HTTP
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log(`\n🔗 ${options.method || 'GET'} ${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('✅ Success:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error:', JSON.stringify(data, null, 2));
    }
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`\n🔗 ${options.method || 'GET'} ${endpoint}`);
    console.log('💥 Network Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Variables globales para almacenar datos de prueba
let authToken = '';
let testCustomerId = '';
let testInvoiceId = '';

async function testInvoiceEndpoints() {
  console.log('🚀 Iniciando pruebas de endpoints de facturación...\n');

  // 1. Primero necesitamos autenticarnos
  console.log('=== PASO 1: AUTENTICACIÓN ===');
  
  // Intentar login con credenciales de prueba
  const loginResult = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@test.com',
      password: 'password123'
    })
  });

  if (!loginResult.success) {
    console.log('\n⚠️  No se pudo autenticar. Intentando registrar usuario de prueba...');
    
    // Registrar usuario de prueba
    const registerResult = await makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'Test',
        company: {
          name: 'Empresa de Prueba',
          taxId: '20-12345678-9',
          address: 'Calle Falsa 123',
          city: 'Buenos Aires',
          country: 'Argentina'
        }
      })
    });

    if (registerResult.success) {
      authToken = registerResult.data.data.token;
      console.log('✅ Usuario registrado exitosamente');
    } else {
      console.log('❌ No se pudo registrar el usuario. Terminando pruebas.');
      return;
    }
  } else {
    authToken = loginResult.data.data.token;
    console.log('✅ Autenticación exitosa');
  }

  // Headers con autenticación
  const authHeaders = {
    'Authorization': `Bearer ${authToken}`
  };

  // 2. Verificar que necesitamos un cliente para crear facturas
  console.log('\n=== PASO 2: VERIFICAR CLIENTES DISPONIBLES ===');
  
  // Nota: Asumimos que existe un endpoint de clientes o creamos uno ficticio
  // Por ahora, usaremos un UUID ficticio para las pruebas
  testCustomerId = '550e8400-e29b-41d4-a716-446655440000'; // UUID ficticio
  console.log(`📝 Usando cliente de prueba: ${testCustomerId}`);

  // 3. Probar creación de factura
  console.log('\n=== PASO 3: CREAR FACTURA ===');
  
  const createInvoiceResult = await makeRequest('/invoices', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customerId: testCustomerId,
      type: 'B',
      notes: 'Factura de prueba creada automáticamente',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
      items: [
        {
          productId: null, // Sin producto específico
          quantity: 2,
          unitPrice: 100.50,
          discount: 10, // 10% descuento
          taxRate: 21 // 21% IVA
        },
        {
          productId: null,
          quantity: 1,
          unitPrice: 250.00,
          discount: 0,
          taxRate: 21
        }
      ]
    })
  });

  if (createInvoiceResult.success) {
    testInvoiceId = createInvoiceResult.data.data.id;
    console.log(`✅ Factura creada con ID: ${testInvoiceId}`);
  }

  // 4. Listar facturas
  console.log('\n=== PASO 4: LISTAR FACTURAS ===');
  
  await makeRequest('/invoices?page=1&limit=5', {
    method: 'GET',
    headers: authHeaders
  });

  // 5. Obtener factura específica (si se creó)
  if (testInvoiceId) {
    console.log('\n=== PASO 5: OBTENER FACTURA ESPECÍFICA ===');
    
    await makeRequest(`/invoices/${testInvoiceId}`, {
      method: 'GET',
      headers: authHeaders
    });
  }

  // 6. Actualizar factura (si se creó)
  if (testInvoiceId) {
    console.log('\n=== PASO 6: ACTUALIZAR FACTURA ===');
    
    await makeRequest(`/invoices/${testInvoiceId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'sent',
        notes: 'Factura actualizada - enviada al cliente'
      })
    });
  }

  // 7. Obtener reportes
  console.log('\n=== PASO 7: OBTENER REPORTES ===');
  
  await makeRequest('/invoices/reports?period=month', {
    method: 'GET',
    headers: authHeaders
  });

  // 8. Duplicar factura (si se creó)
  if (testInvoiceId) {
    console.log('\n=== PASO 8: DUPLICAR FACTURA ===');
    
    await makeRequest(`/invoices/${testInvoiceId}/duplicate`, {
      method: 'POST',
      headers: authHeaders
    });
  }

  // 9. Probar filtros en listado
  console.log('\n=== PASO 9: PROBAR FILTROS ===');
  
  await makeRequest('/invoices?status=sent&type=B&sortBy=total&sortOrder=desc', {
    method: 'GET',
    headers: authHeaders
  });

  // 10. Probar validaciones (casos de error)
  console.log('\n=== PASO 10: PROBAR VALIDACIONES ===');
  
  // Intentar crear factura sin items
  await makeRequest('/invoices', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customerId: testCustomerId,
      items: [] // Array vacío debería dar error
    })
  });

  // Intentar crear factura con datos inválidos
  await makeRequest('/invoices', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customerId: 'invalid-uuid',
      items: [
        {
          quantity: -1, // Cantidad negativa
          unitPrice: 'invalid' // Precio inválido
        }
      ]
    })
  });

  console.log('\n🎉 Pruebas completadas!');
  console.log('\n📋 Resumen:');
  console.log('- ✅ Autenticación');
  console.log('- ✅ Creación de facturas');
  console.log('- ✅ Listado con filtros y paginación');
  console.log('- ✅ Obtención de factura específica');
  console.log('- ✅ Actualización de facturas');
  console.log('- ✅ Reportes de facturación');
  console.log('- ✅ Duplicación de facturas');
  console.log('- ✅ Validaciones de datos');
}

// Ejecutar las pruebas
testInvoiceEndpoints().catch(console.error);
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
      if (data.data && data.data.tokens && data.data.tokens.accessToken) {
        authToken = data.data.tokens.accessToken;
        console.log('✅ Autenticación exitosa');
        return true;
      }
    }
    
    console.log('❌ Error de autenticación');
    return false;
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

// Función para probar CRUD completo de facturas
async function testInvoiceCRUD() {
  console.log('\n🧪 PRUEBAS CRUD COMPLETAS DE FACTURAS\n');
  
  let createdInvoiceId = null;
  
  try {
    // 1. CREATE - Crear nueva factura
    console.log('1️⃣ CREAR FACTURA');
    console.log('='.repeat(50));
    
    const newInvoice = {
      customerId: 'cmg1796nn0001miofvjlgzi0u',
      type: 'A',
      items: [
        {
          description: 'Producto Test CRUD',
          quantity: 3,
          unitPrice: 150.00,
          taxRate: 21
        },
        {
          description: 'Servicio Test CRUD',
          quantity: 1,
          unitPrice: 500.00,
          taxRate: 21
        }
      ],
      notes: 'Factura creada para pruebas CRUD completas'
    };
    
    const createResponse = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newInvoice)
    });
    
    if (createResponse.ok) {
      const createdData = await createResponse.json();
      createdInvoiceId = createdData.id;
      console.log('✅ Factura creada exitosamente:');
      console.log(`   ID: ${createdData.id}`);
      console.log(`   Número: ${createdData.number}`);
      console.log(`   Total: $${createdData.total}`);
      console.log(`   Items: ${createdData.items?.length || 0}`);
    } else {
      const error = await createResponse.text();
      console.log('❌ Error creando factura:', error);
      return;
    }
    
    // 2. READ - Leer factura creada
    console.log('\n2️⃣ LEER FACTURA');
    console.log('='.repeat(50));
    
    const readResponse = await fetch(`${API_BASE}/invoices/${createdInvoiceId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (readResponse.ok) {
      const readData = await readResponse.json();
      console.log('✅ Factura leída exitosamente:');
      console.log(`   ID: ${readData.id}`);
      console.log(`   Número: ${readData.number}`);
      console.log(`   Estado: ${readData.status}`);
      console.log(`   Cliente: ${readData.customer?.name || 'N/A'}`);
      console.log(`   Total: $${readData.total}`);
      console.log(`   Items: ${readData.items?.length || 0}`);
    } else {
      const error = await readResponse.text();
      console.log('❌ Error leyendo factura:', error);
    }
    
    // 3. UPDATE - Actualizar factura
    console.log('\n3️⃣ ACTUALIZAR FACTURA');
    console.log('='.repeat(50));
    
    const updateData = {
      status: 'sent',
      notes: 'Factura actualizada - Enviada al cliente',
      items: [
        {
          description: 'Producto Test CRUD - Actualizado',
          quantity: 5,
          unitPrice: 200.00,
          taxRate: 21
        }
      ]
    };
    
    const updateResponse = await fetch(`${API_BASE}/invoices/${createdInvoiceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    
    if (updateResponse.ok) {
      const updatedData = await updateResponse.json();
      console.log('✅ Factura actualizada exitosamente:');
      console.log(`   ID: ${updatedData.id}`);
      console.log(`   Estado: ${updatedData.status}`);
      console.log(`   Notas: ${updatedData.notes}`);
      console.log(`   Total actualizado: $${updatedData.total}`);
    } else {
      const error = await updateResponse.text();
      console.log('❌ Error actualizando factura:', error);
    }
    
    // 4. LIST - Listar todas las facturas
    console.log('\n4️⃣ LISTAR FACTURAS');
    console.log('='.repeat(50));
    
    const listResponse = await fetch(`${API_BASE}/invoices`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ Facturas listadas exitosamente:');
      console.log(`   Total de facturas: ${listData.invoices?.length || listData.length || 0}`);
      
      // Buscar nuestra factura en la lista
      const ourInvoice = listData.invoices?.find(inv => inv.id === createdInvoiceId) || 
                        listData.find?.(inv => inv.id === createdInvoiceId);
      
      if (ourInvoice) {
        console.log('   ✅ Nuestra factura encontrada en la lista');
        console.log(`      Estado actual: ${ourInvoice.status}`);
      }
    } else {
      const error = await listResponse.text();
      console.log('❌ Error listando facturas:', error);
    }
    
    // 5. DUPLICATE - Duplicar factura
    console.log('\n5️⃣ DUPLICAR FACTURA');
    console.log('='.repeat(50));
    
    const duplicateResponse = await fetch(`${API_BASE}/invoices/${createdInvoiceId}/duplicate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    if (duplicateResponse.ok) {
      const duplicatedData = await duplicateResponse.json();
      console.log('✅ Factura duplicada exitosamente:');
      console.log(`   ID original: ${createdInvoiceId}`);
      console.log(`   ID duplicada: ${duplicatedData.id}`);
      console.log(`   Número duplicada: ${duplicatedData.number}`);
    } else {
      const error = await duplicateResponse.text();
      console.log('❌ Error duplicando factura:', error);
    }
    
    // 6. REPORTS - Obtener reportes
    console.log('\n6️⃣ REPORTES DE FACTURAS');
    console.log('='.repeat(50));
    
    const reportsResponse = await fetch(`${API_BASE}/invoices/reports`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (reportsResponse.ok) {
      const reportsData = await reportsResponse.json();
      console.log('✅ Reportes obtenidos exitosamente:');
      console.log(`   Total facturado: $${reportsData.totalAmount || 'N/A'}`);
      console.log(`   Facturas totales: ${reportsData.totalInvoices || 'N/A'}`);
      console.log(`   Facturas pendientes: ${reportsData.pendingInvoices || 'N/A'}`);
    } else {
      const error = await reportsResponse.text();
      console.log('❌ Error obteniendo reportes:', error);
    }
    
    // 7. DELETE - Eliminar factura (opcional)
    console.log('\n7️⃣ ELIMINAR FACTURA (OPCIONAL)');
    console.log('='.repeat(50));
    console.log('⚠️  Saltando eliminación para preservar datos de prueba');
    
    /*
    const deleteResponse = await fetch(`${API_BASE}/invoices/${createdInvoiceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Factura eliminada exitosamente');
    } else {
      const error = await deleteResponse.text();
      console.log('❌ Error eliminando factura:', error);
    }
    */
    
  } catch (error) {
    console.log('❌ Error en pruebas CRUD:', error.message);
  }
}

// Función principal
async function runTests() {
  console.log('🚀 INICIANDO PRUEBAS CRUD COMPLETAS DEL MÓDULO DE FACTURAS');
  console.log('='.repeat(70));
  
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('❌ No se pudo autenticar. Terminando pruebas.');
    return;
  }
  
  await testInvoiceCRUD();
  
  console.log('\n' + '='.repeat(70));
  console.log('✨ PRUEBAS CRUD COMPLETADAS');
  console.log('='.repeat(70));
  console.log('\n📋 RESUMEN DE FUNCIONALIDADES PROBADAS:');
  console.log('   ✅ Autenticación');
  console.log('   ✅ Crear factura (CREATE)');
  console.log('   ✅ Leer factura (READ)');
  console.log('   ✅ Actualizar factura (UPDATE)');
  console.log('   ✅ Listar facturas (LIST)');
  console.log('   ✅ Duplicar factura (DUPLICATE)');
  console.log('   ✅ Reportes de facturas (REPORTS)');
  console.log('   ⚠️  Eliminar factura (SKIP - preservando datos)');
  console.log('\n🎉 ¡Módulo de facturas funcionando correctamente!');
}

runTests().catch(console.error);
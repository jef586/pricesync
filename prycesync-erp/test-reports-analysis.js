import fetch from 'node-fetch';

const API_BASE = 'http://127.0.0.1:3002/api';

let authToken = null;

// Función para obtener headers de autenticación
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

// Función de autenticación
async function authenticate() {
  console.log('🔐 Autenticando usuario...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@empresatest.com',
        password: 'admin123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      authToken = data.data.tokens.accessToken;
      console.log('✅ Autenticación exitosa');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Error en autenticación:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error de conexión en autenticación:', error.message);
    return false;
  }
}

// Función para probar reportes de InvoiceController
async function testInvoiceReports() {
  console.log('\n📊 PROBANDO /invoices/reports (InvoiceController)');
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(`${API_BASE}/invoices/reports`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Respuesta exitosa');
      console.log('📋 Estructura de respuesta:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// Función para probar reportes de ReportsController
async function testReportsController() {
  console.log('\n📊 PROBANDO /reports/* (ReportsController)');
  console.log('='.repeat(60));
  
  const endpoints = [
    '/reports/dashboard/metrics',
    '/reports/invoices/chart',
    '/reports/sales/summary',
    '/reports/invoices/status-distribution',
    '/reports/invoices/monthly-summary'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Probando ${endpoint}:`);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Respuesta exitosa');
        
        // Mostrar solo un resumen de los datos para no saturar la consola
        if (data.data) {
          console.log('   📋 Datos principales:');
          if (typeof data.data === 'object') {
            Object.keys(data.data).forEach(key => {
              const value = data.data[key];
              if (typeof value === 'number') {
                console.log(`      ${key}: ${value}`);
              } else if (Array.isArray(value)) {
                console.log(`      ${key}: [${value.length} elementos]`);
              } else if (typeof value === 'object' && value !== null) {
                console.log(`      ${key}: {objeto con ${Object.keys(value).length} propiedades}`);
              } else {
                console.log(`      ${key}: ${value}`);
              }
            });
          }
        }
      } else {
        const error = await response.text();
        console.log(`   ❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
    }
  }
}

// Función para verificar datos en la base de datos
async function checkDatabaseData() {
  console.log('\n🗄️ VERIFICANDO DATOS EN LA BASE DE DATOS');
  console.log('='.repeat(60));
  
  try {
    // Obtener facturas para verificar si hay datos
    const response = await fetch(`${API_BASE}/invoices?limit=5`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Facturas encontradas: ${data.data?.length || 0}`);
      
      if (data.data && data.data.length > 0) {
        console.log('📋 Muestra de facturas:');
        data.data.forEach((invoice, index) => {
          console.log(`   ${index + 1}. ID: ${invoice.id}`);
          console.log(`      Número: ${invoice.number}`);
          console.log(`      Total: $${invoice.total}`);
          console.log(`      Estado: ${invoice.status}`);
          console.log(`      Fecha: ${invoice.issueDate}`);
        });
      } else {
        console.log('⚠️ No se encontraron facturas en la base de datos');
      }
    } else {
      const error = await response.text();
      console.log('❌ Error obteniendo facturas:', error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// Función principal
async function main() {
  console.log('🚀 ANÁLISIS DE REPORTES - PRYCESYNC ERP');
  console.log('='.repeat(60));
  
  // Autenticar
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('❌ No se pudo autenticar. Terminando...');
    return;
  }

  // Verificar datos en la base de datos
  await checkDatabaseData();

  // Probar reportes de InvoiceController
  await testInvoiceReports();

  // Probar reportes de ReportsController
  await testReportsController();

  console.log('\n✅ Análisis completado');
}

// Ejecutar
main().catch(console.error);
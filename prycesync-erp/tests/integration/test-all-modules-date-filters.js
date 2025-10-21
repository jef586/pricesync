import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';

// Configuración de autenticación
let authToken = null;

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

// Función para autenticarse
async function authenticate() {
  console.log('🔐 Autenticando usuario...');
  
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
    console.log('❌ Error en autenticación');
    return false;
  }
}

// Función para probar un endpoint con filtros de fecha
async function testEndpointWithDateFilters(endpoint, params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const url = `${API_BASE}${endpoint}${queryParams ? '?' + queryParams : ''}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    const result = {
      endpoint,
      status: response.status,
      success: response.ok,
      params
    };
    
    if (response.ok) {
      const data = await response.json();
      result.data = data;
      
      // Verificar si incluye información del período
      if (data.data && data.data.period) {
        result.periodInfo = data.data.period;
      }
      
      // Contar elementos en arrays
      if (data.data) {
        Object.keys(data.data).forEach(key => {
          if (Array.isArray(data.data[key])) {
            result[`${key}_count`] = data.data[key].length;
          }
        });
      }
    } else {
      const errorData = await response.json();
      result.error = errorData.error || 'Error desconocido';
    }
    
    return result;
  } catch (error) {
    return {
      endpoint,
      status: 'ERROR',
      success: false,
      error: error.message,
      params
    };
  }
}

// Función para probar módulo de reportes
async function testReportsModule() {
  console.log('\n📊 MÓDULO DE REPORTES');
  console.log('='.repeat(60));

  const reportEndpoints = [
    '/reports/dashboard/metrics',
    '/reports/invoices/chart',
    '/reports/sales/summary',
    '/reports/invoices/status-distribution',
    '/reports/invoices/monthly-summary',
    '/reports/customers/top',
    '/reports/customers/activity'
  ];

  const dateRanges = [
    {
      name: 'Último mes',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      name: 'Sin filtros',
      startDate: null,
      endDate: null
    }
  ];

  for (const range of dateRanges) {
    console.log(`\n📅 Probando: ${range.name}`);
    console.log('-'.repeat(40));

    for (const endpoint of reportEndpoints) {
      const params = {};
      if (range.startDate && range.endDate) {
        params.startDate = range.startDate;
        params.endDate = range.endDate;
      }

      const result = await testEndpointWithDateFilters(endpoint, params);
      
      console.log(`${endpoint}: ${result.success ? '✅' : '❌'} (${result.status})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.periodInfo) {
        console.log(`   Período: ${JSON.stringify(result.periodInfo)}`);
      }
    }
  }
}

// Función para probar módulo de facturas
async function testInvoicesModule() {
  console.log('\n📄 MÓDULO DE FACTURAS');
  console.log('='.repeat(60));

  const invoiceEndpoints = [
    '/invoices',
    '/invoices/reports'
  ];

  const dateRanges = [
    {
      name: 'Último mes',
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0]
    },
    {
      name: 'Período mensual',
      period: 'month'
    },
    {
      name: 'Sin filtros',
    }
  ];

  for (const range of dateRanges) {
    console.log(`\n📅 Probando: ${range.name}`);
    console.log('-'.repeat(40));

    for (const endpoint of invoiceEndpoints) {
      const result = await testEndpointWithDateFilters(endpoint, range);
      
      console.log(`${endpoint}: ${result.success ? '✅' : '❌'} (${result.status})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.data && result.data.data) {
        if (Array.isArray(result.data.data)) {
          console.log(`   Elementos: ${result.data.data.length}`);
        } else if (result.data.data.invoices) {
          console.log(`   Facturas: ${result.data.data.invoices.length}`);
        }
      }
    }
  }
}

// Función para probar módulo de clientes
async function testCustomersModule() {
  console.log('\n👥 MÓDULO DE CLIENTES');
  console.log('='.repeat(60));

  const customerEndpoints = [
    '/customers'
  ];

  // Los clientes generalmente no se filtran por fecha de creación en el listado principal
  // pero podemos probar con diferentes parámetros
  const testParams = [
    { name: 'Sin filtros' },
    { name: 'Con búsqueda', search: 'test' },
    { name: 'Estado activo', status: 'active' }
  ];

  for (const params of testParams) {
    console.log(`\n📅 Probando: ${params.name}`);
    console.log('-'.repeat(40));

    for (const endpoint of customerEndpoints) {
      const { name, ...testParams } = params;
      const result = await testEndpointWithDateFilters(endpoint, testParams);
      
      console.log(`${endpoint}: ${result.success ? '✅' : '❌'} (${result.status})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.data && result.data.customers) {
        console.log(`   Clientes: ${result.data.customers.length}`);
      }
    }
  }
}

// Función para probar módulo de productos
async function testProductsModule() {
  console.log('\n📦 MÓDULO DE PRODUCTOS');
  console.log('='.repeat(60));

  const productEndpoints = [
    '/products'
  ];

  // Los productos generalmente no se filtran por fecha en el listado principal
  const testParams = [
    { name: 'Sin filtros' },
    { name: 'Con búsqueda', search: 'test' },
    { name: 'Estado activo', status: 'active' }
  ];

  for (const params of testParams) {
    console.log(`\n📅 Probando: ${params.name}`);
    console.log('-'.repeat(40));

    for (const endpoint of productEndpoints) {
      const { name, ...testParams } = params;
      const result = await testEndpointWithDateFilters(endpoint, testParams);
      
      console.log(`${endpoint}: ${result.success ? '✅' : '❌'} (${result.status})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.data && result.data.products) {
        console.log(`   Productos: ${result.data.products.length}`);
      }
    }
  }
}

// Función para probar módulo de categorías
async function testCategoriesModule() {
  console.log('\n🏷️ MÓDULO DE CATEGORÍAS');
  console.log('='.repeat(60));

  const categoryEndpoints = [
    '/categories'
  ];

  const testParams = [
    { name: 'Sin filtros' },
    { name: 'Estado activo', status: 'active' }
  ];

  for (const params of testParams) {
    console.log(`\n📅 Probando: ${params.name}`);
    console.log('-'.repeat(40));

    for (const endpoint of categoryEndpoints) {
      const { name, ...testParams } = params;
      const result = await testEndpointWithDateFilters(endpoint, testParams);
      
      console.log(`${endpoint}: ${result.success ? '✅' : '❌'} (${result.status})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.data && result.data.categories) {
        console.log(`   Categorías: ${result.data.categories.length}`);
      }
    }
  }
}

// Función para generar resumen de resultados
function generateSummary(results) {
  console.log('\n📋 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(60));

  const moduleResults = {
    'Reportes': { total: 0, success: 0, failed: 0 },
    'Facturas': { total: 0, success: 0, failed: 0 },
    'Clientes': { total: 0, success: 0, failed: 0 },
    'Productos': { total: 0, success: 0, failed: 0 },
    'Categorías': { total: 0, success: 0, failed: 0 }
  };

  results.forEach(result => {
    let module = 'Otros';
    if (result.endpoint.includes('/reports/')) module = 'Reportes';
    else if (result.endpoint.includes('/invoices')) module = 'Facturas';
    else if (result.endpoint.includes('/customers')) module = 'Clientes';
    else if (result.endpoint.includes('/products')) module = 'Productos';
    else if (result.endpoint.includes('/categories')) module = 'Categorías';

    if (moduleResults[module]) {
      moduleResults[module].total++;
      if (result.success) {
        moduleResults[module].success++;
      } else {
        moduleResults[module].failed++;
      }
    }
  });

  Object.entries(moduleResults).forEach(([module, stats]) => {
    if (stats.total > 0) {
      const successRate = ((stats.success / stats.total) * 100).toFixed(1);
      console.log(`${module}: ${stats.success}/${stats.total} exitosos (${successRate}%)`);
    }
  });

  const totalTests = results.length;
  const totalSuccess = results.filter(r => r.success).length;
  const overallSuccessRate = ((totalSuccess / totalTests) * 100).toFixed(1);
  
  console.log(`\n🎯 TOTAL: ${totalSuccess}/${totalTests} pruebas exitosas (${overallSuccessRate}%)`);
}

// Función principal
async function main() {
  console.log('🚀 VERIFICACIÓN COMPLETA DE FILTROS DE FECHA EN TODOS LOS MÓDULOS');
  console.log('='.repeat(80));

  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ No se pudo autenticar. Terminando verificación.');
    return;
  }

  const allResults = [];

  // Probar cada módulo
  await testReportsModule();
  await testInvoicesModule();
  await testCustomersModule();
  await testProductsModule();
  await testCategoriesModule();

  console.log('\n✅ Verificación completa de filtros de fecha finalizada');
}

// Ejecutar la verificación
main().catch(console.error);
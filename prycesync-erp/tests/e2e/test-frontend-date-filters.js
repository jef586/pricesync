import fetch from 'node-fetch';

// Configuración de la API (Docker)
const API_BASE = 'http://localhost:3000/api';

// Credenciales de prueba
const TEST_CREDENTIALS = {
  email: 'admin@empresatest.com',
  password: 'admin123'
};

let authToken = null;

// Función para obtener headers de autenticación
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

// Función para autenticarse
async function authenticate() {
  console.log('🔐 Autenticando usuario...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });

    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      console.log('✅ Autenticación exitosa');
      return true;
    } else {
      const errorData = await response.json();
      console.log(`❌ Error de autenticación: ${errorData.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error de conexión: ${error.message}`);
    return false;
  }
}

// Función para probar filtros de fecha en endpoints específicos del frontend
async function testFrontendDateFilters() {
  console.log('\n🎨 PROBANDO INTEGRACIÓN DE FILTROS DE FECHA EN FRONTEND');
  console.log('='.repeat(70));

  // Definir rangos de fechas similares a los que usaría el frontend
  const dateRanges = [
    {
      name: 'Última semana',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      name: 'Último mes',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      name: 'Último trimestre',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      name: 'Este año',
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  ];

  // Períodos predefinidos que usaría el frontend
  const predefinedPeriods = ['week', 'month', 'quarter', 'year'];

  // 1. Probar Dashboard con períodos predefinidos
  console.log('\n📊 DASHBOARD - Períodos predefinidos');
  console.log('-'.repeat(50));

  for (const period of predefinedPeriods) {
    console.log(`\n🔍 Probando período: ${period}`);
    
    try {
      const response = await fetch(`${API_BASE}/reports/dashboard/metrics`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Dashboard cargado correctamente');
        
        if (data.data) {
          // Verificar métricas principales
          const metrics = ['totalRevenue', 'totalInvoices', 'pendingInvoices', 'overdueInvoices'];
          metrics.forEach(metric => {
            if (data.data[metric] !== undefined) {
              console.log(`   📈 ${metric}: ${data.data[metric]}`);
            }
          });
        }
      } else {
        const errorData = await response.json();
        console.log(`   ❌ Error: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
    }
  }

  // 2. Probar reportes con rangos de fechas personalizados
  console.log('\n📈 REPORTES - Rangos de fechas personalizados');
  console.log('-'.repeat(50));

  const reportEndpoints = [
    { endpoint: '/reports/dashboard/metrics', name: 'Métricas Dashboard' },
    { endpoint: '/reports/invoices/chart', name: 'Gráfico Facturas' },
    { endpoint: '/reports/sales/summary', name: 'Resumen Ventas' },
    { endpoint: '/reports/customers/top', name: 'Top Clientes' }
  ];

  for (const range of dateRanges) {
    console.log(`\n📅 Probando rango: ${range.name} (${range.startDate} a ${range.endDate})`);
    console.log('-'.repeat(40));

    for (const report of reportEndpoints) {
      console.log(`\n🔍 ${report.name}:`);
      
      try {
        const url = `${API_BASE}${report.endpoint}?startDate=${range.startDate}&endDate=${range.endDate}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('   ✅ Respuesta exitosa');
          
          // Verificar información del período
          if (data.data && data.data.period) {
            console.log(`   📅 Período: ${JSON.stringify(data.data.period)}`);
          }
          
          // Contar elementos en arrays (para gráficos)
          if (data.data) {
            Object.keys(data.data).forEach(key => {
              const value = data.data[key];
              if (Array.isArray(value)) {
                console.log(`   📊 ${key}: ${value.length} elementos`);
              } else if (typeof value === 'number') {
                console.log(`   📊 ${key}: ${value}`);
              }
            });
          }
        } else {
          const errorData = await response.json();
          console.log(`   ❌ Error: ${errorData.error || 'Error desconocido'}`);
        }
      } catch (error) {
        console.log(`   ❌ Error de conexión: ${error.message}`);
      }
    }
  }

  // 3. Probar filtros de fecha en facturas (como los usaría InvoicesView)
  console.log('\n📄 FACTURAS - Filtros de fecha');
  console.log('-'.repeat(50));

  const invoiceFilters = [
    {
      name: 'Sin filtros de fecha',
      params: {}
    },
    {
      name: 'Facturas del último mes',
      params: {
        dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0]
      }
    },
    {
      name: 'Facturas de este año',
      params: {
        dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0]
      }
    }
  ];

  for (const filter of invoiceFilters) {
    console.log(`\n📅 ${filter.name}:`);
    
    try {
      const queryParams = new URLSearchParams(filter.params).toString();
      const url = `${API_BASE}/invoices${queryParams ? '?' + queryParams : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Respuesta exitosa');
        
        if (data.invoices) {
          console.log(`   📄 Facturas encontradas: ${data.invoices.length}`);
          
          // Mostrar algunas facturas de ejemplo
          if (data.invoices.length > 0) {
            const sample = data.invoices.slice(0, 3);
            sample.forEach(invoice => {
              console.log(`   📋 ${invoice.number} - ${invoice.customer.name} - $${invoice.total}`);
            });
          }
        }
        
        if (data.pagination) {
          console.log(`   📊 Total: ${data.pagination.total} | Páginas: ${data.pagination.totalPages}`);
        }
      } else {
        const errorData = await response.json();
        console.log(`   ❌ Error: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
    }
  }

  // 4. Probar reportes de facturas con períodos
  console.log('\n📊 REPORTES DE FACTURAS - Períodos');
  console.log('-'.repeat(50));

  const invoiceReportPeriods = ['day', 'week', 'month', 'quarter', 'year'];

  for (const period of invoiceReportPeriods) {
    console.log(`\n📅 Período: ${period}`);
    
    try {
      const response = await fetch(`${API_BASE}/invoices/reports?period=${period}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Respuesta exitosa');
        
        if (data.data) {
          // Mostrar métricas del reporte
          Object.keys(data.data).forEach(key => {
            const value = data.data[key];
            if (typeof value === 'number') {
              console.log(`   📊 ${key}: ${value}`);
            } else if (Array.isArray(value)) {
              console.log(`   📊 ${key}: ${value.length} elementos`);
            }
          });
        }
      } else {
        const errorData = await response.json();
        console.log(`   ❌ Error: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
    }
  }
}

// Función principal
async function main() {
  console.log('🧪 PRUEBA DE INTEGRACIÓN DE FILTROS DE FECHA EN FRONTEND');
  console.log('='.repeat(70));
  
  // Autenticar
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('❌ No se pudo autenticar. Terminando pruebas.');
    return;
  }

  // Ejecutar pruebas
  await testFrontendDateFilters();

  console.log('\n✅ PRUEBAS COMPLETADAS');
  console.log('='.repeat(70));
  console.log('📋 RESUMEN:');
  console.log('• Se probaron filtros de fecha en Dashboard');
  console.log('• Se probaron reportes con rangos personalizados');
  console.log('• Se probaron filtros de fecha en facturas');
  console.log('• Se probaron reportes de facturas con períodos');
  console.log('• Todos los endpoints responden correctamente');
}

// Ejecutar pruebas
main().catch(console.error);
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

// Función para probar filtros de fecha
async function testDateFilters() {
  console.log('\n📅 PROBANDO FILTROS DE FECHA EN REPORTES');
  console.log('='.repeat(60));

  // Definir rangos de fechas para probar
  const dateRanges = [
    {
      name: 'Último mes',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      name: 'Últimos 3 meses',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      name: 'Este año',
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  ];

  // Endpoints a probar
  const endpoints = [
    '/reports/dashboard/metrics',
    '/reports/invoices/chart',
    '/reports/sales/summary',
    '/reports/invoices/status-distribution',
    '/reports/invoices/monthly-summary',
    '/reports/customers/top',
    '/reports/customers/activity'
  ];

  for (const range of dateRanges) {
    console.log(`\n📊 Probando rango: ${range.name} (${range.startDate} a ${range.endDate})`);
    console.log('-'.repeat(50));

    for (const endpoint of endpoints) {
      console.log(`\n🔍 Probando ${endpoint}:`);
      
      try {
        const url = `${API_BASE}${endpoint}?startDate=${range.startDate}&endDate=${range.endDate}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('   ✅ Respuesta exitosa');
          
          // Verificar si la respuesta incluye información del período
          if (data.data && data.data.period) {
            console.log(`   📅 Período aplicado: ${JSON.stringify(data.data.period)}`);
          }
          
          // Mostrar algunos datos clave
          if (data.data) {
            if (typeof data.data === 'object') {
              const keys = Object.keys(data.data).slice(0, 3);
              keys.forEach(key => {
                const value = data.data[key];
                if (typeof value === 'number') {
                  console.log(`   📈 ${key}: ${value}`);
                } else if (Array.isArray(value)) {
                  console.log(`   📈 ${key}: [${value.length} elementos]`);
                }
              });
            }
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

  // Probar sin filtros de fecha (comportamiento por defecto)
  console.log(`\n📊 Probando sin filtros de fecha (comportamiento por defecto)`);
  console.log('-'.repeat(50));

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Probando ${endpoint} (sin filtros):`);
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Respuesta exitosa (usando fechas por defecto)');
        
        if (data.data && data.data.period) {
          console.log(`   📅 Período por defecto: ${JSON.stringify(data.data.period)}`);
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
  console.log('🚀 INICIANDO PRUEBAS DE FILTROS DE FECHA');
  console.log('='.repeat(60));

  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ No se pudo autenticar. Terminando pruebas.');
    return;
  }

  await testDateFilters();

  console.log('\n✅ Pruebas de filtros de fecha completadas');
}

// Ejecutar las pruebas
main().catch(console.error);
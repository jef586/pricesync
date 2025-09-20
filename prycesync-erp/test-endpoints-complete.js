// Script completo para probar todos los endpoints de autenticación
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002/api';

// Función helper para hacer requests
async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    console.log(`\n🔍 ${options.method || 'GET'} ${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { response, data, status: response.status };
  } catch (error) {
    console.error(`❌ Error en ${endpoint}:`, error.message);
    return { error };
  }
}

async function testEndpoints() {
  console.log('🚀 PRUEBAS COMPLETAS DE ENDPOINTS DE AUTENTICACIÓN\n');
  
  let authToken = null;
  let testResults = [];
  
  // 1. Health Check
  console.log('='.repeat(60));
  console.log('1. HEALTH CHECK');
  console.log('='.repeat(60));
  const healthResult = await makeRequest('/health');
  testResults.push({ test: 'Health Check', success: healthResult.status === 200 });
  
  // 2. Registro de Usuario
  console.log('\n' + '='.repeat(60));
  console.log('2. REGISTRO DE USUARIO');
  console.log('='.repeat(60));
  
  const userData = {
    email: `testuser${Date.now()}@example.com`, // Email único para evitar conflictos
    password: 'password123',
    name: 'Usuario de Prueba',
    role: 'user',
    companyId: 'cmfss4euc0000t4gy495zny53'
  };
  
  const registerResult = await makeRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  
  testResults.push({ test: 'Registro', success: registerResult.status === 201 });
  
  if (registerResult.data && registerResult.data.data && registerResult.data.data.tokens) {
    authToken = registerResult.data.data.tokens.accessToken;
  }
  
  // 3. Login
  console.log('\n' + '='.repeat(60));
  console.log('3. LOGIN DE USUARIO');
  console.log('='.repeat(60));
  
  const loginResult = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: userData.email,
      password: userData.password
    })
  });
  
  testResults.push({ test: 'Login', success: loginResult.status === 200 });
  
  if (loginResult.data && loginResult.data.data && loginResult.data.data.tokens) {
    authToken = loginResult.data.data.tokens.accessToken;
  }
  
  // 4. Perfil de Usuario (Protegido)
  if (authToken) {
    console.log('\n' + '='.repeat(60));
    console.log('4. OBTENER PERFIL (ENDPOINT PROTEGIDO)');
    console.log('='.repeat(60));
    
    const profileResult = await makeRequest('/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    testResults.push({ test: 'Obtener Perfil', success: profileResult.status === 200 });
    
    // 5. Actualizar Perfil
    console.log('\n' + '='.repeat(60));
    console.log('5. ACTUALIZAR PERFIL (ENDPOINT PROTEGIDO)');
    console.log('='.repeat(60));
    
    const updateResult = await makeRequest('/auth/me', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Usuario Actualizado'
      })
    });
    
    testResults.push({ test: 'Actualizar Perfil', success: updateResult.status === 200 });
    
    // 6. Refresh Token
    console.log('\n' + '='.repeat(60));
    console.log('6. REFRESH TOKEN');
    console.log('='.repeat(60));
    
    let refreshToken = null;
    if (loginResult.data && loginResult.data.data && loginResult.data.data.tokens) {
      refreshToken = loginResult.data.data.tokens.refreshToken;
    }
    
    const refreshResult = await makeRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({
        refreshToken: refreshToken
      })
    });
    
    testResults.push({ test: 'Refresh Token', success: refreshResult.status === 200 });
    
    // 7. Logout
    console.log('\n' + '='.repeat(60));
    console.log('7. LOGOUT');
    console.log('='.repeat(60));
    
    const logoutResult = await makeRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({
        refreshToken: refreshToken
      })
    });
    
    testResults.push({ test: 'Logout', success: logoutResult.status === 200 });
  }
  
  // 8. Acceso sin token (debe fallar)
  console.log('\n' + '='.repeat(60));
  console.log('8. ACCESO SIN TOKEN (DEBE FALLAR)');
  console.log('='.repeat(60));
  
  const unauthorizedResult = await makeRequest('/auth/me', {
    method: 'GET'
  });
  
  testResults.push({ test: 'Acceso sin token', success: unauthorizedResult.status === 401 });
  
  // Resumen de resultados
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));
  
  testResults.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${result.test}: ${result.success ? 'EXITOSO' : 'FALLÓ'}`);
  });
  
  const successCount = testResults.filter(r => r.success).length;
  const totalCount = testResults.length;
  
  console.log(`\n🎯 Resultado final: ${successCount}/${totalCount} pruebas exitosas`);
  
  if (successCount === totalCount) {
    console.log('🎉 ¡Todos los endpoints funcionan correctamente!');
  } else {
    console.log('⚠️  Algunos endpoints necesitan revisión.');
  }
}

// Ejecutar las pruebas
testEndpoints().catch(console.error);
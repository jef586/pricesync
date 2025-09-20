// Script para probar los endpoints de autenticación
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
    
    return { response, data };
  } catch (error) {
    console.error(`❌ Error en ${endpoint}:`, error.message);
    return { error };
  }
}

async function testEndpoints() {
  console.log('🚀 Iniciando pruebas de endpoints de autenticación...\n');
  
  // 1. Probar health check
  console.log('='.repeat(50));
  console.log('1. HEALTH CHECK');
  console.log('='.repeat(50));
  await makeRequest('/health');
  
  // 2. Probar registro de usuario
  console.log('\n' + '='.repeat(50));
  console.log('2. REGISTRO DE USUARIO');
  console.log('='.repeat(50));
  
  const userData = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Usuario Test',
    role: 'user', // Usando el valor correcto del enum UserRole
    companyId: 'cmfss4euc0000t4gy495zny53' // ID de la empresa de prueba creada
  };
  
  const registerResult = await makeRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  
  let authToken = null;
  if (registerResult.data && registerResult.data.token) {
    authToken = registerResult.data.token;
  }
  
  // 3. Probar login
  console.log('\n' + '='.repeat(50));
  console.log('3. LOGIN DE USUARIO');
  console.log('='.repeat(50));
  
  const loginResult = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: userData.email,
      password: userData.password
    })
  });
  
  if (loginResult.data && loginResult.data.token) {
    authToken = loginResult.data.token;
  }
  
  // 4. Probar endpoint protegido /auth/me
  if (authToken) {
    console.log('\n' + '='.repeat(50));
    console.log('4. PERFIL DE USUARIO (PROTEGIDO)');
    console.log('='.repeat(50));
    
    await makeRequest('/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // 5. Probar actualización de perfil
    console.log('\n' + '='.repeat(50));
    console.log('5. ACTUALIZAR PERFIL (PROTEGIDO)');
    console.log('='.repeat(50));
    
    await makeRequest('/auth/me', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Usuario Test Actualizado'
      })
    });
    
    // 6. Probar refresh token
    console.log('\n' + '='.repeat(50));
    console.log('6. REFRESH TOKEN');
    console.log('='.repeat(50));
    
    await makeRequest('/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // 7. Probar logout
    console.log('\n' + '='.repeat(50));
    console.log('7. LOGOUT');
    console.log('='.repeat(50));
    
    await makeRequest('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }
  
  // 8. Probar endpoint sin autenticación (debería fallar)
  console.log('\n' + '='.repeat(50));
  console.log('8. ACCESO SIN TOKEN (DEBERÍA FALLAR)');
  console.log('='.repeat(50));
  
  await makeRequest('/auth/me', {
    method: 'GET'
  });
  
  console.log('\n✅ Pruebas completadas!');
}

// Ejecutar las pruebas
testEndpoints().catch(console.error);
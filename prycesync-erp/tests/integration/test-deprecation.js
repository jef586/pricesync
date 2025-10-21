// Pruebas de integración para Deprecation/Proxy /api/products -> /api/articles
// Ejecutar: npm test -- deprecation (o node test-deprecation.js)
import fetch from 'node-fetch'

const API_BASE = process.env.API_BASE || 'http://localhost:3002/api'
const TEST_USER = {
  email: process.env.TEST_EMAIL || 'admin@empresatest.com',
  password: process.env.TEST_PASSWORD || 'admin123'
}

async function authenticate() {
  console.log('🔐 Autenticando usuario admin...')
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Login falló: ${res.status} ${JSON.stringify(data)}`)
  }
  const token = data?.data?.tokens?.accessToken
  if (!token) throw new Error('Token de acceso no encontrado')
  console.log('✅ Login OK')
  return token
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

async function testLegacyHeaders(token) {
  console.log('\n🧪 Probando headers de deprecación en /api/products ...')
  const url = `${API_BASE}/products?limit=1&debugDeprecation=1`
  const res = await fetch(url, { headers: authHeaders(token) })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = null }

  console.log('Status:', res.status)
  const dep = res.headers.get('Deprecation')
  const sunset = res.headers.get('Sunset')
  const link = res.headers.get('Link') || res.headers.get('X-Successor')
  console.log('Headers:', { Deprecation: dep, Sunset: sunset, Link: res.headers.get('Link'), XSuccessor: res.headers.get('X-Successor') })

  if (dep !== 'true') throw new Error(`Header Deprecation esperado 'true', recibido '${dep}'`)
  if (!sunset) throw new Error('Header Sunset faltante')
  if (!link || !link.includes('/api/articles')) {
    console.warn('⚠️ Successor header missing (Link/X-Successor)')
  } else {
    console.log('✅ Successor header present')
  }

  if (res.ok && json && typeof json === 'object') {
    const dbg = json.deprecation
    if (!dbg || dbg.successor !== '/api/articles') throw new Error('Body de debugDeprecation no incluye successor')
    if (!dbg.sunset) throw new Error('Body de debugDeprecation no incluye sunset')
    console.log('✅ Body incluye deprecation debug:', dbg)
  } else {
    console.log('ℹ️ Respuesta no JSON o status no OK; saltando validación de body')
  }

  console.log('✅ Headers de deprecación OK')
}

async function testDeprecationState(token) {
  console.log('\n📈 Consultando /ops/deprecation-state ...')
  const res = await fetch(`${API_BASE.replace('/api','')}/ops/deprecation-state`, { headers: authHeaders(token) })
  const body = await res.json()
  console.log('Status:', res.status)
  console.log('Body:', JSON.stringify(body, null, 2))
  if (!res.ok) throw new Error(`Estado deprecación falló: ${res.status}`)
  const share = body?.data?.legacySharePercent
  const legacyTotal = body?.data?.legacyRequests
  if (typeof share !== 'number') throw new Error('legacySharePercent inválido')
  if (legacyTotal < 1) throw new Error('No se registraron requests legacy (esperado >= 1)')
  console.log('✅ Estado deprecación OK')
}

async function testFlagOff(token) {
  console.log('\n⛔ Apagando flag ALLOW_PRODUCTS_ALIAS (POST /ops/flags/products-alias) ...')
  const resToggleOff = await fetch(`${API_BASE.replace('/api','')}/ops/flags/products-alias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ allow: false })
  })
  const toggleBody = await resToggleOff.json()
  if (!resToggleOff.ok) throw new Error(`Toggle flag OFF falló: ${resToggleOff.status} ${JSON.stringify(toggleBody)}`)
  console.log('✅ Flag OFF set:', toggleBody)

  console.log('➡️ Probando /api/products con flag OFF ...')
  const res = await fetch(`${API_BASE}/products?limit=1`, { headers: authHeaders(token) })
  const body = await res.json().catch(() => ({}))
  console.log('Status:', res.status)
  console.log('Body:', body)
  if (res.status !== 410) throw new Error(`Esperado 410 Gone con flag OFF, recibido ${res.status}`)
  if (body?.successor !== '/api/articles') throw new Error('Body 410 no incluye successor')
  console.log('✅ Flag OFF comporta 410 con sucesor')

  console.log('🔄 Restaurando flag ON ...')
  const resToggleOn = await fetch(`${API_BASE.replace('/api','')}/ops/flags/products-alias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ allow: true })
  })
  const toggleOnBody = await resToggleOn.json()
  if (!resToggleOn.ok) throw new Error(`Toggle flag ON falló: ${resToggleOn.status} ${JSON.stringify(toggleOnBody)}`)
  console.log('✅ Flag ON restaurado')
}

async function main() {
  console.log('🚀 INICIANDO PRUEBAS DE DEPRECATION')
  const token = await authenticate()
  await testLegacyHeaders(token)
  await testDeprecationState(token)
  await testFlagOff(token)
  console.log('\n✅ Pruebas de deprecación completadas')
}

main().catch(err => {
  console.error('❌ Error en pruebas:', err)
  process.exit(1)
})
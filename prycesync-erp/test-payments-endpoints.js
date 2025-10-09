// Script para probar endpoints de ventas y pagos (split payments)
// Ejecutar: node test-payments-endpoints.js
import fetch from 'node-fetch'

const API_BASE = process.env.API_BASE || 'http://localhost:3002/api'
const TEST_USER = {
  email: process.env.TEST_EMAIL || 'admin@empresatest.com',
  password: process.env.TEST_PASSWORD || 'admin123'
}

async function authenticate() {
  console.log('🔐 Autenticando usuario...')
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(data)}`)
  }
  const token = data?.data?.tokens?.accessToken
  if (!token) throw new Error('Token no encontrado en respuesta de login')
  console.log('✅ Login OK')
  return token
}

async function ensureCustomer(token) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  console.log('👤 Buscando cliente existente...')
  const res = await fetch(`${API_BASE}/customers?limit=1`, { headers })
  const list = await res.json()
  const customerId = list?.customers?.[0]?.id
  if (customerId) {
    console.log('✅ Cliente encontrado:', customerId)
    return customerId
  }
  console.log('➕ Creando cliente de prueba...')
  const createRes = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Cliente Test Split',
      email: 'cliente.split@test.com',
      taxId: '20-12345678-9',
      type: 'individual',
      status: 'active'
    })
  })
  const created = await createRes.json()
  if (!createRes.ok) throw new Error(`Crear cliente falló: ${createRes.status} ${JSON.stringify(created)}`)
  const newId = created?.data?.id || created?.id
  if (!newId) throw new Error('ID de cliente no retornado')
  console.log('✅ Cliente creado:', newId)
  return newId
}

async function createSale(token, customerId) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  console.log('🧾 Creando venta...')
  const saleBody = {
    customerId,
    items: [
      { description: 'Producto Demo', quantity: 1, unitPrice: 1000, taxRate: 21 }
    ],
    notes: 'Venta de prueba split'
  }
  const res = await fetch(`${API_BASE}/sales`, { method: 'POST', headers, body: JSON.stringify(saleBody) })
  const data = await res.json()
  if (!res.ok) throw new Error(`Crear venta falló: ${res.status} ${JSON.stringify(data)}`)
  const saleId = data?.data?.id || data?.id
  if (!saleId) throw new Error('ID de venta no retornado')
  console.log('✅ Venta creada:', saleId)
  return saleId
}

async function listPayments(token, saleId, label) {
  const headers = { Authorization: `Bearer ${token}` }
  const res = await fetch(`${API_BASE}/sales/${saleId}/payments`, { headers })
  const data = await res.json()
  console.log(`📄 Pagos (${label}):`, res.status, JSON.stringify(data))
  return { res, data }
}

async function addPayments(token, saleId) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  console.log('💳 Registrando split payments...')
  // Consultar el restante para ajustar los montos
  const before = await fetch(`${API_BASE}/sales/${saleId}/payments`, { headers: { Authorization: `Bearer ${token}` } })
  const summary = await before.json()
  const remaining = summary?.data?.remaining ?? 0
  if (!remaining || remaining <= 0) {
    throw new Error(`Restante inválido para registrar pagos: ${remaining}`)
  }
  // Dividir el restante en dos pagos (60% y 40%)
  const amount1 = Math.round(remaining * 0.6 * 100) / 100
  const amount2 = Math.round((remaining - amount1) * 100) / 100
  const payload = {
    payments: [
      { method: 'CASH', amount: amount1, currency: 'ARS' },
      { method: 'MERCADO_PAGO', amount: amount2, currency: 'ARS', methodDetails: { payerEmail: 'buyer@example.com' } }
    ]
  }
  const res = await fetch(`${API_BASE}/sales/${saleId}/payments`, { method: 'POST', headers, body: JSON.stringify(payload) })
  const data = await res.json()
  console.log('📌 Respuesta registrar pagos:', res.status, JSON.stringify(data))
  if (!res.ok) throw new Error('Fallo al registrar pagos')
}

async function main() {
  try {
    const token = await authenticate()
    const customerId = await ensureCustomer(token)
    let saleId = process.env.SALE_ID
    if (!saleId) {
      saleId = await createSale(token, customerId)
    } else {
      console.log('ℹ️ Usando SALE_ID del entorno:', saleId)
    }
    await listPayments(token, saleId, 'antes')
    await addPayments(token, saleId)
    await listPayments(token, saleId, 'después')
    console.log('✅ Pruebas de endpoints completadas')
  } catch (e) {
    console.error('❌ Error en pruebas:', e.message)
    process.exit(1)
  }
}

main()
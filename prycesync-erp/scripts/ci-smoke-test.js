// CI Smoke Test: ensures company exists, registers a user, and exercises Articles API
// Usage: node scripts/ci-smoke-test.js

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_BASE = process.env.API_BASE || 'http://localhost:3002/api'

async function waitForHealth(maxWaitMs = 30000, intervalMs = 1000) {
  const start = Date.now()
  const url = `${API_BASE}/health`
  let lastError = null
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        console.log('✅ Health OK:', data)
        return true
      } else {
        lastError = `HTTP ${res.status}`
      }
    } catch (err) {
      lastError = err?.message || String(err)
    }
    console.log('⏳ Waiting for API health...', lastError || '')
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  console.error('❌ API health check failed:', lastError)
  return false
}

async function ensureTestCompany() {
  const TAX_ID = '20-12345678-9'
  const NAME = 'Empresa Test S.A.'
  let company = await prisma.company.findFirst({ where: { taxId: TAX_ID } })
  if (company) {
    console.log('🏢 Using existing test company:', company.name, company.id)
    return company
  }
  company = await prisma.company.findFirst({ where: { name: NAME } })
  if (company) {
    console.log('🏢 Using existing test company by name:', company.name, company.id)
    return company
  }
  console.log('🏗️ Creating test company...')
  company = await prisma.company.create({
    data: {
      name: NAME,
      taxId: TAX_ID,
      email: 'admin@empresatest.com',
      status: 'active'
    }
  })
  console.log('✅ Test company created:', company.name, company.id)
  return company
}

async function registerUser(companyId) {
  const email = `ci.user.${Date.now()}@empresatest.com`
  const password = 'password123' // >= 8 chars
  console.log('📝 Registering user:', email)
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'CI Tester', companyId, role: 'admin' })
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Register failed: ${res.status} ${JSON.stringify(body)}`)
  }
  const accessToken = body?.data?.tokens?.accessToken
  const user = body?.data?.user
  if (!accessToken || !user) {
    throw new Error('Register did not return tokens/user')
  }
  console.log('✅ Registered user:', user.email, 'role:', user.role)
  return { email, password, token: accessToken, user }
}

async function login(email, password) {
  console.log('🔐 Logging in:', email)
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(body)}`)
  }
  const accessToken = body?.data?.tokens?.accessToken
  if (!accessToken) throw new Error('Login did not return accessToken')
  console.log('✅ Login OK, token acquired')
  return accessToken
}

async function getProfile(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`GET /auth/me failed: ${res.status} ${JSON.stringify(body)}`)
  console.log('👤 Profile:', body?.data?.user?.email, body?.data?.user?.company?.name)
}

async function createArticle(token) {
  const name = `CI Test Widget ${Date.now()}`
  const payload = {
    name,
    type: 'PRODUCT',
    cost: 100,
    gainPct: 20,
    controlStock: true
  }
  const res = await fetch(`${API_BASE}/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Create article failed: ${res.status} ${JSON.stringify(body)}`)
  const article = body?.data || body
  const id = article?.id
  if (!id) throw new Error('Article ID not returned')
  console.log('🆕 Article created:', id, article?.name)
  return article
}

async function updateArticleStock(token, id) {
  const res = await fetch(`${API_BASE}/articles/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ operation: 'add', quantity: 5, reason: 'ADJUST_IN', uom: 'UN' })
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Update stock failed: ${res.status} ${JSON.stringify(body)}`)
  console.log('📦 Stock updated:', body?.data?.stock ?? 'ok')
}

async function searchArticle(token, query) {
  const res = await fetch(`${API_BASE}/articles/search?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const list = await res.json().catch(() => [])
  if (!res.ok) throw new Error(`Search failed: ${res.status} ${JSON.stringify(list)}`)
  console.log(`🔎 Search results (${query}):`, Array.isArray(list) ? list.length : typeof list)
  return list
}

async function main() {
  console.log('🚀 CI Smoke Test start')

  const healthy = await waitForHealth()
  if (!healthy) throw new Error('API not healthy')

  const company = await ensureTestCompany()
  const { email, password, token } = await registerUser(company.id)
  await getProfile(token)
  const loginToken = await login(email, password)

  const article = await createArticle(loginToken)
  await updateArticleStock(loginToken, article.id)
  const results = await searchArticle(loginToken, article.name.split(' ')[0])
  const found = Array.isArray(results) && results.some((a) => a.id === article.id)
  console.log(found ? '✅ Article appears in search' : '⚠️ Article not found in search')

  console.log('🎉 CI Smoke Test completed successfully')
}

main()
  .catch(async (err) => {
    console.error('💥 Smoke Test failed:', err?.message || err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
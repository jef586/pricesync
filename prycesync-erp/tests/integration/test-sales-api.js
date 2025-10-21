// Simple script to test sales API endpoints
// Usage: node test-sales-api.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002'
const TOKEN = process.env.TOKEN || ''

async function run() {
  if (!TOKEN) {
    console.error('Set TOKEN=Bearer <jwt> before running')
    process.exit(1)
  }

  const headers = {
    'Authorization': TOKEN,
    'Content-Type': 'application/json'
  }

  // Create a sale
  const createRes = await fetch(`${BASE_URL}/api/sales`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customerId: process.env.CUSTOMER_ID || 'cmfzbx1ff0000521dfh4ynxm1',
      items: [
        { description: 'Producto Demo', quantity: 1, unitPrice: 1000, taxRate: 21 }
      ],
      payments: [
        { method: 'cash', amount: 1000, currency: 'ARS' }
      ]
    })
  })

  const created = await createRes.json()
  console.log('Create sale status:', createRes.status, created)
  if (!createRes.ok) process.exit(1)

  const saleId = created.data?.id
  if (!saleId) throw new Error('Sale ID not returned')

  // Fetch sale by id
  const getRes = await fetch(`${BASE_URL}/api/sales/${saleId}`, { headers: { Authorization: TOKEN } })
  const sale = await getRes.json()
  console.log('Get sale status:', getRes.status, sale)
}

run().catch(err => { console.error(err); process.exit(1) })

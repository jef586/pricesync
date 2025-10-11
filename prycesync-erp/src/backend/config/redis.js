import { createClient } from 'redis'

const url = process.env.REDIS_URL || 'redis://localhost:6379'
export const redis = createClient({ url })

redis.on('error', (err) => {
  console.error('Redis error:', err?.message || err)
})

let connected = false
export async function connectRedis() {
  if (connected) return redis
  try {
    await redis.connect()
    connected = true
    console.log(`✅ Redis conectado: ${url}`)
    return redis
  } catch (err) {
    console.error('❌ No se pudo conectar a Redis:', err?.message || err)
    throw err
  }
}

export async function getCache(key) {
  try {
    await connectRedis()
    const val = await redis.get(key)
    return val ? JSON.parse(val) : null
  } catch (err) {
    // No bloquear por errores de cache
    return null
  }
}

export async function setCache(key, value, ttlSeconds = 3600) {
  try {
    await connectRedis()
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds })
    return true
  } catch (err) {
    return false
  }
}
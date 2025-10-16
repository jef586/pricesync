import { getCache, setCache } from '../config/redis.js'
import { getLoginTicket } from './wsaa.js'

const TA_KEY = 'afip:ta:a5'

function calcTtlSeconds(expirationIso) {
  if (!expirationIso) return 60 * 60 // fallback 1h
  const expMs = new Date(expirationIso).getTime()
  const nowMs = Date.now()
  const ttlMs = Math.max(expMs - nowMs - 60_000, 30_000) // leave 60s safety
  return Math.floor(ttlMs / 1000)
}

export async function getCachedTA() {
  const cached = await getCache(TA_KEY)
  if (cached) {
    try {
      const parsed = JSON.parse(cached)
      if (parsed?.token && parsed?.sign) return parsed
    } catch {}
  }
  const ta = await getLoginTicket({})
  const ttl = calcTtlSeconds(ta.expiration)
  await setCache(TA_KEY, JSON.stringify(ta), ttl)
  return ta
}

export default { getCachedTA }
import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { getCache, setCache } from '../config/redis.js'
import { isValidCUIT } from '../utils/validateCuit.js'
import { getCachedTA } from '../afip/authCache.js'
import { getPersonaA5 } from '../afip/padronA5.js'

const router = express.Router()

router.use(authenticate)

router.get('/padron/:cuit', async (req, res) => {
  const cuit = String(req.params.cuit || '').replace(/[^0-9]/g, '')
  if (!isValidCUIT(cuit)) {
    return res.status(400).json({ error: 'CUIT inválido', message: 'El CUIT debe tener 11 dígitos y checksum válido' })
  }

  const cacheKey = `afip:a5:persona:${cuit}`
  const cacheTtl = parseInt(process.env.AFIP_CACHE_TTL_S || '86400', 10)

  try {
    const cached = await getCache(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        return res.json(parsed)
      } catch {}
    }

    const { token, sign } = await getCachedTA()
    const rep = process.env.AFIP_CUIT_REPRESENTADA
    const env = process.env.AFIP_ENV

    const persona = await getPersonaA5({ token, sign, idPersona: cuit, cuitRepresentada: rep, env })
    await setCache(cacheKey, JSON.stringify(persona), cacheTtl)
    return res.json(persona)
  } catch (err) {
    const status = Number(err?.code) || 502
    return res.status(status).json({ error: 'AFIP A5 error', message: err?.message || 'Falla en padrón A5', code: status })
  }
})

export default router
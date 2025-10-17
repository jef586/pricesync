import { connectRedis, redis } from '../config/redis.js'

/**
 * Rate limit middleware
 * @param {Object} opts
 * @param {string} opts.keyPrefix
 * @param {number} opts.limit
 * @param {number} opts.windowSeconds
 * @param {(req)=>string} [opts.getKey]
 */
export function rateLimit({ keyPrefix, limit, windowSeconds, getKey }) {
  return async (req, res, next) => {
    try {
      await connectRedis()
      const uid = (getKey ? getKey(req) : req.user?.id) || req.ip
      const key = `${keyPrefix}:${uid}`

      const count = await redis.incr(key)
      if (count === 1) {
        await redis.expire(key, windowSeconds)
      }

      if (count > limit) {
        return res.status(429).json({
          error: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED',
          limit,
          windowSeconds
        })
      }

      res.setHeader('X-RateLimit-Limit', String(limit))
      const ttl = await redis.ttl(key)
      res.setHeader('X-RateLimit-Remaining', String(Math.max(limit - count, 0)))
      res.setHeader('X-RateLimit-Reset', String(ttl > 0 ? ttl : windowSeconds))

      next()
    } catch (err) {
      // Ante error de Redis, continuar sin bloquear
      next()
    }
  }
}
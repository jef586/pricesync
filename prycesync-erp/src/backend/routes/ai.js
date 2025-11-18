import { Router } from 'express'
import { rateLimit } from '../middleware/rateLimit.js'
import { postMessage, postMessageValidators } from '../controllers/ChatController.js'
import { postSupplierMapping, mappingValidators } from '../controllers/SupplierMappingController.js'

const router = Router()

// Limitar a 10 consultas por minuto por usuario/ip
router.post(
  '/chat',
  rateLimit({ keyPrefix: 'ai:chat', limit: 10, windowSeconds: 60 }),
  postMessageValidators,
  postMessage
)

router.post(
  '/supplier-mapping',
  rateLimit({ keyPrefix: 'ai:supplier-mapping', limit: 10, windowSeconds: 60 }),
  mappingValidators,
  postSupplierMapping
)

export default router

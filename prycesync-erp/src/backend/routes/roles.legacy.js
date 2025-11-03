import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireScopes } from '../middleware/scopes.js'

const router = express.Router()

router.use(authenticate)
router.use(requireScopes('admin:users'))

// GET /api/roles - list available user roles
router.get('/', (req, res) => {
  const roles = ['admin', 'manager', 'user', 'viewer']
  res.json({ roles })
})

export default router
import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { scopeByCompanyId } from '../middleware/scopeByCompanyId.js'
import SetupController from '../controllers/SetupController.js'

const router = express.Router()

router.use(authenticate)
router.use(scopeByCompanyId)

router.get('/status', SetupController.getStatus)

export default router


import express from 'express'
import SettingsController from '../controllers/SettingsController.js'
import { authenticate } from '../middleware/auth.js'
import { scopeByCompanyId } from '../middleware/scopeByCompanyId.js'

const router = express.Router()

router.use(authenticate)
router.use(scopeByCompanyId)

router.get('/pricing', SettingsController.getPricingSettings)
router.put('/pricing', SettingsController.updatePricingSettings)

export default router
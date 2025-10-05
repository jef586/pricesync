import express from 'express'
import SettingsController from '../controllers/SettingsController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

router.get('/pricing', SettingsController.getPricingSettings)
router.put('/pricing', SettingsController.updatePricingSettings)

export default router
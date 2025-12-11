import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { scopeByCompanyId } from '../middleware/scopeByCompanyId.js'
import { prisma } from '../config/database.js'

const router = express.Router()

router.use(authenticate)
router.use(scopeByCompanyId)

// GET /api/company/info
router.get('/info', async (req, res) => {
  try {
    const companyId = req.companyId || req.user?.company?.id
    if (!companyId) {
      return res.status(403).json({ success: false, error: 'Empresa no determinada para el usuario', code: 'COMPANY_NOT_RESOLVED' })
    }

    const company = await prisma.company.findUnique({
      where: { id: String(companyId) },
      select: {
        id: true,
        name: true,
        taxId: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        fiscalConfig: true
      }
    })

    if (!company) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada', code: 'COMPANY_NOT_FOUND' })
    }

    const fiscal = (company.fiscalConfig || {})
    const data = {
      id: company.id,
      commercialName: company.name || '',
      legalName: String(fiscal.legalName || company.name || ''),
      taxId: company.taxId || '',
      startDate: String(fiscal.startDate || ''),
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      contributorType: String(fiscal.contributorType || 'CONSUMIDOR_FINAL'),
      posAfip: fiscal.posAfip != null ? Number(fiscal.posAfip) : null
    }

    return res.json({ success: true, data })
  } catch (err) {
    console.error('Error GET /company/info:', err)
    return res.status(500).json({ success: false, error: 'Error obteniendo información de empresa', code: 'GET_COMPANY_INFO_FAILED' })
  }
})

// PUT /api/company/info
router.put('/info', async (req, res) => {
  try {
    const companyId = req.companyId || req.user?.company?.id
    if (!companyId) {
      return res.status(403).json({ success: false, error: 'Empresa no determinada para el usuario', code: 'COMPANY_NOT_RESOLVED' })
    }

    const payload = req.body || {}
    const {
      commercialName,
      legalName,
      taxId,
      startDate,
      address,
      phone,
      email,
      contributorType,
      posAfip
    } = payload

    // Minimal server-side sanity checks (frontend realiza validaciones completas con Zod)
    const name = String(commercialName || '').trim()
    const tax = String(taxId || '').trim()
    if (!name || !tax) {
      return res.status(400).json({ success: false, error: 'Nombre comercial y CUIT son obligatorios', code: 'VALIDATION_ERROR' })
    }

    // Merge fiscalConfig
    const existing = await prisma.company.findUnique({ where: { id: String(companyId) }, select: { fiscalConfig: true } })
    const fiscal = existing?.fiscalConfig || {}
    const nextFiscal = {
      ...fiscal,
      legalName: String(legalName || name),
      startDate: startDate ? String(startDate) : '',
      contributorType: String(contributorType || fiscal.contributorType || 'CONSUMIDOR_FINAL'),
      posAfip: posAfip != null ? Number(posAfip) : fiscal.posAfip ?? null
    }

    const updated = await prisma.company.update({
      where: { id: String(companyId) },
      data: {
        name,
        taxId: tax,
        email: email ? String(email) : null,
        phone: phone ? String(phone) : null,
        address: address ? String(address) : null,
        fiscalConfig: nextFiscal
      },
      select: {
        id: true,
        name: true,
        taxId: true,
        email: true,
        phone: true,
        address: true,
        fiscalConfig: true
      }
    })

    const fiscalOut = updated.fiscalConfig || {}
    const data = {
      id: updated.id,
      commercialName: updated.name || '',
      legalName: String(fiscalOut.legalName || updated.name || ''),
      taxId: updated.taxId || '',
      startDate: String(fiscalOut.startDate || ''),
      address: updated.address || '',
      phone: updated.phone || '',
      email: updated.email || '',
      contributorType: String(fiscalOut.contributorType || 'CONSUMIDOR_FINAL'),
      posAfip: fiscalOut.posAfip != null ? Number(fiscalOut.posAfip) : null
    }

    return res.json({ success: true, data })
  } catch (err) {
    console.error('Error PUT /company/info:', err)
    return res.status(500).json({ success: false, error: 'Error actualizando información de empresa', code: 'UPDATE_COMPANY_INFO_FAILED' })
  }
})

export default router


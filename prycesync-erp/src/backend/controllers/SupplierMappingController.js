import { body, validationResult } from 'express-validator'
import { SupplierMappingService } from '../services/SupplierMappingService.js'

const service = new SupplierMappingService()

export const mappingValidators = [
  body('supplierId').isString().trim().isLength({ min: 2, max: 100 }),
  body('supplierName').isString().trim().isLength({ min: 1, max: 200 }),
  body('hasHeader').isBoolean(),
  body('columns').isArray({ min: 1 }),
  body('columns.*.index').isInt({ min: 0 }),
  body('columns.*.label').isString().trim().isLength({ min: 1, max: 200 }),
  body('sampleRows').isArray({ min: 1 })
]

export async function postSupplierMapping(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() })
  }
  try {
    const { supplierId, supplierName, columns, sampleRows, hasHeader } = req.body
    const result = await service.suggestMapping({ supplierId, supplierName, columns, sampleRows, hasHeader })
    res.json(result)
  } catch (err) {
    const msg = err?.message || 'AI mapping error'
    res.status(400).json({ error: 'AI_MAPPING_ERROR', message: msg })
  }
}


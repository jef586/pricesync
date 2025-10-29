import { prisma } from '../config/database.js';
import { Decimal } from '@prisma/client/runtime/library.js';
import UomService from '../services/UomService.js';

function assert(condition, message) {
  if (!condition) {
    const err = new Error(message || 'Validation error');
    err.statusCode = 400;
    throw err;
  }
}

function parseAndValidatePayload(body, isUpdate = false) {
  const payload = {};

  if (body.uom != null) payload.uom = UomService.parseUom(body.uom);
  if (body.minQty != null) {
    const q = new Decimal(body.minQty || 0);
    assert(q.gt(0), 'minQty must be > 0');
    payload.minQty = q.toNumber();
  }

  if (body.mode != null) {
    assert(['UNIT_PRICE', 'PERCENT_OFF'].includes(body.mode), 'mode invalid');
    payload.mode = body.mode;
  }

  if (body.priority != null) payload.priority = parseInt(body.priority, 10) || 0;
  if (body.active != null) payload.active = !!body.active;
  if (body.validFrom != null) payload.validFrom = body.validFrom ? new Date(body.validFrom) : null;
  if (body.validTo != null) payload.validTo = body.validTo ? new Date(body.validTo) : null;

  if (body.unitPrice != null) {
    const p = new Decimal(body.unitPrice);
    assert(p.gte(0), 'unitPrice must be >= 0');
    payload.unitPrice = p.toNumber();
  } else if (!isUpdate) {
    payload.unitPrice = undefined; // explicit undefined on create keeps XOR validation below
  }

  if (body.percentOff != null) {
    const pct = new Decimal(body.percentOff);
    assert(pct.gt(0) && pct.lte(100), 'percentOff must be 0 < x <= 100');
    payload.percentOff = pct.toNumber();
  } else if (!isUpdate) {
    payload.percentOff = undefined;
  }

  // Additional cross-field validations (XOR and dates)
  if (!isUpdate) {
    assert(payload.uom != null, 'uom is required');
    assert(payload.minQty != null, 'minQty is required');
    assert(payload.mode != null, 'mode is required');
  }

  if (payload.validFrom && payload.validTo) {
    assert(payload.validFrom <= payload.validTo, 'validFrom must be <= validTo');
  }

  const mode = payload.mode != null ? payload.mode : body.mode; // fallback
  const hasUnit = payload.unitPrice != null;
  const hasPct = payload.percentOff != null;
  if (!isUpdate || mode) {
    if (mode === 'UNIT_PRICE') {
      assert(hasUnit, 'unitPrice required when mode=UNIT_PRICE');
      if (!isUpdate) payload.percentOff = null;
    } else if (mode === 'PERCENT_OFF') {
      assert(hasPct, 'percentOff required when mode=PERCENT_OFF');
      if (!isUpdate) payload.unitPrice = null;
    }
  }

  return payload;
}

export default class ArticleBulkPricingController {
  static async list(req, res) {
    try {
      const articleId = String(req.params.id);
      const where = {
        articleId,
        deletedAt: null,
      };
      if (req.query.uom) where.uom = UomService.parseUom(req.query.uom);

      const rows = await prisma.articleBulkPricing.findMany({
        where,
        orderBy: [
          { uom: 'asc' },
          { minQty: 'desc' },
          { priority: 'desc' },
        ],
      });
      res.json(rows);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || 'Error listing bulk pricing' });
    }
  }

  static async create(req, res) {
    try {
      const articleId = String(req.params.id);
      const data = parseAndValidatePayload(req.body, false);
      data.articleId = articleId;
      const created = await prisma.articleBulkPricing.create({ data });
      res.status(201).json(created);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || 'Error creating bulk pricing rule' });
    }
  }

  static async update(req, res) {
    try {
      const articleId = String(req.params.id);
      const id = String(req.params.ruleId);
      const data = parseAndValidatePayload(req.body, true);
      // Ensure rule belongs to article
      const existing = await prisma.articleBulkPricing.findUnique({ where: { id } });
      if (!existing || existing.articleId !== articleId || existing.deletedAt) {
        return res.status(404).json({ message: 'Rule not found' });
      }
      const updated = await prisma.articleBulkPricing.update({ where: { id }, data });
      res.json(updated);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || 'Error updating bulk pricing rule' });
    }
  }

  static async remove(req, res) {
    try {
      const articleId = String(req.params.id);
      const id = String(req.params.ruleId);
      const existing = await prisma.articleBulkPricing.findUnique({ where: { id } });
      if (!existing || existing.articleId !== articleId || existing.deletedAt) {
        return res.status(404).json({ message: 'Rule not found' });
      }
      const now = new Date();
      const deleted = await prisma.articleBulkPricing.update({
        where: { id },
        data: { deletedAt: now, active: false },
      });
      res.json({ success: true, id: deleted.id });
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || 'Error deleting bulk pricing rule' });
    }
  }
}
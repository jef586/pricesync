import { prisma } from '../config/database.js';
import UomService from './UomService.js';
import { Decimal } from '@prisma/client/runtime/library.js';

const PRICE_SCALE = 2; // monetary rounding 2 decimals, HALF_UP
const QTY_SCALE = 3;   // keep consistency with UomService

function roundMoney(value) {
  const d = new Decimal(value || 0);
  return d.toDecimalPlaces(PRICE_SCALE, Decimal.ROUND_HALF_UP);
}

function toDecimal(v, scale) {
  return new Decimal(v).toDecimalPlaces(scale, Decimal.ROUND_HALF_UP);
}

// Pure helper: select best rule according to business requirements
export function chooseRule(rules, qty, now = new Date()) {
  if (!Array.isArray(rules) || !rules.length) return null;
  const q = new Decimal(qty || 0);
  if (q.lte(0)) return null;
  const ts = new Date(now);

  const valid = rules.filter(r => {
    if (!r.active) return false;
    if (r.deletedAt) return false;
    // validity window
    if (r.validFrom && ts < new Date(r.validFrom)) return false;
    if (r.validTo && ts > new Date(r.validTo)) return false;
    // qty threshold
    const minQ = new Decimal(r.minQty);
    if (q.lt(minQ)) return false;
    // XOR assurance
    if (r.mode === 'UNIT_PRICE' && (r.unitPrice == null)) return false;
    if (r.mode === 'PERCENT_OFF' && (r.percentOff == null)) return false;
    return true;
  });

  if (!valid.length) return null;

  // Sort: highest minQty, then highest priority
  valid.sort((a, b) => {
    const cmpMin = new Decimal(b.minQty).cmp(new Decimal(a.minQty));
    if (cmpMin !== 0) return cmpMin;
    return (b.priority || 0) - (a.priority || 0);
  });
  return valid[0];
}

// Pure helper: compute final unit price applying a rule
export function applyRule(rule, basePrice) {
  const price = new Decimal(basePrice || 0);
  if (!rule) return { finalUnitPrice: roundMoney(price), appliedRule: null };
  let finalUnitPrice;
  if (rule.mode === 'UNIT_PRICE') {
    finalUnitPrice = roundMoney(rule.unitPrice);
  } else if (rule.mode === 'PERCENT_OFF') {
    const pct = new Decimal(rule.percentOff || 0);
    const factor = new Decimal(1).minus(pct.dividedBy(100));
    finalUnitPrice = roundMoney(price.times(factor));
  } else {
    finalUnitPrice = roundMoney(price);
  }
  return { finalUnitPrice, appliedRule: rule };
}

export class BulkPricingService {
  static async resolve({ articleId, uom, qty, basePrice, now = new Date() }) {
    if (!articleId) throw new Error('articleId required');
    const u = UomService.parseUom(uom);
    const normalizedQty = UomService.normalizeQtyInput(u, qty);

    // Fetch all candidate rules from DB for the given article and UoM
    const rules = await prisma.articleBulkPricing.findMany({
      where: {
        articleId: String(articleId),
        uom: u,
        deletedAt: null,
        active: true,
        // do not filter by minQty to keep sort logic in JS and to allow unit tests to reuse helpers
      },
      orderBy: [
        { minQty: 'desc' },
        { priority: 'desc' },
      ],
    });

    const rule = chooseRule(rules, normalizedQty, now);
    const { finalUnitPrice, appliedRule } = applyRule(rule, basePrice);
    // Normalize to Decimal and raw number for API consumers
    return {
      appliedRule: appliedRule
        ? {
            id: appliedRule.id,
            articleId: appliedRule.articleId,
            uom: appliedRule.uom,
            minQty: toDecimal(appliedRule.minQty, QTY_SCALE).toNumber(),
            mode: appliedRule.mode,
            unitPrice: appliedRule.unitPrice != null ? roundMoney(appliedRule.unitPrice).toNumber() : null,
            percentOff: appliedRule.percentOff != null ? toDecimal(appliedRule.percentOff, 2).toNumber() : null,
            priority: appliedRule.priority || 0,
            active: !!appliedRule.active,
            validFrom: appliedRule.validFrom,
            validTo: appliedRule.validTo,
          }
        : null,
      finalUnitPrice: roundMoney(finalUnitPrice).toNumber(),
    };
  }
}
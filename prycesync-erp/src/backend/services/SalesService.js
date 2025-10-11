import { Decimal } from "@prisma/client/runtime/library.js";

class SalesService {
  /**
   * Calcula totales de venta con descuentos por ítem y descuento final.
   * Mantiene compatibilidad con `discount` (porcentaje) en payloads antiguos.
   */
  static calculateTotals(items, finalDiscount = { type: undefined, value: 0 }, surcharge = { type: undefined, value: 0 }) {
    let subtotalGross = new Decimal(0);
    let itemsDiscountTotal = new Decimal(0);
    let subtotalNet = new Decimal(0);

    // Paso 1: calcular neto por ítem y acumular descuentos por ítem
    for (const item of items) {
      const quantity = new Decimal(item.quantity);
      const unitPrice = new Decimal(item.unitPrice);
      const taxRate = new Decimal(item.taxRate ?? 21);

      const effectiveType = (item.discountType || item.discount_type || (item.discount != null ? 'PERCENT' : undefined));
      const effectiveValue = new Decimal(
        item.discountValue != null ? item.discountValue :
        item.discount_value != null ? item.discount_value :
        item.discount != null ? item.discount : 0
      );

      const rawSubtotal = quantity.mul(unitPrice);
      let lineDiscount = new Decimal(0);
      if (effectiveType === 'PERCENT') {
        lineDiscount = rawSubtotal.mul(effectiveValue.div(100));
      } else if (effectiveType === 'ABS') {
        lineDiscount = effectiveValue;
      }
      if (lineDiscount.gt(rawSubtotal)) lineDiscount = rawSubtotal;
      lineDiscount = new Decimal(lineDiscount.toFixed(2));

      const itemSubtotal = rawSubtotal.sub(lineDiscount);

      item.subtotal = new Decimal(itemSubtotal.toFixed(2));
      item.discountTotal = lineDiscount;
      item.discount_type = effectiveType;
      item.discountType = effectiveType;
      item.discount_value = effectiveValue;
      item.discountValue = effectiveValue;
      item.taxRate = taxRate;
      item.rawSubtotal = rawSubtotal;

      subtotalGross = subtotalGross.add(rawSubtotal);
      itemsDiscountTotal = itemsDiscountTotal.add(lineDiscount);
      subtotalNet = subtotalNet.add(item.subtotal);
    }

    // Paso 2: aplicar descuento final sobre subtotal neto
    let finalDiscountAmount = new Decimal(0);
    const fdType = finalDiscount?.type;
    const fdValue = new Decimal(finalDiscount?.value || 0);
    if (fdType === 'PERCENT') {
      finalDiscountAmount = subtotalNet.mul(fdValue.div(100));
    } else if (fdType === 'ABS') {
      finalDiscountAmount = fdValue;
    }
    if (finalDiscountAmount.gt(subtotalNet)) finalDiscountAmount = subtotalNet;
    finalDiscountAmount = new Decimal(finalDiscountAmount.toFixed(2));

    const taxBase = subtotalNet.sub(finalDiscountAmount);

    // Paso 2.1: calcular recargo sobre base
    let surchargeAmount = new Decimal(0);
    const scType = surcharge?.type;
    const scValue = new Decimal(surcharge?.value || 0);
    if (scType === 'PERCENT') {
      surchargeAmount = taxBase.mul(scValue.div(100));
    } else if (scType === 'ABS') {
      surchargeAmount = scValue;
    }
    if (surchargeAmount.lt(0)) surchargeAmount = new Decimal(0);
    // No permitir que supere la base cuando es ABS (opcional)
    if (scType === 'ABS' && surchargeAmount.gt(taxBase)) {
      surchargeAmount = taxBase;
    }
    surchargeAmount = new Decimal(surchargeAmount.toFixed(2));

    // Paso 3: distribuir descuento final proporcional y calcular impuestos por ítem
    let taxAmount = new Decimal(0);
    let distributedDiscount = new Decimal(0);
    let distributedSurcharge = new Decimal(0);
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const itemSubtotal = item.subtotal;
      let itemShare = new Decimal(0);
      if (subtotalNet.gt(0) && finalDiscountAmount.gt(0)) {
        const proportion = itemSubtotal.div(subtotalNet);
        itemShare = new Decimal(finalDiscountAmount.mul(proportion).toFixed(2));
        if (idx === items.length - 1) {
          const distributed = distributedDiscount;
          const remaining = finalDiscountAmount.sub(distributed);
          itemShare = remaining;
        }
      }
      item.finalDiscountShare = itemShare;
      distributedDiscount = distributedDiscount.add(itemShare);

      // Distribuir recargo proporcional al taxBase
      let itemSurcharge = new Decimal(0);
      const baseForSurcharge = taxBase;
      if (baseForSurcharge.gt(0) && surchargeAmount.gt(0)) {
        const proportion = itemSubtotal.sub(itemShare).div(baseForSurcharge);
        itemSurcharge = new Decimal(surchargeAmount.mul(proportion).toFixed(2));
        if (idx === items.length - 1) {
          const remainingSurcharge = surchargeAmount.sub(distributedSurcharge);
          itemSurcharge = remainingSurcharge;
        }
      }
      item.surchargeShare = itemSurcharge;
      distributedSurcharge = distributedSurcharge.add(itemSurcharge);

      const itemTaxBase = itemSubtotal.sub(itemShare).add(itemSurcharge);
      const itemTax = new Decimal(itemTaxBase.mul(item.taxRate.div(100)).toFixed(2));
      item.taxAmount = itemTax;
      item.total = new Decimal(itemTaxBase.add(itemTax).toFixed(2));
      taxAmount = taxAmount.add(itemTax);
    }

    const subtotal = subtotalNet;
    const total = taxBase.add(surchargeAmount).add(taxAmount);
    const totalRounded = new Decimal(total.toFixed(2));

    return {
      subtotal,
      subtotalGross,
      itemsDiscountTotal,
      taxAmount,
      discountAmount: finalDiscountAmount,
      surchargeAmount,
      total,
      totalRounded
    };
  }
}

export default SalesService;

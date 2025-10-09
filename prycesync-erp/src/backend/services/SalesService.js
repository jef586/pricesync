import { Decimal } from "@prisma/client/runtime/library.js";

class SalesService {
  static calculateTotals(items) {
    let subtotal = new Decimal(0);
    let taxAmount = new Decimal(0);
    let discountAmount = new Decimal(0);

    for (const item of items) {
      const quantity = new Decimal(item.quantity);
      const unitPrice = new Decimal(item.unitPrice);
      const discount = new Decimal(item.discount ?? 0);
      const taxRate = new Decimal(item.taxRate ?? 21);

      const rawSubtotal = quantity.mul(unitPrice);
      const discountValue = rawSubtotal.mul(discount.div(100));
      const itemSubtotal = rawSubtotal.sub(discountValue);
      const itemTax = itemSubtotal.mul(taxRate.div(100));
      const itemTotal = itemSubtotal.add(itemTax);

      subtotal = subtotal.add(itemSubtotal);
      taxAmount = taxAmount.add(itemTax);
      discountAmount = discountAmount.add(discountValue);

      item.subtotal = itemSubtotal;
      item.taxAmount = itemTax;
      item.total = itemTotal;
    }

    const total = subtotal.add(taxAmount);
    const totalRounded = new Decimal(total.toFixed(2));

    return { subtotal, taxAmount, discountAmount, total, totalRounded };
  }
}

export default SalesService;

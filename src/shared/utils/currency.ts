const VAT_RATE = 0.075

export function calculateVAT(amount: number): number {
  return Math.round(amount * VAT_RATE * 100) / 100
}

export function calculateWithVAT(amount: number): number {
  return amount + calculateVAT(amount)
}

export function roundToNaira(amount: number, denomination: 5 | 10 = 5): number {
  return Math.round(amount / denomination) * denomination
}

export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function calculateCartTotals(lineItems: Array<{ unitPrice: number; quantity: number; taxRate: number; discount: number }>) {
  let subtotal = 0
  let totalTax = 0
  let totalDiscount = 0

  for (const item of lineItems) {
    const lineSubtotal = item.unitPrice * item.quantity
    const lineTax = lineSubtotal * item.taxRate
    const lineDiscount = item.discount

    subtotal += lineSubtotal
    totalTax += lineTax
    totalDiscount += lineDiscount
  }

  const grandTotalBeforeRounding = subtotal + totalTax - totalDiscount
  const grandTotal = roundToNaira(grandTotalBeforeRounding)
  const roundingAdjustment = grandTotal - grandTotalBeforeRounding

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    grandTotal,
    roundingAdjustment: Math.round(roundingAdjustment * 100) / 100,
  }
}

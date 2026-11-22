const indianNumber = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

/** 800000 → "₹8,00,000" (Indian digit grouping). */
export function formatINR(amount: number): string {
  return `₹${indianNumber.format(Math.round(amount))}`
}

/** 800000 → "8,00,000" — for amount inputs that show the ₹ sign separately. */
export function formatIndianNumber(amount: number): string {
  return indianNumber.format(Math.round(amount))
}

/** Keeps digits only; returns null when nothing numeric was entered. */
export function parseAmount(input: string): number | null {
  const digits = input.replace(/\D/g, '')
  if (!digits) return null
  return Number(digits.slice(0, 12))
}

/** "9876543210" → "98765 43210". */
export function formatMobile(digits: string): string {
  return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits
}

/** "9876543210" → "+91 98765 43210". */
export function formatMobileWithCode(digits: string): string {
  return `+91 ${formatMobile(digits)}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

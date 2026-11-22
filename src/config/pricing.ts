/**
 * DEMO PRICING CONFIGURATION — the single place where repayment pricing is defined.
 *
 * These values are prototype assumptions used to demonstrate a transparent
 * calculator. They are NOT lender-approved pricing or loan limits. In production,
 * replace this object with the lending partner's rate card / pricing API.
 * Every screen (estimate card, breakdown sheet, review, offer) reads from here.
 */
export const PRICING = {
  /** Annual nominal interest rate, % p.a. */
  annualRatePercent: 16,
  /** Interest is charged every month on the outstanding (reducing) principal. */
  interestMethod: 'Monthly reducing balance',
  /** One-time processing fee in ₹ — demonstration assumption: no fee. */
  processingFee: 0,
  /** GST applied to the processing fee, in %. */
  gstOnFeePercent: 18,
  tenureOptions: [3, 6, 12] as const,
  defaultTenure: 3 as const,
  defaultAmount: 15_000,
  /** Input bounds for this prototype only — not real lender limits. */
  minAmount: 1_000,
  maxAmount: 1_00_000,
} as const

export type Tenure = (typeof PRICING.tenureOptions)[number]
export type Pricing = typeof PRICING

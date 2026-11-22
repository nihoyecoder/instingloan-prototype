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
  /**
   * The only amounts a student can request in this prototype (no free-text entry).
   * Illustrative options — not lender-approved loan limits. Nothing is preselected.
   */
  amountOptions: [1_000, 2_500, 5_000, 7_500, 10_000, 15_000] as const,
  /** The amount Ishita picks in the walkthrough (used by the presenter's demo shortcuts). */
  demoAmount: 15_000 as const,
} as const

export type Tenure = (typeof PRICING.tenureOptions)[number]
export type LoanAmount = (typeof PRICING.amountOptions)[number]
export type Pricing = typeof PRICING

/** True when `amount` is one of the selectable options. */
export const isLoanAmountOption = (amount: number): amount is LoanAmount =>
  (PRICING.amountOptions as readonly number[]).includes(amount)

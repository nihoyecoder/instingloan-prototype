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
  /** Repayment tenures in months. Nothing is preselected — the student chooses. */
  tenureOptions: [3, 6, 12] as const,
  /**
   * The only amounts a student can request in this prototype (no free-text entry).
   * The largest option is the product's maximum *requested* amount — not a
   * guaranteed eligible or approved amount. Nothing is preselected.
   */
  amountOptions: [1_000, 2_500, 5_000] as const,
  /** What Ishita picks in the walkthrough (used only by the presenter's demo shortcuts). */
  demoAmount: 5_000 as const,
  demoTenure: 3 as const,
} as const

/** The most a student can request (the largest amount option). */
export const MAX_REQUEST_AMOUNT = Math.max(...PRICING.amountOptions)

export type Tenure = (typeof PRICING.tenureOptions)[number]
export type LoanAmount = (typeof PRICING.amountOptions)[number]
export type Pricing = typeof PRICING

// Compile-time guards: the demo values must be real options.
PRICING.demoAmount satisfies LoanAmount
PRICING.demoTenure satisfies Tenure

/** True when `amount` is one of the selectable options. */
export const isLoanAmountOption = (amount: number): amount is LoanAmount =>
  (PRICING.amountOptions as readonly number[]).includes(amount)

/** True when `months` is one of the selectable tenures. */
export const isTenureOption = (months: unknown): months is Tenure =>
  typeof months === 'number' && (PRICING.tenureOptions as readonly number[]).includes(months)

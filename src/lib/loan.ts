import { PRICING, type Pricing } from '../config/pricing'

export interface Instalment {
  number: number
  principal: number
  interest: number
  /** Principal + interest for this month. */
  emi: number
  /** Outstanding principal after this instalment. */
  balance: number
}

export interface RepaymentPlan {
  principal: number
  tenure: number
  annualRatePercent: number
  /** The rounded monthly instalment (the last one may differ by a rupee). */
  emi: number
  schedule: Instalment[]
  totalInterest: number
  processingFee: number
  gstOnFee: number
  totalRepayment: number
}

/**
 * Standard reducing-balance EMI: P × r × (1 + r)^n / ((1 + r)^n − 1),
 * where r is the monthly rate and n the number of monthly instalments.
 */
export function emiFormula(principal: number, annualRatePercent: number, months: number): number {
  const r = annualRatePercent / 12 / 100
  if (months <= 0) return 0
  if (r === 0) return principal / months
  const growth = (1 + r) ** months
  return (principal * r * growth) / (growth - 1)
}

/**
 * Builds a month-by-month schedule in whole rupees. Interest is charged on the
 * outstanding balance each month; the final instalment absorbs rounding so the
 * principal column always adds up to the loan amount exactly. Every total shown
 * in the app is derived from this one schedule, so the figures always reconcile.
 */
export function buildRepaymentPlan(amount: number, tenure: number, pricing: Pricing = PRICING): RepaymentPlan {
  const principal = Math.max(0, Math.round(amount))
  const r = pricing.annualRatePercent / 12 / 100
  const processingFee = pricing.processingFee
  const gstOnFee = Math.round((processingFee * pricing.gstOnFeePercent) / 100)

  if (principal === 0 || tenure <= 0) {
    return {
      principal,
      tenure,
      annualRatePercent: pricing.annualRatePercent,
      emi: 0,
      schedule: [],
      totalInterest: 0,
      processingFee,
      gstOnFee,
      totalRepayment: processingFee + gstOnFee,
    }
  }

  const emi = Math.round(emiFormula(principal, pricing.annualRatePercent, tenure))
  const schedule: Instalment[] = []
  let balance = principal
  for (let number = 1; number <= tenure; number += 1) {
    const interest = Math.round(balance * r)
    const last = number === tenure
    // Guard against a rounded EMI that would overshoot the balance early on.
    const principalPart = last ? balance : Math.min(balance, emi - interest)
    balance -= principalPart
    schedule.push({ number, principal: principalPart, interest, emi: principalPart + interest, balance })
  }

  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0)
  return {
    principal,
    tenure,
    annualRatePercent: pricing.annualRatePercent,
    emi,
    schedule,
    totalInterest,
    processingFee,
    gstOnFee,
    totalRepayment: principal + totalInterest + processingFee + gstOnFee,
  }
}

import { isLoanAmountOption } from '../config/pricing'
import { buildRepaymentPlan, type RepaymentPlan } from '../lib/loan'
import { formatDisplayDate } from '../lib/date'
import { formatINR, formatMobileWithCode } from '../lib/format'
import { STEP_SCREENS, type AppState, type DocFile, type Income, type LoanRequest, type ScreenId } from './types'

export const stepIndex = (screen: ScreenId) => (STEP_SCREENS as readonly ScreenId[]).indexOf(screen)

/** One repayment plan for the whole app, derived from the loan request (empty until amount + tenure are chosen). */
export const repaymentPlan = (loan: LoanRequest): RepaymentPlan => buildRepaymentPlan(loan.amount, loan.tenure)

/** True once both an amount and a tenure have been chosen, so an estimate can be shown. */
export const hasEstimate = (loan: LoanRequest) => isLoanAmountOption(loan.amount) && loan.tenure !== null

/** "3 months"; "Not chosen" when there's no tenure yet (never "null months"). */
export const tenureLabel = (months: number | null | undefined) =>
  months ? `${months} month${months === 1 ? '' : 's'}` : 'Not chosen'

/** What the money is for, as the student described it. */
export function purposeLabel(loan: LoanRequest): string {
  if (loan.purpose === 'Other') return loan.purposeNote.trim() || 'Other'
  return loan.purpose
}

export function firstName(name: string, fallback: string): string {
  const first = name.trim().split(/\s+/)[0]
  return first || fallback
}

/** "ABCDE1234F" → "AB•••••34F" — the only form of a PAN the app keeps. */
export function maskPan(pan: string): string {
  return `${pan.slice(0, 2)}•••••${pan.slice(-3)}`
}

/** "501004737829" → "••••••••7829". */
export function maskAccount(accountNumber: string): string {
  return `${'•'.repeat(Math.max(0, accountNumber.length - 4))}${accountNumber.slice(-4)}`
}

export function fileTypeLabel(file: DocFile): string {
  const extension = file.name.split('.').pop()?.toUpperCase() ?? ''
  if (file.type === 'application/pdf' || extension === 'PDF') return 'PDF'
  if (file.type === 'image/png' || extension === 'PNG') return 'PNG'
  return 'JPG'
}

/** Anything worth resuming: the student started and hasn't submitted yet. */
export const hasDraft = (state: AppState) => state.started && !state.submission

export const formatDob = (iso: string) => formatDisplayDate(iso)

export function personalSummary(state: AppState): string {
  const { personal } = state
  return [personal.fullName.trim(), personal.dob ? formatDisplayDate(personal.dob) : ''].filter(Boolean).join(' · ')
}

export function contactLine(state: AppState): string {
  return [state.personal.email, state.personal.mobile ? formatMobileWithCode(state.personal.mobile) : ''].filter(Boolean).join(' · ')
}

/** How a student without income plans to repay — the note when they chose "Other". */
export function repaymentSourceLabel(income: Income): string {
  if (income.repaymentSource === 'Other') return income.repaymentNote.trim() || 'Other'
  return income.repaymentSource
}

export function incomeSummary(state: AppState): string {
  const { income } = state
  if (income.hasIncome === 'no') {
    const repay = repaymentSourceLabel(income)
    return repay ? `No personal income · Repaying with: ${repay}` : 'No personal income declared'
  }
  if (income.hasIncome !== 'yes' || !income.source) return 'Not answered yet'
  return income.monthlyAmount > 0 ? `${income.source} · ${formatINR(income.monthlyAmount)}/month` : income.source
}

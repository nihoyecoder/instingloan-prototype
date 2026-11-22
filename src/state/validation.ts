import { BANKS, INCOME_COPY, POLICY, isRepaymentSource } from '../config/policy'
import { isLoanAmountOption, isTenureOption } from '../config/pricing'
import { ageOn, parseISODate } from '../lib/date'
import type { AppState, Bank, Consents, Income, LoanRequest, Personal, ScreenId, Student } from './types'

export type Errors<K extends string> = Partial<Record<K, string>>

export const hasErrors = (errors: object) => Object.values(errors).some(Boolean)

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validatePan(pan: string): string | undefined {
  if (!pan) return 'Enter your PAN'
  if (pan.length < 10) return 'PAN has 10 characters, e.g. ABCDE1234F'
  if (!PAN_PATTERN.test(pan)) return 'Enter a valid PAN: 5 letters, 4 digits, 1 letter'
  return undefined
}

export function validateIfsc(ifsc: string, bankName: string): string | undefined {
  if (!ifsc) return 'Enter the IFSC code'
  if (!IFSC_PATTERN.test(ifsc)) return 'Enter a valid IFSC, e.g. HDFC0001324'
  const bank = BANKS.find((item) => item.name === bankName)
  if (bank && !ifsc.startsWith(bank.ifscPrefix)) return `This IFSC isn’t for ${bank.name}`
  return undefined
}

export function validateAccountNumber(account: string): string | undefined {
  if (!account) return 'Enter your account number'
  if (!/^\d{9,18}$/.test(account)) return 'Account numbers have 9 to 18 digits'
  return undefined
}

const normaliseName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ')

export type LoanKey = 'amount' | 'purpose' | 'purposeNote' | 'tenure'

export function validateLoan(loan: LoanRequest): Errors<LoanKey> {
  const errors: Errors<LoanKey> = {}
  // Only the predefined options are accepted — never an arbitrary amount.
  if (!isLoanAmountOption(loan.amount)) errors.amount = 'Choose a loan amount'
  if (!loan.purpose) errors.purpose = 'Select the main purpose of the loan'
  if (loan.purpose === 'Other' && loan.purposeNote.trim().length < 3) errors.purposeNote = 'Tell us briefly what the loan is for'
  if (!isTenureOption(loan.tenure)) errors.tenure = 'Choose a repayment tenure'
  return errors
}

export type PersonalKey = 'fullName' | 'dob' | 'email' | 'mobile' | 'address' | 'city' | 'state' | 'pinCode'

export function validatePersonal(personal: Personal, now = new Date()): Errors<PersonalKey> {
  const errors: Errors<PersonalKey> = {}
  const name = personal.fullName.trim()
  if (!name) errors.fullName = 'Enter your full legal name'
  else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name)) errors.fullName = 'Use letters only, as on your PAN'
  else if (name.length < 3) errors.fullName = 'Enter your full name'
  if (!personal.dob || !parseISODate(personal.dob)) errors.dob = 'Select your date of birth'
  else {
    const age = ageOn(personal.dob, now) ?? 0
    if (age < POLICY.minimumAge) errors.dob = `You need to be ${POLICY.minimumAge} or older to apply`
    else if (age > 100) errors.dob = 'Check your date of birth'
  }
  if (!personal.email.trim()) errors.email = 'Enter your email address'
  else if (!EMAIL_PATTERN.test(personal.email.trim())) errors.email = 'Enter a valid email, e.g. name@example.com'
  if (!/^[6-9]\d{9}$/.test(personal.mobile)) errors.mobile = 'Your registered mobile number is missing'
  if (personal.address.trim().length < 5) errors.address = 'Enter your house number, street and area'
  if (!personal.city.trim()) errors.city = 'Enter your city'
  if (!personal.state) errors.state = 'Select your state'
  if (!personal.pinCode) errors.pinCode = 'Enter your PIN code'
  else if (!/^[1-9]\d{5}$/.test(personal.pinCode)) errors.pinCode = 'Enter a valid 6-digit PIN'
  return errors
}

export type StudentKey = keyof Student

export function validateStudent(student: Student): Errors<StudentKey> {
  const errors: Errors<StudentKey> = {}
  if (!student.institution.trim()) errors.institution = 'Enter your institution or college'
  if (!student.course) errors.course = 'Select your course'
  if (!student.courseLevel) errors.courseLevel = 'Select your course level'
  if (!student.yearOfStudy) errors.yearOfStudy = 'Select your year of study'
  if (!student.status) errors.status = 'Select your student status'
  return errors
}

export type IncomeKey =
  | 'hasIncome'
  | 'source'
  | 'organisation'
  | 'monthlyAmount'
  | 'startDate'
  | 'endDate'
  | 'repaymentSource'
  | 'repaymentNote'

/**
 * Hidden fields are never validated. A student without income is never blocked for
 * that — they only answer how they plan to repay.
 */
export function validateIncome(income: Income, now = new Date()): Errors<IncomeKey> {
  const errors: Errors<IncomeKey> = {}
  if (!income.hasIncome) {
    errors.hasIncome = 'Choose an option to continue'
    return errors
  }
  if (income.hasIncome === 'no') {
    if (!isRepaymentSource(income.repaymentSource)) errors.repaymentSource = 'Choose how you plan to repay'
    else if (income.repaymentSource === 'Other' && income.repaymentNote.trim().length < 3) {
      errors.repaymentNote = 'Tell us briefly how you’ll repay'
    }
    return errors
  }
  if (!income.source) {
    errors.source = 'Select your source of income'
    return errors
  }
  const copy = INCOME_COPY[income.source]
  if (copy.organisationRequired && !income.organisation.trim()) errors.organisation = `Enter the ${copy.organisation.toLowerCase()}`
  if (!income.monthlyAmount) errors.monthlyAmount = `Enter your ${copy.amount.toLowerCase()}`
  if (!income.startDate) errors.startDate = 'Select the start date'
  else if (income.startDate > now.toISOString().slice(0, 10)) errors.startDate = 'Start date can’t be in the future'
  if (copy.end) {
    if (!income.endDate) errors.endDate = 'Select the end date'
    else if (income.startDate && income.endDate < income.startDate) errors.endDate = 'End date must be after the start date'
  }
  return errors
}

export type KycKey = 'pan' | 'identityProof' | 'studentProof'

export function validateKyc(state: AppState): Errors<KycKey> {
  const errors: Errors<KycKey> = {}
  if (state.kyc.panStatus !== 'verified') errors.pan = 'Enter and verify your PAN'
  if (state.documents.identityProof.status !== 'uploaded') errors.identityProof = 'Upload an identity proof'
  if (state.documents.studentProof.status !== 'uploaded') errors.studentProof = 'Upload your student ID or college proof'
  return errors
}

export type BankKey = 'holderName' | 'bankName' | 'account' | 'verification'

export function validateBank(bank: Bank, applicantName: string): Errors<BankKey> {
  const errors: Errors<BankKey> = {}
  if (!bank.holderName.trim()) errors.holderName = 'Enter the account holder’s name'
  else if (normaliseName(bank.holderName) !== normaliseName(applicantName)) {
    errors.holderName = `The account must be in your name (${applicantName.trim()})`
  }
  if (!bank.bankName) errors.bankName = 'Select your bank'
  if (bank.verification !== 'verified') errors.verification = 'Verify your bank account to continue'
  return errors
}

export const consentsComplete = (consents: Consents) =>
  consents.accuracy && consents.kyc && consents.bureau && consents.dataProcessing

export interface Blocker {
  screen: ScreenId
  label: string
}

/** Sections that still need attention before the application can be submitted. */
export function submissionBlockers(state: AppState): Blocker[] {
  const blockers: Blocker[] = []
  if (hasErrors(validateLoan(state.loan))) blockers.push({ screen: 'loan', label: 'Loan details' })
  if (hasErrors(validatePersonal(state.personal)) || hasErrors(validateStudent(state.student))) {
    blockers.push({ screen: 'details', label: 'Your details' })
  }
  if (hasErrors(validateIncome(state.income))) blockers.push({ screen: 'income', label: 'Income details' })
  if (hasErrors(validateKyc(state))) blockers.push({ screen: 'kyc', label: 'KYC & documents' })
  if (hasErrors(validateBank(state.bank, state.personal.fullName))) blockers.push({ screen: 'bank', label: 'Bank account' })
  if (state.documents.identityProof.status === 'uploading' || state.documents.studentProof.status === 'uploading') {
    blockers.push({ screen: 'kyc', label: 'An upload is still in progress' })
  }
  // Income proof is uploaded on Income details, and only counts when the student has income.
  if (state.income.hasIncome === 'yes' && state.documents.incomeProof.status === 'uploading') {
    blockers.push({ screen: 'income', label: 'An upload is still in progress' })
  }
  return blockers
}

import type { IncomeSource, RepaymentSource } from '../config/policy'
import type { Tenure } from '../config/pricing'

export type ScreenId = 'start' | 'loan' | 'details' | 'income' | 'kyc' | 'bank' | 'review' | 'submitted' | 'track'

/** The six screens covered by "Step X of 6", in order. */
export const STEP_SCREENS = ['loan', 'details', 'income', 'kyc', 'bank', 'review'] as const
export type StepScreenId = (typeof STEP_SCREENS)[number]

export type Direction = 'forward' | 'back' | 'none'
export type YesNo = '' | 'yes' | 'no'

export interface LoanRequest {
  amount: number
  purpose: string
  /** Free text when the purpose is "Other". */
  purposeNote: string
  /** Months — null until the student chooses one. */
  tenure: Tenure | null
}

export interface Personal {
  fullName: string
  dob: string // ISO yyyy-mm-dd
  email: string
  /** Registered mobile — verified at sign-up, shown read-only here. */
  mobile: string
  address: string
  city: string
  state: string
  pinCode: string
}

export interface Student {
  institution: string
  course: string
  courseLevel: string
  yearOfStudy: string
  status: string
}

export interface Income {
  hasIncome: YesNo
  source: IncomeSource | ''
  organisation: string
  monthlyAmount: number
  startDate: string
  endDate: string
  /** No-income path only: how the student plans to repay. */
  repaymentSource: RepaymentSource | ''
  /** Free text when repaymentSource is "Other". */
  repaymentNote: string
}

/** Simulated PAN check. Only a masked PAN is ever stored. */
export type CheckStatus = 'idle' | 'checking' | 'verified' | 'failed'

export interface Kyc {
  panMasked: string
  panStatus: CheckStatus
  panCheckedAt: string | null
}

export type DocId = 'identityProof' | 'studentProof' | 'incomeProof'
export type DocStatus = 'empty' | 'uploading' | 'uploaded' | 'failed'
export type DocFailure = 'network' | 'invalid'

export interface DocFile {
  name: string
  size: number
  type: string
}

export interface DocEntry {
  status: DocStatus
  file: DocFile | null
  progress: number
  error: string | null
  failure: DocFailure | null
  uploadedAt: string | null
}

/** Only the masked account number and its last four digits are stored. */
export interface Bank {
  holderName: string
  bankName: string
  accountMasked: string
  accountLast4: string
  ifsc: string
  verification: CheckStatus
  verifiedAt: string | null
  failureReason: string | null
}

export interface Consents {
  accuracy: boolean
  kyc: boolean
  bureau: boolean
  dataProcessing: boolean
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'action_required'
  | 'offer_available'
  | 'offer_accepted'
  | 'offer_declined'
  | 'rejected'
  | 'disbursed'

/** Things that happened to a submitted application, newest last. */
export type EventKind =
  | 'submitted'
  | 'documents_received'
  | 'under_review'
  | 'action_required'
  | 'document_received'
  | 'offer_available'
  | 'offer_accepted'
  | 'offer_declined'
  | 'rejected'
  | 'disbursed'

export interface StatusEvent {
  kind: EventKind
  at: string
  title: string
  note?: string
}

/** What the lender needs from the student when the status is "action required". */
export interface ActionRequest {
  docId: DocId
  title: string
  reason: string
}

/** A (simulated) offer — computed with the same pricing as the estimate. */
export interface Offer {
  amount: number
  annualRatePercent: number
  tenure: number
  emi: number
  totalInterest: number
  processingFee: number
  gstOnFee: number
  totalRepayment: number
  issuedAt: string
  validUntil: string
  status: 'available' | 'accepted' | 'declined'
  decidedAt: string | null
}

export interface Disbursement {
  amount: number
  reference: string
  bankName: string
  accountLast4: string
  at: string
  firstEmiDate: string
}

export interface Submission {
  referenceId: string
  submittedAt: string
}

export interface ApplicationRecord {
  status: ApplicationStatus
  history: StatusEvent[]
  request: ActionRequest | null
}

export interface AppState {
  version: 1
  screen: ScreenId
  /** Transient — only drives the screen transition, never persisted. */
  direction: Direction
  started: boolean
  /** Highest step index reached (0-based over STEP_SCREENS). */
  furthestStep: number
  resumeScreen: StepScreenId
  /** Set while editing a section from Review — Continue returns there. */
  returnTo: 'review' | null
  loan: LoanRequest
  personal: Personal
  student: Student
  income: Income
  kyc: Kyc
  documents: Record<DocId, DocEntry>
  bank: Bank
  consents: Consents
  /** Demo switch: the next upload drops the connection once, to show Retry. */
  failNextUpload: boolean
  submission: Submission | null
  application: ApplicationRecord
  offer: Offer | null
  disbursement: Disbursement | null
  lastCheckedAt: string | null
}

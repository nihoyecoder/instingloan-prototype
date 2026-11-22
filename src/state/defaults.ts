import type { AppState, Bank, DocEntry, DocId } from './types'

export const DOC_IDS: DocId[] = ['identityProof', 'studentProof', 'incomeProof']

export const emptyDoc = (): DocEntry => ({
  status: 'empty',
  file: null,
  progress: 0,
  error: null,
  failure: null,
  uploadedAt: null,
})

export const emptyDocuments = (): Record<DocId, DocEntry> => ({
  identityProof: emptyDoc(),
  studentProof: emptyDoc(),
  incomeProof: emptyDoc(),
})

export const emptyBank = (holderName = ''): Bank => ({
  holderName,
  bankName: '',
  accountMasked: '',
  accountLast4: '',
  ifsc: '',
  verification: 'idle',
  verifiedAt: null,
  failureReason: null,
})

/**
 * Fresh application for the (fictional) registered student Ishita Verma, 21.
 * Personal and student details come from her InstingLoan profile; the loan and
 * income values are the walkthrough's demonstration data. PAN, documents and the
 * bank account are always entered during the journey.
 */
export function createInitialState(): AppState {
  return {
    version: 1,
    screen: 'start',
    direction: 'none',
    started: false,
    furthestStep: 0,
    resumeScreen: 'loan',
    returnTo: null,
    loan: {
      // Nothing is preselected — the student chooses the amount, purpose and tenure.
      amount: 0,
      purpose: '',
      purposeNote: '',
      tenure: null,
    },
    personal: {
      fullName: 'Ishita Verma',
      dob: '2005-03-12',
      email: 'ishita.verma@example.com',
      mobile: '9876543210',
      address: 'B-204, Green Valley Apartments, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pinCode: '201309',
    },
    student: {
      institution: 'Delhi School of Management',
      course: 'BBA',
      courseLevel: 'Undergraduate',
      yearOfStudy: '3rd Year',
      status: 'Currently studying',
    },
    income: {
      hasIncome: 'yes',
      source: 'Internship stipend',
      organisation: 'GrowthOrbit Marketing',
      monthlyAmount: 12_000,
      startDate: '2026-06-01',
      endDate: '2026-12-31',
      repaymentSource: '',
      repaymentNote: '',
    },
    kyc: { panMasked: '', panStatus: 'idle', panCheckedAt: null },
    documents: emptyDocuments(),
    bank: emptyBank('Ishita Verma'),
    consents: { accuracy: false, kyc: false, bureau: false, dataProcessing: false },
    failNextUpload: true,
    submission: null,
    application: { status: 'draft', history: [], request: null },
    offer: null,
    disbursement: null,
    lastCheckedAt: null,
  }
}

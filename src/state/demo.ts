/**
 * Presenter shortcuts — fictional data only. PANs and account numbers exist
 * here in masked form; "uploaded" documents are just names and sizes.
 */
import { PRICING } from '../config/pricing'
import { DEMO_REFERENCE_ID } from '../services/mock'
import { createInitialState } from './defaults'
import { maskAccount, maskPan } from './selectors'
import type { AppState, StatusEvent } from './types'

const minutesAgo = (now: number, minutes: number) => new Date(now - minutes * 60_000).toISOString()

/** Everything filled in and verified, waiting on the Review & Consent screen. */
export function buildDemoDraft(now = Date.now()): AppState {
  const state = createInitialState()
  const at = minutesAgo(now, 6)
  return {
    ...state,
    screen: 'review',
    started: true,
    furthestStep: 5,
    resumeScreen: 'review',
    failNextUpload: false,
    loan: { ...state.loan, amount: PRICING.demoAmount },
    kyc: { panMasked: maskPan('ABCDE1234F'), panStatus: 'verified', panCheckedAt: at },
    documents: {
      identityProof: {
        status: 'uploaded',
        file: { name: 'Aadhaar_Card.pdf', size: 1_258_291, type: 'application/pdf' },
        progress: 100,
        error: null,
        failure: null,
        uploadedAt: at,
      },
      studentProof: {
        status: 'uploaded',
        file: { name: 'College_ID.pdf', size: 945_152, type: 'application/pdf' },
        progress: 100,
        error: null,
        failure: null,
        uploadedAt: at,
      },
      incomeProof: {
        status: 'uploaded',
        file: { name: 'Internship_Letter.pdf', size: 312_524, type: 'application/pdf' },
        progress: 100,
        error: null,
        failure: null,
        uploadedAt: at,
      },
    },
    bank: {
      holderName: 'Ishita Verma',
      bankName: 'HDFC Bank',
      accountMasked: maskAccount('501004737829'),
      accountLast4: '7829',
      ifsc: 'HDFC0001324',
      verification: 'verified',
      verifiedAt: at,
      failureReason: null,
    },
  }
}

/** Submits an application (the given one, or the demo draft) as if it went through a while ago. */
export function withDemoSubmission(base: AppState, now = Date.now()): AppState {
  const submittedAt = minutesAgo(now, 95)
  const history: StatusEvent[] = [
    { kind: 'submitted', at: submittedAt, title: 'Application submitted' },
    { kind: 'documents_received', at: minutesAgo(now, 94), title: 'KYC & documents received' },
    { kind: 'under_review', at: minutesAgo(now, 90), title: 'Under review' },
  ]
  return {
    ...base,
    screen: 'track',
    started: true,
    returnTo: null,
    consents: { accuracy: true, kyc: true, bureau: true, dataProcessing: true },
    submission: { referenceId: DEMO_REFERENCE_ID, submittedAt },
    application: { status: 'under_review', history, request: null },
    offer: null,
    disbursement: null,
  }
}

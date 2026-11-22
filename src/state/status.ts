/**
 * Application status model for tracking. Statuses are alternatives, not a fixed
 * sequence — the timeline below is derived from what actually happened.
 * "Verified", "approved" and "disbursed" only ever appear after the matching
 * simulated event.
 */
import { formatTimestamp } from '../lib/date'
import { formatINR } from '../lib/format'
import type { AppState, ApplicationStatus, EventKind } from './types'

export type Tone = 'neutral' | 'progress' | 'attention' | 'success' | 'stopped'

interface StatusMeta {
  /** Short label for pills. */
  label: string
  /** Headline on the status card. */
  title: string
  tone: Tone
}

export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  draft: { label: 'Draft', title: 'Draft', tone: 'neutral' },
  submitted: { label: 'Submitted', title: 'Submitted', tone: 'progress' },
  under_review: { label: 'Under review', title: 'Under review', tone: 'progress' },
  action_required: { label: 'Action required', title: 'Action required', tone: 'attention' },
  offer_available: { label: 'Offer available', title: 'Offer available', tone: 'success' },
  offer_accepted: { label: 'Offer accepted', title: 'Offer accepted', tone: 'progress' },
  offer_declined: { label: 'Offer declined', title: 'Offer declined', tone: 'neutral' },
  rejected: { label: 'Not approved', title: 'Not approved', tone: 'stopped' },
  disbursed: { label: 'Disbursed', title: 'Disbursed', tone: 'success' },
}

/** Body copy under the status headline. Never promises a time frame. */
export function statusDescription(state: AppState): string {
  switch (state.application.status) {
    case 'draft':
      return 'Your application hasn’t been submitted yet.'
    case 'submitted':
      return 'We’ve received your application. We’ll notify you when there’s an update.'
    case 'under_review':
      return 'We’re verifying your details and documents. We’ll notify you when there’s an update.'
    case 'action_required':
      return 'We need one more thing from you before we can continue.'
    case 'offer_available':
      return 'A loan offer is ready for you to review. Nothing is accepted until you confirm.'
    case 'offer_accepted':
      return 'You’ve accepted the offer. We’ll notify you when the amount is disbursed.'
    case 'offer_declined':
      return 'You declined the offer, so this application is now closed.'
    case 'rejected':
      return 'We’re unable to offer you a loan for this application.'
    case 'disbursed':
      return state.disbursement
        ? `${formatINR(state.disbursement.amount)} has been sent to your bank account.`
        : 'The loan amount has been sent to your bank account.'
  }
}

export type RowState = 'done' | 'current' | 'upcoming' | 'attention' | 'stopped'

export interface TimelineRow {
  key: string
  title: string
  detail: string
  state: RowState
  badge: string
}

const lastAt = (state: AppState, kinds: EventKind[]) =>
  [...state.application.history].reverse().find((event) => kinds.includes(event.kind))?.at

const when = (iso?: string) => (iso ? formatTimestamp(iso) : '')

/** The five tracking stages from the brief, filled in from the application's history. */
export function buildTimeline(state: AppState): TimelineRow[] {
  const status = state.application.status
  const submittedAt = lastAt(state, ['submitted'])
  const documentsAt = lastAt(state, ['document_received', 'documents_received'])
  const reviewAt = lastAt(state, ['under_review'])
  const offerAt = lastAt(state, ['offer_available'])
  const decidedAt = lastAt(state, ['offer_accepted', 'offer_declined', 'rejected'])
  const disbursedAt = lastAt(state, ['disbursed'])

  const decided = ['offer_available', 'offer_accepted', 'offer_declined', 'rejected', 'disbursed'].includes(status)

  const rows: TimelineRow[] = [
    { key: 'submitted', title: 'Application submitted', detail: when(submittedAt), state: 'done', badge: 'Completed' },
    { key: 'documents', title: 'KYC & documents received', detail: when(documentsAt), state: 'done', badge: 'Completed' },
  ]

  // Stage 3 — review
  if (status === 'action_required') {
    rows.push({
      key: 'review',
      title: 'Action required',
      detail: state.application.request?.title ?? 'We need something from you to continue.',
      state: 'attention',
      badge: 'Action needed',
    })
  } else if (decided) {
    rows.push({ key: 'review', title: 'Review completed', detail: when(offerAt ?? decidedAt ?? reviewAt), state: 'done', badge: 'Completed' })
  } else {
    rows.push({
      key: 'review',
      title: 'Under review',
      detail: status === 'submitted' ? 'Your review is about to start.' : 'Our lending partner is assessing your profile and eligibility.',
      state: 'current',
      badge: 'In progress',
    })
  }

  // Stage 4 — decision
  if (status === 'offer_available') {
    rows.push({ key: 'decision', title: 'Loan offer ready', detail: 'Review the offer terms and decide.', state: 'current', badge: 'Offer ready' })
  } else if (status === 'offer_accepted' || status === 'disbursed') {
    rows.push({
      key: 'decision',
      title: 'Offer accepted',
      detail: when(lastAt(state, ['offer_accepted'])),
      state: 'done',
      badge: 'Completed',
    })
  } else if (status === 'offer_declined') {
    rows.push({ key: 'decision', title: 'Offer declined', detail: when(decidedAt), state: 'stopped', badge: 'Declined' })
  } else if (status === 'rejected') {
    rows.push({ key: 'decision', title: 'Loan decision', detail: 'Not approved for this application.', state: 'stopped', badge: 'Not approved' })
  } else {
    rows.push({
      key: 'decision',
      title: 'Loan decision',
      detail: 'You’ll receive your loan offer if you’re eligible.',
      state: 'upcoming',
      badge: 'Pending',
    })
  }

  // Stage 5 — disbursement (not shown once the application has ended without a loan)
  if (status === 'disbursed' && state.disbursement) {
    rows.push({
      key: 'disbursement',
      title: 'Disbursed',
      detail: `${formatINR(state.disbursement.amount)} sent · ${when(disbursedAt)}`,
      state: 'done',
      badge: 'Completed',
    })
  } else if (status === 'offer_accepted') {
    rows.push({
      key: 'disbursement',
      title: 'Disbursement',
      detail: 'The amount will be transferred to your verified bank account.',
      state: 'current',
      badge: 'In progress',
    })
  } else if (status !== 'rejected' && status !== 'offer_declined') {
    rows.push({
      key: 'disbursement',
      title: 'Disbursement',
      detail: 'Once you accept the offer, the amount will be transferred to your bank account.',
      state: 'upcoming',
      badge: 'Pending',
    })
  }
  return rows
}

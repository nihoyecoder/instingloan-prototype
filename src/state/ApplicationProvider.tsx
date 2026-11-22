import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { POLICY } from '../config/policy'
import { addMonths } from '../lib/date'
import { buildRepaymentPlan } from '../lib/loan'
import {
  demoDisbursementReference,
  refreshApplicationStatus,
  submitApplication,
  verifyBankAccount,
  verifyPan,
  type CheckResult,
} from '../services/mock'
import { useUi } from '../ui/UiProvider'
import { buildDemoDraft, withDemoSubmission } from './demo'
import { DOC_IDS, createInitialState, emptyDoc } from './defaults'
import { forgetAllFiles, forgetFile, purgeLegacyStorage, recallFile, rememberFile } from './fileStore'
import { maskAccount, maskPan, stepIndex } from './selectors'
import {
  type AppState,
  type Bank,
  type Consents,
  type Direction,
  type DocEntry,
  type DocFile,
  type DocId,
  type EventKind,
  type Income,
  type LoanRequest,
  type Personal,
  type ScreenId,
  type StepScreenId,
  type Student,
} from './types'

const STORAGE_KEY = 'instingloan:qsl:v1'

type Section = 'loan' | 'personal' | 'student' | 'income' | 'bank' | 'consents'

type Action =
  | { type: 'navigate'; screen: ScreenId; direction: Direction }
  | { type: 'patch'; section: Section; value: object }
  | { type: 'apply'; update: (state: AppState) => AppState }
  | { type: 'replace'; state: AppState }

const now = () => new Date().toISOString()

/** Adds an event to the history and moves the application to `status`. */
function record(state: AppState, kind: EventKind, title: string, status = state.application.status, note?: string): AppState {
  const event = note ? { kind, at: now(), title, note } : { kind, at: now(), title }
  return { ...state, application: { ...state.application, status, history: [...state.application.history, event] } }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'navigate': {
      const index = stepIndex(action.screen)
      return {
        ...state,
        screen: action.screen,
        direction: action.direction,
        furthestStep: index >= 0 ? Math.max(state.furthestStep, index) : state.furthestStep,
        resumeScreen: index >= 0 && !state.submission ? (action.screen as StepScreenId) : state.resumeScreen,
        returnTo: action.screen === state.returnTo || action.screen === 'start' ? null : state.returnTo,
      }
    }
    case 'patch':
      return { ...state, [action.section]: { ...state[action.section], ...action.value } }
    case 'apply':
      return action.update(state)
    case 'replace':
      return action.state
  }
}

/** Restores the saved draft. Sensitive values were never saved, so there is nothing to strip. */
function loadState(): AppState {
  purgeLegacyStorage()
  const initial = createInitialState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initial
    const saved = JSON.parse(raw) as Partial<AppState>
    if (saved.version !== 1) return initial
    const documents = { ...initial.documents }
    for (const id of DOC_IDS) {
      const entry: DocEntry = { ...emptyDoc(), ...saved.documents?.[id] }
      // File contents are never stored, so an interrupted upload can't resume after a refresh.
      documents[id] =
        entry.status === 'uploading'
          ? { ...entry, status: 'failed', progress: 0, failure: 'invalid', error: 'Upload interrupted — choose the file again' }
          : entry
    }
    const merged: AppState = {
      ...initial,
      ...saved,
      direction: 'none',
      loan: { ...initial.loan, ...saved.loan },
      personal: { ...initial.personal, ...saved.personal },
      student: { ...initial.student, ...saved.student },
      income: { ...initial.income, ...saved.income },
      kyc: { ...initial.kyc, ...saved.kyc },
      bank: { ...initial.bank, ...saved.bank },
      consents: { ...initial.consents, ...saved.consents },
      documents,
      application: { ...initial.application, ...saved.application },
    }
    // A check that was running when the page closed never finished.
    if (merged.kyc.panStatus === 'checking') merged.kyc = { ...merged.kyc, panStatus: 'idle', panMasked: '' }
    if (merged.bank.verification === 'checking') merged.bank = { ...merged.bank, verification: 'idle' }
    // Screens that need data which isn't there fall back safely.
    if ((merged.screen === 'submitted' || merged.screen === 'track') && !merged.submission) merged.screen = 'start'
    if (merged.submission && stepIndex(merged.screen) >= 0) merged.screen = 'track'
    return merged
  } catch {
    return initial
  }
}

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png']
const ACCEPTED_EXTENSION = /\.(pdf|jpe?g|png)$/i

/** Short messages — they sit on one line in the document card. */
function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME.includes(file.type) && !ACCEPTED_EXTENSION.test(file.name)) return `Use a ${POLICY.documents.accepted} file`
  if (file.size === 0) return 'This file is empty — choose another'
  if (file.size > POLICY.documents.maxFileMb * 1024 * 1024) return `File is over ${POLICY.documents.maxFileMb} MB — choose a smaller one`
  return null
}

const NEXT: Partial<Record<ScreenId, ScreenId>> = {
  start: 'loan',
  loan: 'details',
  details: 'income',
  income: 'kyc',
  kyc: 'bank',
  bank: 'review',
  submitted: 'track',
}

const PREVIOUS: Partial<Record<ScreenId, ScreenId>> = {
  loan: 'start',
  details: 'loan',
  income: 'details',
  kyc: 'income',
  bank: 'kyc',
  review: 'bank',
  submitted: 'start',
  track: 'start',
}

export type SimulatedStatus = 'under_review' | 'action_required' | 'offer_available' | 'rejected' | 'disbursed'

export interface ApplicationActions {
  navigate: (screen: ScreenId, direction?: Direction) => void
  goBack: () => void
  goNext: () => void
  startApplication: () => void
  startOver: () => void
  resumeApplication: () => void
  saveAndExit: () => void
  restart: (message?: string) => void
  /** Open a section from Review; Continue returns there. */
  editFrom: (screen: StepScreenId) => void
  updateLoan: (patch: Partial<LoanRequest>) => void
  updatePersonal: (patch: Partial<Personal>) => void
  updateStudent: (patch: Partial<Student>) => void
  updateIncome: (patch: Partial<Income>) => void
  updateBank: (patch: Partial<Bank>) => void
  setConsent: (key: keyof Consents, value: boolean) => void
  // Simulated checks — full PAN / account numbers are passed in, used and never stored.
  checkPan: (pan: string) => Promise<CheckResult>
  clearPan: () => void
  checkBankAccount: (details: { holderName: string; bankName: string; accountNumber: string; ifsc: string }) => Promise<CheckResult>
  resetBankVerification: () => void
  // Documents (contents stay in memory)
  uploadDocument: (id: DocId, file: File) => void
  retryUpload: (id: DocId) => boolean
  removeDocument: (id: DocId) => void
  getDocumentFile: (id: DocId) => File | null
  // Lifecycle
  submit: () => Promise<void>
  refreshStatus: () => Promise<void>
  acceptOffer: () => void
  declineOffer: () => void
  // Presenter controls
  simulate: (status: SimulatedStatus) => void
  loadDemoDraft: () => void
  setFailNextUpload: (value: boolean) => void
}

interface ApplicationContextValue {
  state: AppState
  actions: ApplicationActions
}

const ApplicationContext = createContext<ApplicationContextValue | null>(null)

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const { toast } = useUi()
  const stateRef = useRef(state)
  stateRef.current = state
  const timers = useRef(new Map<string, number>())

  // Autosave. Only masked PAN / account values exist in state; file contents never do.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, direction: 'none' }))
    } catch {
      /* storage unavailable — the session still works */
    }
  }, [state])

  // Simulated lender: a fresh submission moves into review shortly after.
  useEffect(() => {
    if (state.application.status !== 'submitted') return
    const timer = window.setTimeout(() => {
      dispatch({
        type: 'apply',
        update: (current) =>
          current.application.status === 'submitted' ? record(current, 'under_review', 'Under review', 'under_review') : current,
      })
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [state.application.status])

  useEffect(() => {
    const active = timers.current
    return () => active.forEach((id) => window.clearInterval(id))
  }, [])

  const actions = useMemo<ApplicationActions>(() => {
    const stopTimer = (key: string) => {
      const id = timers.current.get(key)
      if (id !== undefined) window.clearInterval(id)
      timers.current.delete(key)
    }
    const navigate = (screen: ScreenId, direction: Direction = 'forward') => dispatch({ type: 'navigate', screen, direction })
    const apply = (update: (state: AppState) => AppState) => dispatch({ type: 'apply', update })
    const setDoc = (id: DocId, value: Partial<DocEntry>, reset = false) =>
      apply((s) => ({ ...s, documents: { ...s.documents, [id]: { ...(reset ? emptyDoc() : s.documents[id]), ...value } } }))
    const inSection = (screen: ScreenId) => stepIndex(screen) >= 0 && screen !== 'review'
    const clearTimers = () => {
      timers.current.forEach((id) => window.clearInterval(id))
      timers.current.clear()
    }

    const runUpload = (id: DocId, file: File) => {
      stopTimer(id)
      const meta: DocFile = { name: file.name, size: file.size, type: file.type }
      const problem = validateFile(file)
      if (problem) {
        setDoc(id, { status: 'failed', file: meta, error: problem, failure: 'invalid' }, true)
        return
      }
      rememberFile(id, file)
      setDoc(id, { status: 'uploading', file: meta, progress: 2 }, true)

      const willFail = stateRef.current.failNextUpload
      if (willFail) apply((s) => ({ ...s, failNextUpload: false }))

      let progress = 2
      const timer = window.setInterval(() => {
        progress = Math.min(100, progress + 7 + Math.random() * 11)
        if (willFail && progress >= 58) {
          stopTimer(id)
          setDoc(id, { status: 'failed', progress: 0, error: 'Upload failed — connection lost', failure: 'network' })
          toast('Upload failed (simulated network drop). Tap Retry.', 'error')
          return
        }
        if (progress >= 100) {
          stopTimer(id)
          apply((s) => {
            let next: AppState = {
              ...s,
              documents: {
                ...s.documents,
                [id]: { ...s.documents[id], status: 'uploaded', progress: 100, error: null, failure: null, uploadedAt: now() },
              },
            }
            // A replacement for a requested document puts the application back under review.
            if (s.submission && s.application.request?.docId === id) {
              next = { ...next, application: { ...next.application, request: null } }
              next = record(next, 'document_received', 'Document received', 'under_review', s.application.request.title)
            }
            return next
          })
          return
        }
        setDoc(id, { progress: Math.round(progress) })
      }, 140)
      timers.current.set(id, timer)
    }

    /** Builds an offer from the requested loan with the same pricing as the estimate. */
    const offerFrom = (s: AppState) => {
      const plan = buildRepaymentPlan(s.loan.amount, s.loan.tenure)
      return {
        amount: plan.principal,
        annualRatePercent: plan.annualRatePercent,
        tenure: plan.tenure,
        emi: plan.emi,
        totalInterest: plan.totalInterest,
        processingFee: plan.processingFee,
        gstOnFee: plan.gstOnFee,
        totalRepayment: plan.totalRepayment,
        issuedAt: now(),
        validUntil: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        status: 'available' as const,
        decidedAt: null,
      }
    }

    return {
      navigate,
      goBack: () => {
        const current = stateRef.current
        if (current.returnTo && inSection(current.screen)) return navigate(current.returnTo, 'back')
        const previous = PREVIOUS[current.screen]
        if (previous) navigate(previous, 'back')
      },
      goNext: () => {
        const current = stateRef.current
        if (current.returnTo && inSection(current.screen)) return navigate(current.returnTo, 'forward')
        const next = NEXT[current.screen]
        if (next) navigate(next, 'forward')
      },
      startApplication: () => {
        apply((s) => ({ ...s, started: true }))
        navigate('loan', 'forward')
      },
      startOver: () => {
        clearTimers()
        forgetAllFiles()
        dispatch({ type: 'replace', state: { ...createInitialState(), started: true, screen: 'loan', direction: 'forward' } })
      },
      resumeApplication: () => navigate(stateRef.current.resumeScreen, 'forward'),
      saveAndExit: () => {
        apply((s) => ({ ...s, returnTo: null }))
        navigate('start', 'back')
        toast('Draft saved. Resume any time from this screen.', 'success')
      },
      restart: (message = 'Started a fresh application.') => {
        clearTimers()
        forgetAllFiles()
        dispatch({ type: 'replace', state: createInitialState() })
        toast(message)
      },
      editFrom: (screen) => {
        apply((s) => ({ ...s, returnTo: 'review' }))
        navigate(screen, 'back')
      },
      updateLoan: (value) => dispatch({ type: 'patch', section: 'loan', value }),
      updatePersonal: (value) => dispatch({ type: 'patch', section: 'personal', value }),
      updateStudent: (value) => dispatch({ type: 'patch', section: 'student', value }),
      updateIncome: (value) => dispatch({ type: 'patch', section: 'income', value }),
      updateBank: (value) => dispatch({ type: 'patch', section: 'bank', value }),
      setConsent: (key, value) => dispatch({ type: 'patch', section: 'consents', value: { [key]: value } }),

      checkPan: async (pan) => {
        apply((s) => ({ ...s, kyc: { panMasked: '', panStatus: 'checking', panCheckedAt: null } }))
        const result = await verifyPan(pan)
        apply((s) => ({
          ...s,
          kyc: result.ok
            ? { panMasked: maskPan(pan), panStatus: 'verified', panCheckedAt: now() }
            : { panMasked: '', panStatus: 'failed', panCheckedAt: now() },
        }))
        return result
      },
      clearPan: () => apply((s) => ({ ...s, kyc: { panMasked: '', panStatus: 'idle', panCheckedAt: null } })),
      checkBankAccount: async ({ holderName, bankName, accountNumber, ifsc }) => {
        apply((s) => ({
          ...s,
          bank: { ...s.bank, holderName, bankName, ifsc, verification: 'checking', failureReason: null, accountMasked: '', accountLast4: '' },
        }))
        const result = await verifyBankAccount(accountNumber)
        apply((s) => ({
          ...s,
          bank: result.ok
            ? {
                ...s.bank,
                accountMasked: maskAccount(accountNumber),
                accountLast4: accountNumber.slice(-4),
                verification: 'verified',
                verifiedAt: now(),
                failureReason: null,
              }
            : { ...s.bank, verification: 'failed', verifiedAt: null, failureReason: result.reason ?? null },
        }))
        return result
      },
      resetBankVerification: () =>
        apply((s) => ({
          ...s,
          bank: { ...s.bank, accountMasked: '', accountLast4: '', verification: 'idle', verifiedAt: null, failureReason: null },
        })),

      uploadDocument: (id, file) => runUpload(id, file),
      retryUpload: (id) => {
        const file = recallFile(id)
        if (!file) return false
        runUpload(id, file)
        return true
      },
      removeDocument: (id) => {
        stopTimer(id)
        forgetFile(id)
        setDoc(id, {}, true)
      },
      getDocumentFile: (id) => recallFile(id),

      submit: async () => {
        const { referenceId } = await submitApplication()
        apply((s) => {
          const submittedAt = now()
          const next: AppState = {
            ...s,
            returnTo: null,
            submission: { referenceId, submittedAt },
            application: {
              status: 'submitted',
              request: null,
              history: [
                { kind: 'submitted', at: submittedAt, title: 'Application submitted' },
                { kind: 'documents_received', at: submittedAt, title: 'KYC & documents received' },
              ],
            },
          }
          return next
        })
        navigate('submitted', 'forward')
      },
      refreshStatus: async () => {
        await refreshApplicationStatus()
        apply((s) => ({ ...s, lastCheckedAt: now() }))
      },
      acceptOffer: () =>
        apply((s) =>
          s.offer
            ? record({ ...s, offer: { ...s.offer, status: 'accepted', decidedAt: now() } }, 'offer_accepted', 'Offer accepted', 'offer_accepted')
            : s,
        ),
      declineOffer: () =>
        apply((s) =>
          s.offer
            ? record({ ...s, offer: { ...s.offer, status: 'declined', decidedAt: now() } }, 'offer_declined', 'Offer declined', 'offer_declined')
            : s,
        ),

      simulate: (target) => {
        clearTimers()
        apply((current) => {
          // Without a submitted application, start from the completed demo application.
          let s = current.submission ? current : withDemoSubmission(buildDemoDraft())
          s = { ...s, screen: 'track', direction: 'forward', application: { ...s.application, request: null } }
          switch (target) {
            case 'under_review':
              return record({ ...s, offer: null, disbursement: null }, 'under_review', 'Under review', 'under_review')
            case 'action_required':
              return record(
                {
                  ...s,
                  offer: null,
                  disbursement: null,
                  application: {
                    ...s.application,
                    request: {
                      docId: 'studentProof',
                      title: 'Upload a clearer student ID',
                      reason:
                        'We couldn’t read the name and validity date on your student ID. Upload a clear photo or PDF of your current college ID or enrolment letter.',
                    },
                  },
                },
                'action_required',
                'Action required',
                'action_required',
              )
            case 'offer_available':
              return record({ ...s, offer: offerFrom(s), disbursement: null }, 'offer_available', 'Loan offer ready', 'offer_available')
            case 'rejected':
              return record({ ...s, offer: null, disbursement: null }, 'rejected', 'Application not approved', 'rejected')
            case 'disbursed': {
              let next = s
              if (!next.offer || next.offer.status !== 'accepted') {
                const offer = next.offer?.status === 'available' ? next.offer : offerFrom(next)
                if (!next.offer || next.offer.status !== 'available') {
                  next = record({ ...next, offer }, 'offer_available', 'Loan offer ready', 'offer_available')
                }
                next = record(
                  { ...next, offer: { ...offer, status: 'accepted', decidedAt: now() } },
                  'offer_accepted',
                  'Offer accepted',
                  'offer_accepted',
                )
              }
              const disbursedAt = new Date()
              return record(
                {
                  ...next,
                  disbursement: {
                    amount: next.offer?.amount ?? next.loan.amount,
                    reference: demoDisbursementReference(disbursedAt),
                    bankName: next.bank.bankName,
                    accountLast4: next.bank.accountLast4,
                    at: disbursedAt.toISOString(),
                    firstEmiDate: addMonths(disbursedAt, 1).toISOString(),
                  },
                },
                'disbursed',
                'Amount disbursed',
                'disbursed',
              )
            }
          }
        })
      },
      loadDemoDraft: () => {
        clearTimers()
        forgetAllFiles()
        dispatch({ type: 'replace', state: { ...buildDemoDraft(), direction: 'forward' } })
      },
      setFailNextUpload: (value) => apply((s) => ({ ...s, failNextUpload: value })),
    }
  }, [toast])

  const value = useMemo(() => ({ state, actions }), [state, actions])
  return <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>
}

export function useApplication(): ApplicationContextValue {
  const context = useContext(ApplicationContext)
  if (!context) throw new Error('useApplication must be used inside ApplicationProvider')
  return context
}


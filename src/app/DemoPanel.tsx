import { useState, type ReactNode } from 'react'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { PRICING } from '../config/pricing'
import { cn } from '../lib/cn'
import { DEMO_TEST_DATA } from '../services/mock'
import { useApplication, type SimulatedStatus } from '../state/ApplicationProvider'
import { hasDraft } from '../state/selectors'
import { STATUS_META, type Tone } from '../state/status'
import type { ScreenId } from '../state/types'

const SCREEN_NAME: Record<ScreenId, string> = {
  start: '01 Start your application',
  loan: '02 Loan details',
  details: '03 Your details',
  income: '04 Income details',
  kyc: '05 KYC & documents',
  bank: '06 Bank account',
  review: '07 Review & consent',
  submitted: '08 Application submitted',
  track: '09 Track application',
}

const TONE_PILL: Record<Tone, string> = {
  neutral: 'bg-canvas text-muted',
  progress: 'bg-lavender-pill text-ink',
  attention: 'bg-warning-soft text-warning',
  success: 'bg-lime-pill text-success',
  stopped: 'bg-danger/10 text-danger',
}

const SIMULATIONS: Array<{ status: SimulatedStatus; label: string }> = [
  { status: 'under_review', label: 'Under review' },
  { status: 'action_required', label: 'Action required' },
  { status: 'offer_available', label: 'Approved / offer available' },
  { status: 'rejected', label: 'Rejected' },
  { status: 'disbursed', label: 'Disbursed' },
]

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="flex flex-col gap-2 border-t border-line pt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center justify-between rounded-[6px] text-left text-[10.5px] font-semibold uppercase leading-4 tracking-[0.06em] text-muted hover:text-ink"
      >
        {title}
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && children}
    </section>
  )
}

const pillButton =
  'flex h-8 w-full items-center rounded-full border border-line px-3 text-left text-[11.5px] font-semibold leading-4 text-ink transition-colors enabled:hover:bg-canvas disabled:cursor-not-allowed disabled:text-[#a5aa9f]'

/**
 * Presenter-only controls, shown beside the phone on desktop. They are not part of
 * the student-facing app: nothing here renders inside the phone or on a real device.
 */
export function DemoPanel() {
  const { state, actions } = useApplication()
  const [open, setOpen] = useState(() => window.innerWidth >= 1180)
  const meta = STATUS_META[state.application.status]

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-10 flex h-10 items-center gap-2 rounded-full border border-line bg-card px-4 text-[12.5px] font-semibold text-ink shadow-[0_8px_24px_-12px_rgba(24,26,21,0.35)] transition-colors hover:bg-canvas"
      >
        <SlidersHorizontal className="size-4" strokeWidth={2.2} aria-hidden />
        Prototype controls
      </button>
    )
  }

  return (
    <aside
      aria-label="Prototype controls (presenter only)"
      className="scrollbar-none fixed left-4 top-4 z-10 flex max-h-[calc(100vh-32px)] w-[284px] flex-col gap-3 overflow-y-auto rounded-[20px] border border-line bg-card p-4 text-ink shadow-[0_24px_48px_-24px_rgba(24,26,21,0.35)]"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-[14px] font-bold leading-5">Prototype controls</p>
          <p className="text-[11px] leading-4 text-muted">Presenter only · not part of the app</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Hide prototype controls"
          className="-mr-1 -mt-1 flex size-8 items-center justify-center rounded-full transition-colors hover:bg-canvas"
        >
          <X className="size-4" strokeWidth={2.2} aria-hidden />
        </button>
      </header>

      <div className="flex flex-col gap-1 rounded-12 bg-canvas px-3 py-2 text-[11px] leading-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted">Application</span>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', TONE_PILL[meta.tone])}>{meta.label}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted">Screen</span>
          <span className="font-semibold">{SCREEN_NAME[state.screen]}</span>
        </div>
        {state.submission && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Reference</span>
            <span className="font-semibold">{state.submission.referenceId}</span>
          </div>
        )}
      </div>

      <Section title="Journey">
        <div className="flex flex-col gap-1.5">
          <button type="button" className={pillButton} onClick={() => actions.restart('Prototype reset.')}>
            Reset prototype
          </button>
          <button type="button" className={pillButton} disabled={!hasDraft(state)} onClick={actions.resumeApplication}>
            Resume saved draft
          </button>
          <button type="button" className={pillButton} onClick={actions.loadDemoDraft}>
            Fill demo application (go to review)
          </button>
        </div>
        <label className="flex cursor-pointer items-center gap-2 pt-1 text-[11.5px] leading-4">
          <input
            type="checkbox"
            checked={state.failNextUpload}
            onChange={(event) => actions.setFailNextUpload(event.target.checked)}
            className="size-3.5 accent-[#4c710c]"
          />
          Fail the next upload once (shows Retry)
        </label>
      </Section>

      <Section title="Simulate application status">
        <p className="text-[11px] leading-4 text-muted">
          {state.submission ? 'Changes the submitted application.' : 'Submits the demo application first.'}
        </p>
        <div className="flex flex-col gap-1.5">
          {SIMULATIONS.map((item) => (
            <button
              key={item.status}
              type="button"
              className={cn(pillButton, state.application.status === item.status && 'border-ink bg-lime/[0.18]')}
              onClick={() => actions.simulate(item.status)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Test data" defaultOpen={false}>
        <ul className="flex list-disc flex-col gap-1 pl-4 text-[11px] leading-4 text-muted">
          <li>
            PAN <b className="text-ink">{DEMO_TEST_DATA.pan}</b> passes; <b className="text-ink">{DEMO_TEST_DATA.failingPan}</b> fails the
            check
          </li>
          <li>
            Account <b className="text-ink">{DEMO_TEST_DATA.accountNumber}</b>, IFSC <b className="text-ink">{DEMO_TEST_DATA.ifsc}</b>
          </li>
          <li>Accounts ending in {DEMO_TEST_DATA.failingAccountSuffix} fail verification</li>
        </ul>
      </Section>

      <Section title="Demo pricing" defaultOpen={false}>
        <ul className="flex list-disc flex-col gap-1 pl-4 text-[11px] leading-4 text-muted">
          <li>{PRICING.annualRatePercent}% p.a., {PRICING.interestMethod.toLowerCase()}</li>
          <li>
            Processing fee ₹{PRICING.processingFee} + {PRICING.gstOnFeePercent}% GST
          </li>
          <li>Tenure {PRICING.tenureOptions.join(' / ')} months</li>
        </ul>
        <p className="text-[10.5px] leading-[14px] text-muted">Edit src/config/pricing.ts to change these.</p>
      </Section>
    </aside>
  )
}

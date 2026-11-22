import { useRef, useState, type ReactNode } from 'react'
import { LoaderCircle, Mail, MessageCircle, Phone, RotateCw, Upload } from 'lucide-react'
import { icons, sprites } from '../assets/figma'
import { InfoSheet, PrototypeNote } from '../components/AppSheets'
import { PageNav } from '../components/PageNav'
import { EstimateDisclaimer, ScheduleTable } from '../components/Repayment'
import { ScreenLayout } from '../components/ScreenLayout'
import { Timeline } from '../components/Timeline'
import { cn } from '../lib/cn'
import { formatDisplayDate, formatTimestamp } from '../lib/date'
import { buildRepaymentPlan } from '../lib/loan'
import { formatINR } from '../lib/format'
import { useApplication } from '../state/ApplicationProvider'
import { purposeLabel, tenureLabel } from '../state/selectors'
import { STATUS_META, buildTimeline, statusDescription } from '../state/status'
import type { Offer } from '../state/types'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Controls'
import { Icon, Sprite } from '../ui/Sprite'
import { useUi } from '../ui/UiProvider'

const PRE_DECISION = ['submitted', 'under_review', 'action_required']

function Panel({ tone, title, children }: { tone: 'attention' | 'success' | 'info' | 'neutral'; title: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className={cn(
        'flex flex-col gap-2 rounded-24 p-4',
        tone === 'attention' && 'bg-warning-soft',
        tone === 'success' && 'bg-lime-wash',
        tone === 'info' && 'bg-lavender-wash',
        tone === 'neutral' && 'bg-canvas',
      )}
    >
      <h2 className={cn('text-[14px] font-bold leading-[18px]', tone === 'attention' ? 'text-warning' : 'text-ink')}>{title}</h2>
      {children}
    </section>
  )
}

function DetailList({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="flex flex-col gap-1 rounded-12 bg-card px-3 py-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-3 text-[11px] leading-[15px]">
          <dt className="shrink-0 text-muted">{label}</dt>
          <dd className="min-w-0 text-right font-semibold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** "Action required": the requested document can be replaced right here. */
function RequestedUpload() {
  const { state, actions } = useApplication()
  const request = state.application.request
  const inputRef = useRef<HTMLInputElement>(null)
  if (!request) return null
  const entry = state.documents[request.docId]

  return (
    <Panel tone="attention" title={`Action required: ${request.title}`}>
      <p className="text-[11px] leading-[15px] text-ink">{request.reason}</p>
      {entry.status === 'uploading' ? (
        <div className="flex items-center gap-2 rounded-12 bg-card px-3 py-2" aria-live="polite">
          <LoaderCircle className="size-4 animate-spin text-muted" strokeWidth={2.4} aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[11px] leading-[15px] text-ink">Uploading {entry.file?.name}</span>
          <span className="text-[10px] leading-[13px] text-muted">{entry.progress}%</span>
        </div>
      ) : (
        <>
          {entry.status === 'failed' && (
            <p role="alert" className="text-[10px] font-medium leading-[13px] text-danger">
              {entry.error}. Try again.
            </p>
          )}
          <Button tone="dark" arrow={false} className="h-11" onClick={() => inputRef.current?.click()}>
            <span className="flex items-center gap-2">
              <Upload className="size-4" strokeWidth={2.2} aria-hidden />
              Upload a new file
            </span>
          </Button>
          <p className="text-[10px] leading-[13px] text-muted">PDF, JPG or PNG, up to 5 MB. Your review continues once it’s received.</p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-doc-input={request.docId}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) actions.uploadDocument(request.docId, file)
          event.target.value = ''
        }}
      />
    </Panel>
  )
}

type OfferStep = 'review' | 'accept' | 'decline'

/** Offer terms — computed with the same pricing as the estimate. Nothing is accepted automatically. */
function OfferSheet({ open, onClose, offer }: { open: boolean; onClose: () => void; offer: Offer }) {
  const { actions } = useApplication()
  const { toast } = useUi()
  const [step, setStep] = useState<OfferStep>('review')
  const [read, setRead] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setStep('review')
      setRead(false)
      setShowSchedule(false)
    }
  }
  const plan = buildRepaymentPlan(offer.amount, offer.tenure)

  if (step !== 'review') {
    const accepting = step === 'accept'
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={accepting ? 'Accept this offer?' : 'Decline this offer?'}
        footer={
          <>
            <Button
              tone="dark"
              arrow={false}
              onClick={() => {
                onClose()
                if (accepting) {
                  actions.acceptOffer()
                  toast('Offer accepted (simulated). We’ll notify you when it’s disbursed.', 'success')
                } else {
                  actions.declineOffer()
                  toast('Offer declined.')
                }
              }}
            >
              {accepting ? 'Yes, accept offer' : 'Decline offer'}
            </Button>
            <Button tone="outline" arrow={false} onClick={() => setStep('review')}>
              Go back to the offer
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 pb-1 text-[13px] leading-5 text-muted">
          {accepting ? (
            <p>
              You’re accepting {formatINR(offer.amount)} at {offer.annualRatePercent}% p.a. over {tenureLabel(offer.tenure)} —{' '}
              {formatINR(offer.emi)} a month. In the live app you’d sign the loan agreement next.
            </p>
          ) : (
            <p>This application will be closed and the offer can’t be reopened. You can apply again later.</p>
          )}
          <PrototypeNote>Accepting or declining is simulated. No agreement is signed and no money moves.</PrototypeNote>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Your loan offer"
      description={`Valid until ${formatDisplayDate(offer.validUntil.slice(0, 10))}. Take your time — nothing is accepted until you confirm.`}
      footer={
        <>
          <Button onClick={() => setStep('accept')} disabled={!read}>
            Accept offer
          </Button>
          <Button tone="outline" arrow={false} className="h-[43px]" onClick={() => setStep('decline')}>
            Decline offer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 pb-2">
        <div className="relative h-[98px] w-full shrink-0 rounded-16 bg-lavender/30">
          <p className="absolute left-5 top-3 text-[12px] font-medium leading-[15px] text-ink">Monthly EMI</p>
          <p className="absolute left-5 top-8 text-[30px] font-bold leading-[38px] text-ink">{formatINR(offer.emi)}</p>
          <p className="absolute left-5 top-[71px] text-[12px] leading-[15px] text-ink">For {tenureLabel(offer.tenure)}</p>
          <Sprite crop={sprites.repaymentCalendar} className="absolute left-[265px] top-[11px]" />
        </div>
        <DetailList
          rows={[
            ['Loan amount', formatINR(offer.amount)],
            ['Interest rate', `${offer.annualRatePercent}% p.a. (reducing balance)`],
            ['Tenure', tenureLabel(offer.tenure)],
            ['Total interest', formatINR(offer.totalInterest)],
            ['Processing fee (incl. GST)', formatINR(offer.processingFee + offer.gstOnFee)],
            ['Total repayment', formatINR(offer.totalRepayment)],
          ]}
        />
        <button
          type="button"
          onClick={() => setShowSchedule((value) => !value)}
          aria-expanded={showSchedule}
          className="self-start rounded-[4px] text-[12px] font-semibold leading-4 text-accent underline underline-offset-2"
        >
          {showSchedule ? 'Hide repayment schedule' : 'View repayment schedule'}
        </button>
        {showSchedule && <ScheduleTable plan={plan} />}
        <EstimateDisclaimer>Offer terms in this prototype are illustrative and simulated.</EstimateDisclaimer>
        <Checkbox checked={read} onChange={setRead}>
          <span className="text-[11px] leading-[15px]">I have read and understood the loan terms.</span>
        </Checkbox>
      </div>
    </BottomSheet>
  )
}

/** 09 – Track application (Figma 45:260) — status, history and the next action. */
export function TrackApplicationScreen() {
  const { state, actions } = useApplication()
  const { toast } = useUi()
  const [sheet, setSheet] = useState<'info' | 'support' | 'offer' | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { application, submission, offer, disbursement } = state
  const status = application.status
  const meta = STATUS_META[status]
  const referenceId = submission?.referenceId ?? '—'

  const refresh = async () => {
    setRefreshing(true)
    await actions.refreshStatus()
    setRefreshing(false)
    toast('Your status is up to date')
  }

  let panel: ReactNode = null
  if (status === 'action_required') panel = <RequestedUpload />
  else if (status === 'offer_available' && offer) {
    panel = (
      <Panel tone="success" title="Your loan offer is ready">
        <p className="text-[11px] leading-[15px] text-ink">
          {formatINR(offer.amount)} · {formatINR(offer.emi)}/month for {tenureLabel(offer.tenure)} · {offer.annualRatePercent}% p.a.
        </p>
        <p className="text-[10px] leading-[13px] text-muted">Review the terms before you decide. Valid until {formatDisplayDate(offer.validUntil.slice(0, 10))}.</p>
        <Button className="h-11" onClick={() => setSheet('offer')}>
          Review loan terms
        </Button>
      </Panel>
    )
  } else if (status === 'offer_accepted') {
    panel = (
      <Panel tone="info" title="Offer accepted">
        <p className="text-[11px] leading-[15px] text-ink">
          We’ll notify you when {formatINR(offer?.amount ?? state.loan.amount)} is sent to {state.bank.bankName} ••••{state.bank.accountLast4}.
        </p>
      </Panel>
    )
  } else if (status === 'offer_declined') {
    panel = (
      <Panel tone="neutral" title="Application closed">
        <p className="text-[11px] leading-[15px] text-ink">You declined the offer. You can start a new application whenever you’re ready.</p>
      </Panel>
    )
  } else if (status === 'rejected') {
    panel = (
      <Panel tone="neutral" title="We’re sorry we can’t offer you a loan this time">
        <p className="text-[11px] leading-[15px] text-ink">This decision is based on the lending partner’s assessment of your application.</p>
        <p className="text-[11px] leading-[15px] text-muted">
          If you have questions, our support team can help. You can apply again in future if your circumstances change.
        </p>
      </Panel>
    )
  } else if (status === 'disbursed' && disbursement) {
    const plan = buildRepaymentPlan(disbursement.amount, offer?.tenure ?? state.loan.tenure)
    panel = (
      <Panel tone="success" title={`${formatINR(disbursement.amount)} sent to your bank account`}>
        <DetailList
          rows={[
            ['Amount', formatINR(disbursement.amount)],
            ['To', `${disbursement.bankName} ••••${disbursement.accountLast4}`],
            ['Transaction reference', disbursement.reference],
            ['Date', formatTimestamp(disbursement.at)],
            ['First EMI', `${formatINR(plan.emi)} on ${formatDisplayDate(disbursement.firstEmiDate.slice(0, 10))}`],
          ]}
        />
        <p className="text-[10px] leading-[13px] text-muted">Mock transaction details for this prototype — no money has moved.</p>
      </Panel>
    )
  }

  const footer = (
    <div className="w-full shrink-0 bg-canvas px-4 pt-3 pb-4">
      <button
        type="button"
        onClick={() => setSheet('support')}
        aria-haspopup="dialog"
        className="relative h-12 w-full rounded-full border border-muted bg-card transition-colors hover:bg-canvas"
      >
        <Sprite crop={sprites.supportHeadset} className="absolute left-[57px] top-[10px]" />
        <span className="absolute left-[90px] top-[15px] w-[244px] text-left text-[13px] font-bold leading-[17px] text-ink">
          Need help? Contact support
        </span>
        <Icon icon={icons.arrowRight} className="absolute left-[313.9px] top-[16.73px]" />
      </button>
    </div>
  )

  return (
    <ScreenLayout
      nav={
        <PageNav
          variant="track"
          title="Track application"
          onBack={actions.goBack}
          backLabel="Back to home"
          right="info"
          onRight={() => setSheet('info')}
          rightLabel="About application statuses"
        />
      }
      contentClassName="gap-6 pt-6 pb-6"
      footer={footer}
    >
      <section aria-live="polite" className="flex w-full items-start gap-2 rounded-24 bg-lavender-wash pb-2 pl-5 pr-2 pt-[17px]">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-[12px] leading-[15px] text-muted">Application Status</p>
          <h1 className={cn('text-heading-page', meta.tone === 'attention' ? 'text-warning' : 'text-ink')}>{meta.title}</h1>
          <p className="text-[12px] leading-[15px] text-muted">{statusDescription(state)}</p>
        </div>
        <Sprite crop={sprites.statusHero} />
      </section>

      <div className="-mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[11px] leading-[14px] text-muted">
          {state.personal.fullName} · Application {referenceId}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          title={state.lastCheckedAt ? `Last checked ${formatTimestamp(state.lastCheckedAt)}` : undefined}
          className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold leading-[14px] text-accent transition-colors hover:bg-lavender-tint disabled:text-muted"
        >
          <RotateCw className={cn('size-3', refreshing && 'animate-spin')} strokeWidth={2.4} aria-hidden />
          {refreshing ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      {panel}

      <section aria-label="Loan summary" className="flex items-center gap-3 rounded-24 bg-lime-wash px-4 py-2">
        <Sprite crop={sprites.loanCap} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-[12px] font-bold leading-[15px] text-ink">Quick Student Loan</p>
          <p className="text-[10px] leading-[13px] text-muted">{purposeLabel(state.loan)}</p>
        </div>
        <Sprite crop={sprites.loanCoins} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-[18px] font-semibold leading-6 text-ink">{formatINR(state.loan.amount)}</p>
          <p className="text-[10px] leading-[13px] text-muted">Requested amount</p>
        </div>
      </section>

      <section aria-labelledby="progress-title" className="flex flex-col gap-1">
        <h2 id="progress-title" className="text-[19px] font-bold leading-6 text-ink">
          Application progress
        </h2>
        <Timeline rows={buildTimeline(state)} />
      </section>

      {PRE_DECISION.includes(status) && (
        <section className="flex items-start gap-4 rounded-24 bg-lime-wash px-3 py-2">
          <Sprite crop={sprites.statusCalendar} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[16px] font-bold leading-5 text-ink">Loan decision</p>
            <p className="text-[12px] leading-[15px] text-muted">
              {status === 'action_required'
                ? 'We’ll continue the review once we receive what we need.'
                : 'We’ll notify you when there’s an update.'}
            </p>
          </div>
        </section>
      )}

      <PrototypeNote>Statuses, dates and references are simulated for this prototype.</PrototypeNote>

      {offer && <OfferSheet open={sheet === 'offer'} onClose={() => setSheet(null)} offer={offer} />}

      <BottomSheet
        open={sheet === 'support'}
        onClose={() => setSheet(null)}
        title="Contact support"
        description={`Quote your application ID ${referenceId}.`}
      >
        <div className="flex flex-col gap-2 pb-1">
          {[
            { icon: <Phone className="size-4" strokeWidth={2} aria-hidden />, title: 'Call us', detail: 'Speak to a loan specialist' },
            { icon: <MessageCircle className="size-4" strokeWidth={2} aria-hidden />, title: 'Chat with us', detail: 'Get answers in the app' },
            { icon: <Mail className="size-4" strokeWidth={2} aria-hidden />, title: 'Email us', detail: `We reply to ${state.personal.email}` },
          ].map((option) => (
            <button
              key={option.title}
              type="button"
              onClick={() => {
                setSheet(null)
                toast(`${option.title} isn’t connected in this prototype.`)
              }}
              className="flex min-h-[52px] w-full items-center gap-3 rounded-16 border-[0.7px] border-line px-3 py-2 text-left transition-colors hover:bg-canvas"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-12 bg-lavender-wash text-ink">{option.icon}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px] font-bold leading-4 text-ink">{option.title}</span>
                <span className="text-[11px] leading-4 text-muted">{option.detail}</span>
              </span>
            </button>
          ))}
          <PrototypeNote>Support channels are illustrative — no call, chat or email is started.</PrototypeNote>
        </div>
      </BottomSheet>

      <InfoSheet open={sheet === 'info'} onClose={() => setSheet(null)} title="About your application status">
        <p>
          The timeline shows what has happened so far and what’s next. If the lender needs something from you, it appears
          at the top with a direct way to respond.
        </p>
        <p>We don’t promise decision times — we’ll notify you when there’s an update. Use Refresh to check now.</p>
        <PrototypeNote>All statuses are simulated. No lender, bank or credit bureau is contacted.</PrototypeNote>
      </InfoSheet>
    </ScreenLayout>
  )
}

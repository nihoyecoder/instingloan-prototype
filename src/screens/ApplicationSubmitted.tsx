import { useEffect, useRef, useState } from 'react'
import { sprites } from '../assets/figma'
import { ScreenLayout } from '../components/ScreenLayout'
import { cn } from '../lib/cn'
import { formatTimestamp } from '../lib/date'
import { formatINR } from '../lib/format'
import { useApplication } from '../state/ApplicationProvider'
import { purposeLabel } from '../state/selectors'
import { STATUS_META } from '../state/status'
import { Button } from '../ui/Button'
import { Sprite } from '../ui/Sprite'
import { useUi } from '../ui/UiProvider'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}

const NEXT_STEPS = [
  { title: 'Application under review', detail: 'We’ll verify your details and documents.', current: true },
  { title: 'Loan offer & approval', detail: 'You’ll get a loan offer if you’re eligible.', current: false },
  { title: 'Disbursement', detail: 'Once you accept the offer, the amount will be transferred to your bank account.', current: false },
]

/** 08 – Application submitted (Figma 45:243). Confirms submission only — never approval. */
export function ApplicationSubmittedScreen() {
  const { state, actions } = useApplication()
  const { toast } = useUi()
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const referenceId = state.submission?.referenceId ?? '—'
  const status = STATUS_META[state.application.status]

  const onCopy = async () => {
    const ok = await copyText(referenceId)
    toast(ok ? 'Application ID copied' : 'Couldn’t copy — select the ID instead', ok ? 'success' : 'error')
    if (!ok) return
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
  }

  const footer = (
    <div className="flex w-full shrink-0 flex-col gap-3 bg-canvas px-4 pt-3 pb-4">
      <Button onClick={() => actions.navigate('track', 'forward')}>Track application</Button>
      <Button tone="outline" arrow={false} className="h-[43px]" onClick={() => actions.navigate('start', 'back')}>
        Back to home
      </Button>
    </div>
  )

  return (
    <ScreenLayout contentClassName="gap-6 pt-2 pb-6" footer={footer}>
      <div className="flex w-full justify-center">
        <Sprite crop={sprites.submittedHero} />
      </div>

      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-[25px] font-bold leading-8 text-ink">Application submitted!</h1>
        <p className="text-[13px] leading-[17px] text-muted">
          Your student loan application has been{' '}
          <br />
          successfully submitted.
        </p>
      </div>

      <section aria-label="Application summary" className="flex flex-col gap-3 rounded-24 bg-lime-wash p-4">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[11px] leading-[14px] text-muted">Application ID</p>
            <p className="select-all text-[21px] font-bold leading-[27px] text-ink">{referenceId}</p>
          </div>
          <button
            type="button"
            onClick={() => void onCopy()}
            aria-label={copied ? 'Application ID copied' : 'Copy application ID'}
            className="flex shrink-0 items-center gap-1.5 rounded-12 border-[0.7px] border-line bg-card p-2 text-[10px] font-bold leading-[13px] text-ink transition-colors hover:bg-canvas"
          >
            {copied ? (
              <span aria-hidden className="text-[10px] leading-none text-success">
                ✓
              </span>
            ) : (
              <span aria-hidden className="size-[7px] rounded-[1.5px] border-[1.3px] border-ink" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <span aria-hidden className="h-px w-full bg-line" />
        <div className="flex items-center gap-3">
          <Sprite crop={sprites.loanCap} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[12px] font-bold leading-[15px] text-ink">Student Loan</p>
            <p className="text-[10px] leading-[13px] text-muted">{purposeLabel(state.loan)}</p>
          </div>
          <Sprite crop={sprites.loanCoins} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[18px] font-semibold leading-6 text-ink">{formatINR(state.loan.amount)}</p>
            <p className="text-[10px] leading-[13px] text-muted">Requested amount</p>
          </div>
        </div>
        <span aria-hidden className="h-px w-full bg-line" />
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-[10px] leading-[13px] text-muted">
            <span className="font-semibold text-ink">{state.personal.fullName}</span>
            {state.submission && ` · ${formatTimestamp(state.submission.submittedAt)}`}
          </p>
          <span aria-live="polite" className="shrink-0 rounded-full bg-lime-pill p-1 px-2 text-[9px] leading-[12px] text-ink">
            Status: {status.label}
          </span>
        </div>
      </section>

      <section aria-labelledby="next-title" className="flex flex-col gap-2">
        <h2 id="next-title" className="text-[19px] font-bold leading-6 text-ink">
          What happens next?
        </h2>
        <ol className="flex flex-col gap-2">
          {NEXT_STEPS.map((step, index) => (
            <li key={step.title} className="relative flex items-start gap-3 p-1">
              {index < NEXT_STEPS.length - 1 && (
                <span aria-hidden className="absolute left-[13.5px] top-[14px] h-[calc(100%+8px)] w-px bg-line" />
              )}
              <span
                aria-hidden
                className={cn(
                  'relative z-[1] flex size-5 shrink-0 items-center justify-center rounded-full',
                  step.current ? 'bg-lime text-[12px] font-bold text-black' : 'border border-line bg-card',
                )}
              >
                {step.current ? '✓' : ''}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-[13px] font-bold leading-[17px] text-ink">{step.title}</p>
                <p className="text-[10px] leading-[13px] text-muted">{step.detail}</p>
              </div>
              {step.current && (
                <span className="shrink-0 rounded-full bg-lime-pill p-1 text-[9px] leading-[12px] text-ink">In progress</span>
              )}
            </li>
          ))}
        </ol>
      </section>
    </ScreenLayout>
  )
}

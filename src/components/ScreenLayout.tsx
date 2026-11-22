import type { ReactNode, Ref } from 'react'
import { cn } from '../lib/cn'
import { useApplication } from '../state/ApplicationProvider'
import { Button, LinkButton } from '../ui/Button'
import { useUi } from '../ui/UiProvider'

/** "Quick Student Loan journey" — "Step X of 6" over six 8px bars (45:300). */
export function StepProgress({ step, total = 6 }: { step: number; total?: number }) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-2 px-4 pt-6">
      <p className="text-center text-[11px] leading-[14px] text-muted">
        Step {step} of {total}
      </p>
      <div className="flex w-full gap-1" aria-hidden>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn('h-2 min-w-0 flex-1 rounded-full transition-colors duration-300', index < step ? 'bg-lime' : 'bg-canvas')}
          />
        ))}
      </div>
    </div>
  )
}

interface ScreenLayoutProps {
  nav?: ReactNode
  /** 1-based step for "Step X of 6". */
  step?: number
  footer?: ReactNode
  children: ReactNode
  /** Per-screen padding and gaps for the scrolling content. */
  contentClassName?: string
  scrollRef?: Ref<HTMLDivElement>
}

/**
 * Shared screen skeleton: fixed navigation and progress, a scrolling content
 * area, and fixed primary actions. Only the content animates between screens.
 */
export function ScreenLayout({ nav, step, footer, children, contentClassName, scrollRef }: ScreenLayoutProps) {
  const { state } = useApplication()
  const { scrollLocked } = useUi()
  const animation =
    state.direction === 'forward' ? 'animate-screen-forward' : state.direction === 'back' ? 'animate-screen-back' : undefined

  return (
    <>
      {nav}
      {step !== undefined && <StepProgress step={step} />}
      <div
        ref={scrollRef}
        data-screen-scroll
        className={cn(
          'scrollbar-none relative min-h-0 flex-1 overflow-x-hidden overscroll-contain',
          scrollLocked ? 'overflow-y-hidden' : 'overflow-y-auto',
        )}
      >
        <div className={cn('flex w-full flex-col px-4', animation, contentClassName)}>{children}</div>
      </div>
      {footer}
    </>
  )
}

/** "Primary actions" (45:153): canvas band, lime CTA and "Save & exit". */
export function StepFooter({
  onContinue,
  label = 'Continue',
  forceLabel,
  loading,
  loadingLabel,
  disabled,
  hideSaveExit,
}: {
  onContinue: () => void
  label?: string
  /** Keep `label` even when editing from Review (e.g. "Submit application"). */
  forceLabel?: boolean
  loading?: boolean
  loadingLabel?: string
  disabled?: boolean
  hideSaveExit?: boolean
}) {
  const { state, actions } = useApplication()
  const returning = state.returnTo === 'review' && !forceLabel
  return (
    <div className="flex w-full shrink-0 flex-col items-center gap-3 bg-canvas px-4 pt-3 pb-4">
      <Button onClick={onContinue} loading={loading} loadingLabel={loadingLabel} disabled={disabled}>
        {returning ? 'Save & return to review' : label}
      </Button>
      {!hideSaveExit && (
        <LinkButton width={122} underlineWidth={70} onClick={actions.saveAndExit}>
          Save &amp; exit
        </LinkButton>
      )}
    </div>
  )
}

/** Focuses and reveals the first field with an error, in DOM order. */
export function focusFirstError(ids: string[]) {
  for (const id of ids) {
    const element = document.getElementById(id)
    if (element) {
      element.focus({ preventScroll: true })
      element.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
  }
}

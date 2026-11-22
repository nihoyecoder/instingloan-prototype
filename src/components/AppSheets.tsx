import type { ReactNode } from 'react'
import { Headphones, LogOut, RotateCcw } from 'lucide-react'
import { useApplication } from '../state/ApplicationProvider'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { PrototypeNote } from '../ui/PrototypeNote'
import { useUi } from '../ui/UiProvider'

export { PrototypeNote }

/** Simple explanatory sheet used for help, notifications and policy text. */
export function InfoSheet({
  open,
  onClose,
  title,
  children,
  actionLabel = 'Got it',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actionLabel?: string
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <Button arrow={false} onClick={onClose}>
          {actionLabel}
        </Button>
      }
    >
      <div className="flex flex-col gap-3 pb-1 text-[13px] leading-5 text-muted">{children}</div>
    </BottomSheet>
  )
}

/** Confirms clearing the draft, documents and any simulated submission. */
export function RestartSheet() {
  const { restartPromptOpen, setRestartPromptOpen } = useUi()
  const { actions } = useApplication()
  const close = () => setRestartPromptOpen(false)
  return (
    <BottomSheet
      open={restartPromptOpen}
      onClose={close}
      title="Start over?"
      footer={
        <>
          <Button
            tone="dark"
            arrow={false}
            onClick={() => {
              close()
              actions.restart()
            }}
          >
            Start over
          </Button>
          <Button tone="outline" arrow={false} onClick={close}>
            Keep my progress
          </Button>
        </>
      }
    >
      <p className="pb-1 text-[13px] leading-5 text-muted">
        This clears your saved draft, any documents you added and the simulated application, and takes you back to the
        start.
      </p>
    </BottomSheet>
  )
}

/** The (?) on each step: tips for the step, plus save and restart options. */
export function HelpSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const { actions, state } = useApplication()
  const { setRestartPromptOpen, toast } = useUi()
  const rowClass =
    'flex min-h-11 w-full items-center gap-3 rounded-12 px-3 text-left text-[13px] font-semibold leading-5 transition-colors hover:bg-canvas'
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-3 pb-1">
        <div className="flex flex-col gap-2 text-[13px] leading-5 text-muted">{children}</div>
        <div className="flex flex-col border-t border-line pt-2">
          <button
            type="button"
            className={`${rowClass} text-ink`}
            onClick={() => {
              onClose()
              toast('Support is simulated in this prototype — no call or chat is started.')
            }}
          >
            <Headphones className="size-[18px]" strokeWidth={2} aria-hidden />
            Contact support
          </button>
          {!state.submission && (
            <button
              type="button"
              className={`${rowClass} text-ink`}
              onClick={() => {
                onClose()
                actions.saveAndExit()
              }}
            >
              <LogOut className="size-[18px]" strokeWidth={2} aria-hidden />
              Save &amp; exit
            </button>
          )}
          <button
            type="button"
            className={`${rowClass} text-danger`}
            onClick={() => {
              onClose()
              setRestartPromptOpen(true)
            }}
          >
            <RotateCcw className="size-[18px]" strokeWidth={2} aria-hidden />
            Start over
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

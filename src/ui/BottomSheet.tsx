import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/cn'
import { useUi } from './UiProvider'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Fixed panel height in px (the repayment sheet is 548, as in Figma). */
  height?: number
  /** Extra classes for the scrolling body. */
  bodyClassName?: string
}

const DISMISS_DISTANCE = 110
const DISMISS_VELOCITY = 0.6 // px per ms

/**
 * Bottom sheet from the "Repayment breakdown" frame (50:298): dimmed backdrop,
 * 36×4 handle, 23px title and a round close button. Closes on ×, backdrop tap,
 * Escape or a swipe down; focus is trapped and the screen behind can't scroll.
 */
export function BottomSheet({ open, onClose, title, description, children, footer, height, bodyClassName }: BottomSheetProps) {
  const { overlayRoot, lockScroll } = useUi()
  const [visible, setVisible] = useState(open)
  const [closing, setClosing] = useState(false)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragDismissed, setDragDismissed] = useState(false)
  const drag = useRef<{ startY: number; lastY: number; lastT: number; velocity: number; scale: number } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  // Derive mount state during render so the sheet never flashes before animating.
  if (open && (!visible || closing)) {
    setVisible(true)
    setClosing(false)
    setOffset(0)
    setDragDismissed(false)
  } else if (!open && visible && !closing) {
    setClosing(true)
  }

  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(() => {
      setVisible(false)
      setClosing(false)
    }, 200)
    return () => window.clearTimeout(timer)
  }, [closing])

  useEffect(() => {
    if (!open) return
    return lockScroll()
  }, [open, lockScroll])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const frame = window.requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel) return
      const target = panel.querySelector<HTMLElement>('[data-autofocus]') ?? panel
      target.focus({ preventScroll: true })
    })
    return () => {
      window.cancelAnimationFrame(frame)
      previous?.focus?.({ preventScroll: true })
    }
  }, [open])

  if (!visible || !overlayRoot) return null

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !panelRef.current) return
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  // Swipe down on the handle/header to dismiss. The phone is CSS-scaled on desktop,
  // so pointer distances are converted back into the sheet's own pixels.
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    const panel = panelRef.current
    if (!panel) return
    const scale = panel.getBoundingClientRect().height / panel.offsetHeight || 1
    drag.current = { startY: event.clientY, lastY: event.clientY, lastT: event.timeStamp, velocity: 0, scale }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state) return
    const elapsed = Math.max(1, event.timeStamp - state.lastT)
    state.velocity = (event.clientY - state.lastY) / state.scale / elapsed
    state.lastY = event.clientY
    state.lastT = event.timeStamp
    setOffset(Math.max(0, (event.clientY - state.startY) / state.scale))
  }
  const onPointerUp = () => {
    const state = drag.current
    drag.current = null
    setDragging(false)
    if (!state) return
    const distance = Math.max(0, (state.lastY - state.startY) / state.scale)
    if (distance > DISMISS_DISTANCE || state.velocity > DISMISS_VELOCITY) {
      setDragDismissed(true)
      setOffset(panelRef.current?.offsetHeight ?? 600)
      onClose()
    } else {
      setOffset(0)
    }
  }

  const panelStyle: CSSProperties = {
    height,
    transform: offset ? `translateY(${offset}px)` : undefined,
    transition: dragging ? 'none' : 'transform 200ms cubic-bezier(0.22, 0.8, 0.24, 1)',
  }

  return createPortal(
    <div className="pointer-events-auto absolute inset-0 z-40 flex flex-col justify-end" onKeyDown={onKeyDown}>
      <div
        aria-hidden
        onClick={onClose}
        className={cn('absolute inset-0 bg-scrim', closing ? 'animate-fade-out' : 'animate-fade-in')}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        style={panelStyle}
        className={cn(
          'relative flex max-h-[calc(100%-56px)] flex-col rounded-t-24 bg-card pb-[30px] shadow-[0_-12px_40px_rgba(5,6,5,0.16)] outline-none',
          closing ? !dragDismissed && 'animate-sheet-down' : 'animate-sheet-up',
        )}
      >
        <div
          className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span aria-hidden className="mx-auto mt-[10px] block h-1 w-9 rounded-full bg-line" />
          <div className="flex items-start justify-between gap-3 pl-5 pr-[22px] pt-[14px]">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 id={titleId} className="text-[23px] font-bold leading-[29px] text-ink">
                {title}
              </h2>
              {description && (
                <div id={descriptionId} className="text-[12px] leading-[17px] text-muted">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mt-[3px] flex size-[30px] shrink-0 items-center justify-center rounded-full bg-canvas text-[22px] leading-7 text-muted transition-colors hover:bg-line"
            >
              <span aria-hidden className="-mt-px">
                ×
              </span>
            </button>
          </div>
        </div>
        <div className={cn('scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4', bodyClassName)}>
          {children}
        </div>
        {footer && <div className="flex shrink-0 flex-col gap-2 px-5 pt-3">{footer}</div>}
      </div>
    </div>,
    overlayRoot,
  )
}

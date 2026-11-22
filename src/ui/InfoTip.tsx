import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import { cn } from '../lib/cn'
import { useUi } from './UiProvider'

const WIDTH = 256
const EDGE = 16

interface Placement {
  left: number
  top: number
  above: boolean
  arrow: number
}

/**
 * Small "ⓘ" next to a label. Tapping it opens a compact popover that explains why
 * the information is needed — available on demand, never permanently on screen.
 * Closes on a second tap, Escape, scrolling or a tap anywhere else.
 */
export function InfoTip({ topic, children, title = 'Why do we ask this?', className }: {
  /** Used in the accessible name: "Why we ask for {topic}". */
  topic: string
  children: ReactNode
  title?: string
  className?: string
}) {
  const { overlayRoot } = useUi()
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<Placement | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const id = useId()

  // Position inside the phone screen. On desktop the phone is CSS-scaled, so
  // screen coordinates are converted back into the screen's own pixels.
  useLayoutEffect(() => {
    if (!open) return
    const button = buttonRef.current
    if (!button || !overlayRoot) return
    const root = overlayRoot.getBoundingClientRect()
    const scale = root.width / overlayRoot.offsetWidth || 1
    const rect = button.getBoundingClientRect()
    const centre = (rect.left + rect.width / 2 - root.left) / scale
    const top = (rect.top - root.top) / scale
    const bottom = (rect.bottom - root.top) / scale
    const left = Math.min(Math.max(EDGE, centre - WIDTH / 2), overlayRoot.offsetWidth - EDGE - WIDTH)
    const above = bottom + 150 > overlayRoot.offsetHeight - 140
    setPlacement({ left, top: above ? top - 6 : bottom + 6, above, arrow: centre - left })
  }, [open, overlayRoot])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer, true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointer, true)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setPlacement(null)
          setOpen((value) => !value)
        }}
        aria-label={`Why we ask for ${topic}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        className={cn(
          '-m-[5px] inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink',
          open && 'bg-canvas text-ink',
          className,
        )}
      >
        <Info className="size-[13px]" strokeWidth={2.2} aria-hidden />
      </button>
      {open &&
        overlayRoot &&
        placement &&
        createPortal(
          <div
            ref={popoverRef}
            id={id}
            role="dialog"
            aria-label={title}
            className="pointer-events-auto absolute z-[55] animate-pop-in"
            style={{
              left: placement.left,
              top: placement.top,
              width: WIDTH,
              transform: placement.above ? 'translateY(-100%)' : undefined,
              transformOrigin: placement.above ? 'bottom center' : 'top center',
            }}
          >
            <div className="relative rounded-12 border border-line bg-card px-3 py-[10px] shadow-[0_12px_32px_-10px_rgba(5,6,5,0.28)]">
              <span
                aria-hidden
                className={cn(
                  'absolute size-[10px] rotate-45 border-line bg-card',
                  placement.above ? '-bottom-[6px] border-b border-r' : '-top-[6px] border-l border-t',
                )}
                style={{ left: Math.min(Math.max(12, placement.arrow - 5), WIDTH - 22) }}
              />
              <p className="text-[11px] font-bold leading-[14px] text-ink">{title}</p>
              <div className="mt-1 text-[11px] leading-[15px] text-muted">{children}</div>
            </div>
          </div>,
          overlayRoot,
        )}
    </>
  )
}

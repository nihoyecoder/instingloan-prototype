import { cn } from '../lib/cn'
import type { RowState, TimelineRow } from '../state/status'

/** 20px markers from "Application progress timeline" (45:800). */
function Marker({ state }: { state: RowState }) {
  const base = 'relative z-[1] flex size-5 shrink-0 items-center justify-center rounded-full'
  switch (state) {
    case 'done':
      return (
        <span className={cn(base, 'bg-lime text-[12px] font-bold leading-[15px] text-ink')} aria-hidden>
          ✓
        </span>
      )
    case 'current':
      return (
        <span className={cn(base, 'bg-lime')} aria-hidden>
          <span className="size-[7px] rounded-full bg-ink" />
        </span>
      )
    case 'attention':
      return (
        <span className={cn(base, 'border border-warning bg-warning-soft text-[11px] font-bold leading-none text-warning')} aria-hidden>
          !
        </span>
      )
    case 'stopped':
      return (
        <span className={cn(base, 'border border-line bg-canvas text-[13px] leading-none text-muted')} aria-hidden>
          ×
        </span>
      )
    default:
      return <span className={cn(base, 'border border-line bg-card')} aria-hidden />
  }
}

const BADGE: Record<RowState, string> = {
  done: 'bg-lime-pill text-ink',
  current: 'bg-lavender-pill text-ink',
  upcoming: 'bg-canvas text-ink',
  attention: 'bg-warning-soft text-warning font-semibold',
  stopped: 'bg-canvas text-muted',
}

const ROW_BG: Partial<Record<RowState, string>> = {
  current: 'bg-lavender-row',
  attention: 'bg-warning-soft/70',
}

/** Vertical timeline: 20px marker, 13px title, 10px detail and a 9px status pill. */
export function Timeline({ rows, currentBadge = 'bg-lavender-pill' }: { rows: TimelineRow[]; currentBadge?: string }) {
  return (
    <ol className="flex w-full flex-col gap-2">
      {rows.map((row, index) => (
        <li
          key={row.key}
          aria-current={row.state === 'current' || row.state === 'attention' ? 'step' : undefined}
          className={cn('relative flex w-full items-start gap-3 rounded-16 p-1', ROW_BG[row.state])}
        >
          {index < rows.length - 1 && (
            <span aria-hidden className="absolute left-[13.5px] top-[14px] h-[calc(100%+8px)] w-px bg-line" />
          )}
          <Marker state={row.state} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[13px] font-bold leading-[17px] text-ink">{row.title}</p>
            {row.detail && <p className="text-[10px] leading-[13px] text-muted">{row.detail}</p>}
          </div>
          <span
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full p-1 text-[9px] leading-[12px]',
              row.state === 'current' ? cn(currentBadge, 'text-ink') : BADGE[row.state],
            )}
          >
            {row.badge}
          </span>
        </li>
      ))}
    </ol>
  )
}

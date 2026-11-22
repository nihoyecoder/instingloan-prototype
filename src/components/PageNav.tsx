import { Info } from 'lucide-react'
import { icons } from '../assets/figma'
import { cn } from '../lib/cn'
import { Icon } from '../ui/Sprite'

interface PageNavProps {
  title: string
  onBack?: () => void
  backLabel?: string
  right?: 'help' | 'info'
  onRight?: () => void
  rightLabel?: string
  /** "step" — the form screens (49:407); "track" — Track application (45:777), 18px semibold. */
  variant?: 'step' | 'track'
}

/** "Page navigation": back arrow, centred title and a help (?) or info (ⓘ) action. */
export function PageNav({ title, onBack, backLabel = 'Back', right, onRight, rightLabel, variant = 'step' }: PageNavProps) {
  const track = variant === 'track'
  return (
    <div className={cn('relative w-full shrink-0', track ? 'h-11' : 'h-14')}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className={cn(
            'absolute left-[13px] flex size-11 items-center justify-center rounded-full transition-colors hover:bg-canvas',
            track ? 'top-1' : 'top-[9px]',
          )}
        >
          <Icon icon={icons.back} />
        </button>
      )}
      <p
        className={cn(
          'absolute left-1/2 w-[218px] -translate-x-1/2 text-center text-ink',
          track ? 'top-3 text-[18px] font-semibold leading-6' : 'top-[23px] text-[17px] font-bold leading-[18px]',
        )}
      >
        {title}
      </p>
      {right && (
        <button
          type="button"
          onClick={onRight}
          aria-label={rightLabel ?? (right === 'help' ? 'Help' : 'About this screen')}
          aria-haspopup="dialog"
          className={cn(
            'absolute left-[352px] flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas',
            track ? 'top-[2.5px]' : 'top-[10px]',
          )}
        >
          {right === 'help' ? <Icon icon={icons.help} /> : <Info className="size-5" strokeWidth={1.9} aria-hidden />}
        </button>
      )}
    </div>
  )
}

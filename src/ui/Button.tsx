import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '../lib/cn'

type Tone = 'lime' | 'dark' | 'outline'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  /** Figma "Button" (Tone = Lime), a dark variant for confirmations, and the outlined secondary. */
  tone?: Tone
  /** Appends the "  →" used on Figma's primary buttons. */
  arrow?: boolean
  loading?: boolean
  loadingLabel?: string
}

const toneClasses: Record<Tone, string> = {
  lime: 'bg-lime text-ink enabled:hover:brightness-[0.97] enabled:active:brightness-[0.94]',
  dark: 'bg-dark text-white enabled:hover:bg-[#1b1d1a]',
  outline: 'border border-muted bg-card text-ink enabled:hover:bg-canvas',
}

/** 48px pill action. Primary label: Inter Medium 14/21, as in the Figma component (2:210). */
export function Button({
  children,
  tone = 'lime',
  arrow = true,
  loading = false,
  loadingLabel,
  disabled,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const inactive = disabled && !loading
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative flex h-12 w-full shrink-0 items-center justify-center rounded-full transition-[background-color,color,filter,transform] duration-200 ease-out enabled:active:scale-[0.985]',
        inactive ? 'bg-line text-muted' : toneClasses[tone],
        loading && tone === 'lime' && 'bg-lime text-ink',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center gap-2 text-[14px] font-medium leading-[21px]">
          <LoaderCircle className="size-[18px] animate-spin" strokeWidth={2.4} aria-hidden />
          {loadingLabel ?? children}
        </span>
      ) : (
        <span
          className={cn(
            'whitespace-pre',
            tone === 'outline' ? 'text-[13px] font-bold leading-[17px]' : 'text-[14px] font-medium leading-[21px]',
          )}
        >
          {children}
          {arrow ? '  →' : ''}
        </span>
      )}
    </button>
  )
}

interface LinkButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  /** Text box width in px, as in Figma. */
  width: number
  /** Lime underline width; defaults to the full text width. */
  underlineWidth?: number
}

/** "Save & exit" — 13/16 bold secondary text over a 3px lime underline (Figma 53:865). */
export function LinkButton({ children, width, underlineWidth, className, type = 'button', ...rest }: LinkButtonProps) {
  return (
    <button
      type={type}
      className={cn('group flex h-6 shrink-0 flex-col items-center gap-1 rounded-[4px]', className)}
      style={{ width }}
      {...rest}
    >
      <span className="w-full text-center text-[13px] font-bold leading-4 text-muted transition-colors group-hover:text-ink">
        {children}
      </span>
      <span aria-hidden className="h-[3px] shrink-0 bg-lime" style={{ width: underlineWidth ?? width }} />
    </button>
  )
}

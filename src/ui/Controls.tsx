/**
 * Selection controls from the Quick Loan frames:
 * - Checkbox: "Unchecked consent checkbox" (45:721) — 14px, 0.7px secondary border.
 * - RadioCards: "◉ Yes, I have income" / "○ No, I don’t have income" (45:488).
 * - TenureChips: "Tenure selection" pills (45:351).
 * - AmountOptions: fixed loan amount cards, styled to match TenureChips.
 * - SegmentedTabs: "Repayment view tabs" in the breakdown sheet (50:303).
 */
import { useRef, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { icons } from '../assets/figma'
import { cn } from '../lib/cn'
import { Icon } from './Sprite'

export function Checkbox({
  checked,
  onChange,
  children,
  invalid,
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  invalid?: boolean
  className?: string
}) {
  return (
    <label className={cn('flex w-full cursor-pointer items-start gap-2', className)}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span
        aria-hidden
        className={cn(
          'mt-px flex size-[14px] shrink-0 items-center justify-center rounded-[2px] border-[0.7px] transition-colors duration-150 peer-focus-visible:shadow-[0_0_0_3px_rgba(210,243,107,0.9)]',
          checked ? 'border-ink bg-lime' : invalid ? 'border-danger bg-card' : 'border-muted bg-card',
        )}
      >
        {checked && <span className="animate-pop-in text-[10px] font-bold leading-none text-black">✓</span>}
      </span>
      <span className="min-w-0 flex-1 text-left text-[9px] leading-[12px] text-ink">{children}</span>
    </label>
  )
}

export interface Choice<T extends string> {
  value: T
  label: string
}

export function RadioCards<T extends string>({
  name,
  value,
  options,
  onChange,
  labelledBy,
  describedBy,
  invalid,
  id,
  stacked,
}: {
  name: string
  value: T | ''
  options: Array<Choice<T>>
  onChange: (value: T) => void
  labelledBy?: string
  describedBy?: string
  invalid?: boolean
  id?: string
  /** One full-width card per row (for longer option lists). */
  stacked?: boolean
}) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      tabIndex={-1}
      className={cn('flex gap-3 outline-none', stacked ? 'flex-col gap-2' : 'flex-wrap')}
    >
      {options.map((option) => {
        const selected = value === option.value
        return (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-center gap-1 rounded-12 border p-2 transition-colors duration-150 has-[:focus-visible]:shadow-[0_0_0_2px_var(--color-ink)]',
              stacked && 'w-full',
              selected ? 'border-lime bg-lime-tint' : invalid ? 'border-danger bg-card' : 'border-line bg-card hover:bg-canvas',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span aria-hidden className="relative size-[15px] shrink-0">
              <Icon icon={selected ? icons.radioOn : icons.radioOff} className="absolute left-[1.26px] top-[1.26px]" />
            </span>
            <span className={cn('text-[11px] leading-[14px] text-ink', stacked ? 'min-w-0 flex-1' : 'whitespace-nowrap', selected ? 'font-bold' : 'font-normal')}>
              {option.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}

export function TenureChips<T extends number>({
  value,
  options,
  onChange,
  label,
  format,
  id,
  invalid,
  describedBy,
}: {
  /** null until the student picks a tenure. */
  value: T | null
  options: readonly T[]
  onChange: (value: T) => void
  label: string
  format: (value: T) => string
  id?: string
  invalid?: boolean
  describedBy?: string
}) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      tabIndex={-1}
      className="flex w-full gap-2 outline-none"
    >
      {options.map((option) => {
        const selected = option === value
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={cn(
              'min-w-0 flex-1 rounded-full border-[0.7px] p-2 text-center text-[11px] leading-[14px] text-ink transition-colors duration-150',
              selected ? 'border-line bg-lime font-bold' : invalid ? 'border-danger bg-card font-normal' : 'border-line bg-card font-normal hover:bg-canvas',
            )}
          >
            {format(option)}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Loan amount options — a single-choice radio group laid out as a grid of cards.
 * Styled like TenureChips; the selected card is lime with a tick, so the state
 * never relies on colour alone. Arrow keys move the selection (roving tabindex).
 */
export function AmountOptions<T extends number>({
  value,
  options,
  onChange,
  format,
  id,
  labelledBy,
  describedBy,
  invalid,
  columns = 3,
}: {
  value: number
  options: readonly T[]
  onChange: (value: T) => void
  format: (value: T) => string
  id?: string
  labelledBy?: string
  describedBy?: string
  invalid?: boolean
  columns?: number
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedIndex = options.findIndex((option) => option === value)
  // With nothing chosen yet, Tab lands on the first option.
  const tabbable = selectedIndex >= 0 ? selectedIndex : 0
  const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }

  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      tabIndex={-1}
      className="grid w-full gap-2 outline-none"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option, index) => {
        const selected = option === value
        return (
          <button
            key={option}
            ref={(element) => {
              refs.current[index] = element
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === tabbable ? 0 : -1}
            onClick={() => onChange(option)}
            onKeyDown={(event) => {
              const delta = step[event.key]
              if (!delta) return
              event.preventDefault()
              const next = (index + delta + options.length) % options.length
              onChange(options[next])
              refs.current[next]?.focus()
            }}
            className={cn(
              'flex h-10 min-w-0 items-center justify-center gap-1 rounded-12 border-[0.7px] px-1 text-[12px] leading-[15px] text-ink outline-none transition-colors duration-150 focus-visible:shadow-[0_0_0_2px_var(--color-ink)]',
              selected ? 'border-ink bg-lime font-bold' : invalid ? 'border-danger bg-card font-normal' : 'border-line bg-card font-normal hover:bg-canvas',
            )}
          >
            {selected && <Check aria-hidden className="size-3 shrink-0 animate-pop-in" strokeWidth={3} />}
            {format(option)}
          </button>
        )
      })}
    </div>
  )
}

export function SegmentedTabs<T extends string>({
  value,
  options,
  onChange,
  label,
  idPrefix,
}: {
  value: T
  options: Array<Choice<T>>
  onChange: (value: T) => void
  label: string
  idPrefix: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex h-12 w-full items-center gap-1 rounded-full border border-line bg-card p-1">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            id={`${idPrefix}-tab-${option.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${option.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
              const index = options.findIndex((item) => item.value === value)
              const next = options[(index + (event.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length]
              onChange(next.value)
              document.getElementById(`${idPrefix}-tab-${next.value}`)?.focus()
            }}
            className={cn(
              'flex h-10 min-w-0 flex-1 items-center justify-center rounded-full text-[12px] leading-[18px] text-ink transition-colors duration-200',
              selected ? 'bg-lime font-medium' : 'font-normal hover:bg-canvas',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

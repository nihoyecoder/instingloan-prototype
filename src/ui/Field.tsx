import type { InputHTMLAttributes, ReactNode } from 'react'
import { icons } from '../assets/figma'
import { cn } from '../lib/cn'
import { Icon } from './Sprite'

/** Input shell from the Quick Loan forms: white, 0.7px subtle border, radius 12, 8px padding. */
export const inputShell =
  'flex w-full items-center gap-1 rounded-12 border-[0.7px] bg-card px-2 transition-[border-color,box-shadow] duration-150'
export const inputFocus = 'focus-within:border-ink focus-within:shadow-[0_0_0_3px_rgba(210,243,107,0.6)]'
const buttonFocus = 'outline-none focus-visible:border-ink focus-visible:shadow-[0_0_0_3px_rgba(210,243,107,0.6)]'
export const inputText = 'text-[12px] leading-[15px]'

export function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="text-[10px] font-medium leading-[13px] text-danger">
      {children}
    </p>
  )
}

/** "Full legal name *" — 10/13 regular, primary text. */
export function FieldLabel({
  htmlFor,
  id,
  children,
  required,
  extra,
}: {
  htmlFor?: string
  id?: string
  children: ReactNode
  required?: boolean
  extra?: ReactNode
}) {
  const Tag = htmlFor ? 'label' : 'span'
  return (
    <span className="flex items-center gap-1">
      <Tag htmlFor={htmlFor} id={id} className="text-[10px] leading-[13px] text-ink">
        {children}
        {required && ' *'}
      </Tag>
      {extra}
    </span>
  )
}

/** Lime 16px "✓" marker used inside valid fields (PAN, confirm account, IFSC). */
export function CheckMarker({ label = 'Valid' }: { label?: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="flex size-4 shrink-0 animate-pop-in items-center justify-center rounded-full bg-lime text-[10px] font-bold leading-none text-black"
    >
      ✓
    </span>
  )
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  error?: string
  required?: boolean
  /** 30px on Your Details / Income, 32px on Bank account. */
  height?: 30 | 32
  trailing?: ReactNode
  hint?: ReactNode
  labelExtra?: ReactNode
  className?: string
}

export function TextField({
  id,
  label,
  value,
  onValueChange,
  error,
  required,
  height = 30,
  trailing,
  hint,
  labelExtra,
  className,
  ...inputProps
}: TextFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-1', className)}>
      <FieldLabel htmlFor={id} required={required} extra={labelExtra}>
        {label}
      </FieldLabel>
      <div className={cn(inputShell, height === 32 ? 'h-8' : 'h-[30px]', inputFocus, error ? 'border-danger' : 'border-line')}>
        <input
          id={id}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={cn(inputText, 'min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted')}
          {...inputProps}
        />
        {trailing}
      </div>
      {hint && !error && (
        <div id={`${id}-hint`} className="text-[10px] leading-[13px] text-muted">
          {hint}
        </div>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

interface PickerFieldProps {
  id: string
  label: string
  value: string
  placeholder: string
  onOpen: () => void
  error?: string
  required?: boolean
  height?: 30 | 32
  /** "select" shows the dropdown chevron, "date" the calendar. */
  kind?: 'select' | 'date'
  labelExtra?: ReactNode
  /** Narrow three-up fields drop the chevron's 14px box so the value fits. */
  compact?: boolean
  className?: string
}

/** Looks like an input, opens a bottom-sheet list or date picker. */
export function PickerField({
  id,
  label,
  value,
  placeholder,
  onOpen,
  error,
  required,
  height = 30,
  kind = 'select',
  labelExtra,
  compact = false,
  className,
}: PickerFieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-1', className)}>
      <FieldLabel id={`${id}-label`} required={required} extra={labelExtra}>
        {label}
      </FieldLabel>
      <button
        id={id}
        type="button"
        onClick={onOpen}
        aria-labelledby={`${id}-label ${id}`}
        aria-haspopup="dialog"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          inputShell,
          height === 32 ? 'h-8' : 'h-[30px]',
          'text-left hover:border-[#c9cdc4]',
          buttonFocus,
          error ? 'border-danger' : 'border-line',
        )}
      >
        <span className={cn(inputText, 'min-w-0 flex-1 truncate', value ? 'text-ink' : 'text-muted')}>{value || placeholder}</span>
        {kind === 'select' ? (
          <span aria-hidden className={cn('flex h-[15px] shrink-0 items-center justify-center', compact ? 'w-auto' : 'w-[14px]')}>
            <Icon icon={icons.selectChevron} />
          </span>
        ) : (
          <Icon icon={icons.calendar} />
        )}
      </button>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

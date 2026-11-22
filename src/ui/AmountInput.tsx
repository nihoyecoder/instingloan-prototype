import { useLayoutEffect, useRef, type InputHTMLAttributes } from 'react'
import { formatIndianNumber } from '../lib/format'

interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number
  onValueChange: (value: number) => void
}

/**
 * Rupee amount input with live Indian digit grouping (₹8,00,000).
 * Digits only, so amounts can never be negative; the caret stays put while commas move.
 */
export function AmountInput({ value, onValueChange, ...rest }: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const digitsBeforeCaret = useRef<number | null>(null)

  useLayoutEffect(() => {
    const input = inputRef.current
    const wanted = digitsBeforeCaret.current
    if (!input || wanted === null || document.activeElement !== input) return
    digitsBeforeCaret.current = null
    const text = input.value
    let seen = 0
    let position = 1 // after "₹"
    while (position < text.length && seen < wanted) {
      if (/\d/.test(text[position])) seen += 1
      position += 1
    }
    input.setSelectionRange(position, position)
  })

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={`₹${formatIndianNumber(value)}`}
      onChange={(event) => {
        const raw = event.target.value
        const caret = event.target.selectionStart ?? raw.length
        digitsBeforeCaret.current = raw.slice(0, caret).replace(/\D/g, '').length
        const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9)
        onValueChange(digits ? Number(digits) : 0)
      }}
      onFocus={(event) => event.target.select()}
      {...rest}
    />
  )
}

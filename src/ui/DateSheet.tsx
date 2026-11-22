import { useEffect, useState, type ReactNode } from 'react'
import { MONTHS, daysInMonth, formatDisplayDate, parseISODate, toISODate, type DateParts } from '../lib/date'
import { icons } from '../assets/figma'
import { BottomSheet } from './BottomSheet'
import { Button } from './Button'
import { Icon } from './Sprite'

interface DateSheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  value: string
  /** Used when no date has been chosen yet. */
  fallback: string
  minYear: number
  maxYear: number
  onSelect: (iso: string) => void
}

const selectClass =
  'h-11 w-full appearance-none rounded-12 border-[0.7px] border-line bg-card pl-3 pr-8 text-[14px] font-semibold leading-5 text-ink outline-none transition-[border-color,box-shadow] focus:border-ink focus:shadow-[0_0_0_3px_rgba(210,243,107,0.6)]'

function SelectBox({ label, children, value, onChange, autoFocus }: {
  label: string
  children: ReactNode
  value: number
  onChange: (value: number) => void
  autoFocus?: boolean
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[10px] leading-[13px] text-ink">{label}</span>
      <span className="relative">
        <select
          data-autofocus={autoFocus || undefined}
          className={selectClass}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2">
          <Icon icon={icons.selectChevron} />
        </span>
      </span>
    </label>
  )
}

export function DateSheet({ open, onClose, title, description, value, fallback, minYear, maxYear, onSelect }: DateSheetProps) {
  const initial = (): DateParts => parseISODate(value) ?? parseISODate(fallback) ?? { year: maxYear, month: 1, day: 1 }
  const [parts, setParts] = useState<DateParts>(initial)

  // Re-seed from the stored value each time the sheet opens.
  useEffect(() => {
    if (open) setParts(initial())
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const maxDay = daysInMonth(parts.year, parts.month)
  const safe: DateParts = { ...parts, day: Math.min(parts.day, maxDay) }
  const years: number[] = []
  for (let year = maxYear; year >= minYear; year -= 1) years.push(year)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <Button
          arrow={false}
          onClick={() => {
            onSelect(toISODate(safe))
            onClose()
          }}
        >
          Done
        </Button>
      }
    >
      <p className="pb-3 text-[22px] font-bold leading-7 text-ink" aria-live="polite">
        {formatDisplayDate(toISODate(safe))}
      </p>
      <div className="flex gap-2 pb-2">
        <SelectBox label="Day" value={safe.day} onChange={(day) => setParts({ ...safe, day })} autoFocus>
          {Array.from({ length: maxDay }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {String(i + 1).padStart(2, '0')}
            </option>
          ))}
        </SelectBox>
        <SelectBox label="Month" value={safe.month} onChange={(month) => setParts({ ...safe, month })}>
          {MONTHS.map((month, i) => (
            <option key={month} value={i + 1}>
              {month}
            </option>
          ))}
        </SelectBox>
        <SelectBox label="Year" value={safe.year} onChange={(year) => setParts({ ...safe, year })}>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </SelectBox>
      </div>
    </BottomSheet>
  )
}

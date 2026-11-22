import { useEffect, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { cn } from '../lib/cn'
import { BottomSheet } from './BottomSheet'
import { inputFocus, inputShell } from './Field'

interface OptionSheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  options: string[]
  value: string
  onSelect: (value: string) => void
  searchable?: boolean
  searchPlaceholder?: string
  /** Lets the user use a typed value that isn't in the list. */
  allowCustom?: boolean
}

export function OptionSheet({
  open,
  onClose,
  title,
  description,
  options,
  value,
  onSelect,
  searchable = false,
  searchPlaceholder = 'Search',
  allowCustom = false,
}: OptionSheetProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const needle = query.trim().toLowerCase()
  const filtered = needle ? options.filter((option) => option.toLowerCase().includes(needle)) : options
  const showCustom =
    allowCustom && needle.length >= 3 && !options.some((option) => option.toLowerCase() === needle)

  const choose = (next: string) => {
    onSelect(next)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title} description={description}>
      {searchable && (
        <div className="sticky top-0 z-10 bg-card pb-2">
          <label className={cn(inputShell, inputFocus, 'h-10 border-line px-3')}>
            <Search className="size-4 shrink-0 text-muted" aria-hidden />
            <span className="sr-only">{searchPlaceholder}</span>
            <input
              data-autofocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-[13px] font-medium leading-4 text-ink outline-none"
            />
          </label>
        </div>
      )}
      <ul className="flex flex-col pb-1">
        {filtered.map((option) => {
          const selected = option === value
          return (
            <li key={option}>
              <button
                type="button"
                onClick={() => choose(option)}
                aria-current={selected || undefined}
                className={cn(
                  'flex min-h-11 w-full items-center gap-3 rounded-12 px-3 py-[10px] text-left text-[13px] leading-5 text-ink transition-colors hover:bg-canvas',
                  selected && 'bg-lime/[0.18] font-semibold hover:bg-lime/[0.24]',
                )}
              >
                <span className="min-w-0 flex-1">{option}</span>
                {selected && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lime">
                    <Check className="size-3" strokeWidth={3.2} aria-hidden />
                  </span>
                )}
              </button>
            </li>
          )
        })}
        {showCustom && (
          <li>
            <button
              type="button"
              onClick={() => choose(query.trim())}
              className="flex min-h-12 w-full items-center gap-3 rounded-12 px-3 py-3 text-left text-[14px] leading-5 text-ink hover:bg-canvas"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-line">
                <Plus className="size-3" strokeWidth={2.6} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                Use “<span className="font-semibold">{query.trim()}</span>”
              </span>
            </button>
          </li>
        )}
        {filtered.length === 0 && !showCustom && (
          <li className="px-3 py-6 text-center text-[13px] leading-5 text-muted">
            No matches. {allowCustom ? 'Type at least 3 letters to use your own.' : ''}
          </li>
        )}
      </ul>
    </BottomSheet>
  )
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface DateParts {
  year: number
  month: number // 1–12
  day: number
}

export function parseISODate(iso: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null
  return { year, month, day }
}

export function toISODate({ year, month, day }: DateParts): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** "2025-06-01" → "01 Jun 2025" (as in the Figma date fields). */
export function formatDisplayDate(iso: string): string {
  const parts = parseISODate(iso)
  if (!parts) return ''
  return `${String(parts.day).padStart(2, '0')} ${MONTHS[parts.month - 1]} ${parts.year}`
}

export function ageOn(iso: string, now = new Date()): number | null {
  const parts = parseISODate(iso)
  if (!parts) return null
  let age = now.getFullYear() - parts.year
  const beforeBirthday =
    now.getMonth() + 1 < parts.month || (now.getMonth() + 1 === parts.month && now.getDate() < parts.day)
  if (beforeBirthday) age -= 1
  return age
}

/** ISO timestamp → "21 Nov 2026, 9:41 AM" (as on the Figma timeline). */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const hours = date.getHours()
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const period = hours < 12 ? 'AM' : 'PM'
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hour12}:${minutes} ${period}`
}

/** Same day of the month, n months later (clamped to the month's last day). */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1, date.getHours(), date.getMinutes())
  target.setDate(Math.min(date.getDate(), daysInMonth(target.getFullYear(), target.getMonth() + 1)))
  return target
}

import type { ReactNode } from 'react'

/** Lavender "Prototype ·" note that labels every simulated behaviour. */
export function PrototypeNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-12 bg-lavender/[0.35] px-3 py-2 text-[12px] leading-[17px] text-ink">
      <span className="font-semibold">Prototype · </span>
      {children}
    </p>
  )
}

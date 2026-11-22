import { useState } from 'react'
import { Info } from 'lucide-react'
import { sprites } from '../assets/figma'
import { PRICING } from '../config/pricing'
import { cn } from '../lib/cn'
import { formatINR } from '../lib/format'
import type { RepaymentPlan } from '../lib/loan'
import { tenureLabel } from '../state/selectors'
import { BottomSheet } from '../ui/BottomSheet'
import { SegmentedTabs } from '../ui/Controls'
import { Sprite } from '../ui/Sprite'

export const ESTIMATE_DISCLAIMER =
  'Illustrative prototype calculation using monthly reducing-balance interest. Final loan terms depend on lender assessment.'

/** "ⓘ Indicative calculation…" line at the foot of the breakdown sheet (50:331). */
export function EstimateDisclaimer({ children = ESTIMATE_DISCLAIMER }: { children?: string }) {
  return (
    <p className="flex gap-[9px] text-[11px] leading-[14px] text-muted">
      <Info className="mt-[-1px] size-[17px] shrink-0" strokeWidth={1.6} aria-hidden />
      <span>{children}</span>
    </p>
  )
}

/** Loan cost breakdown tab (50:308 – 50:330). */
export function CostBreakdown({ plan, title = 'Loan cost breakdown' }: { plan: RepaymentPlan; title?: string }) {
  const rows: Array<[string, string]> = [
    ['Principal amount', formatINR(plan.principal)],
    ['Interest rate (p.a.)', `${plan.annualRatePercent}%`],
    [`Total interest (${tenureLabel(plan.tenure)})`, formatINR(plan.totalInterest)],
    ['Processing fee', formatINR(plan.processingFee)],
    [`GST on processing fee (${PRICING.gstOnFeePercent}%)`, formatINR(plan.gstOnFee)],
  ]
  return (
    <div className="flex flex-col">
      <div className="relative mt-[18px] h-[98px] w-full shrink-0 rounded-16 bg-lavender/30">
        <p className="absolute left-5 top-3 w-[236px] text-[12px] font-medium leading-[15px] text-ink">Your estimated monthly EMI</p>
        <p className="absolute left-5 top-8 w-[230px] text-[30px] font-bold leading-[38px] text-ink" aria-live="polite">
          {formatINR(plan.emi)}
        </p>
        <p className="absolute left-5 top-[71px] w-[230px] text-[12px] leading-[15px] text-ink">For {tenureLabel(plan.tenure)}</p>
        <Sprite crop={sprites.repaymentCalendar} className="absolute left-[265px] top-[11px]" />
      </div>
      <h3 className="mt-4 text-[18px] font-bold leading-[23px] text-ink">{title}</h3>
      <dl className="mt-[5px] flex flex-col">
        {rows.map(([label, value], index) => (
          <div
            key={label}
            className={cn(
              'flex items-start justify-between gap-3 px-[2px] pt-[5px]',
              index < rows.length - 1 ? 'border-b border-line pb-[9px]' : 'pb-[17px]',
            )}
          >
            <dt className="text-[12px] leading-[15px] text-ink">{label}</dt>
            <dd className="text-right text-[12px] font-semibold leading-[15px] text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex h-[38px] w-full items-center justify-between rounded-12 bg-lime/30 px-[10px] text-[14px] font-bold leading-[18px] text-ink">
        <span>Total repayment</span>
        <span>{formatINR(plan.totalRepayment)}</span>
      </div>
    </div>
  )
}

/** Repayment schedule tab — month-wise table (50:420). */
export function ScheduleTable({ plan }: { plan: RepaymentPlan }) {
  const compact = plan.schedule.length > 6
  const rowHeight = compact ? 'h-9' : 'h-[43px]'
  const totalPrincipal = plan.schedule.reduce((sum, row) => sum + row.principal, 0)
  const totalEmi = plan.schedule.reduce((sum, row) => sum + row.emi, 0)
  const cols = 'grid grid-cols-[49px_107px_93px_1fr] items-center text-center'
  return (
    <div className="flex flex-col">
      <h3 className="mt-[22px] text-[18px] font-bold leading-[23px] text-ink">Repayment schedule ({tenureLabel(plan.tenure)})</h3>
      <p className="mt-[6px] text-[11px] leading-[14px] text-ink">A month-wise breakup of your EMI, principal and interest.</p>
      <div className="mt-[15px] overflow-hidden rounded-12 border border-line bg-card" role="table" aria-label="Repayment schedule">
        <div role="row" className={cn(cols, 'h-[38px] bg-lavender/35 text-[11px] font-medium leading-[14px] text-ink')}>
          <span role="columnheader">EMI</span>
          <span role="columnheader">Principal</span>
          <span role="columnheader">Interest</span>
          <span role="columnheader">Total (EMI)</span>
        </div>
        {plan.schedule.map((row) => (
          <div key={row.number} role="row" className={cn(cols, rowHeight, 'border-t border-line text-[12px] leading-[15px] text-ink')}>
            <span role="cell">{row.number}</span>
            <span role="cell">{formatINR(row.principal)}</span>
            <span role="cell">{formatINR(row.interest)}</span>
            <span role="cell">{formatINR(row.emi)}</span>
          </div>
        ))}
        <div role="row" className={cn(cols, 'h-[43px] border-t border-line bg-lime/30 text-[12px] font-bold leading-[15px] text-ink')}>
          <span role="cell">Total</span>
          <span role="cell">{formatINR(totalPrincipal)}</span>
          <span role="cell">{formatINR(plan.totalInterest)}</span>
          <span role="cell">{formatINR(totalEmi)}</span>
        </div>
      </div>
      {plan.processingFee + plan.gstOnFee > 0 && (
        <p className="mt-2 text-[10px] leading-[13px] text-muted">
          Plus a one-time processing fee of {formatINR(plan.processingFee + plan.gstOnFee)} (incl. GST).
        </p>
      )}
    </div>
  )
}

type View = 'cost' | 'schedule'

/** Repayment breakdown sheet with both tabs (50:298). */
export function RepaymentSheet({ open, onClose, plan }: { open: boolean; onClose: () => void; plan: RepaymentPlan }) {
  const [view, setView] = useState<View>('cost')
  const [wasOpen, setWasOpen] = useState(open)
  // Each time the sheet opens it starts on the cost breakdown.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setView('cost')
  }
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Repayment breakdown"
      height={548}
      bodyClassName="pb-2"
      footer={<EstimateDisclaimer />}
    >
      <SegmentedTabs
        idPrefix="repayment"
        label="Repayment breakdown views"
        value={view}
        onChange={setView}
        options={[
          { value: 'cost', label: 'Loan cost breakdown' },
          { value: 'schedule', label: 'Repayment schedule' },
        ]}
      />
      <div id={`repayment-panel-${view}`} role="tabpanel" aria-labelledby={`repayment-tab-${view}`} className="animate-fade-in" key={view}>
        {view === 'cost' ? <CostBreakdown plan={plan} /> : <ScheduleTable plan={plan} />}
      </div>
    </BottomSheet>
  )
}

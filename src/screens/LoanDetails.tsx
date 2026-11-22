import { useState, type ReactNode } from 'react'
import { icons, sprites, type SpriteCrop } from '../assets/figma'
import { HelpSheet } from '../components/AppSheets'
import { PageNav } from '../components/PageNav'
import { RepaymentSheet } from '../components/Repayment'
import { ScreenLayout, StepFooter, focusFirstError } from '../components/ScreenLayout'
import { LOAN_PURPOSES } from '../config/policy'
import { PRICING } from '../config/pricing'
import { cn } from '../lib/cn'
import { formatINR } from '../lib/format'
import { useApplication } from '../state/ApplicationProvider'
import { repaymentPlan, tenureLabel } from '../state/selectors'
import { hasErrors, validateLoan } from '../state/validation'
import { AmountOptions, TenureChips } from '../ui/Controls'
import { FieldError, TextField, inputShell } from '../ui/Field'
import { InfoTip } from '../ui/InfoTip'
import { OptionSheet } from '../ui/OptionSheet'
import { Icon, Sprite } from '../ui/Sprite'

/** Icon + label + helper + control, as in the "Loan request form" rows (45:329). */
function FormRow({
  crop,
  label,
  helper,
  labelId,
  htmlFor,
  why,
  topic,
  children,
}: {
  crop: SpriteCrop
  label: string
  helper: string
  labelId: string
  htmlFor?: string
  why: ReactNode
  /** Names the info tip ("Why we ask for …"); defaults to the label. */
  topic?: string
  children: ReactNode
}) {
  const Label = htmlFor ? 'label' : 'p'
  return (
    <div className="flex w-full items-start gap-3">
      <Sprite crop={crop} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Label id={labelId} htmlFor={htmlFor} className="text-[12px] font-bold leading-[15px] text-ink">
            {label}
          </Label>
          <InfoTip topic={topic ?? label.toLowerCase()}>{why}</InfoTip>
        </div>
        <p className="text-[10px] leading-[13px] text-muted">{helper}</p>
        {children}
      </div>
    </div>
  )
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <dt className="text-[8px] leading-[10px] text-muted">{label}</dt>
      <dd className="text-[14px] font-bold leading-[18px] text-ink">{value}</dd>
    </div>
  )
}

/** 02 – Loan details (Figma 45:141) · step 1 of 6, with the live repayment estimate. */
export function LoanDetailsScreen() {
  const { state, actions } = useApplication()
  const { loan } = state
  const [attempted, setAttempted] = useState(false)
  const [sheet, setSheet] = useState<'purpose' | 'breakdown' | 'help' | null>(null)

  const errors = validateLoan(loan)
  const plan = repaymentPlan(loan)
  // Continue, the estimate and the breakdown all wait for an explicit amount choice.
  const amountSelected = !errors.amount
  const estimateReady = amountSelected

  const onContinue = () => {
    if (!amountSelected) return
    setAttempted(true)
    if (hasErrors(errors)) {
      const order = [
        ['purpose', 'loan-purpose'],
        ['purposeNote', 'loan-purpose-note'],
      ] as const
      focusFirstError(order.filter(([key]) => errors[key]).map(([, id]) => id))
      return
    }
    actions.goNext()
  }

  return (
    <ScreenLayout
      nav={
        <PageNav
          title="Loan Details"
          onBack={actions.goBack}
          backLabel={state.returnTo ? 'Back to review' : 'Back to start'}
          right="help"
          onRight={() => setSheet('help')}
        />
      }
      step={1}
      contentClassName="pt-6 pb-6"
      footer={<StepFooter onContinue={onContinue} disabled={!amountSelected} />}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-heading-page text-ink">Loan details</h1>
        <p className="text-[13px] leading-[17px] text-muted">
          Tell us how much you need and what’s it for so we can find a suitable offer for you.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4 p-2">
        <FormRow
          crop={sprites.loanAmount}
          label="Choose your loan amount"
          helper="Select an amount that suits your immediate financial needs."
          labelId="loan-amount-label"
          topic="loan amount"
          why="We use the amount you choose and your repayment preference to calculate an estimated loan offer. Amounts are fixed options in this prototype."
        >
          <div className="pt-1">
            <AmountOptions
              id="loan-amount"
              labelledBy="loan-amount-label"
              describedBy={amountSelected ? undefined : 'loan-amount-hint'}
              value={loan.amount}
              options={PRICING.amountOptions}
              onChange={(amount) => actions.updateLoan({ amount })}
              format={formatINR}
            />
          </div>
          {!amountSelected && (
            <p id="loan-amount-hint" className="text-[10px] leading-[13px] text-muted">
              Select an amount to continue.
            </p>
          )}
        </FormRow>

        <FormRow
          crop={sprites.loanPurpose}
          label="Purpose of loan"
          helper="Select the main purpose for this loan."
          labelId="loan-purpose-label"
          why="This helps us understand how you plan to use the loan and assess the application."
        >
          <button
            id="loan-purpose"
            type="button"
            onClick={() => setSheet('purpose')}
            aria-haspopup="dialog"
            aria-labelledby="loan-purpose-label loan-purpose"
            aria-invalid={attempted && errors.purpose ? true : undefined}
            className={cn(
              inputShell,
              'h-8 gap-2 p-2 text-left outline-none hover:border-[#c9cdc4] focus-visible:border-ink focus-visible:shadow-[0_0_0_3px_rgba(210,243,107,0.6)]',
              attempted && errors.purpose ? 'border-danger' : 'border-line',
            )}
          >
            <span className={cn('min-w-0 flex-1 truncate text-[12px] leading-[15px]', loan.purpose ? 'text-ink' : 'text-muted')}>
              {loan.purpose || 'Select a purpose'}
            </span>
            <span aria-hidden className="flex h-[15px] w-[14px] shrink-0 items-center justify-center">
              <Icon icon={icons.selectChevron} />
            </span>
          </button>
          <FieldError id="loan-purpose-error">{attempted ? errors.purpose : undefined}</FieldError>
          {loan.purpose === 'Other' && (
            <TextField
              id="loan-purpose-note"
              label="What is the loan for?"
              required
              value={loan.purposeNote}
              onValueChange={(purposeNote) => actions.updateLoan({ purposeNote })}
              placeholder="e.g. Field trip for my course"
              maxLength={80}
              error={attempted ? errors.purposeNote : undefined}
              className="animate-fade-in pt-1"
            />
          )}
        </FormRow>

        <FormRow
          crop={sprites.loanTenure}
          label="Preferred repayment tenure"
          helper="Choose a repayment period that works for you."
          labelId="loan-tenure-label"
          why="A longer tenure lowers each monthly instalment but increases the total interest you pay."
        >
          <TenureChips
            label="Preferred repayment tenure"
            value={loan.tenure}
            options={PRICING.tenureOptions}
            onChange={(tenure) => actions.updateLoan({ tenure })}
            format={tenureLabel}
          />
        </FormRow>
      </div>

      <section aria-labelledby="estimate-title" className="mt-3 flex flex-col gap-3 rounded-16 bg-lavender/30 px-3 py-4">
        <div className="flex items-start gap-3">
          <Sprite crop={sprites.loanEstimate} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 id="estimate-title" className="text-[12px] font-bold leading-[15px] text-ink">
              Estimated repayment
            </h2>
            <p className="text-[10px] leading-[12px] text-muted">
              Illustrative prototype calculation based on demo{' '}
              <br />
              pricing. The final offer will be shared after{' '}
              <br />
              assessment.
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-x-2 gap-y-3" aria-live="polite">
          <Term label="Loan amount" value={estimateReady ? formatINR(plan.principal) : '—'} />
          <Term label="Est. interest (p.a.)" value={`${PRICING.annualRatePercent}%`} />
          <Term label={`Est. EMI (${tenureLabel(loan.tenure)})`} value={estimateReady ? formatINR(plan.emi) : '—'} />
          <Term label="Total interest" value={estimateReady ? formatINR(plan.totalInterest) : '—'} />
          <Term label="Processing fee" value={formatINR(plan.processingFee + plan.gstOnFee)} />
          <Term label="Total repayment" value={estimateReady ? formatINR(plan.totalRepayment) : '—'} />
        </dl>
        <button
          type="button"
          onClick={() => setSheet('breakdown')}
          disabled={!estimateReady}
          aria-haspopup="dialog"
          className="flex h-[42px] w-full items-center justify-center rounded-full border-[1.5px] border-lavender text-[12px] font-semibold leading-[15px] text-ink transition-colors enabled:hover:bg-lavender/40 disabled:text-muted"
        >
          Show breakdown
        </button>
      </section>

      <OptionSheet
        open={sheet === 'purpose'}
        onClose={() => setSheet(null)}
        title="Purpose of loan"
        description="Choose the main thing you’ll use the money for."
        options={LOAN_PURPOSES}
        value={loan.purpose}
        onSelect={(purpose) => actions.updateLoan({ purpose })}
      />
      <RepaymentSheet open={sheet === 'breakdown'} onClose={() => setSheet(null)} plan={plan} />
      <HelpSheet open={sheet === 'help'} onClose={() => setSheet(null)} title="About loan details">
        <p>
          Choose one of the amounts shown. The estimate updates as soon as you change the amount or tenure. It uses a{' '}
          {PRICING.annualRatePercent}% p.a. rate with interest charged monthly on the reducing balance.
        </p>
        <p>
          It’s an illustrative prototype calculation, not an approved offer. The amount options aren’t lender limits, and your
          final terms depend on the lender’s assessment.
        </p>
      </HelpSheet>
    </ScreenLayout>
  )
}

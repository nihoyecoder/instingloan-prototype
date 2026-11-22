import { useRef, useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { sprites } from '../assets/figma'
import { HelpSheet } from '../components/AppSheets'
import { DocumentCard } from '../components/DocumentCard'
import { PageNav } from '../components/PageNav'
import { ScreenLayout, StepFooter, focusFirstError } from '../components/ScreenLayout'
import { INCOME_COPY, INCOME_SOURCES, REPAYMENT_SOURCES, type IncomeSource } from '../config/policy'
import { cn } from '../lib/cn'
import { formatDisplayDate } from '../lib/date'
import { formatINR } from '../lib/format'
import { useApplication } from '../state/ApplicationProvider'
import { hasEstimate, repaymentPlan, tenureLabel } from '../state/selectors'
import type { Income } from '../state/types'
import { hasErrors, validateIncome, type IncomeKey } from '../state/validation'
import { AmountInput } from '../ui/AmountInput'
import { RadioCards } from '../ui/Controls'
import { DateSheet } from '../ui/DateSheet'
import { FieldError, FieldLabel, PickerField, TextField, inputFocus, inputShell } from '../ui/Field'
import { InfoTip } from '../ui/InfoTip'
import { OptionSheet } from '../ui/OptionSheet'

const ORDER: IncomeKey[] = [
  'hasIncome',
  'repaymentSource',
  'repaymentNote',
  'source',
  'organisation',
  'monthlyAmount',
  'startDate',
  'endDate',
]

/** 04 – Income details (Figma 45:175) · step 3 of 6. Optional: students without income continue freely. */
export function IncomeDetailsScreen() {
  const { state, actions } = useApplication()
  const { income } = state
  const [attempted, setAttempted] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<IncomeKey, boolean>>>({})
  const [sheet, setSheet] = useState<'source' | 'start' | 'end' | 'help' | null>(null)
  const lastDate = useRef<'start' | 'end'>('start')
  if (sheet === 'start' || sheet === 'end') lastDate.current = sheet

  const errors = validateIncome(income)
  const show = (key: IncomeKey) => (attempted || touched[key] ? errors[key] : undefined)
  const touch = (key: IncomeKey) => setTouched((current) => ({ ...current, [key]: true }))
  const update = (patch: Partial<Income>) => actions.updateIncome(patch)
  const copy = income.source ? INCOME_COPY[income.source] : null
  const thisYear = new Date().getFullYear()
  const internship = income.source === 'Internship stipend'
  // For the "How will you repay?" line — only once an amount and tenure are chosen.
  const plan = repaymentPlan(state.loan)
  const estimateReady = hasEstimate(state.loan)

  const onContinue = () => {
    setAttempted(true)
    if (hasErrors(errors)) {
      focusFirstError(ORDER.filter((key) => errors[key]).map((key) => `income-${key}`))
      return
    }
    actions.goNext()
  }

  return (
    <ScreenLayout
      nav={
        <PageNav
          title="Income Details"
          onBack={actions.goBack}
          backLabel={state.returnTo ? 'Back to review' : 'Back to your details'}
          right="help"
          onRight={() => setSheet('help')}
        />
      }
      step={3}
      contentClassName="gap-6 pt-6 pb-6"
      footer={<StepFooter onContinue={onContinue} />}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-heading-page text-ink">Income details</h1>
        <p className="text-[13px] leading-[17px] text-muted">Help us understand your financial situation.</p>
      </div>

      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-1.5">
          <h2 id="income-question" className="text-[16px] font-bold leading-5 text-ink">
            Do you have a source of income?
          </h2>
          <InfoTip topic="income details">
            Income information can help assess repayment capacity. You can continue without personal income details.
          </InfoTip>
        </div>
        <RadioCards
          id="income-hasIncome"
          name="has-income"
          labelledBy="income-question"
          value={income.hasIncome}
          invalid={Boolean(show('hasIncome'))}
          onChange={(hasIncome) => update({ hasIncome })}
          options={[
            { value: 'yes', label: 'Yes, I have income' },
            { value: 'no', label: 'No, I don’t have income' },
          ]}
        />
        <FieldError id="income-hasIncome-error">{show('hasIncome')}</FieldError>

        {income.hasIncome === 'no' && (
          <div className="flex animate-fade-in flex-col gap-3">
            <div role="status" className="flex items-start gap-3 rounded-12 bg-lime-tint p-3">
              <CircleCheck className="mt-px size-[18px] shrink-0 text-success" strokeWidth={2.2} aria-hidden />
              <div className="flex flex-col gap-1">
                <p className="text-[12px] font-bold leading-[15px] text-ink">That’s okay</p>
                <p className="text-[10px] leading-[13px] text-muted">
                  You can apply without personal income. Tell us how you’d manage the repayments.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <h3 id="income-repay-question" className="text-[14px] font-bold leading-[18px] text-ink">
                  How will you repay this loan? <span aria-hidden>*</span>
                </h3>
                <InfoTip topic="how you’ll repay">
                  This helps the lender understand how the loan will be repaid. It’s one part of the assessment, not a decision
                  on its own.
                </InfoTip>
              </div>
              {estimateReady && (
                <p id="income-repay-emi" className="text-[10px] leading-[13px] text-muted">
                  Your estimated EMI is {formatINR(plan.emi)} a month for {tenureLabel(plan.tenure)}.
                </p>
              )}
            </div>
            <RadioCards
              id="income-repaymentSource"
              name="repayment-source"
              stacked
              labelledBy="income-repay-question"
              describedBy={
                [estimateReady && 'income-repay-emi', show('repaymentSource') && 'income-repaymentSource-error'].filter(Boolean).join(' ') ||
                undefined
              }
              value={income.repaymentSource}
              invalid={Boolean(show('repaymentSource'))}
              onChange={(repaymentSource) => {
                update({ repaymentSource })
                touch('repaymentSource')
              }}
              options={REPAYMENT_SOURCES.map((source) => ({ value: source, label: source }))}
            />
            <FieldError id="income-repaymentSource-error">{show('repaymentSource')}</FieldError>
            {income.repaymentSource === 'Other' && (
              <TextField
                id="income-repaymentNote"
                label="How you’ll repay"
                required
                value={income.repaymentNote}
                onValueChange={(repaymentNote) => update({ repaymentNote })}
                onBlur={() => touch('repaymentNote')}
                placeholder="e.g. Selling my old laptop"
                maxLength={80}
                error={show('repaymentNote')}
                className="animate-fade-in"
              />
            )}
          </div>
        )}

        {income.hasIncome === 'yes' && (
          <div className="flex animate-fade-in flex-col gap-3">
            <PickerField
              id="income-source"
              label="Primary source of income"
              required
              value={income.source}
              placeholder="Select source"
              onOpen={() => setSheet('source')}
              error={show('source')}
            />
            {copy && (
              <>
                <div className="flex gap-3">
                  <TextField
                    id="income-organisation"
                    label={copy.organisation}
                    required={copy.organisationRequired}
                    value={income.organisation}
                    onValueChange={(organisation) => update({ organisation })}
                    onBlur={() => touch('organisation')}
                    placeholder={copy.organisationRequired ? 'Name' : 'Optional'}
                    error={show('organisation')}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <FieldLabel htmlFor="income-monthlyAmount" required>
                      {copy.amount}
                    </FieldLabel>
                    <div className={cn(inputShell, 'h-[30px]', inputFocus, show('monthlyAmount') ? 'border-danger' : 'border-line')}>
                      <AmountInput
                        id="income-monthlyAmount"
                        value={income.monthlyAmount}
                        onValueChange={(monthlyAmount) => update({ monthlyAmount })}
                        onBlur={() => touch('monthlyAmount')}
                        aria-invalid={show('monthlyAmount') ? true : undefined}
                        aria-describedby={show('monthlyAmount') ? 'income-monthlyAmount-error' : undefined}
                        className="min-w-0 flex-1 bg-transparent text-[12px] leading-[15px] text-ink outline-none"
                      />
                    </div>
                    <FieldError id="income-monthlyAmount-error">{show('monthlyAmount')}</FieldError>
                  </div>
                </div>
                <div className="flex gap-3">
                  <PickerField
                    id="income-startDate"
                    kind="date"
                    label={copy.start}
                    required
                    value={income.startDate ? formatDisplayDate(income.startDate) : ''}
                    placeholder="DD MMM YYYY"
                    onOpen={() => setSheet('start')}
                    error={show('startDate')}
                  />
                  {copy.end ? (
                    <PickerField
                      id="income-endDate"
                      kind="date"
                      label={copy.end}
                      required
                      value={income.endDate ? formatDisplayDate(income.endDate) : ''}
                      placeholder="DD MMM YYYY"
                      onOpen={() => setSheet('end')}
                      error={show('endDate')}
                    />
                  ) : (
                    <div className="min-w-0 flex-1" aria-hidden />
                  )}
                </div>
              </>
            )}
            <DocumentCard
              id="incomeProof"
              variant="income"
              icon={sprites.incomeProof}
              title={internship || !income.source ? 'Internship letter / income proof' : 'Income proof'}
              helper={
                internship || !income.source ? (
                  <>
                    Upload your offer letter, internship letter or{' '}
                    <br />
                    any income proof (optional).
                  </>
                ) : (
                  'Upload a salary slip, bank statement or any income proof (optional).'
                )
              }
              why="It can help the lender understand your income faster. It’s optional — you can submit without it."
            />
          </div>
        )}
      </div>

      <OptionSheet
        open={sheet === 'source'}
        onClose={() => setSheet(null)}
        title="Primary source of income"
        options={[...INCOME_SOURCES]}
        value={income.source}
        onSelect={(source) => {
          update({ source: source as IncomeSource, endDate: INCOME_COPY[source as IncomeSource].end ? income.endDate : '' })
          touch('source')
        }}
      />
      <DateSheet
        open={sheet === 'start' || sheet === 'end'}
        onClose={() => {
          setSheet(null)
          touch(lastDate.current === 'start' ? 'startDate' : 'endDate')
        }}
        title={lastDate.current === 'start' ? (copy?.start ?? 'Start date') : (copy?.end ?? 'End date')}
        value={lastDate.current === 'start' ? income.startDate : income.endDate}
        fallback={lastDate.current === 'start' ? `${thisYear}-06-01` : `${thisYear}-12-31`}
        minYear={thisYear - 10}
        maxYear={lastDate.current === 'start' ? thisYear : thisYear + 3}
        onSelect={(iso) => update(lastDate.current === 'start' ? { startDate: iso } : { endDate: iso })}
      />
      <HelpSheet open={sheet === 'help'} onClose={() => setSheet(null)} title="About income details">
        <p>
          Many students don’t have personal income — you can choose “No” and continue. We’ll just ask how you’d manage the
          repayments. The lender may ask for more information during assessment.
        </p>
        <p>If you do have income, the details and an optional proof can help the lender understand your repayment capacity.</p>
      </HelpSheet>
    </ScreenLayout>
  )
}

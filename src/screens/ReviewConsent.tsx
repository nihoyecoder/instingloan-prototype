import { useState, type ReactNode } from 'react'
import { ChevronDown, CircleAlert } from 'lucide-react'
import { icons, sprites, type SpriteCrop } from '../assets/figma'
import { HelpSheet, InfoSheet, PrototypeNote } from '../components/AppSheets'
import { PageNav } from '../components/PageNav'
import { ScreenLayout, StepFooter } from '../components/ScreenLayout'
import { INCOME_COPY } from '../config/policy'
import { PRICING } from '../config/pricing'
import { cn } from '../lib/cn'
import { formatDisplayDate } from '../lib/date'
import { formatINR, formatMobileWithCode } from '../lib/format'
import { useApplication } from '../state/ApplicationProvider'
import { incomeSummary, personalSummary, purposeLabel, repaymentPlan, tenureLabel } from '../state/selectors'
import type { Consents, StepScreenId } from '../state/types'
import { consentsComplete, submissionBlockers } from '../state/validation'
import { Checkbox } from '../ui/Controls'
import { InfoTip } from '../ui/InfoTip'
import { Icon, Sprite } from '../ui/Sprite'

interface SummaryRowProps {
  id: string
  crop: SpriteCrop
  title: ReactNode
  lines: string[]
  details: Array<[string, string]>
  onEdit: () => void
  editLabel: string
}

/** "Loan details review" row (45:712), expandable to show every value. */
function SummaryRow({ id, crop, title, lines, details, onEdit, editLabel }: SummaryRowProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col rounded-12 border-[0.7px] border-line bg-card p-1">
      <div className="flex items-center gap-3">
        <Sprite crop={crop} />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={`${id}-details`}
          className="flex min-w-0 flex-1 flex-col gap-1 rounded-[6px] text-left"
        >
          <span className="flex items-center gap-1 text-[12px] font-bold leading-[15px] text-ink">
            {title}
            <ChevronDown className={cn('size-3 shrink-0 text-muted transition-transform', open && 'rotate-180')} strokeWidth={2.4} aria-hidden />
          </span>
          <span className="text-[9px] leading-[12px] text-muted">
            {lines.map((line, index) => (
              <span key={index} className="block">
                {line}
              </span>
            ))}
          </span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label={editLabel}
          className="flex shrink-0 items-center gap-1 rounded-[6px] px-1 py-1 text-[11px] leading-[14px] text-accent transition-colors hover:bg-lavender-tint"
        >
          <Icon icon={icons.editPencil} />
          Edit
        </button>
      </div>
      {open && (
        <dl id={`${id}-details`} className="mx-1 mb-1 mt-2 flex animate-fade-in flex-col gap-1 rounded-[10px] bg-canvas px-3 py-2">
          {details.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-3 text-[10px] leading-[13px]">
              <dt className="shrink-0 text-muted">{label}</dt>
              <dd className="min-w-0 text-right text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

const CONSENTS: Array<{ key: keyof Consents; text: string }> = [
  { key: 'accuracy', text: 'I confirm that the information provided is true, complete and accurate to the best of my knowledge.' },
  { key: 'kyc', text: 'I agree to the KYC verification required for assessment of my loan application.' },
  { key: 'bureau', text: 'I agree to an applicable credit bureau check for assessment of my loan application.' },
  {
    key: 'dataProcessing',
    text: 'I consent to the collection, processing and sharing of my information with the lender and their service providers for loan assessment.',
  },
]

/** 07 – Review & consent (Figma 45:226) · step 6 of 6. */
export function ReviewConsentScreen() {
  const { state, actions } = useApplication()
  const { loan, personal, student, income, kyc, documents, bank, consents } = state
  const [submitting, setSubmitting] = useState(false)
  const [sheet, setSheet] = useState<'terms' | 'privacy' | 'help' | null>(null)

  const blockers = submissionBlockers(state)
  const allConsents = consentsComplete(consents)
  const canSubmit = blockers.length === 0 && allConsents
  const plan = repaymentPlan(loan)
  const edit = (screen: StepScreenId) => () => actions.editFrom(screen)
  const docName = (id: keyof typeof documents) => (documents[id].status === 'uploaded' ? (documents[id].file?.name ?? 'Uploaded') : 'Not added')

  const onSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    await actions.submit()
  }

  return (
    <ScreenLayout
      nav={
        <PageNav
          title="Review & Consent"
          onBack={actions.goBack}
          backLabel="Back to bank account details"
          right="help"
          onRight={() => setSheet('help')}
        />
      }
      step={6}
      contentClassName="gap-6 pt-6 pb-6"
      footer={
        <StepFooter
          onContinue={() => void onSubmit()}
          label="Submit application"
          forceLabel
          disabled={!canSubmit}
          loading={submitting}
          loadingLabel="Submitting…"
        />
      }
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-heading-page text-ink">Review &amp; Consent</h1>
        <p className="text-[13px] leading-[17px] text-muted">
          Check your details and provide the required consent to submit your application.
        </p>
      </div>

      {blockers.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-12 bg-warning-soft p-3">
          <CircleAlert className="mt-px size-[18px] shrink-0 text-warning" strokeWidth={2.2} aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[12px] font-bold leading-[15px] text-warning">Finish these sections to submit</p>
            <ul className="flex flex-col gap-1">
              {blockers.map((blocker) => (
                <li key={blocker.label} className="flex items-center justify-between gap-2 text-[11px] leading-[14px] text-ink">
                  {blocker.label}
                  <button
                    type="button"
                    onClick={edit(blocker.screen as StepScreenId)}
                    className="rounded-full border border-line bg-card px-3 py-1 text-[10px] font-semibold leading-[13px] text-ink hover:bg-canvas"
                  >
                    Fix
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <SummaryRow
          id="review-loan"
          crop={sprites.reviewLoan}
          title="Loan details"
          lines={[`Requested amount: ${formatINR(loan.amount)}`, `Purpose: ${purposeLabel(loan)}`]}
          details={[
            ['Requested amount', formatINR(loan.amount)],
            ['Purpose', purposeLabel(loan)],
            ['Tenure', tenureLabel(loan.tenure)],
            ['Est. EMI', `${formatINR(plan.emi)} / month`],
            ['Est. interest', `${PRICING.annualRatePercent}% p.a. · ${formatINR(plan.totalInterest)} total`],
            ['Est. total repayment', formatINR(plan.totalRepayment)],
          ]}
          onEdit={edit('loan')}
          editLabel="Edit loan details"
        />
        <SummaryRow
          id="review-personal"
          crop={sprites.reviewPersonal}
          title="Personal details"
          lines={[personalSummary(state)]}
          details={[
            ['Full legal name', personal.fullName],
            ['Date of birth', personal.dob ? formatDisplayDate(personal.dob) : '—'],
            ['Email', personal.email],
            ['Mobile', formatMobileWithCode(personal.mobile)],
            ['Address', `${personal.address}, ${personal.city}, ${personal.state} ${personal.pinCode}`],
          ]}
          onEdit={edit('details')}
          editLabel="Edit personal details"
        />
        <SummaryRow
          id="review-student"
          crop={sprites.reviewStudent}
          title="Student details"
          lines={[[student.course, student.yearOfStudy, student.institution].filter(Boolean).join(' · ')]}
          details={[
            ['Institution', student.institution],
            ['Course', `${student.course} · ${student.courseLevel}`],
            ['Year of study', student.yearOfStudy],
            ['Status', student.status],
          ]}
          onEdit={edit('details')}
          editLabel="Edit student details"
        />
        <SummaryRow
          id="review-income"
          crop={sprites.reviewIncome}
          title={
            <>
              Income details <span className="font-normal">(Optional)</span>
            </>
          }
          lines={[incomeSummary(state)]}
          details={
            income.hasIncome === 'yes' && income.source
              ? [
                  ['Source', income.source],
                  [INCOME_COPY[income.source].organisation, income.organisation || '—'],
                  [INCOME_COPY[income.source].amount, `${formatINR(income.monthlyAmount)} / month`],
                  [
                    'Duration',
                    `${income.startDate ? formatDisplayDate(income.startDate) : '—'}${
                      INCOME_COPY[income.source].end && income.endDate ? ` – ${formatDisplayDate(income.endDate)}` : ' – ongoing'
                    }`,
                  ],
                  ['Income proof', docName('incomeProof')],
                ]
              : [['Personal income', income.hasIncome === 'no' ? 'None declared — that’s okay' : 'Not answered yet']]
          }
          onEdit={edit('income')}
          editLabel="Edit income details"
        />
        <SummaryRow
          id="review-kyc"
          crop={sprites.reviewKyc}
          title="KYC & Documents"
          lines={['PAN, Identity proof, Student ID']}
          details={[
            ['PAN', kyc.panStatus === 'verified' ? `${kyc.panMasked} · verified (simulated)` : 'Not verified'],
            ['Identity proof', docName('identityProof')],
            ['Student ID', docName('studentProof')],
          ]}
          onEdit={edit('kyc')}
          editLabel="Edit KYC and documents"
        />
        <SummaryRow
          id="review-bank"
          crop={sprites.reviewBank}
          title="Bank account"
          lines={[bank.accountLast4 ? `${bank.bankName} · A/c ending with ${bank.accountLast4}` : 'Not verified yet']}
          details={[
            ['Account holder', bank.holderName],
            ['Bank', bank.bankName || '—'],
            ['Account number', bank.accountMasked || '—'],
            ['IFSC', bank.ifsc || '—'],
            ['Status', bank.verification === 'verified' ? 'Verified (simulated)' : 'Not verified'],
          ]}
          onEdit={edit('bank')}
          editLabel="Edit bank account"
        />
      </div>

      <section aria-labelledby="consents-title" className="flex flex-col gap-2 rounded-16 bg-lavender-tint p-3">
        <div className="flex items-center gap-1.5">
          <h2 id="consents-title" className="text-[14px] font-bold leading-[18px] text-ink">
            Consents &amp; declaration
          </h2>
          <InfoTip topic="your consent">
            Your consent allows the relevant checks and data processing required for application assessment.
          </InfoTip>
        </div>
        {CONSENTS.map((item) => (
          <Checkbox key={item.key} checked={consents[item.key]} onChange={(value) => actions.setConsent(item.key, value)}>
            {item.text}
          </Checkbox>
        ))}
        <p className="text-[9px] leading-[12px] text-ink">
          By proceeding, I agree to the{' '}
          <button type="button" onClick={() => setSheet('terms')} className="text-accent hover:underline">
            Terms &amp; Conditions
          </button>{' '}
          and{' '}
          <button type="button" onClick={() => setSheet('privacy')} className="text-accent hover:underline">
            Privacy Policy
          </button>
          .
        </p>
        <p aria-live="polite" className={cn('text-[10px] leading-[13px]', allConsents ? 'text-success' : 'text-muted')}>
          {allConsents ? 'All consents given.' : 'Tick all four to submit your application.'}
        </p>
      </section>

      <InfoSheet open={sheet === 'terms'} onClose={() => setSheet(null)} title="Terms & Conditions">
        <p>Placeholder terms for this prototype:</p>
        <ul className="flex list-disc flex-col gap-1 pl-4">
          <li>Submitting an application doesn’t guarantee a loan.</li>
          <li>Any offer, its interest rate and fees are confirmed only after the lender’s assessment.</li>
          <li>You can review and accept or decline an offer before any money is disbursed.</li>
        </ul>
        <PrototypeNote>Illustrative text only — not real loan terms.</PrototypeNote>
      </InfoSheet>
      <InfoSheet open={sheet === 'privacy'} onClose={() => setSheet(null)} title="Privacy Policy">
        <p>
          Your information is used to assess this application and is shared only with the lender and their service
          providers for that purpose.
        </p>
        <PrototypeNote>
          In this prototype nothing leaves your browser. Only a masked PAN and the last four digits of your account are
          saved; documents aren’t stored.
        </PrototypeNote>
      </InfoSheet>
      <HelpSheet open={sheet === 'help'} onClose={() => setSheet(null)} title="Before you submit">
        <p>Tap a section to see everything you entered, or Edit to change it — you’ll come straight back here.</p>
        <p>Each consent covers a different check, so they’re asked for separately. None are ticked for you.</p>
      </HelpSheet>
    </ScreenLayout>
  )
}

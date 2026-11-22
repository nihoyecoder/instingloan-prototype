import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { sprites } from '../assets/figma'
import { HelpSheet, PrototypeNote } from '../components/AppSheets'
import { DocumentActionsNote, DocumentCard } from '../components/DocumentCard'
import { PageNav } from '../components/PageNav'
import { ScreenLayout, StepFooter, focusFirstError } from '../components/ScreenLayout'
import { POLICY } from '../config/policy'
import { cn } from '../lib/cn'
import { useApplication } from '../state/ApplicationProvider'
import { DOC_IDS } from '../state/defaults'
import { hasErrors, validateKyc, validatePan } from '../state/validation'
import { CheckMarker, FieldError, inputFocus, inputShell } from '../ui/Field'
import { InfoTip } from '../ui/InfoTip'
import { Sprite } from '../ui/Sprite'
import { useUi } from '../ui/UiProvider'

/**
 * PAN card (45:552). The full PAN only lives in this component while it's typed;
 * once the simulated check passes, the app keeps the masked form alone.
 */
function PanCard({ highlight }: { highlight: boolean }) {
  const { state, actions } = useApplication()
  const { kyc } = state
  const [draft, setDraft] = useState('')
  const [touched, setTouched] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)

  const formatError = touched && draft ? validatePan(draft) : undefined
  const verified = kyc.panStatus === 'verified' && Boolean(kyc.panMasked)
  const checking = kyc.panStatus === 'checking'
  const missing = highlight && !verified && !checking && !draft
  const error = checkError ?? formatError ?? (missing ? 'Enter your PAN' : undefined)

  const runCheck = async (pan: string) => {
    setCheckError(null)
    const result = await actions.checkPan(pan)
    if (result.ok) {
      setDraft('')
      setTouched(false)
    } else {
      setCheckError(result.reason ?? 'We couldn’t verify this PAN.')
    }
  }

  return (
    <section
      aria-labelledby="pan-title"
      className={cn('flex w-full items-start gap-3 rounded-12 border-[0.7px] bg-card p-2', error ? 'border-danger' : 'border-line')}
    >
      <Sprite crop={sprites.kycPan} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <label id="pan-title" htmlFor="kyc-pan" className="text-[12px] font-bold leading-[15px] text-ink">
            PAN number *
          </label>
          <InfoTip topic="PAN and KYC">
            We use identity information to complete the required customer verification checks. PAN confirms your identity
            for tax and credit checks — it isn’t proof of address.
          </InfoTip>
        </div>
        <p className="text-[10px] leading-[13px] text-muted">Enter your 10-character PAN.</p>
        {verified ? (
          <div className={cn(inputShell, 'gap-2 border-line p-2')}>
            <span id="kyc-pan" tabIndex={-1} className="min-w-0 flex-1 text-[12px] leading-[15px] tracking-[0.06em] text-ink outline-none">
              {kyc.panMasked}
            </span>
            <button
              type="button"
              onClick={() => {
                actions.clearPan()
                setCheckError(null)
              }}
              aria-label="Change PAN"
              className="rounded-[4px] text-[10px] font-semibold leading-[13px] text-accent underline underline-offset-2"
            >
              Change
            </button>
            <CheckMarker label="PAN verified" />
          </div>
        ) : (
          <div className={cn(inputShell, 'gap-2 p-2', inputFocus, error ? 'border-danger' : 'border-line')}>
            <input
              id="kyc-pan"
              value={draft}
              disabled={checking}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="characters"
              maxLength={10}
              placeholder="ABCDE1234F"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'kyc-pan-error' : 'kyc-pan-status'}
              onChange={(event) => {
                const next = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
                setDraft(next)
                setCheckError(null)
                if (next.length === 10) {
                  setTouched(true)
                  if (!validatePan(next)) void runCheck(next)
                }
              }}
              onBlur={() => setTouched(true)}
              className="min-w-0 flex-1 bg-transparent text-[12px] uppercase leading-[15px] tracking-[0.06em] text-ink outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted disabled:text-muted"
            />
            {checking && <LoaderCircle className="size-4 shrink-0 animate-spin text-muted" strokeWidth={2.4} aria-hidden />}
            {checkError && draft.length === 10 && !validatePan(draft) && (
              <button
                type="button"
                onClick={() => void runCheck(draft)}
                className="shrink-0 rounded-[4px] text-[10px] font-semibold leading-[13px] text-accent underline underline-offset-2"
              >
                Try again
              </button>
            )}
          </div>
        )}
        <p id="kyc-pan-status" aria-live="polite" className={cn('text-[10px] leading-[13px]', verified ? 'text-success' : 'text-muted')}>
          {checking ? 'Checking your PAN…' : verified ? 'PAN verified · simulated check' : ''}
        </p>
        <FieldError id="kyc-pan-error">{error}</FieldError>
      </div>
    </section>
  )
}

/** 05 – KYC & documents (Figma 45:192) · step 4 of 6. */
export function KycDocumentsScreen() {
  const { state, actions } = useApplication()
  const { toast } = useUi()
  const [attempted, setAttempted] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const errors = validateKyc(state)

  const onContinue = () => {
    if (DOC_IDS.some((id) => state.documents[id].status === 'uploading') || state.kyc.panStatus === 'checking') {
      toast('Hang on — still finishing up. Try again in a moment.')
      return
    }
    setAttempted(true)
    if (hasErrors(errors)) {
      focusFirstError(
        [errors.pan && 'kyc-pan', errors.identityProof && 'doc-identityProof', errors.studentProof && 'doc-studentProof'].filter(
          (id): id is string => Boolean(id),
        ),
      )
      return
    }
    actions.goNext()
  }

  return (
    <ScreenLayout
      nav={
        <PageNav
          title="KYC & Documents"
          onBack={actions.goBack}
          backLabel={state.returnTo ? 'Back to review' : 'Back to income details'}
          right="help"
          onRight={() => setHelpOpen(true)}
        />
      }
      step={4}
      contentClassName="gap-6 pt-6 pb-6"
      footer={<StepFooter onContinue={onContinue} />}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-heading-page text-ink">KYC &amp; Documents</h1>
        <p className="text-[13px] leading-[17px] text-muted">
          Verify your identity and add the required documents for a quick assessment.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <PanCard highlight={attempted} />
        <DocumentCard
          id="identityProof"
          icon={sprites.kycIdentity}
          title="Identity proof"
          required
          highlight={attempted}
          helper={
            <>
              Upload a government approved ID{' '}
              <br />
              (e.g. {POLICY.identityProof.acceptedTypes.slice(0, 3).join(', ')}).
            </>
          }
          why={`Any one of ${POLICY.identityProof.acceptedTypes.join(', ')} is accepted under the demo lender policy — Aadhaar isn’t mandatory.`}
        />
        <DocumentCard
          id="studentProof"
          icon={sprites.kycStudent}
          title="Student ID / College proof"
          required
          highlight={attempted}
          helper={
            <>
              Upload your student ID, college ID or current{' '}
              <br />
              enrolment proof.
            </>
          }
          why="It confirms you’re currently enrolled — this is a loan for students."
        />
        <DocumentCard
          id="incomeProof"
          icon={sprites.kycIncome}
          title="Income proof (Optional)"
          helper={
            <>
              Upload your offer letter, internship letter or{' '}
              <br />
              latest income proof, if available.
            </>
          }
          why="Optional. It can help the lender understand any income you have — you can submit without it."
        />
        <DocumentActionsNote />
      </div>

      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} title="About KYC & documents">
        <p>
          Your PAN is checked straight away (simulated). Upload one government ID and proof that you’re a current student.
          Income proof is optional.
        </p>
        <p>
          {POLICY.documents.accepted}, up to {POLICY.documents.maxFileMb} MB each. Uploading doesn’t mean a document is
          verified — that happens during the lender’s review.
        </p>
        <PrototypeNote>
          Only a masked PAN is saved. Files stay in this tab and aren’t stored. The first upload fails once to show retry
          (switch this off in the presenter controls).
        </PrototypeNote>
      </HelpSheet>
    </ScreenLayout>
  )
}

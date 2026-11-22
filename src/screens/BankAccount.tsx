import { useState } from 'react'
import { OctagonAlert } from 'lucide-react'
import { sprites } from '../assets/figma'
import { HelpSheet, PrototypeNote } from '../components/AppSheets'
import { PageNav } from '../components/PageNav'
import { ScreenLayout, StepFooter, focusFirstError } from '../components/ScreenLayout'
import { BANKS } from '../config/policy'
import { cn } from '../lib/cn'
import { formatTimestamp } from '../lib/date'
import { useApplication } from '../state/ApplicationProvider'
import { maskAccount } from '../state/selectors'
import { validateAccountNumber, validateBank, validateIfsc } from '../state/validation'
import { CheckMarker, FieldLabel, PickerField, TextField, inputShell } from '../ui/Field'
import { InfoTip } from '../ui/InfoTip'
import { OptionSheet } from '../ui/OptionSheet'
import { Sprite } from '../ui/Sprite'

type FieldKey = 'holderName' | 'bankName' | 'account' | 'confirm' | 'ifsc'

const WHY_BANK = 'We use your verified account for eligible disbursement and applicable repayment arrangements.'

function ReadOnlyBox({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <FieldLabel id={`${id}-label`} required>
        {label}
      </FieldLabel>
      <div id={id} aria-labelledby={`${id}-label`} className={cn(inputShell, 'h-8 justify-between gap-2 border-line text-[12px] leading-[15px] text-ink')}>
        <span className="truncate tracking-[0.04em]">{value}</span>
        <CheckMarker label="Verified" />
      </div>
    </div>
  )
}

/**
 * 06 – Bank account details (Figma 45:209) · step 5 of 6.
 * Full account numbers exist only in this screen's memory while typed; after the
 * simulated verification only the masked number and last four digits are kept.
 */
export function BankAccountScreen() {
  const { state, actions } = useApplication()
  const { bank, personal } = state
  const [accountNumber, setAccountNumber] = useState('')
  const [confirmNumber, setConfirmNumber] = useState('')
  const [accountFocused, setAccountFocused] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [attempted, setAttempted] = useState(false)
  const [sheet, setSheet] = useState<'bank' | 'help' | null>(null)

  const verified = bank.verification === 'verified'
  const checking = bank.verification === 'checking'
  const failed = bank.verification === 'failed'

  const bankErrors = validateBank(bank, personal.fullName)
  const errors: Partial<Record<FieldKey, string>> = {
    holderName: bankErrors.holderName,
    bankName: bankErrors.bankName,
    account: verified ? undefined : validateAccountNumber(accountNumber),
    confirm: verified
      ? undefined
      : !confirmNumber
        ? 'Re-enter your account number'
        : confirmNumber !== accountNumber
          ? 'Account numbers don’t match'
          : undefined,
    ifsc: validateIfsc(bank.ifsc, bank.bankName),
  }
  const show = (key: FieldKey) => (attempted || touched[key] ? errors[key] : undefined)
  const touch = (key: FieldKey) => setTouched((current) => ({ ...current, [key]: true }))
  const fieldsValid = !errors.holderName && !errors.bankName && !errors.account && !errors.confirm && !errors.ifsc

  /** Any change to verified details means the account has to be checked again. */
  const changeDetail = (patch: Partial<typeof bank>) => {
    if (verified || failed) actions.resetBankVerification()
    actions.updateBank(patch)
  }

  const verify = async (): Promise<boolean> => {
    setAttempted(true)
    if (!fieldsValid) {
      focusFirstError(
        (['holderName', 'bankName', 'account', 'confirm', 'ifsc'] as FieldKey[]).filter((key) => errors[key]).map((key) => `bank-${key}`),
      )
      return false
    }
    const result = await actions.checkBankAccount({
      holderName: bank.holderName.trim(),
      bankName: bank.bankName,
      accountNumber,
      ifsc: bank.ifsc,
    })
    if (result.ok) {
      setAccountNumber('')
      setConfirmNumber('')
    }
    return result.ok
  }

  const onContinue = async () => {
    if (checking) return
    if (verified && !bankErrors.holderName && !bankErrors.bankName) return actions.goNext()
    if (await verify()) actions.goNext()
  }

  const startOverAccount = () => {
    actions.resetBankVerification()
    setAccountNumber('')
    setConfirmNumber('')
    setTouched({})
    setAttempted(false)
    window.setTimeout(() => document.getElementById('bank-account')?.focus(), 50)
  }

  const accountDisplay = accountFocused || accountNumber.length < 5 ? accountNumber : maskAccount(accountNumber)

  return (
    <ScreenLayout
      nav={
        <PageNav
          title="Bank account details"
          onBack={actions.goBack}
          backLabel={state.returnTo ? 'Back to review' : 'Back to KYC and documents'}
          right="help"
          onRight={() => setSheet('help')}
        />
      }
      step={5}
      contentClassName="gap-6 pt-6 pb-6"
      footer={
        <StepFooter
          onContinue={() => void onContinue()}
          loading={checking}
          loadingLabel="Verifying account…"
          label={verified ? 'Continue' : 'Verify & continue'}
        />
      }
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <h1 className="text-heading-page text-ink">Bank account details</h1>
          <InfoTip topic="your bank account">{WHY_BANK}</InfoTip>
        </div>
        <p className="text-[13px] leading-[17px] text-muted">Add your bank account to receive the loan amount, if approved.</p>
      </div>

      <div className="flex flex-col gap-3 p-1">
        <TextField
          id="bank-holderName"
          label="Account holder name"
          required
          height={32}
          value={bank.holderName}
          disabled={checking}
          onValueChange={(holderName) => changeDetail({ holderName })}
          onBlur={() => touch('holderName')}
          autoComplete="name"
          error={show('holderName')}
        />
        <div className="flex gap-3">
          <PickerField
            id="bank-bankName"
            label="Bank name"
            required
            height={32}
            value={bank.bankName}
            placeholder="Select bank"
            onOpen={() => !checking && setSheet('bank')}
            error={show('bankName')}
          />
          {verified ? (
            <ReadOnlyBox id="bank-account" label="Account number" value={bank.accountMasked} />
          ) : (
            <TextField
              id="bank-account"
              label="Account number"
              required
              height={32}
              inputMode="numeric"
              autoComplete="off"
              value={accountDisplay}
              disabled={checking}
              onFocus={() => setAccountFocused(true)}
              onBlur={() => {
                setAccountFocused(false)
                touch('account')
              }}
              onValueChange={(value) => {
                if (!accountFocused) return
                setAccountNumber(value.replace(/\D/g, '').slice(0, 18))
                if (failed) actions.resetBankVerification()
              }}
              placeholder="9 to 18 digits"
              error={show('account')}
            />
          )}
        </div>
        <div className="flex gap-3">
          {verified ? (
            <ReadOnlyBox id="bank-confirm" label="Confirm account number" value={bank.accountMasked} />
          ) : (
            <TextField
              id="bank-confirm"
              label="Confirm account number"
              required
              height={32}
              inputMode="numeric"
              autoComplete="off"
              value={confirmNumber}
              disabled={checking}
              onPaste={(event) => event.preventDefault()}
              onValueChange={(value) => {
                setConfirmNumber(value.replace(/\D/g, '').slice(0, 18))
                if (failed) actions.resetBankVerification()
              }}
              onBlur={() => touch('confirm')}
              placeholder="Re-enter to confirm"
              trailing={confirmNumber && !errors.confirm && !errors.account ? <CheckMarker label="Account numbers match" /> : undefined}
              error={show('confirm')}
            />
          )}
          <TextField
            id="bank-ifsc"
            label="IFSC code"
            required
            height={32}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={bank.ifsc}
            disabled={checking}
            onValueChange={(value) => changeDetail({ ifsc: value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11) })}
            onBlur={() => touch('ifsc')}
            placeholder="e.g. HDFC0001324"
            trailing={bank.ifsc && !errors.ifsc ? <CheckMarker label="IFSC looks right" /> : undefined}
            error={show('ifsc')}
          />
        </div>
      </div>

      {verified && (
        <div role="status" className="-mt-3 flex animate-fade-in items-start gap-3 rounded-12 bg-lime-tint p-3">
          <span aria-hidden className="text-[17px] font-bold leading-[22px] text-ink">
            ✓
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[12px] font-bold leading-[15px] text-ink">Account verified</p>
            <p className="text-[10px] leading-[13px] text-muted">
              Your bank account details look good. {bank.verifiedAt && `Checked ${formatTimestamp(bank.verifiedAt)} (simulated).`}
            </p>
          </div>
          <button
            type="button"
            onClick={startOverAccount}
            className="shrink-0 rounded-[4px] text-[11px] font-semibold leading-[14px] text-accent underline underline-offset-2"
          >
            Change
          </button>
        </div>
      )}

      {failed && (
        <div role="alert" className="-mt-3 flex animate-fade-in items-start gap-3 rounded-12 bg-danger/[0.07] p-3">
          <OctagonAlert className="mt-[2px] size-[18px] shrink-0 text-danger" strokeWidth={2.2} aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[12px] font-bold leading-[15px] text-danger">Account verification failed</p>
            <p className="text-[10px] leading-[13px] text-muted">
              {bank.failureReason} Correct the details above, then tap “Verify & continue”.
            </p>
          </div>
        </div>
      )}

      {!verified && !failed && (
        <button
          type="button"
          onClick={() => void verify()}
          disabled={checking}
          className="-mt-3 flex h-[42px] w-full items-center justify-center rounded-full border-[1.5px] border-lavender text-[12px] font-semibold leading-[15px] text-ink transition-colors enabled:hover:bg-lavender/40 disabled:text-muted"
        >
          {checking ? 'Verifying account…' : 'Verify account'}
        </button>
      )}

      <section aria-labelledby="bank-important" className="flex items-start gap-3 rounded-16 bg-lavender-wash p-3">
        <Sprite crop={sprites.bankShield} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 id="bank-important" className="text-[13px] font-bold leading-[17px] text-ink">
            Important
          </h2>
          <ul className="flex flex-col text-[10px] leading-[13px] text-muted">
            <li className="flex gap-2">
              <span aria-hidden>•</span>The bank account should be in your name.
            </li>
            <li className="flex gap-2">
              <span aria-hidden>•</span>Please ensure the details are correct to avoid delays in disbursement.
            </li>
          </ul>
        </div>
      </section>

      <OptionSheet
        open={sheet === 'bank'}
        onClose={() => setSheet(null)}
        title="Bank name"
        options={BANKS.map((item) => item.name)}
        value={bank.bankName}
        onSelect={(bankName) => {
          changeDetail({ bankName })
          touch('bankName')
        }}
        searchable
        searchPlaceholder="Search banks"
      />
      <HelpSheet open={sheet === 'help'} onClose={() => setSheet(null)} title="About your bank account">
        <p>{WHY_BANK}</p>
        <p>The account must be in your own name. Your IFSC is printed on your cheque book and passbook, and in your banking app.</p>
        <PrototypeNote>
          Verification is simulated — no bank is contacted. An account number ending in 0000 fails, so you can see the retry
          path. Only the last four digits are saved.
        </PrototypeNote>
      </HelpSheet>
    </ScreenLayout>
  )
}

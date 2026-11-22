/**
 * SIMULATED EXTERNAL SERVICES.
 *
 * Nothing in this file contacts a real system — no PAN/KYC provider, no bank,
 * no credit bureau, no lender and no SMS gateway. Each function only waits for
 * a realistic moment and returns a canned result, so the prototype can show
 * loading, success and failure states. Swap each one for the real integration
 * (KYC provider, penny-drop bank verification, lender APIs) in production.
 */

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

/** Fictional application reference used for the walkthrough. */
export const DEMO_REFERENCE_ID = 'QSL25004782'

/** Test values the presenter can use to show failure states. */
export const DEMO_TEST_DATA = {
  pan: 'ABCDE1234F',
  failingPan: 'ABCDE0000F',
  accountNumber: '501004737829',
  failingAccountSuffix: '0000',
  ifsc: 'HDFC0001324',
} as const

export interface CheckResult {
  ok: boolean
  reason?: string
}

/** Simulated PAN check: any well-formed PAN passes, except ones containing "0000". */
export async function verifyPan(pan: string): Promise<CheckResult> {
  await wait(1100)
  if (pan.includes('0000')) {
    return { ok: false, reason: 'We couldn’t verify this PAN. Check the number and try again.' }
  }
  return { ok: true }
}

/**
 * Simulated bank account check (in production: a penny-drop / name-match service).
 * Account numbers ending in 0000 fail, so the retry path can be demonstrated.
 */
export async function verifyBankAccount(accountNumber: string): Promise<CheckResult> {
  await wait(1500)
  if (accountNumber.endsWith(DEMO_TEST_DATA.failingAccountSuffix)) {
    return {
      ok: false,
      reason: 'We couldn’t verify this account. Check the account number and IFSC, then try again.',
    }
  }
  return { ok: true }
}

/** Simulated submission to the lending partner. */
export async function submitApplication(): Promise<{ referenceId: string }> {
  await wait(1300)
  return { referenceId: DEMO_REFERENCE_ID }
}

/** Simulated status refresh — the status itself is driven by the presenter controls. */
export async function refreshApplicationStatus(): Promise<void> {
  await wait(1100)
}

/** Fictional disbursement reference, e.g. "QSLDSB2611224782". */
export function demoDisbursementReference(at: Date): string {
  const stamp = `${String(at.getFullYear()).slice(2)}${String(at.getMonth() + 1).padStart(2, '0')}${String(at.getDate()).padStart(2, '0')}`
  return `QSLDSB${stamp}${DEMO_REFERENCE_ID.slice(-4)}`
}

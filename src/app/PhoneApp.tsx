import { useState, type ComponentType } from 'react'
import { AppHeader } from '../components/AppHeader'
import { InfoSheet, PrototypeNote, RestartSheet } from '../components/AppSheets'
import { HomeIndicator, StatusBar } from '../components/StatusBar'
import { useApplication } from '../state/ApplicationProvider'
import type { ScreenId } from '../state/types'
import { ApplicationSubmittedScreen } from '../screens/ApplicationSubmitted'
import { BankAccountScreen } from '../screens/BankAccount'
import { IncomeDetailsScreen } from '../screens/IncomeDetails'
import { KycDocumentsScreen } from '../screens/KycDocuments'
import { LoanDetailsScreen } from '../screens/LoanDetails'
import { ReviewConsentScreen } from '../screens/ReviewConsent'
import { StartApplicationScreen } from '../screens/StartApplication'
import { TrackApplicationScreen } from '../screens/TrackApplication'
import { YourDetailsScreen } from '../screens/YourDetails'
import { ToastViewport } from '../ui/Toasts'
import { useUi } from '../ui/UiProvider'

const SCREENS: Record<ScreenId, ComponentType> = {
  start: StartApplicationScreen,
  loan: LoanDetailsScreen,
  details: YourDetailsScreen,
  income: IncomeDetailsScreen,
  kyc: KycDocumentsScreen,
  bank: BankAccountScreen,
  review: ReviewConsentScreen,
  submitted: ApplicationSubmittedScreen,
  track: TrackApplicationScreen,
}

/** The InstingLoan Quick Student Loan app as it renders inside the phone screen. */
export function PhoneApp({ chrome }: { chrome: boolean }) {
  const { state } = useApplication()
  const { setOverlayRoot } = useUi()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const Screen = SCREENS[state.screen]

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-card text-ink">
      {chrome && <StatusBar />}
      <AppHeader onNotifications={() => setNotificationsOpen(true)} />
      <main key={state.screen} className="flex min-h-0 flex-1 flex-col">
        <Screen />
      </main>
      {chrome && <HomeIndicator />}

      <div ref={setOverlayRoot} className="pointer-events-none absolute inset-0 z-50" />
      <ToastViewport top={chrome ? 58 : 8} />

      <InfoSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} title="Notifications">
        <p className="text-[14px] font-semibold leading-5 text-ink">You’re all caught up.</p>
        <p>
          {state.submission
            ? `Updates about application ${state.submission.referenceId} appear on the Track application screen.`
            : 'Updates about your application will show up here once you submit it.'}
        </p>
        <PrototypeNote>No real notifications, SMS or emails are sent.</PrototypeNote>
      </InfoSheet>
      <RestartSheet />
    </div>
  )
}

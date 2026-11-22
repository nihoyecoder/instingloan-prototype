import { PhoneApp } from './app/PhoneApp'
import { Presentation } from './app/Presentation'
import { ApplicationProvider } from './state/ApplicationProvider'
import { UiProvider } from './ui/UiProvider'

export default function App() {
  return (
    <UiProvider>
      <ApplicationProvider>
        <Presentation render={(chrome) => <PhoneApp chrome={chrome} />} />
      </ApplicationProvider>
    </UiProvider>
  )
}

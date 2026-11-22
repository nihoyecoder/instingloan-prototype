import { useState } from 'react'
import { sprites, type SpriteCrop } from '../assets/figma'
import { ScreenLayout } from '../components/ScreenLayout'
import { useApplication } from '../state/ApplicationProvider'
import { hasDraft } from '../state/selectors'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Sprite } from '../ui/Sprite'
import { useUi } from '../ui/UiProvider'

const CHECKLIST: Array<{ crop: SpriteCrop; title: string; lines: [string, string] }> = [
  { crop: sprites.startPersonal, title: 'Personal details', lines: ['Your basic information like name,', 'contact and address'] },
  { crop: sprites.startKyc, title: 'PAN and KYC', lines: ['Your PAN details and identity proof', 'for verification'] },
  { crop: sprites.startBank, title: 'Bank account', lines: ['Your active bank account details for', 'loan disbursement'] },
]

/** 01 – Start your application (Figma 45:124). */
export function StartApplicationScreen() {
  const { state, actions } = useApplication()
  const { setRestartPromptOpen } = useUi()
  const [choiceOpen, setChoiceOpen] = useState(false)
  const draft = hasDraft(state)
  const submitted = Boolean(state.submission)

  const onPrimary = () => {
    if (submitted) return actions.navigate('track', 'forward')
    if (draft) return setChoiceOpen(true)
    actions.startApplication()
  }

  const footer = (
    <div className="flex w-full shrink-0 flex-col gap-3 px-4 pt-3 pb-4">
      <Button onClick={onPrimary}>{submitted ? 'Track your application' : 'Start application'}</Button>
      {(draft || submitted) && (
        <p className="text-center text-[13px] leading-[17px] text-muted">
          {submitted ? 'Want to apply again? ' : 'Already started? '}
          <button
            type="button"
            onClick={submitted ? () => setRestartPromptOpen(true) : actions.resumeApplication}
            className="rounded-[4px] font-bold text-muted underline underline-offset-2 transition-colors hover:text-ink"
          >
            {submitted ? 'Start a new application' : 'Resume application'}
          </button>
        </p>
      )}
    </div>
  )

  return (
    <ScreenLayout contentClassName="gap-4 pt-2 pb-4" footer={footer}>
      <div className="flex h-[204px] w-full shrink-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 className="text-[29px] font-bold leading-[37px] text-ink">
            Start your{' '}
            <br />
            application
          </h1>
          <p className="text-[14px] leading-[18px] text-muted">
            A simple, guided process{' '}
            <br />
            to get a quick student loan.
          </p>
        </div>
        <Sprite crop={sprites.startHero} />
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-[25px] font-bold leading-8 text-ink">Before you apply</h2>
        <p className="text-[13px] leading-[17px] text-muted">Keep these ready for a quicker, smoother application.</p>
      </div>

      <ul className="flex flex-col gap-2">
        {CHECKLIST.map((item) => (
          <li key={item.title} className="flex items-center gap-4 rounded-24 border-[0.7px] border-line bg-card p-3">
            <Sprite crop={item.crop} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[16px] font-bold leading-5 text-ink">{item.title}</p>
              <p className="text-[12px] leading-[15px] text-muted">
                {item.lines[0]}{' '}
                <br />
                {item.lines[1]}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <BottomSheet
        open={choiceOpen}
        onClose={() => setChoiceOpen(false)}
        title="You have a saved application"
        description="Pick up where you left off, or start again with a fresh application."
        footer={
          <>
            <Button
              onClick={() => {
                setChoiceOpen(false)
                actions.resumeApplication()
              }}
            >
              Resume application
            </Button>
            <Button
              tone="outline"
              arrow={false}
              onClick={() => {
                setChoiceOpen(false)
                actions.startOver()
              }}
            >
              Start a new application
            </Button>
          </>
        }
      >
        <p className="pb-1 text-[12px] leading-[18px] text-muted">
          Starting again clears the saved draft and any documents you added.
        </p>
      </BottomSheet>
    </ScreenLayout>
  )
}

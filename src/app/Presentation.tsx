import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useUi } from '../ui/UiProvider'
import { DemoPanel } from './DemoPanel'

/** Figma frame size (iPhone 18 Pro, 402 × 874 pt). */
export const SCREEN_WIDTH = 402
export const SCREEN_HEIGHT = 874

const FRAME = 4 // metal band
const BEZEL = 13 // black glass border
const INSET = FRAME + BEZEL
const SCREEN_RADIUS = 60
const DEVICE_WIDTH = SCREEN_WIDTH + INSET * 2
const DEVICE_HEIGHT = SCREEN_HEIGHT + INSET * 2
const STAGE_MARGIN = 18
const CAPTION_SPACE = 44

interface PresentationProps {
  /** Renders the app; `chrome` is false on a real phone, where the OS provides its own status bar. */
  render: (chrome: boolean) => ReactNode
}

export function Presentation({ render }: PresentationProps) {
  const isPhoneViewport = useMediaQuery('(max-width: 540px)')
  return isPhoneViewport ? <FullScreenStage>{render(false)}</FullScreenStage> : <DeviceStage>{render(true)}</DeviceStage>
}

function useFitScale(): number {
  const compute = () =>
    Math.min(
      1,
      (window.innerHeight - STAGE_MARGIN * 2 - CAPTION_SPACE) / DEVICE_HEIGHT,
      (window.innerWidth - STAGE_MARGIN * 2) / DEVICE_WIDTH,
    )
  const [scale, setScale] = useState(compute)
  useEffect(() => {
    const onResize = () => setScale(compute())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return Math.max(scale, 0.45)
}

/** Desktop presentation: a centred iPhone 18 Pro scaled to fit the window. */
function DeviceStage({ children }: { children: ReactNode }) {
  const scale = useFitScale()
  const { setRestartPromptOpen } = useUi()

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(120%_85%_at_50%_0%,#f5f4f0_0%,#ebeae5_55%,#e2e1db_100%)] py-[18px]">
      <div style={{ width: DEVICE_WIDTH * scale, height: DEVICE_HEIGHT * scale }} className="relative shrink-0">
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: DEVICE_WIDTH, height: DEVICE_HEIGHT, transform: `scale(${scale})` }}
        >
          <PhoneHardware>{children}</PhoneHardware>
        </div>
      </div>
      <p className="mt-4 flex items-center gap-2 text-[12.5px] leading-5 text-[#777b73]">
        <span>InstingLoan · Interactive prototype · All data and statuses are simulated</span>
        <span aria-hidden>·</span>
        <button
          type="button"
          onClick={() => setRestartPromptOpen(true)}
          className="rounded-[4px] font-semibold text-[#4f534c] underline decoration-[#c7cbbf] underline-offset-[3px] transition-colors hover:text-ink hover:decoration-lime"
        >
          Restart demo
        </button>
      </p>
      <DemoPanel />
    </div>
  )
}

const sideButton = 'absolute w-[4px] bg-[linear-gradient(90deg,#8e9096,#d9dade_55%,#a4a6ab)]'

function PhoneHardware({ children }: { children: ReactNode }) {
  return (
    <div className="relative" style={{ width: DEVICE_WIDTH, height: DEVICE_HEIGHT }}>
      {/* Action button, volume up / down */}
      <span aria-hidden className={`${sideButton} left-[-3px] top-[166px] h-[34px] rounded-l-[3px]`} />
      <span aria-hidden className={`${sideButton} left-[-3px] top-[222px] h-[62px] rounded-l-[3px]`} />
      <span aria-hidden className={`${sideButton} left-[-3px] top-[298px] h-[62px] rounded-l-[3px]`} />
      {/* Side button and Camera Control */}
      <span aria-hidden className={`${sideButton} right-[-3px] top-[250px] h-[98px] rounded-r-[3px]`} />
      <span
        aria-hidden
        className="absolute right-[-2px] top-[470px] h-[70px] w-[3px] rounded-r-[2px] bg-[linear-gradient(90deg,#6f7176,#b9bbc0)]"
      />

      {/* Titanium frame */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[77px] bg-[linear-gradient(140deg,#e3e4e7_0%,#a9abb0_18%,#f4f5f6_42%,#9c9ea3_68%,#d5d6da_100%)] shadow-[0_50px_90px_-30px_rgba(24,26,21,0.45),0_24px_40px_-20px_rgba(24,26,21,0.35),inset_0_0_0_1px_rgba(255,255,255,0.45)]"
      />
      {/* Black bezel */}
      <div aria-hidden className="absolute inset-[4px] rounded-[73px] bg-[#0b0c0b] shadow-[inset_0_0_0_1.5px_rgba(0,0,0,0.6)]" />
      {/* Screen */}
      <div
        data-phone-screen
        className="absolute overflow-hidden bg-card [transform:translateZ(0)]"
        style={{ left: INSET, top: INSET, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, borderRadius: SCREEN_RADIUS }}
      >
        {children}
      </div>
    </div>
  )
}

/** Real phone viewport: the app fills the screen, no device frame. */
function FullScreenStage({ children }: { children: ReactNode }) {
  const areaRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  useLayoutEffect(() => {
    const element = areaRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const scale = size.width / SCREEN_WIDTH
  return (
    <div
      className="fixed inset-0 bg-card"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div ref={areaRef} className="relative h-full w-full overflow-hidden">
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: SCREEN_WIDTH, height: size.height / scale, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

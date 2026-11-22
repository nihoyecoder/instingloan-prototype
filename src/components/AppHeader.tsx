import { icons, sprites } from '../assets/figma'
import { Icon, Sprite } from '../ui/Sprite'

/** "InstingLoan app header" (7:7) — 44px. */
export function AppHeader({ onNotifications }: { onNotifications: () => void }) {
  return (
    <header className="h-11 w-full shrink-0">
      <div className="relative h-11 w-full">
        <Sprite crop={sprites.brandMark} className="absolute left-6 top-[6px]" />
        <p className="absolute left-[55px] top-[10px] w-[180px] text-[17px] font-bold leading-[22px] text-ink">
          InstingLoan
        </p>
        <button
          type="button"
          onClick={onNotifications}
          aria-label="Notifications"
          className="absolute left-[346.5px] top-[-2.5px] flex size-11 items-center justify-center rounded-full transition-colors hover:bg-canvas"
        >
          <Icon icon={icons.bell} />
        </button>
      </div>
    </header>
  )
}

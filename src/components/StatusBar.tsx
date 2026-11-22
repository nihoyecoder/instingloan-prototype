import { sprites } from '../assets/figma'
import { Sprite } from '../ui/Sprite'

/** "Status bar · Dynamic Island" (54px) from the Figma frames. */
export function StatusBar() {
  return (
    <div className="relative h-[54px] w-full shrink-0" aria-hidden>
      <p className="absolute left-[42px] top-[19px] w-[55px] text-[14px] font-semibold leading-[18px] text-ink">9:41</p>
      <div className="absolute left-[145px] top-[10px] h-[31px] w-[112px] rounded-full bg-dark" />
      <Sprite crop={sprites.statusIcons} className="absolute left-[307px] top-[20px]" />
    </div>
  )
}

/** "Home indicator safe area" (30px). */
export function HomeIndicator() {
  return (
    // Stays above sheets, as on iOS.
    <div className="relative z-[70] h-[30px] w-full shrink-0" aria-hidden>
      <div className="absolute left-[129px] top-4 h-[5px] w-36 rounded-full bg-dark" />
    </div>
  )
}

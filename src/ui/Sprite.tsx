import type { CSSProperties } from 'react'
import type { IconAsset, SpriteCrop } from '../assets/figma'
import { cn } from '../lib/cn'

interface SpriteProps {
  crop: SpriteCrop
  className?: string
  style?: CSSProperties
  /** Accessible name; omit for decorative artwork. */
  label?: string
}

/** Renders a Figma illustration crop with the exact framing used in the design file. */
export function Sprite({ crop, className, style, label }: SpriteProps) {
  // The crop box must be a positioned element; only add `relative` when the caller hasn't positioned it.
  const positioned = /\b(absolute|fixed|sticky)\b/.test(className ?? '')
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('block shrink-0 overflow-hidden', !positioned && 'relative', className)}
      style={{ width: crop.width, height: crop.height, ...style }}
    >
      <img
        src={crop.src}
        alt=""
        draggable={false}
        decoding="async"
        className="pointer-events-none absolute max-w-none select-none"
        style={{
          width: `${crop.imageWidth}%`,
          height: `${crop.imageHeight}%`,
          left: `${crop.left}%`,
          top: `${crop.top}%`,
        }}
      />
    </span>
  )
}

interface IconProps {
  icon: IconAsset
  className?: string
  style?: CSSProperties
}

/** A Figma-exported SVG icon at its intrinsic size. */
export function Icon({ icon, className, style }: IconProps) {
  return (
    <img
      src={icon.src}
      width={icon.width}
      height={icon.height}
      alt=""
      aria-hidden
      draggable={false}
      className={cn('block max-w-none shrink-0 select-none', className)}
      style={{ width: icon.width, height: icon.height, ...style }}
    />
  )
}

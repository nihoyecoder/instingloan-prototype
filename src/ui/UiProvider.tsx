import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

export type ToastTone = 'default' | 'success' | 'error'

export interface ToastMessage {
  id: number
  message: string
  tone: ToastTone
}

interface UiContextValue {
  /** Element inside the phone screen that sheets, popovers and toasts render into. */
  overlayRoot: HTMLElement | null
  setOverlayRoot: (element: HTMLElement | null) => void
  toasts: ToastMessage[]
  toast: (message: string, tone?: ToastTone) => void
  dismissToast: (id: number) => void
  /** Restart confirmation — opened from the in-app help sheet or the presenter link. */
  restartPromptOpen: boolean
  setRestartPromptOpen: (open: boolean) => void
  /** While any sheet is open the screen behind it doesn't scroll. */
  scrollLocked: boolean
  lockScroll: () => () => void
}

const UiContext = createContext<UiContextValue | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [restartPromptOpen, setRestartPromptOpen] = useState(false)
  const [locks, setLocks] = useState(0)
  const nextId = useRef(1)

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, tone: ToastTone = 'default') => {
      const id = nextId.current++
      // One toast at a time keeps the small screen calm.
      setToasts([{ id, message, tone }])
      window.setTimeout(() => dismissToast(id), 2800)
    },
    [dismissToast],
  )

  const lockScroll = useCallback(() => {
    setLocks((count) => count + 1)
    let released = false
    return () => {
      if (released) return
      released = true
      setLocks((count) => Math.max(0, count - 1))
    }
  }, [])

  const value = useMemo(
    () => ({
      overlayRoot,
      setOverlayRoot,
      toasts,
      toast,
      dismissToast,
      restartPromptOpen,
      setRestartPromptOpen,
      scrollLocked: locks > 0,
      lockScroll,
    }),
    [overlayRoot, toasts, toast, dismissToast, restartPromptOpen, locks, lockScroll],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi(): UiContextValue {
  const context = useContext(UiContext)
  if (!context) throw new Error('useUi must be used inside UiProvider')
  return context
}

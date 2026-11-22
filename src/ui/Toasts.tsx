import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { useUi } from './UiProvider'

/** Transient confirmation banners, shown just below the status bar inside the phone. */
export function ToastViewport({ top }: { top: number }) {
  const { toasts, dismissToast } = useUi()
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 z-[60] flex flex-col items-center px-6"
      style={{ top }}
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className="pointer-events-auto flex max-w-[354px] animate-toast-in items-center gap-2 rounded-full bg-dark py-[10px] pl-3 pr-4 text-left shadow-[0_10px_30px_rgba(5,6,5,0.22)]"
        >
          {toast.tone === 'success' && <CircleCheck className="size-[18px] shrink-0 text-lime" strokeWidth={2.4} aria-hidden />}
          {toast.tone === 'error' && <CircleAlert className="size-[18px] shrink-0 text-[#ff9d8f]" strokeWidth={2.4} aria-hidden />}
          {toast.tone === 'default' && <Info className="size-[18px] shrink-0 text-white/80" strokeWidth={2.4} aria-hidden />}
          <span className="text-[12.5px] font-semibold leading-4 text-white">{toast.message}</span>
        </button>
      ))}
    </div>
  )
}

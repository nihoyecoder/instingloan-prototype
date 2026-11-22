import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Eye, LoaderCircle, Repeat2, RotateCw, Trash2, X } from 'lucide-react'
import { icons, type SpriteCrop } from '../assets/figma'
import { POLICY } from '../config/policy'
import { cn } from '../lib/cn'
import { formatBytes } from '../lib/format'
import { useApplication } from '../state/ApplicationProvider'
import { fileTypeLabel } from '../state/selectors'
import type { DocId } from '../state/types'
import { BottomSheet } from '../ui/BottomSheet'
import { FieldError } from '../ui/Field'
import { InfoTip } from '../ui/InfoTip'
import { PrototypeNote } from '../ui/PrototypeNote'
import { Icon, Sprite } from '../ui/Sprite'
import { useUi } from '../ui/UiProvider'

const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

/** White "Upload" pill with the purple upload glyph (45:591 / 45:522). */
export function UploadPill({
  onClick,
  label = 'Upload',
  ariaLabel,
  compact = false,
}: {
  onClick: () => void
  label?: string
  ariaLabel: string
  /** The income screen uses 4px padding and 11px text. */
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-12 border-[0.7px] border-line bg-card text-accent transition-colors hover:border-accent/40 hover:bg-lavender-tint',
        compact ? 'p-1 text-[11px] leading-[14px]' : 'p-2 text-[10px] leading-[13px]',
      )}
    >
      <Icon icon={icons.upload} />
      {label}
    </button>
  )
}

/** File tile from "Aadhaar_Card.pdf uploaded file" (49:390). */
function FileTile() {
  return (
    <span aria-hidden className="relative h-[26px] w-[22px] shrink-0 overflow-hidden rounded-[5.5px] bg-file-tile">
      <Icon icon={icons.file} className="absolute left-[1.83px] top-[4.13px]" />
    </span>
  )
}

function PreviewSheet({ id, title, open, onClose }: { id: DocId; title: string; open: boolean; onClose: () => void }) {
  const { actions, state } = useApplication()
  const entry = state.documents[id]
  const file = open ? actions.getDocumentFile(id) : null
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
      setUrl(null)
    }
  }, [file])

  const isImage = file?.type.startsWith('image/')
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      description={entry.file ? `${entry.file.name} · ${formatBytes(entry.file.size)}` : undefined}
    >
      <div className="flex flex-col gap-3 pb-2">
        {file && url ? (
          isImage ? (
            <img src={url} alt={`Preview of ${entry.file?.name}`} className="max-h-[360px] w-full rounded-12 border border-line object-contain" />
          ) : (
            <iframe title={`Preview of ${entry.file?.name}`} src={url} className="h-[360px] w-full rounded-12 border border-line" />
          )
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-12 border border-dashed border-line bg-canvas px-6 text-center">
            <Icon icon={icons.file} />
            <p className="text-[12px] leading-4 text-muted">
              Preview isn’t available. Files aren’t stored once you refresh or leave the page — only the file name is kept.
            </p>
          </div>
        )}
        <PrototypeNote>Files stay in this browser tab. Nothing is sent anywhere.</PrototypeNote>
      </div>
    </BottomSheet>
  )
}

interface DocumentCardProps {
  id: DocId
  icon: SpriteCrop
  title: string
  required?: boolean
  helper: ReactNode
  /** Why the document is needed — shown on demand. */
  why: ReactNode
  /** Show the "missing" error once the student has tried to continue. */
  highlight?: boolean
  /** "kyc": white card (45:552); "income": lavender card on the income screen (45:517). */
  variant?: 'kyc' | 'income'
}

/**
 * One document: upload → progress → uploaded, with retry on failure, replace and
 * remove from the "···" menu, and type/size validation. Contents stay in memory.
 */
export function DocumentCard({ id, icon, title, required = false, helper, why, highlight = false, variant = 'kyc' }: DocumentCardProps) {
  const { state, actions } = useApplication()
  const { toast } = useUi()
  const entry = state.documents[id]
  const inputRef = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const income = variant === 'income'
  const missing = highlight && required && entry.status !== 'uploaded' && entry.status !== 'uploading'
  const chooseFile = () => inputRef.current?.click()
  const accept = (file: File | undefined) => {
    if (!file) return
    actions.uploadDocument(id, file)
  }
  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    setDragOver(false)
    accept(event.dataTransfer.files?.[0])
  }

  const retry = () => {
    if (!actions.retryUpload(id)) {
      toast('Choose the file again to retry.')
      chooseFile()
    }
  }

  const showPill = entry.status === 'empty' || (entry.status === 'failed' && entry.failure === 'invalid')
  const fileName = entry.file?.name ?? ''

  return (
    <section
      id={`doc-${id}`}
      tabIndex={-1}
      aria-labelledby={`doc-${id}-title`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={cn(
        'flex w-full items-start outline-none transition-[border-color,box-shadow]',
        income ? 'gap-3 rounded-16 bg-lavender-tint p-3' : 'gap-3 rounded-12 border-[0.7px] bg-card p-2',
        !income && (missing ? 'border-danger' : 'border-line'),
        income && missing && 'shadow-[inset_0_0_0_1px_var(--color-danger)]',
        dragOver && 'shadow-[inset_0_0_0_2px_var(--color-lime)]',
      )}
    >
      <Sprite crop={icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <h3
                id={`doc-${id}-title`}
                className={cn('font-bold text-ink', income ? 'text-[11px] leading-[14px]' : 'text-[12px] leading-[15px]')}
              >
                {title}
                {required && ' *'}
              </h3>
              <InfoTip topic={title}>{why}</InfoTip>
            </div>
            <div className={cn('text-muted', income || !required ? 'text-[9px] leading-[12px]' : 'text-[10px] leading-[13px]')}>
              {helper}
            </div>
          </div>
          {showPill && (
            <UploadPill
              onClick={chooseFile}
              compact={income}
              label={entry.status === 'failed' ? 'Choose again' : 'Upload'}
              ariaLabel={`Upload ${title}`}
            />
          )}
        </div>

        {entry.status === 'failed' && entry.failure === 'invalid' && (
          <p role="alert" className="text-[10px] font-medium leading-[13px] text-danger">
            {fileName ? `“${fileName}” — ` : ''}
            {entry.error}
          </p>
        )}

        {entry.status === 'uploading' && entry.file && (
          <div className="flex w-full items-center gap-2 rounded-12 border-[0.7px] border-line bg-card p-2" aria-live="polite">
            <FileTile />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-[10px] leading-[13px] text-ink">{fileName}</p>
              <span
                className="h-1 w-full overflow-hidden rounded-full bg-canvas"
                role="progressbar"
                aria-label={`Uploading ${title}`}
                aria-valuenow={entry.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span className="block h-full rounded-full bg-lime transition-[width] duration-150" style={{ width: `${entry.progress}%` }} />
              </span>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[9px] leading-[12px] text-muted">
              <LoaderCircle className="size-3 animate-spin" strokeWidth={2.4} aria-hidden />
              {entry.progress}%
            </span>
            <button
              type="button"
              onClick={() => actions.removeDocument(id)}
              aria-label={`Cancel uploading ${title}`}
              className="-m-1 flex size-6 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"
            >
              <X className="size-3.5" strokeWidth={2.4} aria-hidden />
            </button>
          </div>
        )}

        {entry.status === 'failed' && entry.failure === 'network' && entry.file && (
          <div className="flex w-full items-center gap-2 rounded-12 border-[0.7px] border-danger/50 bg-card p-2">
            <FileTile />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-[10px] leading-[13px] text-ink">{fileName}</p>
              <p className="text-[9px] font-medium leading-[12px] text-danger">{entry.error}</p>
            </div>
            <button
              type="button"
              onClick={retry}
              aria-label={`Retry uploading ${title}`}
              className="flex shrink-0 items-center gap-1 rounded-12 border-[0.7px] border-line bg-card p-1.5 text-[10px] font-semibold leading-[13px] text-ink hover:bg-canvas"
            >
              <RotateCw className="size-3 text-danger" strokeWidth={2.4} aria-hidden />
              Retry
            </button>
            <button
              type="button"
              onClick={() => actions.removeDocument(id)}
              aria-label={`Remove ${title}`}
              className="-m-1 flex size-6 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"
            >
              <X className="size-3.5" strokeWidth={2.4} aria-hidden />
            </button>
          </div>
        )}

        {entry.status === 'uploaded' && entry.file && (
          <div className="flex w-full animate-fade-in items-center gap-2 rounded-12 border-[0.7px] border-line bg-card p-2">
            <FileTile />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-[10px] leading-[13px] text-ink">{fileName}</p>
              <p className="text-[9px] leading-[12px] text-muted">
                {formatBytes(entry.file.size)} · {fileTypeLabel(entry.file)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-lime-badge p-1 text-[8px] font-bold leading-[10px] text-ink">✓ Uploaded</span>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={`Options for ${title}`}
              aria-haspopup="dialog"
              className="-mr-1 flex h-6 w-7 shrink-0 items-center justify-center rounded-full text-[14px] font-bold leading-[18px] text-ink hover:bg-canvas"
            >
              ···
            </button>
          </div>
        )}

        <FieldError id={`doc-${id}-error`}>{missing ? `Upload your ${title.toLowerCase()}` : undefined}</FieldError>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-doc-input={id}
        onChange={(event) => {
          accept(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={title} description={fileName}>
        <div className="flex flex-col pb-1">
          {[
            {
              label: 'Preview',
              icon: <Eye className="size-[18px]" strokeWidth={2} aria-hidden />,
              onSelect: () => setPreviewOpen(true),
              tone: 'text-ink',
            },
            {
              label: 'Replace file',
              icon: <Repeat2 className="size-[18px]" strokeWidth={2} aria-hidden />,
              onSelect: chooseFile,
              tone: 'text-ink',
            },
            {
              label: 'Remove',
              icon: <Trash2 className="size-[18px]" strokeWidth={2} aria-hidden />,
              onSelect: () => {
                actions.removeDocument(id)
                toast(`${title} removed`)
              },
              tone: 'text-danger',
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setMenuOpen(false)
                item.onSelect()
              }}
              className={cn(
                'flex min-h-11 w-full items-center gap-3 rounded-12 px-3 text-left text-[13px] font-semibold leading-5 transition-colors hover:bg-canvas',
                item.tone,
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <p className="px-3 pt-2 text-[11px] leading-4 text-muted">
            {POLICY.documents.accepted}, up to {POLICY.documents.maxFileMb} MB.
          </p>
        </div>
      </BottomSheet>
      <PreviewSheet id={id} title={title} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </section>
  )
}

export function DocumentActionsNote() {
  return (
    <p className="text-[10px] leading-[13px] text-muted">
      {POLICY.documents.accepted}, up to {POLICY.documents.maxFileMb} MB each. You can also drag a file onto a card.
    </p>
  )
}


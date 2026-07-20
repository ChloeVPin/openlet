import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'sheet'

const sizeClass: Record<DialogSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-xl lg:max-w-2xl',
  xl: 'sm:max-w-xl lg:max-w-3xl xl:max-w-4xl',
  sheet: 'sm:max-w-lg',
}

/**
 * Accessible modal / bottom-sheet with focus trap, scroll lock, Escape,
 * backdrop dismiss, and return-focus.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  /** Mobile-first bottom sheet (default). Use false for always-centered. */
  sheetOnMobile = true,
  dismissible = true,
  initialFocusRef,
  className,
  bodyClassName,
  showClose = true,
  role = 'dialog',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: DialogSize
  sheetOnMobile?: boolean
  dismissible?: boolean
  initialFocusRef?: React.RefObject<HTMLElement | null>
  className?: string
  bodyClassName?: string
  showClose?: boolean
  role?: 'dialog' | 'alertdialog'
}) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTarget =
      initialFocusRef?.current ||
      closeRef.current ||
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    requestAnimationFrame(() => focusTarget?.focus())

    return () => {
      document.body.style.overflow = prevOverflow
      previousFocus.current?.focus?.()
    }
  }, [open, initialFocusRef])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null,
      )
      if (nodes.length === 0) {
        e.preventDefault()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement as HTMLElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, dismissible])

  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex justify-center',
        sheetOnMobile ? 'items-end p-0 sm:items-center sm:p-6 lg:p-8' : 'items-center p-4 sm:p-6',
      )}
    >
      <div
        className="absolute inset-0 anim-fade bg-[#303545]/40 backdrop-blur-[1px]"
        onClick={() => dismissible && onClose()}
        aria-hidden
      />

      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'relative flex w-full flex-col overflow-hidden border border-[#edeff4] bg-white anim-scale-in',
          'shadow-[0_16px_48px_rgb(48_53_69/0.18)]  ',
          'max-h-[min(92dvh,720px)]',
          sheetOnMobile
            ? 'rounded-t-3xl sm:rounded-3xl sm:max-h-[min(88dvh,680px)]'
            : 'rounded-3xl max-h-[min(88dvh,640px)]',
          sizeClass[size],
          className,
        )}
        onKeyDown={(e: ReactKeyboardEvent) => e.stopPropagation()}
      >
        {sheetOnMobile ? (
          <div className="flex shrink-0 justify-center pt-2 sm:hidden" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-[#d9dde8]" />
          </div>
        ) : null}

        <div className="flex shrink-0 items-start gap-3 border-b border-[#edeff4] px-4 py-3.5  sm:px-6 sm:py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-bold text-[#303545]  sm:text-xl">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-0.5 text-sm text-[#646f90] sm:mt-1">
                {description}
              </p>
            ) : null}
          </div>
          {showClose ? (
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              disabled={!dismissible}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-[#646f90] hover:bg-[#f6f7fb] hover:text-[#303545]   sm:size-10"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          ) : null}
        </div>

        {children != null && children !== false ? (
          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5',
              bodyClassName,
            )}
          >
            {children}
          </div>
        ) : null}

        {footer ? (
          <div
            className={cn(
              'flex shrink-0 flex-col-reverse gap-2 border-t border-[#edeff4] px-4 py-3.5 ',
              'sm:flex-row sm:justify-end sm:px-6 sm:py-4',
              'pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:pb-4',
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

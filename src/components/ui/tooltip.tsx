import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

type Side = 'top' | 'bottom'

/**
 * Compact custom tooltip for icon-only controls.
 * Shows on hover/focus after a short delay; Esc / blur / leave hides.
 */
export function Tooltip({
  label,
  side = 'bottom',
  children,
  delayMs = 260,
  className,
}: {
  label: string
  side?: Side
  children: ReactNode
  delayMs?: number
  className?: string
}) {
  const tipId = useId()
  const wrapRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const show = () => {
    clearTimer()
    timer.current = setTimeout(() => setOpen(true), delayMs)
  }

  const hide = () => {
    clearTimer()
    setOpen(false)
  }

  const place = useCallback(() => {
    const el = wrapRef.current
    const tip = tipRef.current
    if (!el || !tip) return
    const r = el.getBoundingClientRect()
    const tr = tip.getBoundingClientRect()
    const gap = 7
    let top = side === 'bottom' ? r.bottom + gap : r.top - tr.height - gap
    let left = r.left + r.width / 2 - tr.width / 2
    const pad = 8
    left = Math.max(pad, Math.min(left, window.innerWidth - tr.width - pad))
    top = Math.max(pad, Math.min(top, window.innerHeight - tr.height - pad))
    setCoords({ top, left })
  }, [side])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, place, label])

  useEffect(() => {
    if (!open) return
    const onScroll = () => place()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide()
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, place])

  useEffect(() => () => clearTimer(), [])

  return (
    <span
      ref={wrapRef}
      className={cn('inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {children}
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={tipRef}
              id={tipId}
              role="tooltip"
              className={cn(
                'pointer-events-none fixed z-[300] select-none whitespace-nowrap',
                // 11px / 6px radius / tight pad. dense product chrome
                'rounded-[10px] px-[10px] py-[6px]',
                'bg-[#1a1d2e] text-[11px] font-semibold leading-none tracking-[-0.01em] text-white',
                'shadow-[0_2px_8px_rgb(15_18_34/0.2),0_0_0_1px_rgb(15_18_34/0.08)]',
                '  (0_0_0/0.4)]',
              )}
              style={{
                top: coords.top,
                left: coords.left,
                animation: 'tooltip-in 110ms cubic-bezier(0.16, 1, 0.3, 1) both',
              }}
            >
              {label}
              <span
                aria-hidden
                className={cn(
                  'absolute left-1/2 size-[5px] -translate-x-1/2 rotate-45',
                  'bg-[#1a1d2e] ',
                  side === 'bottom' ? '-top-[2.5px]' : '-bottom-[2.5px]',
                )}
              />
            </div>,
            document.body,
          )
        : null}
    </span>
  )
}

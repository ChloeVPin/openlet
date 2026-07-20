import { useCallback, useRef, useState, useEffect, type ReactNode } from 'react'
import { cn } from '../lib/cn'

const SLIDE_MS = 320
/** Minimum swipe distance (px) to trigger a card change */
const SWIPE_THRESHOLD = 60

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export type CardSliderControls = {
  go: (dir: 1 | -1) => void
  busy: boolean
  canPrev: boolean
  canNext: boolean
  index: number
  count: number
}

/**
 * Horizontal slide between cards. Next/prev animate instead of snapping.
 * Set wrap to loop at ends (hero demos).
 * Supports touch swipe on mobile.
 */
export function CardSlider({
  index,
  count,
  onIndexChange,
  className,
  children,
  controls,
  wrap = false,
  onApiChange,
}: {
  index: number
  count: number
  onIndexChange: (next: number) => void
  className?: string
  children: (i: number) => ReactNode
  controls?: (api: CardSliderControls) => ReactNode
  wrap?: boolean
  onApiChange?: (api: CardSliderControls) => void
}) {
  const [offset, setOffset] = useState(0)
  const [busy, setBusy] = useState(false)
  const [noTransition, setNoTransition] = useState(false)
  const pending = useRef<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleTransitionEnd = useCallback(
    (e?: React.TransitionEvent) => {
      if (e && e.target !== trackRef.current) return
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (pending.current === null) return
      const next = pending.current
      pending.current = null
      setNoTransition(true)
      onIndexChange(next)
      setOffset(0)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setNoTransition(false)
          setBusy(false)
        })
      })
    },
    [onIndexChange],
  )

  const go = useCallback(
    (dir: 1 | -1) => {
      if (busy || count <= 0) return
      let next = index + dir
      if (wrap) {
        next = (next + count) % count
      } else if (next < 0 || next >= count) {
        return
      }
      if (prefersReducedMotion()) {
        onIndexChange(next)
        return
      }
      setBusy(true)
      pending.current = next
      setOffset(dir)

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        handleTransitionEnd()
      }, SLIDE_MS + 50)
    },
    [busy, count, index, onIndexChange, wrap],
  )

  /* ── Touch swipe handlers ── */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return
      const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
      touchStartX.current = null
      if (Math.abs(dx) >= SWIPE_THRESHOLD && !busy) {
        go(dx > 0 ? -1 : 1)
      }
    },
    [busy, go],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (count <= 0) return null

  const prevI = wrap ? (index - 1 + count) % count : index > 0 ? index - 1 : null
  const nextI = wrap ? (index + 1) % count : index < count - 1 ? index + 1 : null
  // Three equal panels; translate so the middle panel is centered
  const translatePct = (-100 + offset * -100) / 3

  const api: CardSliderControls = {
    go,
    busy,
    canPrev: wrap ? !busy && count > 1 : index > 0 && !busy,
    canNext: wrap ? !busy && count > 1 : index < count - 1 && !busy,
    index,
    count,
  }

  useEffect(() => {
    onApiChange?.(api)
  }, [busy, index, count, go, onApiChange])

  // Hide adjacent panels when idle so they never peek as grey edge bands
  const showSides = busy || offset !== 0

  return (
    <div
      className={cn('w-full', className)}
      data-card-slider
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/*
        Clip only the horizontal slide. Vertical overflow stays visible so
        rounded corners + soft elevation never get square-cropped into grey bands.
        Tiny horizontal pad gives shadow a place to land without hard cutoffs.
      */}
      <div
        className="relative w-full overflow-x-clip overflow-y-visible px-0.5"
        style={{ isolation: 'isolate' }}
      >
        <div
          ref={trackRef}
          className="flex w-[300%]"
          style={{
            transform: `translateX(${translatePct}%)`,
            transition: noTransition
              ? 'none'
              : `transform ${SLIDE_MS}ms cubic-bezier(0.25, 0.8, 0.25, 1)`,
            willChange: 'transform',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          <div className="w-1/3 shrink-0">
            {prevI !== null && showSides ? (
              <div className="pointer-events-none select-none" aria-hidden>
                {children(prevI)}
              </div>
            ) : (
              <div className="min-h-[1px]" aria-hidden />
            )}
          </div>
          <div className="w-1/3 shrink-0">{children(index)}</div>
          <div className="w-1/3 shrink-0">
            {nextI !== null && showSides ? (
              <div className="pointer-events-none select-none" aria-hidden>
                {children(nextI)}
              </div>
            ) : (
              <div className="min-h-[1px]" aria-hidden />
            )}
          </div>
        </div>
      </div>
      {controls ? controls(api) : null}
    </div>
  )
}

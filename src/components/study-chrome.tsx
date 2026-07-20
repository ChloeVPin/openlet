import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Progress } from './ui/progress'
import { cn } from '../lib/cn'
import { Tooltip } from './ui/tooltip'

export function StudyChrome({
  backHref,
  title,
  progress,
  progressLabel,
  right,
  children,
  footer,
  className,
  fullHeight = true,
}: {
  backHref: string
  title: string
  progress?: number
  progressLabel?: string
  right?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  fullHeight?: boolean
}) {
  return (
    <div className={cn(fullHeight && 'flex min-h-screen flex-col bg-[#f6f7fb]', className)}>
      <header className="border-b border-[#e8eaf0] bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Tooltip label="Back to set" side="bottom">
            <a
              href={backHref}
              className="inline-flex size-9 items-center justify-center rounded-lg text-[#4a5065] transition hover:bg-[#f6f7fb] hover:text-[#1a1d26]"
              aria-label="Back to set"
            >
              <ArrowLeft className="size-5" />
            </a>
          </Tooltip>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-bold text-[#1a1d26]">{title}</p>
              {progressLabel && (
                <span className="shrink-0 text-xs font-bold tabular-nums text-[#7c84a0]">
                  {progressLabel}
                </span>
              )}
            </div>
            {typeof progress === 'number' && (
              <Progress value={progress} className="mt-2 h-1.5 bg-[#e8eaf0]" />
            )}
          </div>
          {right}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </div>

      {footer && (
        <div className="sticky bottom-0 border-t border-[#e8eaf0] bg-white">
          <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">{footer}</div>
        </div>
      )}
    </div>
  )
}

export function StudyDone({
  percent,
  correct,
  total,
  subtitle,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  percent: number
  correct: number
  total: number
  subtitle?: string
  primaryHref: string
  primaryLabel: string
  secondaryHref: string
  secondaryLabel: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
      <div className="flex size-28 items-center justify-center rounded-full border-4 border-[#eef0ff] bg-white shadow-sm">
        <span className="text-4xl font-extrabold tabular-nums text-[#4255ff]">{percent}%</span>
      </div>
      <p className="mt-6 text-lg font-bold text-[#1a1d26]">
        {correct} of {total} correct
      </p>
      {subtitle && <p className="mt-2 max-w-xs text-sm text-[#4a5065]">{subtitle}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <a
          href={primaryHref}
          className="inline-flex h-11 items-center rounded-lg bg-[#4255ff] px-6 text-sm font-bold text-white hover:bg-[#3b4ce0]"
        >
          {primaryLabel}
        </a>
        <a
          href={secondaryHref}
          className="inline-flex h-11 items-center rounded-lg border border-[#e8eaf0] bg-white px-6 text-sm font-bold text-[#1a1d26] hover:bg-[#f6f7fb]"
        >
          {secondaryLabel}
        </a>
      </div>
    </div>
  )
}

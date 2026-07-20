import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export function PageHeader({
  title,
  description,
  badge,
  actions,
  back,
  className,
}: {
  title: string
  description?: string
  badge?: string
  actions?: ReactNode
  back?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {back}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {badge ? (
              <span className="rounded-full bg-[#fff7ed] px-2 py-0.5 text-[11px] font-bold text-[#c2410c]">
                {badge}
              </span>
            ) : null}
          </div>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/cn'

export function ModeTile({
  href,
  icon: Icon,
  title,
  description,
  accent = 'brand',
  disabled,
}: {
  href: string
  icon: LucideIcon
  title: string
  description: string
  accent?: 'brand' | 'success' | 'warning' | 'muted'
  disabled?: boolean
}) {
  const accents = {
    brand: 'group-hover:border-primary/40 group-hover:bg-primary/[0.03]',
    success:
      'group-hover:border-[var(--success)]/40 group-hover:bg-[color-mix(in_oklab,var(--success)_6%,transparent)]',
    warning:
      'group-hover:border-[var(--warning)]/40 group-hover:bg-[color-mix(in_oklab,var(--warning)_8%,transparent)]',
    muted: 'group-hover:border-border-strong group-hover:bg-muted/50',
  }

  const iconTint = {
    brand: 'bg-primary/10 text-primary',
    success: 'bg-[color-mix(in_oklab,var(--success)_12%,transparent)] text-[var(--success)]',
    warning: 'bg-[color-mix(in_oklab,var(--warning)_14%,transparent)] text-[var(--warning)]',
    muted: 'bg-muted text-muted-foreground',
  }

  if (disabled) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 opacity-50">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            iconTint[accent],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    )
  }

  return (
    <a
      href={href}
      className={cn(
        'group flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        accents[accent],
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
          iconTint[accent],
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </a>
  )
}

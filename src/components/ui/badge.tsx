import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type BadgeVariant = 'default' | 'brand' | 'muted' | 'success' | 'warning'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-muted text-foreground',
  brand: 'bg-secondary text-secondary-foreground',
  muted: 'bg-muted text-muted-foreground',
  success: 'bg-[color-mix(in_oklab,var(--success)_12%,transparent)] text-[var(--success)]',
  warning: 'bg-[color-mix(in_oklab,var(--warning)_14%,transparent)] text-[var(--warning)]',
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

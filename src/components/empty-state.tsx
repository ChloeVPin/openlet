import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center py-16 text-center', className)}>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[#eef0ff] text-[#4255ff]">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-base font-bold text-[#1a1d26]">{title}</h2>
      {description && <p className="mt-1.5 max-w-sm text-sm text-[#4a5065]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

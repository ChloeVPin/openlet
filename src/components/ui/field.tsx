import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Field({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-xs font-bold text-[#646f90]">
        {label}
      </label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-semibold text-[#ff725b]">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-[#7a82a5]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function fieldA11y(id: string, error?: string, hint?: string) {
  const describedBy = [error ? `${id}-error` : null, !error && hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ')
  return {
    id,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': describedBy || undefined,
  }
}

import { cn } from '../../lib/cn'

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[#e8eaf0]', className)}
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full bg-[#4255ff] transition-[width] duration-300 ease-out',
          barClassName,
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  )
}

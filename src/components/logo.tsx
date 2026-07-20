import { cn } from '../lib/cn'

/** Minimal Openlet mark - geometric O on brand blue (Quizlet-style app icon). */
export function LogoMark({
  className,
  size = 32,
  title = 'Openlet',
}: {
  className?: string
  size?: number
  title?: string
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={cn('shrink-0', className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="32" height="32" rx="8" fill="#4255FF" />
      <circle cx="16" cy="16" r="7.5" stroke="#FFFFFF" strokeWidth="4" fill="none" />
    </svg>
  )
}

export function Logo({
  className,
  markSize = 28,
  showWordmark = true,
}: {
  className?: string
  markSize?: number
  showWordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={markSize} />
      {showWordmark && (
        <span className="text-[15px] font-bold tracking-tight text-foreground">Openlet</span>
      )}
    </span>
  )
}

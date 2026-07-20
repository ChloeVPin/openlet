import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/** Shared max-width + padding for logged-in product pages (Quizlet density). */
export function ProductPage({
  children,
  className,
  wide,
}: {
  children: ReactNode
  className?: string
  wide?: boolean
}) {
  return (
    <div
      className="flex-1"
      style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(246,247,251,0.55) 0%, rgba(246,247,251,0.7) 100%), url(/images/dashboard.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className={cn(
          'mx-auto w-full px-4 py-8 sm:px-6 md:py-10',
          wide ? 'max-w-6xl' : 'max-w-5xl',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-bold tracking-tight text-[#1a1d26]">{children}</h2>
}

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = 'text', ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'h-11 w-full rounded-lg border border-[#e8eaf0] bg-white px-3.5 text-sm text-[#1a1d26] placeholder:text-[#7c84a0] outline-none transition-colors focus:border-[#4255ff] focus:ring-2 focus:ring-[#4255ff]/15 disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)

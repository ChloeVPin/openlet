import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#4255ff] text-white hover:bg-[#3b4ce0] shadow-sm disabled:opacity-50',
  secondary: 'bg-[#eef0ff] text-[#2a35b8] hover:bg-[#e0e4ff] disabled:opacity-50',
  outline: 'border border-[#e8eaf0] bg-white text-[#1a1d26] hover:bg-[#f6f7fb] disabled:opacity-50',
  ghost: 'text-[#4a5065] hover:bg-[#f6f7fb] hover:text-[#1a1d26] disabled:opacity-50',
  danger: 'border border-[#fecaca] bg-white text-[#e11d48] hover:bg-[#fef2f2] disabled:opacity-50',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs font-bold max-sm:h-11 max-sm:px-3.5',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm font-bold max-sm:h-11',
  lg: 'h-11 gap-2 rounded-lg px-5 text-sm font-bold',
  icon: 'size-10 rounded-lg max-sm:size-11',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#4255ff]/40 focus-visible:ring-offset-2 active:translate-y-px',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
})

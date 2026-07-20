import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

interface Option {
  value: string
  label: string
}

interface SelectProps {
  id?: string
  name?: string
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  options: Option[]
  className?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

export function DropdownSelect({
  id,
  name,
  defaultValue,
  value,
  onChange,
  options,
  className,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
}: SelectProps) {
  const [selectedValue, setSelectedValue] = useState(value ?? defaultValue ?? options[0]?.value)
  const [open, setOpen] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  useEffect(() => {
    // Detect touch capability for native picker behavior
    setIsTouch(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const activeOption = options.find((opt) => opt.value === selectedValue) || options[0]

  const handleSelect = (val: string) => {
    setSelectedValue(val)
    setOpen(false)
    onChange?.(val)
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {isTouch ? (
        /* Mobile/Touch layout: Overlay transparent native select over styling button */
        <div className="relative">
          <button
            type="button"
            className="flex h-11 w-full items-center justify-between rounded-lg border border-[#e8eaf0] bg-white px-3.5 text-sm text-[#1a1d26] outline-none"
          >
            <span>{activeOption?.label}</span>
            <ChevronDown className="size-4 text-[#7c84a0]" />
          </button>
          <select
            id={id}
            name={name}
            value={selectedValue}
            onChange={(e) => {
              const val = e.target.value
              setSelectedValue(val)
              onChange?.(val)
            }}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedby}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        /* Desktop layout: Custom styled floating list box */
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'flex h-11 w-full items-center justify-between rounded-lg border border-[#e8eaf0] bg-white px-3.5 text-sm text-[#1a1d26] outline-none transition-all',
              open ? 'border-[#4255ff] ring-2 ring-[#4255ff]/15' : 'hover:border-[#d9dde8]',
            )}
          >
            <span>{activeOption?.label}</span>
            <ChevronDown
              className={cn(
                'size-4 text-[#7c84a0] transition-transform duration-200',
                open && 'rotate-180 text-[#4255ff]',
              )}
            />
          </button>

          {/* Real select element for standard FormData extraction */}
          <select
            id={id}
            name={name}
            value={selectedValue}
            onChange={(e) => {
              const val = e.target.value
              setSelectedValue(val)
              onChange?.(val)
            }}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedby}
            className="sr-only"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {open && (
            <div className="absolute bottom-full left-0 right-0 z-50 mb-1.5 overflow-hidden rounded-xl border border-[#e8eaf0] bg-white shadow-lg anim-scale-in">
              {options.map((opt) => {
                const isSelected = opt.value === selectedValue
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'flex w-full items-center px-3.5 py-2.5 text-left text-sm font-semibold transition-colors',
                      isSelected ? 'bg-[#eef0ff] text-[#4255ff]' : 'text-[#1a1d26] hover:bg-[#f6f7fb]',
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

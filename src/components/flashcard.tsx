import React from 'react'
import { Volume2, Star } from 'lucide-react'
import { cn } from '../lib/cn'

const FLIP_MS = 650

export function FlashcardFace({
  label,
  text,
  flipped,
  side,
  size = 'lg',
  isStarred,
  onToggleStar,
}: {
  label: string
  text: string
  flipped: boolean
  side: 'front' | 'back'
  size?: 'md' | 'lg'
  isStarred?: boolean
  onToggleStar?: (e: React.MouseEvent) => void
}) {
  const isFront = side === 'front'

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[#e8eaf0] bg-white p-6 sm:p-8',
        !isFront && 'border-[#e0e4ff] bg-[#fafbff]',
        size === 'lg' ? 'min-h-[280px]' : 'min-h-[200px]',
      )}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: isFront ? 'rotateY(0deg)' : 'rotateY(180deg)',
        boxShadow: '0 12px 40px -12px rgba(26,29,38,0.1), 0 4px 12px -4px rgba(66,85,255,0.06)',
      }}
      aria-hidden={isFront ? flipped : !flipped}
    >
      <div className="absolute right-4 top-4 flex items-center gap-1">
        {onToggleStar && (
          <button
            type="button"
            onClick={onToggleStar}
            className={cn(
              "rounded-xl p-2 transition hover:bg-[#f6f7fb]",
              isStarred ? "text-[#f59e0b] hover:text-[#d97706]" : "text-[#7c84a0] hover:text-[#1a1d26]"
            )}
            aria-label={isStarred ? "Unstar card" : "Star card"}
          >
            <Star className="size-4" fill={isStarred ? "currentColor" : "none"} />
          </button>
        )}
        <button
          type="button"
          onClick={handleSpeak}
          className="rounded-xl p-2 text-[#7c84a0] transition hover:bg-[#f6f7fb] hover:text-[#1a1d26]"
          aria-label="Listen to pronunciation"
        >
          <Volume2 className="size-4" />
        </button>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#7c84a0]">{label}</p>
      <p
        className={cn(
          'mt-4 max-w-full text-center leading-snug text-[#1a1d26]',
          isFront ? 'font-display font-semibold' : 'font-semibold',
          size === 'lg' ? 'text-xl sm:text-2xl' : 'text-lg',
          text.length > 120 && 'text-base sm:text-lg font-sans',
          text.length > 220 && 'text-sm sm:text-base font-sans',
        )}
      >
        {text}
      </p>
      {isFront && !flipped && (
        <p className="mt-8 text-xs font-semibold text-[#7c84a0]">Click to flip</p>
      )}
    </div>
  )
}

export function Flashcard({
  term,
  definition,
  flipped,
  onFlip,
  termFirst = true,
  size = 'lg',
  className,
  isStarred,
  onToggleStar,
}: {
  term: string
  definition: string
  flipped: boolean
  onFlip?: () => void
  termFirst?: boolean
  size?: 'md' | 'lg'
  className?: string
  isStarred?: boolean
  onToggleStar?: (e: React.MouseEvent) => void
}) {
  const front = termFirst
    ? { label: 'Term', text: term }
    : { label: 'Definition', text: definition }
  const back = termFirst ? { label: 'Definition', text: definition } : { label: 'Term', text: term }

  return (
    <div
      data-flip-card
      className={cn(
        'w-full cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none',
        className,
      )}
      style={{ perspective: '1600px', perspectiveOrigin: '50% 50%' }}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          onFlip?.()
        }
      }}
      aria-label={flipped ? `Showing ${back.label}` : `Showing ${front.label}. Flip card`}
    >
      <div
        className={cn(
          'relative w-full',
          size === 'lg' ? 'h-[min(48vh,340px)] min-h-[260px]' : 'h-52',
        )}
        style={{
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: `transform ${FLIP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: 'transform',
        }}
      >
        <FlashcardFace {...front} flipped={flipped} side="front" size={size} isStarred={isStarred} onToggleStar={onToggleStar} />
        <FlashcardFace {...back} flipped={flipped} side="back" size={size} isStarred={isStarred} onToggleStar={onToggleStar} />
      </div>
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { ImageIcon, type LucideIcon } from 'lucide-react'
import { cn } from '../lib/cn'
import { resolveCover, splitCoverCover, COVER_ICONS } from '../lib/covers'
import { Tooltip } from './ui/tooltip'

export interface SetCardData {
  id: string
  title: string
  description?: string | null
  subject?: string | null
  cover?: string | null
  cardCount: number
  dueCount?: number
  lastStudied?: string | null
}

function relativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  const diff = Date.now() - t
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

/** Resolve the icon component from a cover string (default Layers). */
function coverIcon(cover: string | null | undefined): LucideIcon {
  const { icon: iconName } = splitCoverCover(cover)
  const found = COVER_ICONS.find((c) => c.name === iconName)
  return found?.icon ?? COVER_ICONS[0].icon
}

export function SetCard({
  set,
  highlightDue,
  compact,
  onEditCover,
  index,
}: {
  set: SetCardData
  highlightDue?: boolean
  compact?: boolean
  onEditCover?: (set: SetCardData) => void
  index?: number
}) {
  const last = relativeTime(set.lastStudied)
  const due = set.dueCount ?? 0
  const cover = resolveCover(set.cover)
  const Icon = coverIcon(set.cover)
  const titleId = `set-card-title-${set.id}`

  return (
    <article
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#edeff4] bg-white anim-fade-up',
        'hover:border-[#c9cce0] hover:shadow-[0_2px_10px_rgb(48_53_69/0.08)]',
        'has-[:focus-visible]:border-[#4255ff]/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#4255ff]/15',
        compact ? 'min-h-[140px]' : 'min-h-[164px]',
      )}
      style={
        typeof index === 'number' ? { animationDelay: `${Math.min(index, 15) * 35}ms` } : undefined
      }
    >
      {/* Stretched link */}
      <Link
        to="/set/$id"
        params={{ id: set.id }}
        className="absolute inset-0 z-0 rounded-2xl outline-none"
        aria-labelledby={titleId}
        preload="intent"
      />

      {/* Colored header plate with user-chosen icon watermark */}
      <div
        className={cn(
          'pointer-events-none relative z-[1] flex flex-1 flex-col justify-end overflow-hidden p-4',
          compact ? 'min-h-[68px]' : 'min-h-[84px]',
        )}
        style={{ background: cover.plate }}
      >
        {/* Icon watermark - user chosen */}
        <Icon
          className="pointer-events-none absolute -right-3 -top-2 size-20 opacity-[0.08]"
          style={{ color: cover.title }}
          strokeWidth={1.5}
        />
        <h3
          id={titleId}
          className="relative line-clamp-2 text-left text-[15px] font-bold leading-snug sm:text-base"
          style={{ color: cover.title }}
        >
          {set.title}
        </h3>
      </div>

      {/* Info section below the colored header */}
      <div className="pointer-events-none relative z-[1] flex items-center gap-2 bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          {!compact && set.description ? (
            <p className="mb-1 line-clamp-1 text-left text-xs text-[#646f90]">{set.description}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#646f90]">
            <span className="tabular-nums text-[#303545]">
              {set.cardCount} {set.cardCount === 1 ? 'term' : 'terms'}
            </span>
            {due > 0 ? (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 font-bold',
                  highlightDue ? 'bg-[#4255ff] text-white' : 'bg-[#edefff] text-[#2a35b8]',
                )}
              >
                {due} due
              </span>
            ) : null}
            {set.subject ? (
              <span className="rounded-full bg-[#f6f7fb] px-2 py-0.5 text-[#646f90]">
                {set.subject}
              </span>
            ) : null}
            {last ? <span className="font-medium text-[#7a82a5]">Studied {last}</span> : null}
          </div>
        </div>

        {/* Cover edit button */}
        {onEditCover ? (
          <Tooltip label="Change cover" side="top">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEditCover(set)
              }}
              className={cn(
                'pointer-events-auto inline-flex size-11 shrink-0 items-center justify-center rounded-2xl',
                'border border-[#edeff4] bg-[#f6f7fb] text-[#646f90]',
                'transition-colors hover:border-[#c9cce0] hover:bg-white hover:text-[#4255ff]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4255ff]',
              )}
              aria-label={`Change cover for ${set.title}`}
            >
              <ImageIcon className="size-4" strokeWidth={2.25} />
            </button>
          </Tooltip>
        ) : null}
      </div>
    </article>
  )
}

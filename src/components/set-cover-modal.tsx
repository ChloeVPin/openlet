import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog } from './ui/dialog'
import {
  COVER_PRESETS,
  COVER_ICONS,
  encodeSolidCover,
  isSolidCover,
  resolveCover,
  solidHex,
  splitCoverCover,
  joinCoverIcon,
} from '../lib/covers'
import { cn } from '../lib/cn'

export function SetCoverModal({
  open,
  setTitle,
  currentCover,
  saving,
  onSave,
  onClose,
}: {
  open: boolean
  setTitle: string
  currentCover: string
  saving?: boolean
  onSave: (cover: string) => void
  onClose: () => void
}) {
  const parsed = splitCoverCover(currentCover)
  const [draftCover, setDraftCover] = useState(parsed.cover || 'default')
  const [draftIcon, setDraftIcon] = useState(parsed.icon || 'layers')
  const [customHex, setCustomHex] = useState('#4255ff')

  useEffect(() => {
    if (!open) return
    const p = splitCoverCover(currentCover)
    setDraftCover(p.cover || 'default')
    setDraftIcon(p.icon || 'layers')
    const hex = solidHex(p.cover)
    if (hex) setCustomHex(hex)
  }, [open, currentCover])

  const draft = joinCoverIcon(draftCover, draftIcon)
  const preview = resolveCover(draftCover)
  const customSelected = isSolidCover(draftCover)
  const dirty = draft !== (currentCover || 'default|layers')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Set cover"
      description="Choose a look and icon for this set in your library"
      size="xl"
      sheetOnMobile
      dismissible={!saving}
      bodyClassName="!p-0"
      className="lg:max-h-[min(86dvh,720px)]"
      footer={
        <>
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            size="md"
            onClick={() => onSave(draft)}
            disabled={saving || !dirty}
            className="w-full sm:w-auto sm:min-w-[7.5rem]"
          >
            {saving ? 'Saving...' : 'Save cover'}
          </Button>
        </>
      }
    >
      <div
        className={cn(
          'px-4 py-4 sm:px-6 sm:py-5',
          'lg:grid lg:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.2fr)] lg:gap-8 lg:px-7 lg:py-6',
        )}
      >
        {/* Left preview column */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#7a82a5]">Preview</p>
          <div className="mt-2 rounded-3xl border border-[#edeff4] bg-white p-2.5 sm:p-3 lg:sticky lg:top-0 lg:mt-3 lg:p-3.5">
            <div
              className="flex min-h-[72px] items-end rounded-2xl px-3.5 py-3.5 sm:min-h-[88px] lg:min-h-[112px] lg:px-4 lg:py-4"
              style={{ background: preview.plate }}
            >
              <p
                className="line-clamp-2 text-left text-[15px] font-bold leading-snug sm:text-base lg:text-lg"
                style={{ color: preview.title }}
              >
                {setTitle || 'Untitled set'}
              </p>
            </div>
            <div className="flex items-center gap-2 px-1 pt-2.5 pb-0.5 text-xs font-semibold text-[#646f90]">
              <span className="tabular-nums text-[#303545]">12 terms</span>
              <span className="text-[#7a82a5]">Preview</span>
            </div>
          </div>
          <p className="mt-3 hidden text-xs leading-relaxed text-[#7a82a5] lg:block">
            Covers appear on set cards in your library. Study modes are unchanged.
          </p>
        </div>

        {/* Right column: color presets + icon picker */}
        <div className="mt-5 space-y-5 sm:mt-6 sm:space-y-6 lg:mt-0">
          {/* Color presets */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#7a82a5]">Colors</p>
            <div
              className="mt-2 grid grid-cols-3 gap-2 sm:mt-2.5 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-3 xl:grid-cols-4"
              role="listbox"
              aria-label="Cover presets"
            >
              {COVER_PRESETS.map((preset) => {
                const selected = draftCover === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => setDraftCover(preset.id)}
                    className={cn(
                      'group relative flex min-h-11 flex-col overflow-hidden rounded-2xl border-2 text-left transition-colors',
                      selected
                        ? 'border-[#4255ff] ring-2 ring-[#4255ff]/20'
                        : 'border-transparent hover:border-[#c9cce0]',
                    )}
                  >
                    <span
                      className="relative block h-12 w-full sm:h-14 lg:h-16"
                      style={{ background: preset.swatch }}
                    >
                      {selected ? (
                        <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-[#4255ff] text-white">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      ) : null}
                    </span>
                    <span className="bg-[#f6f7fb] px-2 py-1.5 text-[11px] font-semibold text-[#303545] sm:text-xs">
                      {preset.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom color */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#7a82a5]">Custom color</p>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#edeff4] bg-[#f6f7fb]/60 p-3 sm:mt-2.5 sm:p-3.5">
              <label
                className={cn(
                  'relative flex size-12 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2 sm:size-14',
                  customSelected ? 'border-[#4255ff] ring-2 ring-[#4255ff]/20' : 'border-[#edeff4]',
                )}
              >
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => {
                    const hex = e.target.value
                    setCustomHex(hex)
                    setDraftCover(encodeSolidCover(hex))
                  }}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  aria-label="Pick a custom cover color"
                />
                <span className="block size-full" style={{ background: customHex }} />
              </label>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#303545]">Solid color</p>
                <p className="text-xs text-[#646f90]">
                  {customHex.toUpperCase()}
                  {customSelected ? ' - selected' : ''}
                </p>
              </div>
              <Button
                type="button"
                variant={customSelected ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setDraftCover(encodeSolidCover(customHex))}
              >
                Use
              </Button>
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#7a82a5]">Icon</p>
            <div
              className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5"
              role="listbox"
              aria-label="Cover icon"
            >
              {COVER_ICONS.map((ci) => {
                const selected = draftIcon === ci.name
                const Icon = ci.icon
                return (
                  <button
                    key={ci.name}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => setDraftIcon(ci.name)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-2xl border-2 p-2.5 transition-colors sm:p-3',
                      selected
                        ? 'border-[#4255ff] bg-[#edefff] ring-2 ring-[#4255ff]/20'
                        : 'border-[#edeff4] bg-[#f6f7fb]/60 hover:border-[#c9cce0] hover:bg-[#f6f7fb]',
                    )}
                  >
                    <Icon
                      className="size-5 sm:size-6"
                      strokeWidth={selected ? 2.5 : 1.75}
                      style={{ color: selected ? '#4255ff' : '#646f90' }}
                    />
                    <span
                      className={cn(
                        'text-[10px] font-semibold leading-tight',
                        selected ? 'text-[#4255ff]' : 'text-[#7a82a5]',
                      )}
                    >
                      {ci.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

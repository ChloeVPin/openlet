import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { createSet } from '../../src/lib/actions/sets'
import { getPreferences } from '../../src/lib/actions/preferences'
import type { CardInput } from '../../lib/types'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ProductPage } from '../components/product-layout'
import { cn } from '../lib/cn'

export const Route = createFileRoute('/create')({
  head: () => ({
    meta: [
      { title: 'Create set | Openlet' },
      {
        name: 'description',
        content:
          'Create a new flashcard study set on Openlet. Add terms and definitions manually or paste in bulk.',
      },
      { property: 'og:title', content: 'Create set | Openlet' },
      {
        property: 'og:description',
        content:
          'Create a new flashcard study set on Openlet. Add terms and definitions manually or paste in bulk.',
      },
      { name: 'twitter:title', content: 'Create set | Openlet' },
      {
        name: 'twitter:description',
        content:
          'Create a new flashcard study set on Openlet. Add terms and definitions manually or paste in bulk.',
      },
    ],
  }),
  beforeLoad: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const session = await getSession()
    if (!session) throw redirect({ to: '/signin' })
  },
  component: CreateSet,
})

function CreateSet() {
  const navigate = Route.useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [defaultCover, setDefaultCover] = useState<string | undefined>(undefined)
  const [cardList, setCardList] = useState<CardInput[]>([
    { term: '', definition: '' },
    { term: '', definition: '' },
  ])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [removingIndex, setRemovingIndex] = useState<number | null>(null)
  const rowRefs = useRef<(HTMLInputElement | null)[]>([])

  // Load user's defaultCover preference so new sets inherit their chosen style
  useEffect(() => {
    getPreferences()
      .then((prefs) => {
        if (prefs.defaultCover) setDefaultCover(prefs.defaultCover)
      })
      .catch(() => {})
  }, [])

  /** Live preview of parsed bulk text */
  const bulkPreview = useMemo(() => {
    if (!bulkText.trim()) return null
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    const pairs: { term: string; definition: string }[] = []
    for (const line of lines) {
      const parts = line.includes('\t')
        ? line.split('\t')
        : line.includes(' - ')
          ? line.split(' - ')
          : line.split(',')
      const term = (parts[0] || '').trim()
      const definition = parts
        .slice(1)
        .join(line.includes('\t') ? '\t' : line.includes(' - ') ? ' - ' : ',')
        .trim()
      if (term || definition) pairs.push({ term, definition })
    }
    return pairs.length > 0 ? pairs : null
  }, [bulkText])

  function updateCard(i: number, key: 'term' | 'definition', value: string) {
    setCardList((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [key]: value }
      return next
    })
  }

  function addCard(focus = true) {
    setCardList((prev) => {
      const next = [...prev, { term: '', definition: '' }]
      if (focus) {
        requestAnimationFrame(() => {
          rowRefs.current[(next.length - 1) * 2]?.focus()
        })
      }
      return next
    })
  }

  function removeCard(i: number) {
    if (cardList.length <= 1) return
    setRemovingIndex(i)
    setTimeout(() => {
      setCardList((prev) => prev.filter((_, idx) => idx !== i))
      setRemovingIndex(null)
    }, 180)
  }

  function applyBulk() {
    if (!bulkPreview) {
      setError('No pairs found. Use term[tab]definition or term, definition per line.')
      return
    }
    setCardList(bulkPreview)
    setBulkOpen(false)
    setBulkText('')
    setError('')
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setError('')
    const filled = cardList.filter((c) => c.term.trim() && c.definition.trim())
    if (filled.length === 0) {
      setError('Add at least one complete card')
      return
    }
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    try {
      const result = await createSet({
        data: {
          title,
          description,
          subject,
          ...(defaultCover ? { cover: defaultCover } : {}),
          cards: filled,
        },
      })
      navigate({ to: '/set/$id', params: { id: result.id } })
    } catch {
      setError('Something went wrong')
      setSaving(false)
    }
  }

  const filledCount = cardList.filter((c) => c.term.trim() && c.definition.trim()).length
  const hasAnyContent = cardList.some((c) => c.term.trim() || c.definition.trim())

  function onTermKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      rowRefs.current[i * 2 + 1]?.focus()
    }
  }

  function onDefKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (i === cardList.length - 1) addCard(true)
      else rowRefs.current[(i + 1) * 2]?.focus()
    }
    if (e.key === 'Tab' && !e.shiftKey && i === cardList.length - 1) {
      e.preventDefault()
      addCard(true)
    }
  }

  return (
    <ProductPage className="max-w-3xl">
      <a
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4a5065] hover:text-[#1a1d26]"
      >
        <ArrowLeft className="size-3.5" /> Your library
      </a>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1a1d26]">
            Create a new study set
          </h1>
          <p className="mt-1 text-sm text-[#4a5065]">
            Enter to advance &middot; Tab on last row adds a card
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setBulkOpen((v) => !v)}>
          Bulk paste
        </Button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#e11d48]">
          {error}
        </p>
      )}

      {bulkOpen && (
        <div className="mt-4 rounded-2xl border border-[#e8eaf0] bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-[#1a1d26]">Bulk paste</p>
          <p className="mt-1 text-xs text-[#4a5065]">
            One card per line, separated by a dash (term - definition), tab, or comma.
          </p>
          <div className="mt-3 flex items-stretch gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a82a5]">
                Paste here
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="mt-1.5 block h-56 min-h-56 w-full resize-y rounded-lg border border-[#e8eaf0] bg-[#fafbfa] px-3 py-2.5 font-mono text-sm outline-none transition-colors focus:border-[#4255ff] focus:bg-white"
                placeholder={'mitochondria - powerhouse of the cell\nDNA - deoxyribonucleic acid\natom - smallest unit of matter'}
              />
            </div>
            <div className="hidden min-w-0 flex-1 sm:flex flex-col">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a82a5]">
                Preview
              </p>
              <div className="mt-1.5 min-h-56 overflow-y-auto rounded-lg border border-[#e8eaf0] bg-white flex-1">
                {bulkPreview ? (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#f0f1f5] text-[11px] font-semibold uppercase text-[#7a82a5]">
                        <th className="w-1/2 px-3 py-1.5">Term</th>
                        <th className="w-1/2 px-3 py-1.5">Definition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.map((pair, i) => (
                        <tr key={i} className="border-b border-[#f0f1f5] last:border-0">
                          <td className="truncate px-3 py-1.5 font-medium text-[#303545]">
                            {pair.term || <span className="italic text-[#7a82a5]">empty</span>}
                          </td>
                          <td className="truncate px-3 py-1.5 text-[#4a5065]">
                            {pair.definition || (
                              <span className="italic text-[#7a82a5]">empty</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-xs text-[#7a82a5]">
                    <p>
                      {bulkText.trim()
                        ? 'No valid pairs found yet'
                        : 'Paste text above to see a preview'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div>
              {bulkPreview ? (
                <span className="text-xs font-semibold text-[#4a5065] sm:hidden">
                  {bulkPreview.length} card{bulkPreview.length !== 1 ? 's' : ''} parsed
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={applyBulk} disabled={!bulkPreview}>
                Import{bulkPreview ? ` (${bulkPreview.length})` : ''}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setBulkOpen(false)
                  setBulkText('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="rounded-2xl border border-[#e8eaf0] bg-white p-5 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-wide text-[#7c84a0]">Title</label>
          <Input
            className="mt-1.5 h-12 border-0 bg-transparent px-0 text-lg font-bold focus:ring-0"
            placeholder="e.g. Cell biology midterm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <div className="mt-3 grid gap-3 border-t border-[#f0f1f5] pt-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-[#4a5065]">Description</label>
              <Input
                className="mt-1.5"
                placeholder="Optional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#4a5065]">Subject</label>
              <Input
                className="mt-1.5"
                placeholder="Optional"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1a1d26]">
              Terms{' '}
              <span className="font-medium text-[#7c84a0]">
                ({filledCount} ready &middot; {cardList.length} rows)
              </span>
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={() => addCard(true)}>
              <Plus className="size-3.5" /> Add card
            </Button>
          </div>

          <div className="mt-3 space-y-2">
            {cardList.map((card, i) => (
              <div
                key={i}
                className={cn(
                  'group grid grid-cols-[auto_1fr_1fr_auto] items-start gap-2 rounded-2xl border border-[#e8eaf0] bg-white p-3 shadow-sm sm:gap-3 sm:p-3.5',
                  removingIndex === i && 'animate-card-dissipate pointer-events-none',
                )}
              >
                <span className="mt-2.5 w-6 text-center text-xs font-bold tabular-nums text-[#7c84a0]">
                  {i + 1}
                </span>
                <Input
                  ref={(el) => {
                    rowRefs.current[i * 2] = el
                  }}
                  placeholder="Term"
                  value={card.term}
                  onChange={(e) => updateCard(i, 'term', e.target.value)}
                  onKeyDown={(e) => onTermKeyDown(e, i)}
                  className="font-semibold"
                />
                <Input
                  ref={(el) => {
                    rowRefs.current[i * 2 + 1] = el
                  }}
                  placeholder="Definition"
                  value={card.definition}
                  onChange={(e) => updateCard(i, 'definition', e.target.value)}
                  onKeyDown={(e) => onDefKeyDown(e, i)}
                />
                <button
                  type="button"
                  onClick={() => removeCard(i)}
                  disabled={cardList.length <= 1}
                  className="mt-1 rounded-lg p-2 text-[#7c84a0] transition hover:bg-[#fef2f2] hover:text-[#e11d48] sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-0"
                  aria-label="Remove card"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar - inline, not fixed, hidden when no content exists */}
        {hasAnyContent ? (
          <div className="sticky bottom-4 -mx-4 rounded-2xl border border-[#e8eaf0] bg-white shadow-sm sm:-mx-0">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <p className="text-xs font-semibold text-[#7c84a0]">
                {filledCount} card{filledCount !== 1 ? 's' : ''} will be saved
              </p>
              <Button onClick={() => handleSubmit()} disabled={filledCount === 0 || saving}>
                {saving ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        ) : null}
      </form>
    </ProductPage>
  )
}

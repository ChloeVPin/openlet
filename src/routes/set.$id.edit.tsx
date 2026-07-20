import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { updateSet } from '../../src/lib/actions/sets'
import type { CardInput } from '../../lib/types'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { PageHeader } from '../components/page-header'
import { cn } from '../lib/cn'

export const Route = createFileRoute('/set/$id/edit')({
  head: () => ({
    meta: [
      { title: 'Edit set | Openlet' },
      {
        name: 'description',
        content:
          'Edit your flashcard set on Openlet. Add, remove, or update terms and definitions.',
      },
      { property: 'og:title', content: 'Edit set | Openlet' },
      {
        property: 'og:description',
        content:
          'Edit your flashcard set on Openlet. Add, remove, or update terms and definitions.',
      },
      { name: 'twitter:title', content: 'Edit set | Openlet' },
      {
        name: 'twitter:description',
        content:
          'Edit your flashcard set on Openlet. Add, remove, or update terms and definitions.',
      },
    ],
  }),
  beforeLoad: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const session = await getSession()
    if (!session) throw redirect({ to: '/signin' })
  },
  component: EditSet,
})

function EditSet() {
  const { id } = Route.useParams()
  const navigate = Route.useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [cardList, setCardList] = useState<CardInput[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removingIndex, setRemovingIndex] = useState<number | null>(null)
  const rowRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    fetch(`/api/sets/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setTitle(d.set.title)
        setDescription(d.set.description || '')
        setSubject(d.set.subject || '')
        setCardList(
          (d.cards || []).map((c: { term: string; definition: string }) => ({
            term: c.term,
            definition: c.definition,
          })),
        )
        setLoading(false)
      })
  }, [id])

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
        requestAnimationFrame(() => rowRefs.current[(next.length - 1) * 2]?.focus())
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

  async function handleSubmit() {
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
      await updateSet({ data: { setId: id, title, description, subject, cards: filled } })
      navigate({ to: '/set/$id', params: { id } })
    } catch {
      setError('Something went wrong')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const filledCount = cardList.filter((c) => c.term.trim() && c.definition.trim()).length

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 md:px-6">
      <PageHeader
        back={
          <a
            href={`/set/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to set
          </a>
        }
        title="Edit set"
        description={`${filledCount} cards ready`}
      />

      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-6">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Title
          </label>
          <Input
            className="mt-1.5 h-11 border-0 bg-transparent px-0 text-lg font-semibold shadow-none focus:ring-0"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <Input
                className="mt-1"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Subject</label>
              <Input
                className="mt-1"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Cards</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => addCard(true)}>
              <Plus className="size-3.5" /> Add card
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {cardList.map((card, i) => (
              <div
                key={i}
                className={cn(
                  'group grid grid-cols-[auto_1fr_1fr_auto] items-start gap-2 rounded-xl border border-border bg-card p-3 shadow-sm sm:gap-3',
                  removingIndex === i && 'animate-card-dissipate pointer-events-none',
                )}
              >
                <span className="mt-2.5 w-6 text-center text-xs tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <Input
                  ref={(el) => {
                    rowRefs.current[i * 2] = el
                  }}
                  placeholder="Term"
                  value={card.term}
                  onChange={(e) => updateCard(i, 'term', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      rowRefs.current[i * 2 + 1]?.focus()
                    }
                  }}
                  className="font-medium"
                />
                <Input
                  ref={(el) => {
                    rowRefs.current[i * 2 + 1] = el
                  }}
                  placeholder="Definition"
                  value={card.definition}
                  onChange={(e) => updateCard(i, 'definition', e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' ||
                      (e.key === 'Tab' && !e.shiftKey && i === cardList.length - 1)
                    ) {
                      e.preventDefault()
                      if (i === cardList.length - 1) addCard(true)
                      else rowRefs.current[(i + 1) * 2]?.focus()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeCard(i)}
                  disabled={cardList.length <= 1}
                  className="mt-1 rounded-md p-2 text-muted-foreground transition-opacity hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-0"
                  aria-label="Remove card"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {cardList.length > 0 ? (
        <div className="sticky bottom-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
            <p className="text-xs text-muted-foreground">
              {filledCount} card{filledCount !== 1 ? 's' : ''}
            </p>
            <Button onClick={handleSubmit} disabled={filledCount === 0 || saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

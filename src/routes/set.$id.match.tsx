import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Card } from '../../lib/types'
import { shuffle } from '../lib/study-utils'
import { StudyChrome } from '../components/study-chrome'
import { Button } from '../components/ui/button'
import { saveStudySession } from '../../src/lib/actions/study'
import { cn } from '../lib/cn'

export const Route = createFileRoute('/set/$id/match')({
  head: () => ({
    meta: [
      { title: 'Match | Openlet' },
      {
        name: 'description',
        content:
          'Match terms to definitions in a timed game on Openlet. Race the clock to clear the board.',
      },
      { property: 'og:title', content: 'Match | Openlet' },
      {
        property: 'og:description',
        content:
          'Match terms to definitions in a timed game on Openlet. Race the clock to clear the board.',
      },
      { name: 'twitter:title', content: 'Match | Openlet' },
      {
        name: 'twitter:description',
        content:
          'Match terms to definitions in a timed game on Openlet. Race the clock to clear the board.',
      },
    ],
  }),
  beforeLoad: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const session = await getSession()
    if (!session) throw redirect({ to: '/signin' })
  },
  component: MatchPage,
})

type Tile = {
  id: string
  cardId: string
  text: string
  kind: 'term' | 'def'
}

function MatchPage() {
  const { id } = Route.useParams()
  const [cards, setCards] = useState<Card[]>([])
  const [tiles, setTiles] = useState<Tile[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [mistakes, setMistakes] = useState(0)

  const buildTiles = useCallback((source: Card[]) => {
    const subset = shuffle(source).slice(0, Math.min(6, source.length))
    const next: Tile[] = []
    for (const c of subset) {
      next.push({ id: `${c.id}-t`, cardId: c.id, text: c.term, kind: 'term' })
      next.push({ id: `${c.id}-d`, cardId: c.id, text: c.definition, kind: 'def' })
    }
    setTiles(shuffle(next))
    setSelected(null)
    setMatched(new Set())
    setWrong(new Set())
    setMistakes(0)
    setDone(false)
    setStartedAt(Date.now())
    setElapsed(0)
  }, [])

  useEffect(() => {
    fetch(`/api/sets/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.cards || []
        setCards(list)
        if (list.length) buildTiles(list)
        setLoading(false)
      })
  }, [id, buildTiles])

  useEffect(() => {
    if (!startedAt || done) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 200)
    return () => clearInterval(t)
  }, [startedAt, done])

  const pairCount = useMemo(() => tiles.length / 2, [tiles.length])
  const matchedPairs = matched.size / 2
  const progress = pairCount > 0 ? (matchedPairs / pairCount) * 100 : 0

  function select(tileId: string) {
    if (matched.has(tileId) || wrong.has(tileId) || done) return
    if (!selected) {
      setSelected(tileId)
      return
    }
    if (selected === tileId) {
      setSelected(null)
      return
    }

    const a = tiles.find((t) => t.id === selected)!
    const b = tiles.find((t) => t.id === tileId)!

    if (a.cardId === b.cardId && a.kind !== b.kind) {
      const next = new Set(matched)
      next.add(a.id)
      next.add(b.id)
      setMatched(next)
      setSelected(null)
      if (next.size === tiles.length) {
        setDone(true)
        const seconds = Math.floor((Date.now() - (startedAt || Date.now())) / 1000)
        setElapsed(seconds)
        saveStudySession({
          data: {
            setId: id,
            mode: 'match',
            correct: pairCount,
            total: pairCount + mistakes,
          },
        }).catch(() => {})
      }
    } else {
      setWrong(new Set([a.id, b.id]))
      setMistakes((m) => m + 1)
      setSelected(null)
      setTimeout(() => setWrong(new Set()), 450)
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (cards.length < 2) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        Need at least 2 cards to play Match.{' '}
        <a href={`/set/${id}`} className="font-semibold text-primary hover:underline">
          Back
        </a>
      </div>
    )
  }

  if (done) {
    return (
      <StudyChrome backHref={`/set/${id}`} title="Match">
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <p className="text-4xl font-bold tabular-nums text-primary">{formatTime(elapsed)}</p>
          <p className="mt-3 text-base font-semibold text-foreground">Board cleared</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pairCount} pairs · {mistakes} miss{mistakes !== 1 ? 'es' : ''}
          </p>
          <div className="mt-8 flex gap-2">
            <Button onClick={() => buildTiles(cards)}>Play again</Button>
            <a href={`/set/${id}`}>
              <Button variant="outline">Back to set</Button>
            </a>
          </div>
        </div>
      </StudyChrome>
    )
  }

  return (
    <StudyChrome
      backHref={`/set/${id}`}
      title="Match"
      progress={progress}
      progressLabel={`${formatTime(elapsed)} · ${matchedPairs}/${pairCount}`}
      right={
        <Button variant="ghost" size="sm" onClick={() => buildTiles(cards)}>
          Restart
        </Button>
      }
    >
      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 content-center">
        {tiles.map((tile) => {
          const isMatched = matched.has(tile.id)
          const isWrong = wrong.has(tile.id)
          const isSelected = selected === tile.id
          return (
            <button
              key={tile.id}
              type="button"
              disabled={isMatched}
              onClick={() => select(tile.id)}
              className={cn(
                'min-h-[88px] rounded-xl border p-3 text-left text-sm font-medium transition-all sm:min-h-[100px] sm:p-4',
                isMatched &&
                  'border-[var(--success)]/30 bg-[color-mix(in_oklab,var(--success)_10%,transparent)] text-[var(--success)] opacity-70',
                isWrong &&
                  'border-destructive bg-destructive/10 text-destructive animate-match-pop',
                isSelected && !isMatched && 'border-primary bg-primary/5 ring-2 ring-primary/30',
                !isMatched &&
                  !isWrong &&
                  !isSelected &&
                  'border-border bg-card hover:border-primary/30 hover:bg-muted/40',
              )}
            >
              <span className="mb-1 block text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {tile.kind === 'term' ? 'Term' : 'Def'}
              </span>
              <span className="line-clamp-4 leading-snug">{tile.text}</span>
            </button>
          )
        })}
      </div>
    </StudyChrome>
  )
}

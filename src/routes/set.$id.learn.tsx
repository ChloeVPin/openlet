import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState, useCallback, useRef } from 'react'
import { saveStudySession } from '../../src/lib/actions/study'
import { createCardMetadata, reviewCard } from '../../lib/fsrs'
import type { Card, FSRSCardMetadata } from '../../lib/types'
import { isCardDue } from '../lib/study-utils'
import { Flashcard } from '../components/flashcard'
import { StudyChrome, StudyDone } from '../components/study-chrome'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/set/$id/learn')({
  head: () => ({
    meta: [
      { title: 'Learn | Openlet' },
      {
        name: 'description',
        content:
          'Learn flashcards with FSRS spaced repetition on Openlet. Cards you miss return sooner for better retention.',
      },
      { property: 'og:title', content: 'Learn | Openlet' },
      {
        property: 'og:description',
        content:
          'Learn flashcards with FSRS spaced repetition on Openlet. Cards you miss return sooner for better retention.',
      },
      { name: 'twitter:title', content: 'Learn | Openlet' },
      {
        name: 'twitter:description',
        content:
          'Learn flashcards with FSRS spaced repetition on Openlet. Cards you miss return sooner for better retention.',
      },
    ],
  }),
  beforeLoad: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const session = await getSession()
    if (!session) throw redirect({ to: '/signin' })
  },
  component: LearnPage,
})

interface FSRSCard extends Card {
  metadata: FSRSCardMetadata
}

function LearnPage() {
  const { id } = Route.useParams()
  const [cards, setCards] = useState<FSRSCard[]>([])
  const [queue, setQueue] = useState<FSRSCard[]>([])
  const [current, setCurrent] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const queueRef = useRef<FSRSCard[]>([])
  const currentRef = useRef(0)
  const correctRef = useRef(0)
  const totalRef = useRef(0)
  const cardsRef = useRef<FSRSCard[]>([])
  /** Track which cards were actually rated this session to avoid N+1 saves */
  const modifiedCardIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      fetch(`/api/sets/${id}`).then((r) => r.json()),
      fetch(`/api/card-metadata?setId=${id}`)
        .then((r) => r.json())
        .catch(() => ({ metadata: [] })),
    ]).then(([setData, metaData]) => {
      const metaEntries: [string, FSRSCardMetadata & { cardId?: string }][] = (
        metaData.metadata || []
      ).map((m: FSRSCardMetadata & { cardId: string }) => [m.cardId, m])
      const metaMap = new Map(metaEntries)
      const fsrsCards: FSRSCard[] = (setData.cards || []).map((c: Card) => {
        const saved = metaMap.get(c.id)
        return {
          ...c,
          metadata: saved
            ? {
                stability: saved.stability,
                difficulty: saved.difficulty,
                elapsedDays: saved.elapsedDays,
                scheduledDays: saved.scheduledDays,
                reps: saved.reps,
                lapses: saved.lapses,
                lastReview: saved.lastReview,
              }
            : createCardMetadata(),
        }
      })

      // Prefer due cards first, then new, then the rest
      const due = fsrsCards.filter((c) => isCardDue(c.metadata))
      const rest = fsrsCards.filter((c) => !isCardDue(c.metadata))
      const ordered = [
        ...due.sort(() => Math.random() - 0.5),
        ...rest.sort(() => Math.random() - 0.5),
      ]
      // Cap session size for focus
      const session = ordered.slice(0, Math.min(ordered.length, 40))

      setCards(fsrsCards)
      cardsRef.current = fsrsCards
      setQueue(session)
      queueRef.current = session
      setLoading(false)
    })
  }, [id])

  const saveMetadata = useCallback(
    async (cardId: string, metadata: FSRSCardMetadata) => {
      try {
        await fetch('/api/card-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId, setId: id, ...metadata }),
        })
      } catch {
        /* best effort */
      }
    },
    [id],
  )

  const finish = useCallback(async () => {
    setDone(true)
    await saveStudySession({
      data: { setId: id, mode: 'learn', correct: correctRef.current, total: totalRef.current },
    })
    // Only save metadata for cards that were actually rated this session
    const modified = cardsRef.current.filter((c) => modifiedCardIds.current.has(c.id))
    if (modified.length > 0) {
      await Promise.all(modified.map((c) => saveMetadata(c.id, c.metadata)))
    }
  }, [id, saveMetadata])

  const handleAnswer = useCallback(
    (grade: string) => {
      const q = queueRef.current
      const idx = currentRef.current
      const card = q[idx]
      if (!card) return
      const { metadata } = reviewCard(card.metadata, grade)
      const isCorrect = grade === 'good' || grade === 'easy'

      card.metadata = metadata
      modifiedCardIds.current.add(card.id)
      // Keep master list in sync
      const master = cardsRef.current.find((c) => c.id === card.id)
      if (master) master.metadata = metadata

      correctRef.current += isCorrect ? 1 : 0
      totalRef.current += 1
      setCorrect(correctRef.current)
      setTotal(totalRef.current)
      setFlipped(false)

      if (!isCorrect) {
        q.push({ ...card, metadata: { ...metadata } })
      }

      if (idx + 1 >= q.length) {
        finish()
      } else {
        currentRef.current = idx + 1
        setCurrent(currentRef.current)
      }
    },
    [finish],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || loading || !flipped) {
        if (!done && !loading && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault()
          setFlipped(true)
        }
        return
      }
      if (e.key === '1') handleAnswer('again')
      if (e.key === '2') handleAnswer('hard')
      if (e.key === '3') handleAnswer('good')
      if (e.key === '4') handleAnswer('easy')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, loading, flipped, handleAnswer])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (!cards.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        No cards in this set
      </div>
    )
  }

  if (done) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    return (
      <StudyChrome backHref={`/set/${id}`} title="Learn">
        <StudyDone
          percent={pct}
          correct={correct}
          total={total}
          subtitle={
            pct >= 80
              ? 'Strong session. Next review is scheduled for you.'
              : 'Missed cards will show up sooner. That’s the point.'
          }
          primaryHref={`/set/${id}/learn`}
          primaryLabel="Study again"
          secondaryHref={`/set/${id}`}
          secondaryLabel="Back to set"
        />
      </StudyChrome>
    )
  }

  const card = queue[current]
  if (!card) return null
  const remaining = queue.length - current
  const progress = (total / (total + remaining)) * 100

  return (
    <StudyChrome
      backHref={`/set/${id}`}
      title="Learn"
      progress={progress}
      progressLabel={`${total + 1} · ${remaining} left`}
      footer={
        flipped ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              className="h-12 rounded-xl border-2 border-[#fecaca] bg-[#fef2f2] text-sm font-bold text-[#e11d48] outline-none hover:bg-[#fee2e2]"
              onClick={() => handleAnswer('again')}
            >
              Again
            </button>
            <button
              type="button"
              className="h-12 rounded-xl border-2 border-[#fed7aa] bg-[#fff7ed] text-sm font-bold text-[#c2410c] outline-none hover:bg-[#ffedd5]"
              onClick={() => handleAnswer('hard')}
            >
              Hard
            </button>
            <button
              type="button"
              className="h-12 rounded-xl border-2 border-[#bbf7d0] bg-[#f0fdf4] text-sm font-bold text-[#15803d] outline-none hover:bg-[#dcfce7]"
              onClick={() => handleAnswer('good')}
            >
              Good
            </button>
            <button
              type="button"
              className="h-12 rounded-xl border-2 border-[#c7d2fe] bg-[#eef0ff] text-sm font-bold text-[#4255ff] outline-none hover:bg-[#e0e4ff]"
              onClick={() => handleAnswer('easy')}
            >
              Easy
            </button>
          </div>
        ) : (
          <p className="text-center text-xs font-semibold text-[#7c84a0]">
            Flip the card, then rate how well you knew it
          </p>
        )
      }
    >
      <div key={card.id} className="animate-slide-in-right flex flex-1 flex-col justify-center">
        <Flashcard
          term={card.term}
          definition={card.definition}
          flipped={flipped}
          onFlip={() => !flipped && setFlipped(true)}
        />
      </div>
    </StudyChrome>
  )
}

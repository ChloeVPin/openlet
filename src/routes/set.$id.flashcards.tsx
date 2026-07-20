import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback, useEffect, useState, useRef } from 'react'
import { Shuffle, ArrowLeftRight } from 'lucide-react'
import type { Card } from '../../lib/types'
import { shuffle } from '../lib/study-utils'
import { Flashcard } from '../components/flashcard'
import { CardSlider, type CardSliderControls } from '../components/card-slider'
import { StudyChrome, StudyDone } from '../components/study-chrome'
import { Button } from '../components/ui/button'
import { Tooltip } from '../components/ui/tooltip'
import { saveStudySession } from '../../src/lib/actions/study'

export const Route = createFileRoute('/set/$id/flashcards')({
  head: () => ({
    meta: [
      { title: 'Flashcards | Openlet' },
      {
        name: 'description',
        content:
          'Review flashcards with Openlet. Flip through terms and definitions at your own pace.',
      },
      { property: 'og:title', content: 'Flashcards | Openlet' },
      {
        property: 'og:description',
        content:
          'Review flashcards with Openlet. Flip through terms and definitions at your own pace.',
      },
      { name: 'twitter:title', content: 'Flashcards | Openlet' },
      {
        name: 'twitter:description',
        content:
          'Review flashcards with Openlet. Flip through terms and definitions at your own pace.',
      },
    ],
  }),
  beforeLoad: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const session = await getSession()
    if (!session) throw redirect({ to: '/signin' })
  },
  component: FlashcardsPage,
})

function FlashcardsPage() {
  const { id } = Route.useParams()
  const [cards, setCards] = useState<Card[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [termFirst, setTermFirst] = useState(true)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [seen, setSeen] = useState(0)
  const [sliderApi, setSliderApi] = useState<CardSliderControls | null>(null)
  /** Guard against duplicate session saves when navigating back to the last card */
  const sessionSavedRef = useRef(false)

  useEffect(() => {
    fetch(`/api/sets/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setCards(shuffle(d.cards || []))
        setLoading(false)
      })
  }, [id])

  const handleIndexChange = useCallback(
    (next: number) => {
      setIndex(next)
      setFlipped(false)
      setSeen((s) => Math.max(s, next + 1))
      if (next >= cards.length - 1 && !sessionSavedRef.current) {
        sessionSavedRef.current = true
        setDone(true)
        saveStudySession({
          data: { setId: id, mode: 'flashcards', correct: cards.length, total: cards.length },
        }).catch(() => {})
      }
    },
    [cards.length, id],
  )

  useEffect(() => {
    if (done || loading) return
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault()
        sliderApi?.go(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault()
        sliderApi?.go(-1)
      } else if (e.key === 's') {
        e.preventDefault()
        setCards((c) => shuffle(c))
        setIndex(0)
        setFlipped(false)
        setSeen(1)
        setDone(false)
        sessionSavedRef.current = false
      } else if (e.key === 't') {
        e.preventDefault()
        setTermFirst((v) => !v)
        setFlipped(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, loading, sliderApi])

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
        No cards in this set.{' '}
        <a href={`/set/${id}`} className="font-semibold text-primary hover:underline">
          Back
        </a>
      </div>
    )
  }

  if (done) {
    return (
      <StudyChrome backHref={`/set/${id}`} title="Flashcards">
        <StudyDone
          percent={100}
          correct={cards.length}
          total={cards.length}
          subtitle="You reviewed every card in this set."
          primaryHref={`/set/${id}/flashcards`}
          primaryLabel="Study again"
          secondaryHref={`/set/${id}`}
          secondaryLabel="Back to set"
        />
      </StudyChrome>
    )
  }

  const progress = ((index + 1) / cards.length) * 100

  return (
    <StudyChrome
      backHref={`/set/${id}`}
      title="Flashcards"
      progress={progress}
      progressLabel={`${index + 1} / ${cards.length}`}
      right={
        <div className="hidden items-center gap-1 sm:flex">
          <Tooltip label="Shuffle (S)" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Shuffle"
              onClick={() => {
                setCards((c) => shuffle(c))
                setIndex(0)
                setFlipped(false)
                setSeen(1)
                setDone(false)
                sessionSavedRef.current = false
              }}
            >
              <Shuffle className="size-4" />
            </Button>
          </Tooltip>
          <Tooltip label="Swap sides (T)" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Swap term and definition"
              onClick={() => {
                setTermFirst((v) => !v)
                setFlipped(false)
              }}
            >
              <ArrowLeftRight className="size-4" />
            </Button>
          </Tooltip>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => sliderApi?.go(-1)}
            disabled={index === 0 || sliderApi?.busy}
          >
            Previous
          </Button>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Space flip · Arrow keys navigate · S shuffle · T swap
          </p>
          <Button
            onClick={() => sliderApi?.go(1)}
            disabled={index >= cards.length - 1 || sliderApi?.busy}
          >
            {index >= cards.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-1 flex-col justify-center">
        <CardSlider
          index={index}
          count={cards.length}
          onIndexChange={handleIndexChange}
          onApiChange={setSliderApi}
          controls={(api) => {
            return (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Seen {seen} of {cards.length}
              </p>
            )
          }}
        >
          {(i) => (
            <Flashcard
              term={cards[i].term}
              definition={cards[i].definition}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
              termFirst={termFirst}
            />
          )}
        </CardSlider>
      </div>
    </StudyChrome>
  )
}

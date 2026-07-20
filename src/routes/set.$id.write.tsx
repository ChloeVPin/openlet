import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Card } from '../../lib/types'
import { answersMatch, shuffle } from '../lib/study-utils'
import { StudyChrome, StudyDone } from '../components/study-chrome'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { saveStudySession } from '../../src/lib/actions/study'

export const Route = createFileRoute('/set/$id/write')({
  head: () => ({
    meta: [
      { title: 'Write | Openlet' },
      {
        name: 'description',
        content: 'Practice flashcards by typing answers from memory with Openlet Write mode.',
      },
      { property: 'og:title', content: 'Write | Openlet' },
      {
        property: 'og:description',
        content: 'Practice flashcards by typing answers from memory with Openlet Write mode.',
      },
      { name: 'twitter:title', content: 'Write | Openlet' },
      {
        name: 'twitter:description',
        content: 'Practice flashcards by typing answers from memory with Openlet Write mode.',
      },
    ],
  }),
  beforeLoad: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const session = await getSession()
    if (!session) throw redirect({ to: '/signin' })
  },
  component: WritePage,
})

type Phase = 'answer' | 'feedback'

function WritePage() {
  const { id } = Route.useParams()
  const [queue, setQueue] = useState<Card[]>([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [phase, setPhase] = useState<Phase>('answer')
  const [wasCorrect, setWasCorrect] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [termFirst, setTermFirst] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const correctRef = useRef(0)
  const totalRef = useRef(0)

  useEffect(() => {
    fetch(`/api/sets/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setQueue(shuffle(d.cards || []))
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (phase === 'answer' && !done) inputRef.current?.focus()
  }, [phase, index, done])

  const finish = useCallback(async () => {
    setDone(true)
    await saveStudySession({
      data: { setId: id, mode: 'write', correct: correctRef.current, total: totalRef.current },
    })
  }, [id])

  const check = useCallback(() => {
    const card = queue[index]
    if (!card || phase !== 'answer') return
    const expected = termFirst ? card.definition : card.term
    const ok = answersMatch(answer, expected)
    setWasCorrect(ok)
    totalRef.current += 1
    if (ok) correctRef.current += 1
    setCorrect(correctRef.current)
    setTotal(totalRef.current)
    setPhase('feedback')
  }, [queue, index, phase, answer, termFirst])

  const next = useCallback(() => {
    if (index + 1 >= queue.length) {
      finish()
      return
    }
    setIndex((i) => i + 1)
    setAnswer('')
    setPhase('answer')
  }, [index, queue.length, finish])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || loading) return
      if (phase === 'feedback' && e.key === 'Enter') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, loading, phase, next])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (!queue.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        No cards in this set
      </div>
    )
  }

  if (done) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    return (
      <StudyChrome backHref={`/set/${id}`} title="Write">
        <StudyDone
          percent={pct}
          correct={correct}
          total={total}
          subtitle="Typed answers with fuzzy grading."
          primaryHref={`/set/${id}/write`}
          primaryLabel="Write again"
          secondaryHref={`/set/${id}`}
          secondaryLabel="Back to set"
        />
      </StudyChrome>
    )
  }

  const card = queue[index]
  const prompt = termFirst ? card.term : card.definition
  const expected = termFirst ? card.definition : card.term
  const progress = ((index + (phase === 'feedback' ? 1 : 0)) / queue.length) * 100

  return (
    <StudyChrome
      backHref={`/set/${id}`}
      title="Write"
      progress={progress}
      progressLabel={`${index + 1} / ${queue.length}`}
      right={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setTermFirst((v) => !v)
            setAnswer('')
            setPhase('answer')
          }}
        >
          Swap sides
        </Button>
      }
      footer={
        phase === 'answer' ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              check()
            }}
          >
            <Input
              ref={inputRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-12 text-base"
            />
            <Button type="submit" className="h-12 px-6" disabled={!answer.trim()}>
              Check
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Enter to continue</p>
            <Button onClick={next}>{index + 1 >= queue.length ? 'Finish' : 'Continue'}</Button>
          </div>
        )
      }
    >
      <div key={index} className="animate-slide-in-right flex flex-1 flex-col justify-center">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {termFirst ? 'Term' : 'Definition'}
          </p>
          <p className="mt-3 text-2xl font-semibold leading-snug text-foreground">{prompt}</p>
        </div>

        {phase === 'feedback' && (
          <div
            className={`mt-4 rounded-xl border p-4 ${
              wasCorrect
                ? 'border-[var(--success)]/30 bg-[color-mix(in_oklab,var(--success)_8%,transparent)]'
                : 'border-destructive/30 bg-destructive/5'
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                wasCorrect ? 'text-[var(--success)]' : 'text-destructive'
              }`}
            >
              {wasCorrect ? 'Correct' : 'Not quite'}
            </p>
            {!wasCorrect && (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your answer: <span className="text-foreground">{answer || '-'}</span>
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">Answer: {expected}</p>
              </>
            )}
          </div>
        )}
      </div>
    </StudyChrome>
  )
}

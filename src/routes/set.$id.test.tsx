import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { saveStudySession } from '../../src/lib/actions/study'
import type { Card, Question } from '../../lib/types'
import { answersMatch, shuffle } from '../lib/study-utils'
import { StudyChrome, StudyDone } from '../components/study-chrome'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { cn } from '../lib/cn'

export const Route = createFileRoute('/set/$id/test')({
  head: () => ({
    meta: [
      { title: 'Practice test | Openlet' },
      {
        name: 'description',
        content:
          'Take a practice test on Openlet with multiple choice, true/false, and written questions.',
      },
      { property: 'og:title', content: 'Practice test | Openlet' },
      {
        property: 'og:description',
        content:
          'Take a practice test on Openlet with multiple choice, true/false, and written questions.',
      },
      { name: 'twitter:title', content: 'Practice test | Openlet' },
      {
        name: 'twitter:description',
        content:
          'Take a practice test on Openlet with multiple choice, true/false, and written questions.',
      },
    ],
  }),
  beforeLoad: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const session = await getSession()
    if (!session) throw redirect({ to: '/signin' })
  },
  component: TestPage,
})

function buildSmartQuestions(cards: (Card & { stability: number })[]): Question[] {
  if (cards.length === 0) return []
  // Keep the hardest cards (lowest stability) first, with a small random jitter
  const jittered = cards
    .map((c) => ({ ...c, score: c.stability + Math.random() * 2 }))
    .sort((a, b) => a.score - b.score)

  return jittered.map((c) => {
    const roll = Math.random()

    if (roll < 0.3 && cards.length >= 2) {
      const other = shuffle(cards.filter((o) => o.id !== c.id))[0]
      const isTrue = Math.random() > 0.5
      const shownDef = isTrue ? c.definition : other.definition
      return {
        cardId: c.id + '-tf',
        term: `“${shownDef}” is the definition of “${c.term}”`,
        answer: isTrue ? 'True' : 'False',
        options: ['True', 'False'],
        type: 'multiple' as const,
      }
    }

    if (roll < 0.7 && cards.length >= 4) {
      const others = shuffle(cards.filter((o) => o.id !== c.id))
        .slice(0, 3)
        .map((o) => o.definition)
      return {
        cardId: c.id,
        term: c.term,
        answer: c.definition,
        options: shuffle([c.definition, ...others]),
        type: 'multiple' as const,
      }
    }

    return {
      cardId: c.id,
      term: c.term,
      answer: c.definition,
      type: 'written' as const,
    }
  })
}

function isCorrect(q: Question, user: string): boolean {
  if (q.type === 'written') return answersMatch(user, q.answer)
  return user.trim().toLowerCase() === q.answer.trim().toLowerCase()
}

function TestPage() {
  const { id } = Route.useParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, string>>(new Map())
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [writtenDraft, setWrittenDraft] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/sets/${id}`).then((r) => r.json()),
      fetch(`/api/card-metadata?setId=${id}`)
        .then((r) => r.json())
        .catch(() => ({ metadata: [] })),
    ]).then(([setData, metaData]) => {
      const metaMap = new Map<string, { stability: number }>(
        (metaData.metadata || []).map((m: any) => [m.cardId, m]),
      )
      const cardsWithMeta = (setData.cards || []).map((c: any) => ({
        ...c,
        stability: metaMap.get(c.id)?.stability ?? 100, // Unreviewed cards go to the back
      }))
      setQuestions(buildSmartQuestions(cardsWithMeta))
      setLoading(false)
    })
  }, [id])

  const score = useMemo(() => {
    if (!submitted) return 0
    return questions.filter((q) => isCorrect(q, answers.get(q.cardId) || '')).length
  }, [submitted, questions, answers])

  function setAnswer(cardId: string, value: string) {
    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(cardId, value)
      return next
    })
  }

  function commitWritten(): Map<string, string> {
    const q = questions[index]
    if (q?.type === 'written' && writtenDraft.trim()) {
      const next = new Map(answers)
      next.set(q.cardId, writtenDraft)
      setAnswers(next)
      return next
    }
    return answers
  }

  function goNext() {
    const nextAnswers = commitWritten()
    if (index + 1 >= questions.length) {
      setSubmitted(true)
      const actual = questions.filter((q) => isCorrect(q, nextAnswers.get(q.cardId) || '')).length
      saveStudySession({
        data: { setId: id, mode: 'test', correct: actual, total: questions.length },
      }).catch(() => {})
      return
    }
    setIndex((i) => i + 1)
    setWrittenDraft('')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        No cards in this set
      </div>
    )
  }

  if (submitted) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <StudyChrome backHref={`/set/${id}`} title="Test results" fullHeight={false}>
        <StudyDone
          percent={pct}
          correct={score}
          total={questions.length}
          primaryHref={`/set/${id}/test`}
          primaryLabel="Retake test"
          secondaryHref={`/set/${id}`}
          secondaryLabel="Back to set"
        />
        <div className="mt-2 space-y-2 pb-10">
          {questions.map((q) => {
            const userAns = answers.get(q.cardId) || ''
            const ok = isCorrect(q, userAns)
            return (
              <div
                key={q.cardId}
                className={cn(
                  'rounded-xl border p-4',
                  ok
                    ? 'border-[var(--success)]/30 bg-[color-mix(in_oklab,var(--success)_6%,transparent)]'
                    : 'border-destructive/30 bg-destructive/5',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{q.term}</p>
                  <span
                    className={cn(
                      'shrink-0 text-xs font-semibold',
                      ok ? 'text-[var(--success)]' : 'text-destructive',
                    )}
                  >
                    {ok ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your answer: {userAns || <span className="italic">skipped</span>}
                </p>
                {!ok && (
                  <p className="mt-1 text-sm font-medium text-foreground">Answer: {q.answer}</p>
                )}
              </div>
            )
          })}
        </div>
      </StudyChrome>
    )
  }

  const q = questions[index]
  const progress = (index / questions.length) * 100
  const isTf = q.options?.includes('True')

  return (
    <StudyChrome
      backHref={`/set/${id}`}
      title="Practice test"
      progress={progress}
      progressLabel={`${index + 1} / ${questions.length}`}
      footer={
        <div className="flex justify-end">
          <Button onClick={goNext} disabled={q.type === 'multiple' && !answers.has(q.cardId)}>
            {index + 1 >= questions.length ? 'Submit' : 'Next'}
          </Button>
        </div>
      }
    >
      <div key={q.cardId} className="animate-slide-in-right flex flex-1 flex-col justify-center">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Question {index + 1}
          <span className="ml-2 font-normal normal-case">
            · {q.type === 'multiple' ? (isTf ? 'True / False' : 'Multiple choice') : 'Written'}
          </span>
        </p>
        <p className="mt-3 text-xl font-semibold leading-snug text-foreground">{q.term}</p>

        {q.type === 'multiple' && q.options ? (
          <div className="mt-6 space-y-2">
            {q.options.map((opt) => {
              const selected = answers.get(q.cardId) === opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswer(q.cardId, opt)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-colors',
                    selected
                      ? 'border-primary bg-primary/5 font-semibold text-foreground'
                      : 'border-border bg-card text-foreground hover:bg-muted/50',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border',
                      selected ? 'border-primary bg-primary' : 'border-border',
                    )}
                  >
                    {selected && <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>
        ) : (
          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault()
              if (writtenDraft.trim()) goNext()
            }}
          >
            <Input
              value={writtenDraft}
              onChange={(e) => setWrittenDraft(e.target.value)}
              placeholder="Type your answer…"
              autoFocus
              className="h-12 text-base"
              autoComplete="off"
              spellCheck={false}
            />
          </form>
        )}
      </div>
    </StudyChrome>
  )
}

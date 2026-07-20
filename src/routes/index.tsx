import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Layers,
  GraduationCap,
  PenLine,
  LayoutGrid,
  FileQuestion,
  ArrowRight,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react'
import { CardSlider, type CardSliderControls } from '../components/card-slider'
import { LogoMark } from '../components/logo'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Openlet | Free flashcards & study tools' },
      {
        name: 'description',
        content:
          'Free flashcards, Learn, Write, Match, and Test with spaced repetition. Open source study tools, no paywall or ads.',
      },
      { property: 'og:title', content: 'Openlet | Free flashcards & study tools' },
      {
        property: 'og:description',
        content:
          'Free flashcards with FSRS spaced repetition, practice tests, matching games, and more. Open source. No paywall, no ads.',
      },
      { name: 'twitter:title', content: 'Openlet | Free flashcards & study tools' },
      {
        name: 'twitter:description',
        content:
          'Free flashcards with FSRS spaced repetition, practice tests, matching games, and more. Open source.',
      },
    ],
  }),
  loader: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const user = await getSession()
    return { user }
  },
  component: Home,
})

const BRAND = '#4255ff'
const BRAND_HOVER = '#3b4ce0'
const PAGE = '#ffffff'
const SOFT = '#f6f7fb'
const INK = '#1a1d26'
const MUTED = '#4a5065'
const LINE = '#e8eaf0'

const DECK = [
  { term: 'mitochondria', def: 'Produces ATP, the powerhouse of the cell' },
  { term: 'nucleus', def: "Holds the cell's genetic material" },
  { term: 'cell membrane', def: 'Controls what enters and leaves the cell' },
  { term: 'enzyme', def: 'Protein that speeds up chemical reactions' },
]

type DemoTab = 'flashcards' | 'learn' | 'write' | 'match' | 'test'

const MODES: { id: DemoTab; icon: LucideIcon; title: string; blurb: string }[] = [
  { id: 'flashcards', icon: Layers, title: 'Flashcards', blurb: 'Review terms your way' },
  { id: 'learn', icon: GraduationCap, title: 'Learn', blurb: 'Spaced repetition' },
  { id: 'write', icon: PenLine, title: 'Write', blurb: 'Type from memory' },
  { id: 'match', icon: LayoutGrid, title: 'Match', blurb: 'Race the clock' },
  { id: 'test', icon: FileQuestion, title: 'Test', blurb: 'Practice exams' },
]

function Shell({
  children,
  className = '',
  narrow,
}: {
  children: React.ReactNode
  className?: string
  narrow?: boolean
}) {
  return (
    <div
      className={`mx-auto w-full px-5 sm:px-8 ${narrow ? 'max-w-3xl' : 'max-w-6xl'} ${className}`}
    >
      {children}
    </div>
  )
}

function Section({
  id,
  soft,
  children,
  className = '',
}: {
  id?: string
  soft?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={`py-16 md:py-20 lg:py-24 ${className}`}
      style={{ backgroundColor: soft ? SOFT : PAGE }}
    >
      {children}
    </section>
  )
}

function Nav() {
  return (
    <header
      className="sticky top-0 z-50 border-b bg-white max-sm:shadow-sm"
      style={{ borderColor: LINE }}
    >
      <Shell className="flex h-14 items-center gap-8">
        <a
          href="/"
          className="flex items-center gap-2 text-[15px] font-bold tracking-tight no-underline"
          style={{ color: INK }}
        >
          <LogoMark size={28} />
          Openlet
        </a>
        <div className="hidden items-center gap-6 md:flex">
          {[
            ['#study', 'Study modes'],
            ['#why', 'Why free'],
            ['https://github.com/chloevpin/openlet', 'GitHub'],
          ].map(([href, label]) => (
            <a
              key={label}
              href={href}
              className="text-sm font-semibold outline-none transition-colors hover:opacity-100"
              style={{ color: MUTED }}
            >
              {label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <a
            href="/signin"
            className="hidden text-sm font-semibold sm:inline"
            style={{ color: MUTED }}
          >
            Log in
          </a>
          <a
            href="/signin"
            className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-bold text-white outline-none"
            style={{ backgroundColor: BRAND }}
          >
            Get started
          </a>
        </div>
      </Shell>
    </header>
  )
}

function HeroCard() {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="w-full">
      <div
        className="mb-3 flex items-center justify-between text-xs font-semibold"
        style={{ color: MUTED }}
      >
        <span>Biology sample</span>
        <span className="tabular-nums">
          {index + 1} / {DECK.length}
        </span>
      </div>
      <div className="mb-4 h-1 overflow-hidden rounded-full" style={{ backgroundColor: LINE }}>
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${((index + 1) / DECK.length) * 100}%`,
            backgroundColor: BRAND,
          }}
        />
      </div>

      <CardSlider
        index={index}
        count={DECK.length}
        wrap
        onIndexChange={(next) => {
          setIndex(next)
          setFlipped(false)
        }}
        controls={(api) => {
          return (
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => api.go(-1)}
                disabled={api.busy}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white outline-none transition hover:bg-[var(--bg-muted,#f6f7fb)] disabled:opacity-40"
                style={{ borderColor: LINE, color: INK }}
                aria-label="Previous"
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => !api.busy && setFlipped((f) => !f)}
                disabled={api.busy}
                className="inline-flex h-10 items-center rounded-lg px-6 text-sm font-bold text-white outline-none transition hover:opacity-95 disabled:opacity-40"
                style={{ backgroundColor: BRAND }}
              >
                {flipped ? 'Show term' : 'Flip card'}
              </button>
              <button
                type="button"
                onClick={() => api.go(1)}
                disabled={api.busy}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white outline-none transition hover:bg-[var(--bg-muted,#f6f7fb)] disabled:opacity-40"
                style={{ borderColor: LINE, color: INK }}
                aria-label="Next"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          )
        }}
      >
        {(i) => {
          const card = DECK[i]
          const isFlipped = i === index ? flipped : false
          return (
            <div style={{ perspective: '1600px' }}>
              <div
                className="relative w-full"
                style={{
                  height: 280,
                  transformStyle: 'preserve-3d',
                  WebkitTransformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transition: 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white px-8"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    border: `1px solid ${LINE}`,
                    boxShadow:
                      '0 12px 40px -12px rgba(26,29,38,0.12), 0 4px 12px -4px rgba(66,85,255,0.08)',
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: '#7c84a0' }}
                  >
                    Term
                  </p>
                  <p
                    className="font-display mt-4 text-center text-[1.75rem] font-semibold tracking-tight sm:text-[2rem]"
                    style={{ color: INK }}
                  >
                    {card.term}
                  </p>
                </div>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white px-8"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    border: `1px solid ${LINE}`,
                    boxShadow:
                      '0 12px 40px -12px rgba(26,29,38,0.12), 0 4px 12px -4px rgba(66,85,255,0.08)',
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: '#7c84a0' }}
                  >
                    Definition
                  </p>
                  <p
                    className="mt-4 max-w-[28ch] text-center text-lg font-medium leading-snug tracking-tight"
                    style={{ color: INK }}
                  >
                    {card.def}
                  </p>
                </div>
              </div>
            </div>
          )
        }}
      </CardSlider>
    </div>
  )
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundImage: 'url(/images/hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${SOFT}cc 0%, ${PAGE}f2 100%)`,
        }}
      />
      <Shell className="relative grid items-center gap-12 py-14 md:gap-16 md:py-20 lg:grid-cols-2 lg:py-24">
        <div>
          <h1
            className="text-balance text-[2.5rem] font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[3.25rem]"
            style={{ color: INK }}
          >
            How do you want to study?
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed" style={{ color: MUTED }}>
            Master anything with free flashcards, practice tests, and study modes. No ads, no
            upgrade wall.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/signin"
              className="inline-flex h-12 items-center gap-2 rounded-lg px-6 text-sm font-bold text-white outline-none transition hover:opacity-95"
              style={{ backgroundColor: BRAND }}
            >
              Get started
              <ArrowRight className="size-4" />
            </a>
            <a
              href="#study"
              className="inline-flex h-12 items-center rounded-lg border bg-white px-6 text-sm font-bold outline-none transition hover:bg-[#fafafa]"
              style={{ borderColor: LINE, color: INK }}
            >
              Try a study mode
            </a>
          </div>
          <p className="mt-6 text-sm font-medium" style={{ color: '#8b92a8' }}>
            Free forever &middot; Open source &middot; FSRS spaced repetition
          </p>
        </div>
        <HeroCard />
      </Shell>
    </section>
  )
}

function Study() {
  const [tab, setTab] = useState<DemoTab>('flashcards')

  return (
    <Section id="study" soft>
      <Shell>
        <div className="max-w-2xl">
          <h2
            className="text-balance text-3xl font-extrabold tracking-[-0.03em] md:text-[2.125rem]"
            style={{ color: INK }}
          >
            Every tool you need to own your next test
          </h2>
          <p className="mt-3 text-base leading-relaxed" style={{ color: MUTED }}>
            Five study modes. Nothing locked. Switch tabs and try each one on a short biology set.
          </p>
        </div>

        <div
          className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
          role="tablist"
          aria-label="Study modes"
        >
          {MODES.map((m) => {
            const active = tab === m.id
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(m.id)}
                className="flex flex-col items-start rounded-xl px-4 py-4 text-left outline-none transition"
                style={{
                  backgroundColor: active ? BRAND : PAGE,
                  color: active ? '#fff' : INK,
                  border: `1px solid ${active ? BRAND : LINE}`,
                  boxShadow: active ? '0 8px 24px -8px rgba(66,85,255,0.45)' : 'none',
                }}
              >
                <m.icon
                  className="size-5"
                  strokeWidth={2.25}
                  style={{ color: active ? '#fff' : BRAND }}
                />
                <span className="mt-3 text-sm font-bold">{m.title}</span>
                <span
                  className="mt-0.5 text-xs font-medium"
                  style={{ color: active ? 'rgba(255,255,255,0.75)' : MUTED }}
                >
                  {m.blurb}
                </span>
              </button>
            )
          })}
        </div>

        <div
          className="mt-3 rounded-2xl bg-white px-5 py-8 sm:px-10 sm:py-10"
          style={{
            border: `1px solid ${LINE}`,
            boxShadow: '0 4px 24px -8px rgba(26,29,38,0.06)',
          }}
        >
          {tab === 'flashcards' && <DemoFlashcards />}
          {tab === 'learn' && <DemoLearn />}
          {tab === 'write' && <DemoWrite />}
          {tab === 'match' && <DemoMatch />}
          {tab === 'test' && <DemoTest />}
        </div>
      </Shell>
    </Section>
  )
}

function DemoFlashcards() {
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-3 flex justify-between text-xs font-semibold" style={{ color: MUTED }}>
        <span>Flashcards</span>
        <span className="tabular-nums">
          {i + 1} / {DECK.length}
        </span>
      </div>
      <div className="mb-4 h-1 overflow-hidden rounded-full" style={{ backgroundColor: LINE }}>
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${((i + 1) / DECK.length) * 100}%`, backgroundColor: BRAND }}
        />
      </div>

      <CardSlider
        index={i}
        count={DECK.length}
        wrap
        onIndexChange={(next) => {
          setI(next)
          setFlipped(false)
        }}
        controls={(api) => {
          return (
            <div className="mt-5 flex justify-center gap-2">
              <ControlBtn onClick={() => api.go(-1)} aria-label="Previous">
                <ArrowLeft className="size-4" />
              </ControlBtn>
              <button
                type="button"
                onClick={() => !api.busy && setFlipped((f) => !f)}
                disabled={api.busy}
                className="h-10 rounded-lg px-5 text-sm font-bold text-white outline-none disabled:opacity-40"
                style={{ backgroundColor: BRAND }}
              >
                {flipped ? 'Show term' : 'Flip'}
              </button>
              <ControlBtn onClick={() => api.go(1)} aria-label="Next">
                <ArrowRight className="size-4" />
              </ControlBtn>
            </div>
          )
        }}
      >
        {(idx) => {
          const card = DECK[idx]
          const isFlipped = idx === i ? flipped : false
          return (
            <div style={{ perspective: '1400px' }}>
              <div
                className="relative w-full"
                style={{
                  height: 220,
                  transformStyle: 'preserve-3d',
                  WebkitTransformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-xl px-6"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    backgroundColor: SOFT,
                    border: `1px solid ${LINE}`,
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: '#7c84a0' }}
                  >
                    Term
                  </p>
                  <p className="font-display mt-3 text-2xl font-semibold" style={{ color: INK }}>
                    {card.term}
                  </p>
                </div>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-xl px-6"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    backgroundColor: PAGE,
                    border: `1px solid ${LINE}`,
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: '#7c84a0' }}
                  >
                    Definition
                  </p>
                  <p
                    className="mt-3 text-center text-base font-medium leading-snug"
                    style={{ color: MUTED }}
                  >
                    {card.def}
                  </p>
                </div>
              </div>
            </div>
          )
        }}
      </CardSlider>
    </div>
  )
}

function ControlBtn({
  children,
  onClick,
  ...rest
}: {
  children: React.ReactNode
  onClick: () => void
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white outline-none transition hover:bg-[#fafafa]"
      style={{ borderColor: LINE, color: INK }}
      {...rest}
    >
      {children}
    </button>
  )
}

function DemoLearn() {
  const [queue, setQueue] = useState(() => DECK.map((c, id) => ({ ...c, id })))
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)
  const [finished, setFinished] = useState(false)
  const card = queue[0]

  function rate(knew: boolean) {
    if (!flipped || !card) return
    setDone((d) => d + 1)
    setFlipped(false)
    const rest = queue.slice(1)
    if (!knew) rest.push(card)
    if (!rest.length) {
      setFinished(true)
      setQueue([])
      return
    }
    setQueue(rest)
  }

  function restart() {
    setQueue(DECK.map((c, id) => ({ ...c, id })))
    setFlipped(false)
    setDone(0)
    setFinished(false)
  }

  if (finished) {
    return (
      <EmptyDone
        title="Session complete"
        sub={`${done} cards reviewed`}
        action="Study again"
        onAction={restart}
      />
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-3 flex justify-between text-sm">
        <span className="font-semibold" style={{ color: INK }}>
          Learn
        </span>
        <span style={{ color: MUTED }}>
          {queue.length} left &middot; {done} done
        </span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: LINE }}>
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${(done / Math.max(done + queue.length, 1)) * 100}%`,
            backgroundColor: BRAND,
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => !flipped && setFlipped(true)}
        onMouseDown={(e) => e.preventDefault()}
        className="w-full rounded-xl px-5 py-10 text-center outline-none"
        style={{ backgroundColor: SOFT, border: `1px solid ${LINE}` }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: '#7c84a0' }}
        >
          {flipped ? 'Definition' : 'Term'}
        </p>
        <p
          className={`mt-3 font-semibold ${flipped ? 'text-lg' : 'font-display text-2xl'}`}
          style={{ color: INK }}
        >
          {flipped ? card.def : card.term}
        </p>
        {!flipped && (
          <p className="mt-4 text-xs" style={{ color: '#7c84a0' }}>
            Reveal, then rate yourself
          </p>
        )}
      </button>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(['Again', 'Hard', 'Good', 'Easy'] as const).map((label, idx) => (
          <button
            key={label}
            type="button"
            disabled={!flipped}
            onClick={() => rate(idx >= 2)}
            className="rounded-lg border py-2.5 text-xs font-bold outline-none transition enabled:hover:bg-[#fafafa] disabled:opacity-35"
            style={{ borderColor: LINE, color: INK }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function DemoWrite() {
  const [i, setI] = useState(0)
  const [value, setValue] = useState('')
  const [phase, setPhase] = useState<'type' | 'result'>('type')
  const [ok, setOk] = useState(false)
  const [score, setScore] = useState({ ok: 0, n: 0 })
  const card = DECK[i]

  function normalize(s: string) {
    return s
      .trim()
      .toLowerCase()
      .replace(/[\u2018\u2019']/g, "'")
      .replace(/\s+/g, ' ')
  }

  function check() {
    if (!value.trim()) return
    const a = normalize(value)
    const b = normalize(card.def)
    const pass =
      a === b ||
      b.includes(a) ||
      a.split(' ').filter((w) => w.length > 3 && b.includes(w)).length >= 2
    setOk(pass)
    setScore((s) => ({ ok: s.ok + (pass ? 1 : 0), n: s.n + 1 }))
    setPhase('result')
  }

  return (
    <div className="mx-auto max-w-md">
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: '#7c84a0' }}
      >
        Term
      </p>
      <p className="font-display mt-2 text-2xl font-semibold" style={{ color: INK }}>
        {card.term}
      </p>
      {phase === 'type' ? (
        <>
          <label
            htmlFor="write-in"
            className="mt-6 block text-xs font-semibold"
            style={{ color: MUTED }}
          >
            Type the definition
          </label>
          <input
            id="write-in"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                check()
              }
            }}
            placeholder="Your answer&hellip;"
            autoComplete="off"
            spellCheck={false}
            className="mt-2 h-12 w-full rounded-lg border bg-white px-4 text-sm outline-none focus:border-[#4255ff]"
            style={{ borderColor: LINE, color: INK }}
          />
          <button
            type="button"
            onClick={check}
            disabled={!value.trim()}
            className="mt-3 h-11 w-full rounded-lg text-sm font-bold text-white outline-none disabled:opacity-40"
            style={{ backgroundColor: BRAND }}
          >
            Check
          </button>
        </>
      ) : (
        <div className="mt-6">
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: ok ? '#bbf7d0' : '#fecaca',
              backgroundColor: ok ? '#f0fdf4' : '#fef2f2',
              color: ok ? '#166534' : '#991b1b',
            }}
          >
            <p className="font-bold">{ok ? 'Correct' : 'Not quite'}</p>
            {!ok && <p className="mt-1 font-medium">Answer: {card.def}</p>}
          </div>
          <p className="mt-3 text-center text-xs" style={{ color: MUTED }}>
            {score.ok}/{score.n} correct
          </p>
          <button
            type="button"
            onClick={() => {
              setI((n) => (n + 1) % DECK.length)
              setValue('')
              setPhase('type')
            }}
            className="mt-3 h-11 w-full rounded-lg text-sm font-bold text-white outline-none"
            style={{ backgroundColor: BRAND }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

type Tile = { id: string; pairId: string; text: string; kind: 'term' | 'def' }

function makeTiles(): Tile[] {
  const tiles: Tile[] = []
  DECK.slice(0, 3).forEach((p, idx) => {
    tiles.push({ id: `t${idx}`, pairId: String(idx), text: p.term, kind: 'term' })
    tiles.push({ id: `d${idx}`, pairId: String(idx), text: p.def, kind: 'def' })
  })
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[tiles[i], tiles[j]] = [tiles[j], tiles[i]]
  }
  return tiles
}

function DemoMatch() {
  const [tiles, setTiles] = useState(makeTiles)
  const [sel, setSel] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState<Set<string>>(new Set())
  const [misses, setMisses] = useState(0)
  const done = matched.size === tiles.length && tiles.length > 0

  function pick(id: string) {
    if (matched.has(id) || wrong.has(id) || done) return
    if (!sel) {
      setSel(id)
      return
    }
    if (sel === id) {
      setSel(null)
      return
    }
    const a = tiles.find((t) => t.id === sel)!
    const b = tiles.find((t) => t.id === id)!
    if (a.pairId === b.pairId && a.kind !== b.kind) {
      setMatched((m) => new Set([...m, a.id, b.id]))
      setSel(null)
    } else {
      setWrong(new Set([a.id, b.id]))
      setMisses((n) => n + 1)
      setSel(null)
      setTimeout(() => setWrong(new Set()), 400)
    }
  }

  function restart() {
    setTiles(makeTiles())
    setSel(null)
    setMatched(new Set())
    setWrong(new Set())
    setMisses(0)
  }

  if (done) {
    return (
      <EmptyDone
        title="Board clear"
        sub={misses === 0 ? 'Perfect run' : `${misses} miss${misses === 1 ? '' : 'es'}`}
        action="Play again"
        onAction={restart}
      />
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span style={{ color: MUTED }}>Tap two matching tiles</span>
        <button
          type="button"
          onClick={restart}
          className="text-xs font-bold outline-none"
          style={{ color: BRAND }}
        >
          Restart
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((tile) => {
          const isM = matched.has(tile.id)
          const isW = wrong.has(tile.id)
          const isS = sel === tile.id
          return (
            <button
              key={tile.id}
              type="button"
              disabled={isM}
              onClick={() => pick(tile.id)}
              className="min-h-[72px] rounded-xl border px-3 py-3 text-left text-sm font-semibold outline-none transition"
              style={{
                borderColor: isM ? '#bbf7d0' : isW ? '#fecaca' : isS ? BRAND : LINE,
                backgroundColor: isM ? '#f0fdf4' : isW ? '#fef2f2' : isS ? '#eef0ff' : PAGE,
                color: INK,
                opacity: isM ? 0.7 : 1,
                boxShadow: isS ? `0 0 0 2px ${BRAND}33` : 'none',
              }}
            >
              <span
                className="mb-1 block text-[10px] font-bold uppercase tracking-wide"
                style={{ color: '#7c84a0' }}
              >
                {tile.kind === 'term' ? 'Term' : 'Def'}
              </span>
              {tile.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const QUIZ = [
  {
    q: 'What is the powerhouse of the cell?',
    options: ['Nucleus', 'Mitochondria', 'Ribosome'],
    a: 'Mitochondria',
  },
  {
    q: 'What speeds up chemical reactions?',
    options: ['Enzyme', 'Lipid', 'Vacuole'],
    a: 'Enzyme',
  },
  {
    q: 'Where is genetic material stored?',
    options: ['Cell membrane', 'Nucleus', 'Cytoplasm'],
    a: 'Nucleus',
  },
]

function DemoTest() {
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const item = QUIZ[qi]

  function choose(opt: string) {
    if (picked) return
    setPicked(opt)
    if (opt === item.a) setScore((s) => s + 1)
  }

  function next() {
    if (qi + 1 >= QUIZ.length) {
      setFinished(true)
      return
    }
    setQi((n) => n + 1)
    setPicked(null)
  }

  if (finished) {
    return (
      <EmptyDone
        title={`${score}/${QUIZ.length}`}
        sub={score === QUIZ.length ? 'Perfect score' : 'Solid practice'}
        action="Retake"
        onAction={() => {
          setQi(0)
          setPicked(null)
          setScore(0)
          setFinished(false)
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-3 flex justify-between text-xs font-semibold" style={{ color: MUTED }}>
        <span>Multiple choice</span>
        <span className="tabular-nums">
          {qi + 1} / {QUIZ.length}
        </span>
      </div>
      <div className="mb-4 h-1 overflow-hidden rounded-full" style={{ backgroundColor: LINE }}>
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${(qi / QUIZ.length) * 100}%`, backgroundColor: BRAND }}
        />
      </div>
      <p className="text-base font-bold" style={{ color: INK }}>
        {item.q}
      </p>
      <div className="mt-4 space-y-2">
        {item.options.map((opt) => {
          const isP = picked === opt
          const isA = opt === item.a
          let bg = PAGE
          let border = LINE
          if (picked) {
            if (isA) {
              bg = '#f0fdf4'
              border = '#bbf7d0'
            } else if (isP) {
              bg = '#fef2f2'
              border = '#fecaca'
            }
          } else if (isP) {
            bg = '#eef0ff'
            border = BRAND
          }
          return (
            <button
              key={opt}
              type="button"
              disabled={!!picked}
              onClick={() => choose(opt)}
              className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm outline-none transition"
              style={{ backgroundColor: bg, borderColor: border, color: INK }}
            >
              <span
                className="size-4 shrink-0 rounded-full border"
                style={{
                  borderColor: picked && isA ? '#16a34a' : isP ? BRAND : LINE,
                  backgroundColor:
                    (picked && isA) || isP ? (isA && picked ? '#16a34a' : BRAND) : 'transparent',
                }}
              />
              {opt}
            </button>
          )
        })}
      </div>
      {picked && (
        <button
          type="button"
          onClick={next}
          className="mt-4 h-11 w-full rounded-lg text-sm font-bold text-white outline-none"
          style={{ backgroundColor: BRAND }}
        >
          {qi + 1 >= QUIZ.length ? 'See results' : 'Next'}
        </button>
      )}
    </div>
  )
}

function EmptyDone({
  title,
  sub,
  action,
  onAction,
}: {
  title: string
  sub: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
      <p className="text-2xl font-extrabold tracking-tight" style={{ color: INK }}>
        {title}
      </p>
      <p className="mt-2 text-sm" style={{ color: MUTED }}>
        {sub}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="mt-6 h-10 rounded-lg px-5 text-sm font-bold text-white outline-none"
        style={{ backgroundColor: BRAND }}
      >
        {action}
      </button>
    </div>
  )
}

function Why() {
  const points = [
    {
      title: 'Modes stay free',
      body: 'Flashcards, Learn, Write, Match, and Test. Unlocked. You get the product, not a teaser.',
    },
    {
      title: 'Memory that compounds',
      body: 'Learn uses FSRS so hard cards return sooner and easy ones wait. Less grind, more retention.',
    },
    {
      title: 'Your decks, your rules',
      body: 'Import from CSV or paste. Export anytime. MIT source if you want to self-host.',
    },
  ]
  return (
    <Section id="why">
      <Shell>
        <div className="grid items-start gap-8 sm:gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2
              className="text-balance text-3xl font-extrabold tracking-[-0.03em] md:text-[2.125rem]"
              style={{ color: INK }}
            >
              Built to replace the paywall
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: MUTED }}>
              Serious study tools without a subscription on every mode.
            </p>
            <a
              href="/signin"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg px-6 text-sm font-bold text-white outline-none"
              style={{ backgroundColor: BRAND }}
            >
              Get started
              <ArrowRight className="size-4" />
            </a>
          </div>
          <div className="grid gap-6 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-1 lg:gap-0">
            {points.map((p, i) => (
              <div
                key={p.title}
                className="lg:flex lg:gap-6 lg:py-6"
                style={{
                  borderTop: i === 0 ? undefined : `1px solid ${LINE}`,
                  paddingTop: i === 0 ? undefined : '1.5rem',
                }}
              >
                <div className="lg:flex-1">
                  <h3 className="text-[15px] font-bold" style={{ color: INK }}>
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Shell>
    </Section>
  )
}

function Cta() {
  return (
    <section style={{ backgroundColor: BRAND }}>
      <Shell className="flex flex-col items-start justify-between gap-8 py-14 md:flex-row md:items-center md:py-16">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Ready for your next exam?
          </h2>
          <p className="mt-2 text-base text-white/80">
            Free account. Full modes. About a minute to start.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/signin"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-sm font-bold outline-none"
            style={{ color: BRAND }}
          >
            Get started
            <ArrowRight className="size-4" />
          </a>
          <a
            href="https://github.com/chloevpin/openlet"
            className="inline-flex h-12 items-center rounded-lg border border-white/30 px-6 text-sm font-bold text-white outline-none hover:bg-white/10"
          >
            View source
          </a>
        </div>
      </Shell>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ backgroundColor: '#0b0d17' }}>
      <Shell className="flex flex-col gap-8 py-10 text-center md:flex-row md:items-start md:justify-between md:text-left">
        <div className="mx-auto max-w-xs md:mx-0">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-[15px] font-bold text-white no-underline"
          >
            <LogoMark size={28} />
            Openlet
          </a>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            Free open-source study tools for students.
          </p>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-white/55 md:justify-start">
          <a href="#study" className="hover:text-white">
            Study modes
          </a>
          <a href="#why" className="hover:text-white">
            Why free
          </a>
          <a href="/signin" className="hover:text-white">
            Get started
          </a>
          <a href="/signin" className="hover:text-white">
            Log in
          </a>
          <a href="/legal/terms" className="hover:text-white">
            Terms
          </a>
          <a href="/legal/privacy" className="hover:text-white">
            Privacy
          </a>
          <a href="https://github.com/chloevpin/openlet" className="hover:text-white">
            GitHub
          </a>
        </nav>
      </Shell>
      <Shell className="pb-8 text-center md:text-left">
        <p className="text-xs text-white/30">
          &copy; {new Date().getFullYear()} Openlet &middot; MIT
        </p>
      </Shell>
    </footer>
  )
}

function Home() {
  const { user } = Route.useLoaderData()
  const router = useRouter()

  useEffect(() => {
    if (user) router.navigate({ to: '/dashboard', replace: true })
  }, [user, router])

  if (user) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE, color: INK }}>
      <Nav />
      <main>
        <Hero />
        <Study />
        <Why />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}

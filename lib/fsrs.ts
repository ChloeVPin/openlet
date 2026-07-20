interface ReviewLog {
  grade: 'again' | 'hard' | 'good' | 'easy'
  elapsedDays: number
  scheduledDays: number
  reviewedAt: string
}

interface CardMetadata {
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  reps: number
  lapses: number
  lastReview: string | null
}

const DEFAULT_PARAMS = {
  w: [
    0.4, 0.6, 2.4, 5.8, 0.6, 0.02, 0.01, 0.1, 0.1, 1.5, 2.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
  ],
  requestRetention: 0.9,
  maximumInterval: 365,
}

const GRADE_MAP: Record<string, number> = { again: 0, hard: 1, good: 2, easy: 3 }

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function initStability(grade: number): number {
  return DEFAULT_PARAMS.w[grade + 1]
}

function initDifficulty(grade: number): number {
  return clamp(DEFAULT_PARAMS.w[4] - DEFAULT_PARAMS.w[5] * (grade - 2), 1, 10)
}

function nextDifficulty(d: number, grade: number): number {
  const nd = d + DEFAULT_PARAMS.w[6] * (grade - 3)
  return clamp(nd, 1, 10)
}

function nextStability(s: number, d: number, grade: number, elapsed: number): number {
  if (grade === 0) {
    const r = Math.exp((Math.log(0.9) * elapsed) / (s || 1))
    return clamp(
      DEFAULT_PARAMS.w[7] *
        Math.pow(s || 1, DEFAULT_PARAMS.w[8]) *
        Math.pow(r, DEFAULT_PARAMS.w[9]),
      0.1,
      DEFAULT_PARAMS.maximumInterval,
    )
  }
  if (grade === 1) {
    return clamp(s * Math.exp(DEFAULT_PARAMS.w[10] * (d - 5)), 0.1, DEFAULT_PARAMS.maximumInterval)
  }
  if (grade === 2) {
    return clamp(s * Math.exp(DEFAULT_PARAMS.w[11] * (d - 5)), 0.1, DEFAULT_PARAMS.maximumInterval)
  }
  return clamp(
    s * DEFAULT_PARAMS.w[13] * Math.exp(DEFAULT_PARAMS.w[14] * (d - 5)),
    0.1,
    DEFAULT_PARAMS.maximumInterval,
  )
}

function nextInterval(s: number): number {
  const ivl = Math.round((s * Math.log(DEFAULT_PARAMS.requestRetention)) / Math.log(0.9))
  return Math.max(1, ivl)
}

export function createCardMetadata(): CardMetadata {
  return {
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    lastReview: null,
  }
}

export function reviewCard(
  metadata: CardMetadata,
  grade: string,
): { metadata: CardMetadata; interval: number } {
  const g = GRADE_MAP[grade] ?? 2
  const elapsed = metadata.lastReview ? metadata.elapsedDays : 0

  let stability = metadata.stability
  let difficulty = metadata.difficulty
  let reps = metadata.reps
  let lapses = metadata.lapses

  if (reps === 0) {
    stability = initStability(g)
    difficulty = initDifficulty(g)
  } else {
    if (g === 0) lapses += 1
    difficulty = nextDifficulty(difficulty, g)
    stability = nextStability(stability, difficulty, g, elapsed)
  }

  reps += 1
  const interval = g === 0 ? 1 : nextInterval(stability)
  const now = new Date().toISOString()

  return {
    metadata: {
      stability: clamp(stability, 0.1, DEFAULT_PARAMS.maximumInterval),
      difficulty: clamp(difficulty, 1, 10),
      elapsedDays: interval,
      scheduledDays: interval,
      reps,
      lapses,
      lastReview: now,
    },
    interval,
  }
}

export function getRetrievability(stability: number, elapsedDays: number): number {
  if (stability <= 0) return 1
  return Math.pow(1 + elapsedDays / (stability * 9), -1)
}

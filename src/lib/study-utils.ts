/** Levenshtein-based fuzzy match for typed answers. */
export function answersMatch(user: string, correct: string): boolean {
  const a = normalize(user)
  const b = normalize(correct)
  if (!a || !b) return false
  if (a === b) return true
  // Allow small typos relative to length
  const dist = levenshtein(a, b)
  const maxLen = Math.max(a.length, b.length)
  if (maxLen <= 3) return dist === 0
  if (maxLen <= 8) return dist <= 1
  return dist <= Math.floor(maxLen * 0.15)
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^\p{L}\p{N}\s'-]/gu, '')
    .replace(/\s+/g, ' ')
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const row = new Array<number>(n + 1)
  for (let j = 0; j <= n; j++) row[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = row[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost)
      prev = tmp
    }
  }
  return row[n]
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** True if a card is due for review based on FSRS scheduling. */
export function isCardDue(
  meta:
    | {
        lastReview: string | Date | null
        scheduledDays: number
        reps: number
      }
    | null
    | undefined,
): boolean {
  if (!meta || !meta.lastReview || meta.reps === 0) return true
  const last = new Date(meta.lastReview).getTime()
  if (Number.isNaN(last)) return true
  const dueAt = last + (meta.scheduledDays || 0) * 24 * 60 * 60 * 1000
  return Date.now() >= dueAt
}

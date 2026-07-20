import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

const loadPublicSet = createServerFn({ method: 'GET' })
  .validator(z.string())
  .handler(async ({ data: id }) => {
    // Static imports are safe here: createServerFn extracts the handler server-side
    const { db } = await import('@/lib/db')
    const { sets: setsTable, cards } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const [set] = await db.select().from(setsTable).where(eq(setsTable.id, id)).limit(1)
    if (!set || set.visibility !== 'public') return null
    const cardList = await db
      .select()
      .from(cards)
      .where(eq(cards.setId, id))
      .orderBy(cards.position)
    return { set, cards: cardList }
  })

export const Route = createFileRoute('/public/$id')({
  head: () => ({
    meta: [
      { title: 'Public set | Openlet' },
      {
        name: 'description',
        content: 'View a shared flashcard set on Openlet. Sign up to study and save public sets.',
      },
      { property: 'og:title', content: 'Public set | Openlet' },
      {
        property: 'og:description',
        content: 'View a shared flashcard set on Openlet. Sign up to study and save public sets.',
      },
      { name: 'twitter:title', content: 'Public set | Openlet' },
      {
        name: 'twitter:description',
        content: 'View a shared flashcard set on Openlet. Sign up to study and save public sets.',
      },
    ],
  }),
  loader: async ({ params: { id } }) => {
    const data = await loadPublicSet({ data: id })
    if (!data) throw new Error('Not found')
    return data
  },
  pendingComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="w-full max-w-md space-y-3">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-7 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
      Set not found
    </div>
  ),
  component: PublicSetPage,
})

function PublicSetPage() {
  const data = Route.useLoaderData()
  const { set: setData, cards: cardList } = data

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Shared set
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {setData.title}
          </h1>
          {setData.description && (
            <p className="mt-1 text-sm text-muted-foreground">{setData.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {setData.subject && <Badge variant="brand">{setData.subject}</Badge>}
            <span className="text-xs text-muted-foreground">
              {cardList.length} term{cardList.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/signin">
            <Button size="sm">Sign in with Google</Button>
          </a>
        </div>
      </div>

      <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {cardList.map((card, i) => (
          <li key={card.id} className="grid gap-2 px-4 py-3.5 sm:grid-cols-2 sm:gap-6">
            <div className="flex gap-3">
              <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <p className="text-sm font-semibold text-foreground">{card.term}</p>
            </div>
            <p className="pl-8 text-sm text-muted-foreground sm:pl-0">{card.definition}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

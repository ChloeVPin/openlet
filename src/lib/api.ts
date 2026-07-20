/** Typed fetch helpers for client-side queries (cached by TanStack Query). */
import { createIsomorphicFn } from '@tanstack/react-start'

/**
 * Absolute URL on the server (SSR loaders need a base); relative on the client.
 * The server implementation lives in api.server.ts so the server-only import
 * never enters the client bundle.
 */
const apiUrlImpl = createIsomorphicFn()
  .server(async (path: string) => {
    const { resolveApiUrl } = await import('./api.server')
    return resolveApiUrl(path)
  })
  .client((path: string) => path)

/** Forward the incoming request's Cookie header for same-origin SSR fetches. */
const serverHeadersImpl = createIsomorphicFn()
  .server(async () => {
    const { readServerHeaders } = await import('./api.server')
    return readServerHeaders()
  })
  .client(() => ({}) as HeadersInit)

async function apiUrl(path: string): Promise<string> {
  return apiUrlImpl(path) as Promise<string> | string
}

async function serverHeaders(): Promise<HeadersInit | undefined> {
  return serverHeadersImpl() as Promise<HeadersInit> | HeadersInit
}

export type DashboardSet = {
  id: string
  title: string
  description: string | null
  subject: string | null
  cover?: string | null
  cardCount: number
  dueCount: number
  lastStudied: string | null
  updatedAt: string
}

export type DashboardData = {
  sets: DashboardSet[]
  totalDue: number
}

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(await apiUrl('/api/dashboard'), { headers: await serverHeaders() })
  if (!res.ok) throw new Error('Failed to load library')
  return res.json()
}

export async function fetchSet(id: string) {
  const res = await fetch(await apiUrl(`/api/sets/${id}`), { headers: await serverHeaders() })
  if (!res.ok) throw new Error('Failed to load set')
  return res.json() as Promise<{ set: unknown; cards: unknown[] }>
}

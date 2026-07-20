import { getRequestUrl, getRequestHeaders } from '@tanstack/react-start/server'

export function resolveApiUrl(path: string): string {
  if (typeof window !== 'undefined') return path
  return new URL(path, getRequestUrl().origin).href
}

export function readServerHeaders(): HeadersInit {
  if (typeof window !== 'undefined') return {}
  const cookie = getRequestHeaders().get('cookie')
  if (!cookie) return {}
  return { cookie }
}

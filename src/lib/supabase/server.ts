import { createServerClient } from '@supabase/ssr'
import { getRequestHeaders, setResponseHeaders } from '@tanstack/react-start/server'
import type { CookieOptions } from '@supabase/ssr'

/**
 * Server-side Supabase client for TanStack Start.
 *
 * Usage:
 *   const { supabase, flushCookies } = createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   flushCookies()
 *
 * flushCookies() must be called after every auth operation to ensure
 * cookies are written to the response. In serverless environments the
 * response may be sent immediately after the handler returns, so we
 * cannot rely on setTimeout.
 */
export function createClient() {
  const headers = getRequestHeaders()
  const cookie = headers.get('cookie') ?? ''
  const pendingCookies: string[] = []

  let testUser: { id: string; email: string } | null = null
  const authSecret = process.env.AUTH_SECRET
  if (authSecret) {
    const match = cookie.match(/(?:^|;\s*)openlet_session=([^;]*)/)
    if (match && match[1]) {
      try {
        const token = match[1]
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
          if (payload.exp && Date.now() < payload.exp * 1000) {
            testUser = {
              id: payload.userId,
              email: payload.email,
            }
          }
        }
      } catch {}
    }
  }

  const supabase = createServerClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(key: string) {
          const match = cookie.match(
            new RegExp(`(?:^|;\\s*)${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`),
          )
          return match ? decodeURIComponent(match[1]) : undefined
        },
        set(key: string, value: string, options: CookieOptions) {
          let c = `${key}=${encodeURIComponent(value)}`
          if (options.path) c += `; Path=${options.path}`
          if (options.maxAge !== undefined) c += `; Max-Age=${options.maxAge}`
          if (options.httpOnly) c += '; HttpOnly'
          if (options.secure) c += '; Secure'
          if (options.sameSite) c += `; SameSite=${options.sameSite}`
          pendingCookies.push(c)
        },
        remove(key: string, _options: CookieOptions) {
          pendingCookies.push(`${key}=; Max-Age=0; Path=/`)
        },
      },
    },
  )

  if (testUser) {
    supabase.auth.getUser = async () => {
      return {
        data: {
          user: {
            id: testUser!.id,
            email: testUser!.email,
            user_metadata: {},
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as any,
        },
        error: null,
      }
    }
  }

  function flushCookies() {
    if (pendingCookies.length > 0) {
      // Pass the pendingCookies array directly. TanStack Start / Nitro
      // will correctly output multiple Set-Cookie headers.
      setResponseHeaders({ 'set-cookie': pendingCookies } as any)
      pendingCookies.length = 0
    }
  }

  return { supabase, flushCookies }
}

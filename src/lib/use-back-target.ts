import { useEffect, useState } from 'react'

export type BackTarget = { href: string; label: string }

const DEFAULT: BackTarget = { href: '/', label: 'Back to home' }

/**
 * Resolve a sensible "back" link from same-origin referrer, then history, then home.
 */
export function useBackTarget(): BackTarget {
  const [target, setTarget] = useState<BackTarget>(DEFAULT)

  useEffect(() => {
    setTarget(resolveBackTarget())
  }, [])

  return target
}

export function resolveBackTarget(): BackTarget {
  if (typeof window === 'undefined') return DEFAULT

  // Prefer same-origin referrer (footer / signin / signup / library)
  try {
    const ref = document.referrer
    if (ref) {
      const url = new URL(ref)
      if (url.origin === window.location.origin) {
        const path = url.pathname || '/'
        // Don't loop back to legal pages
        if (!path.startsWith('/legal')) {
          return { href: path + url.search, label: labelForPath(path) }
        }
      }
    }
  } catch {
    /* ignore */
  }

  // Session breadcrumb set when navigating to legal from our app
  try {
    const stored = sessionStorage.getItem('openlet:returnTo')
    if (stored) {
      const url = new URL(stored, window.location.origin)
      if (url.origin === window.location.origin && !url.pathname.startsWith('/legal')) {
        return { href: url.pathname + url.search, label: labelForPath(url.pathname) }
      }
    }
  } catch {
    /* ignore */
  }

  return DEFAULT
}

function labelForPath(path: string): string {
  if (path === '/' || path === '') return 'Back to home'
  if (path.startsWith('/signup')) return 'Back to sign up'
  if (path.startsWith('/signin')) return 'Back to log in'
  if (path.startsWith('/dashboard')) return 'Back to library'
  if (path.startsWith('/create')) return 'Back to create'
  if (path.startsWith('/import')) return 'Back to import'
  if (path.startsWith('/set/')) return 'Back to set'
  return 'Back'
}

/** Call before navigating to /legal/* so return works even without referrer. */
export function rememberReturnPath(path?: string) {
  try {
    const p = path ?? `${window.location.pathname}${window.location.search}`
    if (!p.startsWith('/legal')) {
      sessionStorage.setItem('openlet:returnTo', p)
    }
  } catch {
    /* ignore */
  }
}

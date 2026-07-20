import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'

/**
 * Supabase OAuth callback route.
 *
 * After a user signs in via Google/GitHub, Supabase redirects here with
 * an authorization code in the URL. The browser-side Supabase client
 * exchanges the code for a session, then we navigate to the dashboard.
 *
 * This route must be registered in Supabase Auth settings as the
 * redirect URL.
 */
export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) {
          console.error('[auth/callback] getSession error:', sessionError)
          setError(sessionError.message)
          return
        }
        if (!data.session) {
          console.error('[auth/callback] no session returned, data:', data)
          setError('No session returned')
          return
        }
        router.invalidate().then(() => {
          navigate({ to: '/dashboard' })
        })
      })
      .catch((err) => {
        console.error('[auth/callback] unexpected error:', err)
        setError(err?.message ?? 'Unexpected error')
      })
  }, [navigate])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f7fb] px-4 text-center">
        <p className="text-sm font-medium text-[#e11d48]">Sign in failed: {error}</p>
        <a href="/signin" className="text-sm font-semibold text-[#4255ff] underline">
          Try again
        </a>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]">
      <p className="text-sm text-[#4a5065]">Completing sign in...</p>
    </div>
  )
}

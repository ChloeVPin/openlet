import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL ||
      (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') ||
      '',
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
      (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') ||
      '',
  )
}

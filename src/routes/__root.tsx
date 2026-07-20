import React, { type ReactNode, useState, useRef, useEffect } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouter,
  useLocation,
} from '@tanstack/react-router'
import { Search, Plus, LogIn, Upload, X, ChevronDown, Library, LogOut, Trash2 } from 'lucide-react'
import '../../app/globals.css'
import type { AuthUser } from '../router'
import { cn } from '../lib/cn'
import { LogoMark } from '../components/logo'
import { Tooltip } from '../components/ui/tooltip'
import { ConfirmDialog } from '../components/confirm-dialog'

const siteUrl = process.env.VITE_SITE_URL ?? 'https://openletapp.vercel.app'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Openlet | Free study tools, open source forever' },
      // Open Graph
      { property: 'og:site_name', content: 'Openlet' },
      { property: 'og:title', content: 'Openlet | Free study tools, open source forever' },
      {
        property: 'og:description',
        content:
          'Master anything with free flashcards, practice tests, and study modes. No ads, no upgrade wall. Spaced repetition, AI generation, and more.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: `${siteUrl}/og-image.jpg` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:url', content: siteUrl },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Openlet | Free study tools, open source forever' },
      {
        name: 'twitter:description',
        content:
          'Master anything with free flashcards, practice tests, and study modes. No ads, no upgrade wall.',
      },
      {
        name: 'twitter:image',
        content: `${siteUrl}/og-image.jpg`,
      },
    ],
    links: [
      { rel: 'icon', href: '/icon.svg' },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'canonical', href: `${siteUrl}/` },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap',
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-extrabold tabular-nums text-[#7c84a0]">404</p>
      <h1 className="mt-4 text-xl font-extrabold text-[#1a1d26]">Page not found</h1>
      <p className="mt-2 text-sm text-[#4a5065]">
        This set doesn&apos;t exist or may have been removed.
      </p>
      <a
        href="/dashboard"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#4255ff] px-5 text-sm font-bold text-white hover:bg-[#3b4ce0]"
      >
        Go to library
      </a>
    </div>
  ),
  loader: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const user = await getSession()
    return { user: user as AuthUser | null }
  },
  component: RootComponent,
})

function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<
    { id: string; title: string; description: string | null }[]
  >([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    const t = setTimeout(() => {
      fetch(`/api/sets/search?q=${encodeURIComponent(query)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) {
            setResults(d.results)
            setOpen(d.results.length > 0)
          }
        })
    }, 150)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7c84a0]"
        aria-hidden
      />
      <input
        type="text"
        placeholder="Search your sets"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-10 w-full rounded-full border-0 bg-[#f6f7fb] pl-10 pr-10 text-sm font-medium text-[#1a1d26] outline-none ring-1 ring-transparent transition placeholder:text-[#7c84a0] focus:bg-white focus:ring-[#4255ff]/30"
      />
      {query && (
        <Tooltip label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={() => setQuery('')}
            className="inline-flex size-8 items-center justify-center text-[#7c84a0] hover:text-[#1a1d26]"
            aria-label="Clear"
          >
            <X className="size-3.5" />
          </button>
        </Tooltip>
      )}
      {open && (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-80 overflow-hidden rounded-xl border border-[#e8eaf0] bg-white shadow-lg">
          <div className="max-h-80 overflow-y-auto py-0">
            {results.map((set) => (
              <a
                key={set.id}
                href={`/set/${set.id}`}
                onClick={() => {
                  setOpen(false)
                  setQuery('')
                }}
                className="block px-4 py-2.5 hover:bg-[#f6f7fb]"
              >
                <p className="text-sm font-bold text-[#1a1d26]">{set.title}</p>
                {set.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-[#4a5065]">{set.description}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Nav({ user }: { user: AuthUser | null }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleSignOut() {
    const { signout } = await import('../../src/lib/auth/actions')
    await signout()
    router.invalidate()
    router.navigate({ to: '/' })
  }

  async function handleDeleteAccount() {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const { deleteAccount } = await import('../../src/lib/auth/actions')
      const res = await deleteAccount()
      if (res?.ok) {
        setDeleteConfirmOpen(false)
        router.invalidate()
        router.navigate({ to: '/' })
      } else {
        setDeleteError('Failed to delete account. Please try again.')
      }
    } catch (err: any) {
      setDeleteError(err.message || 'An error occurred during account deletion.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8eaf0] bg-white max-sm:shadow-sm">
      <nav
        suppressHydrationWarning
        aria-label="Main navigation"
        className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6"
      >
        <a
          href={user ? '/dashboard' : '/'}
          className="flex shrink-0 items-center gap-2 text-[15px] font-bold tracking-tight text-[#1a1d26] no-underline"
        >
          <LogoMark size={28} />
          <span className="hidden sm:inline">Openlet</span>
        </a>

        {user && (
          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <SearchBar />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {user ? (
            <>
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e8eaf0] px-3 py-2 text-sm font-bold text-[#1a1d26] shadow-sm transition hover:bg-[#f6f7fb]"
                  aria-label="User menu"
                  aria-expanded={menuOpen}
                >
                  <div className="flex size-5 items-center justify-center rounded-full bg-[#4255ff]/10 text-[10px] font-bold text-[#4255ff]">
                    {user.name ? user.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                  </div>
                  <span className="hidden max-w-[120px] truncate sm:inline">{user.name || user.email}</span>
                  <ChevronDown
                    className={cn(
                      'size-4 text-[#7c84a0] transition-transform duration-200',
                      menuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[#e8eaf0] bg-white py-0 shadow-lg">
                    <div className="border-b border-[#f0f1f5] px-3.5 py-2.5">
                      <p className="text-xs font-semibold text-[#7c84a0]">Signed in as</p>
                      <p className="truncate text-sm font-bold text-[#1a1d26]">{user.email}</p>
                    </div>

                    <a
                      href="/dashboard"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-[#1a1d26] hover:bg-[#f6f7fb]"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Library className="size-4 text-[#4a5065]" /> Your library
                    </a>

                    <div className="border-t border-[#f0f1f5]"></div>

                    <div className="px-3.5 py-1.5 text-xs font-bold text-[#7c84a0] uppercase tracking-wider">
                      Create
                    </div>

                    <a
                      href="/create"
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-semibold text-[#1a1d26] hover:bg-[#f6f7fb]"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Plus className="size-4 text-[#4255ff]" /> Create set
                    </a>
                    <a
                      href="/import"
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-semibold text-[#1a1d26] hover:bg-[#f6f7fb]"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Upload className="size-4 text-[#4a5065]" /> Import set
                    </a>

                    <div className="border-t border-[#f0f1f5]"></div>

                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        handleSignOut()
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-[#4a5065] hover:bg-[#f6f7fb] hover:text-[#1a1d26]"
                    >
                      <LogOut className="size-4 text-[#4a5065]" /> Sign out
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        setDeleteConfirmOpen(true)
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-[#ff725b] hover:bg-[#fff5f3]"
                    >
                      <Trash2 className="size-4 text-[#ff725b]" /> Delete account
                    </button>
                  </div>
                )}
              </div>

              <ConfirmDialog
                open={deleteConfirmOpen}
                title="Delete Account"
                description={deleteError || "Are you absolutely sure you want to delete your account? This action is permanent and all your created flashcard sets, classes, folders, and study history will be deleted forever."}
                confirmLabel={isDeleting ? "Deleting..." : "Permanently Delete"}
                cancelLabel="Cancel"
                danger
                loading={isDeleting}
                onConfirm={handleDeleteAccount}
                onCancel={() => {
                  setDeleteConfirmOpen(false)
                  setDeleteError(null)
                }}
              />
            </>
          ) : (
            <>
              <a
                href="/signin"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#4a5065] transition hover:text-[#1a1d26]"
              >
                <LogIn className="size-4" /> Log in
              </a>
              <a
                href="/signin"
                className="rounded-lg bg-[#4255ff] px-3.5 py-2 text-sm font-bold text-white hover:bg-[#3b4ce0]"
              >
                Get started
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[#e8eaf0] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-5 sm:flex-row sm:justify-between sm:px-6">
        <span className="text-xs text-[#7c84a0]">&copy; {new Date().getFullYear()} Openlet</span>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-semibold text-[#7c84a0]">
          <a href="/legal/terms" className="hover:text-[#1a1d26]">
            Terms
          </a>
          <a href="/legal/privacy" className="hover:text-[#1a1d26]">
            Privacy
          </a>
          <a href="https://github.com/chloevpin/openlet" className="hover:text-[#1a1d26]">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}

function RootComponent() {
  const { user } = Route.useLoaderData()
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const isStudy = /\/set\/[^/]+\/(flashcards|learn|write|test|match)/.test(location.pathname)

  return (
    <RootDocument>
      {isLanding || isStudy ? null : <Nav user={user} />}
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      {isLanding || isStudy ? null : <Footer />}
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col bg-white font-sans text-[#1a1d26] antialiased">
        <ErrorBoundary fallback={<ErrorFallback />}>
          {children}
          <Scripts />
        </ErrorBoundary>
      </body>
    </html>
  )
}

class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

function ErrorFallback() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-extrabold text-[#e11d48]">!</p>
      <h1 className="mt-4 text-xl font-extrabold text-[#1a1d26]">Something went wrong</h1>
      <p className="mt-2 text-sm text-[#4a5065]">Try refreshing the page.</p>
      <a
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#4255ff] px-5 text-sm font-bold text-white"
      >
        Go home
      </a>
    </div>
  )
}

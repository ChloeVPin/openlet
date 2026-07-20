import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { Upload, ArrowLeft } from 'lucide-react'
import { createSet } from '../../src/lib/actions/sets'
import { parseCSV, parseMarkdown } from '../../lib/importers/parsers'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { PageHeader } from '../components/page-header'

export const Route = createFileRoute('/import')({
  head: () => ({
    meta: [
      { title: 'Import | Openlet' },
      {
        name: 'description',
        content:
          'Import flashcards from CSV or Markdown files into Openlet. Free study tools for students.',
      },
      { property: 'og:title', content: 'Import | Openlet' },
      {
        property: 'og:description',
        content:
          'Import flashcards from CSV or Markdown files into Openlet. Free study tools for students.',
      },
      { name: 'twitter:title', content: 'Import | Openlet' },
      {
        name: 'twitter:description',
        content:
          'Import flashcards from CSV or Markdown files into Openlet. Free study tools for students.',
      },
    ],
  }),
  beforeLoad: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const session = await getSession()
    if (!session) throw redirect({ to: '/signin' })
  },
  component: ImportPage,
})

function ImportPage() {
  const navigate = Route.useNavigate()
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{ term: string; definition: string }[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [setTitle, setSetTitle] = useState('')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const name = file.name.toLowerCase()
      const pairs = name.endsWith('.csv') ? parseCSV(text) : parseMarkdown(text)
      if (pairs.length === 0) {
        setError('No valid term/definition pairs found')
        setPreview(null)
        return
      }
      setPreview(pairs)
      setSetTitle(file.name.replace(/\.(csv|md|txt)$/i, '').replace(/[-_]/g, ' '))
    }
    reader.readAsText(file)
  }

  async function handleCreateFromPreview() {
    if (!preview || preview.length === 0) return
    setImporting(true)
    setError('')
    try {
      const result = await createSet({
        data: {
          title: setTitle || fileName.replace(/\.(csv|md|txt)$/i, '') || 'Imported set',
          description: '',
          subject: '',
          cards: preview,
        },
      })
      navigate({ to: '/set/$id', params: { id: result.id } })
    } catch {
      setError('Failed to create set')
      setImporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <PageHeader
        back={
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Library
          </a>
        }
        title="Import"
        description="Bring decks from CSV or Markdown files"
      />

      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-6 py-10 text-center transition-colors hover:border-primary/40 hover:bg-muted/30"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.md,.txt"
            onChange={handleFile}
            className="hidden"
          />
          <Upload className="size-6 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Choose CSV, Markdown, or text
          </span>
          <span className="text-xs text-muted-foreground">
            CSV: term,definition · Markdown: nested lists
          </span>
        </button>

        {preview && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <label htmlFor="setTitle" className="text-xs font-semibold text-muted-foreground">
                  Set title
                </label>
                <Input
                  id="setTitle"
                  value={setTitle}
                  onChange={(e) => setSetTitle(e.target.value)}
                  className="mt-1 w-64"
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {preview.length} card{preview.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="mt-4 max-h-48 space-y-1 overflow-y-auto">
              {preview.map((pair, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-3 rounded-lg bg-muted px-3 py-2 text-sm"
                >
                  <span className="truncate font-semibold text-foreground">{pair.term || '-'}</span>
                  <span className="truncate text-muted-foreground">{pair.definition || '-'}</span>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={handleCreateFromPreview} disabled={importing}>
              {importing ? 'Creating…' : `Create set · ${preview.length} cards`}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

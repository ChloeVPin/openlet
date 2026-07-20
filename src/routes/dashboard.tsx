import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Plus, BookOpen, Clock, Folder as FolderIcon, Users, Activity } from 'lucide-react'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { ProductPage, SectionLabel } from '../components/product-layout'
import { SetCard, type SetCardData } from '../components/set-card'
import { SetCoverModal } from '../components/set-cover-modal'
import { updateSetCover } from '../lib/actions/sets'
import { updatePreferences } from '../lib/actions/preferences'
import { cn } from '../lib/cn'
import { Dialog } from '../components/ui/dialog'
import { Field, fieldA11y } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { DropdownSelect } from '../components/ui/select'
import { createFolder } from '../lib/actions/folders'
import { createClass } from '../lib/actions/classes'

const FolderForm = z.object({
  name: z.string().trim().min(1, 'Enter a folder name.').max(200),
  description: z.string().max(1000, 'Description must be 1,000 characters or less.'),
  visibility: z.enum(['private', 'public']),
})
const ClassForm = FolderForm.extend({
  school: z.string().max(200, 'School must be 200 characters or less.'),
})

interface SetRow {
  id: string
  title: string
  description: string | null
  subject: string | null
  cover: string | null
  cardCount: number
  dueCount: number
  lastStudied: string | null
  updatedAt: string
}

export const Route = createFileRoute('/dashboard')({
  head: () => ({ meta: [{ title: 'Your library | Openlet' }] }),
  beforeLoad: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const session = await getSession()
    if (!session) throw redirect({ to: '/signin' })
  },
  component: Dashboard,
})

function Dashboard() {
  const navigate = Route.useNavigate()
  const [userSets, setUserSets] = useState<SetRow[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [totalDue, setTotalDue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [coverSet, setCoverSet] = useState<SetRow | null>(null)
  const [savingCover, setSavingCover] = useState(false)
  const [activeTab, setActiveTab] = useState<'sets' | 'folders' | 'classes' | 'discover'>('sets')
  const [discoverSets, setDiscoverSets] = useState<any[]>([])
  const [loadingDiscover, setLoadingDiscover] = useState(false)
  const [createKind, setCreateKind] = useState<'folder' | 'class' | null>(null)
  const [formError, setFormError] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (activeTab !== 'discover' || discoverSets.length > 0) return
    setLoadingDiscover(true)
    fetch('/api/sets/discover')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setDiscoverSets(data.sets || [])
        }
        setLoadingDiscover(false)
      })
      .catch(() => setLoadingDiscover(false))
  }, [activeTab, discoverSets.length])

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then((r) => {
        if (!r.ok) throw new Error('Failed to load dashboard')
        return r.json()
      }),
      fetch('/api/analytics')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([data, analyticsData]) => {
        setUserSets(data.sets || [])
        setFolders(data.folders || [])
        setClasses(data.classes || [])
        setTotalDue(data.totalDue || 0)
        setAnalytics(analyticsData && !analyticsData.error ? analyticsData : null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSaveCover(newCover: string) {
    if (!coverSet) return
    setSavingCover(true)
    try {
      await updateSetCover({ data: { setId: coverSet.id, cover: newCover } })
      await updatePreferences({ data: { lastCover: newCover } }).catch(() => {})
      setUserSets((prev) => prev.map((s) => (s.id === coverSet.id ? { ...s, cover: newCover } : s)))
      setCoverSet(null)
    } catch {
    } finally {
      setSavingCover(false)
    }
  }

  async function handleCreate(form: FormData) {
    const schema = createKind === 'folder' ? FolderForm : ClassForm
    const result = schema.safeParse({
      name: form.get('name'),
      description: form.get('description') || '',
      school: form.get('school') || '',
      visibility: form.get('visibility') || 'private',
    })
    if (!result.success) {
      setFormError(
        Object.fromEntries(
          result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      )
      return
    }
    setSubmitting(true)
    try {
      const created =
        createKind === 'folder'
          ? await createFolder({ data: result.data })
          : await createClass({ data: result.data })
      await navigate({
        to: createKind === 'folder' ? '/folder/$id' : '/class/$id',
        params: { id: created.id },
      })
    } catch {
      setFormError({ form: 'Could not create this item. Try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ProductPage>
        <div className="h-9 w-48 animate-pulse rounded-lg bg-white" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </ProductPage>
    )
  }

  const dueSets = userSets.filter((s) => s.dueCount > 0).sort((a, b) => b.dueCount - a.dueCount)
  const recent = [...userSets]
    .filter((s) => s.lastStudied)
    .sort((a, b) => new Date(b.lastStudied!).getTime() - new Date(a.lastStudied!).getTime())
    .slice(0, 4)

  return (
    <ProductPage wide>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1d26]">Your library</h1>
          <div className="mt-4 flex items-center gap-2">
            {(['sets', 'folders', 'classes', 'discover'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-bold capitalize transition-colors',
                  activeTab === tab
                    ? 'bg-[#4255ff] text-white'
                    : 'bg-white text-[#4a5065] hover:bg-[#e8eaf0]',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === 'sets' && (
            <>
              <a href="/import">
                <Button variant="outline" size="md">
                  Import
                </Button>
              </a>
              <a href="/create">
                <Button size="md">
                  <Plus className="size-4" /> Create set
                </Button>
              </a>
            </>
          )}
          {activeTab === 'folders' && (
            <Button
              size="md"
              onClick={() => {
                setFormError({})
                setCreateKind('folder')
              }}
            >
              <Plus className="size-4" /> New folder
            </Button>
          )}
          {activeTab === 'classes' && (
            <Button
              size="md"
              onClick={() => {
                setFormError({})
                setCreateKind('class')
              }}
            >
              <Plus className="size-4" /> Create class
            </Button>
          )}
        </div>
      </div>

      {analytics && analytics.overall && (
        <section className="mt-8 rounded-2xl border border-[#e8eaf0] bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="size-5 text-[#4255ff]" />
            <h2 className="text-lg font-bold text-[#1a1d26]">Study Analytics</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl bg-[#f6f7fb] p-4">
              <p className="text-sm font-semibold text-[#4a5065]">Avg Retention</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#1a1d26]">
                {analytics.overall.avgStability > 0
                  ? Math.min(99, Math.round(analytics.overall.avgStability * 10)) + '%'
                  : 'N/A'}
              </p>
            </div>
            <div className="rounded-xl bg-[#f6f7fb] p-4">
              <p className="text-sm font-semibold text-[#4a5065]">Total Reps</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#1a1d26]">
                {analytics.overall.totalReps}
              </p>
            </div>
            <div className="rounded-xl bg-[#fef2f2] p-4">
              <p className="text-sm font-semibold text-[#e11d48]">Total Lapses</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#e11d48]">
                {analytics.overall.totalLapses}
              </p>
            </div>
          </div>
          {analytics.weakestCards?.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-[#4a5065]">Weakest terms to review</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {analytics.weakestCards.map((c: any) => (
                  <a
                    key={c.cardId}
                    href={`/set/${c.setId}/learn`}
                    className="rounded-md border border-[#e8eaf0] px-2 py-1 text-xs font-semibold text-[#1a1d26] hover:border-[#4255ff]"
                  >
                    {c.term}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'sets' && (
        <div className="mt-10 space-y-10">
          {userSets.length === 0 ? (
            <div className="rounded-2xl border border-[#e8eaf0] bg-white p-6 sm:p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#eef0ff] text-[#4255ff] mx-auto">
                <BookOpen className="size-6" />
              </div>
              <h2 className="mt-5 text-xl font-extrabold text-[#1a1d26]">Welcome to Openlet</h2>
              <p className="mt-2 text-sm text-[#4a5065]">Create a set to start studying.</p>
              <a href="/create" className="mt-6 inline-flex">
                <Button size="md">Create your first set</Button>
              </a>
            </div>
          ) : (
            <>
              {dueSets.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Clock className="size-4 text-[#4255ff]" />
                    <SectionLabel>Due for review</SectionLabel>
                    <span className="rounded-full bg-[#eef0ff] px-2 py-0.5 text-xs font-bold text-[#2a35b8]">
                      {totalDue}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dueSets.slice(0, 6).map((set, i) => (
                      <SetCard
                        key={set.id}
                        set={set as SetCardData}
                        highlightDue
                        onEditCover={(s) => setCoverSet(s as SetRow)}
                        index={i}
                      />
                    ))}
                  </div>
                </section>
              )}
              {recent.length > 0 && (
                <section>
                  <SectionLabel>Recent</SectionLabel>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {recent.map((set, i) => (
                      <SetCard
                        key={set.id}
                        set={set as SetCardData}
                        compact
                        onEditCover={(s) => setCoverSet(s as SetRow)}
                        index={i}
                      />
                    ))}
                  </div>
                </section>
              )}
              <section>
                <SectionLabel>All sets</SectionLabel>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {userSets.map((set, i) => (
                    <SetCard
                      key={set.id}
                      set={set as SetCardData}
                      onEditCover={(s) => setCoverSet(s as SetRow)}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {activeTab === 'folders' && (
        <div className="mt-10">
          <SectionLabel>Your folders</SectionLabel>
          {folders.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-[#e8eaf0] bg-white py-12 text-center">
              <FolderIcon className="mx-auto size-12 text-[#939bb4]" />
              <p className="mt-4 text-sm font-medium text-[#4a5065]">
                You don't have any folders yet.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map((f) => (
                <a
                  key={f.id}
                  href={`/folder/${f.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-[#e8eaf0] bg-white p-4 hover:border-[#d9dde8] hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-2">
                    <FolderIcon className="size-5 text-[#4a5065]" />
                    <h3 className="font-bold text-[#1a1d26]">{f.name}</h3>
                  </div>
                  <p className="text-xs font-semibold text-[#7c84a0]">{f.set_count} sets</p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="mt-10">
          <SectionLabel>Your classes</SectionLabel>
          {classes.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-[#e8eaf0] bg-white py-12 text-center">
              <Users className="mx-auto size-12 text-[#939bb4]" />
              <p className="mt-4 text-sm font-medium text-[#4a5065]">
                You aren't in any classes yet.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <a
                  key={c.id}
                  href={`/class/${c.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-[#e8eaf0] bg-white p-4 hover:border-[#d9dde8] hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-2">
                    <Users className="size-5 text-[#4a5065]" />
                    <h3 className="font-bold text-[#1a1d26]">{c.name}</h3>
                  </div>
                  {c.school && <p className="text-xs text-[#4a5065]">{c.school}</p>}
                  <p className="text-xs font-semibold text-[#7c84a0]">{c.set_count} sets</p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'discover' && (
        <div className="mt-10">
          <SectionLabel>Public study sets</SectionLabel>
          {loadingDiscover ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : discoverSets.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-[#e8eaf0] bg-white py-12 text-center">
              <BookOpen className="mx-auto size-12 text-[#939bb4]" />
              <p className="mt-4 text-sm font-medium text-[#4a5065]">
                No public study sets available to discover yet.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {discoverSets.map((set, i) => (
                <SetCard
                  key={set.id}
                  set={set as SetCardData}
                  onEditCover={(s) => setCoverSet(s as SetRow)}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <SetCoverModal
        open={!!coverSet}
        setTitle={coverSet?.title || ''}
        currentCover={coverSet?.cover || 'default'}
        saving={savingCover}
        onSave={handleSaveCover}
        onClose={() => setCoverSet(null)}
      />
      <Dialog
        open={createKind !== null}
        onClose={() => !submitting && setCreateKind(null)}
        title={createKind === 'folder' ? 'New folder' : 'Create class'}
        description={
          createKind === 'folder' ? 'Organize your study sets.' : 'Create a shared study space.'
        }
        initialFocusRef={undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateKind(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="create-collection" disabled={submitting}>
              {submitting
                ? 'Creating…'
                : createKind === 'folder'
                  ? 'Create folder'
                  : 'Create class'}
            </Button>
          </>
        }
      >
        <form
          id="create-collection"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void handleCreate(new FormData(event.currentTarget))
          }}
        >
          <Field id="collection-name" label="Name" error={formError.name}>
            <Input
              {...fieldA11y('collection-name', formError.name)}
              name="name"
              maxLength={200}
              autoComplete="off"
            />
          </Field>
          <Field
            id="collection-description"
            label="Description"
            error={formError.description}
            hint="Optional"
          >
            <Textarea
              {...fieldA11y('collection-description', formError.description, 'Optional')}
              name="description"
              rows={3}
              maxLength={1000}
            />
          </Field>
          {createKind === 'class' && (
            <Field id="class-school" label="School" error={formError.school} hint="Optional">
              <Input
                {...fieldA11y('class-school', formError.school, 'Optional')}
                name="school"
                maxLength={200}
                autoComplete="organization"
              />
            </Field>
          )}
          <Field id="collection-visibility" label="Visibility" error={formError.visibility}>
            <DropdownSelect
              {...fieldA11y('collection-visibility', formError.visibility)}
              name="visibility"
              defaultValue="private"
              options={[
                { value: 'private', label: 'Private' },
                { value: 'public', label: 'Public' },
              ]}
            />
          </Field>
          {formError.form && (
            <p role="alert" className="text-sm font-semibold text-[#e11d48]">
              {formError.form}
            </p>
          )}
        </form>
      </Dialog>
    </ProductPage>
  )
}

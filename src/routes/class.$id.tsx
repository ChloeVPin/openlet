import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { ProductPage, SectionLabel } from '../components/product-layout'
import { SetCard, type SetCardData } from '../components/set-card'
import { Users, ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Field, fieldA11y } from '../components/ui/field'
import { ConfirmDialog } from '../components/confirm-dialog'
import { DropdownSelect } from '../components/ui/select'
import {
  addSetToClass,
  deleteClass,
  joinClass,
  leaveClass,
  removeSetFromClass,
  updateClass,
} from '../lib/actions/classes'

const ClassForm = z.object({
  name: z.string().trim().min(1, 'Enter a class name.').max(200),
  description: z.string().max(1000, 'Description must be 1,000 characters or less.'),
  school: z.string().max(200, 'School must be 200 characters or less.'),
  visibility: z.enum(['private', 'public']),
})

export const Route = createFileRoute('/class/$id')({
  beforeLoad: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const session = await getSession()
    if (!session) throw redirect({ to: '/signin' })
  },
  component: ClassPage,
})

function ClassPage() {
  const { id } = Route.useParams()
  const navigate = Route.useNavigate()
  const [classData, setClassData] = useState<any>(null)
  const [sets, setSets] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [mySets, setMySets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sets' | 'members'>('sets')
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<Record<string, string>>({})

  const load = async () => {
    const response = await fetch(`/api/classes/${id}`)
    if (!response.ok) throw new Error('Not found')
    const data = await response.json()
    setClassData(data.classData)
    setSets(data.sets || [])
    setMembers(data.members || [])
  }

  useEffect(() => {
    Promise.all([
      load(),
      fetch('/api/dashboard').then((response) => (response.ok ? response.json() : { sets: [] })),
    ])
      .then(([, dashboard]) => setMySets(dashboard.sets || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <ProductPage wide>
        <div className="mb-6 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="flex flex-col gap-4 border-b border-[#e8eaf0] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="size-12 shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="w-full space-y-2">
              <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <div className="h-8 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </ProductPage>
    )
  }
  if (!classData)
    return (
      <ProductPage wide>
        <div className="py-12 text-center text-sm text-[#4a5065]">Class not found.</div>
      </ProductPage>
    )

  const isAdmin = classData.role === 'admin'
  const isMember = Boolean(classData.role)
  const availableSets = mySets.filter((set) => !sets.some((linked) => linked.id === set.id))

  async function saveClass(form: FormData) {
    const result = ClassForm.safeParse({
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
    setSaving(true)
    try {
      await updateClass({ data: { classId: id, ...result.data } })
      setClassData((current: any) => ({ ...current, ...result.data }))
      setEditing(false)
    } catch {
      setFormError({ form: 'Could not save this class. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function addSet(set: any) {
    setSets((current) => [...current, set])
    try {
      await addSetToClass({ data: { classId: id, setId: set.id } })
    } catch {
      setSets((current) => current.filter((item) => item.id !== set.id))
    }
  }
  async function removeSet(setId: string) {
    const previous = sets
    setRemovingId(setId)
    setSets((current) => current.filter((set) => set.id !== setId))
    try {
      await removeSetFromClass({ data: { classId: id, setId } })
    } catch {
      setSets(previous)
    } finally {
      setRemovingId(null)
    }
  }
  async function join() {
    setJoining(true)
    try {
      await joinClass({ data: { classId: id } })
      await load()
    } finally {
      setJoining(false)
    }
  }
  async function leave() {
    setLeaving(true)
    try {
      await leaveClass({ data: { classId: id } })
      await navigate({ to: '/dashboard' })
    } finally {
      setLeaving(false)
    }
  }
  async function destroy() {
    setSaving(true)
    try {
      await deleteClass({ data: { classId: id } })
      await navigate({ to: '/dashboard' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProductPage wide>
      <a
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#646f90] transition hover:text-[#1a1d26]"
      >
        <ArrowLeft className="size-4" /> Back to library
      </a>
      <div className="flex flex-col gap-4 border-b border-[#e8eaf0] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#eef0ff] text-[#4255ff]">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1a1d26]">{classData.name}</h1>
            <p className="text-sm font-semibold text-[#646f90]">
              {classData.school || 'No school specified'}
            </p>
            {classData.description && (
              <p className="mt-1 text-sm text-[#4a5065]">{classData.description}</p>
            )}
          </div>
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormError({})
                setEditing(true)
              }}
            >
              <Pencil className="size-3.5" /> Edit class
            </Button>
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="size-3.5" /> Add sets
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        ) : isMember ? (
          <Button variant="outline" size="sm" onClick={() => void leave()} disabled={leaving}>
            {leaving ? 'Leaving…' : 'Leave class'}
          </Button>
        ) : (
          <Button size="sm" onClick={() => void join()} disabled={joining}>
            {joining ? 'Joining…' : 'Join class'}
          </Button>
        )}
      </div>
      {isMember && (
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('sets')}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === 'sets' ? 'bg-[#4255ff] text-white' : 'bg-white text-[#4a5065] hover:bg-[#e8eaf0]'}`}
          >
            Sets
          </button>
          <button
            type="button"
            onClick={() => setTab('members')}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === 'members' ? 'bg-[#4255ff] text-white' : 'bg-white text-[#4a5065] hover:bg-[#e8eaf0]'}`}
          >
            Members ({members.length})
          </button>
        </div>
      )}
      {tab === 'members' && isMember ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#e8eaf0] bg-white">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between border-b border-[#f0f1f5] px-4 py-3 last:border-0"
            >
              <span className="text-sm font-bold text-[#1a1d26]">
                {member.name || 'Unnamed member'}
              </span>
              <span className="rounded-full bg-[#eef0ff] px-2 py-0.5 text-xs font-bold text-[#2a35b8]">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <SectionLabel>Sets in this class ({sets.length})</SectionLabel>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((set, index) => (
              <div key={set.id} className="relative">
                <SetCard set={set as SetCardData} index={index} />
                {isAdmin && (
                  <button
                    type="button"
                    aria-label={`Remove ${set.title} from class`}
                    onClick={() => void removeSet(set.id)}
                    disabled={removingId === set.id}
                    className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-lg bg-white text-[#646f90] shadow-sm transition hover:bg-[#fef2f2] hover:text-[#e11d48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4255ff]"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {sets.length === 0 && (
            <div className="mt-4 rounded-2xl border border-[#e8eaf0] bg-white py-12 text-center text-sm font-medium text-[#4a5065]">
              No sets in this class yet.
            </div>
          )}
        </div>
      )}
      <Dialog
        open={editing}
        onClose={() => !saving && setEditing(false)}
        title="Edit class"
        description="Update class details and visibility."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="class-form" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <form
          id="class-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void saveClass(new FormData(event.currentTarget))
          }}
        >
          <Field id="class-name" label="Name" error={formError.name}>
            <Input
              {...fieldA11y('class-name', formError.name)}
              name="name"
              defaultValue={classData.name}
            />
          </Field>
          <Field id="class-description" label="Description" error={formError.description}>
            <Textarea
              {...fieldA11y('class-description', formError.description)}
              name="description"
              defaultValue={classData.description || ''}
              rows={3}
            />
          </Field>
          <Field id="class-school" label="School" error={formError.school}>
            <Input
              {...fieldA11y('class-school', formError.school)}
              name="school"
              defaultValue={classData.school || ''}
            />
          </Field>
          <Field id="class-visibility" label="Visibility">
            <DropdownSelect
              id="class-visibility"
              name="visibility"
              defaultValue={classData.visibility}
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
      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title="Add sets"
        description="Share one of your study sets with this class."
      >
        <div className="space-y-2">
          {availableSets.length ? (
            availableSets.map((set) => (
              <button
                type="button"
                key={set.id}
                onClick={() => void addSet(set)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-bold text-[#1a1d26] transition hover:bg-[#f6f7fb]"
              >
                <span>{set.title}</span>
                <Plus className="size-4 text-[#4255ff]" />
              </button>
            ))
          ) : (
            <p className="py-4 text-sm text-[#4a5065]">
              All of your sets are already in this class.
            </p>
          )}
        </div>
      </Dialog>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this class?"
        description="This removes the class and its memberships. Study sets remain in their owners’ libraries."
        confirmLabel="Delete class"
        danger
        loading={saving}
        onConfirm={() => void destroy()}
        onCancel={() => setConfirmDelete(false)}
      />
    </ProductPage>
  )
}

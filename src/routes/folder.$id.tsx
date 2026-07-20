import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ProductPage, SectionLabel } from '../components/product-layout'
import { SetCard, type SetCardData } from '../components/set-card'
import { Folder as FolderIcon, ArrowLeft, Pencil, Trash2, X } from 'lucide-react'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Field, fieldA11y } from '../components/ui/field'
import { ConfirmDialog } from '../components/confirm-dialog'
import { DropdownSelect } from '../components/ui/select'
import { deleteFolder, removeSetFromFolder, updateFolder } from '../lib/actions/folders'

const FolderForm = z.object({
  name: z.string().trim().min(1, 'Enter a folder name.').max(200),
  description: z.string().max(1000, 'Description must be 1,000 characters or less.'),
  visibility: z.enum(['private', 'public']),
})

export const Route = createFileRoute('/folder/$id')({
  beforeLoad: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const session = await getSession()
    if (!session) throw redirect({ to: '/signin' })
  },
  component: FolderPage,
})

function FolderPage() {
  const { id } = Route.useParams()
  const navigate = Route.useNavigate()
  const [folder, setFolder] = useState<any>(null)
  const [sets, setSets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/folders/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then((data) => {
        setFolder(data.folder)
        setSets(data.sets || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <ProductPage wide>
        <div className="h-6 w-32 animate-pulse rounded-md bg-[#e8eaf0] mb-6" />
        <div className="flex items-center gap-4 border-b border-[#e8eaf0] pb-6">
          <div className="size-12 animate-pulse rounded-xl bg-[#e8eaf0]" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded-md bg-[#e8eaf0]" />
            <div className="h-4 w-32 animate-pulse rounded-md bg-[#e8eaf0]" />
          </div>
        </div>
      </ProductPage>
    )
  }

  if (!folder) {
    return (
      <ProductPage wide>
        <div className="text-center py-12 text-sm text-[#4a5065]">Folder not found.</div>
      </ProductPage>
    )
  }

  async function saveFolder(form: FormData) {
    const result = FolderForm.safeParse({
      name: form.get('name'),
      description: form.get('description') || '',
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
      await updateFolder({ data: { folderId: id, ...result.data } })
      setFolder((current: any) => ({ ...current, ...result.data }))
      setEditing(false)
    } catch {
      setFormError({ form: 'Could not save this folder. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function removeSet(setId: string) {
    setRemovingId(setId)
    const previous = sets
    setSets((current) => current.filter((set) => set.id !== setId))
    try {
      await removeSetFromFolder({ data: { folderId: id, setId } })
    } catch {
      setSets(previous)
    } finally {
      setRemovingId(null)
    }
  }

  async function removeFolder() {
    setDeleting(true)
    try {
      await deleteFolder({ data: { folderId: id } })
      await navigate({ to: '/dashboard' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <ProductPage wide>
      <a
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#646f90] hover:text-[#1a1d26] mb-6 transition"
      >
        <ArrowLeft className="size-4" /> Back to library
      </a>

      <div className="flex flex-col gap-4 border-b border-[#e8eaf0] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#eef0ff] text-[#4255ff]">
            <FolderIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1a1d26]">{folder.name}</h1>
            {folder.description && <p className="text-sm text-[#4a5065]">{folder.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFormError({})
              setEditing(true)
            }}
          >
            <Pencil className="size-3.5" /> Edit folder
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-3.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <SectionLabel>Sets in this folder ({sets.length})</SectionLabel>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set: any, i: number) => (
            <div key={set.id} className="relative">
              <SetCard set={set as SetCardData} index={i} />
              <button
                type="button"
                onClick={() => void removeSet(set.id)}
                disabled={removingId === set.id}
                aria-label={`Remove ${set.title} from folder`}
                className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-lg bg-white text-[#646f90] shadow-sm transition hover:bg-[#fef2f2] hover:text-[#e11d48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4255ff] disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
        {sets.length === 0 && (
          <div className="mt-4 rounded-2xl border border-[#e8eaf0] bg-white py-12 text-center text-sm font-medium text-[#4a5065]">
            No sets in this folder yet.
          </div>
        )}
      </div>
      <Dialog
        open={editing}
        onClose={() => !saving && setEditing(false)}
        title="Edit folder"
        description="Update who can access this folder."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="folder-form" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <form
          id="folder-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void saveFolder(new FormData(event.currentTarget))
          }}
        >
          <Field id="folder-name" label="Name" error={formError.name}>
            <Input
              {...fieldA11y('folder-name', formError.name)}
              name="name"
              defaultValue={folder.name}
              maxLength={200}
            />
          </Field>
          <Field id="folder-description" label="Description" error={formError.description}>
            <Textarea
              {...fieldA11y('folder-description', formError.description)}
              name="description"
              defaultValue={folder.description || ''}
              rows={3}
              maxLength={1000}
            />
          </Field>
          <Field id="folder-visibility" label="Visibility">
            <DropdownSelect
              id="folder-visibility"
              name="visibility"
              defaultValue={folder.visibility}
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
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this folder?"
        description="The sets will remain in your library. This cannot be undone."
        confirmLabel="Delete folder"
        danger
        loading={deleting}
        onConfirm={() => void removeFolder()}
        onCancel={() => setConfirmDelete(false)}
      />
    </ProductPage>
  )
}

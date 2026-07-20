import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { cn } from '../lib/cn'
import {
  Layers,
  GraduationCap,
  FileQuestion,
  PenLine,
  LayoutGrid,
  Pencil,
  Trash2,
  Download,
  Share2,
  Check,
  MoreHorizontal,
  BookOpen,
  Folder,
  UsersRound,
  LoaderCircle,
  Volume2,
} from 'lucide-react'
import { CardSlider } from '../components/card-slider'
import { deleteSet } from '../../src/lib/actions/sets'
import { updateSetVisibility } from '../../src/lib/actions/sets'
import type { Card, StudySet } from '../../lib/types'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'
import { EmptyState } from '../components/empty-state'
import { Flashcard } from '../components/flashcard'
import { ConfirmDialog } from '../components/confirm-dialog'
import { ProductPage } from '../components/product-layout'
import { Tooltip } from '../components/ui/tooltip'
import { addSetToFolder, removeSetFromFolder } from '../lib/actions/folders'
import { addSetToClass, removeSetFromClass } from '../lib/actions/classes'

export const Route = createFileRoute('/set/$id/')({
  head: () => ({
    meta: [
      { title: 'Study set | Openlet' },
      {
        name: 'description',
        content:
          'View a flashcard study set on Openlet. Preview cards, choose a study mode, and start learning.',
      },
      { property: 'og:title', content: 'Study set | Openlet' },
      {
        property: 'og:description',
        content:
          'View a flashcard study set on Openlet. Preview cards, choose a study mode, and start learning.',
      },
      { name: 'twitter:title', content: 'Study set | Openlet' },
      {
        name: 'twitter:description',
        content:
          'View a flashcard study set on Openlet. Preview cards, choose a study mode, and start learning.',
      },
    ],
  }),
  beforeLoad: async () => {
    const { getSession } = await import('../../src/lib/auth/actions')
    const session = await getSession()
    if (!session) throw redirect({ to: '/signin' })
  },
  component: SetPage,
})

const MODES = [
  {
    href: 'flashcards',
    icon: Layers,
    title: 'Flashcards',
    desc: 'Review terms and definitions',
    color: '#4255ff',
    bg: '#eef0ff',
  },
  {
    href: 'learn',
    icon: GraduationCap,
    title: 'Learn',
    desc: 'Spaced repetition',
    color: '#0f9f6e',
    bg: '#ecfdf5',
  },
  {
    href: 'write',
    icon: PenLine,
    title: 'Write',
    desc: 'Type what you remember',
    color: '#c47a00',
    bg: '#fff7ed',
  },
  {
    href: 'test',
    icon: FileQuestion,
    title: 'Test',
    desc: 'Practice questions',
    color: '#db2777',
    bg: '#fdf2f8',
  },
  {
    href: 'match',
    icon: LayoutGrid,
    title: 'Match',
    desc: 'Get timed matching',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
] as const

function SetPage() {
  const { id } = Route.useParams()
  const navigate = Route.useNavigate()
  const [setData, setSetData] = useState<StudySet | null>(null)
  const [cardList, setCardList] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [previewIdx, setPreviewIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [savingVisibility, setSavingVisibility] = useState(false)
  const [organizeOpen, setOrganizeOpen] = useState(false)
  const [folders, setFolders] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [folderIds, setFolderIds] = useState<string[]>([])
  const [classIds, setClassIds] = useState<string[]>([])
  const [pendingLink, setPendingLink] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/sets/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setSetData(d.set)
        setCardList(d.cards || [])
        setIsPublic(d.set?.visibility === 'public')
        setFolderIds(d.folderIds || [])
        setClassIds(d.classIds || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetch('/api/dashboard')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) {
          setFolders(data.folders || [])
          setClasses(data.classes || [])
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setFlipped(false)
  }, [previewIdx])

  if (loading) {
    return (
      <ProductPage>
        <div className="h-10 w-64 animate-pulse rounded-lg bg-white" />
        <div className="mt-8 h-48 animate-pulse rounded-2xl bg-white" />
      </ProductPage>
    )
  }

  if (!setData) {
    return (
      <ProductPage>
        <p className="text-center text-[#4a5065]">Set not found</p>
      </ProductPage>
    )
  }

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    await deleteSet({ data: { setId: id } })
    navigate({ to: '/dashboard' })
  }

  function share() {
    navigator.clipboard.writeText(`${window.location.origin}/public/${id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setMenuOpen(false)
  }

  async function toggleLink(kind: 'folder' | 'class', collectionId: string, linked: boolean) {
    const key = `${kind}:${collectionId}`
    setPendingLink(key)
    const setIds = kind === 'folder' ? folderIds : classIds
    const update = kind === 'folder' ? setFolderIds : setClassIds
    update(linked ? setIds.filter((value) => value !== collectionId) : [...setIds, collectionId])
    try {
      if (kind === 'folder') {
        await (linked ? removeSetFromFolder : addSetToFolder)({
          data: { folderId: collectionId, setId: id },
        })
      } else {
        await (linked ? removeSetFromClass : addSetToClass)({
          data: { classId: collectionId, setId: id },
        })
      }
    } catch {
      update(setIds)
    } finally {
      setPendingLink(null)
    }
  }

  const disabled = cardList.length === 0

  return (
    <ProductPage>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7c84a0]">Study set</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#1a1d26]">
            {setData.title}
          </h1>
          {setData.description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#4a5065]">
              {setData.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#4a5065]">
            <span className="tabular-nums">{cardList.length} terms</span>
            {setData.subject && (
              <span className="rounded-full bg-[#eef0ff] px-2.5 py-0.5 text-xs font-bold text-[#2a35b8]">
                {setData.subject}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOrganizeOpen(true)}>
            <Folder className="size-3.5" /> Add to folder/class
          </Button>
          <Tooltip label="Edit set">
            <a href={`/set/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="size-3.5" /> Edit
              </Button>
            </a>
          </Tooltip>
          <div className="relative">
            <Tooltip label="More actions">
              <Button
                variant="outline"
                size="icon"
                aria-label="More"
                className="!size-8"
                onClick={() => setMenuOpen(true)}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </Tooltip>

            <Dialog
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              title="Set actions"
              description="Share, export, or manage this set"
              size="sm"
              sheetOnMobile
              showClose
            >
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={share}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#303545] transition hover:bg-[#f6f7fb]"
                >
                  {copied ? (
                    <Check className="size-5 text-[#4255ff]" />
                  ) : (
                    <Share2 className="size-5 text-[#646f90]" />
                  )}
                  <span>{copied ? 'Link copied!' : 'Copy share link'}</span>
                </button>

                <a
                  href={`/api/sets/${id}/export/csv`}
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#303545] transition hover:bg-[#f6f7fb]"
                >
                  <Download className="size-5 text-[#646f90]" />
                  <span>Export as CSV</span>
                </a>

                <div className="border-t border-[#edeff4] my-1" />

                <button
                  type="button"
                  onClick={async () => {
                    setSavingVisibility(true)
                    try {
                      const next = !isPublic
                      await updateSetVisibility({
                        data: { setId: id, visibility: next ? 'public' : 'private' },
                      })
                      setIsPublic(next)
                    } catch {}
                    setSavingVisibility(false)
                  }}
                  disabled={savingVisibility}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#303545] transition hover:bg-[#f6f7fb]"
                >
                  <BookOpen className="size-5 text-[#646f90]" />
                  <span>{isPublic ? 'Make private' : 'Make public (shared link)'}</span>
                </button>

                <div className="border-t border-[#edeff4] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    setConfirmDelete(true)
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#e11d48] transition hover:bg-[#fef2f2]"
                >
                  <Trash2 className="size-5" />
                  <span>Delete set</span>
                </button>
              </div>
            </Dialog>
          </div>
        </div>
      </div>

      {cardList.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-[#e8eaf0] bg-white">
          <EmptyState
            icon={BookOpen}
            title="No cards yet"
            description="Add terms and definitions to start studying."
            action={
              <a href={`/set/${id}/edit`}>
                <Button size="sm">Add cards</Button>
              </a>
            }
          />
        </div>
      ) : (
        <>
          {/* Preview flipper with CardSlider */}
          <div className="mx-auto mt-10 max-w-xl">
            <CardSlider
              index={previewIdx}
              count={cardList.length}
              onIndexChange={(next) => {
                setPreviewIdx(next)
                setFlipped(false)
              }}
              controls={(api) => {
                return (
                  <div className="mt-4 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={api.index === 0 || api.busy}
                      onClick={() => api.go(-1)}
                    >
                      Prev
                    </Button>
                    <span className="text-xs font-bold tabular-nums text-[#7c84a0]">
                      {api.index + 1} / {api.count}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={api.index >= api.count - 1 || api.busy}
                      onClick={() => api.go(1)}
                    >
                      Next
                    </Button>
                  </div>
                )
              }}
            >
              {(i) => {
                const card = cardList[i]
                return (
                  <Flashcard
                    term={card.term}
                    definition={card.definition}
                    flipped={flipped}
                    onFlip={() => setFlipped((f) => !f)}
                    isStarred={card.isStarred}
                    onToggleStar={async (e) => {
                      e.stopPropagation()
                      const { toggleCardStar } = await import('../lib/actions/study')
                      const isStarred = !card.isStarred
                      setCardList(cards => cards.map(c => c.id === card.id ? { ...c, isStarred } : c))
                      try {
                        await toggleCardStar({ data: { cardId: card.id, setId: id, isStarred } })
                      } catch {
                        setCardList(cards => cards.map(c => c.id === card.id ? { ...c, isStarred: !isStarred } : c))
                      }
                    }}
                  />
                )
              }}
            </CardSlider>
          </div>

          {/* Mode selector tiles */}
          <section className="mt-12">
            <h2 className="text-sm font-bold text-[#1a1d26]">Choose a study mode</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MODES.map((m) => (
                <a
                  key={m.href}
                  href={disabled ? undefined : `/set/${id}/${m.href}`}
                  className={`flex items-center gap-4 rounded-2xl border border-[#e8eaf0] bg-white p-4 shadow-sm transition ${
                    disabled
                      ? 'pointer-events-none opacity-40'
                      : 'hover:-translate-y-0.5 hover:border-[#d5d9e4] hover:shadow-md'
                  }`}
                >
                  <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: m.bg, color: m.color }}
                  >
                    <m.icon className="size-6" strokeWidth={2.25} />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-[#1a1d26]">{m.title}</p>
                    <p className="mt-0.5 text-sm text-[#4a5065]">{m.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Term list */}
          <section className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1a1d26]">
                Terms in this set ({cardList.length})
              </h2>
              <a
                href={`/set/${id}/edit`}
                className="text-sm font-bold text-[#4255ff] hover:underline"
              >
                Add or remove terms
              </a>
            </div>
            <ul className="mt-3 overflow-hidden rounded-2xl border border-[#e8eaf0] bg-white">
              {cardList.map((card, i) => (
                <li
                  key={card.id}
                  className="grid gap-4 border-b border-[#f0f1f5] px-4 py-4 last:border-0 sm:grid-cols-[1fr_1fr_auto] sm:gap-8 items-start"
                >
                  <div className="flex gap-3 items-start min-w-0">
                    <span className="w-5 shrink-0 mt-0.5 text-xs font-bold tabular-nums text-[#7c84a0]">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1a1d26] break-words">{card.term}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start pl-8 sm:pl-0 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#4a5065] break-words">{card.definition}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        const { toggleCardStar } = await import('../lib/actions/study')
                        const isStarred = !card.isStarred
                        setCardList(cards => cards.map(c => c.id === card.id ? { ...c, isStarred } : c))
                        try {
                          await toggleCardStar({ data: { cardId: card.id, setId: id, isStarred } })
                        } catch {
                          setCardList(cards => cards.map(c => c.id === card.id ? { ...c, isStarred: !isStarred } : c))
                        }
                      }}
                      className={cn(
                        "rounded-lg p-1.5 transition",
                        card.isStarred ? "text-[#f59e0b] hover:bg-[#fffbeb]" : "text-[#7c84a0] hover:bg-[#f6f7fb] hover:text-[#1a1d26]"
                      )}
                      aria-label={card.isStarred ? "Unstar card" : "Star card"}
                    >
                      {card.isStarred ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.536a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!('speechSynthesis' in window)) return
                        window.speechSynthesis.cancel()
                        window.speechSynthesis.speak(new SpeechSynthesisUtterance(card.term + '. ' + card.definition))
                      }}
                      className="rounded-lg p-1.5 text-[#7c84a0] hover:bg-[#f6f7fb] hover:text-[#1a1d26] transition shrink-0"
                      aria-label="Listen to term and definition"
                    >
                      <Volume2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this set?"
        description="This permanently removes the set and study progress. This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
      <Dialog
        open={organizeOpen}
        onClose={() => setOrganizeOpen(false)}
        title="Add to folder or class"
        description="Changes are saved immediately."
        size="md"
      >
        <div className="space-y-5">
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1a1d26]">
              <Folder className="size-4 text-[#4255ff]" /> Folders
            </h3>
            {folders.length ? (
              <div className="overflow-hidden rounded-xl border border-[#e8eaf0]">
                {folders.map((folder) => {
                  const linked = folderIds.includes(folder.id)
                  const pending = pendingLink === `folder:${folder.id}`
                  return (
                    <label
                      key={folder.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-[#f0f1f5] px-3 py-3 last:border-0 hover:bg-[#f6f7fb]"
                    >
                      <input
                        type="checkbox"
                        checked={linked}
                        disabled={pending}
                        onChange={() => void toggleLink('folder', folder.id, linked)}
                        className="size-4 rounded border-[#d9dde8] text-[#4255ff] focus:ring-[#4255ff]"
                      />
                      <span className="min-w-0 flex-1 text-sm font-semibold text-[#1a1d26]">
                        {folder.name}
                      </span>
                      {pending && <LoaderCircle className="size-4 animate-spin text-[#4255ff]" />}
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[#646f90]">Create a folder from your library first.</p>
            )}
          </section>
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1a1d26]">
              <UsersRound className="size-4 text-[#4255ff]" /> Classes
            </h3>
            {classes.length ? (
              <div className="overflow-hidden rounded-xl border border-[#e8eaf0]">
                {classes.map((classItem) => {
                  const linked = classIds.includes(classItem.id)
                  const pending = pendingLink === `class:${classItem.id}`
                  return (
                    <label
                      key={classItem.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-[#f0f1f5] px-3 py-3 last:border-0 hover:bg-[#f6f7fb]"
                    >
                      <input
                        type="checkbox"
                        checked={linked}
                        disabled={pending}
                        onChange={() => void toggleLink('class', classItem.id, linked)}
                        className="size-4 rounded border-[#d9dde8] text-[#4255ff] focus:ring-[#4255ff]"
                      />
                      <span className="min-w-0 flex-1 text-sm font-semibold text-[#1a1d26]">
                        {classItem.name}
                      </span>
                      {pending && <LoaderCircle className="size-4 animate-spin text-[#4255ff]" />}
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[#646f90]">
                Join or create a class from your library first.
              </p>
            )}
          </section>
        </div>
      </Dialog>
    </ProductPage>
  )
}

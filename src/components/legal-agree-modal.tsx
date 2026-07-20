import { useEffect, useRef, useState } from 'react'
import { Dialog } from './ui/dialog'
import { Button } from './ui/button'
import type { LegalDoc } from '../lib/legal'

/**
 * Scroll-to-bottom agree modal.
 * No sticky overlay on the text: status lives in the footer CTA only.
 */
export function LegalAgreeModal({
  open,
  doc,
  alreadyAgreed,
  onAgree,
  onClose,
}: {
  open: boolean
  doc: LegalDoc
  alreadyAgreed?: boolean
  onAgree: () => void
  onClose: () => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    if (!open) return
    setAtBottom(false)
    requestAnimationFrame(() => {
      const node = scrollerRef.current
      if (!node) return
      if (node.scrollHeight <= node.clientHeight + 8) setAtBottom(true)
    })
  }, [open, doc.title])

  function onScroll() {
    const el = scrollerRef.current
    if (!el) return
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
    if (remaining <= 24) setAtBottom(true)
  }

  const canAgree = alreadyAgreed || atBottom

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={doc.title}
      description={`Last updated ${doc.lastUpdated}`}
      size="lg"
      sheetOnMobile
      bodyClassName="!p-0"
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
          <Button
            size="md"
            className="w-full sm:w-auto"
            disabled={!canAgree}
            onClick={() => {
              onAgree()
              onClose()
            }}
          >
            {alreadyAgreed ? 'Agreed' : canAgree ? 'I agree' : 'Scroll to continue'}
          </Button>
        </>
      }
    >
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="max-h-[min(52dvh,440px)] overflow-y-auto px-4 py-4 sm:max-h-[min(58dvh,500px)] sm:px-6 sm:py-5"
      >
        <div className="space-y-5">
          {doc.sections.map((s) => (
            <section key={s.heading}>
              <h3 className="text-sm font-bold text-[#303545] ">{s.heading}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#646f90]">{s.body}</p>
            </section>
          ))}
        </div>
        {/* Scroll sentinel: no overlay, just end padding so last lines stay readable */}
        <div className="h-2" aria-hidden />
      </div>
    </Dialog>
  )
}

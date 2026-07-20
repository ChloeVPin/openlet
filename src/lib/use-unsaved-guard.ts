import { useEffect } from 'react'

/**
 * Warn before closing the tab / hard navigation when dirty.
 * Pair with confirmLeave() for in-app links.
 */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])
}

export function confirmLeave(dirty: boolean, message = 'Discard unsaved changes?'): boolean {
  if (!dirty) return true
  return window.confirm(message)
}

import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Makes a `role="dialog" aria-modal="true"` panel behave the way that markup
 * promises: focus starts inside it, Tab cannot walk out into the page behind,
 * Escape closes it, the page does not scroll underneath, and focus returns to
 * whatever opened it.
 *
 * Without this, `aria-modal="true"` is a claim to assistive technology that the
 * rest of the page is inert while every background control is still tabbable
 * and activatable behind a dimmed backdrop.
 *
 * Returns a ref to attach to the panel element.
 */
export function useModal<T extends HTMLElement>(onClose: () => void) {
  const panelRef = useRef<T>(null)

  // Kept in a ref so the effect does not re-run — and re-steal focus — when the
  // caller passes a fresh closure on every render, which is the common case.
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = () =>
      [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      )

    // Prefer the first natural control, falling back to the panel itself so
    // focus is never left outside. `preventScroll` throughout: the panel is
    // fixed and already visible, and scrolling the page underneath to satisfy
    // a focus call is exactly what this hook is trying to avoid.
    const first = focusables()[0]
    if (first) first.focus({ preventScroll: true })
    else {
      panel.tabIndex = -1
      panel.focus({ preventScroll: true })
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const elements = focusables()
      if (elements.length === 0) {
        event.preventDefault()
        return
      }
      const firstElement = elements[0]
      const lastElement = elements[elements.length - 1]
      const active = document.activeElement

      // Wrap at both ends, and pull focus back in if it has escaped the panel
      // by any other route.
      if (!panel.contains(active)) {
        event.preventDefault()
        ;(event.shiftKey ? lastElement : firstElement)?.focus({ preventScroll: true })
      } else if (event.shiftKey && active === firstElement) {
        event.preventDefault()
        lastElement?.focus({ preventScroll: true })
      } else if (!event.shiftKey && active === lastElement) {
        event.preventDefault()
        firstElement?.focus({ preventScroll: true })
      }
    }

    window.addEventListener('keydown', onKeyDown)

    // Lock the page behind the panel.
    //
    // `overflow: hidden` alone is not enough: it collapses the document's
    // scrollable range, so the browser clamps the current offset and the
    // reader loses their place the instant a drawer opens. Pinning the body at
    // a negative offset preserves the position exactly, and is also the only
    // form of scroll lock iOS Safari honours. Padding compensates for the
    // scrollbar that disappears, so the layout does not jump sideways.
    const { body } = document
    const scrollY = window.scrollY
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    }
    const gap = window.innerWidth - document.documentElement.clientWidth

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    if (gap > 0) body.style.paddingRight = `${gap}px`

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      body.style.overflow = previous.overflow
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      body.style.paddingRight = previous.paddingRight
      window.scrollTo({ top: scrollY, behavior: 'instant' })
      // Only restore focus if it is still somewhere inside the closing panel;
      // otherwise the user has already moved on and we would yank it back.
      if (previouslyFocused?.isConnected && !document.activeElement?.closest('[role="dialog"]')) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [])

  return panelRef
}

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Copies text and shows a short confirmation.
 *
 * The timer is stored and cleared. Without that, a second copy while the first
 * confirmation is still showing leaves the older timeout running, and it clears
 * the label early — the user sees "Copied" flick off a fraction of a second
 * after their most recent click. The same handle also cancels on unmount.
 */
export function useCopy(resetAfterMs = 1600) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const copy = useCallback(
    (text: string) => {
      void navigator.clipboard.writeText(text).then(
        () => {
          if (timer.current) clearTimeout(timer.current)
          setCopied(true)
          timer.current = setTimeout(() => setCopied(false), resetAfterMs)
        },
        () => setCopied(false),
      )
    },
    [resetAfterMs],
  )

  return { copied, copy }
}

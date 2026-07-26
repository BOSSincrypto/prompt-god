import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/index.tsx'
import type { Locale } from '@/i18n/types.ts'

export type Async<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; error: Error }

interface Loaded<T> {
  /** The locale this result belongs to, so a stale result is never shown. */
  locale: Locale
  value: Exclude<Async<T>, { status: 'loading' }>
}

/**
 * Loads a locale-specific content bundle.
 *
 * Deliberately not `use()` + Suspense: a content chunk can fail to arrive
 * (offline before it was cached, stale service worker after a deploy), and an
 * inline error with a retry is a better answer than a thrown promise that
 * unmounts the page.
 *
 * The loaded value carries its locale rather than being reset by an effect, so
 * switching language shows the loading state immediately on the same render
 * instead of briefly showing the previous language's content.
 */
export function useContent<T>(load: (locale: Locale) => Promise<T>): Async<T> {
  const { locale } = useI18n()
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null)

  useEffect(() => {
    let cancelled = false
    load(locale).then(
      (data) => {
        if (!cancelled) setLoaded({ locale, value: { status: 'ready', data } })
      },
      (error: unknown) => {
        if (!cancelled) {
          setLoaded({
            locale,
            value: {
              status: 'error',
              error: error instanceof Error ? error : new Error(String(error)),
            },
          })
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [locale, load])

  return loaded && loaded.locale === locale ? loaded.value : { status: 'loading' }
}

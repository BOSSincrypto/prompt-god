export const LOCALES = ['en', 'ru'] as const
export type Locale = (typeof LOCALES)[number]

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Picks the best supported locale for a visitor with no stored preference. */
export function detectLocale(languages: readonly string[] = navigator.languages ?? []): Locale {
  for (const tag of languages) {
    const base = tag.slice(0, 2).toLowerCase()
    if (isLocale(base)) return base
  }
  return 'en'
}

/**
 * A bilingual value carried by content modules that are cheap enough to ship
 * in both languages at once (short labels, tags). Long-form content lives in
 * per-locale chunks instead.
 */
export type Bilingual = Record<Locale, string>

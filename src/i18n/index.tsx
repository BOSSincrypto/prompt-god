import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { en, type Dict, type DictKey } from './en.ts'
import { ru } from './ru.ts'
import type { Locale } from './types.ts'

export * from './types.ts'
export type { Dict, DictKey }

/**
 * Both dictionaries are a few kilobytes of static strings, so they ship in the
 * main chunk. Long-form course content is what gets split per locale.
 */
const DICTS: Record<Locale, Dict> = { en, ru }

export type TFunction = (key: DictKey, vars?: Record<string, string | number>) => string

interface I18nValue {
  locale: Locale
  t: TFunction
}

const I18nContext = createContext<I18nValue | null>(null)

const INTERPOLATION = /\{(\w+)\}/g

export function translate(
  dict: Dict,
  key: DictKey,
  vars?: Record<string, string | number>,
): string {
  const template = dict[key]
  if (!vars) return template
  return template.replace(INTERPOLATION, (match, name: string) => {
    const value = vars[name]
    return value === undefined ? match : String(value)
  })
}

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dict = DICTS[locale]
  const t = useCallback<TFunction>((key, vars) => translate(dict, key, vars), [dict])
  const value = useMemo(() => ({ locale, t }), [locale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

/** Convenience hook for the common case of only needing the translator. */
export function useT(): TFunction {
  return useI18n().t
}

/** Picks the right half of a bilingual content value. */
export function pick<T>(value: Record<Locale, T>, locale: Locale): T {
  return value[locale]
}

import { create } from 'zustand'
import { detectLocale, isLocale, type Locale } from '@/i18n/types.ts'
import { readLocal, writeLocal } from '@/lib/storage.ts'
import type { ModelFamilyId } from '@/engine/models.ts'

export type ThemeSetting = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export interface Prefs {
  theme: ThemeSetting
  locale: Locale
  reduceMotion: boolean | null
  targetModel: ModelFamilyId
}

/** Shared with the inline bootstrap script in index.html — keep the shape stable. */
const PREFS_KEY = 'pg:prefs'

const DEFAULTS: Prefs = {
  theme: 'system',
  locale: 'en',
  reduceMotion: null,
  targetModel: 'generic',
}

function loadPrefs(): Prefs {
  const stored = readLocal<Partial<Prefs>>(PREFS_KEY, {})
  return {
    theme:
      stored.theme === 'light' || stored.theme === 'dark' || stored.theme === 'system'
        ? stored.theme
        : DEFAULTS.theme,
    locale: isLocale(stored.locale) ? stored.locale : detectLocale(),
    reduceMotion: typeof stored.reduceMotion === 'boolean' ? stored.reduceMotion : null,
    targetModel: stored.targetModel ?? DEFAULTS.targetModel,
  }
}

interface PrefsStore extends Prefs {
  setTheme: (theme: ThemeSetting) => void
  setLocale: (locale: Locale) => void
  setReduceMotion: (value: boolean | null) => void
  setTargetModel: (family: ModelFamilyId) => void
}

export const usePrefs = create<PrefsStore>()((set, get) => {
  const persist = () => {
    const { theme, locale, reduceMotion, targetModel } = get()
    writeLocal(PREFS_KEY, { theme, locale, reduceMotion, targetModel })
  }

  return {
    ...loadPrefs(),
    setTheme: (theme) => {
      set({ theme })
      persist()
    },
    setLocale: (locale) => {
      set({ locale })
      persist()
    },
    setReduceMotion: (reduceMotion) => {
      set({ reduceMotion })
      persist()
    },
    setTargetModel: (targetModel) => {
      set({ targetModel })
      persist()
    },
  }
})

export function resolveTheme(setting: ThemeSetting): ResolvedTheme {
  if (setting !== 'system') return setting
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

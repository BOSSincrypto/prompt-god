import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import { useT } from '@/i18n/index.tsx'
import { cx } from '@/lib/cx.ts'
import { usePrefs } from '@/store/prefs.ts'
import { Icon } from '@/ui/Icon.tsx'
import { isActive, Link, useRouter } from './router.tsx'
import { NAV_ROUTES } from './routes.ts'

const CommandPalette = lazy(() => import('./CommandPalette.tsx'))
const UpdatePrompt = lazy(() => import('./UpdatePrompt.tsx'))

/**
 * Contains a failed lazy chunk instead of letting it reach the app-wide
 * boundary. A stale service worker after a deploy can make any chunk fetch
 * fail; losing the whole page because an update toast could not load is a
 * wildly disproportionate outcome for what these two overlays do.
 */
class Optional extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override componentDidCatch(error: Error) {
    console.warn('[prompt-god] optional overlay failed to load', error)
  }

  override render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * True on Apple platforms, where the palette shortcut is ⌘K rather than Ctrl+K.
 * Read once in a lazy initialiser: the app is client-only, so there is no
 * hydration mismatch to avoid and no reason to spend a second render on it.
 */
const IS_APPLE = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)

function Logo() {
  return (
    <Link
      to="/"
      className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight"
      aria-label="Prompt God"
    >
      <svg viewBox="0 0 64 64" className="size-7 rounded-[9px]" aria-hidden="true">
        <defs>
          <linearGradient id="pg-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8f74ff" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#pg-mark)" />
        <path
          d="M20 21 32 32 20 43M37 43h9"
          fill="none"
          stroke="#08080c"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Prompt God</span>
    </Link>
  )
}

function ThemeToggle() {
  const theme = usePrefs((s) => s.theme)
  const setTheme = usePrefs((s) => s.setTheme)
  const t = useT()

  // A single cycling button rather than a menu: three states, one target.
  const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
  const icon = theme === 'system' ? 'monitor' : theme === 'light' ? 'sun' : 'moon'
  const label = t(
    theme === 'system'
      ? 'settings.theme.system'
      : theme === 'light'
        ? 'settings.theme.light'
        : 'settings.theme.dark',
  )

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="grid size-9 place-items-center rounded-field text-muted transition-colors hover:bg-accent-soft hover:text-fg"
      title={`${t('settings.theme')}: ${label}`}
      aria-label={`${t('settings.theme')}: ${label}`}
    >
      <Icon name={icon} size={18} />
    </button>
  )
}

function LocaleToggle() {
  const locale = usePrefs((s) => s.locale)
  const setLocale = usePrefs((s) => s.setLocale)
  const t = useT()
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'en' ? 'ru' : 'en')}
      className="h-9 rounded-field px-2.5 text-[0.8125rem] font-semibold uppercase tracking-wide text-muted transition-colors hover:bg-accent-soft hover:text-fg"
      title={t('settings.language')}
      aria-label={t('settings.language')}
    >
      {locale}
    </button>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const t = useT()
  const { path } = useRouter()
  const [paletteOpen, setPaletteOpen] = useState(false)

  const openPalette = useCallback(() => setPaletteOpen(true), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-field focus:bg-surface focus:px-4 focus:py-2 focus:shadow-card"
      >
        {t('nav.skipToContent')}
      </a>

      <header className="sticky top-0 z-30 border-b border-line glass">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Logo />

          <nav aria-label="Primary" className="ml-4 hidden items-center gap-0.5 md:flex">
            {NAV_ROUTES.map((route) => {
              const active = isActive(path, route.pattern)
              return (
                <Link
                  key={route.pattern}
                  to={route.pattern}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'rounded-field px-3 py-1.5 text-sm font-medium transition-colors',
                    active ? 'bg-accent-soft text-accent' : 'text-muted hover:text-fg',
                  )}
                >
                  {t(route.nav.labelKey)}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={openPalette}
              className="flex h-9 items-center gap-2 rounded-field border border-line bg-sunken px-2.5 text-sm text-subtle transition-colors hover:border-line-strong sm:px-3"
              aria-label={t('common.search')}
            >
              <Icon name="search" size={16} />
              <kbd className="hidden font-sans text-[0.6875rem] tracking-wide lg:inline">
                {IS_APPLE ? '⌘' : 'Ctrl'} K
              </kbd>
            </button>

            <LocaleToggle />
            <ThemeToggle />

            <Link
              to="/settings"
              aria-label={t('nav.settings')}
              aria-current={path === '/settings' ? 'page' : undefined}
              className={cx(
                'grid size-9 place-items-center rounded-field transition-colors hover:bg-accent-soft hover:text-fg',
                path === '/settings' ? 'text-accent' : 'text-muted',
              )}
            >
              <Icon name="settings" size={18} />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      <footer className="relative z-10 hidden border-t border-line py-8 md:block">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-subtle sm:px-6">
          <span>{t('app.tagline')}</span>
          <a
            href="https://github.com/BOSSincrypto/prompt-god"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"
          >
            {t('settings.sourceCode')}
            <Icon name="external" size={13} />
          </a>
        </div>
      </footer>

      {/* Bottom tab bar: on a phone this is where a PWA's navigation belongs. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line glass pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="flex">
          {NAV_ROUTES.map((route) => {
            const active = isActive(path, route.pattern)
            return (
              <Link
                key={route.pattern}
                to={route.pattern}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.625rem] font-medium transition-colors',
                  active ? 'text-accent' : 'text-subtle',
                )}
              >
                <Icon name={route.nav.icon} size={19} />
                {t(route.nav.labelKey)}
              </Link>
            )
          })}
        </div>
      </nav>

      {paletteOpen && (
        <Optional>
          <Suspense fallback={null}>
            <CommandPalette onClose={() => setPaletteOpen(false)} />
          </Suspense>
        </Optional>
      )}

      <Optional>
        <Suspense fallback={null}>
          <UpdatePrompt />
        </Suspense>
      </Optional>
    </div>
  )
}

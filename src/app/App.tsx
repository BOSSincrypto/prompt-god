import { Component, Suspense, useEffect, type ErrorInfo, type ReactNode } from 'react'
import { I18nProvider, useT } from '@/i18n/index.tsx'
import { resolveTheme, usePrefs } from '@/store/prefs.ts'
import { flushProgress, useProgress } from '@/store/progress.ts'
import { Button, Page, RouteFallback } from '@/ui/primitives.tsx'
import { AppShell } from './AppShell.tsx'
import { RouterProvider, useRouter } from './router.tsx'
import { routeFor, ROUTE_PATTERNS } from './routes.ts'

/* -------------------------------------------------------------------------- */
/* Error boundary                                                             */
/* -------------------------------------------------------------------------- */

interface BoundaryState {
  error: Error | null
}

class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  override state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[prompt-god] render error', error, info.componentStack)
  }

  override render() {
    if (!this.state.error) return this.props.children
    return <ErrorScreen error={this.state.error} />
  }
}

function ErrorScreen({ error }: { error: Error }) {
  const t = useT()
  return (
    <Page className="max-w-xl">
      <h1 className="mb-3 text-2xl font-semibold">{t('error.title')}</h1>
      <p className="mb-6 text-muted">{t('error.body')}</p>
      <Button variant="primary" icon="refresh" onClick={() => window.location.reload()}>
        {t('error.reload')}
      </Button>
      <details className="mt-8 text-sm text-subtle">
        <summary className="cursor-pointer">{t('error.details')}</summary>
        <pre className="mt-2 overflow-x-auto rounded-field bg-sunken p-3 text-xs">
          {error.message}
        </pre>
      </details>
    </Page>
  )
}

/* -------------------------------------------------------------------------- */
/* Not found                                                                  */
/* -------------------------------------------------------------------------- */

function NotFound() {
  const t = useT()
  const { navigate } = useRouter()
  return (
    <Page className="max-w-xl">
      <h1 className="mb-3 text-2xl font-semibold">{t('notfound.title')}</h1>
      <p className="mb-6 text-muted">{t('notfound.body')}</p>
      <Button variant="primary" icon="home" onClick={() => navigate('/')}>
        {t('notfound.home')}
      </Button>
    </Page>
  )
}

/* -------------------------------------------------------------------------- */
/* Route outlet                                                               */
/* -------------------------------------------------------------------------- */

function Outlet() {
  const { pattern } = useRouter()
  const route = routeFor(pattern)
  if (!route) return <NotFound />
  const { Component: Screen } = route
  return (
    <Suspense fallback={<RouteFallback />}>
      <Screen />
    </Suspense>
  )
}

/* -------------------------------------------------------------------------- */
/* Document-level effects                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Keeps <html> in sync with preferences. The inline script in index.html does
 * this once before first paint; from then on it is React's job.
 */
function useDocumentPrefs() {
  const theme = usePrefs((s) => s.theme)
  const locale = usePrefs((s) => s.locale)
  const reduceMotion = usePrefs((s) => s.reduceMotion)

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(theme)
    }
    apply()
    if (theme !== 'system') return
    const media = matchMedia('(prefers-color-scheme: light)')
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    const root = document.documentElement
    if (reduceMotion === null) delete root.dataset.motion
    else root.dataset.motion = reduceMotion ? 'reduce' : 'full'
  }, [reduceMotion])
}

function Root() {
  useDocumentPrefs()

  // Hydrated once, here, rather than by each screen that happens to read
  // progress. Any screen that mutates progress before the stored state has
  // been read would otherwise persist empty defaults over it.
  const hydrate = useProgress((s) => s.hydrate)
  useEffect(() => {
    void hydrate()
  }, [hydrate])

  // Progress writes are coalesced, so the last action can still be in memory
  // when the page goes away. These are the two events that fire on mobile.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flushProgress()
    }
    window.addEventListener('pagehide', flushProgress)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.removeEventListener('pagehide', flushProgress)
      document.removeEventListener('visibilitychange', onHidden)
    }
  }, [])

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export function App() {
  const locale = usePrefs((s) => s.locale)
  return (
    <I18nProvider locale={locale}>
      <ErrorBoundary>
        <RouterProvider patterns={ROUTE_PATTERNS}>
          <Root />
        </RouterProvider>
      </ErrorBoundary>
    </I18nProvider>
  )
}

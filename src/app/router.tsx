import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'

/**
 * A ~120-line router. The app has a handful of static routes with at most one
 * dynamic segment, which is well under what a routing library earns its
 * kilobytes on. Everything it supports is used; nothing else is implemented.
 */

export interface RouteMatch {
  /** The matched pattern, e.g. "/learn/:lessonId". */
  pattern: string
  /** Decoded dynamic segments. */
  params: Record<string, string>
  path: string
  search: URLSearchParams
  hash: string
}

interface RouterValue extends RouteMatch {
  navigate: (to: string, options?: { replace?: boolean }) => void
}

const RouterContext = createContext<RouterValue | null>(null)

function currentLocation() {
  return {
    path: window.location.pathname || '/',
    search: new URLSearchParams(window.location.search),
    hash: window.location.hash,
  }
}

/**
 * Matches a pathname against patterns containing `:param` segments.
 * Patterns are tried in the order given, so put specific ones first.
 */
export function matchRoute(
  patterns: readonly string[],
  path: string,
): { pattern: string; params: Record<string, string> } | null {
  const segments = path.replace(/\/+$/, '').split('/').filter(Boolean)

  for (const pattern of patterns) {
    const parts = pattern.replace(/\/+$/, '').split('/').filter(Boolean)
    if (parts.length !== segments.length) continue

    const params: Record<string, string> = {}
    let ok = true
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const segment = segments[i]
      if (part === undefined || segment === undefined) {
        ok = false
        break
      }
      if (part.startsWith(':')) {
        params[part.slice(1)] = decodeURIComponent(segment)
      } else if (part !== segment) {
        ok = false
        break
      }
    }
    if (ok) return { pattern, params }
  }
  return null
}

export function RouterProvider({
  patterns,
  children,
}: {
  patterns: readonly string[]
  children: ReactNode
}) {
  const [location, setLocation] = useState(currentLocation)

  useEffect(() => {
    const onPopState = () => startTransition(() => setLocation(currentLocation()))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback<RouterValue['navigate']>((to, options) => {
    const url = new URL(to, window.location.origin)
    const previousPath = window.location.pathname
    const same = url.pathname === previousPath && url.search === window.location.search

    if (options?.replace || same) window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)

    startTransition(() => setLocation(currentLocation()))

    // Scroll to the top on a real page change only. A query-only change is
    // used for UI state — the pattern drawer, for one — and resetting the
    // scroll there throws away the reader's place in a long list every time
    // they open a card.
    if (!url.hash && url.pathname !== previousPath) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [])

  const value = useMemo<RouterValue>(() => {
    const matched = matchRoute(patterns, location.path)
    return {
      pattern: matched?.pattern ?? '*',
      params: matched?.params ?? {},
      path: location.path,
      search: location.search,
      hash: location.hash,
      navigate,
    }
  }, [patterns, location, navigate])

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('useRouter must be used inside <RouterProvider>')
  return ctx
}

export function useNavigate() {
  return useRouter().navigate
}

/** True when `href` is the current page, or an ancestor of it for `nested`. */
export function isActive(current: string, href: string, nested = true): boolean {
  if (href === '/') return current === '/'
  if (current === href) return true
  return nested && current.startsWith(`${href}/`)
}

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
  replace?: boolean
}

export function Link({ to, replace, onClick, ...rest }: LinkProps) {
  const navigate = useNavigate()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    // Let the browser handle modified clicks and anything not a plain left click.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return
    if (rest.target && rest.target !== '_self') return
    if (/^[a-z]+:/i.test(to)) return

    event.preventDefault()
    navigate(to, replace === undefined ? {} : { replace })
  }

  return <a href={to} onClick={handleClick} {...rest} />
}

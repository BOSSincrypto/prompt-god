import { lazy, type ComponentType } from 'react'
import type { IconName } from '@/ui/Icon.tsx'
import type { DictKey } from '@/i18n/en.ts'

/**
 * Route table. Every screen is a separate lazily loaded chunk, so the initial
 * download is the shell plus whichever page was asked for.
 */

export interface RouteDef {
  pattern: string
  Component: ComponentType
  /** Present when the route belongs in the primary navigation. */
  nav?: { labelKey: DictKey; icon: IconName; order: number }
}

export const ROUTES: readonly RouteDef[] = [
  {
    pattern: '/',
    Component: lazy(() => import('@/features/home/HomePage.tsx')),
    nav: { labelKey: 'nav.home', icon: 'home', order: 0 },
  },
  {
    pattern: '/learn',
    Component: lazy(() => import('@/features/learn/LearnPage.tsx')),
    nav: { labelKey: 'nav.learn', icon: 'book', order: 1 },
  },
  {
    pattern: '/learn/:lessonId',
    Component: lazy(() => import('@/features/learn/LessonPage.tsx')),
  },
  {
    pattern: '/lab',
    Component: lazy(() => import('@/features/lab/LabPage.tsx')),
    nav: { labelKey: 'nav.lab', icon: 'flask', order: 2 },
  },
  {
    pattern: '/patterns',
    Component: lazy(() => import('@/features/patterns/PatternsPage.tsx')),
    nav: { labelKey: 'nav.patterns', icon: 'grid', order: 3 },
  },
  {
    pattern: '/models',
    Component: lazy(() => import('@/features/models/ModelsPage.tsx')),
    nav: { labelKey: 'nav.models', icon: 'chip', order: 4 },
  },
  {
    pattern: '/progress',
    Component: lazy(() => import('@/features/progress/ProgressPage.tsx')),
    nav: { labelKey: 'nav.progress', icon: 'chart', order: 5 },
  },
  {
    pattern: '/settings',
    Component: lazy(() => import('@/features/settings/SettingsPage.tsx')),
  },
]

export const ROUTE_PATTERNS = ROUTES.map((route) => route.pattern)

export const NAV_ROUTES = ROUTES.filter(
  (route): route is RouteDef & { nav: NonNullable<RouteDef['nav']> } => route.nav !== undefined,
).sort((a, b) => a.nav.order - b.nav.order)

const BY_PATTERN = new Map(ROUTES.map((route) => [route.pattern, route]))

export function routeFor(pattern: string): RouteDef | undefined {
  return BY_PATTERN.get(pattern)
}

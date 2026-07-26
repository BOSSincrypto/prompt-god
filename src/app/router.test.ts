import { describe, expect, it } from 'vitest'
import { isActive, matchRoute } from './router.tsx'
import { ROUTE_PATTERNS } from './routes.ts'

describe('matchRoute', () => {
  it('matches a static route', () => {
    expect(matchRoute(ROUTE_PATTERNS, '/lab')).toEqual({ pattern: '/lab', params: {} })
  })

  it('matches the index route', () => {
    expect(matchRoute(ROUTE_PATTERNS, '/')).toEqual({ pattern: '/', params: {} })
  })

  it('extracts a dynamic segment', () => {
    expect(matchRoute(ROUTE_PATTERNS, '/learn/anatomy')).toEqual({
      pattern: '/learn/:lessonId',
      params: { lessonId: 'anatomy' },
    })
  })

  it('prefers the static route over the dynamic one at the same depth', () => {
    // "/learn" must not be swallowed by "/learn/:lessonId" or vice versa.
    expect(matchRoute(ROUTE_PATTERNS, '/learn')?.pattern).toBe('/learn')
  })

  it('decodes percent-encoded segments', () => {
    expect(matchRoute(['/learn/:lessonId'], '/learn/a%20b')?.params).toEqual({ lessonId: 'a b' })
  })

  it('tolerates a trailing slash', () => {
    expect(matchRoute(ROUTE_PATTERNS, '/lab/')?.pattern).toBe('/lab')
  })

  it('returns null for an unknown path', () => {
    expect(matchRoute(ROUTE_PATTERNS, '/nope')).toBeNull()
    expect(matchRoute(ROUTE_PATTERNS, '/lab/extra/deep')).toBeNull()
  })

  it('does not match a shorter or longer path against a pattern', () => {
    expect(matchRoute(['/a/b'], '/a')).toBeNull()
    expect(matchRoute(['/a'], '/a/b')).toBeNull()
  })
})

describe('isActive', () => {
  it('treats the index route as exact only', () => {
    expect(isActive('/', '/')).toBe(true)
    expect(isActive('/lab', '/')).toBe(false)
  })

  it('matches an exact path', () => {
    expect(isActive('/lab', '/lab')).toBe(true)
  })

  it('matches a nested path by default', () => {
    expect(isActive('/learn/anatomy', '/learn')).toBe(true)
  })

  it('does not match a sibling with a shared prefix', () => {
    expect(isActive('/learning', '/learn')).toBe(false)
  })

  it('can be restricted to exact matches', () => {
    expect(isActive('/learn/anatomy', '/learn', false)).toBe(false)
  })
})

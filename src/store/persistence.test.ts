import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProgressState } from './progress.ts'

/** Stands in for IndexedDB so the persistence contract can be asserted. */
const disk = new Map<string, unknown>()

vi.mock('@/lib/storage.ts', () => ({
  kv: {
    get: vi.fn((key: string, fallback: unknown) =>
      Promise.resolve(disk.has(key) ? disk.get(key) : fallback),
    ),
    set: vi.fn((key: string, value: unknown) => {
      disk.set(key, value)
      return Promise.resolve(true)
    }),
    delete: vi.fn((key: string) => {
      disk.delete(key)
      return Promise.resolve(true)
    }),
  },
}))

const SAVED: ProgressState = {
  xp: 640,
  completedLessons: ['anatomy', 'be-specific', 'structure'],
  completedTracks: ['foundations'],
  passedExercises: ['anatomy-1'],
  cards: { anatomy: { id: 'anatomy', due: 5, interval: 3, ease: 2.4, reps: 2, lapses: 0 } },
  streak: 7,
  bestStreak: 9,
  lastActiveDay: 100,
  activeDays: [98, 99, 100],
  promptsAnalyzed: 30,
  bestScore: 92,
  reviewsDone: 14,
}

/** A fresh module instance, because the store is a module-level singleton. */
async function freshStore() {
  vi.resetModules()
  const module = await import('./progress.ts')
  return module.useProgress
}

describe('progress persistence', () => {
  beforeEach(() => {
    disk.clear()
    vi.useFakeTimers()
  })

  it('never writes before it has read what is already saved', async () => {
    // The regression: opening /lab directly and typing fired recordAnalysis
    // while the store still held its empty defaults, and the debounced write
    // then persisted those defaults over a real session's progress.
    disk.set('progress', SAVED)
    const useProgress = await freshStore()

    useProgress.getState().recordAnalysis(88)
    await vi.advanceTimersByTimeAsync(2000)

    expect(disk.get('progress')).toEqual(SAVED)
  })

  it('keeps the saved state after hydration', async () => {
    disk.set('progress', SAVED)
    const useProgress = await freshStore()

    useProgress.getState().recordAnalysis(88)
    await useProgress.getState().hydrate()

    expect(useProgress.getState().xp).toBe(SAVED.xp)
    expect(useProgress.getState().completedLessons).toEqual(SAVED.completedLessons)
  })

  it('writes once hydrated', async () => {
    disk.set('progress', SAVED)
    const useProgress = await freshStore()
    await useProgress.getState().hydrate()

    useProgress.getState().completeLesson('examples', 50)
    await vi.advanceTimersByTimeAsync(2000)

    const written = disk.get('progress') as ProgressState
    expect(written.completedLessons).toContain('examples')
    expect(written.xp).toBe(SAVED.xp + 50)
  })

  it('coalesces a burst of writes', async () => {
    const useProgress = await freshStore()
    await useProgress.getState().hydrate()

    const { kv } = await import('@/lib/storage.ts')
    vi.mocked(kv.set).mockClear()

    for (const id of ['a', 'b', 'c', 'd', 'e']) useProgress.getState().gradeCard(id, 'good')
    await vi.advanceTimersByTimeAsync(2000)

    expect(vi.mocked(kv.set).mock.calls.length).toBe(1)
  })

  it('hydrates only once', async () => {
    disk.set('progress', SAVED)
    const useProgress = await freshStore()

    await useProgress.getState().hydrate()
    useProgress.getState().completeLesson('examples', 50)
    // A second hydrate must not roll the new lesson back.
    await useProgress.getState().hydrate()

    expect(useProgress.getState().completedLessons).toContain('examples')
  })

  it('starts empty when nothing is saved', async () => {
    const useProgress = await freshStore()
    await useProgress.getState().hydrate()
    expect(useProgress.getState().xp).toBe(0)
    expect(useProgress.getState().hydrated).toBe(true)
  })
})

describe('malformed data', () => {
  // Both entry points take data the app did not write. A JSON.parse that
  // succeeds proves nothing about shape, and the bad state used to be
  // persisted — so the crash survived a reload.
  const POISON: unknown[] = [
    null,
    42,
    'nonsense',
    [],
    { activeDays: null, completedLessons: null },
    { xp: 'lots', cards: 'none', streak: NaN },
    { completedLessons: [1, 2, { a: 1 }], cards: { x: null } },
    { activeDays: [1, 'two', null, 4], bestScore: 5000, ease: -9 },
  ]

  it('never produces a state that crashes a consumer', async () => {
    const { sanitizeProgress, earnedAchievements, levelFromXp } = await import('./progress.ts')
    for (const input of POISON) {
      const state = sanitizeProgress(input)
      expect(Array.isArray(state.completedLessons), JSON.stringify(input)).toBe(true)
      expect(Array.isArray(state.activeDays)).toBe(true)
      expect(Number.isFinite(state.xp)).toBe(true)
      expect(state.bestScore).toBeLessThanOrEqual(100)
      // The two things the UI actually calls on a fresh state.
      expect(() => earnedAchievements(state)).not.toThrow()
      expect(Number.isFinite(levelFromXp(state.xp))).toBe(true)
    }
  })

  it('drops values of the wrong type rather than keeping them', async () => {
    const { sanitizeProgress } = await import('./progress.ts')
    const state = sanitizeProgress({ completedLessons: ['ok', 7, null], activeDays: [1, 'x', 3] })
    expect(state.completedLessons).toEqual(['ok'])
    expect(state.activeDays).toEqual([1, 3])
  })

  it('keeps a well-formed import intact', async () => {
    const { sanitizeProgress } = await import('./progress.ts')
    expect(sanitizeProgress(SAVED)).toEqual(SAVED)
  })

  it('survives importing garbage through the store', async () => {
    const useProgress = await freshStore()
    await useProgress.getState().hydrate()
    useProgress.getState().replaceAll({ activeDays: null, completedLessons: null })
    expect(useProgress.getState().activeDays).toEqual([])
    expect(useProgress.getState().completedLessons).toEqual([])
  })

  it('recovers from poison already sitting in storage', async () => {
    disk.set('progress', { xp: 'lots', activeDays: null })
    const useProgress = await freshStore()
    await useProgress.getState().hydrate()
    expect(useProgress.getState().xp).toBe(0)
    expect(useProgress.getState().activeDays).toEqual([])
  })
})

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

import { describe, expect, it, vi } from 'vitest'
import {
  levelFromXp,
  newCard,
  schedule,
  today,
  touchStreak,
  xpForLevel,
  type ProgressState,
} from './progress.ts'

const base: ProgressState = {
  xp: 0,
  completedLessons: [],
  completedTracks: [],
  passedExercises: [],
  cards: {},
  streak: 0,
  bestStreak: 0,
  lastActiveDay: 0,
  activeDays: [],
  promptsAnalyzed: 0,
  bestScore: 0,
  reviewsDone: 0,
}

describe('levels', () => {
  it('starts at level 1 with no XP', () => {
    expect(levelFromXp(0)).toBe(1)
  })

  it('agrees with its own threshold table', () => {
    for (let level = 1; level <= 20; level++) {
      const threshold = xpForLevel(level)
      expect(levelFromXp(threshold), `at threshold for level ${level}`).toBe(level)
      if (threshold > 0) {
        expect(levelFromXp(threshold - 1), `just below level ${level}`).toBe(level - 1)
      }
    }
  })

  it('never goes backwards as XP grows', () => {
    let previous = 0
    for (let xp = 0; xp < 5000; xp += 7) {
      const level = levelFromXp(xp)
      expect(level).toBeGreaterThanOrEqual(previous)
      previous = level
    }
  })
})

describe('streak', () => {
  it('extends on a consecutive day', () => {
    const state = { ...base, streak: 3, bestStreak: 3, lastActiveDay: 100 }
    expect(touchStreak(state, 101).streak).toBe(4)
  })

  it('does nothing twice in one day', () => {
    const state = { ...base, streak: 3, lastActiveDay: 100 }
    expect(touchStreak(state, 100)).toEqual({})
  })

  it('restarts after a gap', () => {
    const state = { ...base, streak: 9, bestStreak: 9, lastActiveDay: 100 }
    const next = touchStreak(state, 104)
    expect(next.streak).toBe(1)
    expect(next.bestStreak).toBe(9)
  })

  it('records the best streak ever reached', () => {
    const state = { ...base, streak: 9, bestStreak: 9, lastActiveDay: 100 }
    expect(touchStreak(state, 101).bestStreak).toBe(10)
  })

  it('caps the activity history', () => {
    const state = { ...base, activeDays: Array.from({ length: 130 }, (_, i) => i) }
    const next = touchStreak(state, 500)
    expect(next.activeDays?.length).toBeLessThanOrEqual(120)
    expect(next.activeDays?.at(-1)).toBe(500)
  })
})

describe('spaced repetition', () => {
  it('brings a failed card back the same day', () => {
    const card = { ...newCard('x'), reps: 4, interval: 20 }
    const next = schedule(card, 'again', 500)
    expect(next.due).toBe(500)
    expect(next.lapses).toBe(1)
    expect(next.reps).toBe(4)
  })

  it('grows the interval on repeated success', () => {
    let card = newCard('x')
    const intervals: number[] = []
    for (let i = 0; i < 5; i++) {
      card = schedule(card, 'good', 500 + i)
      intervals.push(card.interval)
    }
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]!).toBeGreaterThan(intervals[i - 1]!)
    }
  })

  it('keeps ease inside its bounds', () => {
    let card = newCard('x')
    for (let i = 0; i < 40; i++) card = schedule(card, 'again', 500)
    expect(card.ease).toBeGreaterThanOrEqual(1.3)

    let easy = newCard('y')
    for (let i = 0; i < 40; i++) easy = schedule(easy, 'easy', 500)
    expect(easy.ease).toBeLessThanOrEqual(2.8)
  })

  it('schedules easy further out than good', () => {
    const card = { ...newCard('x'), reps: 3, interval: 10 }
    expect(schedule(card, 'easy', 500).interval).toBeGreaterThan(
      schedule(card, 'good', 500).interval,
    )
  })

  it('never schedules a reviewed card in the past', () => {
    const card = { ...newCard('x'), reps: 2, interval: 6 }
    for (const grade of ['again', 'hard', 'good', 'easy'] as const) {
      expect(schedule(card, grade, 500).due).toBeGreaterThanOrEqual(500)
    }
  })

  it('counts days from the epoch consistently', () => {
    const offset = new Date(0).getTimezoneOffset() * 60_000
    expect(today(offset)).toBe(0)
    expect(today(offset + 86_400_000)).toBe(1)
    expect(today(offset + 86_400_000 * 2 + 1)).toBe(2)
  })
})

describe('local days', () => {
  /** Pins the machine's timezone so the assertions mean the same everywhere. */
  const withOffset = (minutes: number, body: () => void) => {
    const spy = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(minutes)
    try {
      body()
    } finally {
      spy.mockRestore()
    }
  }

  it('rolls the day over at local midnight, not UTC midnight', () => {
    // 22:00 UTC on Jan 1st is already Jan 2nd in Moscow (UTC+3).
    const lateEvening = Date.UTC(2026, 0, 1, 22, 0)
    withOffset(-180, () => {
      expect(today(lateEvening)).toBe(today(Date.UTC(2026, 0, 2, 6, 0)))
      // 20:30 UTC is 23:30 local — still Jan 1st, one local day earlier.
      expect(today(lateEvening)).toBe(today(Date.UTC(2026, 0, 1, 20, 30)) + 1)
    })
  })

  it('keeps an afternoon and an evening on one day west of UTC', () => {
    // Both of these are Jan 1st in California (UTC-8), either side of the
    // UTC rollover that used to split them into two days.
    withOffset(480, () => {
      expect(today(Date.UTC(2026, 0, 1, 20, 0))).toBe(today(Date.UTC(2026, 0, 2, 3, 0)))
    })
  })

  it('does not punish a streak for travelling west', () => {
    const state = { ...base, streak: 40, bestStreak: 40, lastActiveDay: 100 }
    // Landing in a timezone behind the last one makes the local day number go
    // backwards. The streak survives untouched.
    expect(touchStreak(state, 99)).toEqual({})
  })
})

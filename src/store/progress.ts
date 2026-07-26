import { create } from 'zustand'
import { CONTENT_STATS } from '@/content/stats.ts'
import { kv } from '@/lib/storage.ts'

/* -------------------------------------------------------------------------- */
/* Levels                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Triangular XP curve: level L starts at 20 * (L-1) * L XP.
 * 0 / 40 / 120 / 240 / 400 / 600 … — early levels arrive quickly, later ones
 * need real work, and the whole course plus practice lands around level 8.
 */
export function xpForLevel(level: number): number {
  return 20 * (level - 1) * level
}

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 5)) / 2))
}

/* -------------------------------------------------------------------------- */
/* Spaced repetition                                                          */
/* -------------------------------------------------------------------------- */

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

export interface Card {
  id: string
  /** Epoch day number the card next comes up. */
  due: number
  /** Days until the next review after the last one. */
  interval: number
  ease: number
  reps: number
  lapses: number
}

const DAY_MS = 86_400_000

/**
 * The epoch day number in the viewer's own timezone.
 *
 * A streak is a promise about the calendar the user lives in. Counting UTC
 * days breaks that promise everywhere except Greenwich: in Moscow the day
 * rolls over at 3am, so an evening session and the next morning's land on one
 * "day" and the streak silently fails to extend; in California it rolls over
 * at 5pm, so an afternoon and an evening count as two.
 *
 * The offset is read at `now` rather than once at load, so a session that
 * crosses a DST boundary follows the wall clock.
 */
export const today = (now = Date.now()) =>
  Math.floor((now - new Date(now).getTimezoneOffset() * 60_000) / DAY_MS)

/**
 * A trimmed SM-2. The ease factor moves with the grade and the interval grows
 * multiplicatively, which is the part of SM-2 that actually does the work;
 * the rest of the original algorithm is tuning that a 20-card deck cannot
 * benefit from.
 */
export function schedule(card: Card, grade: ReviewGrade, day = today()): Card {
  const ease = Math.min(
    2.8,
    Math.max(
      1.3,
      card.ease +
        (grade === 'again' ? -0.2 : grade === 'hard' ? -0.15 : grade === 'easy' ? 0.15 : 0),
    ),
  )

  let interval: number
  if (grade === 'again') interval = 0
  else if (card.reps === 0) interval = grade === 'easy' ? 3 : grade === 'hard' ? 1 : 2
  else if (grade === 'hard') interval = Math.max(1, Math.round(card.interval * 1.2))
  else interval = Math.max(1, Math.round(card.interval * ease * (grade === 'easy' ? 1.3 : 1)))

  return {
    id: card.id,
    ease,
    interval,
    due: day + interval,
    reps: grade === 'again' ? card.reps : card.reps + 1,
    lapses: grade === 'again' ? card.lapses + 1 : card.lapses,
  }
}

export function newCard(id: string, day = today()): Card {
  return { id, due: day, interval: 0, ease: 2.4, reps: 0, lapses: 0 }
}

/* -------------------------------------------------------------------------- */
/* Achievements                                                               */
/* -------------------------------------------------------------------------- */

export interface Achievement {
  id: string
  icon: string
  /** Evaluated against the live state; no separate unlock bookkeeping. */
  earned: (state: ProgressState) => boolean
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'first-lesson', icon: 'book', earned: (s) => s.completedLessons.length >= 1 },
  { id: 'first-track', icon: 'layers', earned: (s) => s.completedTracks.length >= 1 },
  {
    id: 'half-course',
    icon: 'target',
    earned: (s) => s.completedLessons.length >= Math.ceil(CONTENT_STATS.lessons / 2),
  },
  {
    id: 'whole-course',
    icon: 'trophy',
    earned: (s) => s.completedLessons.length >= CONTENT_STATS.lessons,
  },
  { id: 'streak-3', icon: 'flame', earned: (s) => s.bestStreak >= 3 },
  { id: 'streak-7', icon: 'flame', earned: (s) => s.bestStreak >= 7 },
  { id: 'streak-30', icon: 'flame', earned: (s) => s.bestStreak >= 30 },
  { id: 'lab-10', icon: 'flask', earned: (s) => s.promptsAnalyzed >= 10 },
  { id: 'lab-100', icon: 'flask', earned: (s) => s.promptsAnalyzed >= 100 },
  { id: 'perfect-score', icon: 'sparkles', earned: (s) => s.bestScore >= 100 },
  { id: 'reviewer', icon: 'refresh', earned: (s) => s.reviewsDone >= 25 },
  { id: 'level-5', icon: 'zap', earned: (s) => levelFromXp(s.xp) >= 5 },
]

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

export interface ProgressState {
  xp: number
  completedLessons: string[]
  completedTracks: string[]
  passedExercises: string[]
  cards: Record<string, Card>
  streak: number
  bestStreak: number
  /** Epoch day of the last day with any activity. */
  lastActiveDay: number
  /** Epoch days with activity, newest last, capped for the heat strip. */
  activeDays: number[]
  promptsAnalyzed: number
  bestScore: number
  reviewsDone: number
}

const EMPTY: ProgressState = {
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

const STORE_KEY = 'progress'
const ACTIVITY_WINDOW = 120

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

const num = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const numberList = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
    : []

function cardsFrom(value: unknown): Record<string, Card> {
  if (typeof value !== 'object' || value === null) return {}
  const out: Record<string, Card> = {}
  for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw !== 'object' || raw === null) continue
    const card = raw as Partial<Card>
    out[id] = {
      id,
      due: num(card.due),
      interval: num(card.interval),
      ease: Math.min(2.8, Math.max(1.3, num(card.ease, 2.4))),
      reps: Math.max(0, num(card.reps)),
      lapses: Math.max(0, num(card.lapses)),
    }
  }
  return out
}

/**
 * Coerces anything into a usable state.
 *
 * Both entry points take data the app did not write: `hydrate` reads whatever
 * is in IndexedDB, and `replaceAll` takes a user-chosen file. A `JSON.parse`
 * that succeeds proves nothing about shape — `{"activeDays": null}` type-checks
 * as `ProgressState` at the cast and then throws on `.length` at render. Worse,
 * the bad state was persisted, so the crash survived a reload and the app could
 * only be recovered by clearing site data.
 */
export function sanitizeProgress(value: unknown): ProgressState {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Partial<ProgressState>
  return {
    xp: Math.max(0, num(raw.xp)),
    completedLessons: stringList(raw.completedLessons),
    completedTracks: stringList(raw.completedTracks),
    passedExercises: stringList(raw.passedExercises),
    cards: cardsFrom(raw.cards),
    streak: Math.max(0, num(raw.streak)),
    bestStreak: Math.max(0, num(raw.bestStreak)),
    lastActiveDay: Math.max(0, num(raw.lastActiveDay)),
    activeDays: numberList(raw.activeDays).slice(-ACTIVITY_WINDOW),
    promptsAnalyzed: Math.max(0, num(raw.promptsAnalyzed)),
    bestScore: Math.min(100, Math.max(0, num(raw.bestScore))),
    reviewsDone: Math.max(0, num(raw.reviewsDone)),
  }
}

interface ProgressStore extends ProgressState {
  hydrated: boolean
  hydrate: () => Promise<void>
  addXp: (amount: number) => void
  completeLesson: (lessonId: string, xp: number) => void
  completeTrack: (trackId: string) => void
  passExercise: (exerciseId: string, xp: number) => void
  recordAnalysis: (score: number) => void
  gradeCard: (cardId: string, grade: ReviewGrade) => void
  seedCards: (ids: string[]) => void
  dueCards: () => Card[]
  replaceAll: (state: unknown) => void
  reset: () => Promise<void>
}

/** Writes are coalesced: grading a review deck should not mean 20 DB round trips. */
function createPersister() {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: ProgressState | null = null

  const flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (pending) {
      void kv.set(STORE_KEY, pending)
      pending = null
    }
  }

  const persist = (state: ProgressState) => {
    pending = state
    if (timer) return
    timer = setTimeout(flush, 400)
  }

  return { persist, flush }
}

const { persist, flush } = createPersister()

/**
 * Writes any coalesced state immediately.
 *
 * Coalescing leaves the most recent action in memory for up to 400 ms, so
 * closing the tab or backgrounding the app inside that window would lose it —
 * most visibly, finishing the last lesson of a track and immediately closing
 * the tab. The app calls this on `pagehide` and on hidden `visibilitychange`;
 * those are the two events that actually fire on mobile, where `beforeunload`
 * does not.
 *
 * Registered by the app rather than on import, so the module has no side
 * effect and tests can drive it explicitly.
 */
export function flushProgress() {
  flush()
}

function snapshot(state: ProgressStore): ProgressState {
  return {
    xp: state.xp,
    completedLessons: state.completedLessons,
    completedTracks: state.completedTracks,
    passedExercises: state.passedExercises,
    cards: state.cards,
    streak: state.streak,
    bestStreak: state.bestStreak,
    lastActiveDay: state.lastActiveDay,
    activeDays: state.activeDays,
    promptsAnalyzed: state.promptsAnalyzed,
    bestScore: state.bestScore,
    reviewsDone: state.reviewsDone,
  }
}

/**
 * Folds today's activity into the streak. A same-day repeat is a no-op, the
 * next day extends, and any longer gap restarts at 1.
 *
 * A last-active day in the future is treated as the same day rather than a
 * gap. It happens for real — fly Berlin to San Francisco and the local day
 * number goes backwards — and losing a 40-day streak to a flight is a worse
 * failure than briefly under-counting one.
 */
export function touchStreak(state: ProgressState, day = today()): Partial<ProgressState> {
  if (state.lastActiveDay >= day) return {}
  const streak = state.lastActiveDay === day - 1 ? state.streak + 1 : 1
  const activeDays = [...state.activeDays, day].slice(-ACTIVITY_WINDOW)
  return {
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    lastActiveDay: day,
    activeDays,
  }
}

export const useProgress = create<ProgressStore>()((set, get) => {
  const commit = (patch: Partial<ProgressState>) => {
    set(patch)
    // Never write before the store has read what is already saved. Landing
    // straight on /lab and typing used to persist the empty defaults over a
    // previous session's progress — a full wipe of the user's XP, streak and
    // completed lessons. The in-memory update still happens so the UI stays
    // responsive; the write lands on the first commit after hydration.
    if (!get().hydrated) return
    persist(snapshot(get()))
  }

  /** Every scoring action also counts as activity for the streak. */
  const active = (patch: Partial<ProgressState>) => {
    commit({ ...touchStreak(get()), ...patch })
  }

  return {
    ...EMPTY,
    hydrated: false,

    hydrate: async () => {
      if (get().hydrated) return
      const stored = await kv.get<unknown>(STORE_KEY, null)
      set({ ...(stored === null ? EMPTY : sanitizeProgress(stored)), hydrated: true })
    },

    addXp: (amount) => active({ xp: get().xp + amount }),

    completeLesson: (lessonId, xp) => {
      const state = get()
      if (state.completedLessons.includes(lessonId)) return
      active({
        completedLessons: [...state.completedLessons, lessonId],
        xp: state.xp + xp,
      })
    },

    completeTrack: (trackId) => {
      const state = get()
      if (state.completedTracks.includes(trackId)) return
      commit({ completedTracks: [...state.completedTracks, trackId] })
    },

    passExercise: (exerciseId, xp) => {
      const state = get()
      if (state.passedExercises.includes(exerciseId)) return
      active({
        passedExercises: [...state.passedExercises, exerciseId],
        xp: state.xp + xp,
      })
    },

    recordAnalysis: (score) => {
      const state = get()
      active({
        promptsAnalyzed: state.promptsAnalyzed + 1,
        bestScore: Math.max(state.bestScore, score),
      })
    },

    seedCards: (ids) => {
      const state = get()
      const cards = { ...state.cards }
      let added = false
      for (const id of ids) {
        if (!cards[id]) {
          cards[id] = newCard(id)
          added = true
        }
      }
      if (added) commit({ cards })
    },

    gradeCard: (cardId, grade) => {
      const state = get()
      const card = state.cards[cardId] ?? newCard(cardId)
      active({
        cards: { ...state.cards, [cardId]: schedule(card, grade) },
        reviewsDone: state.reviewsDone + 1,
        xp: state.xp + (grade === 'again' ? 1 : 3),
      })
    },

    dueCards: () => {
      const day = today()
      return Object.values(get().cards)
        .filter((card) => card.due <= day)
        .sort((a, b) => a.due - b.due)
    },

    replaceAll: (state) => {
      set({ ...sanitizeProgress(state), hydrated: true })
      persist(snapshot(get()))
    },

    reset: async () => {
      set({ ...EMPTY, hydrated: true })
      await kv.delete(STORE_KEY)
    },
  }
})

export function earnedAchievements(state: ProgressState): string[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.earned(state)).map((a) => a.id)
}

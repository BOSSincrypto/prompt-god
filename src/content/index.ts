import type { Locale } from '@/i18n/types.ts'
import type { CourseContent, IndexEntry, Lesson, ModelNote, Pattern, Track } from './types.ts'

export * from './types.ts'

/**
 * Content is split per locale and fetched on demand, so a Russian visitor
 * never downloads the English course and vice versa. Each loader memoises its
 * promise, which also de-duplicates the concurrent calls a page makes when
 * several components ask for the same bundle on first render.
 */

const courseLoaders: Record<Locale, () => Promise<{ course: CourseContent }>> = {
  en: () => import('./course.en.ts'),
  ru: () => import('./course.ru.ts'),
}

const patternLoaders: Record<Locale, () => Promise<{ patterns: Pattern[] }>> = {
  en: () => import('./patterns.en.ts'),
  ru: () => import('./patterns.ru.ts'),
}

const modelLoaders: Record<Locale, () => Promise<{ modelNotes: ModelNote[] }>> = {
  en: () => import('./models.en.ts'),
  ru: () => import('./models.ru.ts'),
}

function memoise<T>(loaders: Record<Locale, () => Promise<T>>) {
  const cache = new Map<Locale, Promise<T>>()
  return (locale: Locale): Promise<T> => {
    let promise = cache.get(locale)
    if (!promise) {
      promise = loaders[locale]().catch((error: unknown) => {
        // A failed chunk fetch is usually a stale service worker after a
        // deploy. Drop the rejected promise so a retry can succeed.
        cache.delete(locale)
        throw error
      })
      cache.set(locale, promise)
    }
    return promise
  }
}

const loadCourseBundle = memoise(courseLoaders)
const loadPatternBundle = memoise(patternLoaders)
const loadModelBundle = memoise(modelLoaders)

export async function loadCourse(locale: Locale): Promise<CourseContent> {
  return (await loadCourseBundle(locale)).course
}

export async function loadPatterns(locale: Locale): Promise<Pattern[]> {
  return (await loadPatternBundle(locale)).patterns
}

export async function loadModelNotes(locale: Locale): Promise<ModelNote[]> {
  return (await loadModelBundle(locale)).modelNotes
}

export async function loadLesson(locale: Locale, lessonId: string): Promise<Lesson | undefined> {
  const course = await loadCourse(locale)
  return course.lessons.find((lesson) => lesson.id === lessonId)
}

/* -------------------------------------------------------------------------- */
/* Course helpers                                                             */
/* -------------------------------------------------------------------------- */

export interface TrackProgress {
  track: Track
  lessons: Lesson[]
  completed: number
  total: number
  /** Locked until its prerequisite track is finished. */
  locked: boolean
  /** First unfinished lesson, or the first lesson when the track is done. */
  nextLessonId: string | undefined
}

export function trackProgress(
  course: CourseContent,
  completedLessons: readonly string[],
): TrackProgress[] {
  const done = new Set(completedLessons)
  const byId = new Map(course.lessons.map((lesson) => [lesson.id, lesson]))

  const completionByTrack = new Map<string, boolean>()
  for (const track of course.tracks) {
    completionByTrack.set(
      track.id,
      track.lessonIds.every((id) => done.has(id)),
    )
  }

  return course.tracks.map((track) => {
    const lessons = track.lessonIds
      .map((id) => byId.get(id))
      .filter((lesson): lesson is Lesson => lesson !== undefined)
    const completed = lessons.filter((lesson) => done.has(lesson.id)).length
    const locked = track.requires ? !completionByTrack.get(track.requires) : false
    const next = lessons.find((lesson) => !done.has(lesson.id)) ?? lessons[0]

    return {
      track,
      lessons,
      completed,
      total: lessons.length,
      locked,
      nextLessonId: next?.id,
    }
  })
}

/** Flattened lesson order, used for "next lesson" navigation. */
export function lessonOrder(course: CourseContent): string[] {
  return course.tracks.flatMap((track) => track.lessonIds)
}

export function nextLessonId(course: CourseContent, current: string): string | undefined {
  const order = lessonOrder(course)
  const index = order.indexOf(current)
  return index === -1 ? undefined : order[index + 1]
}

/* -------------------------------------------------------------------------- */
/* Search index                                                               */
/* -------------------------------------------------------------------------- */

let indexPromise: Promise<IndexEntry[]> | null = null

/**
 * The command palette needs to search both languages without pulling in either
 * full content bundle, so the index is its own small chunk.
 */
export function loadSearchIndex(): Promise<IndexEntry[]> {
  indexPromise ??= import('./search-index.ts').then((module) => module.searchIndex)
  return indexPromise
}

/**
 * Ranked substring search. The corpus is a couple of hundred short entries, so
 * a scan beats shipping a search library — and the scoring can be tuned to
 * what actually matters here: a title match outranks a keyword match.
 */
export function searchEntries(
  entries: readonly IndexEntry[],
  query: string,
  locale: Locale,
  limit = 12,
): IndexEntry[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return []
  const terms = needle.split(/\s+/)

  const scored: { entry: IndexEntry; score: number }[] = []
  for (const entry of entries) {
    const title = entry.title[locale].toLowerCase()
    const keywords = entry.keywords[locale].toLowerCase()
    // Both languages are searched: someone may know a term only in English.
    const other = locale === 'en' ? 'ru' : 'en'
    const alt = `${entry.title[other]} ${entry.keywords[other]}`.toLowerCase()

    let score = 0
    for (const term of terms) {
      if (title.startsWith(term)) score += 12
      else if (title.includes(term)) score += 8
      else if (keywords.includes(term)) score += 4
      else if (alt.includes(term)) score += 2
      else {
        score = 0
        break
      }
    }
    if (score > 0) scored.push({ entry, score })
  }

  return scored
    .sort((a, b) => b.score - a.score || a.entry.title[locale].localeCompare(b.entry.title[locale]))
    .slice(0, limit)
    .map((item) => item.entry)
}

import type { Locale } from '@/i18n/types.ts'
import type { ModelFamilyId } from '@/engine/models.ts'

export type Bilingual = Record<Locale, string>

/* -------------------------------------------------------------------------- */
/* Lessons                                                                    */
/* -------------------------------------------------------------------------- */

export type TrackId = 'foundations' | 'structure' | 'modern' | 'reliability' | 'systems' | 'mastery'

export interface Track {
  id: TrackId
  title: string
  goal: string
  /** Track that must be completed first. */
  requires?: TrackId
  lessonIds: string[]
}

/** A block of lesson body copy. Structured rather than markdown: no parser, no sanitiser. */
export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  | { kind: 'note'; tone: 'info' | 'warn' | 'ok'; title?: string; text: string }
  | { kind: 'code'; text: string; caption?: string }
  /** Side-by-side before/after — the workhorse of the whole course. */
  | {
      kind: 'compare'
      badLabel?: string
      bad: string
      goodLabel?: string
      good: string
      note?: string
    }
  | { kind: 'quote'; text: string; source: string; url?: string }

/**
 * A deterministic check on the learner's answer. Every variant runs offline in
 * microseconds, so an exercise grades instantly and works with the network off.
 */
export type Check =
  /** The analyzer must NOT report this rule. */
  | { kind: 'noFinding'; ruleId: string; label: string }
  /** The analyzer must report this rule — used to teach what a defect looks like. */
  | { kind: 'hasFinding'; ruleId: string; label: string }
  /** Case-insensitive regular expression over the answer. */
  | { kind: 'matches'; pattern: string; label: string }
  /** Regular expression that must NOT match. */
  | { kind: 'absent'; pattern: string; label: string }
  | { kind: 'minScore'; score: number; label: string }
  | { kind: 'minWords'; words: number; label: string }
  | { kind: 'maxWords'; words: number; label: string }
  /** At least `count` of the listed patterns must match. */
  | { kind: 'anyOf'; patterns: string[]; count: number; label: string }

export interface Exercise {
  id: string
  brief: string
  /** Prefilled editor content — usually a broken prompt to repair. */
  starter?: string
  hint: string
  /** One good answer, shown on request. Never the only correct answer. */
  solution: string
  checks: Check[]
  /** Model family the exercise is graded against. */
  family?: ModelFamilyId
}

export interface Lesson {
  id: string
  trackId: TrackId
  title: string
  /** One sentence shown in listings. */
  summary: string
  minutes: number
  xp: number
  keyIdea: string
  pitfall: string
  blocks: Block[]
  exercises: Exercise[]
  /** Patterns this lesson teaches, linking into the library. */
  patternIds?: string[]
}

export interface CourseContent {
  tracks: Track[]
  lessons: Lesson[]
}

/* -------------------------------------------------------------------------- */
/* Patterns                                                                   */
/* -------------------------------------------------------------------------- */

export type PatternCategory =
  | 'framing'
  | 'structure'
  | 'examples'
  | 'reasoning'
  | 'output'
  | 'reliability'
  | 'workflow'
  | 'efficiency'

export type Level = 'beginner' | 'intermediate' | 'advanced'

export interface Pattern {
  id: string
  name: string
  category: PatternCategory
  level: Level
  /** One line, shown in the card. */
  summary: string
  whenToUse: string[]
  whenNotToUse: string[]
  /** Fill-in template. `[[...]]` marks a slot the author must complete. */
  template: string
  /** Why it works, with the source where one exists. */
  evidence?: string
  evidenceUrl?: string
  models: ModelFamilyId[]
  related: string[]
  tags: string[]
}

/* -------------------------------------------------------------------------- */
/* Model matrix                                                               */
/* -------------------------------------------------------------------------- */

export interface ModelNote {
  family: ModelFamilyId
  /** Current model names, for orientation only — these change fast. */
  lineup: string[]
  headline: string
  strengths: string[]
  /** The things that actually change how you write a prompt for this family. */
  quirks: { title: string; body: string }[]
  doThis: string[]
  avoid: string[]
}

/* -------------------------------------------------------------------------- */
/* Search index                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A compact bilingual index shipped in the main bundle so the command palette
 * can search everything without pulling in a locale's full content chunk.
 */
export interface IndexEntry {
  id: string
  kind: 'lesson' | 'pattern'
  title: Bilingual
  /** Space-joined keywords in both languages, lowercased at build of the index. */
  keywords: Bilingual
  href: string
}

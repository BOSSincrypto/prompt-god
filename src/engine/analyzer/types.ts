import type { Locale } from '@/i18n/types.ts'
import type { ModelProfile } from '../models.ts'
import type { Span, Structure, TextLang, TextStats } from './text.ts'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type Category =
  | 'clarity'
  | 'context'
  | 'structure'
  | 'output'
  | 'examples'
  | 'reasoning'
  | 'safety'
  | 'efficiency'
  | 'model'

/** Bilingual copy carried by every rule, so the engine needs no i18n plumbing. */
export interface RuleCopy {
  title: Record<Locale, string>
  why: Record<Locale, string>
  fix: Record<Locale, string>
}

export interface Finding extends RuleCopy {
  ruleId: string
  severity: Severity
  category: Category
  /** Character ranges to highlight in the editor. May be empty. */
  spans: Span[]
  /** Pattern this finding teaches, linking the Lab into the library. */
  patternId?: string
  /** Lesson that covers the underlying idea. */
  lessonId?: string
}

/** What every rule receives. Precomputed once per analysis run. */
export interface AnalysisContext {
  text: string
  lower: string
  lang: TextLang
  profile: ModelProfile
  stats: TextStats
  structure: Structure
  sentences: string[]
  lines: string[]
  paragraphs: string[]
  /** Rough task classification, used to gate rules that only apply to some work. */
  taskKind: TaskKind
  /**
   * Word-count thresholds in the rules are calibrated on English. Russian
   * expresses the same content in fewer words — no articles, fewer auxiliary
   * verbs, case endings replacing prepositions — so comparing a raw count
   * against an English-derived number under-fires on Russian prompts. Every
   * rule runs its threshold through this instead of hard-coding one.
   */
  minWords: (englishThreshold: number) => number
}

/**
 * A coarse guess at what the prompt is asking for. Rules use it to avoid
 * firing irrelevant advice — a translation prompt does not need examples, a
 * classification prompt very much does.
 */
export type TaskKind =
  | 'generation'
  | 'classification'
  | 'extraction'
  | 'transformation'
  | 'analysis'
  | 'code'
  | 'conversation'
  | 'unknown'

export interface Rule {
  id: string
  category: Category
  severity: Severity
  /** Weight subtracted from the score when the rule fires, before severity scaling. */
  weight: number
  patternId?: string
  lessonId?: string
  copy: RuleCopy
  /**
   * Returns spans to highlight when the rule fires, an empty array when it
   * fires without a location, or `null` when it does not fire.
   */
  check: (ctx: AnalysisContext) => Span[] | null
}

export interface AnalysisResult {
  findings: Finding[]
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  stats: TextStats
  byCategory: Record<Category, number>
  /** Milliseconds spent in the rule pass — surfaced so the speed claim is checkable. */
  elapsedMs: number
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
}

export const SEVERITY_MULTIPLIER: Record<Severity, number> = {
  critical: 1,
  high: 0.75,
  medium: 0.5,
  low: 0.28,
  info: 0,
}

export const CATEGORIES: readonly Category[] = [
  'clarity',
  'context',
  'structure',
  'output',
  'examples',
  'reasoning',
  'safety',
  'efficiency',
  'model',
]

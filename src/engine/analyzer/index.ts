import { getProfile, type ModelFamilyId } from '../models.ts'
import { lexBoth } from './lexicon.ts'
import { advancedRules } from './rules/advanced.ts'
import { clarityRules } from './rules/clarity.ts'
import { formRules } from './rules/form.ts'
import {
  analyzeStructure,
  computeStats,
  countMatches,
  detectLang,
  lines as splitLines,
  paragraphs as splitParagraphs,
  sentences as splitSentences,
} from './text.ts'
import {
  CATEGORIES,
  SEVERITY_MULTIPLIER,
  SEVERITY_ORDER,
  type AnalysisContext,
  type AnalysisResult,
  type Category,
  type Finding,
  type Rule,
  type TaskKind,
} from './types.ts'

export * from './types.ts'
export { computeStats, detectLang, estimateTokens } from './text.ts'

/** The full rule set, ordered only for stable output. */
export const RULES: readonly Rule[] = [...clarityRules, ...formRules, ...advancedRules]

export const RULE_COUNT = RULES.length

const RULE_BY_ID = new Map(RULES.map((rule) => [rule.id, rule]))

export function getRule(id: string): Rule | undefined {
  return RULE_BY_ID.get(id)
}

/**
 * Classifies the prompt so rules can skip advice that does not apply.
 * Scores each candidate kind by keyword density and takes the winner; ties and
 * empty prompts fall through to `unknown`, which suppresses the gated rules.
 */
export function classifyTask(text: string): TaskKind {
  const scores: [TaskKind, number][] = [
    ['classification', countMatches(text, lexBoth('classificationTask')) * 2],
    ['extraction', countMatches(text, lexBoth('extractionTask')) * 2],
    ['transformation', countMatches(text, lexBoth('transformationTask')) * 2],
    ['code', countMatches(text, lexBoth('codeTask'))],
    ['analysis', countMatches(text, lexBoth('analysisTask'))],
    ['generation', countMatches(text, lexBoth('generationTask'))],
  ]

  let best: TaskKind = 'unknown'
  let bestScore = 0
  for (const [kind, score] of scores) {
    if (score > bestScore) {
      best = kind
      bestScore = score
    }
  }
  return bestScore === 0 ? 'unknown' : best
}

/**
 * Empirically, a Russian rendering of the same prompt runs about a fifth
 * shorter in words than its English counterpart. Rounding up keeps short
 * thresholds from collapsing to zero.
 */
const RU_WORD_RATIO = 0.8

export function buildContext(text: string, family: ModelFamilyId): AnalysisContext {
  const lang = detectLang(text)
  return {
    text,
    lower: text.toLowerCase(),
    lang,
    minWords: (englishThreshold: number) =>
      lang === 'ru' ? Math.max(1, Math.round(englishThreshold * RU_WORD_RATIO)) : englishThreshold,
    profile: getProfile(family),
    stats: computeStats(text),
    structure: analyzeStructure(text),
    sentences: splitSentences(text),
    lines: splitLines(text),
    paragraphs: splitParagraphs(text),
    taskKind: classifyTask(text),
  }
}

/**
 * Converts findings into a 0-100 score.
 *
 * Deductions are damped rather than summed linearly: a prompt with eight small
 * problems is worse than one with three, but not eight times worse, and a
 * score that bottoms out at zero stops being informative. The square-root
 * damping keeps the top of the range sensitive — where most editing happens —
 * while compressing the bottom.
 */
export function scoreFindings(findings: readonly Finding[]): number {
  if (findings.length === 0) return 100

  let penalty = 0
  for (const finding of findings) {
    const rule = RULE_BY_ID.get(finding.ruleId)
    const weight = rule?.weight ?? 10
    penalty += weight * SEVERITY_MULTIPLIER[finding.severity]
  }

  // A single critical finding should dominate; damping applies to the tail.
  const damped = penalty <= 40 ? penalty : 40 + Math.sqrt(penalty - 40) * 7
  return Math.max(0, Math.min(100, Math.round(100 - damped)))
}

export function gradeFor(score: number): AnalysisResult['grade'] {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 55) return 'C'
  if (score >= 35) return 'D'
  return 'F'
}

/**
 * Runs every rule over the prompt.
 *
 * Rules are pure and independent, so a rule that throws is contained: it is
 * skipped and the rest of the analysis still returns. A malformed prompt must
 * never take the editor down.
 */
export function analyze(text: string, family: ModelFamilyId = 'generic'): AnalysisResult {
  const started = performance.now()
  const trimmed = text.trim()

  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>

  if (trimmed.length === 0) {
    return {
      findings: [],
      score: 0,
      grade: 'F',
      stats: computeStats(''),
      byCategory,
      elapsedMs: performance.now() - started,
    }
  }

  const ctx = buildContext(text, family)
  const findings: Finding[] = []

  for (const rule of RULES) {
    let spans
    try {
      spans = rule.check(ctx)
    } catch (error) {
      console.warn(`[analyzer] rule "${rule.id}" threw`, error)
      continue
    }
    if (spans === null) continue

    findings.push({
      ruleId: rule.id,
      severity: rule.severity,
      category: rule.category,
      spans,
      ...(rule.patternId === undefined ? {} : { patternId: rule.patternId }),
      ...(rule.lessonId === undefined ? {} : { lessonId: rule.lessonId }),
      ...rule.copy,
    })
    byCategory[rule.category]++
  }

  // The `empty` rule already says everything worth saying about a stub prompt;
  // piling on twelve more findings would be noise, not feedback.
  const onlyEmpty = findings.find((f) => f.ruleId === 'empty')
  const finalFindings = onlyEmpty ? [onlyEmpty] : findings

  finalFindings.sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    if (bySeverity !== 0) return bySeverity
    return a.ruleId.localeCompare(b.ruleId)
  })

  if (onlyEmpty) {
    for (const category of CATEGORIES) byCategory[category] = 0
    byCategory.clarity = 1
  }

  const score = scoreFindings(finalFindings)

  return {
    findings: finalFindings,
    score,
    grade: gradeFor(score),
    stats: ctx.stats,
    byCategory,
    elapsedMs: performance.now() - started,
  }
}

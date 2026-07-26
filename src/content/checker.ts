import { analyze } from '@/engine/analyzer/index.ts'
import { computeStats } from '@/engine/analyzer/text.ts'
import type { ModelFamilyId } from '@/engine/models.ts'
import type { Check, Exercise } from './types.ts'

export interface CheckResult {
  label: string
  passed: boolean
}

export interface ExerciseResult {
  passed: boolean
  results: CheckResult[]
}

/**
 * Compiled patterns are cached across runs. Exercises are graded on every
 * keystroke-debounced submit, and recompiling the same regex each time is the
 * only thing in this path that would show up in a profile.
 */
const patternCache = new Map<string, RegExp | null>()

function compile(source: string): RegExp | null {
  if (patternCache.has(source)) return patternCache.get(source) ?? null
  let compiled: RegExp | null
  try {
    compiled = new RegExp(source, 'iu')
  } catch {
    // A bad pattern in content must not break grading; it fails open with a
    // console warning so the defect is visible in development.
    console.warn(`[checker] invalid pattern in content: ${source}`)
    compiled = null
  }
  patternCache.set(source, compiled)
  return compiled
}

function runCheck(check: Check, answer: string, family: ModelFamilyId): boolean {
  switch (check.kind) {
    case 'noFinding':
      return !analyze(answer, family).findings.some((f) => f.ruleId === check.ruleId)

    case 'hasFinding':
      return analyze(answer, family).findings.some((f) => f.ruleId === check.ruleId)

    case 'matches': {
      const pattern = compile(check.pattern)
      return pattern ? pattern.test(answer) : true
    }

    case 'absent': {
      const pattern = compile(check.pattern)
      return pattern ? !pattern.test(answer) : true
    }

    case 'anyOf': {
      let hits = 0
      for (const source of check.patterns) {
        const pattern = compile(source)
        if (pattern?.test(answer)) hits++
      }
      return hits >= check.count
    }

    case 'minScore':
      return analyze(answer, family).score >= check.score

    case 'minWords':
      return computeStats(answer).words >= check.words

    case 'maxWords':
      return computeStats(answer).words <= check.words
  }
}

/**
 * Grades an answer against every check. A blank answer always fails, whatever
 * the checks say — `absent` and `maxWords` would otherwise pass trivially.
 */
export function checkExercise(
  exercise: Exercise,
  answer: string,
  fallbackFamily: ModelFamilyId = 'generic',
): ExerciseResult {
  const family = exercise.family ?? fallbackFamily
  const trimmed = answer.trim()

  const results = exercise.checks.map((check) => ({
    label: check.label,
    passed: trimmed.length === 0 ? false : runCheck(check, answer, family),
  }))

  return {
    passed: results.length > 0 && results.every((result) => result.passed),
    results,
  }
}

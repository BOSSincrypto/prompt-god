import { describe, expect, it } from 'vitest'
import { checkExercise } from './checker.ts'
import { searchEntries, trackProgress } from './index.ts'
import type { CourseContent, Exercise, IndexEntry } from './types.ts'

const exercise = (checks: Exercise['checks']): Exercise => ({
  id: 'x',
  brief: 'brief',
  hint: 'hint',
  solution: 'solution',
  checks,
})

describe('checkExercise', () => {
  it('fails a blank answer whatever the checks say', () => {
    // `absent` and `maxWords` would otherwise pass trivially on empty input.
    const result = checkExercise(
      exercise([{ kind: 'absent', pattern: 'zzz', label: 'no zzz' }]),
      '   ',
    )
    expect(result.passed).toBe(false)
  })

  it('passes when every check passes', () => {
    const result = checkExercise(
      exercise([
        { kind: 'matches', pattern: '(json|таблиц)', label: 'names a format' },
        { kind: 'minWords', words: 5, label: 'long enough' },
      ]),
      'Return the result as a JSON object with keys a and b.',
    )
    expect(result.passed).toBe(true)
    expect(result.results.every((r) => r.passed)).toBe(true)
  })

  it('fails when any single check fails', () => {
    const result = checkExercise(
      exercise([
        { kind: 'matches', pattern: 'json', label: 'names json' },
        { kind: 'minWords', words: 50, label: 'long enough' },
      ]),
      'Return JSON.',
    )
    expect(result.passed).toBe(false)
    expect(result.results.map((r) => r.passed)).toEqual([true, false])
  })

  it('matches case-insensitively and across both languages', () => {
    const check = exercise([
      { kind: 'matches', pattern: '(markdown|таблиц)', label: 'names a container' },
    ])
    expect(checkExercise(check, 'Верни таблицу с колонками').passed).toBe(true)
    expect(checkExercise(check, 'Return MARKDOWN please').passed).toBe(true)
  })

  it('runs analyzer-backed checks', () => {
    const noFormat = exercise([
      { kind: 'noFinding', ruleId: 'no-output-format', label: 'format specified' },
    ])
    expect(
      checkExercise(
        noFormat,
        'Analyse the sales figures for the last quarter and tell me what happened.',
      ).passed,
    ).toBe(false)
    expect(
      checkExercise(
        noFormat,
        'Analyse the sales figures for the last quarter. Return a markdown table, at most 100 words.',
      ).passed,
    ).toBe(true)
  })

  it('honours anyOf counts', () => {
    const check = exercise([
      { kind: 'anyOf', patterns: ['json', 'markdown', 'csv'], count: 2, label: 'two formats' },
    ])
    expect(checkExercise(check, 'Return JSON only.').passed).toBe(false)
    expect(checkExercise(check, 'Return JSON, or markdown if that fails.').passed).toBe(true)
  })

  it('fails open on an invalid pattern rather than throwing', () => {
    const result = checkExercise(
      exercise([{ kind: 'matches', pattern: '([unclosed', label: 'broken rule' }]),
      'any answer at all',
    )
    expect(result.passed).toBe(true)
  })

  it('respects maxWords', () => {
    const check = exercise([{ kind: 'maxWords', words: 5, label: 'short' }])
    expect(checkExercise(check, 'one two three').passed).toBe(true)
    expect(checkExercise(check, 'one two three four five six seven').passed).toBe(false)
  })
})

describe('trackProgress', () => {
  const course: CourseContent = {
    tracks: [
      { id: 'foundations', title: 'A', goal: '', lessonIds: ['l1', 'l2'] },
      { id: 'structure', title: 'B', goal: '', requires: 'foundations', lessonIds: ['l3'] },
    ],
    lessons: [
      {
        id: 'l1',
        trackId: 'foundations',
        title: '1',
        summary: '',
        minutes: 1,
        xp: 1,
        keyIdea: '',
        pitfall: '',
        blocks: [],
        exercises: [],
      },
      {
        id: 'l2',
        trackId: 'foundations',
        title: '2',
        summary: '',
        minutes: 1,
        xp: 1,
        keyIdea: '',
        pitfall: '',
        blocks: [],
        exercises: [],
      },
      {
        id: 'l3',
        trackId: 'structure',
        title: '3',
        summary: '',
        minutes: 1,
        xp: 1,
        keyIdea: '',
        pitfall: '',
        blocks: [],
        exercises: [],
      },
    ],
  }

  it('locks a track until its prerequisite is complete', () => {
    expect(trackProgress(course, [])[1]?.locked).toBe(true)
    expect(trackProgress(course, ['l1'])[1]?.locked).toBe(true)
    expect(trackProgress(course, ['l1', 'l2'])[1]?.locked).toBe(false)
  })

  it('never locks a track with no prerequisite', () => {
    expect(trackProgress(course, [])[0]?.locked).toBe(false)
  })

  it('points at the first unfinished lesson', () => {
    expect(trackProgress(course, [])[0]?.nextLessonId).toBe('l1')
    expect(trackProgress(course, ['l1'])[0]?.nextLessonId).toBe('l2')
  })

  it('falls back to the first lesson once a track is finished', () => {
    expect(trackProgress(course, ['l1', 'l2'])[0]?.nextLessonId).toBe('l1')
  })

  it('counts completion per track', () => {
    const [first] = trackProgress(course, ['l1'])
    expect(first?.completed).toBe(1)
    expect(first?.total).toBe(2)
  })
})

describe('searchEntries', () => {
  const entries: IndexEntry[] = [
    {
      id: 'lean-prompts',
      kind: 'lesson',
      title: { en: 'Thin prompts, thick context', ru: 'Тонкие промпты, толстый контекст' },
      keywords: { en: 'lean minimal system prompt', ru: 'лаконичный минимальный системный промпт' },
      href: '/learn/lean-prompts',
    },
    {
      id: 'few-shot',
      kind: 'pattern',
      title: { en: 'Few-shot examples', ru: 'Примеры few-shot' },
      keywords: { en: 'examples demonstrations shots', ru: 'примеры демонстрации' },
      href: '/patterns?p=few-shot',
    },
  ]

  it('returns nothing for an empty query', () => {
    expect(searchEntries(entries, '   ', 'en')).toEqual([])
  })

  it('finds by title', () => {
    expect(searchEntries(entries, 'thin', 'en')[0]?.id).toBe('lean-prompts')
  })

  it('finds by keyword', () => {
    expect(searchEntries(entries, 'demonstrations', 'en')[0]?.id).toBe('few-shot')
  })

  it('ranks a title match above a keyword match', () => {
    const results = searchEntries(entries, 'examples', 'en')
    expect(results[0]?.id).toBe('few-shot')
  })

  it('searches the other language too', () => {
    // Someone reading in Russian may only know the English term.
    expect(searchEntries(entries, 'few-shot', 'ru')[0]?.id).toBe('few-shot')
    expect(searchEntries(entries, 'тонкие', 'en')[0]?.id).toBe('lean-prompts')
  })

  it('requires every term to match', () => {
    expect(searchEntries(entries, 'thin nonexistent', 'en')).toEqual([])
  })

  it('respects the limit', () => {
    expect(searchEntries(entries, 'п', 'ru', 1).length).toBeLessThanOrEqual(1)
  })
})

import { describe, expect, it } from 'vitest'
import { analyze } from './analyzer/index.ts'
import { diffWords, improve } from './improve.ts'

describe('improve', () => {
  it('leaves an empty prompt alone', () => {
    const result = improve('   ')
    expect(result.text).toBe('   ')
    expect(result.steps).toHaveLength(0)
  })

  it('raises the score when there is something it can safely rewrite', () => {
    const original =
      'CRITICAL: you MUST always be accurate!! Please kindly summarise the report below. Think step by step and double-check your answer before responding.'
    const before = analyze(original, 'claude')
    const result = improve(original, 'claude')
    expect(result.after.score).toBeGreaterThan(before.score)
  })

  it('leaves the score alone when only the author can fix what is left', () => {
    // Nothing here is safely rewritable: every finding needs a decision the
    // engine cannot make, so it reports todos instead of inventing content.
    const original = 'Analyse the sales figures for the last quarter and tell me what happened.'
    const before = analyze(original)
    const result = improve(original)
    expect(result.after.score).toBe(before.score)
    expect(result.todos.length).toBeGreaterThan(0)
  })

  it('reports a missing output contract as a todo rather than inventing one', () => {
    const result = improve(
      'Analyse the sales figures for the last quarter and tell me what happened.',
    )
    expect(result.todos.map((todo) => todo.ruleId)).toContain('no-output-format')
  })

  it('never leaves a placeholder in the rewritten text', () => {
    const inputs = [
      'Analyse the sales figures for the last quarter and tell me what happened.',
      'Classify each support ticket below as billing, technical or account.',
      'Summarise the following email from a user and draft a reply for the support team today.',
    ]
    for (const input of inputs) {
      const result = improve(input)
      expect(result.after.findings.map((f) => f.ruleId)).not.toContain('unfilled-placeholder')
      expect(result.after.findings.map((f) => f.ruleId)).not.toContain('xml-unbalanced')
    }
  })

  it('removes redundant reasoning instructions for reasoning families', () => {
    const result = improve(
      'Solve the scheduling puzzle below. Think step by step and explain your reasoning as you go.',
      'claude',
    )
    expect(result.text.toLowerCase()).not.toContain('think step by step')
    expect(result.steps.some((step) => step.ruleId === 'explicit-cot-on-reasoning-model')).toBe(
      true,
    )
  })

  it('keeps reasoning instructions for families that need them', () => {
    const result = improve(
      'Solve the scheduling puzzle below. Think step by step and explain your reasoning as you go.',
      'llama',
    )
    expect(result.text.toLowerCase()).toContain('think step by step')
  })

  it('strips shouting', () => {
    const result = improve(
      'CRITICAL: you MUST always return the summary. This is extremely important!! Summarise the report for the leadership team.',
    )
    expect(result.text).not.toContain('!!')
    expect(result.text).not.toContain('CRITICAL')
  })

  it('never drops the original instruction text', () => {
    const original = 'Summarise the quarterly report for the board.'
    expect(improve(original).text).toContain('Summarise the quarterly report')
  })

  it('produces Russian scaffolding for a Russian prompt', () => {
    const result = improve(
      [
        'Вот следующее письмо от пользователя. Суммируй, что он хочет, и составь ответ для поддержки.',
        'Здравствуйте! Мой заказ номер 4471 так и не приехал, хотя в трекинге написано «доставлено» уже пятый день подряд, я звонил в курьерскую службу и там сказали обращаться к вам, потому что отправитель оформлял доставку, и я очень прошу разобраться, потому что деньги списали сразу.',
      ].join('\n'),
      'generic',
      'ru',
    )
    expect(result.text).toContain('# Задача')
    expect(result.text).toContain('<material>')
    expect(result.text).toContain('недоверенные данные')
  })

  it('is idempotent enough that a second pass finds less to fix', () => {
    const original = 'Analyse the sales figures for the last quarter and tell me what happened.'
    const once = improve(original)
    const twice = improve(once.text)
    expect(twice.after.findings.length).toBeLessThanOrEqual(once.after.findings.length)
  })
})

describe('diffWords', () => {
  it('marks an unchanged string as entirely the same', () => {
    const chunks = diffWords('hello world', 'hello world')
    expect(chunks.every((chunk) => chunk.op === 'same')).toBe(true)
  })

  it('detects an insertion', () => {
    const chunks = diffWords('hello world', 'hello brave world')
    expect(chunks.some((chunk) => chunk.op === 'add' && chunk.text.includes('brave'))).toBe(true)
  })

  it('detects a deletion', () => {
    const chunks = diffWords('hello brave world', 'hello world')
    expect(chunks.some((chunk) => chunk.op === 'remove' && chunk.text.includes('brave'))).toBe(true)
  })

  it('reconstructs both sides exactly', () => {
    const before = 'the quick brown fox jumps over the lazy dog'
    const after = 'the quick red fox leaps over a lazy dog today'
    const chunks = diffWords(before, after)
    const rebuiltBefore = chunks
      .filter((chunk) => chunk.op !== 'add')
      .map((chunk) => chunk.text)
      .join('')
    const rebuiltAfter = chunks
      .filter((chunk) => chunk.op !== 'remove')
      .map((chunk) => chunk.text)
      .join('')
    expect(rebuiltBefore).toBe(before)
    expect(rebuiltAfter).toBe(after)
  })

  it('falls back rather than allocating a huge table', () => {
    const big = 'word '.repeat(3000)
    const chunks = diffWords(big, `${big}extra`)
    expect(chunks.length).toBeLessThanOrEqual(2)
  })
})

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

describe('improve regressions', () => {
  // Cases where an adversarial review caught the rewriter corrupting input.

  it('never lowercases SQL keywords', () => {
    const original =
      'CRITICAL: rewrite this query and keep it valid!! SELECT Name FROM Customers WHERE Status = 1 ORDER BY Name.'
    const { text } = improve(original)
    expect(text).toContain('SELECT Name FROM Customers')
    expect(text).toContain('ORDER BY Name')
  })

  it('never joins a line starting with a dot onto the previous one', () => {
    const original = [
      'CRITICAL: migrate the service to the new runtime!!',
      '.NET Core is the target platform for the team, and the answer should be JSON.',
    ].join('\n')
    expect(improve(original).text).toContain('.NET Core')
  })

  it('returns the original rather than a stub when stripping would gut it', () => {
    // A prompt that is almost entirely politeness and emphasis: removing all of
    // it leaves nothing useful, and a two-word rewrite is worse than no rewrite.
    const original = 'Please, kindly, if you would be so kind, thank you in advance!!'
    const { text } = improve(original)
    expect(text.trim().split(/\s+/).length).toBeGreaterThanOrEqual(4)
  })

  it('keeps every improvement idempotent on a second pass', () => {
    const original =
      'CRITICAL: you MUST summarise the report below and double-check your answer!! Think step by step.'
    const once = improve(original, 'claude')
    const twice = improve(once.text, 'claude')
    expect(twice.after.score).toBeGreaterThanOrEqual(once.after.score)
  })

  it('produces a deterministic result across repeated calls', () => {
    const original = 'Analyse the sales figures for the last quarter and tell me what happened.'
    const first = improve(original).text
    for (let i = 0; i < 5; i++) expect(improve(original).text).toBe(first)
  })
})

describe('emphasis is never removed from mid-sentence', () => {
  // The shouting lexicon is ordinary vocabulary. Deleting it wherever it
  // appeared destroyed meaning, and in the prohibition case inverted it.
  it.each([
    [
      'CRITICAL: explain the critical path of the project plan!! You must list every dependency.',
      ['critical path', 'You must list'],
    ],
    [
      'It is crucial that you flag every mandatory field in the intake form!! Return a table.',
      ['crucial', 'mandatory field'],
    ],
    [
      'Under no circumstances should you invent numbers. Critical: the audit fields must appear!!',
      ['Under no circumstances should you invent numbers'],
    ],
  ])('keeps the meaning of %j', (input, mustSurvive) => {
    const { text } = improve(input)
    for (const fragment of mustSurvive) expect(text).toContain(fragment)
  })

  it('keeps Russian emphasis that carries meaning', () => {
    const { text } = improve(
      'Это критично для расчёта маржи!! Обязательно перечисли все статьи расходов таблицей.',
      'generic',
      'ru',
    )
    expect(text).toContain('критично для расчёта маржи')
    expect(text).toContain('Обязательно перечисли')
  })

  it('still removes a decorative label at the start of a line', () => {
    // The rewriter only edits when the analyzer raised a finding, so the input
    // has to actually be shouting — a bare "IMPORTANT:" is not, and correctly
    // comes back untouched.
    const { text } = improve(
      'CRITICAL: summarise the incident report below for the on-call handover!! 100 words.',
    )
    expect(text).not.toMatch(/^CRITICAL:/m)
    expect(text).toContain('summarise the incident report')
  })

  it('leaves a prompt alone when there is no finding to act on', () => {
    const original = 'IMPORTANT: summarise the incident report below in 100 words as a bullet list.'
    expect(improve(original).text).toBe(original)
  })

  it('never inverts a prohibition', () => {
    const original = 'Never invent figures!! Under no circumstances should you round the totals.'
    const { text } = improve(original)
    expect(text).toContain('Never invent figures')
    expect(text).toContain('Under no circumstances')
  })
})

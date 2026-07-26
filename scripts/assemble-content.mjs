#!/usr/bin/env node
/**
 * Assembles authored content units into the single JSON file that
 * `build-content.mjs` consumes.
 *
 *   node scripts/assemble-content.mjs <units.jsonl> <out.json>
 *
 * Input is one JSON object per line, each being a `{lessons}`, `{patterns}` or
 * `{notes}` unit. This script supplies what the units cannot know about
 * themselves — the track a lesson belongs to, track ordering, prerequisites —
 * and validates the result so a bad unit fails here rather than at render time.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/** The course spine. Order here is the order a learner walks it. */
const TRACKS = [
  {
    id: 'foundations',
    title: { en: 'Foundations', ru: 'Основы' },
    goal: {
      en: 'Turn a wish into a specification the model can actually satisfy.',
      ru: 'Превратить пожелание в спецификацию, которую модель действительно может выполнить.',
    },
    lessonIds: ['anatomy', 'be-specific', 'context-that-matters', 'output-contract'],
  },
  {
    id: 'structure',
    title: { en: 'Structure', ru: 'Структура' },
    goal: {
      en: 'Make a long prompt readable by the model, not just by you.',
      ru: 'Сделать длинный промпт читаемым для модели, а не только для вас.',
    },
    requires: 'foundations',
    lessonIds: ['structure', 'examples', 'long-context'],
  },
  {
    id: 'modern',
    title: { en: 'Prompting in 2026', ru: 'Промптинг в 2026' },
    goal: {
      en: 'Unlearn the techniques current models absorbed or now penalise.',
      ru: 'Разучиться приёмам, которые нынешние модели впитали или уже штрафуют.',
    },
    requires: 'structure',
    lessonIds: ['lean-prompts', 'reasoning-2026', 'model-differences'],
  },
  {
    id: 'reliability',
    title: { en: 'Reliability', ru: 'Надёжность' },
    goal: {
      en: 'Make fabrication visible and keep untrusted text from giving orders.',
      ru: 'Сделать выдумки заметными и не дать недоверенному тексту отдавать команды.',
    },
    requires: 'modern',
    lessonIds: ['hallucination', 'injection', 'evaluation'],
  },
  {
    id: 'systems',
    title: { en: 'Systems', ru: 'Системы' },
    goal: {
      en: 'Build pipelines and tool-using agents whose failures are inspectable.',
      ru: 'Строить конвейеры и агентов с инструментами, чьи сбои можно разобрать.',
    },
    requires: 'reliability',
    lessonIds: ['decomposition', 'agents', 'cost'],
  },
  {
    id: 'mastery',
    title: { en: 'Mastery', ru: 'Мастерство' },
    goal: {
      en: 'Iterate on evidence and keep prompts alive in production.',
      ru: 'Итерировать по данным и поддерживать промпты живыми в проде.',
    },
    requires: 'systems',
    lessonIds: ['iteration', 'meta-prompting', 'production'],
  },
]

const TRACK_FOR_LESSON = new Map(
  TRACKS.flatMap((track) => track.lessonIds.map((id) => [id, track.id])),
)

const VALID_BLOCK_KINDS = new Set(['p', 'h', 'list', 'note', 'code', 'compare', 'quote'])
const VALID_CHECK_KINDS = new Set([
  'noFinding',
  'hasFinding',
  'matches',
  'absent',
  'minScore',
  'minWords',
  'maxWords',
  'anyOf',
])

const problems = []
const note = (message) => problems.push(message)

/** Drops blocks the renderer cannot draw, rather than shipping a broken lesson. */
function cleanBlocks(blocks, where) {
  if (!Array.isArray(blocks)) {
    note(`${where}: blocks missing`)
    return []
  }
  return blocks.filter((block) => {
    if (!VALID_BLOCK_KINDS.has(block?.kind)) {
      note(`${where}: dropped block of unknown kind "${block?.kind}"`)
      return false
    }
    if (block.kind === 'compare' && (!block.bad || !block.good)) {
      note(`${where}: dropped compare block missing a side`)
      return false
    }
    if (block.kind === 'list' && !Array.isArray(block.items)) {
      note(`${where}: dropped list block with no items`)
      return false
    }
    if (block.kind === 'quote' && !block.source) {
      note(`${where}: dropped quote with no source`)
      return false
    }
    return true
  })
}

function cleanChecks(checks, where) {
  if (!Array.isArray(checks)) return []
  return checks.filter((check) => {
    if (!VALID_CHECK_KINDS.has(check?.kind)) {
      note(`${where}: dropped check of unknown kind "${check?.kind}"`)
      return false
    }
    if (!check.label?.en || !check.label?.ru) {
      note(`${where}: dropped check with incomplete label`)
      return false
    }
    if ((check.kind === 'matches' || check.kind === 'absent') && !check.pattern) {
      note(`${where}: dropped ${check.kind} check with no pattern`)
      return false
    }
    if (check.kind === 'matches' || check.kind === 'absent') {
      try {
        new RegExp(check.pattern, 'iu')
      } catch {
        note(`${where}: dropped check with invalid pattern /${check.pattern}/`)
        return false
      }
    }
    if (check.kind === 'anyOf') {
      if (!Array.isArray(check.patterns) || check.patterns.length === 0) return false
      for (const pattern of check.patterns) {
        try {
          new RegExp(pattern, 'iu')
        } catch {
          note(`${where}: dropped anyOf check with invalid pattern /${pattern}/`)
          return false
        }
      }
    }
    return true
  })
}

async function main() {
  const [input, output] = process.argv.slice(2)
  if (!input || !output) {
    console.error('usage: node scripts/assemble-content.mjs <units.jsonl> <out.json>')
    process.exit(1)
  }

  const lessons = []
  const patterns = []
  const modelNotes = []

  for (const line of (await readFile(resolve(input), 'utf8')).split('\n')) {
    if (!line.trim()) continue
    const unit = JSON.parse(line)
    if (Array.isArray(unit.lessons)) lessons.push(...unit.lessons)
    if (Array.isArray(unit.patterns)) patterns.push(...unit.patterns)
    if (Array.isArray(unit.notes)) modelNotes.push(...unit.notes)
  }

  for (const lesson of lessons) {
    const where = `lesson "${lesson.id}"`
    const trackId = TRACK_FOR_LESSON.get(lesson.id)
    if (!trackId) {
      note(`${where}: not listed in any track — it will not appear in the course`)
      continue
    }
    lesson.trackId = trackId
    lesson.blocksEn = cleanBlocks(lesson.blocksEn, `${where} (en)`)
    lesson.blocksRu = cleanBlocks(lesson.blocksRu, `${where} (ru)`)
    if (lesson.blocksRu.length !== lesson.blocksEn.length) {
      note(`${where}: ${lesson.blocksEn.length} en blocks vs ${lesson.blocksRu.length} ru blocks`)
    }
    for (const exercise of lesson.exercises ?? []) {
      exercise.checks = cleanChecks(exercise.checks, `${where}/${exercise.id}`)
      if (exercise.checks.length === 0) {
        note(`${where}/${exercise.id}: no usable checks — the exercise cannot be passed`)
      }
    }
  }

  // Order lessons by the track spine so the course reads in the intended order.
  const order = TRACKS.flatMap((track) => track.lessonIds)
  lessons.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))

  const known = new Set(lessons.map((lesson) => lesson.id))
  for (const track of TRACKS) {
    for (const id of track.lessonIds) {
      if (!known.has(id)) note(`track "${track.id}": lesson "${id}" was never authored`)
    }
  }

  const patternIds = new Set(patterns.map((pattern) => pattern.id))
  for (const pattern of patterns) {
    for (const related of pattern.related ?? []) {
      if (!patternIds.has(related)) {
        note(`pattern "${pattern.id}": related pattern "${related}" does not exist`)
      }
    }
  }
  for (const lesson of lessons) {
    for (const id of lesson.patternIds ?? []) {
      if (!patternIds.has(id)) note(`lesson "${lesson.id}": pattern "${id}" does not exist`)
    }
    lesson.patternIds = (lesson.patternIds ?? []).filter((id) => patternIds.has(id))
  }

  // Tracks whose lessons are all missing would render as empty cards.
  const tracks = TRACKS.filter((track) => track.lessonIds.some((id) => known.has(id))).map(
    (track) => ({ ...track, lessonIds: track.lessonIds.filter((id) => known.has(id)) }),
  )

  await writeFile(
    resolve(output),
    JSON.stringify({ tracks, lessons, patterns, modelNotes }, null, 2),
  )

  console.log(
    `assembled ${tracks.length} tracks, ${lessons.length} lessons, ${patterns.length} patterns, ${modelNotes.length} model notes`,
  )
  if (problems.length > 0) {
    console.log(`\n${problems.length} issue(s):`)
    for (const problem of problems) console.log(`  - ${problem}`)
  }
}

await main()

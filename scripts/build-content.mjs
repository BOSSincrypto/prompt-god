#!/usr/bin/env node
/**
 * Turns authored bilingual content into per-locale TypeScript modules.
 *
 *   node scripts/build-content.mjs <authored.json>
 *
 * Input is a single JSON file holding the authored units:
 *   { tracks: [...], lessons: [...], patterns: [...], modelNotes: [...] }
 * where every human-readable field is {"en": ..., "ru": ...}.
 *
 * Output is committed source, not a build artefact. Emitting TypeScript rather
 * than importing JSON means the content is type-checked against
 * `src/content/types.ts` on every `npm run typecheck`, so a malformed lesson
 * fails CI instead of rendering as an empty page.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'src/content')

const LOCALES = ['en', 'ru']

const HEADER = `// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/build-content.mjs <authored.json>
`

/** Picks one locale out of a {en, ru} pair, tolerating already-flat values. */
function pick(value, locale) {
  if (value === null || value === undefined) return value
  if (typeof value === 'object' && !Array.isArray(value) && ('en' in value || 'ru' in value)) {
    return value[locale] ?? value.en ?? value.ru
  }
  return value
}

/** Recursively resolves every bilingual pair in a structure to one locale. */
function localize(node, locale) {
  if (Array.isArray(node)) return node.map((item) => localize(item, locale))
  if (node && typeof node === 'object') {
    if ('en' in node && 'ru' in node && Object.keys(node).length === 2) return pick(node, locale)
    const out = {}
    for (const [key, value] of Object.entries(node)) {
      if (value === undefined) continue
      out[key] = localize(value, locale)
    }
    return out
  }
  return node
}

/** Serialises a value as a TypeScript literal, preferring readable strings. */
function literal(value, indent = 0) {
  const pad = '  '.repeat(indent)
  const padInner = '  '.repeat(indent + 1)

  if (value === null) return 'null'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'string') {
    // Multi-line strings become template literals so prompts stay readable in
    // the emitted source and in diffs.
    if (value.includes('\n')) {
      return `\`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``
    }
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((item) => `${padInner}${literal(item, indent + 1)}`)
    return `[\n${items.join(',\n')},\n${pad}]`
  }
  const entries = Object.entries(value).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return '{}'
  const body = entries.map(
    ([key, v]) =>
      `${padInner}${/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${literal(v, indent + 1)}`,
  )
  return `{\n${body.join(',\n')},\n${pad}}`
}

function emit(exportName, typeName, value) {
  // `Pattern[]` annotates the export but `Pattern` is what gets imported.
  const imported = typeName.replace(/\[\]$/, '')
  return `${HEADER}import type { ${imported} } from './types.ts'

export const ${exportName}: ${typeName} = ${literal(value)}
`
}

/**
 * Blocks are authored as two parallel arrays (blocksEn / blocksRu) rather than
 * as bilingual leaves, because the block objects themselves already have an
 * `en`/`ru`-free shape and mixing the two forms would be ambiguous.
 */
function lessonForLocale(lesson, locale) {
  const blocks = locale === 'ru' ? (lesson.blocksRu ?? lesson.blocksEn) : lesson.blocksEn
  const out = {
    id: lesson.id,
    trackId: lesson.trackId,
    title: pick(lesson.title, locale),
    summary: pick(lesson.summary, locale),
    minutes: lesson.minutes,
    xp: lesson.xp,
    keyIdea: pick(lesson.keyIdea, locale),
    pitfall: pick(lesson.pitfall, locale),
    blocks: (blocks ?? []).map((block) => {
      const clean = {}
      for (const [key, value] of Object.entries(block)) {
        if (value !== undefined && value !== null) clean[key] = value
      }
      return clean
    }),
    exercises: (lesson.exercises ?? []).map((exercise) => {
      const out = {
        id: exercise.id,
        brief: pick(exercise.brief, locale),
        hint: pick(exercise.hint, locale),
        solution: pick(exercise.solution, locale),
        checks: (exercise.checks ?? []).map((check) => localize(check, locale)),
      }
      if (exercise.starter) out.starter = exercise.starter
      if (exercise.family) out.family = exercise.family
      return out
    }),
  }
  if (lesson.patternIds?.length) out.patternIds = lesson.patternIds
  return out
}

function buildSearchIndex(lessons, patterns) {
  const entries = []
  for (const lesson of lessons) {
    entries.push({
      id: lesson.id,
      kind: 'lesson',
      title: { en: pick(lesson.title, 'en'), ru: pick(lesson.title, 'ru') },
      keywords: {
        en: `${pick(lesson.summary, 'en')} ${pick(lesson.keyIdea, 'en')}`.toLowerCase(),
        ru: `${pick(lesson.summary, 'ru')} ${pick(lesson.keyIdea, 'ru')}`.toLowerCase(),
      },
      href: `/learn/${lesson.id}`,
    })
  }
  for (const pattern of patterns) {
    const tags = (pattern.tags ?? []).join(' ')
    entries.push({
      id: pattern.id,
      kind: 'pattern',
      title: { en: pick(pattern.name, 'en'), ru: pick(pattern.name, 'ru') },
      keywords: {
        en: `${pattern.id} ${tags} ${pick(pattern.summary, 'en')}`.toLowerCase(),
        ru: `${pattern.id} ${tags} ${pick(pattern.summary, 'ru')}`.toLowerCase(),
      },
      href: `/patterns?p=${pattern.id}`,
    })
  }
  return entries
}

async function main() {
  const source = process.argv[2]
  if (!source) {
    console.error('usage: node scripts/build-content.mjs <authored.json>')
    process.exit(1)
  }

  const authored = JSON.parse(await readFile(resolve(source), 'utf8'))
  const { tracks = [], lessons = [], patterns = [], modelNotes = [] } = authored

  for (const locale of LOCALES) {
    const course = {
      tracks: tracks.map((track) => {
        const out = {
          id: track.id,
          title: pick(track.title, locale),
          goal: pick(track.goal, locale),
          lessonIds: track.lessonIds,
        }
        if (track.requires) out.requires = track.requires
        return out
      }),
      lessons: lessons.map((lesson) => lessonForLocale(lesson, locale)),
    }
    await writeFile(resolve(outDir, `course.${locale}.ts`), emit('course', 'CourseContent', course))

    const localizedPatterns = patterns.map((pattern) => {
      const out = {
        id: pattern.id,
        name: pick(pattern.name, locale),
        category: pattern.category,
        level: pattern.level,
        summary: pick(pattern.summary, locale),
        whenToUse: pick(pattern.whenToUse, locale),
        whenNotToUse: pick(pattern.whenNotToUse, locale),
        template: pattern.template,
        models: pattern.models,
        related: pattern.related,
        tags: pattern.tags,
      }
      const evidence = pick(pattern.evidence, locale)
      if (evidence) out.evidence = evidence
      if (pattern.evidenceUrl) out.evidenceUrl = pattern.evidenceUrl
      return out
    })
    await writeFile(
      resolve(outDir, `patterns.${locale}.ts`),
      emit('patterns', 'Pattern[]', localizedPatterns),
    )

    const localizedNotes = modelNotes.map((note) => ({
      family: note.family,
      lineup: note.lineup,
      headline: pick(note.headline, locale),
      strengths: pick(note.strengths, locale),
      quirks: (note.quirks ?? []).map((quirk) => ({
        title: pick(quirk.title, locale),
        body: pick(quirk.body, locale),
      })),
      doThis: pick(note.doThis, locale),
      avoid: pick(note.avoid, locale),
    }))
    await writeFile(
      resolve(outDir, `models.${locale}.ts`),
      emit('modelNotes', 'ModelNote[]', localizedNotes),
    )
  }

  await writeFile(
    resolve(outDir, 'search-index.ts'),
    emit('searchIndex', 'IndexEntry[]', buildSearchIndex(lessons, patterns)),
  )

  console.log(
    `content: ${tracks.length} tracks, ${lessons.length} lessons, ${patterns.length} patterns, ${modelNotes.length} model notes × ${LOCALES.length} locales`,
  )
}

await main()

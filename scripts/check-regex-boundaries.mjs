/**
 * Fails the build when a regex uses an ASCII word boundary next to Cyrillic.
 *
 * JavaScript defines `\b` against ASCII `\w` even under the `u` flag, so it is
 * never a boundary inside Cyrillic text. A trailing `\b` after a Russian
 * alternative kills that one branch of an alternation while every English
 * branch keeps working: the rule still fires, still passes its English tests,
 * and is simply dead for half the audience. Four rules shipped that way before
 * it was caught, which is why this is enforced rather than remembered.
 *
 * The fix is a Unicode assertion: `(?<![\p{L}\p{N}])` and `(?![\p{L}\p{N}])`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOTS = ['src']

// A `\b` touching Cyrillic, allowing regex syntax to sit between them, so
// `(?:ы|ов)?\b` and `ваш[аи]?е?)\b` are both caught.
const OFFENDING = /\\b\p{Script=Cyrillic}|\p{Script=Cyrillic}[)\]?*+]*\\b/u

/** Guards the guard: if this stops matching, the check is silently vacuous. */
const SELF_TEST = [
  String.raw`/\bпример(?:ы|ов)?\b/giu`,
  String.raw`/\[(?:paste|ваш[аи]?е?)\b[^\]]{0,40}\]/giu`,
]
for (const sample of SELF_TEST) {
  if (!OFFENDING.test(sample)) {
    console.error(`check-regex-boundaries is broken: it no longer detects ${sample}`)
    process.exit(2)
  }
}
if (OFFENDING.test(String.raw`/\bexamples?\b|пример/giu`)) {
  console.error('check-regex-boundaries is too eager: it flags a correct pattern')
  process.exit(2)
}

const files = []
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.tsx?$/.test(path)) files.push(path)
  }
}
for (const root of ROOTS) walk(root)

const offenders = []
for (const file of files) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (OFFENDING.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`)
    })
}

if (offenders.length > 0) {
  console.error('\nASCII \\b cannot match beside Cyrillic — use (?<![\\p{L}\\p{N}]) instead:\n')
  for (const offender of offenders) console.error(`  ${offender}`)
  console.error('')
  process.exit(1)
}

console.log(`Regex boundaries: ${files.length} files, no ASCII \\b beside Cyrillic`)

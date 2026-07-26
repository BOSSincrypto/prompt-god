#!/usr/bin/env node
/**
 * Fails the build when the code a first-time visitor must download grows past
 * budget. Only the entry chunk + its static imports + CSS count: lazily loaded
 * routes, locales and content are deliberately excluded because they never
 * block first paint.
 *
 *   npm run budget
 */
import { readFile, readdir, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')

/** Gzipped kilobytes. */
const BUDGET = {
  initialJs: 165,
  initialCss: 40,
  totalJs: 900,
}

const kb = (bytes) => bytes / 1024
const fmt = (n) => `${n.toFixed(1)} KB`

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}

async function gzippedSize(path) {
  return gzipSync(await readFile(path), { level: 9 }).length
}

async function main() {
  try {
    await stat(dist)
  } catch {
    console.error('dist/ not found — run `npm run build:only` first.')
    process.exit(1)
  }

  const html = await readFile(resolve(dist, 'index.html'), 'utf8')

  // The entry chunk and anything Vite marks as a blocking preload are what the
  // browser must have before the app can render.
  const entryRefs = new Set()
  for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) entryRefs.add(m[1])
  for (const m of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g))
    entryRefs.add(m[1])
  const cssRefs = new Set()
  for (const m of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) cssRefs.add(m[1])

  const toPath = (ref) => resolve(dist, ref.replace(/^\//, ''))

  let initialJs = 0
  for (const ref of entryRefs) initialJs += await gzippedSize(toPath(ref))
  let initialCss = 0
  for (const ref of cssRefs) initialCss += await gzippedSize(toPath(ref))

  const files = await walk(dist)
  let totalJs = 0
  for (const f of files) if (extname(f) === '.js') totalJs += await gzippedSize(f)

  const checks = [
    ['initial JS', kb(initialJs), BUDGET.initialJs],
    ['initial CSS', kb(initialCss), BUDGET.initialCss],
    ['total JS (all chunks)', kb(totalJs), BUDGET.totalJs],
  ]

  let failed = false
  console.log('\nBundle budget (gzip)\n' + '-'.repeat(46))
  for (const [label, actual, budget] of checks) {
    const ok = actual <= budget
    if (!ok) failed = true
    const pct = ((actual / budget) * 100).toFixed(0)
    console.log(
      `${ok ? 'ok  ' : 'FAIL'}  ${label.padEnd(24)} ${fmt(actual).padStart(9)} / ${fmt(budget).padStart(9)}  (${pct}%)`,
    )
  }
  console.log('-'.repeat(46))
  console.log(
    `${entryRefs.size} entry chunk(s), ${files.filter((f) => extname(f) === '.js').length} JS files total\n`,
  )

  if (failed) {
    console.error(
      'Bundle budget exceeded. Split a route, drop a dependency, or raise the budget deliberately.',
    )
    process.exit(1)
  }
}

await main()

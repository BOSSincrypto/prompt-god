#!/usr/bin/env node
/**
 * Rasterises the single source SVG into every icon the manifest and Apple
 * need, plus the Open Graph card. Committed output is intentional: CI stays
 * free of native image deps and the icons rarely change.
 *
 *   npm run icons
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/icons')

const ACCENT_A = '#7c5cff'
const ACCENT_B = '#22d3ee'
const INK = '#08080c'

/** @param {number} size @param {number} radius @param {number} inset */
const markSvg = (size, radius, inset) => {
  const s = size
  const box = s - inset * 2
  const k = box / 64
  const x = (n) => inset + n * k
  const stroke = 6.5 * k
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${ACCENT_A}"/><stop offset="1" stop-color="${ACCENT_B}"/>
  </linearGradient></defs>
  <rect width="${s}" height="${s}" fill="${INK}"/>
  <rect x="${inset}" y="${inset}" width="${box}" height="${box}" rx="${radius}" fill="url(#g)"/>
  <path d="M${x(20)} ${x(21)} ${x(32)} ${x(32)} ${x(20)} ${x(43)}" fill="none" stroke="${INK}"
        stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M${x(37)} ${x(43)}h${9 * k}" fill="none" stroke="${INK}"
        stroke-width="${stroke}" stroke-linecap="round"/>
</svg>`
}

const ogSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ACCENT_A}"/><stop offset="1" stop-color="${ACCENT_B}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.22" cy="0.3" r="0.75">
      <stop offset="0" stop-color="${ACCENT_A}" stop-opacity="0.34"/>
      <stop offset="1" stop-color="${ACCENT_A}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${INK}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="88" y="150" width="104" height="104" rx="28" fill="url(#g)"/>
  <path d="M120 176 v0 l32 26 -32 26" fill="none" stroke="${INK}" stroke-width="11"
        stroke-linecap="round" stroke-linejoin="round"/>
  <text x="88" y="360" fill="#ffffff" font-size="82" font-weight="700"
        font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">Prompt God</text>
  <text x="88" y="428" fill="#a6a6b8" font-size="34"
        font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">
    Learn to write prompts that actually work
  </text>
  <text x="88" y="500" fill="#6f6f85" font-size="26"
        font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">
    Interactive lessons · Live analyzer · Pattern library · Works offline
  </text>
</svg>`

async function main() {
  await mkdir(outDir, { recursive: true })

  /** [filename, size, cornerRadius, inset] — maskable needs a 20% safe area. */
  const targets = [
    ['icon-192.png', 192, 44, 0],
    ['icon-512.png', 512, 118, 0],
    ['maskable-512.png', 512, 96, 90],
    ['apple-touch-icon.png', 180, 0, 0],
  ]

  for (const [name, size, radius, inset] of targets) {
    const svg = markSvg(size, radius || size * 0.001, inset)
    const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()
    await writeFile(resolve(outDir, name), png)
    process.stdout.write(`icons/${name}  ${(png.length / 1024).toFixed(1)} KB\n`)
  }

  const og = await sharp(Buffer.from(ogSvg())).png({ compressionLevel: 9 }).toBuffer()
  await writeFile(resolve(root, 'public/og.png'), og)
  process.stdout.write(`og.png  ${(og.length / 1024).toFixed(1)} KB\n`)
}

await main()

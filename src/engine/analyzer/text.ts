/**
 * Text primitives shared by every rule. Deliberately dependency-free and
 * language-aware: the analyzer has to be as useful on a Russian prompt as on
 * an English one, so nothing here assumes Latin script.
 */

export type TextLang = 'en' | 'ru'

const CYRILLIC = /[Ѐ-ӿ]/g
const LATIN = /[A-Za-z]/g

/** Detects the dominant script so rules can pick the right pattern set. */
export function detectLang(text: string): TextLang {
  const cyrillic = text.match(CYRILLIC)?.length ?? 0
  const latin = text.match(LATIN)?.length ?? 0
  return cyrillic > latin ? 'ru' : 'en'
}

export interface Span {
  start: number
  end: number
}

const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu

export function words(text: string): string[] {
  return text.match(WORD) ?? []
}

/**
 * Splits into sentences on terminal punctuation and hard line breaks.
 * Abbreviations are not special-cased — sentence counts feed heuristics, not
 * anything that needs linguistic precision.
 */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\n{1,}/u)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function lines(text: string): string[] {
  return text.split('\n')
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/**
 * Approximate token count. Real tokenizers are model-specific and far too
 * large to ship, so this uses the well-known chars-per-token ratios: Latin
 * text averages ~4 chars/token, Cyrillic roughly half that because it is
 * encoded less efficiently by every current BPE vocabulary.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  const cyrillic = text.match(CYRILLIC)?.length ?? 0
  const ratio = cyrillic / Math.max(1, text.length)
  const charsPerToken = 4 - ratio * 1.8
  return Math.ceil(text.length / charsPerToken)
}

/** Finds every non-overlapping match of `pattern`, returning offsets. */
export function findSpans(text: string, pattern: RegExp, limit = 12): Span[] {
  const re = new RegExp(
    pattern.source,
    pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
  )
  const out: Span[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    if (match[0].length === 0) {
      re.lastIndex++
      continue
    }
    out.push({ start: match.index, end: match.index + match[0].length })
    if (out.length >= limit) break
  }
  return out
}

export function countMatches(text: string, pattern: RegExp): number {
  const re = new RegExp(
    pattern.source,
    pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
  )
  let count = 0
  while (re.exec(text) !== null) {
    count++
    if (count > 1000) break
  }
  return count
}

/** Builds a case-insensitive alternation that only matches whole words. */
export function wordListPattern(items: readonly string[]): RegExp {
  const escaped = items.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${escaped.join('|')})(?![\\p{L}\\p{N}])`, 'giu')
}

/**
 * Fenced code blocks, XML-ish tags and quoted blocks are all treated as
 * structural delimiters — the thing that separates instructions from data.
 */
export interface Structure {
  codeFences: number
  xmlTags: string[]
  markdownHeadings: number
  bulletLines: number
  numberedLines: number
  tripleQuotes: number
  hasAnyDelimiter: boolean
}

const XML_TAG = /<\/?([a-z][\w-]*)(?:\s[^>]*)?>/gi

export function analyzeStructure(text: string): Structure {
  const codeFences = countMatches(text, /```/g)
  const tags = new Set<string>()
  let match: RegExpExecArray | null
  const re = new RegExp(XML_TAG.source, XML_TAG.flags)
  while ((match = re.exec(text)) !== null) {
    const name = match[1]
    if (name) tags.add(name.toLowerCase())
  }
  const markdownHeadings = countMatches(text, /^#{1,6}\s+\S/gm)
  const bulletLines = countMatches(text, /^\s*[-*•—]\s+\S/gm)
  const numberedLines = countMatches(text, /^\s*\d+[.)]\s+\S/gm)
  const tripleQuotes = countMatches(text, /"""|'''/g)

  return {
    codeFences,
    xmlTags: [...tags],
    markdownHeadings,
    bulletLines,
    numberedLines,
    tripleQuotes,
    hasAnyDelimiter:
      codeFences >= 2 ||
      tags.size > 0 ||
      markdownHeadings > 0 ||
      tripleQuotes >= 2 ||
      bulletLines + numberedLines >= 2,
  }
}

/**
 * A crude readability proxy that behaves sensibly in both scripts: mean words
 * per sentence plus mean syllable-ish length. Used only to flag prompts whose
 * own instructions are harder to parse than the task they describe.
 */
export function readabilityScore(text: string): number {
  const s = sentences(text)
  const w = words(text)
  if (s.length === 0 || w.length === 0) return 0
  const wordsPerSentence = w.length / s.length
  const longWords = w.filter((word) => word.length > 9).length / w.length
  return Math.round(wordsPerSentence + longWords * 40)
}

export interface TextStats {
  chars: number
  words: number
  sentences: number
  lines: number
  paragraphs: number
  tokens: number
  readability: number
}

export function computeStats(text: string): TextStats {
  return {
    chars: text.length,
    words: words(text).length,
    sentences: sentences(text).length,
    lines: lines(text).length,
    paragraphs: paragraphs(text).length,
    tokens: estimateTokens(text),
    readability: readabilityScore(text),
  }
}

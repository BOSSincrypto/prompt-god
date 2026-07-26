import { Fragment, useLayoutEffect, useMemo, useRef } from 'react'
import type { Finding, Severity } from '@/engine/analyzer/index.ts'
import { cx } from '@/lib/cx.ts'

/**
 * A textarea with a highlight layer behind it.
 *
 * A real code editor would cost ~100 KB gzipped for features this app does not
 * need. Instead an absolutely positioned <pre> renders the same text with the
 * problem spans marked, and the transparent textarea sits on top. Both use the
 * `editor-type` utility so every glyph lands on the same pixel.
 */

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: 'bg-err-soft decoration-err',
  high: 'bg-err-soft decoration-err',
  medium: 'bg-warn-soft decoration-warn',
  low: 'bg-accent-soft decoration-accent',
  info: 'bg-info-soft decoration-info',
}

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
}

interface Segment {
  start: number
  end: number
  severity: Severity | null
}

/**
 * Flattens possibly overlapping finding spans into a non-overlapping run of
 * segments, keeping the most severe finding wherever they collide.
 */
export function buildSegments(length: number, findings: readonly Finding[]): Segment[] {
  if (length === 0) return []

  const marks: { start: number; end: number; severity: Severity }[] = []
  for (const finding of findings) {
    for (const span of finding.spans) {
      const start = Math.max(0, Math.min(length, span.start))
      const end = Math.max(0, Math.min(length, span.end))
      if (end > start) marks.push({ start, end, severity: finding.severity })
    }
  }
  if (marks.length === 0) return [{ start: 0, end: length, severity: null }]

  // Sweep over every boundary; between two adjacent boundaries the set of
  // covering marks is constant, so one lookup per gap decides its severity.
  const boundaries = new Set<number>([0, length])
  for (const mark of marks) {
    boundaries.add(mark.start)
    boundaries.add(mark.end)
  }
  const points = [...boundaries].sort((a, b) => a - b)

  const segments: Segment[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    if (start === undefined || end === undefined) continue
    let severity: Severity | null = null
    for (const mark of marks) {
      if (mark.start <= start && mark.end >= end) {
        if (severity === null || SEVERITY_RANK[mark.severity] < SEVERITY_RANK[severity]) {
          severity = mark.severity
        }
      }
    }
    const previous = segments[segments.length - 1]
    if (previous && previous.severity === severity) previous.end = end
    else segments.push({ start, end, severity })
  }
  return segments
}

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  findings: readonly Finding[]
  highlight: boolean
  placeholder?: string
  ariaLabel: string
  minRows?: number
}

export function PromptEditor({
  value,
  onChange,
  findings,
  highlight,
  placeholder,
  ariaLabel,
  minRows = 12,
}: PromptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLPreElement>(null)

  const segments = useMemo(
    () => (highlight ? buildSegments(value.length, findings) : []),
    [highlight, value.length, findings],
  )

  // The overlay has to follow the textarea's scroll exactly, and a passive
  // listener on the real scroll event is the only thing that stays in sync
  // during momentum scrolling.
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    const overlay = overlayRef.current
    if (!textarea || !overlay) return
    const sync = () => {
      overlay.scrollTop = textarea.scrollTop
      overlay.scrollLeft = textarea.scrollLeft
    }
    sync()
    textarea.addEventListener('scroll', sync, { passive: true })
    return () => textarea.removeEventListener('scroll', sync)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-sunken focus-within:border-line-strong">
      {highlight && (
        <pre
          ref={overlayRef}
          aria-hidden="true"
          className="editor-type pointer-events-none absolute inset-0 overflow-hidden px-4 py-3 text-transparent"
        >
          {segments.map((segment, index) => {
            const text = value.slice(segment.start, segment.end)
            if (!segment.severity) return <Fragment key={index}>{text}</Fragment>
            return (
              <mark
                key={index}
                className={cx(
                  'rounded-[3px] text-transparent underline decoration-wavy decoration-2 underline-offset-4',
                  SEVERITY_STYLE[segment.severity],
                )}
              >
                {text}
              </mark>
            )
          })}
          {/* A trailing newline is not rendered by <pre>; this keeps the last
              line's highlight aligned with the textarea. */}
          {'\n'}
        </pre>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        rows={minRows}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className="editor-type relative block w-full resize-y bg-transparent px-4 py-3 text-fg caret-current outline-none placeholder:text-subtle"
      />
    </div>
  )
}

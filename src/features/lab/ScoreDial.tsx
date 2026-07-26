import { useT } from '@/i18n/index.tsx'
import type { AnalysisResult } from '@/engine/analyzer/index.ts'

const GRADE_COLOR: Record<AnalysisResult['grade'], string> = {
  A: 'var(--ok)',
  B: 'var(--ok)',
  C: 'var(--warn)',
  D: 'var(--warn)',
  F: 'var(--err)',
}

/**
 * The score readout. An SVG ring rather than a bar: it reads as a single
 * verdict at a glance, and the stroke animates on the GPU.
 */
export function ScoreDial({ result }: { result: AnalysisResult }) {
  const t = useT()
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - result.score / 100)
  const color = GRADE_COLOR[result.grade]

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-[104px] shrink-0">
        <svg viewBox="0 0 104 104" className="size-full -rotate-90">
          <circle
            cx="52"
            cy="52"
            r={radius}
            fill="none"
            stroke="var(--bg-sunken)"
            strokeWidth="9"
          />
          <circle
            cx="52"
            cy="52"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset,stroke] duration-500 ease-out-quint"
          />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <div data-testid="score" className="text-2xl font-semibold leading-none tabular-nums">
            {result.score}
          </div>
          <div className="mt-0.5 text-[0.625rem] uppercase tracking-[0.14em] text-subtle">
            {t('lab.score')}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-3xl font-semibold leading-none" style={{ color }}>
          {result.grade}
        </div>
        <div className="mt-1.5 text-sm text-muted">
          {result.findings.length === 0
            ? t('lab.noIssues')
            : t('lab.issueCount', { n: result.findings.length })}
        </div>
        <div className="mt-1 text-xs text-subtle tabular-nums">
          {result.elapsedMs < 1 ? '<1' : Math.round(result.elapsedMs)} ms · {result.stats.tokens}{' '}
          {t('lab.tokensApprox').toLowerCase()}
        </div>
      </div>
    </div>
  )
}

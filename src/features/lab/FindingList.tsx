import { useState } from 'react'
import { Link } from '@/app/router.tsx'
import type { Category, Finding, Severity } from '@/engine/analyzer/index.ts'
import { useI18n } from '@/i18n/index.tsx'
import type { DictKey } from '@/i18n/en.ts'
import { cx } from '@/lib/cx.ts'
import { Icon, type IconName } from '@/ui/Icon.tsx'
import { Badge, type BadgeTone } from '@/ui/primitives.tsx'

const SEVERITY_TONE: Record<Severity, BadgeTone> = {
  critical: 'err',
  high: 'err',
  medium: 'warn',
  low: 'accent',
  info: 'info',
}

const SEVERITY_ICON: Record<Severity, IconName> = {
  critical: 'alert',
  high: 'alert',
  medium: 'alertCircle',
  low: 'info',
  info: 'info',
}

const CATEGORY_ICON: Record<Category, IconName> = {
  clarity: 'target',
  context: 'layers',
  structure: 'grid',
  output: 'code',
  examples: 'copy',
  reasoning: 'brain',
  safety: 'shield',
  efficiency: 'zap',
  model: 'chip',
}

function FindingRow({ finding }: { finding: Finding }) {
  const { locale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const severityKey = `lab.severity.${finding.severity}` as DictKey
  const categoryKey = `lab.category.${finding.category}` as DictKey

  return (
    <li className="border-b border-line last:border-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent-soft/40"
      >
        <Icon
          name={SEVERITY_ICON[finding.severity]}
          size={17}
          className={cx(
            'mt-0.5 shrink-0',
            finding.severity === 'critical' || finding.severity === 'high'
              ? 'text-err'
              : finding.severity === 'medium'
                ? 'text-warn'
                : 'text-subtle',
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{finding.title[locale]}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={SEVERITY_TONE[finding.severity]}>{t(severityKey)}</Badge>
            <Badge>
              <Icon name={CATEGORY_ICON[finding.category]} size={11} />
              {t(categoryKey)}
            </Badge>
          </span>
        </span>
        <Icon
          name="chevronDown"
          size={16}
          className={cx('mt-1 shrink-0 text-subtle transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="animate-fade space-y-3 px-4 pb-4 pl-[3.25rem] text-sm">
          <div>
            <div className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
              {t('lab.why')}
            </div>
            <p className="text-pretty text-muted">{finding.why[locale]}</p>
          </div>
          <div>
            <div className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
              {t('lab.fix')}
            </div>
            <p className="text-pretty text-muted">{finding.fix[locale]}</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {finding.lessonId && (
              <Link
                to={`/learn/${finding.lessonId}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
              >
                <Icon name="book" size={13} />
                {t('lab.learnMore')}
              </Link>
            )}
            {finding.patternId && (
              <Link
                to={`/patterns?p=${finding.patternId}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
              >
                <Icon name="grid" size={13} />
                {t('nav.patterns')}
              </Link>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

export function FindingList({ findings }: { findings: readonly Finding[] }) {
  const { t } = useI18n()

  if (findings.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-line bg-ok-soft px-4 py-5 text-sm">
        <Icon name="check" size={18} className="shrink-0 text-ok" />
        <span>{t('lab.noIssues')}</span>
      </div>
    )
  }

  return (
    <ul className="overflow-hidden rounded-card border border-line bg-surface">
      {findings.map((finding) => (
        <FindingRow key={finding.ruleId} finding={finding} />
      ))}
    </ul>
  )
}

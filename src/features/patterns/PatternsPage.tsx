import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useRouter } from '@/app/router.tsx'
import { loadPatterns } from '@/content/index.ts'
import type { Pattern, PatternCategory } from '@/content/types.ts'
import { useContent } from '@/content/useContent.ts'
import { useI18n } from '@/i18n/index.tsx'
import { cx } from '@/lib/cx.ts'
import { Icon } from '@/ui/Icon.tsx'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  inputClass,
  Page,
  PageHeader,
  RouteFallback,
} from '@/ui/primitives.tsx'

const CATEGORY_LABEL: Record<PatternCategory, { en: string; ru: string }> = {
  framing: { en: 'Framing', ru: 'Постановка' },
  structure: { en: 'Structure', ru: 'Структура' },
  examples: { en: 'Examples', ru: 'Примеры' },
  reasoning: { en: 'Reasoning', ru: 'Рассуждение' },
  output: { en: 'Output', ru: 'Вывод' },
  reliability: { en: 'Reliability', ru: 'Надёжность' },
  workflow: { en: 'Workflow', ru: 'Процесс' },
  efficiency: { en: 'Efficiency', ru: 'Экономия' },
}

const LEVEL_TONE = { beginner: 'ok', intermediate: 'accent', advanced: 'warn' } as const

function PatternDetail({ pattern, onClose }: { pattern: Pattern; onClose: () => void }) {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const copy = () => {
    void navigator.clipboard.writeText(pattern.template).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  const openInLab = () => {
    // The Lab reads its initial text from session storage rather than the URL:
    // a multi-line template does not belong in a query string.
    try {
      sessionStorage.setItem('pg:lab-seed', pattern.template)
    } catch {
      /* private mode — the Lab simply opens empty */
    }
    navigate('/lab')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={pattern.name}
        className="h-full w-full max-w-xl animate-fade overflow-y-auto border-l border-line bg-surface p-6 shadow-card sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="accent">{CATEGORY_LABEL[pattern.category][locale]}</Badge>
              <Badge tone={LEVEL_TONE[pattern.level]}>{pattern.level}</Badge>
            </div>
            <h2 className="text-balance text-2xl font-semibold tracking-tight">{pattern.name}</h2>
            <p className="mt-2 text-pretty text-muted">{pattern.summary}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="shrink-0 rounded-field p-1.5 text-subtle transition-colors hover:bg-accent-soft hover:text-fg"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <section className="mb-6">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ok">
            <Icon name="check" size={15} />
            {t('patterns.whenToUse')}
          </h3>
          <ul className="space-y-1.5 pl-5 text-sm text-muted [&>li]:list-disc">
            {pattern.whenToUse.map((item, index) => (
              <li key={index} className="text-pretty">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-err">
            <Icon name="x" size={15} />
            {t('patterns.whenNotToUse')}
          </h3>
          <ul className="space-y-1.5 pl-5 text-sm text-muted [&>li]:list-disc">
            {pattern.whenNotToUse.map((item, index) => (
              <li key={index} className="text-pretty">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{t('patterns.template')}</h3>
            <div className="flex gap-1.5">
              <Button size="sm" icon={copied ? 'check' : 'copy'} onClick={copy}>
                {copied ? t('common.copied') : t('patterns.copyTemplate')}
              </Button>
              <Button size="sm" variant="primary" icon="flask" onClick={openInLab}>
                {t('patterns.openInLab')}
              </Button>
            </div>
          </div>
          <pre className="editor-type overflow-x-auto rounded-card border border-line bg-sunken p-4">
            {pattern.template}
          </pre>
        </section>

        {pattern.evidence && (
          <section className="mb-6">
            <h3 className="mb-2 text-sm font-semibold">{t('patterns.evidence')}</h3>
            <p className="text-pretty text-sm text-muted">{pattern.evidence}</p>
            {pattern.evidenceUrl && (
              <a
                href={pattern.evidenceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                {t('models.docs')}
                <Icon name="external" size={12} />
              </a>
            )}
          </section>
        )}

        <section className="flex flex-wrap gap-1.5">
          {pattern.models.map((family) => (
            <Badge key={family}>{family}</Badge>
          ))}
        </section>
      </div>
    </div>
  )
}

export default function PatternsPage() {
  const { locale, t } = useI18n()
  const { search } = useRouter()
  const navigate = useNavigate()
  const patterns = useContent(loadPatterns)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PatternCategory | 'all'>('all')
  const selectedId = search.get('p')

  const filtered = useMemo(() => {
    if (patterns.status !== 'ready') return []
    const needle = query.trim().toLowerCase()
    return patterns.data.filter((pattern) => {
      if (category !== 'all' && pattern.category !== category) return false
      if (!needle) return true
      const haystack = `${pattern.name} ${pattern.summary} ${pattern.tags.join(' ')} ${pattern.id}`
      return haystack.toLowerCase().includes(needle)
    })
  }, [patterns, query, category])

  const selected = useMemo(
    () =>
      patterns.status === 'ready'
        ? patterns.data.find((pattern) => pattern.id === selectedId)
        : undefined,
    [patterns, selectedId],
  )

  if (patterns.status === 'loading') return <RouteFallback />
  if (patterns.status === 'error') {
    return (
      <Page>
        <EmptyState
          icon="wifiOff"
          title={t('common.error')}
          body={patterns.error.message}
          action={
            <Button icon="refresh" onClick={() => window.location.reload()}>
              {t('common.retry')}
            </Button>
          }
        />
      </Page>
    )
  }

  const categories = [...new Set(patterns.data.map((pattern) => pattern.category))]

  return (
    <Page>
      <PageHeader
        eyebrow={t('nav.patterns')}
        title={t('patterns.title')}
        subtitle={t('patterns.subtitle')}
      />

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('patterns.searchPlaceholder')}
            aria-label={t('common.search')}
            className={`${inputClass} pl-9`}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={cx(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              category === 'all'
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line text-muted hover:border-line-strong',
            )}
          >
            {t('common.all')}
          </button>
          {categories.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              className={cx(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                category === id
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-muted hover:border-line-strong',
              )}
            >
              {CATEGORY_LABEL[id][locale]}
            </button>
          ))}
        </div>

        <div className="text-xs text-subtle tabular-nums">
          {t('patterns.resultCount', { n: filtered.length, total: patterns.data.length })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="search" title={t('patterns.noResults')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pattern) => (
            <Card
              key={pattern.id}
              interactive
              className="cursor-pointer"
              onClick={() => navigate(`/patterns?p=${pattern.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/patterns?p=${pattern.id}`)
                }
              }}
            >
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <Badge tone="accent">{CATEGORY_LABEL[pattern.category][locale]}</Badge>
                <Badge tone={LEVEL_TONE[pattern.level]}>{pattern.level}</Badge>
              </div>
              <h3 className="mb-1.5 text-balance font-semibold">{pattern.name}</h3>
              <p className="text-pretty text-sm text-muted">{pattern.summary}</p>
            </Card>
          ))}
        </div>
      )}

      {selected && <PatternDetail pattern={selected} onClose={() => navigate('/patterns')} />}
    </Page>
  )
}

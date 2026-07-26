import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { analyze, warmUp } from '@/engine/analyzer/index.ts'
import { diffWords, improve, type ImproveResult } from '@/engine/improve.ts'
import { allProfiles, type ModelFamilyId } from '@/engine/models.ts'
import { useI18n } from '@/i18n/index.tsx'
import { cx } from '@/lib/cx.ts'
import { usePrefs } from '@/store/prefs.ts'
import { useProgress } from '@/store/progress.ts'
import { Icon } from '@/ui/Icon.tsx'
import { useCopy } from '@/ui/useCopy.ts'
import { Badge, Button, Card, Page, PageHeader, Section } from '@/ui/primitives.tsx'
import { FindingList } from './FindingList.tsx'
import { PromptEditor } from './PromptEditor.tsx'
import { RunPanel } from './RunPanel.tsx'
import { SAMPLES } from './samples.ts'
import { ScoreDial } from './ScoreDial.tsx'

const PROFILES = allProfiles()

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-field bg-sunken px-3 py-2">
      <div className="text-[0.625rem] uppercase tracking-[0.12em] text-subtle">{label}</div>
      <div className="mt-0.5 text-sm font-medium tabular-nums">{value}</div>
    </div>
  )
}

function ImprovePanel({
  result,
  original,
  onApply,
  onClose,
}: {
  result: ImproveResult
  original: string
  onApply: () => void
  onClose: () => void
}) {
  const { locale, t } = useI18n()
  const { copied, copy } = useCopy()
  const [showDiff, setShowDiff] = useState(false)
  const chunks = useMemo(
    () => (showDiff ? diffWords(original, result.text) : []),
    [showDiff, original, result.text],
  )

  return (
    <Card className="animate-rise">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{t('lab.improved')}</h3>
        <div className="flex items-center gap-1.5">
          <Button size="sm" icon="layers" onClick={() => setShowDiff((value) => !value)}>
            {t('lab.diff')}
          </Button>
          <Button size="sm" icon={copied ? 'check' : 'copy'} onClick={() => copy(result.text)}>
            {copied ? t('common.copied') : t('common.copy')}
          </Button>
          <Button size="sm" variant="primary" icon="check" onClick={onApply}>
            {t('lab.apply')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon="x"
            onClick={onClose}
            aria-label={t('common.close')}
          />
        </div>
      </div>

      <p className="mb-4 text-sm text-muted">{t('lab.improveNote')}</p>

      {showDiff ? (
        <pre className="editor-type max-h-96 overflow-auto rounded-field bg-sunken p-4">
          {chunks.map((chunk, index) =>
            chunk.op === 'same' ? (
              <span key={index}>{chunk.text}</span>
            ) : (
              <span
                key={index}
                className={cx(
                  'rounded-[3px]',
                  chunk.op === 'add' ? 'bg-ok-soft text-ok' : 'bg-err-soft text-err line-through',
                )}
              >
                {chunk.text}
              </span>
            ),
          )}
        </pre>
      ) : (
        <pre className="editor-type max-h-96 overflow-auto rounded-field bg-sunken p-4">
          {result.text}
        </pre>
      )}

      {result.steps.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {result.steps.map((step, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted">
              <Icon name="check" size={15} className="mt-0.5 shrink-0 text-ok" />
              {step.label[locale]}
            </li>
          ))}
        </ul>
      )}

      {result.todos.length > 0 && (
        <div className="mt-5 rounded-field border border-line bg-sunken p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Icon name="target" size={15} className="text-warn" />
            {t('learn.requirements')}
          </div>
          <ul className="space-y-2.5">
            {result.todos.map((todo) => (
              <li key={todo.ruleId} className="text-sm">
                <div className="text-fg">{todo.label[locale]}</div>
                <div className="mt-0.5 font-mono text-xs text-subtle">{todo.example[locale]}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

export default function LabPage() {
  const { locale, t } = useI18n()
  const targetModel = usePrefs((s) => s.targetModel)
  const setTargetModel = usePrefs((s) => s.setTargetModel)
  const recordAnalysis = useProgress((s) => s.recordAnalysis)

  // The pattern library hands templates over through session storage rather
  // than the URL, because a multi-line template does not belong in a query
  // string. The seed is consumed once so a reload does not resurrect it.
  const [text, setText] = useState(() => {
    try {
      const seed = sessionStorage.getItem('pg:lab-seed')
      if (seed) sessionStorage.removeItem('pg:lab-seed')
      return seed ?? ''
    } catch {
      return ''
    }
  })
  const [highlight, setHighlight] = useState(true)
  const [improved, setImproved] = useState<ImproveResult | null>(null)
  const { copied, copy } = useCopy()

  // Analysis runs on a deferred copy of the text so typing never waits on it,
  // even though a full pass is already sub-millisecond.
  const deferredText = useDeferredValue(text)
  const result = useMemo(() => analyze(deferredText, targetModel), [deferredText, targetModel])

  // Pay the one-off pattern-compilation cost now rather than on the user's
  // first keystroke. `requestIdleCallback` where it exists, so it never
  // competes with the first paint.
  useEffect(() => {
    const idle =
      window.requestIdleCallback?.bind(window) ?? ((fn: () => void) => setTimeout(fn, 200))
    const handle = idle(() => warmUp())
    return () => {
      if (window.cancelIdleCallback && typeof handle === 'number') window.cancelIdleCallback(handle)
    }
  }, [])

  // One XP-bearing analysis per meaningful edit, not one per keystroke.
  const recordTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (deferredText.trim().length < 20) return
    if (recordTimer.current) clearTimeout(recordTimer.current)
    recordTimer.current = setTimeout(() => recordAnalysis(result.score), 2500)
    return () => {
      if (recordTimer.current) clearTimeout(recordTimer.current)
    }
  }, [deferredText, result.score, recordAnalysis])

  const loadSample = (key: keyof typeof SAMPLES) => {
    setText(SAMPLES[key][locale])
    setImproved(null)
  }

  const runImprove = () => setImproved(improve(text, targetModel, locale))

  const applyImproved = () => {
    if (!improved) return
    setText(improved.text)
    setImproved(null)
  }

  const hasText = text.trim().length > 0

  return (
    <Page>
      <PageHeader
        eyebrow={t('nav.lab')}
        title={t('lab.title')}
        subtitle={t('lab.subtitle')}
        actions={
          <Button
            size="sm"
            icon={copied ? 'check' : 'copy'}
            onClick={() => copy(text)}
            disabled={!hasText}
          >
            {copied ? t('common.copied') : t('common.copy')}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">{t('lab.targetModel')}</span>
              <select
                value={targetModel}
                onChange={(event) => setTargetModel(event.target.value as ModelFamilyId)}
                className="h-8 rounded-field border border-line bg-sunken px-2 text-sm"
              >
                {PROFILES.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={highlight}
                onChange={(event) => setHighlight(event.target.checked)}
                className="size-4 accent-[var(--accent)]"
              />
              {t('lab.highlight')}
            </label>
          </div>

          <PromptEditor
            value={text}
            onChange={(value) => {
              setText(value)
              setImproved(null)
            }}
            findings={result.findings}
            highlight={highlight}
            placeholder={t('lab.placeholder')}
            ariaLabel={t('lab.title')}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-subtle">{t('lab.samples')}:</span>
            <Button size="sm" variant="ghost" onClick={() => loadSample('vague')}>
              {t('lab.sampleVague')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => loadSample('wall')}>
              {t('lab.sampleWall')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => loadSample('good')}>
              {t('lab.sampleGood')}
            </Button>
            {hasText && (
              <Button
                size="sm"
                variant="ghost"
                icon="trash"
                className="ml-auto"
                onClick={() => {
                  setText('')
                  setImproved(null)
                }}
              >
                {t('common.clear')}
              </Button>
            )}
          </div>

          {improved && (
            <div className="mt-6">
              <ImprovePanel
                result={improved}
                original={text}
                onApply={applyImproved}
                onClose={() => setImproved(null)}
              />
            </div>
          )}

          <div className="mt-6">
            <RunPanel prompt={text} />
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <ScoreDial result={result} />
            {hasText && (
              <Button
                variant="primary"
                icon="wand"
                className="mt-5 w-full"
                onClick={runImprove}
                disabled={result.findings.length === 0}
              >
                {t('lab.improve')}
              </Button>
            )}
          </Card>

          <Section title={t('lab.issues')} className="mb-0">
            <FindingList findings={result.findings} />
          </Section>

          {hasText && (
            <Section title={t('lab.stats')} className="mb-0">
              <div className="grid grid-cols-2 gap-2">
                <Stat label={t('lab.words')} value={result.stats.words} />
                <Stat label={t('lab.chars')} value={result.stats.chars} />
                <Stat label={t('lab.tokensApprox')} value={`≈${result.stats.tokens}`} />
                <Stat label={t('lab.readability')} value={result.stats.readability} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(result.byCategory)
                  .filter(([, count]) => count > 0)
                  .map(([category, count]) => (
                    <Badge key={category} tone="neutral">
                      {t(`lab.category.${category}` as Parameters<typeof t>[0])} · {count}
                    </Badge>
                  ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </Page>
  )
}

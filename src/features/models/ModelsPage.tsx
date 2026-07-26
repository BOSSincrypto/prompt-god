import { useMemo, useState } from 'react'
import { loadModelNotes } from '@/content/index.ts'
import { allProfiles, VERIFIED_ON, type ModelFamilyId } from '@/engine/models.ts'
import { useContent } from '@/content/useContent.ts'
import { useI18n } from '@/i18n/index.tsx'
import { cx } from '@/lib/cx.ts'
import { Icon } from '@/ui/Icon.tsx'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Page,
  PageHeader,
  RouteFallback,
} from '@/ui/primitives.tsx'

const PROFILES = new Map(allProfiles().map((profile) => [profile.id, profile]))

function formatContext(tokens: number): string {
  if (tokens >= 1_000_000)
    return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 2)}M`
  return `${Math.round(tokens / 1000)}K`
}

function Yes({ value }: { value: boolean }) {
  return (
    <Icon
      name={value ? 'check' : 'minus'}
      size={15}
      className={value ? 'text-ok' : 'text-subtle'}
      label={String(value)}
    />
  )
}

export default function ModelsPage() {
  const { t } = useI18n()
  const notes = useContent(loadModelNotes)
  const [expanded, setExpanded] = useState<ModelFamilyId | null>(null)

  const rows = useMemo(() => allProfiles().filter((profile) => profile.id !== 'generic'), [])

  if (notes.status === 'loading') return <RouteFallback />
  if (notes.status === 'error') {
    return (
      <Page>
        <EmptyState
          icon="wifiOff"
          title={t('common.error')}
          body={notes.error.message}
          action={
            <Button icon="refresh" onClick={() => window.location.reload()}>
              {t('common.retry')}
            </Button>
          }
        />
      </Page>
    )
  }

  const noteFor = new Map(notes.data.map((note) => [note.family, note]))

  return (
    <Page>
      <PageHeader
        eyebrow={t('nav.models')}
        title={t('models.title')}
        subtitle={t('models.subtitle')}
      />

      <div className="mb-8 flex items-start gap-2.5 rounded-card border border-line bg-warn-soft px-4 py-3 text-sm text-warn">
        <Icon name="clock" size={16} className="mt-0.5 shrink-0" />
        <span className="text-pretty">{t('models.disclaimer', { date: VERIFIED_ON })}</span>
      </div>

      {/* The comparison table is the fastest way to answer "what changes if I
          switch?", so it leads; the prose notes expand underneath. */}
      <div className="mb-10 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="py-2.5 pr-4 font-medium">{t('models.family')}</th>
              <th className="px-3 py-2.5 font-medium">{t('models.context')}</th>
              <th className="px-3 py-2.5 font-medium">{t('models.reasoning')}</th>
              <th className="px-3 py-2.5 font-medium">{t('models.structured')}</th>
              <th className="px-3 py-2.5 font-medium">Prefill</th>
              <th className="px-3 py-2.5 font-medium">temperature</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((profile) => (
              <tr key={profile.id} className="border-b border-line last:border-0">
                <td className="py-3 pr-4">
                  <div className="font-medium">{profile.label}</div>
                  <div className="text-xs text-subtle">{profile.vendor}</div>
                </td>
                <td className="px-3 py-3 tabular-nums">
                  {formatContext(profile.contextTokens)}
                  {!profile.contextVerified && (
                    <span className="ml-1 text-subtle" title="not verified">
                      ?
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <Yes value={profile.internalReasoning} />
                </td>
                <td className="px-3 py-3">
                  <Yes value={profile.structuredOutput} />
                </td>
                <td className="px-3 py-3">
                  <Yes value={profile.prefillSupported} />
                </td>
                <td className="px-3 py-3">
                  {profile.samplingParamsFixed ? (
                    <Badge tone="warn">fixed</Badge>
                  ) : (
                    <Badge tone="ok">free</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        {rows.map((profile) => {
          const note = noteFor.get(profile.id)
          if (!note) return null
          const open = expanded === profile.id
          return (
            <Card key={profile.id} padded={false}>
              <button
                type="button"
                onClick={() => setExpanded(open ? null : profile.id)}
                aria-expanded={open}
                className="flex w-full items-start gap-3 p-5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">{profile.label}</h2>
                    <span className="text-xs text-subtle">{profile.vendor}</span>
                  </div>
                  <p className="text-pretty text-sm text-muted">{note.headline}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {note.lineup.map((model) => (
                      <Badge key={model} className="font-mono">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Icon
                  name="chevronDown"
                  size={17}
                  className={cx(
                    'mt-1 shrink-0 text-subtle transition-transform',
                    open && 'rotate-180',
                  )}
                />
              </button>

              {open && (
                <div className="animate-fade space-y-6 border-t border-line p-5">
                  <section>
                    <h3 className="mb-2 text-sm font-semibold">{t('models.quirks')}</h3>
                    <ul className="space-y-3">
                      {note.quirks.map((quirk, index) => (
                        <li key={index}>
                          <div className="text-sm font-medium">{quirk.title}</div>
                          <p className="mt-0.5 text-pretty text-sm text-muted">{quirk.body}</p>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <section>
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ok">
                        <Icon name="check" size={14} />
                        {t('models.doThis')}
                      </h3>
                      <ul className="space-y-1.5 pl-5 text-sm text-muted [&>li]:list-disc">
                        {note.doThis.map((item, index) => (
                          <li key={index} className="text-pretty">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-err">
                        <Icon name="x" size={14} />
                        {t('models.notThis')}
                      </h3>
                      <ul className="space-y-1.5 pl-5 text-sm text-muted [&>li]:list-disc">
                        {note.avoid.map((item, index) => (
                          <li key={index} className="text-pretty">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  {PROFILES.get(profile.id)?.docsUrl && (
                    <a
                      href={PROFILES.get(profile.id)?.docsUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                    >
                      {t('models.docs')}
                      <Icon name="external" size={13} />
                    </a>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </Page>
  )
}

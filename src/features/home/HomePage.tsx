import { useEffect, useState } from 'react'
import { Link } from '@/app/router.tsx'
import { RULE_COUNT } from '@/engine/analyzer/index.ts'
import { useI18n } from '@/i18n/index.tsx'
import { levelFromXp, useProgress } from '@/store/progress.ts'
import { Icon, type IconName } from '@/ui/Icon.tsx'
import { Badge, Button, Card, Page, ProgressBar } from '@/ui/primitives.tsx'

/**
 * `beforeinstallprompt` is Chromium-only and absent from the DOM lib, so the
 * one method the install button needs is declared here rather than globally.
 */
type InstallPromptEvent = Event & { prompt: () => Promise<unknown> }

const LESSON_COUNT = 18
const PATTERN_COUNT = 30

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs text-subtle">{label}</div>
    </div>
  )
}

function Feature({
  icon,
  title,
  body,
  to,
  cta,
}: {
  icon: IconName
  title: string
  body: string
  to: string
  cta: string
}) {
  return (
    <Card interactive className="flex flex-col">
      <div className="mb-3 grid size-10 place-items-center rounded-field bg-accent-soft text-accent">
        <Icon name={icon} size={19} />
      </div>
      <h3 className="mb-1.5 font-semibold">{title}</h3>
      <p className="mb-4 flex-1 text-pretty text-sm text-muted">{body}</p>
      <Link
        to={to}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
      >
        {cta}
        <Icon name="arrowRight" size={15} />
      </Link>
    </Card>
  )
}

function ContinueCard() {
  const { t } = useI18n()
  const hydrated = useProgress((s) => s.hydrated)
  const xp = useProgress((s) => s.xp)
  const completed = useProgress((s) => s.completedLessons)
  const streak = useProgress((s) => s.streak)

  if (!hydrated || completed.length === 0) return null

  const level = levelFromXp(xp)
  const pct = Math.round((completed.length / LESSON_COUNT) * 100)

  return (
    <Card className="mb-10 animate-rise">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{t('home.continueLearning')}</div>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone="accent">{t('progress.level', { n: level })}</Badge>
            <Badge>{t('progress.xp', { n: xp })}</Badge>
            {streak > 0 && (
              <Badge tone="warn">
                <Icon name="flame" size={11} />
                {streak}
              </Badge>
            )}
          </div>
        </div>
        <Link to="/learn">
          <Button variant="primary" size="sm" iconRight="arrowRight">
            {t('common.continue')}
          </Button>
        </Link>
      </div>
      <ProgressBar value={completed.length} max={LESSON_COUNT} label={t('progress.completion')} />
      <div className="mt-2 text-xs text-subtle">
        {completed.length}/{LESSON_COUNT} · {pct}%
      </div>
    </Card>
  )
}

export default function HomePage() {
  const { t } = useI18n()
  const hydrate = useProgress((s) => s.hydrate)
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const install = () => {
    void installEvent?.prompt()
    setInstallEvent(null)
  }

  return (
    <Page>
      <section className="py-8 sm:py-14">
        <div className="max-w-3xl animate-rise">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-ok" />
            {t('home.statOffline')} · {RULE_COUNT} {t('home.statChecks')}
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            <span className="text-gradient">{t('home.heroLead')}</span>
          </h1>

          <p className="mt-5 max-w-2xl text-pretty text-lg text-muted">{t('home.heroBody')}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/learn">
              <Button variant="primary" size="lg" iconRight="arrowRight">
                {t('home.ctaPrimary')}
              </Button>
            </Link>
            <Link to="/lab">
              <Button size="lg" icon="flask">
                {t('home.ctaSecondary')}
              </Button>
            </Link>
            {installEvent && (
              <Button size="lg" variant="ghost" icon="download" onClick={install}>
                {t('pwa.install')}
              </Button>
            )}
          </div>

          <div className="mt-12 grid max-w-lg grid-cols-3 gap-6">
            <Stat value={String(LESSON_COUNT)} label={t('home.statLessons')} />
            <Stat value={String(PATTERN_COUNT)} label={t('home.statPatterns')} />
            <Stat value={String(RULE_COUNT)} label={t('home.statChecks')} />
          </div>
        </div>
      </section>

      <ContinueCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Feature
          icon="book"
          title={t('home.featLearnTitle')}
          body={t('home.featLearnBody')}
          to="/learn"
          cta={t('nav.learn')}
        />
        <Feature
          icon="flask"
          title={t('home.featLabTitle')}
          body={t('home.featLabBody')}
          to="/lab"
          cta={t('nav.lab')}
        />
        <Feature
          icon="grid"
          title={t('home.featPatternsTitle')}
          body={t('home.featPatternsBody')}
          to="/patterns"
          cta={t('nav.patterns')}
        />
        <Feature
          icon="shield"
          title={t('home.featPrivacyTitle')}
          body={t('home.featPrivacyBody')}
          to="/settings"
          cta={t('nav.settings')}
        />
      </div>

      <p className="mt-8 flex items-start gap-2 text-sm text-subtle">
        <Icon name="key" size={15} className="mt-0.5 shrink-0" />
        {t('home.byokNote')}
      </p>
    </Page>
  )
}

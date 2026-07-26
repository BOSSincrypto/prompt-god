import { Link } from '@/app/router.tsx'
import { loadCourse, trackProgress } from '@/content/index.ts'
import { useContent } from '@/content/useContent.ts'
import { useI18n } from '@/i18n/index.tsx'
import { cx } from '@/lib/cx.ts'
import { useProgress } from '@/store/progress.ts'
import { Icon } from '@/ui/Icon.tsx'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Page,
  PageHeader,
  ProgressBar,
  RouteFallback,
} from '@/ui/primitives.tsx'

export default function LearnPage() {
  const { t } = useI18n()
  const course = useContent(loadCourse)
  const completedLessons = useProgress((s) => s.completedLessons)

  if (course.status === 'loading') return <RouteFallback />
  if (course.status === 'error') {
    return (
      <Page>
        <EmptyState
          icon="wifiOff"
          title={t('common.error')}
          body={course.error.message}
          action={
            <Button icon="refresh" onClick={() => window.location.reload()}>
              {t('common.retry')}
            </Button>
          }
        />
      </Page>
    )
  }

  const tracks = trackProgress(course.data, completedLessons)
  const trackTitle = new Map(course.data.tracks.map((track) => [track.id, track.title]))

  return (
    <Page>
      <PageHeader
        eyebrow={t('nav.learn')}
        title={t('learn.title')}
        subtitle={t('learn.subtitle')}
      />

      <div className="space-y-4">
        {tracks.map(({ track, lessons, completed, total, locked, nextLessonId }) => {
          const done = completed === total
          return (
            <Card key={track.id} className={cx(locked && 'opacity-60')}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">{track.title}</h2>
                    {done && (
                      <Badge tone="ok">
                        <Icon name="check" size={11} />
                        {t('learn.completed')}
                      </Badge>
                    )}
                    {locked && (
                      <Badge>
                        <Icon name="lock" size={11} />
                        {t('learn.locked')}
                      </Badge>
                    )}
                    {!locked && !done && completed > 0 && (
                      <Badge tone="accent">{t('learn.inProgress')}</Badge>
                    )}
                  </div>
                  <p className="text-pretty text-sm text-muted">{track.goal}</p>
                  {locked && track.requires && (
                    <p className="mt-2 text-xs text-subtle">
                      {t('learn.unlockHint', { name: trackTitle.get(track.requires) ?? '' })}
                    </p>
                  )}
                </div>

                {!locked && nextLessonId && (
                  <Link to={`/learn/${nextLessonId}`}>
                    <Button
                      variant={done ? 'secondary' : 'primary'}
                      size="sm"
                      iconRight="arrowRight"
                    >
                      {done
                        ? t('learn.reviewTrack')
                        : completed > 0
                          ? t('learn.continueTrack')
                          : t('learn.startTrack')}
                    </Button>
                  </Link>
                )}
              </div>

              <div className="mt-4">
                <ProgressBar
                  value={completed}
                  max={total}
                  tone={done ? 'ok' : 'accent'}
                  label={track.title}
                />
                <div className="mt-1.5 text-xs text-subtle tabular-nums">
                  {completed}/{total} · {t('learn.lessons', { n: total })}
                </div>
              </div>

              {!locked && (
                <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
                  {lessons.map((lesson) => {
                    const isDone = completedLessons.includes(lesson.id)
                    return (
                      <li key={lesson.id}>
                        <Link
                          to={`/learn/${lesson.id}`}
                          className="flex items-center gap-2.5 rounded-field px-2.5 py-2 text-sm transition-colors hover:bg-accent-soft"
                        >
                          <Icon
                            name={isDone ? 'check' : 'chevronRight'}
                            size={15}
                            className={cx('shrink-0', isDone ? 'text-ok' : 'text-subtle')}
                          />
                          <span className={cx('min-w-0 flex-1 truncate', isDone && 'text-muted')}>
                            {lesson.title}
                          </span>
                          <span className="shrink-0 text-xs text-subtle tabular-nums">
                            {t('learn.minutes', { n: lesson.minutes })}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          )
        })}
      </div>
    </Page>
  )
}

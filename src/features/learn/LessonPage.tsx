import { useEffect, useMemo } from 'react'
import { Link, useRouter } from '@/app/router.tsx'
import { loadCourse, nextLessonId } from '@/content/index.ts'
import { useContent } from '@/content/useContent.ts'
import { useI18n } from '@/i18n/index.tsx'
import { useProgress } from '@/store/progress.ts'
import { Icon } from '@/ui/Icon.tsx'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  Page,
  RouteFallback,
  Section,
} from '@/ui/primitives.tsx'
import { Blocks } from './Blocks.tsx'
import { ExerciseCard } from './ExerciseCard.tsx'

export default function LessonPage() {
  const { locale, t } = useI18n()
  const { params, navigate } = useRouter()
  const lessonId = params['lessonId'] ?? ''
  const course = useContent(loadCourse)

  const hydrated = useProgress((s) => s.hydrated)
  const completeLesson = useProgress((s) => s.completeLesson)
  const completeTrack = useProgress((s) => s.completeTrack)
  const completedLessons = useProgress((s) => s.completedLessons)
  const seedCards = useProgress((s) => s.seedCards)

  const lesson = useMemo(
    () =>
      course.status === 'ready' ? course.data.lessons.find((l) => l.id === lessonId) : undefined,
    [course, lessonId],
  )

  // A lesson you have opened is a lesson you can be asked to recall later.
  useEffect(() => {
    if (lesson && hydrated) seedCards([lesson.id])
  }, [lesson, hydrated, seedCards])

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

  if (!lesson) {
    return (
      <Page>
        <EmptyState
          icon="book"
          title={t('learn.notFound')}
          action={
            <LinkButton to="/learn" icon="arrowLeft">
              {t('learn.backToCourse')}
            </LinkButton>
          }
        />
      </Page>
    )
  }

  const track = course.data.tracks.find((item) => item.id === lesson.trackId)
  const done = completedLessons.includes(lesson.id)
  const next = nextLessonId(course.data, lesson.id)

  const finish = () => {
    completeLesson(lesson.id, lesson.xp)
    // The track is finished only once this lesson counts as done, so check
    // against the set that includes it.
    if (track) {
      const after = new Set([...completedLessons, lesson.id])
      if (track.lessonIds.every((id) => after.has(id))) completeTrack(track.id)
    }
    if (next) navigate(`/learn/${next}`)
    else navigate('/learn')
  }

  return (
    <Page className="max-w-3xl">
      <Link
        to="/learn"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <Icon name="arrowLeft" size={15} />
        {t('learn.backToCourse')}
      </Link>

      <header className="mb-8 animate-rise">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {track && <Badge tone="accent">{track.title}</Badge>}
          <Badge>{t('learn.readingTime', { n: lesson.minutes })}</Badge>
          <Badge>{t('progress.xp', { n: lesson.xp })}</Badge>
          {done && (
            <Badge tone="ok">
              <Icon name="check" size={11} />
              {t('learn.completed')}
            </Badge>
          )}
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {lesson.title}
        </h1>
        <p className="mt-3 text-pretty text-lg text-muted">{lesson.summary}</p>
      </header>

      <Card className="mb-8 border-l-2 border-accent">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-accent">
          <Icon name="sparkles" size={15} />
          {t('learn.keyIdea')}
        </div>
        <p className="text-pretty leading-relaxed">{lesson.keyIdea}</p>
      </Card>

      <article>
        <Blocks blocks={lesson.blocks} />
      </article>

      <Card className="mt-8 border-l-2 border-warn">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-warn">
          <Icon name="alert" size={15} />
          {t('learn.pitfall')}
        </div>
        <p className="text-pretty leading-relaxed">{lesson.pitfall}</p>
      </Card>

      {lesson.patternIds && lesson.patternIds.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-subtle">{t('patterns.related')}:</span>
          {lesson.patternIds.map((patternId) => (
            <Link
              key={patternId}
              to={`/patterns?p=${patternId}`}
              className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {patternId}
            </Link>
          ))}
        </div>
      )}

      {lesson.exercises.length > 0 && (
        <Section title={t('learn.tryIt')} className="mt-12">
          <div className="space-y-4">
            {lesson.exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                total={lesson.exercises.length}
              />
            ))}
          </div>
        </Section>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <LinkButton to="/learn" icon="arrowLeft" variant="ghost">
          {t('learn.backToCourse')}
        </LinkButton>
        <Button variant="primary" iconRight="arrowRight" onClick={finish} lang={locale}>
          {next ? t('learn.nextLesson') : t('learn.finishTrack')}
        </Button>
      </div>
    </Page>
  )
}

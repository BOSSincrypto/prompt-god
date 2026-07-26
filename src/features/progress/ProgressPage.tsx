import { useMemo, useRef, useState } from 'react'
import { loadCourse } from '@/content/index.ts'
import { CONTENT_STATS } from '@/content/stats.ts'
import { useContent } from '@/content/useContent.ts'
import { useI18n } from '@/i18n/index.tsx'
import type { Locale } from '@/i18n/types.ts'
import { cx } from '@/lib/cx.ts'
import { wipeAllData } from '@/lib/storage.ts'
import {
  ACHIEVEMENTS,
  earnedAchievements,
  levelFromXp,
  today,
  useProgress,
  xpForLevel,
  type ProgressState,
  type ReviewGrade,
} from '@/store/progress.ts'
import { Icon, type IconName } from '@/ui/Icon.tsx'
import { Badge, Button, Card, Page, PageHeader, ProgressBar, Section } from '@/ui/primitives.tsx'

const ACHIEVEMENT_LABEL: Record<string, Record<Locale, string>> = {
  'first-lesson': { en: 'First lesson', ru: 'Первый урок' },
  'first-track': { en: 'First track finished', ru: 'Первый трек пройден' },
  'half-course': { en: 'Halfway', ru: 'Половина пути' },
  'whole-course': { en: 'Whole course', ru: 'Весь курс' },
  'streak-3': { en: '3-day streak', ru: 'Серия 3 дня' },
  'streak-7': { en: '7-day streak', ru: 'Серия 7 дней' },
  'streak-30': { en: '30-day streak', ru: 'Серия 30 дней' },
  'lab-10': { en: '10 prompts analyzed', ru: '10 разобранных промптов' },
  'lab-100': { en: '100 prompts analyzed', ru: '100 разобранных промптов' },
  'perfect-score': { en: 'A perfect 100', ru: 'Ровно 100' },
  reviewer: { en: '25 reviews', ru: '25 повторений' },
  'level-5': { en: 'Level 5', ru: 'Пятый уровень' },
}

const GRADE_KEYS = {
  again: 'progress.reviewAgain',
  hard: 'progress.reviewHard',
  good: 'progress.reviewGood',
  easy: 'progress.reviewEasy',
} as const

function ActivityStrip({ days }: { days: readonly number[] }) {
  const now = today()
  const active = new Set(days)
  // 17 weeks of 7 days reads as a familiar contribution strip and fits a phone.
  const cells = Array.from({ length: 119 }, (_, index) => now - 118 + index)

  return (
    <div className="flex flex-wrap gap-1" aria-hidden="true">
      {cells.map((day) => (
        <div
          key={day}
          className={cx('size-2.5 rounded-[3px]', active.has(day) ? 'bg-accent' : 'bg-sunken')}
        />
      ))}
    </div>
  )
}

function ReviewDeck({ titles }: { titles: Map<string, string> }) {
  const { t } = useI18n()
  const cards = useProgress((s) => s.cards)
  const gradeCard = useProgress((s) => s.gradeCard)
  const [revealed, setRevealed] = useState(false)
  const [graded, setGraded] = useState(0)

  const due = useMemo(() => {
    const day = today()
    return Object.values(cards)
      .filter((card) => card.due <= day && titles.has(card.id))
      .sort((a, b) => a.due - b.due)
  }, [cards, titles])

  const current = due[0]

  if (!current) {
    return (
      <Card>
        <p className="text-sm text-muted">
          {graded > 0 ? t('progress.reviewDone', { n: graded }) : t('progress.reviewNone')}
        </p>
      </Card>
    )
  }

  const grade = (value: ReviewGrade) => {
    gradeCard(current.id, value)
    setRevealed(false)
    setGraded((count) => count + 1)
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge tone="accent">{t('progress.reviewDue', { n: due.length })}</Badge>
      </div>

      <p className="mb-5 text-pretty text-lg">{titles.get(current.id)}</p>

      {revealed ? (
        <div className="flex flex-wrap gap-2">
          {(['again', 'hard', 'good', 'easy'] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={value === 'good' ? 'primary' : 'secondary'}
              onClick={() => grade(value)}
            >
              {t(GRADE_KEYS[value])}
            </Button>
          ))}
        </div>
      ) : (
        <Button icon="refresh" onClick={() => setRevealed(true)}>
          {t('progress.reviewShow')}
        </Button>
      )}
    </Card>
  )
}

export default function ProgressPage() {
  const { locale, t } = useI18n()
  const course = useContent(loadCourse)
  const fileRef = useRef<HTMLInputElement>(null)

  const replaceAll = useProgress((s) => s.replaceAll)
  const reset = useProgress((s) => s.reset)
  const state = useProgress()

  const titles = useMemo(() => {
    if (course.status !== 'ready') return new Map<string, string>()
    return new Map(course.data.lessons.map((lesson) => [lesson.id, lesson.keyIdea]))
  }, [course])

  const totalLessons =
    course.status === 'ready' ? course.data.lessons.length : CONTENT_STATS.lessons
  const level = levelFromXp(state.xp)
  const levelFloor = xpForLevel(level)
  const levelCeiling = xpForLevel(level + 1)
  const earned = new Set(earnedAchievements(state))
  const streakSafe = state.lastActiveDay === today()

  const exportData = () => {
    const snapshot: ProgressState = {
      xp: state.xp,
      completedLessons: state.completedLessons,
      completedTracks: state.completedTracks,
      passedExercises: state.passedExercises,
      cards: state.cards,
      streak: state.streak,
      bestStreak: state.bestStreak,
      lastActiveDay: state.lastActiveDay,
      activeDays: state.activeDays,
      promptsAnalyzed: state.promptsAnalyzed,
      bestScore: state.bestScore,
      reviewsDone: state.reviewsDone,
    }
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'prompt-god-progress.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importData = (file: File) => {
    void file.text().then((text) => {
      try {
        replaceAll(JSON.parse(text) as ProgressState)
      } catch {
        console.warn('[prompt-god] import failed: not valid progress JSON')
      }
    })
  }

  const wipe = () => {
    if (!confirm(t('progress.wipeConfirm'))) return
    void wipeAllData().then(() => void reset())
  }

  return (
    <Page>
      <PageHeader
        eyebrow={t('nav.progress')}
        title={t('progress.title')}
        subtitle={t('progress.subtitle')}
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-xs uppercase tracking-[0.12em] text-subtle">
            {t('progress.level', { n: level })}
          </div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{state.xp}</div>
          <div className="mb-3 text-xs text-subtle">{t('progress.xp', { n: state.xp })}</div>
          <ProgressBar value={state.xp - levelFloor} max={levelCeiling - levelFloor} />
          <div className="mt-1.5 text-xs text-subtle tabular-nums">
            {t('progress.xpToNext', { n: levelCeiling - state.xp, level: level + 1 })}
          </div>
        </Card>

        <Card>
          <div className="text-xs uppercase tracking-[0.12em] text-subtle">
            {t('progress.streak')}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">{state.streak}</span>
            <Icon name="flame" size={20} className={streakSafe ? 'text-warn' : 'text-subtle'} />
          </div>
          <div className="mb-3 text-xs text-subtle">
            {t('progress.bestStreak', { n: state.bestStreak })}
          </div>
          <p className="text-xs text-muted">
            {streakSafe ? t('progress.streakSafe') : t('progress.streakToday')}
          </p>
        </Card>

        <Card>
          <div className="text-xs uppercase tracking-[0.12em] text-subtle">
            {t('progress.completion')}
          </div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">
            {state.completedLessons.length}
            <span className="text-lg text-subtle">/{totalLessons}</span>
          </div>
          <div className="mb-3 text-xs text-subtle">
            {t('lab.issueCount', { n: state.promptsAnalyzed })}
          </div>
          <ProgressBar
            value={state.completedLessons.length}
            max={totalLessons}
            tone={state.completedLessons.length >= totalLessons ? 'ok' : 'accent'}
          />
        </Card>
      </div>

      <Section title={t('progress.review')} description={t('progress.reviewSubtitle')}>
        <ReviewDeck titles={titles} />
      </Section>

      <Section title={t('progress.activity')}>
        <Card>
          <ActivityStrip days={state.activeDays} />
        </Card>
      </Section>

      <Section
        title={t('progress.achievements')}
        description={t('progress.achievementsUnlocked', {
          n: earned.size,
          total: ACHIEVEMENTS.length,
        })}
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = earned.has(achievement.id)
            return (
              <div
                key={achievement.id}
                className={cx(
                  'flex items-center gap-3 rounded-card border px-4 py-3',
                  unlocked ? 'border-line bg-surface' : 'border-dashed border-line opacity-55',
                )}
              >
                <div
                  className={cx(
                    'grid size-9 shrink-0 place-items-center rounded-full',
                    unlocked ? 'bg-accent-soft text-accent' : 'bg-sunken text-subtle',
                  )}
                >
                  <Icon name={(unlocked ? achievement.icon : 'lock') as IconName} size={17} />
                </div>
                <span className="min-w-0 text-sm">
                  {ACHIEVEMENT_LABEL[achievement.id]?.[locale] ?? achievement.id}
                </span>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title={t('progress.exportTitle')}>
        <Card className="flex flex-wrap gap-2">
          <Button icon="download" onClick={exportData}>
            {t('progress.export')}
          </Button>
          <Button icon="upload" onClick={() => fileRef.current?.click()}>
            {t('progress.import')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) importData(file)
              event.target.value = ''
            }}
          />
          <Button variant="danger" icon="trash" className="ml-auto" onClick={wipe}>
            {t('progress.wipe')}
          </Button>
        </Card>
      </Section>
    </Page>
  )
}

import { useState } from 'react'
import { checkExercise, type ExerciseResult } from '@/content/checker.ts'
import type { Exercise } from '@/content/types.ts'
import { PromptEditor } from '@/features/lab/PromptEditor.tsx'
import { useT } from '@/i18n/index.tsx'
import { cx } from '@/lib/cx.ts'
import { usePrefs } from '@/store/prefs.ts'
import { useProgress } from '@/store/progress.ts'
import { Icon } from '@/ui/Icon.tsx'
import { Button, Card } from '@/ui/primitives.tsx'

const EXERCISE_XP = 15

export function ExerciseCard({
  exercise,
  index,
  total,
}: {
  exercise: Exercise
  index: number
  total: number
}) {
  const t = useT()
  const targetModel = usePrefs((s) => s.targetModel)
  const passExercise = useProgress((s) => s.passExercise)
  const alreadyPassed = useProgress((s) => s.passedExercises.includes(exercise.id))

  const [answer, setAnswer] = useState(exercise.starter ?? '')
  const [result, setResult] = useState<ExerciseResult | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  const check = () => {
    const outcome = checkExercise(exercise, answer, targetModel)
    setResult(outcome)
    if (outcome.passed) passExercise(exercise.id, EXERCISE_XP)
  }

  const passed = result?.passed ?? false

  return (
    <Card className="scroll-mt-20" id={exercise.id}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="target" size={16} className="text-accent" />
          <span className="text-sm font-medium">
            {t('learn.exerciseOf', { i: index + 1, n: total })}
          </span>
        </div>
        {(alreadyPassed || passed) && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ok">
            <Icon name="check" size={15} />
            {t('learn.passed')}
          </span>
        )}
      </div>

      <p className="mb-4 text-pretty leading-relaxed">{exercise.brief}</p>

      <label className="mb-1.5 block text-sm font-medium">{t('learn.yourAnswer')}</label>
      <PromptEditor
        value={answer}
        onChange={(value) => {
          setAnswer(value)
          setResult(null)
        }}
        findings={[]}
        highlight={false}
        ariaLabel={t('learn.yourAnswer')}
        minRows={7}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="primary"
          icon="check"
          onClick={check}
          disabled={answer.trim().length === 0}
        >
          {t('learn.check')}
        </Button>
        <Button variant="ghost" icon="info" onClick={() => setShowHint((value) => !value)}>
          {t('learn.hint')}
        </Button>
        <Button variant="ghost" icon="wand" onClick={() => setShowSolution((value) => !value)}>
          {t('learn.showSolution')}
        </Button>
      </div>

      {showHint && (
        <div className="mt-3 animate-fade rounded-field bg-info-soft px-3.5 py-3 text-sm">
          {exercise.hint}
        </div>
      )}

      {result && (
        <div className="mt-4 animate-fade">
          <div
            className={cx(
              'mb-2 flex items-center gap-2 text-sm font-medium',
              passed ? 'text-ok' : 'text-warn',
            )}
          >
            <Icon name={passed ? 'check' : 'alertCircle'} size={16} />
            {passed ? t('learn.passed') : t('learn.notYet')}
          </div>
          <div className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
            {t('learn.requirements')}
          </div>
          <ul className="space-y-1.5">
            {result.results.map((check, checkIndex) => (
              <li key={checkIndex} className="flex items-start gap-2 text-sm">
                <Icon
                  name={check.passed ? 'check' : 'x'}
                  size={15}
                  className={cx('mt-0.5 shrink-0', check.passed ? 'text-ok' : 'text-subtle')}
                />
                <span className={check.passed ? 'text-muted' : 'text-fg'}>{check.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSolution && (
        <div className="mt-4 animate-fade">
          <div className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
            {t('learn.solution')}
          </div>
          <pre className="editor-type overflow-x-auto rounded-field border border-line bg-sunken p-3.5">
            {exercise.solution}
          </pre>
          <p className="mt-2 text-xs text-subtle">{t('learn.solutionNote')}</p>
        </div>
      )}
    </Card>
  )
}

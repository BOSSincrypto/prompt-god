// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/build-content.mjs <authored.json>
import type { CourseContent } from './types.ts'

export const course: CourseContent = {
  tracks: [
    {
      id: 'foundations',
      title: 'Основы',
      goal: 'Превратить пожелание в спецификацию.',
      lessonIds: ['anatomy'],
    },
  ],
  lessons: [
    {
      id: 'anatomy',
      trackId: 'foundations',
      title: 'Анатомия промпта',
      summary: 'Пять частей и что ломается без каждой.',
      minutes: 6,
      xp: 50,
      keyIdea: 'Промпт — это спецификация, а не пожелание.',
      pitfall: 'Считать, что модель разделяет ваш контекст.',
      blocks: [
        {
          kind: 'p',
          text: 'В большинстве слабых промптов не хватает одних и тех же частей.',
        },
        {
          kind: 'compare',
          bad: 'Напиши про базы данных.',
          good: `# Задача
Напиши введение в индексы баз данных.

# Формат ответа
- Не более 300 слов.`,
        },
      ],
      exercises: [
        {
          id: 'anatomy-1',
          brief: 'Перепишите так, чтобы формат ответа был явным.',
          hint: 'Назовите контейнер и объём.',
          solution:
            'Проанализируй данные продаж за 2 квартал ниже. Верни markdown-таблицу с колонками месяц, выручка, дельта. После неё не более 150 слов комментария.',
          checks: [
            {
              kind: 'noFinding',
              ruleId: 'no-output-format',
              label: 'Формат ответа задан',
            },
            {
              kind: 'anyOf',
              patterns: ['(json|markdown|table|таблиц|список|bullet)', '(\\d+\\s*(words|слов))'],
              count: 1,
              label: 'Назван контейнер или объём',
            },
          ],
          starter: 'Analyse our Q2 sales and tell me what happened.',
        },
      ],
      patternIds: ['task-first'],
    },
  ],
}

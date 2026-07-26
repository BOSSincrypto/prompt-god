// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/build-content.mjs <authored.json>
import type { CourseContent } from './types.ts'

export const course: CourseContent = {
  tracks: [
    {
      id: 'foundations',
      title: 'Foundations',
      goal: 'Turn a wish into a spec.',
      lessonIds: ['anatomy'],
    },
  ],
  lessons: [
    {
      id: 'anatomy',
      trackId: 'foundations',
      title: 'The anatomy of a prompt',
      summary: 'Five parts, and what breaks without each.',
      minutes: 6,
      xp: 50,
      keyIdea: 'A prompt is a specification, not a wish.',
      pitfall: 'Assuming the model shares your context.',
      blocks: [
        {
          kind: 'p',
          text: 'Most weak prompts are missing the same parts.',
        },
        {
          kind: 'compare',
          bad: 'Write about databases.',
          good: `# Task
Write an introduction to database indexing.

# Output
- At most 300 words.`,
        },
      ],
      exercises: [
        {
          id: 'anatomy-1',
          brief: 'Rewrite so the output format is explicit.',
          hint: 'Name the container and a length.',
          solution:
            'Analyse the Q2 sales data below. Return a markdown table with columns month, revenue, delta. At most 150 words of commentary after it.',
          checks: [
            {
              kind: 'noFinding',
              ruleId: 'no-output-format',
              label: 'An output format is specified',
            },
            {
              kind: 'anyOf',
              patterns: ['(json|markdown|table|таблиц|список|bullet)', '(\\d+\\s*(words|слов))'],
              count: 1,
              label: 'Names a container or a length',
            },
          ],
          starter: 'Analyse our Q2 sales and tell me what happened.',
        },
      ],
      patternIds: ['task-first'],
    },
  ],
}

// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/build-content.mjs <authored.json>
import type { ModelNote } from './types.ts'

export const modelNotes: ModelNote[] = [
  {
    family: 'claude',
    lineup: ['claude-opus-5', 'claude-sonnet-5', 'claude-fable-5', 'claude-haiku-4-5'],
    headline: 'XML sections and adaptive thinking; prefill is gone.',
    strengths: ['Long context', 'Structured sections'],
    quirks: [
      {
        title: 'Prefill returns 400',
        body: 'Prefilling the final assistant turn is rejected on 4.6+ and all of Claude 5.',
      },
    ],
    doThis: ['Put long documents first'],
    avoid: ['Verification instructions on Opus 5'],
  },
]

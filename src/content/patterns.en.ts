// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/build-content.mjs <authored.json>
import type { Pattern } from './types.ts'

export const patterns: Pattern[] = [
  {
    id: 'task-first',
    name: 'Task first',
    category: 'framing',
    level: 'beginner',
    summary: 'Open with the operation, not the preamble.',
    whenToUse: [
      'The model keeps answering a nearby question',
      'A prompt has grown a long preamble',
    ],
    whenNotToUse: ['Long documents must come first for attention reasons'],
    template: `# Task
[[the single operation to perform]]

# Output
[[container and length]]`,
    models: ['generic'],
    related: ['output-contract'],
    tags: ['framing', 'clarity', 'structure'],
    evidence:
      'Vendor guidance is to state the operation explicitly rather than let the model infer it.',
  },
]

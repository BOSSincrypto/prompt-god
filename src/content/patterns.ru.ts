// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/build-content.mjs <authored.json>
import type { Pattern } from './types.ts'

export const patterns: Pattern[] = [
  {
    id: 'task-first',
    name: 'Сначала задача',
    category: 'framing',
    level: 'beginner',
    summary: 'Начинайте с операции, а не с преамбулы.',
    whenToUse: ['Модель отвечает на соседний вопрос', 'У промпта разросся длинный вступ'],
    whenNotToUse: ['Длинные документы должны идти первыми по соображениям внимания'],
    template: `# Task
[[the single operation to perform]]

# Output
[[container and length]]`,
    models: ['generic'],
    related: ['output-contract'],
    tags: ['framing', 'clarity', 'structure'],
    evidence: 'Рекомендация вендоров — называть операцию явно, а не давать модели её выводить.',
  },
]

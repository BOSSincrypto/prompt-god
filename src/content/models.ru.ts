// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/build-content.mjs <authored.json>
import type { ModelNote } from './types.ts'

export const modelNotes: ModelNote[] = [
  {
    family: 'claude',
    lineup: ['claude-opus-5', 'claude-sonnet-5', 'claude-fable-5', 'claude-haiku-4-5'],
    headline: 'XML-секции и адаптивное рассуждение; префилл исчез.',
    strengths: ['Длинный контекст', 'Структурные секции'],
    quirks: [
      {
        title: 'Префилл возвращает 400',
        body: 'Префилл последнего хода ассистента отклоняется на 4.6+ и всех Claude 5.',
      },
    ],
    doThis: ['Размещайте длинные документы первыми'],
    avoid: ['Инструкции о проверке для Opus 5'],
  },
]

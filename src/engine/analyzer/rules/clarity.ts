import { lex, lexBoth } from '../lexicon.ts'
import { countMatches, findSpans, words } from '../text.ts'
import type { Rule } from '../types.ts'

/**
 * Clarity and context rules: is the request unambiguous, and does the model
 * have what it needs to answer without guessing?
 */
export const clarityRules: Rule[] = [
  {
    id: 'empty',
    category: 'clarity',
    severity: 'critical',
    weight: 100,
    lessonId: 'anatomy',
    copy: {
      title: { en: 'There is barely a prompt here', ru: 'Промпта здесь почти нет' },
      why: {
        en: 'A handful of words leaves the model to invent the task, the audience, the format and the depth. Whatever comes back is a coincidence, not a result.',
        ru: 'Пара слов заставляет модель самой выдумать задачу, аудиторию, формат и глубину. Что бы ни вернулось — это совпадение, а не результат.',
      },
      fix: {
        en: 'State the task, the input it applies to, and the shape of the answer you want. Three sentences beats three words.',
        ru: 'Назовите задачу, материал, к которому она применяется, и форму нужного ответа. Три предложения лучше трёх слов.',
      },
    },
    check: (ctx) => (ctx.stats.words < ctx.minWords(5) ? [] : null),
  },

  {
    id: 'vague-verb',
    category: 'clarity',
    severity: 'high',
    weight: 22,
    patternId: 'task-first',
    lessonId: 'be-specific',
    copy: {
      title: { en: 'The verb does not say what to do', ru: 'Глагол не говорит, что делать' },
      why: {
        en: '"Improve", "handle", "work on" describe an intention, not an operation. The model has to guess which of a dozen possible edits you meant, and it will usually guess the safest and least useful one.',
        ru: '«Улучши», «разберись», «поработай над» описывают намерение, а не операцию. Модели приходится угадывать, какую из десятка правок вы имели в виду, и обычно она выбирает самую безопасную и бесполезную.',
      },
      fix: {
        en: 'Replace it with the concrete change: "cut it to 150 words", "convert the passive voice to active", "add error handling for network failures".',
        ru: 'Замените на конкретное изменение: «сократи до 150 слов», «переведи пассивный залог в активный», «добавь обработку сетевых ошибок».',
      },
    },
    check: (ctx) => {
      const spans = findSpans(ctx.text, lex('vagueVerbs', ctx.lang))
      return spans.length > 0 ? spans : null
    },
  },

  {
    id: 'subjective-adjective',
    category: 'clarity',
    severity: 'high',
    weight: 18,
    patternId: 'success-criteria',
    lessonId: 'be-specific',
    copy: {
      title: { en: 'Quality words with no definition', ru: 'Оценочные слова без определения' },
      why: {
        en: '"Good", "professional", "engaging" mean whatever the model\'s training data averaged them to. You cannot tell whether the output met the bar, because you never wrote the bar down.',
        ru: '«Хороший», «профессиональный», «цепляющий» значат то, во что их усреднили обучающие данные. Вы не сможете сказать, выполнено ли требование, потому что вы его не записали.',
      },
      fix: {
        en: 'Convert each adjective into a test. "Professional" becomes "no contractions, no exclamation marks, third person". "Engaging" becomes "opens with a concrete example, not a definition".',
        ru: 'Переведите каждое прилагательное в проверку. «Профессиональный» → «без сокращений, без восклицательных знаков, третье лицо». «Цепляющий» → «начинается с конкретного примера, а не с определения».',
      },
    },
    check: (ctx) => {
      const spans = findSpans(ctx.text, lex('subjectiveAdjectives', ctx.lang))
      return spans.length >= 2 ? spans : null
    },
  },

  {
    id: 'vague-quantifier',
    category: 'clarity',
    severity: 'medium',
    weight: 12,
    lessonId: 'be-specific',
    copy: {
      title: { en: 'Unquantified amounts', ru: 'Неопределённое количество' },
      why: {
        en: '"A few examples" gets you two or seven depending on the run. Any downstream step that expects a fixed count will break intermittently.',
        ru: '«Несколько примеров» даст два или семь в зависимости от запуска. Любой следующий шаг, ожидающий фиксированное число, будет ломаться время от времени.',
      },
      fix: {
        en: 'Write the number: "exactly 5 examples", "3 to 4 bullet points", "no more than 2 paragraphs".',
        ru: 'Напишите число: «ровно 5 примеров», «3–4 пункта», «не более 2 абзацев».',
      },
    },
    check: (ctx) => {
      const spans = findSpans(ctx.text, lex('vagueQuantifiers', ctx.lang))
      return spans.length > 0 ? spans : null
    },
  },

  {
    id: 'hedging',
    category: 'clarity',
    severity: 'medium',
    weight: 10,
    lessonId: 'be-specific',
    copy: {
      title: { en: 'Hedged instructions', ru: 'Смягчённые инструкции' },
      why: {
        en: '"If possible", "try to", "ideally" mark a requirement as optional. The model is free to skip it, and under a tight output budget it will.',
        ru: '«По возможности», «попробуй», «в идеале» помечают требование как необязательное. Модель вправе его пропустить — и при жёстком лимите ответа так и сделает.',
      },
      fix: {
        en: 'Decide. If it is required, say "must". If it genuinely is optional, move it to a separate "nice to have" line so the required set stays unambiguous.',
        ru: 'Определитесь. Если требование обязательно — пишите «должен». Если действительно опционально — вынесите в отдельную строку «желательно», чтобы обязательный набор остался однозначным.',
      },
    },
    check: (ctx) => {
      const spans = findSpans(ctx.text, lex('hedges', ctx.lang))
      return spans.length >= 2 ? spans : null
    },
  },

  {
    id: 'negative-only',
    category: 'clarity',
    severity: 'medium',
    weight: 14,
    patternId: 'positive-instruction',
    lessonId: 'be-specific',
    copy: {
      title: { en: 'Only says what not to do', ru: 'Сказано только чего не делать' },
      why: {
        en: 'A list of prohibitions leaves an enormous space of allowed answers, and the model picks from it arbitrarily. Constraints narrow the space; they do not choose a point in it.',
        ru: 'Список запретов оставляет огромное пространство допустимых ответов, и модель выбирает из него произвольно. Ограничения сужают пространство, но не выбирают точку в нём.',
      },
      fix: {
        en: 'For each "do not X", add the "do Y" that replaces it. "Do not use jargon" becomes "use the vocabulary of a first-year student".',
        ru: 'К каждому «не делай X» добавьте «делай Y». «Не используй жаргон» → «пиши словами первокурсника».',
      },
    },
    check: (ctx) => {
      const negatives = countMatches(ctx.text, lex('negativeOnly', ctx.lang))
      if (negatives < 3) return null
      // Only fires when prohibitions dominate: there must be little positive
      // direction to balance them.
      const directives =
        countMatches(ctx.text, lexBoth('generationTask')) +
        countMatches(ctx.text, lexBoth('transformationTask')) +
        countMatches(ctx.text, lexBoth('outputFormat'))
      return negatives > directives * 2 ? findSpans(ctx.text, lex('negativeOnly', ctx.lang)) : null
    },
  },

  {
    id: 'contradiction',
    category: 'clarity',
    severity: 'high',
    weight: 20,
    lessonId: 'be-specific',
    copy: {
      title: { en: 'Instructions contradict each other', ru: 'Инструкции противоречат друг другу' },
      why: {
        en: 'Asking for brief and comprehensive, or formal and casual, forces the model to spend reasoning on reconciling you instead of on the task. OpenAI documents this as more damaging to current reasoning models than to older ones, because they burn tokens searching for a reading that satisfies both.',
        ru: 'Просьба «кратко и исчерпывающе» или «формально и непринуждённо» заставляет модель тратить рассуждение на примирение ваших требований, а не на задачу. OpenAI отмечает, что для нынешних рассуждающих моделей это вреднее, чем для старых: они сжигают токены в поисках трактовки, устраивающей обе стороны.',
      },
      fix: {
        en: 'Pick one and delete the other, or scope them: "two-sentence summary first, then full detail below it".',
        ru: 'Выберите одно и удалите другое — или разведите по областям: «сначала резюме в двух предложениях, ниже полный разбор».',
      },
    },
    check: (ctx) => {
      // Two problems this helper exists to avoid. First, `\b` is ASCII-only in
      // JavaScript, so a Cyrillic alternative sitting behind one never matches
      // — the Russian half of these pairs was dead. Second, an open-ended
      // alternation matches inside longer words: "short" fired on "SHORTCUT"
      // and "SHORTCOMINGS". Whole words get a closing boundary; Russian stems
      // are prefixes by design and deliberately do not.
      const word = (whole: string, stems = '') =>
        new RegExp(
          `(?<![\\p{L}\\p{N}])(?:(?:${whole})(?![\\p{L}\\p{N}])${stems ? `|(?:${stems})` : ''})`,
          'iu',
        )
      const pairs: [RegExp, RegExp][] = [
        [
          word('brief|briefly|concise|concisely|short|succinct', 'кратк|коротк|сжат'),
          word(
            'comprehensive|exhaustive|detailed|in-depth|thorough|thoroughly',
            'исчерпыва|подробн|детальн|развёрнут|развернут',
          ),
        ],
        [
          word('formal|professional|professionally', 'формальн|официальн'),
          word('casual|conversational|informal|friendly', 'неформальн|разговорн|дружелюбн'),
        ],
        [
          word('creative|creatively|imaginative|original', 'креативн|творческ|оригинальн'),
          word(
            'factual|accurate|accurately|strictly|precise',
            'фактическ|строго придерж|точно придерж',
          ),
        ],
        [
          word('simple|simplify|beginner|beginners', 'прост(?:о|ой|ым|ыми)|для новичк'),
          word('technical|advanced|expert-level', 'техническ|продвинут|экспертн'),
        ],
      ]
      const hits: RegExp[] = []
      for (const [a, b] of pairs) {
        if (a.test(ctx.text) && b.test(ctx.text)) hits.push(a, b)
      }
      if (hits.length === 0) return null
      return hits.flatMap((re) => findSpans(ctx.text, re, 2))
    },
  },

  {
    id: 'multiple-asks',
    category: 'clarity',
    severity: 'medium',
    weight: 12,
    patternId: 'prompt-chaining',
    lessonId: 'decomposition',
    copy: {
      title: {
        en: 'Several unrelated tasks in one prompt',
        ru: 'Несколько разных задач в одном промпте',
      },
      why: {
        en: 'Bundled tasks share one output budget and one attention pass. The last task reliably gets the worst answer, and you cannot iterate on one part without re-running all of them.',
        ru: 'Склеенные задачи делят один бюджет ответа и один проход внимания. Последняя задача стабильно получает худший ответ, и нельзя доработать одну часть, не перезапуская остальные.',
      },
      fix: {
        en: 'Split into separate prompts and feed each output into the next. If they must stay together, number them and give each its own output section.',
        ru: 'Разделите на отдельные промпты и передавайте вывод одного в следующий. Если нужно оставить вместе — пронумеруйте и дайте каждой свою секцию в ответе.',
      },
    },
    check: (ctx) => {
      const questionMarks = countMatches(ctx.text, /[?？]/g)
      const imperatives =
        countMatches(ctx.text, lexBoth('generationTask')) +
        countMatches(ctx.text, lexBoth('transformationTask')) +
        countMatches(ctx.text, lexBoth('analysisTask'))
      const alsoMarkers = countMatches(
        ctx.text,
        /\b(also|additionally|and then|furthermore|plus)\b|такж|кроме того|а ещё|и потом|дополнительно/giu,
      )
      const asks = questionMarks + imperatives
      // A structured, numbered brief is a legitimate multi-part prompt; an
      // unstructured pile of "and also" is not.
      if (asks < 4 || alsoMarkers < 2) return null
      if (ctx.structure.numberedLines >= 3) return null
      return findSpans(
        ctx.text,
        /\b(also|additionally|and then|furthermore|plus)\b|такж|кроме того|а ещё|и потом|дополнительно/giu,
      )
    },
  },

  {
    id: 'ambiguous-reference',
    category: 'clarity',
    severity: 'low',
    weight: 8,
    lessonId: 'be-specific',
    copy: {
      title: { en: 'Pronouns without a referent', ru: 'Местоимения без адресата' },
      why: {
        en: 'A prompt that opens with "make it shorter" or "fix this" only works if the thing is actually in the context. In a fresh conversation, it is not.',
        ru: 'Промпт, начинающийся с «сделай его короче» или «исправь это», работает, только если объект действительно в контексте. В новом диалоге его там нет.',
      },
      fix: {
        en: 'Name the thing, and paste it if it is not already present: "make the second paragraph of the text below shorter".',
        ru: 'Назовите объект и вставьте его, если его ещё нет: «сократи второй абзац текста ниже».',
      },
    },
    check: (ctx) => {
      const opener = ctx.text.trimStart().slice(0, 80)
      const pattern =
        /^(?:make|fix|change|update|improve|rewrite|shorten)\s+(?:it|this|that|these|those)\b|^(?:сделай|исправь|измени|обнови|улучши|перепиши|сократи)\s+(?:это|его|её|их|этот|эту)\b/iu
      if (!pattern.test(opener)) return null
      // If the prompt also carries the material, the reference resolves fine.
      if (ctx.stats.words > ctx.minWords(60) || ctx.structure.hasAnyDelimiter) return null
      return findSpans(ctx.text, pattern, 1)
    },
  },

  {
    id: 'politeness-filler',
    category: 'efficiency',
    severity: 'info',
    weight: 4,
    lessonId: 'lean-prompts',
    copy: {
      title: { en: 'Politeness that buys nothing', ru: 'Вежливость, которая ничего не даёт' },
      why: {
        en: 'Courtesy formulas cost tokens on every call and have no measured effect on output quality. In a system prompt sent thousands of times a day, they are pure overhead.',
        ru: 'Формулы вежливости стоят токенов на каждом вызове и не дают измеримого эффекта на качество. В системном промпте, отправляемом тысячи раз в день, это чистые накладные расходы.',
      },
      fix: {
        en: 'Drop them from automated prompts. Keep them in your own chats if you like — this is about cost, not manners.',
        ru: 'Уберите их из автоматизированных промптов. В личных чатах оставляйте, если хочется — речь про стоимость, а не про манеры.',
      },
    },
    check: (ctx) => {
      const spans = findSpans(ctx.text, lex('politeness', ctx.lang))
      return spans.length >= 2 ? spans : null
    },
  },

  {
    id: 'no-audience',
    category: 'context',
    severity: 'medium',
    weight: 14,
    patternId: 'audience-spec',
    lessonId: 'context-that-matters',
    copy: {
      title: { en: 'No reader specified', ru: 'Не указан читатель' },
      why: {
        en: 'Vocabulary, depth, assumed background and tone all follow from who reads it. Without a reader the model writes for a generic adult, which is right for almost nobody.',
        ru: 'Лексика, глубина, предполагаемый бэкграунд и тон вытекают из того, кто это читает. Без читателя модель пишет для абстрактного взрослого — это подходит почти никому.',
      },
      fix: {
        en: 'Add one clause: "for a backend engineer who has never used Kafka" or "for a customer who just got a failed payment email".',
        ru: 'Добавьте одну фразу: «для бэкенд-инженера, который никогда не работал с Kafka» или «для клиента, которому только что пришло письмо о неудавшемся платеже».',
      },
    },
    check: (ctx) => {
      if (ctx.taskKind !== 'generation' && ctx.taskKind !== 'transformation') return null
      if (ctx.stats.words < ctx.minWords(12)) return null
      return lex('audience', ctx.lang).test(ctx.text) ? null : []
    },
  },

  {
    id: 'no-purpose',
    category: 'context',
    severity: 'low',
    weight: 9,
    patternId: 'goal-statement',
    lessonId: 'context-that-matters',
    copy: {
      title: { en: 'No stated goal', ru: 'Не указана цель' },
      why: {
        en: 'Knowing what the output is for lets the model resolve the dozens of small choices you did not specify. Without it, every one of those choices is a coin flip.',
        ru: 'Понимание, для чего нужен результат, позволяет модели разрешить десятки мелких решений, которые вы не оговорили. Без этого каждое из них — подбрасывание монеты.',
      },
      fix: {
        en: 'One sentence: "this goes in the onboarding email that new users see first" tells the model more than three paragraphs of style rules.',
        ru: 'Одно предложение: «это пойдёт в приветственное письмо, которое новые пользователи видят первым» скажет модели больше, чем три абзаца правил стиля.',
      },
    },
    check: (ctx) => {
      if (ctx.stats.words < ctx.minWords(15)) return null
      if (ctx.taskKind === 'code' || ctx.taskKind === 'extraction') return null
      return lex('purpose', ctx.lang).test(ctx.text) ? null : []
    },
  },

  {
    id: 'assumed-knowledge',
    category: 'context',
    severity: 'high',
    weight: 18,
    lessonId: 'context-that-matters',
    copy: {
      title: {
        en: 'Refers to context the model does not have',
        ru: 'Ссылка на контекст, которого у модели нет',
      },
      why: {
        en: '"As we discussed", "the usual format", "the same as last time" refer to a shared history that does not exist in a stateless request. The model will invent a plausible substitute.',
        ru: '«Как мы обсуждали», «в обычном формате», «как в прошлый раз» отсылают к общей истории, которой в stateless-запросе нет. Модель придумает правдоподобную замену.',
      },
      fix: {
        en: 'Paste the thing you are referring to. If it is a recurring format, keep it in a reusable snippet rather than in your memory.',
        ru: 'Вставьте то, на что ссылаетесь. Если это повторяющийся формат — держите его в переиспользуемом сниппете, а не в своей памяти.',
      },
    },
    check: (ctx) => {
      const spans = findSpans(ctx.text, lex('assumedKnowledge', ctx.lang))
      return spans.length > 0 ? spans : null
    },
  },

  {
    id: 'unfilled-placeholder',
    category: 'context',
    severity: 'critical',
    weight: 45,
    lessonId: 'anatomy',
    copy: {
      title: { en: 'Unfilled placeholder', ru: 'Незаполненный плейсхолдер' },
      why: {
        en: 'A literal {{variable}} or [insert here] reaching the model is a template bug. The model will either answer about the placeholder itself or silently invent a value.',
        ru: 'Буквальный {{переменная}} или [вставьте сюда], дошедший до модели, — это баг шаблона. Модель либо ответит про сам плейсхолдер, либо молча выдумает значение.',
      },
      fix: {
        en: 'Substitute the real value before sending. If you are building a template, assert that no placeholder survives substitution.',
        ru: 'Подставьте реальное значение перед отправкой. Если вы строите шаблон — проверяйте, что после подстановки не осталось плейсхолдеров.',
      },
    },
    check: (ctx) => {
      const pattern =
        /\{\{\s*[\w.]+\s*\}\}|\[(?:insert|your|add|paste|вставьте|ваш[аи]?е?)\b[^\]]{0,40}\]|\bTODO\b|\bFIXME\b|\bXXX\b|<(?:placeholder|заполнить)>/giu
      const spans = findSpans(ctx.text, pattern)
      return spans.length > 0 ? spans : null
    },
  },

  {
    id: 'undefined-acronym',
    category: 'context',
    severity: 'low',
    weight: 6,
    lessonId: 'context-that-matters',
    copy: {
      title: { en: 'Acronyms that are never expanded', ru: 'Нерасшифрованные аббревиатуры' },
      why: {
        en: 'Internal acronyms collide with common ones. "PR" is a pull request, a press release, or public relations, and the model picks by frequency, not by your context.',
        ru: 'Внутренние аббревиатуры пересекаются с общеупотребимыми. «PR» — это pull request, пресс-релиз или пиар, и модель выбирает по частотности, а не по вашему контексту.',
      },
      fix: {
        en: 'Expand each one on first use: "PR (pull request)". One extra parenthesis removes a whole class of misread prompts.',
        ru: 'Расшифруйте при первом употреблении: «PR (pull request)». Одни скобки убирают целый класс неверно понятых промптов.',
      },
    },
    check: (ctx) => {
      const acronyms = new Set<string>()
      for (const word of words(ctx.text)) {
        if (
          /^[A-ZА-Я]{2,6}$/u.test(word) &&
          !/^(?:I|OK|AI|API|URL|JSON|XML|CSV|HTML|CSS|SQL|PDF|UTC|ID|UI|UX)$/u.test(word)
        ) {
          acronyms.add(word)
        }
      }
      if (acronyms.size < 2) return null
      // An acronym followed by a parenthetical is already expanded.
      const unexpanded = [...acronyms].filter((a) => !new RegExp(`${a}\\s*\\(`, 'u').test(ctx.text))
      if (unexpanded.length < 2) return null
      return unexpanded.flatMap((a) =>
        // `\b` is ASCII-only, so a Cyrillic acronym would produce a finding
        // with no highlight. Unicode-aware boundaries work for both scripts.
        findSpans(ctx.text, new RegExp(`(?<![\\p{L}\\p{N}])${a}(?![\\p{L}\\p{N}])`, 'gu'), 2),
      )
    },
  },
]

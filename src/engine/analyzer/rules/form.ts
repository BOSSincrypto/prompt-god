import { lex, lexBoth } from '../lexicon.ts'
import { countMatches, findSpans } from '../text.ts'
import type { Rule } from '../types.ts'

/**
 * Structure, output-shape and example rules: is the prompt readable by the
 * model, and does it pin down what comes back?
 */
export const formRules: Rule[] = [
  {
    id: 'wall-of-text',
    category: 'structure',
    severity: 'high',
    weight: 18,
    patternId: 'sectioned-prompt',
    lessonId: 'structure',
    copy: {
      title: { en: 'One undifferentiated block', ru: 'Один сплошной блок' },
      why: {
        en: 'With no headings, blank lines or lists, every instruction has equal visual weight. Requirements buried mid-paragraph get followed far less reliably than the same requirements on their own line.',
        ru: 'Без заголовков, пустых строк и списков все инструкции имеют одинаковый вес. Требования, зарытые в середину абзаца, выполняются заметно хуже тех же требований на отдельной строке.',
      },
      fix: {
        en: 'Break it into labelled sections — context, task, constraints, output format. One requirement per line.',
        ru: 'Разбейте на именованные секции: контекст, задача, ограничения, формат ответа. По одному требованию на строку.',
      },
    },
    check: (ctx) => {
      if (ctx.stats.words < ctx.minWords(90)) return null
      if (ctx.structure.hasAnyDelimiter) return null
      if (ctx.stats.paragraphs >= 3) return null
      return []
    },
  },

  {
    id: 'no-delimiters',
    category: 'structure',
    severity: 'high',
    weight: 20,
    patternId: 'delimited-input',
    lessonId: 'structure',
    copy: {
      title: {
        en: 'Data is not separated from instructions',
        ru: 'Данные не отделены от инструкций',
      },
      why: {
        en: 'When pasted material runs straight into your instructions, the model cannot tell where one ends and the other begins. Anything imperative inside the pasted text reads as a command — which is also how prompt injection works.',
        ru: 'Когда вставленный материал переходит прямо в ваши инструкции, модель не видит границы. Любое повелительное наклонение внутри вставленного текста читается как команда — именно так работает и prompt injection.',
      },
      fix: {
        en: 'Wrap the material in an explicit boundary — triple backticks, or a named tag like <document>…</document> — and say what it is.',
        ru: 'Оберните материал в явную границу — тройные обратные кавычки или именованный тег вроде <document>…</document> — и скажите, что это.',
      },
    },
    check: (ctx) => {
      if (ctx.stats.words < ctx.minWords(120)) return null
      if (ctx.structure.hasAnyDelimiter) return null
      // A long prompt containing what looks like pasted prose rather than a
      // long instruction list.
      const longLine = ctx.lines.some((line) => line.length > 400)
      return longLine ? [] : null
    },
  },

  {
    id: 'query-before-document',
    category: 'structure',
    severity: 'medium',
    weight: 14,
    patternId: 'documents-first',
    lessonId: 'long-context',
    copy: {
      title: {
        en: 'The question comes before the long document',
        ru: 'Вопрос стоит перед длинным документом',
      },
      why: {
        en: 'Anthropic measures up to a 30 percent quality improvement on complex multi-document inputs simply from moving the query to the end, after the material. The model attends to the instruction against material it has already read.',
        ru: 'Anthropic измеряет до 30 % прироста качества на сложных многодокументных входах просто от переноса вопроса в конец, после материала. Модель применяет инструкцию к уже прочитанному тексту.',
      },
      fix: {
        en: 'Put long documents at the top, then the instruction and question at the bottom. Keep a one-line framing sentence up front if you need it.',
        ru: 'Разместите длинные документы сверху, а инструкцию и вопрос — внизу. Одну вводную строку можно оставить сверху, если нужно.',
      },
    },
    check: (ctx) => {
      if (!ctx.profile.longContextDocsFirst) return null
      if (ctx.stats.tokens < 1200) return null
      const head = ctx.text.slice(0, Math.floor(ctx.text.length * 0.25))
      const tail = ctx.text.slice(Math.floor(ctx.text.length * 0.75))
      const askPattern =
        /[?？]|\b(answer|summarize|summarise|extract|explain|analyze|analyse)\b|ответь|суммируй|извлеки|объясни|проанализируй/giu
      const headAsks = countMatches(head, askPattern)
      const tailAsks = countMatches(tail, askPattern)
      return headAsks > 0 && tailAsks === 0 ? findSpans(head, askPattern, 3) : null
    },
  },

  {
    id: 'instructions-buried',
    category: 'structure',
    severity: 'medium',
    weight: 12,
    patternId: 'sectioned-prompt',
    lessonId: 'structure',
    copy: {
      title: {
        en: 'The actual task is buried in the middle',
        ru: 'Сама задача спрятана в середине',
      },
      why: {
        en: 'Attention is strongest at the start and end of a long prompt. An instruction sitting alone in the middle of a wall of context is the single easiest thing for a model to under-weight.',
        ru: 'Внимание сильнее всего в начале и конце длинного промпта. Инструкция, стоящая в одиночестве посреди массива контекста, — самое лёгкое, что модель может недооценить.',
      },
      fix: {
        en: 'State the task once at the top as a one-line summary, and again in full at the bottom after the material.',
        ru: 'Сформулируйте задачу один раз сверху одной строкой и повторите полностью внизу, после материала.',
      },
    },
    check: (ctx) => {
      if (ctx.stats.words < ctx.minWords(200)) return null
      const third = Math.floor(ctx.text.length / 3)
      const middle = ctx.text.slice(third, third * 2)
      const head = ctx.text.slice(0, third)
      const tail = ctx.text.slice(third * 2)
      const taskPattern = lexBoth('generationTask')
      const inMiddle = countMatches(middle, taskPattern)
      const outside = countMatches(head, taskPattern) + countMatches(tail, taskPattern)
      if (inMiddle < 2 || outside > 0) return null
      // Offsets come back relative to `middle`; the editor slices the full
      // text, so shift them or the highlight lands on unrelated characters.
      return findSpans(middle, taskPattern, 3).map((span) => ({
        start: span.start + third,
        end: span.end + third,
      }))
    },
  },

  {
    id: 'no-output-format',
    category: 'output',
    severity: 'high',
    weight: 24,
    patternId: 'output-contract',
    lessonId: 'output-contract',
    copy: {
      title: { en: 'No output format specified', ru: 'Не задан формат ответа' },
      why: {
        en: 'Left unspecified, the model picks a shape — usually prose with a preamble and a summary you did not ask for. If anything downstream parses the output, it will break the first time the shape drifts.',
        ru: 'Без указания модель сама выбирает форму — обычно прозу с преамбулой и итогом, которых вы не просили. Если вывод потом разбирается программно, всё сломается при первом же дрейфе формы.',
      },
      fix: {
        en: 'Name the container and the fields: "return a JSON object with keys title, summary, tags" or "return exactly three bullet points, no preamble".',
        ru: 'Назовите контейнер и поля: «верни JSON-объект с ключами title, summary, tags» или «верни ровно три пункта списка, без преамбулы».',
      },
    },
    check: (ctx) => {
      if (ctx.stats.words < ctx.minWords(10)) return null
      return lex('outputFormat', ctx.lang).test(ctx.text) ? null : []
    },
  },

  {
    id: 'no-length-constraint',
    category: 'output',
    severity: 'medium',
    weight: 12,
    patternId: 'output-contract',
    lessonId: 'output-contract',
    copy: {
      title: { en: 'No length bound', ru: 'Нет ограничения по объёму' },
      why: {
        en: 'Current flagship models default to long. Anthropic documents Opus 5 as producing noticeably longer responses than its predecessors, and notes that lowering effort does not shorten them — only an explicit length instruction does.',
        ru: 'Нынешние флагманы по умолчанию многословны. Anthropic указывает, что Opus 5 отвечает заметно длиннее предшественников, и что снижение effort длину не сокращает — сокращает только явная инструкция по объёму.',
      },
      fix: {
        en: 'Give a number and a unit: "at most 120 words", "exactly 5 bullets", "one paragraph". Numbers work better than "brief".',
        ru: 'Дайте число и единицу: «не более 120 слов», «ровно 5 пунктов», «один абзац». Числа работают лучше, чем «кратко».',
      },
    },
    check: (ctx) => {
      if (
        ctx.taskKind !== 'generation' &&
        ctx.taskKind !== 'transformation' &&
        ctx.taskKind !== 'analysis'
      )
        return null
      if (ctx.stats.words < ctx.minWords(10)) return null
      if (
        /\b\d+\s*(?:words?|characters?|sentences?|paragraphs?|bullets?|items?|lines?)\b|\b\d+\s*(?:слов|символ|предложен|абзац|пункт|строк)/iu.test(
          ctx.text,
        )
      )
        return null
      return lex('lengthConstraint', ctx.lang).test(ctx.text) ? null : []
    },
  },

  {
    id: 'json-without-schema',
    category: 'output',
    severity: 'high',
    weight: 20,
    patternId: 'json-schema',
    lessonId: 'output-contract',
    copy: {
      title: { en: 'JSON requested without a schema', ru: 'Просят JSON без схемы' },
      why: {
        en: 'Asking for "JSON" without naming the keys gets you a different shape on different runs. Every current major provider supports schema-constrained output, which removes the failure mode entirely.',
        ru: 'Просьба «в JSON» без перечисления ключей даёт разную форму на разных запусках. Все нынешние крупные провайдеры поддерживают вывод, ограниченный схемой, — это полностью убирает проблему.',
      },
      fix: {
        en: "List the exact keys and their types, and show one filled example. Better still, pass a JSON Schema through the API's structured-output parameter rather than describing it in prose.",
        ru: 'Перечислите точные ключи и типы и покажите один заполненный пример. Ещё лучше — передайте JSON Schema через параметр структурированного вывода API, а не описывайте её прозой.',
      },
    },
    check: (ctx) => {
      if (!/\bjson\b/iu.test(ctx.text)) return null
      // A schema is present if the prompt shows braces with quoted keys, or
      // enumerates fields by name.
      const showsShape = /\{[^}]*"[\w-]+"\s*:/su.test(ctx.text)
      const namesKeys =
        /\b(?:keys?|fields?|properties|schema)\b|(?<![\p{L}\p{N}])(?:ключ|пол[ея]|свойств|схем)/iu.test(
          ctx.text,
        )
      return showsShape || namesKeys ? null : findSpans(ctx.text, /\bjson\b/giu, 3)
    },
  },

  {
    id: 'format-conflict',
    category: 'output',
    severity: 'high',
    weight: 18,
    lessonId: 'output-contract',
    copy: {
      title: { en: 'Two incompatible output shapes', ru: 'Два несовместимых формата ответа' },
      why: {
        en: 'Asking for machine-readable output and an explanation gets you JSON wrapped in prose, which parses as neither. This is the most common reason a working prompt starts failing in production.',
        ru: 'Просьба о машиночитаемом выводе плюс объяснение даёт JSON, обёрнутый в прозу, — не парсится ни как то, ни как другое. Это самая частая причина, по которой рабочий промпт начинает падать в проде.',
      },
      fix: {
        en: 'Pick one. If you need both, put the explanation inside a field of the structured output: {"answer": …, "reasoning": …}.',
        ru: 'Выберите одно. Если нужно и то и другое — положите объяснение в поле структурированного вывода: {"answer": …, "reasoning": …}.',
      },
    },
    check: (ctx) => {
      const machine = /\b(json|yaml|xml|csv)\b/iu.test(ctx.text)
      if (!machine) return null
      const prose =
        /\b(explain|describe|discuss|tell me why|elaborate|commentary|write a paragraph)\b|объясни|опиши|расскажи почему|прокомментируй|напиши абзац/iu.test(
          ctx.text,
        )
      const onlyMarker =
        /\b(only|nothing else|no other text|no preamble|no explanation)\b|только|ничего кроме|без пояснений|без преамбулы/iu.test(
          ctx.text,
        )
      return prose && !onlyMarker
        ? findSpans(ctx.text, /\b(json|yaml|xml|csv|explain|describe)\b|объясни|опиши/giu, 4)
        : null
    },
  },

  {
    id: 'no-examples-for-pattern-task',
    category: 'examples',
    severity: 'high',
    weight: 22,
    patternId: 'few-shot',
    lessonId: 'examples',
    copy: {
      title: { en: 'A pattern task with no examples', ru: 'Задача на паттерн без примеров' },
      why: {
        en: 'Classification, extraction and reformatting are defined by their edge cases, and prose descriptions of edge cases are far less reliable than showing them. Examples are the highest-leverage thing you can add to this kind of prompt.',
        ru: 'Классификация, извлечение и переформатирование определяются краевыми случаями, а описать их прозой куда менее надёжно, чем показать. Примеры — самое действенное, что можно добавить в такой промпт.',
      },
      fix: {
        en: 'Add 3 to 5 examples covering the boundaries — including one that should produce the "none" or "unclear" answer. Wrap each in its own delimiter.',
        ru: 'Добавьте 3–5 примеров, покрывающих границы, включая один, который должен дать ответ «нет» или «непонятно». Оберните каждый в свой разделитель.',
      },
    },
    check: (ctx) => {
      if (ctx.taskKind !== 'classification' && ctx.taskKind !== 'extraction') return null
      const hasExamples =
        /\b(example|examples|e\.g\.|for instance|input:|output:|sample)\b|пример|например|вход:|выход:|образец/iu.test(
          ctx.text,
        ) || ctx.structure.xmlTags.some((tag) => tag.includes('example'))
      return hasExamples ? null : []
    },
  },

  {
    id: 'too-few-examples',
    category: 'examples',
    severity: 'low',
    weight: 8,
    patternId: 'few-shot',
    lessonId: 'examples',
    copy: {
      title: { en: 'Only one or two examples', ru: 'Всего один-два примера' },
      why: {
        en: "A single example is read as the template rather than as one member of a class, so the model copies its surface features. Anthropic's guidance is 3 to 5, chosen to be relevant, diverse and consistently structured.",
        ru: 'Один пример читается как шаблон, а не как представитель класса, поэтому модель копирует его поверхностные черты. Anthropic рекомендует 3–5 примеров: релевантных, разнообразных и одинаково оформленных.',
      },
      fix: {
        en: 'Add examples until the boundaries are covered, then stop. Make sure they differ from each other in the ways real inputs differ.',
        ru: 'Добавляйте примеры, пока не покрыты границы, затем остановитесь. Проследите, чтобы они отличались друг от друга так же, как отличаются реальные входы.',
      },
    },
    check: (ctx) => {
      // "For example, …" in prose is not an example set. Only count markers
      // that actually label one: a line starting "Example 2:", "input:", etc.
      const exampleMarkers = countMatches(
        ctx.text,
        /(?:^|\n)\s*(?:example|пример)\s*\d*\s*[:.)-]|(?:^|\n)\s*(?:input|output|вход|выход)\s*:/giu,
      )
      const exampleTags = ctx.structure.xmlTags.filter((tag) => tag.includes('example')).length
      const total = Math.max(exampleMarkers, exampleTags)
      return total >= 1 && total < 3 ? [] : null
    },
  },

  {
    id: 'unstructured-examples',
    category: 'examples',
    severity: 'low',
    weight: 8,
    patternId: 'few-shot',
    lessonId: 'examples',
    copy: {
      title: { en: 'Examples are not delimited', ru: 'Примеры не отделены разделителями' },
      why: {
        en: 'Without a boundary, the model cannot reliably tell where an example ends and your next instruction begins — so instructions leak into the example set and get treated as data.',
        ru: 'Без границы модель не может надёжно определить, где кончается пример и начинается ваша следующая инструкция, — инструкции протекают в набор примеров и трактуются как данные.',
      },
      fix: {
        en: 'Wrap each example in matching tags — <example>…</example> — and the whole set in <examples>. Keep every example in the identical shape.',
        ru: 'Оберните каждый пример в парные теги — <example>…</example>, — а весь набор в <examples>. Держите все примеры в одинаковой форме.',
      },
    },
    check: (ctx) => {
      const markers = countMatches(
        ctx.text,
        /\bexamples?\b|(?<![\p{L}\p{N}])пример(?:ы|ов)?(?![\p{L}\p{N}])/giu,
      )
      if (markers < 2) return null
      const delimited =
        ctx.structure.xmlTags.some((tag) => tag.includes('example')) ||
        ctx.structure.codeFences >= 2 ||
        ctx.structure.tripleQuotes >= 2
      return delimited
        ? null
        : findSpans(
            ctx.text,
            /\bexamples?\b|(?<![\p{L}\p{N}])пример(?:ы|ов)?(?![\p{L}\p{N}])/giu,
            4,
          )
    },
  },

  {
    id: 'xml-unbalanced',
    category: 'structure',
    severity: 'medium',
    weight: 12,
    lessonId: 'structure',
    copy: {
      title: { en: 'Unclosed section tag', ru: 'Незакрытый тег секции' },
      why: {
        en: 'An opening tag with no matching close swallows everything after it. The model reads your later instructions as part of the section content instead of as instructions.',
        ru: 'Открывающий тег без парного закрывающего поглощает всё, что идёт следом. Модель читает ваши дальнейшие инструкции как содержимое секции, а не как инструкции.',
      },
      fix: {
        en: 'Close every tag you open. Section tags only help when they mark a boundary — an unmatched one is worse than none.',
        ru: 'Закрывайте каждый открытый тег. Теги секций помогают, только когда обозначают границу; непарный тег хуже, чем его отсутствие.',
      },
    },
    check: (ctx) => {
      const open = new Map<string, number>()
      const close = new Map<string, number>()
      const selfClosing = new Set<string>()
      // Attributes must have quoted values. Without that, ordinary prose in
      // angle brackets — "when a<b and c>d holds" — registers as a tag.
      const re = /<(\/?)([a-z][\w-]*)((?:\s+[\w-]+="[^"]*")*)\s*(\/?)>/gi
      let match: RegExpExecArray | null
      while ((match = re.exec(ctx.text)) !== null) {
        const name = match[2]?.toLowerCase()
        if (!name) continue
        // `<br/>` needs no closing partner.
        if (match[4] === '/') {
          selfClosing.add(name)
          continue
        }
        const map = match[1] ? close : open
        map.set(name, (map.get(name) ?? 0) + 1)
      }
      const unbalanced = [...open.entries()].filter(
        ([name, count]) => count !== (close.get(name) ?? 0) && !selfClosing.has(name),
      )
      if (unbalanced.length === 0) return null
      return unbalanced.flatMap(([name]) =>
        findSpans(ctx.text, new RegExp(`</?${name}[^>]*>`, 'giu'), 2),
      )
    },
  },
]

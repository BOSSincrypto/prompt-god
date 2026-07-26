// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/build-content.mjs <authored.json>
import type { IndexEntry } from './types.ts'

export const searchIndex: IndexEntry[] = [
  {
    id: 'anatomy',
    kind: 'lesson',
    title: {
      en: 'The anatomy of a prompt',
      ru: 'Анатомия промпта',
    },
    keywords: {
      en: 'the five parts that decide the output — task, context, material, constraints, output contract — and why a prompt is a specification rather than a wish. a prompt is a specification: task, context, material, constraints, output contract. every part you leave out, the model fills in with the average of its training data.',
      ru: 'пять частей, которые определяют ответ, — задача, контекст, материал, ограничения, контракт на вывод — и почему промпт это спецификация, а не пожелание. промпт — это спецификация: задача, контекст, материал, ограничения, контракт на вывод. каждую пропущенную часть модель заполнит средним по обучающим данным.',
    },
    href: '/learn/anatomy',
  },
  {
    id: 'be-specific',
    kind: 'lesson',
    title: {
      en: 'Specific beats intentional',
      ru: 'Конкретное побеждает намеренное',
    },
    keywords: {
      en: 'vague verbs, undefined quality words, unquantified amounts and hedges — and how to turn each of them into something you could check. if you cannot write down the check that decides whether the output passes, the model has nothing to aim at.',
      ru: 'размытые глаголы, оценочные слова без определения, неопределённые количества и смягчения — и как превратить каждое из них в проверяемое требование. если вы не можете записать проверку, которая решает, годится ли ответ, — модели не во что целиться.',
    },
    href: '/learn/be-specific',
  },
  {
    id: 'context-that-matters',
    kind: 'lesson',
    title: {
      en: 'Context that changes the answer',
      ru: 'Контекст, который меняет ответ',
    },
    keywords: {
      en: 'audience and purpose do most of the work per token; history, backstory and "as we discussed" do none. how to tell them apart before you paste. include a piece of context only if you can name the sentence in the output it would change; everything else is rent you pay on every call.',
      ru: 'аудитория и цель дают больше всего пользы на токен; предыстория, бэкграунд и «как мы обсуждали» — ничего. как отличить одно от другого до того, как вставили. добавляйте фрагмент контекста, только если можете назвать предложение в ответе, которое он изменит; всё остальное — аренда, которую вы платите с каждого вызова.',
    },
    href: '/learn/context-that-matters',
  },
  {
    id: 'output-contract',
    kind: 'lesson',
    title: {
      en: 'The output contract',
      ru: 'Контракт на вывод',
    },
    keywords: {
      en: "naming the container and the fields, giving length as a number, and why the api's structured outputs beat describing a schema in prose. name the container, name every field, give length as a number — otherwise the model picks the shape, and in 2026 it picks long prose.",
      ru: 'как назвать контейнер и поля, задать объём числом и почему структурированный вывод через api лучше, чем описание схемы прозой. назовите контейнер, назовите каждое поле, задайте объём числом — иначе форму выберет модель, а в 2026 году она выбирает длинную прозу.',
    },
    href: '/learn/output-contract',
  },
  {
    id: 'structure',
    kind: 'lesson',
    title: {
      en: 'Sections and boundaries',
      ru: 'Секции и границы',
    },
    keywords: {
      en: 'labelled sections, delimiters and xml tags: what each one is for, when a tag earns its keep, and why the line between data and instructions is a security boundary. structure exists to make one boundary visible — where data ends and instructions begin. past that, it is ceremony.',
      ru: 'именованные секции, ограждения и xml-теги: зачем нужно каждое, когда тег оправдан и почему граница между данными и инструкциями — это граница безопасности. структура нужна, чтобы была видна одна граница: где кончаются данные и начинаются инструкции. всё сверх этого — церемония.',
    },
    href: '/learn/structure',
  },
  {
    id: 'examples',
    kind: 'lesson',
    title: {
      en: 'Examples do the work descriptions cannot',
      ru: 'Примеры делают то, чего не делают описания',
    },
    keywords: {
      en: 'few-shot done properly: three to five relevant, diverse, structured examples — including the one that fits nothing — plus an honest account of where examples stop helping. examples pin down what a description cannot: the exact shape of the output and the calls on the boundary.',
      ru: 'few-shot по-настоящему: три-пять релевантных, разных, оформленных примеров — включая тот, что не подходит ни под одну метку, — и честный разбор, где примеры перестают помогать. примеры закрывают то, что не закрывает описание: точную форму ответа и решения на границе.',
    },
    href: '/learn/examples',
  },
  {
    id: 'long-context',
    kind: 'lesson',
    title: {
      en: 'Long context is not free context',
      ru: 'Длинный контекст — не бесплатный контекст',
    },
    keywords: {
      en: 'placement, decay and evidence: documents first, question last, retrieval instead of pasting everything, and quotes before conclusions. in a long prompt, where you put something and how much irrelevant material surrounds it matter as much as whether it is there at all.',
      ru: 'порядок, деградация и доказательства: документы сверху, вопрос снизу, поиск вместо вставки всего подряд и цитаты раньше выводов. в длинном промпте важно не только то, что в нём есть, но и где это стоит и сколько лишнего лежит вокруг.',
    },
    href: '/learn/long-context',
  },
  {
    id: 'lean-prompts',
    kind: 'lesson',
    title: {
      en: 'Thin prompts, thick context',
      ru: 'Тонкий промпт, толстый контекст',
    },
    keywords: {
      en: 'both major vendors measured the same thing in 2026: cutting the system prompt made agents better, not worse. this lesson covers what to delete first and why the old padding stopped paying. delete every rule you have not personally seen the model break.',
      ru: 'в 2026 оба крупных вендора измерили одно и то же: сокращение системного промпта улучшило работу агентов, а не ухудшило. разбираем, что удалять в первую очередь и почему старая «набивка» перестала работать. удаляйте каждое правило, нарушения которого вы лично не видели.',
    },
    href: '/learn/lean-prompts',
  },
  {
    id: 'reasoning-2026',
    kind: 'lesson',
    title: {
      en: 'Reasoning became a parameter',
      ru: 'Рассуждение стало параметром',
    },
    keywords: {
      en: 'chain-of-thought migrated from prompt text into the request body. what the effect sizes actually are, where cot still earns its tokens, and why you should never ask a model to echo its internal reasoning. on a reasoning model, thinking is a dial you set in the request — writing "think step by step" mostly just spends your tokens.',
      ru: 'chain-of-thought переехал из текста промпта в тело запроса. каковы реальные размеры эффекта, где cot ещё окупает токены и почему нельзя просить модель пересказать своё внутреннее рассуждение. на reasoning-модели рассуждение — это ручка в запросе; фраза «думай шаг за шагом» в основном просто тратит ваши токены.',
    },
    href: '/learn/reasoning-2026',
  },
  {
    id: 'model-differences',
    kind: 'lesson',
    title: {
      en: 'What changes when you switch families',
      ru: 'Что меняется при смене семейства модели',
    },
    keywords: {
      en: "the prompt text is mostly portable. the request body is not. a concrete list of what returns 400, what silently degrades, and what to keep in a per-family adapter. the prompt ports; the transport layer doesn't — swapping the model id is never the whole migration.",
      ru: 'текст промпта переносится почти без изменений. тело запроса — нет. конкретный список того, что вернёт 400, что деградирует молча и что держать в адаптере под каждое семейство. промпт переносится, транспортный слой — нет: смена id модели никогда не равна миграции.',
    },
    href: '/learn/model-differences',
  },
  {
    id: 'hallucination',
    kind: 'lesson',
    title: {
      en: 'Making fabrication visible',
      ru: 'Как сделать выдумку заметной',
    },
    keywords: {
      en: 'grounding rules that turn an unsupported claim into something you can actually detect. you cannot instruct a model into truthfulness, but you can require a quote under every claim and delete the claims that have none.',
      ru: 'правила заземления, которые превращают неподтверждённое утверждение в то, что можно поймать. правдивость нельзя приказать — но можно потребовать цитату под каждым утверждением и удалять те, где её нет.',
    },
    href: '/learn/hallucination',
  },
  {
    id: 'injection',
    kind: 'lesson',
    title: {
      en: 'Prompt injection and the data boundary',
      ru: 'Prompt injection и граница данных',
    },
    keywords: {
      en: 'why no wording defeats injection, and what to do instead: cut probability, cut blast radius, detect fast. any text your model reads that somebody else can influence is untrusted input, and the defences that hold live outside the prompt.',
      ru: 'почему формулировкой injection не победить и что делать вместо этого: снижать вероятность, сужать радиус поражения, быстро обнаруживать. любой текст, который читает модель и на который может повлиять кто-то посторонний, — недоверенный ввод, а работающие защиты живут вне промпта.',
    },
    href: '/learn/injection',
  },
  {
    id: 'evaluation',
    kind: 'lesson',
    title: {
      en: 'Testing a prompt like code',
      ru: 'Как тестировать промпт как код',
    },
    keywords: {
      en: 'twenty to fifty real cases, a rubric judge with the bias controls on, and a regression run every time the model moves. a prompt without an eval set is a guess that happened to work the last time you looked at it.',
      ru: 'от двадцати до пятидесяти реальных кейсов, судья с рубрикой и контролем смещений, регрессионный прогон при каждой смене модели. промпт без набора тестов — это догадка, которая случайно сработала в тот раз, когда вы на неё посмотрели.',
    },
    href: '/learn/evaluation',
  },
  {
    id: 'decomposition',
    kind: 'lesson',
    title: {
      en: 'Chaining beats one giant prompt',
      ru: 'Цепочка лучше одного огромного промпта',
    },
    keywords: {
      en: 'split so every step can be inspected and fixed on its own. split a prompt where you would want to read the intermediate result; everywhere else, splitting only adds latency.',
      ru: 'разбивайте так, чтобы каждый шаг можно было проверить и починить отдельно. разбивайте промпт там, где вы захотели бы прочитать промежуточный результат; в остальных местах разбиение добавляет только задержку.',
    },
    href: '/learn/decomposition',
  },
  {
    id: 'agents',
    kind: 'lesson',
    title: {
      en: 'Tools, and prompts that survive a loop',
      ru: 'Инструменты и промпты, которые переживают цикл',
    },
    keywords: {
      en: 'in an agent, the tool definitions are most of the prompt. fix the tool interface before you add a rule to the system prompt — the description sits where the decision is made.',
      ru: 'в агенте определения инструментов — это и есть большая часть промпта. чините интерфейс инструмента раньше, чем добавляете правило в системный промпт: описание стоит там, где принимается решение.',
    },
    href: '/learn/agents',
  },
  {
    id: 'cost',
    kind: 'lesson',
    title: {
      en: 'What a prompt costs',
      ru: 'Сколько стоит промпт',
    },
    keywords: {
      en: 'output tokens, cache misses, and the model you did not need. output is priced around five times input, so bounding the answer saves more than any rewrite of the question.',
      ru: 'токены вывода, промахи кеша и модель, которая была не нужна. вывод стоит примерно впятеро дороже ввода, поэтому ограничение ответа экономит больше, чем любая правка вопроса.',
    },
    href: '/learn/cost',
  },
  {
    id: 'iteration',
    kind: 'lesson',
    title: {
      en: 'Iterating on evidence, not vibes',
      ru: 'Итерации по фактам, а не по ощущениям',
    },
    keywords: {
      en: 'one change, one measurement, keep or revert — and how to tell when the fix is not wording at all. an edit you did not measure on the same inputs is not an improvement, it is a preference.',
      ru: 'одно изменение, одно измерение, оставить или откатить — и как понять, что дело вообще не в формулировке. правка, не измеренная на тех же входах, — это не улучшение, а вкусовщина.',
    },
    href: '/learn/iteration',
  },
  {
    id: 'meta-prompting',
    kind: 'lesson',
    title: {
      en: 'Using a model to write your prompts',
      ru: 'Модель, которая пишет промпты за вас',
    },
    keywords: {
      en: 'models are good at finding what your prompt fails to say. they cannot know what you wanted. a model can find the holes in your prompt; only you can define the score it should be optimised against.',
      ru: 'модель хорошо находит то, чего в промпте не сказано. чего вы хотели — она не знает. модель найдёт дыры в промпте; задать метрику, по которой его улучшают, можете только вы.',
    },
    href: '/learn/meta-prompting',
  },
  {
    id: 'production',
    kind: 'lesson',
    title: {
      en: 'Prompts in production',
      ru: 'Промпты в продакшене',
    },
    keywords: {
      en: 'version it like code, pin the model id, and log which prompt version produced which output. if you cannot say which prompt version and which model produced an output, you do not have a production system, you have a demo.',
      ru: 'версионируйте как код, фиксируйте id модели и логируйте, какая версия промпта дала какой ответ. если вы не можете сказать, какая версия промпта и какая модель дали этот ответ, у вас не продакшен, а демо.',
    },
    href: '/learn/production',
  },
  {
    id: 'task-first',
    kind: 'pattern',
    title: {
      en: 'Task first',
      ru: 'Задача первой строкой',
    },
    keywords: {
      en: 'task-first framing clarity structure basics open with the operation to perform; everything else is support material.',
      ru: 'task-first framing clarity structure basics начинайте с операции, которую нужно выполнить; всё остальное — вспомогательный материал.',
    },
    href: '/patterns?p=task-first',
  },
  {
    id: 'success-criteria',
    kind: 'pattern',
    title: {
      en: 'Success criteria',
      ru: 'Критерии готовности',
    },
    keywords: {
      en: 'success-criteria framing criteria evaluation quality state how you will judge the output before the model produces it.',
      ru: 'success-criteria framing criteria evaluation quality опишите, по чему вы будете судить результат, до того как модель его выдаст.',
    },
    href: '/patterns?p=success-criteria',
  },
  {
    id: 'positive-instruction',
    kind: 'pattern',
    title: {
      en: 'Say what to do',
      ru: 'Говорите, что делать',
    },
    keywords: {
      en: 'positive-instruction framing instructions clarity behavior name the target behavior instead of listing what to avoid.',
      ru: 'positive-instruction framing instructions clarity behavior называйте нужное поведение вместо перечисления запретов.',
    },
    href: '/patterns?p=positive-instruction',
  },
  {
    id: 'audience-spec',
    kind: 'pattern',
    title: {
      en: 'Name the reader',
      ru: 'Назовите читателя',
    },
    keywords: {
      en: 'audience-spec framing audience tone register specify who reads the output; register, depth, and jargon follow from it.',
      ru: 'audience-spec framing audience tone register укажите, кто читает результат, — регистр, глубина и терминология следуют из этого.',
    },
    href: '/patterns?p=audience-spec',
  },
  {
    id: 'goal-statement',
    kind: 'pattern',
    title: {
      en: 'State the goal',
      ru: 'Сформулируйте цель',
    },
    keywords: {
      en: 'goal-statement framing intent underspecification agents say what the output is for, so the model resolves gaps in your favour.',
      ru: 'goal-statement framing intent underspecification agents скажите, для чего нужен результат, — тогда модель закроет пробелы в вашу пользу.',
    },
    href: '/patterns?p=goal-statement',
  },
  {
    id: 'sectioned-prompt',
    kind: 'pattern',
    title: {
      en: 'Sectioned prompt',
      ru: 'Промпт по секциям',
    },
    keywords: {
      en: 'sectioned-prompt structure sections markdown organization split the prompt into a few labeled sections and stop at diminishing returns.',
      ru: 'sectioned-prompt structure sections markdown organization разбейте промпт на несколько именованных секций и остановитесь там, где отдача падает.',
    },
    href: '/patterns?p=sectioned-prompt',
  },
  {
    id: 'delimited-input',
    kind: 'pattern',
    title: {
      en: 'Delimited input',
      ru: 'Огороженный ввод',
    },
    keywords: {
      en: 'delimited-input structure delimiters input injection fence user-supplied material so the model can tell data from instructions.',
      ru: 'delimited-input structure delimiters input injection отделяйте пользовательский материал, чтобы модель отличала данные от инструкций.',
    },
    href: '/patterns?p=delimited-input',
  },
  {
    id: 'documents-first',
    kind: 'pattern',
    title: {
      en: 'Documents first, question last',
      ru: 'Сначала документы, вопрос — последним',
    },
    keywords: {
      en: 'documents-first structure long-context ordering rag put long sources at the top of the prompt and the query at the bottom.',
      ru: 'documents-first structure long-context ordering rag длинные источники — в начало промпта, запрос — в конец.',
    },
    href: '/patterns?p=documents-first',
  },
  {
    id: 'output-contract',
    kind: 'pattern',
    title: {
      en: 'Output contract',
      ru: 'Контракт вывода',
    },
    keywords: {
      en: 'output-contract output format length verbosity state the container, the length, and what must not appear.',
      ru: 'output-contract output format length verbosity задайте форму, длину и то, чего в ответе быть не должно.',
    },
    href: '/patterns?p=output-contract',
  },
  {
    id: 'json-schema',
    kind: 'pattern',
    title: {
      en: 'Schema-constrained output',
      ru: 'Вывод по схеме',
    },
    keywords: {
      en: 'json-schema output json schema structured-outputs constrain machine-read output with a schema instead of asking nicely.',
      ru: 'json-schema output json schema structured-outputs ограничивайте машинно-читаемый вывод схемой, а не просьбами.',
    },
    href: '/patterns?p=json-schema',
  },
  {
    id: 'few-shot',
    kind: 'pattern',
    title: {
      en: 'Few-shot examples',
      ru: 'Few-shot примеры',
    },
    keywords: {
      en: 'few-shot examples few-shot format demonstration three to five examples that show the edge cases, not the average one.',
      ru: 'few-shot examples few-shot format demonstration три-пять примеров, которые показывают край, а не середину.',
    },
    href: '/patterns?p=few-shot',
  },
  {
    id: 'let-it-think',
    kind: 'pattern',
    title: {
      en: 'Let it think',
      ru: 'Дайте модели думать',
    },
    keywords: {
      en: 'let-it-think reasoning thinking defaults migration on reasoning models, leave thinking on and stop scripting the steps.',
      ru: 'let-it-think reasoning thinking defaults migration на reasoning-моделях оставьте рассуждение включённым и перестаньте расписывать шаги.',
    },
    href: '/patterns?p=let-it-think',
  },
  {
    id: 'chain-of-thought',
    kind: 'pattern',
    title: {
      en: 'Explicit chain of thought',
      ru: 'Явная цепочка рассуждений',
    },
    keywords: {
      en: 'chain-of-thought reasoning cot small-models math scripted step-by-step work, for the model tiers and task types where it still pays.',
      ru: 'chain-of-thought reasoning cot small-models math расписанные по шагам рассуждения — для тех классов моделей и задач, где они ещё окупаются.',
    },
    href: '/patterns?p=chain-of-thought',
  },
  {
    id: 'calm-instruction',
    kind: 'pattern',
    title: {
      en: 'Calm instruction',
      ru: 'Спокойная инструкция',
    },
    keywords: {
      en: 'calm-instruction reliability instructions overtriggering conflicts write each rule once, in a neutral voice, with its scope; shouting causes overtriggering.',
      ru: 'calm-instruction reliability instructions overtriggering conflicts пишите каждое правило один раз, нейтрально и с областью применения: крик вызывает срабатывания невпопад.',
    },
    href: '/patterns?p=calm-instruction',
  },
  {
    id: 'thin-prompt',
    kind: 'pattern',
    title: {
      en: 'Thin the prompt',
      ru: 'Похудение промпта',
    },
    keywords: {
      en: 'thin-prompt efficiency system-prompt tokens pruning delete instructions until the eval moves; put the weight in context and artifacts.',
      ru: 'thin-prompt efficiency system-prompt tokens pruning удаляйте инструкции, пока не просядет eval; вес переносите в контекст и артефакты.',
    },
    href: '/patterns?p=thin-prompt',
  },
  {
    id: 'role-when-it-helps',
    kind: 'pattern',
    title: {
      en: 'Role, only when it helps',
      ru: 'Роль — только когда она работает',
    },
    keywords: {
      en: 'role-when-it-helps framing persona role conventions use a role to select vocabulary and defaults, not as an accuracy boost.',
      ru: 'role-when-it-helps framing persona role conventions роль нужна для выбора лексики и умолчаний, а не для прироста точности.',
    },
    href: '/patterns?p=role-when-it-helps',
  },
  {
    id: 'data-boundary',
    kind: 'pattern',
    title: {
      en: 'Data boundary',
      ru: 'Граница данных',
    },
    keywords: {
      en: 'data-boundary reliability security injection agents tools deliver untrusted content through tool results, json-encoded, behind least privilege.',
      ru: 'data-boundary reliability security injection agents tools передавайте недоверенный контент только через tool_result, в json-экранированном виде и с минимальными правами.',
    },
    href: '/patterns?p=data-boundary',
  },
  {
    id: 'permission-to-fail',
    kind: 'pattern',
    title: {
      en: 'Permission to fail',
      ru: 'Право не знать',
    },
    keywords: {
      en: 'permission-to-fail reliability hallucination abstention grounding give the model a legal way to say the answer is not there.',
      ru: 'permission-to-fail reliability hallucination abstention grounding дайте модели легальный способ сказать, что ответа нет.',
    },
    href: '/patterns?p=permission-to-fail',
  },
  {
    id: 'grounded-answer',
    kind: 'pattern',
    title: {
      en: 'Grounded answer',
      ru: 'Ответ с опорой на источники',
    },
    keywords: {
      en: 'grounded-answer reliability grounding rag citations restrict the answer to the supplied documents and require a quote per claim.',
      ru: 'grounded-answer reliability grounding rag citations ограничьте ответ переданными документами и требуйте цитату под каждое утверждение.',
    },
    href: '/patterns?p=grounded-answer',
  },
  {
    id: 'prompt-chaining',
    kind: 'pattern',
    title: {
      en: 'Prompt chaining',
      ru: 'Цепочка промптов',
    },
    keywords: {
      en: 'prompt-chaining workflow chaining pipeline decomposition split one overloaded prompt into steps with a checkable handoff between them.',
      ru: 'prompt-chaining workflow chaining pipeline decomposition разбейте перегруженный промпт на шаги с проверяемой передачей между ними.',
    },
    href: '/patterns?p=prompt-chaining',
  },
  {
    id: 'negative-examples',
    kind: 'pattern',
    title: {
      en: 'Contrast pair',
      ru: 'Пара «отклонено — принято»',
    },
    keywords: {
      en: 'negative-examples examples contrast failure-modes correction pair a rejected output with the accepted one and name the single difference.',
      ru: 'negative-examples examples contrast failure-modes correction поставьте рядом отклонённый и принятый вариант и назовите единственное отличие.',
    },
    href: '/patterns?p=negative-examples',
  },
  {
    id: 'quote-then-answer',
    kind: 'pattern',
    title: {
      en: 'Quote, then answer',
      ru: 'Сначала цитаты, потом ответ',
    },
    keywords: {
      en: 'quote-then-answer reliability quotes long-context grounding extract verbatim passages first, then answer only from the extracted set.',
      ru: 'quote-then-answer reliability quotes long-context grounding сначала выпишите дословные фрагменты, затем отвечайте только по ним.',
    },
    href: '/patterns?p=quote-then-answer',
  },
  {
    id: 'think-first-format-later',
    kind: 'pattern',
    title: {
      en: 'Think first, format later',
      ru: 'Сначала думать, потом форматировать',
    },
    keywords: {
      en: 'think-first-format-later reasoning structured-outputs json two-phase reason in free text, then emit the structure as a separate step.',
      ru: 'think-first-format-later reasoning structured-outputs json two-phase рассуждайте свободным текстом, а структуру выдавайте отдельным шагом.',
    },
    href: '/patterns?p=think-first-format-later',
  },
  {
    id: 'enum-constrained-tool',
    kind: 'pattern',
    title: {
      en: 'Enum-constrained tool',
      ru: 'Инструмент с enum-выбором',
    },
    keywords: {
      en: 'enum-constrained-tool output tools enum classification make the model pick from a typed set instead of writing the choice in prose.',
      ru: 'enum-constrained-tool output tools enum classification пусть модель выбирает из типизированного набора, а не описывает выбор словами.',
    },
    href: '/patterns?p=enum-constrained-tool',
  },
  {
    id: 'rubric-judge',
    kind: 'pattern',
    title: {
      en: 'Rubric judge',
      ru: 'Оценка по рубрике',
    },
    keywords: {
      en: 'rubric-judge workflow evaluation llm-judge rubric score outputs against an explicit rubric with anchored levels, one dimension at a time.',
      ru: 'rubric-judge workflow evaluation llm-judge rubric оценивайте вывод по явной рубрике с закреплёнными уровнями, по одному измерению за раз.',
    },
    href: '/patterns?p=rubric-judge',
  },
  {
    id: 'spec-and-eval',
    kind: 'pattern',
    title: {
      en: 'Spec and eval first',
      ru: 'Сначала спецификация и eval',
    },
    keywords: {
      en: 'spec-and-eval workflow evals testing regression write the eval set before the prompt; the prompt is whatever passes it.',
      ru: 'spec-and-eval workflow evals testing regression сначала соберите eval-набор, потом промпт: промпт — это то, что его проходит.',
    },
    href: '/patterns?p=spec-and-eval',
  },
  {
    id: 'tool-description-as-prompt',
    kind: 'pattern',
    title: {
      en: 'Tool description as prompt',
      ru: 'Описание инструмента как промпт',
    },
    keywords: {
      en: 'tool-description-as-prompt workflow tools agents descriptions the tool description is prompt real estate; write it with the same care.',
      ru: 'tool-description-as-prompt workflow tools agents descriptions описание инструмента — это часть промпта; пишите его так же тщательно.',
    },
    href: '/patterns?p=tool-description-as-prompt',
  },
  {
    id: 'stable-cache-prefix',
    kind: 'pattern',
    title: {
      en: 'Stable cache prefix',
      ru: 'Стабильный префикс для кеша',
    },
    keywords: {
      en: 'stable-cache-prefix efficiency caching latency cost keep the invariant part of the prompt byte-identical and at the front.',
      ru: 'stable-cache-prefix efficiency caching latency cost держите неизменную часть промпта побайтово одинаковой и в начале.',
    },
    href: '/patterns?p=stable-cache-prefix',
  },
  {
    id: 'progressive-disclosure',
    kind: 'pattern',
    title: {
      en: 'Progressive disclosure',
      ru: 'Подгрузка по мере надобности',
    },
    keywords: {
      en: 'progressive-disclosure efficiency skills context agents load detail on demand instead of front-loading every procedure.',
      ru: 'progressive-disclosure efficiency skills context agents подгружайте детали по требованию вместо того, чтобы держать все процедуры в начале.',
    },
    href: '/patterns?p=progressive-disclosure',
  },
  {
    id: 'failure-taxonomy',
    kind: 'pattern',
    title: {
      en: 'Failure taxonomy',
      ru: 'Таксономия отказов',
    },
    keywords: {
      en: 'failure-taxonomy reliability errors edge-cases robustness enumerate the ways the task can fail and give each one a defined output.',
      ru: 'failure-taxonomy reliability errors edge-cases robustness перечислите способы, которыми задача может провалиться, и задайте каждому свой вывод.',
    },
    href: '/patterns?p=failure-taxonomy',
  },
]

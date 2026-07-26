import type { Locale } from '@/i18n/types.ts'

/**
 * Demo prompts for the Lab. Each one exists to make a specific set of rules
 * fire, so a first-time visitor sees the analyzer do something real before
 * they have written anything of their own.
 */
export const SAMPLES: Record<'vague' | 'wall' | 'good', Record<Locale, string>> = {
  vague: {
    en: 'Please improve this text and make it more professional and engaging. Add some examples if possible. Thanks!',
    ru: 'Пожалуйста, улучши этот текст и сделай его более профессиональным и интересным. Добавь несколько примеров, если можно. Спасибо!',
  },

  wall: {
    en: `CRITICAL: you MUST read the following customer email and figure out what they are complaining about and then write a reply that we can send back and it should be professional but also friendly and it needs to be comprehensive but keep it brief, and double-check your answer before responding because this is extremely important!! Think step by step. Here is the email: Hi, I ordered the standard plan three weeks ago and I was charged twice, once on the 3rd and once on the 5th, and I have emailed twice already with no reply, the ticket number is 88421 and my account email is jordan.reyes@example.com, at this point I would like a refund of the duplicate charge and some kind of explanation for why nobody has responded, otherwise I will be disputing the charge with my bank on Friday.`,
    ru: `КРИТИЧЕСКИ ВАЖНО: ты ОБЯЗАН прочитать следующее письмо клиента и понять, на что он жалуется, а потом написать ответ, который мы сможем отправить, и он должен быть профессиональным, но при этом дружелюбным, и исчерпывающим, но кратким, и перепроверь свой ответ перед отправкой, потому что это крайне важно!! Думай шаг за шагом. Вот письмо: Здравствуйте, я оформил стандартный тариф три недели назад, и с меня списали дважды — 3-го и 5-го числа, я уже дважды писал без ответа, номер обращения 88421, почта аккаунта jordan.reyes@example.com, на этом этапе я хотел бы возврат дублирующего списания и объяснение, почему никто не ответил, иначе в пятницу я оспорю списание через банк.`,
  },

  good: {
    en: `# Task
Classify each support ticket into exactly one category.

# Categories
billing · technical · account · other

# Examples
<examples>
<example>"I was charged twice this month" → billing</example>
<example>"The export button does nothing in Safari" → technical</example>
<example>"I need to change the email on my login" → account</example>
<example>"Do you sponsor conferences?" → other</example>
</examples>

# Rules
- If a ticket touches two categories, pick the one the customer wants resolved first.
- If none of the four fit, return other. Do not invent a category.

# Output
Return a JSON array. Each element is {"id": string, "category": string}. No other text.

# Tickets
<tickets>
1041: "Charged 29 twice on the 3rd, want one back"
1042: "SSO login loops forever on Firefox 141"
1043: "Can I get an invoice with our VAT number on it?"
</tickets>`,
    ru: `# Задача
Отнеси каждое обращение в поддержку ровно к одной категории.

# Категории
billing · technical · account · other

# Примеры
<examples>
<example>«С меня списали дважды в этом месяце» → billing</example>
<example>«Кнопка экспорта не работает в Safari» → technical</example>
<example>«Нужно поменять почту для входа» → account</example>
<example>«Вы спонсируете конференции?» → other</example>
</examples>

# Правила
- Если обращение затрагивает две категории, выбери ту, которую клиент хочет решить первой.
- Если не подходит ни одна из четырёх, верни other. Не придумывай категорию.

# Формат ответа
Верни JSON-массив. Каждый элемент — {"id": string, "category": string}. Никакого другого текста.

# Обращения
<tickets>
1041: «Списали 29 дважды 3-го числа, хочу вернуть одно»
1042: «Вход по SSO зацикливается в Firefox 141»
1043: «Можно счёт с нашим НДС-номером?»
</tickets>`,
  },
}

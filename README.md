# Prompt God

**Learn to write prompts that actually work — for Claude, GPT, Gemini, Llama and every other model you use.**

[prompt-god.bossincrypto.dev](https://prompt-god.bossincrypto.dev)

An offline-first PWA that teaches prompt engineering as it stands in 2026, not as it stood in 2023.
No account, no server, no analytics. Everything runs in your browser.

---

## Why this exists

Most prompt-engineering material still teaches techniques that current frontier models have
absorbed or actively penalise. Two things changed, and both are documented by the vendors
themselves:

- **Anthropic** removed over 80% of Claude Code's system prompt for Claude Opus 5 and Fable 5
  "with no measurable loss" on coding evaluations.
- **OpenAI** reports internal coding-agent evals where leaner system prompts scored roughly
  10–15% higher while cutting tokens by 41–66%.

Meanwhile "think step by step" is now explicitly discouraged on reasoning models, prefilling the
assistant turn returns a 400 on Claude 4.6+, `CRITICAL: you MUST` causes overtriggering rather than
compliance, and telling Opus 5 to double-check its work makes the answer worse.

This app teaches what replaced all of that.

## What's in it

|                     |                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Course**          | 19 lessons across 6 tracks, beginner to production. Every lesson ends in a graded exercise, not a quiz.                 |
| **Prompt Lab**      | A deterministic analyzer: paste a prompt, get a scored critique. 46 rules, 9 categories, model-aware, ~0.6 ms per pass. |
| **Pattern library** | 30 named techniques, each with the cases it helps, the cases it hurts, and a fill-in template.                          |
| **Model matrix**    | What actually changes when you switch families — verified against vendor docs.                                          |
| **Progress**        | XP, streaks, achievements and spaced repetition, stored only in your browser.                                           |

Everything is bilingual — English and Russian — including the analyzer, which detects the prompt's
language and applies the matching rule set.

### The analyzer

The Lab does not call a model. It runs a rules engine over the prompt text — a
median of 0.6 ms per pass on a 780-character prompt, 5.9 ms on a 16,000-character
one. The one-off cost of compiling the pattern set is paid in an idle callback
when the Lab mounts, not on the user's first keystroke.

The nine categories:

- **Clarity** — vague verbs, undefined quality adjectives, hedging, self-contradiction
- **Context** — missing audience or purpose, unfilled placeholders, references to context the model
  cannot have
- **Structure** — walls of text, data not separated from instructions, the query placed before a
  long document
- **Output** — no format contract, no length bound, JSON requested without a schema
- **Examples** — pattern tasks with no examples, undelimited example sets
- **Reasoning** — explicit chain-of-thought on a model that already reasons internally
- **Safety** — prompt-injection exposure, pasted credentials, no permission to say "I don't know"
- **Efficiency** — shouting, redundant verification instructions, rulebooks where a brief would do
- **Model fit** — prefill on a family that rejects it, sampling parameters that error

Rules are model-aware: `verification-instruction` fires for Claude and not for GPT, because the
vendor guidance differs. Where a figure could not be verified against a primary source — the GPT-5.6
context window, for instance — the rule that would act on it stays silent rather than guessing.

**Auto-improve** rewrites only what the engine can know is correct: it strips text current models
react badly to, fences pasted material as data, and appends complete clauses like a grounding rule.
It deliberately does _not_ invent fill-in slots for things only the author knows — those come back
as a checklist instead.

### Bring your own key (optional)

The Lab can run a prompt against a real model. Requests go from your browser straight to the
provider — there is no server in this project. The key is stored in IndexedDB on your device.

| Provider         | Browser reachability                            |
| ---------------- | ----------------------------------------------- |
| OpenRouter       | Designed for browser clients                    |
| Google AI Studio | Serves browser callers                          |
| Anthropic        | Works with an explicit opt-in header            |
| OpenAI           | Does not advertise browser CORS; may be blocked |

> A key stored in a browser can be read by anything that can run scripts on the page. Use a key with
> a spending cap and remove it when you are done. The app works fully without one.

## Running it

```bash
npm ci
npm run dev          # dev server
npm run verify       # lint + typecheck + tests + build + bundle budget
```

| Script           |                                                          |
| ---------------- | -------------------------------------------------------- |
| `npm run dev`    | Vite dev server                                          |
| `npm run build`  | Typecheck, then build                                    |
| `npm run test`   | Unit tests                                               |
| `npm run e2e`    | Playwright end-to-end tests                              |
| `npm run budget` | Fail if the first-load payload exceeded budget           |
| `npm run icons`  | Regenerate PWA icons and the OG card from the source SVG |

### Stack

Vite 8 (Rolldown) · React 19 · TypeScript 6 · Tailwind CSS 4 · vite-plugin-pwa 1.3 · Vitest 4 ·
Playwright 1.62.

Four runtime dependencies: `react`, `react-dom`, `zustand`, `idb`. The router, icon set, search,
diff and text analysis are all in-repo, which is why the first load is ~80 KB of JavaScript gzipped
rather than several hundred.

TypeScript is pinned to 6.0.3 rather than 7.x on purpose: `typescript-eslint` declares
`typescript: >=4.8.4 <6.1.0`, so TypeScript 7 would silently disable type-aware linting.

### Bundle budget

CI fails if the first load grows past budget. Lazily loaded routes, locales and content are excluded
because they never block first paint.

```
initial JS    ≤ 165 KB gzip
initial CSS   ≤  40 KB gzip
total JS      ≤ 900 KB gzip
```

## Content

Lessons, patterns and model notes are generated into typed TypeScript modules:

```bash
node scripts/build-content.mjs authored.json
```

The generated files are committed, not built at deploy time, so the content is type-checked against
`src/content/types.ts` on every `npm run typecheck` — a malformed lesson fails CI instead of
rendering as a blank page.

Every factual claim in the content was verified against vendor documentation on **2026-07-26**
(`VERIFIED_ON` in `src/engine/models.ts`). Model lineups change fast; check the vendor docs before
relying on a specific detail.

## Deployment

Pushing to `main` runs three workflows:

- **CI** — lint, format check, typecheck, unit tests with coverage, build, bundle budget, E2E
- **Deploy** — builds and publishes to GitHub Pages at `prompt-god.bossincrypto.dev`
- **Release** — release-please opens a release PR from conventional commits; merging it tags a
  release and attaches a self-contained `.tar.gz` and `.zip` of the built PWA

The site is served from a custom domain, so `base` is `/` and `404.html` is a copy of `index.html`
so client-side deep links resolve.

> Lighthouse removed its PWA category in v12, so there is no "PWA score" to chase. Installability is
> a manifest concern: HTTPS, a linked manifest with `name`, `start_url`, `display` and both 192px
> and 512px icons. The E2E suite asserts all of those.

## Privacy

There is no server. No account, no telemetry, no analytics, no cookies. Progress, prompt history and
any API key live in your browser's IndexedDB and localStorage, and **Settings → Erase everything**
removes all of it. The only network requests the app ever makes are the ones you trigger by adding
your own API key.

## Licence

MIT — see [LICENSE](LICENSE).

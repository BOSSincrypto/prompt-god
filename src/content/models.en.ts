// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/build-content.mjs <authored.json>
import type { ModelNote } from './types.ts'

export const modelNotes: ModelNote[] = [
  {
    family: 'claude',
    lineup: [
      'Claude Fable 5 (claude-fable-5)',
      'Claude Opus 5 (claude-opus-5)',
      'Claude Sonnet 5 (claude-sonnet-5)',
      'Claude Haiku 4.5 (claude-haiku-4-5)',
      'Claude Mythos 5 (invitation-only)',
    ],
    headline:
      'Prompting Claude 5 is mostly deletion — the models already think and self-verify, so instructions that used to carry the prompt now cause overtriggering.',
    strengths: [
      'Thinking is on by default on Opus 5 and Sonnet 5, and always on for Fable 5 — no scaffolding needed to get reasoning.',
      "Opus 5 self-verifies without being asked; Anthropic's guidance is to remove verification instructions rather than reword them.",
      '1M context across the 5-series, with a documented layout win: long documents at the top, query at the bottom.',
      "Anthropic removed over 80% of Claude Code's system prompt for Opus 5 and Fable 5 with no measurable loss on their coding evals — the lean direction is measured, not stylistic.",
    ],
    quirks: [
      {
        title: 'Prefilling the final assistant turn returns 400',
        body: 'Assistant prefill fails on Claude 4.6+ and all Claude 5. The replacements are structured outputs, enum-typed tools, or a plain instruction: "respond directly without preamble". Any prompt library that opens the answer with `{` or `Answer:` needs rewriting, not patching.',
      },
      {
        title: 'budget_tokens is gone; effort replaced it',
        body: 'budget_tokens returns 400 on Claude 4.7+. Use thinking:{type:"adaptive"} together with output_config.effort (low / medium / high / xhigh / max). This is a control-plane change, not a prompt change — but it breaks every request builder written before it.',
      },
      {
        title: 'Effort does not shorten visible output',
        body: 'Opus 5 is verbose by default, and lowering effort does not reliably make the answer shorter — it changes how much the model thinks, not how much it writes. If you need brevity, say it in the prompt: "Answer in at most 150 words, no preamble, no summary at the end."',
      },
      {
        title: 'Sonnet 5 rejects sampling parameters, and its tokenizer costs more',
        body: 'Sonnet 5 returns 400 for any non-default temperature, top_p or top_k. Separately, its new tokenizer produces roughly 30% more tokens for the same text — so context budgets and cost estimates carried over from earlier Sonnets are wrong even when the prompt is byte-identical.',
      },
      {
        title: 'Anti-laziness phrasing now overtriggers',
        body: '"CRITICAL: you MUST" and "if in doubt, use X" were compensations for older models. On Claude 5 they cause overtriggering: the model applies the rule where it does not belong. Drop the emphasis and state the condition precisely instead.',
      },
      {
        title: 'Fable 5 can refuse requests to expose its own reasoning',
        body: 'Ask Fable 5 to echo, quote or explain its internal reasoning and it can refuse under a reasoning_extraction category. If you need a rationale in the output, ask for a fresh written justification of the answer, which is a different thing from a transcript of the thinking.',
      },
    ],
    doThis: [
      'Start from the shortest prompt that states the task, the inputs and the constraints; add a line only when an eval failure demands it.',
      'Put long documents at the top and the question at the bottom — Anthropic reports up to 30% quality improvement on complex multi-document inputs.',
      'Deliver third-party content only inside tool_result blocks, JSON-encoded, and keep your own instructions out of tool results.',
      'When the output shape is hard to describe, show 3-5 examples — relevant, diverse, structured — as <example> blocks inside <examples>.',
      'State length explicitly whenever short output matters.',
    ],
    avoid: [
      "Heavy XML scaffolding and role-play personas — Anthropic's 2026 guidance lists both as outdated techniques.",
      'Telling Opus 5 to double-check, verify or review its own work.',
      'Assistant prefill and budget_tokens — both now return 400.',
      'Combining citations:{enabled:true} with output_config.format; citations and structured outputs are incompatible and the request returns 400.',
      'Padding a prompt to "be safe" — the stated principle is the minimum necessary structure that hits your goal reliably.',
    ],
  },
  {
    family: 'gpt',
    lineup: ['gpt-5.6 (alias -> gpt-5.6-sol)', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna'],
    headline:
      'GPT-5.6 is a reasoning-first family where instruction hierarchy and internal consistency matter more than any technique — a contradiction is paid for in reasoning tokens.',
    strengths: [
      "Developer messages are prioritized ahead of user messages, giving you a clean split between durable policy and per-request input. The docs' analogy: developer message = function definition, user message = arguments.",
      'reasoning.effort spans none through max, so a single model covers cheap extraction and hard multi-step work.',
      'Structured Outputs is strict and precisely specified, which makes machine-readable output a schema problem rather than a prompting problem.',
      'There is no separate o-series left in the catalog — one family, one routing decision.',
    ],
    quirks: [
      {
        title: 'Contradictions are unusually expensive',
        body: 'The docs state that contradictory instructions are more damaging to GPT-5 than to other models, because it expends reasoning tokens searching for a way to reconcile them rather than picking one at random. "Be concise" plus "be thorough" is not a nuance — it is a cost. Audit the whole developer message for conflicts before adding to it.',
      },
      {
        title: 'Chain-of-thought prompts are discouraged',
        body: "Verbatim from the docs: \"Avoid chain-of-thought prompts: Since these models perform reasoning internally, prompting them to 'think step by step' or 'explain your reasoning' is unnecessary.\" Caveat worth carrying: that page still references o3/o4-mini, so treat it as directionally current rather than freshly reaffirmed for GPT-5.6.",
      },
      {
        title: 'effort defaults to medium; "pro" is a mode, not a model',
        body: 'reasoning.effort defaults to medium, so anything you never set is silently paying for mid-tier reasoning. reasoning.mode:"pro" is an execution mode on the same models — do not write prompts, docs or routing tables that refer to "the pro model".',
      },
      {
        title: 'Structured Outputs has hard schema limits',
        body: 'The root must be an object, additionalProperties:false is required, and the ceilings are 5000 properties, 10 nesting levels and 1000 enum values. A schema that passes a generic JSON Schema validator can still be rejected here, so validate against these limits in CI rather than at request time.',
      },
      {
        title: 'Reusable prompt objects are being shut down',
        body: 'The v1/prompts reusable prompt objects were de-emphasized on 2026-06-03 and shut down on 2026-11-30. Prompts belong in version-controlled source next to their evals, not in a vendor-side registry that has an end date.',
      },
      {
        title: 'The docs moved host',
        body: 'Reference material now lives at developers.openai.com, not platform.openai.com. Cached snippets, bookmarked pages and older tutorials point at the previous host and can describe pre-reasoning-era behavior.',
      },
    ],
    doThis: [
      'Put durable policy in the developer message and per-request data in the user message; keep the split clean.',
      'Set reasoning.effort deliberately — none for extraction and routing, high or above only where an eval shows a gain.',
      'Resolve conflicts yourself: one rule per behavior, with exceptions stated inline rather than in a later paragraph.',
      'Constrain output with a strict JSON schema instead of prose formatting rules.',
      'Move prompts into version-controlled source before the v1/prompts shutdown date.',
    ],
    avoid: [
      '"Let\'s think step by step" and "explain your reasoning" — the docs call them unnecessary for these models.',
      'Stacking instructions that quietly contradict each other across different sections of the same prompt.',
      'Building anything new on v1/prompts.',
      'Copying recipes from tutorial sites — learnprompting.org and promptingguide.ai have not been updated for the reasoning-model era.',
      'Leaving effort unset and then reasoning about cost as if it were zero.',
    ],
  },
  {
    family: 'gemini',
    lineup: ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-pro-preview'],
    headline:
      'Gemini 3.x inverts two habits most codebases have baked in: leave temperature at 1.0, and replay thought signatures verbatim across turns.',
    strengths: [
      '1M context with a thinking_level control, so depth of reasoning is a request-level decision.',
      'A flash tier that stays cheap enough for high-volume classification and extraction.',
      'Reasoning state is explicit and portable across turns once you carry it correctly.',
    ],
    quirks: [
      {
        title: 'Leave temperature at 1.0',
        body: 'Gemini 3.x guidance is explicit: do not lower temperature — it causes looping. The reflex of setting temperature 0 for "deterministic" extraction actively degrades this family. Get determinism from schema and prompt structure instead.',
      },
      {
        title: 'Thought signatures must be replayed verbatim',
        body: 'Multi-turn reasoning depends on thought signatures being sent back unchanged. History-trimming, message-rewriting and generic conversation stores are the usual place this breaks — the prompt looks fine and the behavior quietly degrades.',
      },
      {
        title: 'thinking_level defaults vary by model',
        body: 'Defaults are not the same across gemini-3.6-flash, gemini-3.5-flash and gemini-3.1-pro-preview. If behavior has to be comparable when you switch models, set thinking_level explicitly rather than inheriting whatever the endpoint decides.',
      },
      {
        title: 'Knowledge cutoff is January 2025',
        body: 'Anything after January 2025 has to be supplied in the prompt. That includes model lineups, pricing and API surfaces of other vendors — which is exactly the kind of thing people ask a model to reason about and then trust.',
      },
      {
        title: 'Input and output budgets are asymmetric',
        body: '1M in, roughly 64k out. A prompt that legitimately fits the window can still request more output than the model can emit, so long generations need to be chunked by section with the structure decided in advance.',
      },
    ],
    doThis: [
      'Set thinking_level explicitly on every route you care about.',
      'Carry thought signatures through your conversation store untouched, and add a test that asserts they survive a trim.',
      'Supply any post-January-2025 fact in the prompt rather than assuming the model knows it.',
      'Place long source material before the question, and plan output in sections that fit the output ceiling.',
    ],
    avoid: [
      'Setting temperature below 1.0 for "more reliable" output — it causes looping.',
      'Dropping or summarizing thought signatures when compacting history.',
      "Assuming a 1M window means the model attends to it uniformly — Chroma's Context Rot study across 18 models found otherwise.",
      'Requesting a single response longer than the output ceiling allows.',
    ],
  },
  {
    family: 'llama',
    lineup: ['Llama 4 Scout (10M ctx)', 'Llama 4 Maverick (1M ctx)'],
    headline:
      'Llama 4 is open weights, so the prompt is only half the input — the chat template and its special tokens are the other half, and they changed from Llama 3.x.',
    strengths: [
      'Self-hosted: no API-side parameter restrictions, no deprecation clock, full control over sampling.',
      'Scout offers 10M context and Maverick 1M — room for whole repositories or corpora in one pass.',
      'Classic technique still pays here: chain-of-thought and few-shot deliver real gains at this tier, unlike on frontier reasoning models.',
    ],
    quirks: [
      {
        title: 'Llama 4 special tokens differ from Llama 3.x',
        body: 'Llama 4 uses <|begin_of_text|>, <|header_start|>, <|header_end|> and <|eot|>. A Llama 3.x template applied to Llama 4 weights does not error — it silently misformats the conversation and you spend a day blaming the prompt.',
      },
      {
        title: 'Hand-writing tokens is the top local failure mode',
        body: 'Use apply_chat_template. Every hand-assembled prompt string is a copy of the template that will drift when the template updates, and format drift on open weights shows up as vague quality loss rather than a clean error.',
      },
      {
        title: 'There is no Llama 5',
        body: 'As of July 2026 the newest open-weights generation is still Llama 4, released April 2025. "Llama 5" claims circulating online have no primary source. Do not write prompts, configs or docs against a model that does not exist.',
      },
      {
        title: 'The lean-prompt thesis does not transfer here unchanged',
        body: 'Technique value is model-tier dependent. Stripping examples and reasoning instructions out of a Llama 4 prompt because "lean wins on Opus 5" removes support the model actually uses. Port prompts across tiers with an eval, not by analogy.',
      },
      {
        title: '10M context is capacity, not attention',
        body: "Chroma's Context Rot study across 18 models found context is not used uniformly across its length. Scout's window lets you load a corpus; it does not promise the middle of it will be weighed like the edges. Retrieve, then place the retrieved material next to the question.",
      },
    ],
    doThis: [
      'Call apply_chat_template from the tokenizer shipped with the exact weights you are running.',
      'Pin the template version alongside the weights in your deployment manifest.',
      'Use 3-5 examples when output shape matters — relevant, diverse, structured.',
      'Use explicit chain-of-thought for symbolic and mathematical work: "To CoT or not to CoT" measured +14.2% on symbolic reasoning and +12.3% on math, against +0.7% on everything else.',
      'Retrieve into the window rather than dumping the whole corpus because it fits.',
    ],
    avoid: [
      'Hand-assembled prompt strings with literal special tokens.',
      'Llama 3.x tokens on Llama 4 weights.',
      'Targeting a "Llama 5" that has no primary source.',
      'Porting a frontier-lean prompt unchanged and concluding the model got worse.',
      'Treating the full context window as uniformly usable.',
    ],
  },
  {
    family: 'mistral',
    lineup: ['Mistral Medium 3.5', 'Mistral Small 4', 'Mistral Large 3', 'Ministral 3'],
    headline:
      'Mistral gives you a binary reasoning switch and a chunked response — write for reasoning_effort high or none, and keep ThinkChunk out of what the user sees.',
    strengths: [
      'A full tier ladder from Ministral 3 up to Large 3, so cost and capability are a routing decision within one vendor.',
      'Reasoning is an explicit request parameter rather than an emergent property of phrasing.',
      'Responses separate ThinkChunk from TextChunk, so you never have to regex reasoning out of the answer.',
    ],
    quirks: [
      {
        title: 'reasoning_effort is high or none — nothing in between',
        body: "Unlike Claude's five levels or OpenAI's six, Mistral gives you a binary. There is no dial to nudge, so the decision is made per task class up front: reasoning tasks get high, extraction and routing get none.",
      },
      {
        title: 'ThinkChunk and TextChunk arrive together',
        body: "A response carries both. Any consumer that concatenates all chunks — a naive streaming handler, a logger, a copy-paste of another vendor's client — leaks internal reasoning into the user-facing answer. Render TextChunk only.",
      },
      {
        title: 'Small members need the classic techniques',
        body: 'Ministral 3 and Small 4 are not frontier reasoning models. Few-shot examples and explicit chain-of-thought do real work at this tier — research shows technique value is model-tier dependent, and the 2026 lean-prompt thesis was measured on frontier models.',
      },
      {
        title: 'A prompt tuned on Large 3 is not validated on Small 4',
        body: 'The ladder is convenient enough that teams route down for cost without re-testing. The lean prompt that works on Large 3 loses the scaffolding Small 4 depends on, and the failure shows up as slightly worse answers rather than errors.',
      },
    ],
    doThis: [
      'Choose reasoning_effort by task class, and record the choice next to the prompt so it is reviewable.',
      'Render TextChunk to users and keep ThinkChunk in logs only.',
      'Keep 3-5 few-shot examples in prompts aimed at Ministral 3 and Small 4.',
      'Re-run your eval set whenever you route a prompt to a different tier.',
    ],
    avoid: [
      'Assuming a medium reasoning setting exists.',
      'Concatenating all response chunks into the user-visible answer.',
      'Stripping examples from small-model prompts because lean prompts win on frontier models.',
      'Asking the model to explain reasoning it already returns as ThinkChunk.',
      'Routing down a tier for cost without re-running evals.',
    ],
  },
  {
    family: 'deepseek',
    lineup: ['deepseek-v4-pro', 'deepseek-v4-flash'],
    headline:
      'DeepSeek v4 just retired the model ids everyone hardcoded, and its 384K output ceiling makes it a long-generation engine rather than a chat model.',
    strengths: [
      '1M context paired with up to 384K output — you can generate a whole document in one call instead of chunking and stitching.',
      'Two clear tiers, pro and flash, with no legacy variants left to reason about.',
      'The long output ceiling removes a whole class of orchestration code.',
    ],
    quirks: [
      {
        title: 'deepseek-chat and deepseek-reasoner were retired on 2026-07-24',
        body: 'Those two ids are gone as of two days ago. Any prompt library, config file, notebook or blog snippet referencing them is broken now, not eventually. Grep for both across your repos before anything else.',
      },
      {
        title: '384K output changes the prompt, not just the plumbing',
        body: 'Capacity for a very long answer does not produce one. Without an explicit target — section list, approximate length per section, what counts as complete — you get a normally sized response and conclude the ceiling is marketing.',
      },
      {
        title: 'Long generation is the one place more prompt is better',
        body: 'The 2026 lean-prompt thesis is about instructions, not about specification. For a 100-page output you still put the outline, per-section scope and stop conditions in the prompt up front — that is artifact and context, which the same framework calls thick.',
      },
      {
        title: 'A 1M window is not uniformly attended',
        body: "Chroma's Context Rot study across 18 models found context is not used uniformly across its length. With both a huge input and a huge output, the risk compounds: the model can lose the constraint stated 800K tokens ago by page 40 of the answer.",
      },
      {
        title: 'Quality degrades along the generation, not at the start',
        body: 'Reviewing the first two pages of a 200-page output tells you almost nothing. Sample the middle and the end, and check whether the constraints from the prompt still hold there.',
      },
    ],
    doThis: [
      'Pin deepseek-v4-pro or deepseek-v4-flash explicitly and remove every reference to the retired ids.',
      'State the output structure and approximate length before asking for a long generation.',
      'Put long source documents at the top and the instruction at the bottom.',
      'Evaluate the tail of long outputs, not the head.',
      'Restate hard constraints near the end of the prompt so they sit close to where generation starts.',
    ],
    avoid: [
      'Model aliases from the v3 era — they no longer resolve.',
      'Unbounded requests like "write the full report" with no structure or length.',
      'Assuming a 1M window is uniformly attended.',
      'Keeping chunk-and-stitch pipelines you no longer need, and paying their consistency cost.',
      'Judging a long generation by its opening pages.',
    ],
  },
  {
    family: 'qwen',
    lineup: [
      'qwen3.7-max',
      'qwen3.7-plus',
      'qwen3.6-flash',
      'Qwen3.6 (open weights)',
      'Qwen3.5 (open weights)',
    ],
    headline:
      'Qwen thinks by default and is the one major family that wants reasoning stripped out of history rather than replayed into it.',
    strengths: [
      'Commercial endpoints and open weights come from the same family, so you can prototype hosted and deploy self-hosted without changing vendor.',
      'Thinking is on by default — no instruction needed to get reasoning.',
      'A flash tier keeps high-volume classification and extraction affordable.',
    ],
    quirks: [
      {
        title: 'Strip <think> blocks from history — the inverse of every other vendor',
        body: 'Gemini requires thought signatures replayed verbatim; Claude and others carry reasoning state forward. Qwen wants <think> blocks removed from conversation history. One shared history serializer across vendors will be wrong for at least one of them — branch it explicitly.',
      },
      {
        title: 'Thinking is on by default',
        body: 'Adding "think step by step" gains nothing and pushes the model toward emitting reasoning you then have to strip. Spend the prompt budget on the task specification instead.',
      },
      {
        title: 'Open-weights members need apply_chat_template',
        body: 'Qwen3.5 and Qwen3.6 open weights follow the general open-model rule: use apply_chat_template from the tokenizer shipped with the weights. Hand-writing special tokens is the top local-model failure mode and it fails quietly.',
      },
      {
        title: 'Hosted and self-hosted members are not interchangeable',
        body: 'qwen3.7-plus and a self-hosted Qwen3.6 share a name and a lineage, not behavior. Moving a prompt between them is a model change and deserves a full eval run, not a config edit.',
      },
      {
        title: 'Reasoning leaks into output if you never handle it',
        body: 'Because thinking is on by default, a client that renders the raw response can show <think> content to users. Handle it once at the client boundary rather than per-prompt with instructions like "do not show your thinking".',
      },
    ],
    doThis: [
      'Strip <think> blocks before resubmitting conversation history.',
      'Branch history handling per vendor and cover the branch with a test.',
      'Use apply_chat_template for self-hosted Qwen3.5 and Qwen3.6.',
      'State the output format explicitly and filter reasoning at the client boundary.',
    ],
    avoid: [
      'Reusing a Gemini-style history serializer that replays reasoning state.',
      'Sending <think> blocks back in history.',
      'Adding chain-of-thought instructions to a model that already thinks by default.',
      'Assuming a hosted and a self-hosted member with similar version numbers behave the same.',
      'Hand-written special tokens on the open-weights members.',
    ],
  },
  {
    family: 'grok',
    lineup: ['grok-4.5 (500k ctx)', 'grok-4.3 (1M ctx)', 'grok-4.20 (1M ctx)'],
    headline:
      "Grok's reasoning models reject the sampling parameters most client wrappers send by default, and on grok-4.5 reasoning cannot be turned off at all.",
    strengths: [
      '1M context on grok-4.3 and grok-4.20 for large document and codebase work.',
      'Reasoning is always available on the flagship — no mode selection, no risk of silently running without it.',
      'A simple three-model lineup with a clear context tradeoff between members.',
    ],
    quirks: [
      {
        title: 'presencePenalty, frequencyPenalty and stop error on reasoning models',
        body: 'They do not degrade quietly — the request errors. Generic OpenAI-compatible wrappers that always send a full parameter block will fail on every call until you strip them per route.',
      },
      {
        title: 'grok-4.5 has no non-reasoning path',
        body: 'Reasoning cannot be disabled on the flagship. There is no cheap fast lane for classification or routing on that model — send those to grok-4.3 or grok-4.20, or to another family entirely.',
      },
      {
        title: 'The version number runs opposite to the context window',
        body: 'grok-4.5 has 500k context while grok-4.3 and grok-4.20 have 1M. Higher version, smaller window. Pick the model by what the workload needs, not by which number looks newest.',
      },
      {
        title: 'Output boundaries must come from the prompt, not from stop',
        body: 'With stop unavailable on reasoning routes, any pipeline that relied on a stop sequence to cut the response needs a different mechanism: a strict output schema, or an explicit instruction about what the last line is.',
      },
    ],
    doThis: [
      'Strip penalty and stop parameters on reasoning routes, in the client rather than per call site.',
      'Choose the model by context requirement first: 1M work goes to grok-4.3 or grok-4.20.',
      'Enforce output boundaries with a schema or an explicit format instruction.',
      'Route cheap high-volume tasks away from grok-4.5.',
      'Keep prompts lean — these are reasoning models and do not need thinking instructions.',
    ],
    avoid: [
      'A shared parameter block sent to every model regardless of family.',
      'Stop sequences as a control mechanism on reasoning routes.',
      'Assuming a higher version number means a bigger context window.',
      'Trying to get a fast non-reasoning response out of grok-4.5.',
      '"Think step by step" on models where reasoning cannot be disabled.',
    ],
  },
]

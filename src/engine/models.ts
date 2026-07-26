/**
 * Model-family profiles used by the analyzer.
 *
 * Only machine-readable behaviour lives here — the prose that explains each
 * family to a learner is in the per-locale content chunks, so this module
 * stays small enough to sit in the eagerly loaded analyzer bundle.
 *
 * Every field was checked against vendor documentation on the date in
 * VERIFIED_ON. Where a number could not be confirmed from a primary source it
 * is marked unverified rather than guessed, and the rules that would act on it
 * stay silent — a confident wrong "context overflow" is worse than no finding.
 */

export const VERIFIED_ON = '2026-07-26'

export const MODEL_FAMILIES = [
  'generic',
  'claude',
  'gpt',
  'gemini',
  'llama',
  'mistral',
  'deepseek',
  'qwen',
  'grok',
] as const

export type ModelFamilyId = (typeof MODEL_FAMILIES)[number]

export interface ModelProfile {
  id: ModelFamilyId
  vendor: string
  label: string

  /**
   * The family's current models reason internally before answering, so telling
   * them to "think step by step" adds tokens without adding quality — and on
   * some models actively hurts.
   */
  internalReasoning: boolean

  /** Whether prefilling the final assistant turn is accepted. */
  prefillSupported: boolean

  /** XML section tags are the vendor's own recommended structuring device. */
  xmlIdiomatic: boolean

  /** Native JSON-schema-constrained output is available. */
  structuredOutput: boolean

  /**
   * At least one sampling parameter is rejected, errors, or is documented as
   * harmful on the family's current flagships.
   */
  samplingParamsFixed: boolean

  /**
   * Self-verification is already default behaviour, so "double-check your
   * work" instructions cause over-verification rather than accuracy.
   */
  penalizeVerificationInstructions: boolean

  /** Vendor documents a measurable gain from putting long documents first. */
  longContextDocsFirst: boolean

  /** Largest context window offered by the family's current models, in tokens. */
  contextTokens: number

  /** False when `contextTokens` is a working assumption, not a checked figure. */
  contextVerified: boolean

  /** A dedicated system/developer role exists and is prioritised over user text. */
  systemRole: boolean

  docsUrl: string
}

const PROFILES: Record<ModelFamilyId, ModelProfile> = {
  generic: {
    id: 'generic',
    vendor: '—',
    label: 'Any model',
    internalReasoning: false,
    prefillSupported: true,
    xmlIdiomatic: false,
    structuredOutput: true,
    samplingParamsFixed: false,
    penalizeVerificationInstructions: false,
    longContextDocsFirst: true,
    contextTokens: 128_000,
    contextVerified: false,
    systemRole: true,
    docsUrl: '',
  },

  // Claude 5 family: Fable 5, Opus 5, Sonnet 5, plus Haiku 4.5.
  claude: {
    id: 'claude',
    vendor: 'Anthropic',
    label: 'Claude',
    internalReasoning: true,
    // Prefilling the final assistant turn returns 400 on 4.6+ and all of Claude 5.
    prefillSupported: false,
    xmlIdiomatic: true,
    structuredOutput: true,
    // Sonnet 5 rejects non-default temperature / top_p / top_k with a 400.
    samplingParamsFixed: true,
    // Opus 5 self-verifies by default; vendor guidance is to remove
    // verification instructions rather than reword them.
    penalizeVerificationInstructions: true,
    longContextDocsFirst: true,
    contextTokens: 1_000_000,
    contextVerified: true,
    systemRole: true,
    docsUrl:
      'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices',
  },

  // GPT-5.6 family (sol / terra / luna). Reasoning is a per-request dial.
  gpt: {
    id: 'gpt',
    vendor: 'OpenAI',
    label: 'GPT',
    internalReasoning: true,
    prefillSupported: false,
    xmlIdiomatic: false,
    structuredOutput: true,
    samplingParamsFixed: false,
    penalizeVerificationInstructions: false,
    longContextDocsFirst: true,
    // The GPT-5.6 context window is not stated on the pages checked; this is a
    // conservative placeholder and the overflow rule stays off because of it.
    contextTokens: 400_000,
    contextVerified: false,
    systemRole: true,
    docsUrl: 'https://developers.openai.com/api/docs/guides/prompt-engineering',
  },

  // Gemini 3.x: 3.6 Flash, 3.5 Flash / Flash-Lite, 3.1 Pro.
  gemini: {
    id: 'gemini',
    vendor: 'Google',
    label: 'Gemini',
    internalReasoning: true,
    prefillSupported: false,
    xmlIdiomatic: true,
    structuredOutput: true,
    // Gemini 3.x documents leaving temperature at 1.0 — lowering it causes
    // looping — and 3.5 Flash no longer recommends temperature/top_p/top_k.
    samplingParamsFixed: true,
    penalizeVerificationInstructions: false,
    longContextDocsFirst: true,
    contextTokens: 1_000_000,
    contextVerified: true,
    systemRole: true,
    docsUrl: 'https://ai.google.dev/gemini-api/docs/prompting-strategies',
  },

  // Llama 4 (Scout / Maverick) is still Meta's newest open-weights generation.
  llama: {
    id: 'llama',
    vendor: 'Meta',
    label: 'Llama',
    internalReasoning: false,
    prefillSupported: true,
    xmlIdiomatic: false,
    structuredOutput: false,
    samplingParamsFixed: false,
    penalizeVerificationInstructions: false,
    longContextDocsFirst: true,
    // Llama 4 Scout documents a 10M window; Maverick 1M.
    contextTokens: 10_000_000,
    contextVerified: true,
    systemRole: true,
    docsUrl: 'https://github.com/meta-llama/llama-models',
  },

  // Mistral Medium 3.5 / Small 4 / Large 3, with reasoning_effort.
  mistral: {
    id: 'mistral',
    vendor: 'Mistral AI',
    label: 'Mistral',
    internalReasoning: true,
    prefillSupported: true,
    xmlIdiomatic: false,
    structuredOutput: true,
    samplingParamsFixed: false,
    penalizeVerificationInstructions: false,
    longContextDocsFirst: true,
    contextTokens: 256_000,
    contextVerified: false,
    systemRole: true,
    docsUrl: 'https://docs.mistral.ai/guides/prompting_capabilities/',
  },

  // DeepSeek V4 (pro / flash). deepseek-chat and deepseek-reasoner retired
  // 2026-07-24.
  deepseek: {
    id: 'deepseek',
    vendor: 'DeepSeek',
    label: 'DeepSeek',
    internalReasoning: true,
    // Prefix completion exists but is non-thinking-mode only.
    prefillSupported: true,
    xmlIdiomatic: false,
    structuredOutput: true,
    samplingParamsFixed: false,
    penalizeVerificationInstructions: false,
    longContextDocsFirst: true,
    contextTokens: 1_000_000,
    contextVerified: true,
    systemRole: true,
    docsUrl: 'https://api-docs.deepseek.com/',
  },

  // Qwen3.5 / 3.6 open weights and qwen3.7 on Model Studio.
  qwen: {
    id: 'qwen',
    vendor: 'Alibaba',
    label: 'Qwen',
    internalReasoning: true,
    prefillSupported: true,
    xmlIdiomatic: false,
    structuredOutput: true,
    // Qwen publishes recommended sampling values rather than rejecting them.
    samplingParamsFixed: false,
    penalizeVerificationInstructions: false,
    longContextDocsFirst: true,
    // Qwen3.5-35B-A3B: 262,144 native, extensible to ~1,010,000.
    contextTokens: 1_010_000,
    contextVerified: true,
    systemRole: true,
    docsUrl: 'https://qwen.readthedocs.io/',
  },

  // grok-4.5 (500k) and grok-4.3 / 4.20 (1M).
  grok: {
    id: 'grok',
    vendor: 'xAI',
    label: 'Grok',
    internalReasoning: true,
    prefillSupported: true,
    xmlIdiomatic: false,
    structuredOutput: true,
    // presencePenalty, frequencyPenalty and stop error on reasoning models.
    samplingParamsFixed: true,
    penalizeVerificationInstructions: false,
    longContextDocsFirst: true,
    contextTokens: 1_000_000,
    contextVerified: true,
    systemRole: true,
    docsUrl: 'https://docs.x.ai/docs/guides/chat',
  },
}

export function getProfile(id: ModelFamilyId): ModelProfile {
  return PROFILES[id]
}

export function allProfiles(): ModelProfile[] {
  return MODEL_FAMILIES.map((id) => PROFILES[id])
}

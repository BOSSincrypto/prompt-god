/**
 * Browser-side adapters for running a prompt against a real model.
 *
 * Requests go from the user's browser straight to the provider. There is no
 * server in this project, so the key never leaves the device except to the
 * provider the user chose.
 *
 * Browser reachability differs by provider and is stated honestly here rather
 * than discovered by the user as a mystery CORS failure:
 *  - OpenRouter is designed for browser clients.
 *  - Anthropic works only with an explicit opt-in header.
 *  - Google's generative-language endpoint serves browser callers.
 *  - OpenAI does not advertise browser CORS support; it may be blocked.
 */

export const PROVIDERS = ['openrouter', 'anthropic', 'google', 'openai'] as const
export type ProviderId = (typeof PROVIDERS)[number]

export type BrowserSupport = 'supported' | 'opt-in' | 'may-be-blocked'

export interface ProviderInfo {
  id: ProviderId
  label: string
  /** Where the user gets a key. */
  keyUrl: string
  keyPrefixHint: string
  defaultModel: string
  /** Suggestions only — the field stays free text so new models work at once. */
  suggestedModels: readonly string[]
  browserSupport: BrowserSupport
}

export const PROVIDER_INFO: Record<ProviderId, ProviderInfo> = {
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    keyUrl: 'https://openrouter.ai/keys',
    keyPrefixHint: 'sk-or-…',
    defaultModel: 'anthropic/claude-sonnet-5',
    suggestedModels: [
      'anthropic/claude-sonnet-5',
      'anthropic/claude-opus-5',
      'openai/gpt-5.6',
      'google/gemini-3.5-flash',
      'deepseek/deepseek-v4-flash',
      'meta-llama/llama-4-maverick',
    ],
    browserSupport: 'supported',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyPrefixHint: 'sk-ant-…',
    defaultModel: 'claude-sonnet-5',
    suggestedModels: ['claude-sonnet-5', 'claude-opus-5', 'claude-haiku-4-5'],
    browserSupport: 'opt-in',
  },
  google: {
    id: 'google',
    label: 'Google AI Studio',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyPrefixHint: 'AIza…',
    defaultModel: 'gemini-3.5-flash',
    suggestedModels: ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.1-pro-preview'],
    browserSupport: 'supported',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyPrefixHint: 'sk-…',
    defaultModel: 'gpt-5.6',
    suggestedModels: ['gpt-5.6', 'gpt-5.6-terra', 'gpt-5.6-luna'],
    browserSupport: 'may-be-blocked',
  },
}

export interface RunRequest {
  provider: ProviderId
  apiKey: string
  model: string
  prompt: string
  system?: string
  maxTokens: number
}

export interface Usage {
  inputTokens?: number
  outputTokens?: number
}

interface Wire {
  url: string
  headers: Record<string, string>
  body: unknown
  /** Pulls the text delta out of one parsed SSE payload. */
  readDelta: (event: unknown) => string
  /** Pulls final usage numbers out of one parsed SSE payload, if present. */
  readUsage?: (event: unknown) => Usage | null
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null

function buildWire(request: RunRequest): Wire {
  const { provider, apiKey, model, prompt, system, maxTokens } = request

  switch (provider) {
    case 'anthropic':
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          // Without this the request is rejected before it reaches the model.
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: {
          model,
          max_tokens: maxTokens,
          stream: true,
          ...(system ? { system } : {}),
          messages: [{ role: 'user', content: prompt }],
        },
        readDelta: (event) => {
          const record = asRecord(event)
          if (record?.['type'] !== 'content_block_delta') return ''
          const delta = asRecord(record['delta'])
          return typeof delta?.['text'] === 'string' ? delta['text'] : ''
        },
        readUsage: (event) => {
          const record = asRecord(event)
          const usage =
            asRecord(record?.['usage']) ?? asRecord(asRecord(record?.['message'])?.['usage'])
          if (!usage) return null
          return {
            ...(typeof usage['input_tokens'] === 'number'
              ? { inputTokens: usage['input_tokens'] }
              : {}),
            ...(typeof usage['output_tokens'] === 'number'
              ? { outputTokens: usage['output_tokens'] }
              : {}),
          }
        },
      }

    case 'google': {
      const encoded = encodeURIComponent(model)
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${encoded}:streamGenerateContent?alt=sse`,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          generationConfig: { maxOutputTokens: maxTokens },
        },
        readDelta: (event) => {
          const candidates = asRecord(event)?.['candidates']
          if (!Array.isArray(candidates)) return ''
          const parts = asRecord(asRecord(candidates[0])?.['content'])?.['parts']
          if (!Array.isArray(parts)) return ''
          return parts
            .map((part) => {
              const text = asRecord(part)?.['text']
              return typeof text === 'string' ? text : ''
            })
            .join('')
        },
        readUsage: (event) => {
          const usage = asRecord(asRecord(event)?.['usageMetadata'])
          if (!usage) return null
          return {
            ...(typeof usage['promptTokenCount'] === 'number'
              ? { inputTokens: usage['promptTokenCount'] }
              : {}),
            ...(typeof usage['candidatesTokenCount'] === 'number'
              ? { outputTokens: usage['candidatesTokenCount'] }
              : {}),
          }
        },
      }
    }

    // OpenAI and OpenRouter share the Chat Completions wire format.
    case 'openai':
    case 'openrouter': {
      const isRouter = provider === 'openrouter'
      return {
        url: isRouter
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
          ...(isRouter
            ? {
                'HTTP-Referer': 'https://prompt-god.bossincrypto.dev',
                'X-Title': 'Prompt God',
              }
            : {}),
        },
        body: {
          model,
          stream: true,
          max_completion_tokens: maxTokens,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: prompt },
          ],
          ...(isRouter
            ? { usage: { include: true } }
            : { stream_options: { include_usage: true } }),
        },
        readDelta: (event) => {
          const choices = asRecord(event)?.['choices']
          if (!Array.isArray(choices)) return ''
          const content = asRecord(asRecord(choices[0])?.['delta'])?.['content']
          return typeof content === 'string' ? content : ''
        },
        readUsage: (event) => {
          const usage = asRecord(asRecord(event)?.['usage'])
          if (!usage) return null
          return {
            ...(typeof usage['prompt_tokens'] === 'number'
              ? { inputTokens: usage['prompt_tokens'] }
              : {}),
            ...(typeof usage['completion_tokens'] === 'number'
              ? { outputTokens: usage['completion_tokens'] }
              : {}),
          }
        },
      }
    }
  }
}

export type ProviderErrorKind = 'network' | 'auth' | 'rate-limit' | 'server' | 'cors' | 'aborted'

export class ProviderError extends Error {
  // Written out rather than declared as constructor parameter properties,
  // which `erasableSyntaxOnly` disallows.
  readonly kind: ProviderErrorKind
  readonly status: number | undefined

  constructor(message: string, kind: ProviderErrorKind, status?: number) {
    super(message)
    this.name = 'ProviderError'
    this.kind = kind
    this.status = status
  }
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text()
    const parsed: unknown = JSON.parse(text)
    const error = asRecord(asRecord(parsed)?.['error'])
    const message = error?.['message'] ?? asRecord(parsed)?.['message']
    return typeof message === 'string' ? message : text.slice(0, 300)
  } catch {
    return `HTTP ${response.status}`
  }
}

/**
 * Streams a completion, yielding text deltas as they arrive.
 *
 * Usage numbers, when the provider reports them, are handed to `onUsage`
 * rather than returned, because different providers emit them at different
 * points in the stream.
 */
export async function* streamCompletion(
  request: RunRequest,
  options: { signal?: AbortSignal; onUsage?: (usage: Usage) => void } = {},
): AsyncGenerator<string, void, undefined> {
  const wire = buildWire(request)

  let response: Response
  try {
    response = await fetch(wire.url, {
      method: 'POST',
      headers: wire.headers,
      body: JSON.stringify(wire.body),
      ...(options.signal ? { signal: options.signal } : {}),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ProviderError('Aborted', 'aborted')
    }
    // A browser reports a CORS rejection as an opaque network failure, so this
    // is the closest honest attribution available.
    throw new ProviderError(
      'The request never reached the provider. This is usually the browser blocking a cross-origin call.',
      'cors',
    )
  }

  if (!response.ok) {
    const detail = await readErrorBody(response)
    const kind =
      response.status === 401 || response.status === 403
        ? 'auth'
        : response.status === 429
          ? 'rate-limit'
          : response.status >= 500
            ? 'server'
            : 'network'
    throw new ProviderError(detail, kind, response.status)
  }

  if (!response.body) throw new ProviderError('The provider returned an empty stream.', 'server')

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''

  // An abort before the fetch resolves is converted above; an abort *during*
  // the read rejects with a raw DOMException, which sailed past every
  // `instanceof ProviderError` check and surfaced as a red error banner when
  // the user pressed Stop.
  const abortAware = <T>(work: Promise<T>) =>
    work.catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ProviderError('Aborted', 'aborted')
      }
      throw error
    })

  try {
    for (;;) {
      const { done, value } = await abortAware(reader.read())
      if (done) break
      buffer += value

      // SSE frames are separated by a blank line; anything after the last
      // separator is a partial frame and stays in the buffer.
      let separator = buffer.indexOf('\n\n')
      while (separator !== -1) {
        const frame = buffer.slice(0, separator)
        buffer = buffer.slice(separator + 2)
        separator = buffer.indexOf('\n\n')

        for (const line of frame.split('\n')) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (payload === '' || payload === '[DONE]') continue

          let parsed: unknown
          try {
            parsed = JSON.parse(payload)
          } catch {
            continue
          }

          const usage = wire.readUsage?.(parsed)
          if (usage && options.onUsage) options.onUsage(usage)

          const delta = wire.readDelta(parsed)
          if (delta) yield delta
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/** A one-token call used by the Settings screen to validate a key. */
export async function testConnection(
  request: Omit<RunRequest, 'prompt' | 'maxTokens'>,
  signal?: AbortSignal,
): Promise<void> {
  const stream = streamCompletion(
    { ...request, prompt: 'Reply with the single word: ok', maxTokens: 16 },
    signal ? { signal } : {},
  )
  for await (const _chunk of stream) {
    // The first delta proves the key, model and transport all work.
    return
  }
}

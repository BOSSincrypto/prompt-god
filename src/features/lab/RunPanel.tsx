import { useEffect, useRef, useState } from 'react'
import { Link } from '@/app/router.tsx'
import {
  ProviderError,
  streamCompletion,
  type ProviderId,
  type Usage,
} from '@/engine/byok/providers.ts'
import { useT } from '@/i18n/index.tsx'
import { credentials, type StoredCredential } from '@/lib/storage.ts'
import { Icon } from '@/ui/Icon.tsx'
import { Button, Card } from '@/ui/primitives.tsx'

/**
 * Runs the prompt against whichever provider the user configured.
 *
 * The panel is deliberately quiet when no key is stored: the app's whole value
 * proposition works offline, and this is an add-on.
 */
export function RunPanel({ prompt }: { prompt: string }) {
  const t = useT()
  const [credential, setCredential] = useState<StoredCredential | null>(null)
  const [output, setOutput] = useState('')
  const [usage, setUsage] = useState<Usage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    void credentials.all().then((all) => {
      if (!cancelled) setCredential(all[0] ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // An in-flight request must not outlive the panel.
  useEffect(() => () => abortRef.current?.abort(), [])

  const stop = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setRunning(false)
  }

  const run = async () => {
    if (!credential || running) return
    const controller = new AbortController()
    abortRef.current = controller

    setRunning(true)
    setOutput('')
    setUsage(null)
    setError(null)

    try {
      const stream = streamCompletion(
        {
          provider: credential.provider as ProviderId,
          apiKey: credential.apiKey,
          model: credential.model,
          prompt,
          maxTokens: 2048,
        },
        { signal: controller.signal, onUsage: setUsage },
      )
      for await (const delta of stream) {
        setOutput((current) => current + delta)
      }
    } catch (caught) {
      if (caught instanceof ProviderError) {
        if (caught.kind !== 'aborted') setError(caught.message)
      } else {
        setError(caught instanceof Error ? caught.message : String(caught))
      }
    } finally {
      abortRef.current = null
      setRunning(false)
    }
  }

  if (!credential) {
    return (
      <Card className="flex flex-wrap items-center gap-3 text-sm">
        <Icon name="key" size={17} className="shrink-0 text-subtle" />
        <span className="text-muted">{t('lab.runNeedsKey')}</span>
        <Link
          to="/settings"
          className="ml-auto inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
        >
          {t('nav.settings')}
          <Icon name="arrowRight" size={14} />
        </Link>
      </Card>
    )
  }

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{t('lab.response')}</h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-subtle">{credential.model}</span>
          {running ? (
            <Button size="sm" variant="danger" icon="x" onClick={stop}>
              {t('lab.stop')}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              icon="play"
              onClick={() => void run()}
              disabled={prompt.trim().length === 0}
            >
              {t('lab.run')}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-field bg-err-soft px-3 py-2.5 text-sm text-err">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      )}

      {(output || running) && (
        <pre className="editor-type max-h-96 overflow-auto rounded-field bg-sunken p-4">
          {output}
          {running && <span className="animate-pulse">▌</span>}
        </pre>
      )}

      {usage && (usage.inputTokens != null || usage.outputTokens != null) && (
        <div className="mt-3 flex gap-3 text-xs text-subtle tabular-nums">
          {usage.inputTokens != null && <span>in {usage.inputTokens}</span>}
          {usage.outputTokens != null && <span>out {usage.outputTokens}</span>}
        </div>
      )}
    </Card>
  )
}

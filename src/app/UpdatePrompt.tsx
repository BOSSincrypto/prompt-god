import { useRegisterSW } from 'virtual:pwa-register/react'
import { useT } from '@/i18n/index.tsx'
import { Icon } from '@/ui/Icon.tsx'
import { Button } from '@/ui/primitives.tsx'

/**
 * Service-worker lifecycle UI.
 *
 * The worker is registered with `registerType: 'prompt'`, so a new build never
 * swaps itself in underneath someone mid-lesson — they are told, and they
 * choose. Silent reloads lose unsaved editor content.
 */
export default function UpdatePrompt() {
  const t = useT()
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn('[prompt-god] service worker registration failed', error)
    },
  })

  if (!offlineReady && !needRefresh) return null

  const dismiss = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-40 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 animate-rise rounded-card border border-line glass p-4 shadow-card md:bottom-6"
    >
      {needRefresh ? (
        <>
          <div className="mb-1 flex items-center gap-2 font-medium">
            <Icon name="sparkles" size={17} className="text-accent" />
            {t('pwa.updateTitle')}
          </div>
          <p className="mb-3 text-sm text-muted">{t('pwa.updateBody')}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              icon="refresh"
              onClick={() => void updateServiceWorker(true)}
            >
              {t('pwa.updateAction')}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              {t('common.cancel')}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <Icon name="wifiOff" size={17} className="shrink-0 text-ok" />
          <span className="flex-1 text-sm">{t('pwa.offlineReady')}</span>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('common.close')}
            className="text-subtle transition-colors hover:text-fg"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

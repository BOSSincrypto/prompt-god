import { useEffect, useState } from 'react'
import {
  PROVIDER_INFO,
  PROVIDERS,
  ProviderError,
  testConnection,
  type ProviderId,
} from '@/engine/byok/providers.ts'
import { VERIFIED_ON } from '@/engine/models.ts'
import { useI18n } from '@/i18n/index.tsx'
import { LOCALE_LABEL, LOCALES, type Locale } from '@/i18n/types.ts'
import { credentials } from '@/lib/storage.ts'
import { usePrefs, type ThemeSetting } from '@/store/prefs.ts'
import { Icon } from '@/ui/Icon.tsx'
import {
  Badge,
  Button,
  Card,
  Field,
  inputClass,
  Page,
  PageHeader,
  Section,
  Segmented,
} from '@/ui/primitives.tsx'

const APP_VERSION = __APP_VERSION__

type TestState = { status: 'idle' | 'testing' | 'ok' } | { status: 'fail'; message: string }

function ByokSection() {
  const { locale, t } = useI18n()
  const [provider, setProvider] = useState<ProviderId>('openrouter')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(PROVIDER_INFO.openrouter.defaultModel)
  const [saved, setSaved] = useState(false)
  const [test, setTest] = useState<TestState>({ status: 'idle' })

  useEffect(() => {
    void credentials.all().then((all) => {
      const existing = all[0]
      if (!existing) return
      setProvider(existing.provider as ProviderId)
      setApiKey(existing.apiKey)
      setModel(existing.model)
      setSaved(true)
    })
  }, [])

  const info = PROVIDER_INFO[provider]

  const changeProvider = (next: ProviderId) => {
    setProvider(next)
    setModel(PROVIDER_INFO[next].defaultModel)
    setTest({ status: 'idle' })
  }

  const save = async () => {
    // One credential at a time keeps the Lab's "which key runs this?" question
    // from having an answer the user has to think about.
    await credentials.clear()
    await credentials.set({ provider, apiKey: apiKey.trim(), model: model.trim() })
    setSaved(true)
  }

  const remove = async () => {
    await credentials.clear()
    setApiKey('')
    setSaved(false)
    setTest({ status: 'idle' })
  }

  const runTest = async () => {
    setTest({ status: 'testing' })
    try {
      await testConnection({ provider, apiKey: apiKey.trim(), model: model.trim() })
      setTest({ status: 'ok' })
    } catch (error) {
      const message =
        error instanceof ProviderError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error)
      setTest({ status: 'fail', message })
    }
  }

  const supportTone =
    info.browserSupport === 'supported' ? 'ok' : info.browserSupport === 'opt-in' ? 'warn' : 'err'
  const supportLabel: Record<typeof info.browserSupport, Record<Locale, string>> = {
    supported: { en: 'Works in the browser', ru: 'Работает из браузера' },
    'opt-in': { en: 'Needs an opt-in header', ru: 'Нужен доп. заголовок' },
    'may-be-blocked': { en: 'May be blocked by CORS', ru: 'Может блокироваться CORS' },
  }

  return (
    <Section title={t('settings.apiTitle')}>
      <Card>
        <p className="mb-3 text-sm text-muted">{t('settings.apiIntro')}</p>

        <div className="mb-5 flex items-start gap-2.5 rounded-field bg-warn-soft px-3.5 py-3 text-sm text-warn">
          <Icon name="shield" size={17} className="mt-0.5 shrink-0" />
          <span>{t('settings.apiWarning')}</span>
        </div>

        <Field label={t('settings.provider')}>
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => changeProvider(id)}
                className={`rounded-field border px-3 py-1.5 text-sm transition-colors ${
                  provider === id
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line text-muted hover:border-line-strong'
                }`}
              >
                {PROVIDER_INFO[id].label}
              </button>
            ))}
          </div>
        </Field>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone={supportTone}>{supportLabel[info.browserSupport][locale]}</Badge>
          <a
            href={info.keyUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            {info.keyPrefixHint}
            <Icon name="external" size={12} />
          </a>
        </div>

        {info.browserSupport !== 'supported' && (
          <p className="mb-4 text-xs text-subtle">{t('settings.corsNote')}</p>
        )}

        <Field label={t('settings.apiKey')} htmlFor="api-key">
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(event) => {
              setApiKey(event.target.value)
              setSaved(false)
              setTest({ status: 'idle' })
            }}
            placeholder={t('settings.apiKeyPlaceholder')}
            autoComplete="off"
            spellCheck={false}
            className={`${inputClass} font-mono`}
          />
        </Field>

        <Field label={t('settings.model')} htmlFor="model-id">
          <input
            id="model-id"
            value={model}
            onChange={(event) => {
              setModel(event.target.value)
              setSaved(false)
            }}
            placeholder={t('settings.modelPlaceholder')}
            spellCheck={false}
            list="model-suggestions"
            className={`${inputClass} font-mono`}
          />
          <datalist id="model-suggestions">
            {info.suggestedModels.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </Field>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            icon={saved ? 'check' : 'save'}
            onClick={() => void save()}
            disabled={apiKey.trim().length === 0 || model.trim().length === 0}
          >
            {saved ? t('common.done') : t('common.save')}
          </Button>
          <Button
            icon="zap"
            onClick={() => void runTest()}
            disabled={apiKey.trim().length === 0 || test.status === 'testing'}
          >
            {test.status === 'testing' ? t('settings.testing') : t('settings.testKey')}
          </Button>
          {apiKey.length > 0 && (
            <Button variant="ghost" icon="trash" onClick={() => void remove()}>
              {t('settings.removeKey')}
            </Button>
          )}
        </div>

        {test.status === 'ok' && (
          <p className="mt-3 flex items-center gap-2 text-sm text-ok">
            <Icon name="check" size={15} />
            {t('settings.testOk')}
          </p>
        )}
        {test.status === 'fail' && (
          <p className="mt-3 flex items-start gap-2 text-sm text-err">
            <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">
              {t('settings.testFail', { message: test.message })}
            </span>
          </p>
        )}
      </Card>
    </Section>
  )
}

export default function SettingsPage() {
  const { t } = useI18n()
  const theme = usePrefs((s) => s.theme)
  const setTheme = usePrefs((s) => s.setTheme)
  const locale = usePrefs((s) => s.locale)
  const setLocale = usePrefs((s) => s.setLocale)
  const reduceMotion = usePrefs((s) => s.reduceMotion)
  const setReduceMotion = usePrefs((s) => s.setReduceMotion)

  return (
    <Page className="max-w-3xl">
      <PageHeader title={t('settings.title')} />

      <Section title={t('settings.appearance')}>
        <Card className="space-y-5">
          <Field label={t('settings.theme')}>
            <Segmented<ThemeSetting>
              value={theme}
              onChange={setTheme}
              ariaLabel={t('settings.theme')}
              options={[
                { value: 'system', label: t('settings.theme.system'), icon: 'monitor' },
                { value: 'light', label: t('settings.theme.light'), icon: 'sun' },
                { value: 'dark', label: t('settings.theme.dark'), icon: 'moon' },
              ]}
            />
          </Field>

          <Field label={t('settings.language')}>
            <Segmented<Locale>
              value={locale}
              onChange={setLocale}
              ariaLabel={t('settings.language')}
              options={LOCALES.map((id) => ({ value: id, label: LOCALE_LABEL[id] }))}
            />
          </Field>

          <Field label={t('settings.motion')} hint={t('settings.motionHint')}>
            <Segmented<'system' | 'reduce' | 'full'>
              value={reduceMotion === null ? 'system' : reduceMotion ? 'reduce' : 'full'}
              onChange={(value) => setReduceMotion(value === 'system' ? null : value === 'reduce')}
              ariaLabel={t('settings.motion')}
              options={[
                { value: 'system', label: t('settings.theme.system') },
                { value: 'reduce', label: t('common.done') },
                { value: 'full', label: t('common.all') },
              ]}
            />
          </Field>
        </Card>
      </Section>

      <ByokSection />

      <Section title={t('settings.about')}>
        <Card className="space-y-2 text-sm text-muted">
          <div>{t('settings.version', { v: APP_VERSION })}</div>
          <div>{t('settings.dataDate', { date: VERIFIED_ON })}</div>
          <div>{t('settings.license')}</div>
          <a
            href="https://github.com/BOSSincrypto/prompt-god"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-accent hover:underline"
          >
            {t('settings.sourceCode')}
            <Icon name="external" size={13} />
          </a>
        </Card>
      </Section>
    </Page>
  )
}

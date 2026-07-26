import { useEffect, useMemo, useRef, useState } from 'react'
import { loadSearchIndex, searchEntries, type IndexEntry } from '@/content/index.ts'
import { useI18n } from '@/i18n/index.tsx'
import { cx } from '@/lib/cx.ts'
import { Icon, type IconName } from '@/ui/Icon.tsx'
import { useModal } from '@/ui/useModal.ts'
import { useNavigate } from './router.tsx'
import { NAV_ROUTES } from './routes.ts'

interface Item {
  id: string
  label: string
  section: string
  icon: IconName
  href: string
}

/**
 * Search over pages, lessons and patterns. The index is its own small chunk
 * fetched when the palette first opens, so the shortcut costs nothing until
 * someone uses it.
 */
export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const panelRef = useModal<HTMLDivElement>(onClose)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [index, setIndex] = useState<IndexEntry[]>([])

  useEffect(() => {
    inputRef.current?.focus()
    let cancelled = false
    void loadSearchIndex().then(
      (entries) => {
        if (!cancelled) setIndex(entries)
      },
      () => {
        /* offline before the chunk was cached — pages still work */
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  const pages: Item[] = useMemo(
    () =>
      NAV_ROUTES.map((route) => ({
        id: route.pattern,
        label: t(route.nav.labelKey),
        section: t('palette.sectionPages'),
        icon: route.nav.icon,
        href: route.pattern,
      })).concat({
        id: '/settings',
        label: t('nav.settings'),
        section: t('palette.sectionPages'),
        icon: 'settings',
        href: '/settings',
      }),
    [t],
  )

  const items: Item[] = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return pages

    const matchedPages = pages.filter((page) => page.label.toLowerCase().includes(needle))
    const matchedContent = searchEntries(index, query, locale).map<Item>((entry) => ({
      id: entry.id,
      label: entry.title[locale],
      section: entry.kind === 'lesson' ? t('palette.sectionLessons') : t('palette.sectionPatterns'),
      icon: entry.kind === 'lesson' ? 'book' : 'grid',
      href: entry.href,
    }))
    return [...matchedPages, ...matchedContent]
  }, [query, pages, index, locale, t])

  // Reset the highlight when the result set changes. Adjusting state during
  // render is React's documented alternative to a reset effect: it runs before
  // the browser paints, so no stale highlight is ever visible.
  const [lastQuery, setLastQuery] = useState(query)
  if (lastQuery !== query) {
    setLastQuery(query)
    setActive(0)
  }

  // Keep the highlighted row visible when arrowing past the fold.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const go = (item: Item | undefined) => {
    if (!item) return
    navigate(item.href)
    onClose()
  }

  // Bound to the window, not to the dialog element. Focus can legitimately sit
  // on <body> — after a click on a non-focusable part of the panel, or a
  // tab-out — and a handler on the dialog never sees the key in that case, so
  // Escape silently stopped closing the palette.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Escape is handled by useModal, which also traps Tab and locks scroll.
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((value) => (items.length === 0 ? 0 : (value + 1) % items.length))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((value) => (items.length === 0 ? 0 : (value - 1 + items.length) % items.length))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        go(items[active])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  // Section headers are decided once, up front, rather than by mutating a
  // cursor while mapping — the latter reads as a render-time side effect.
  const withHeaders = items.map((item, position) => ({
    item,
    position,
    showSection: position === 0 || items[position - 1]?.section !== item.section,
  }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('common.search')}
        className="w-full max-w-xl animate-rise overflow-hidden rounded-card border border-line bg-surface shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" size={17} className="shrink-0 text-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('palette.placeholder')}
            aria-label={t('palette.placeholder')}
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="text-subtle transition-colors hover:text-fg"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-subtle">{t('palette.noResults')}</div>
        ) : (
          <ul ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
            {withHeaders.map(({ item, position, showSection }) => {
              return (
                <li key={`${item.section}:${item.id}`}>
                  {showSection && (
                    <div className="px-4 pb-1 pt-3 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-subtle">
                      {item.section}
                    </div>
                  )}
                  <button
                    type="button"
                    data-active={position === active}
                    onMouseEnter={() => setActive(position)}
                    onClick={() => go(item)}
                    className={cx(
                      'flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                      position === active ? 'bg-accent-soft text-fg' : 'text-muted',
                    )}
                  >
                    <Icon name={item.icon} size={16} className="shrink-0 text-subtle" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {position === active && (
                      <Icon name="arrowRight" size={14} className="shrink-0 text-accent" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

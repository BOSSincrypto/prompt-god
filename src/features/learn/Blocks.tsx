import { useT } from '@/i18n/index.tsx'
import { cx } from '@/lib/cx.ts'
import type { Block } from '@/content/types.ts'
import { Icon, type IconName } from '@/ui/Icon.tsx'

const NOTE_STYLE = {
  info: { border: 'border-info', bg: 'bg-info-soft', text: 'text-info', icon: 'info' },
  warn: { border: 'border-warn', bg: 'bg-warn-soft', text: 'text-warn', icon: 'alert' },
  ok: { border: 'border-ok', bg: 'bg-ok-soft', text: 'text-ok', icon: 'check' },
} as const satisfies Record<string, { border: string; bg: string; text: string; icon: IconName }>

/**
 * Lesson body renderer.
 *
 * Content is authored as structured blocks rather than markdown, which removes
 * both a parser and a sanitiser from the bundle and makes every block type
 * something the design system can style deliberately.
 */
export function Blocks({ blocks }: { blocks: readonly Block[] }) {
  const t = useT()

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'h':
            return (
              <h2 key={index} className="pt-3 text-xl font-semibold tracking-tight">
                {block.text}
              </h2>
            )

          case 'p':
            return (
              <p key={index} className="text-pretty leading-relaxed text-muted">
                {block.text}
              </p>
            )

          case 'list': {
            const List = block.ordered ? 'ol' : 'ul'
            return (
              <div key={index}>
                {block.title && <h3 className="mb-2 font-medium">{block.title}</h3>}
                <List
                  className={cx(
                    'space-y-2 pl-5 text-muted',
                    block.ordered ? 'list-decimal' : 'list-disc',
                  )}
                >
                  {block.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-pretty leading-relaxed">
                      {item}
                    </li>
                  ))}
                </List>
              </div>
            )
          }

          case 'note': {
            const style = NOTE_STYLE[block.tone]
            return (
              <div
                key={index}
                className={cx('rounded-card border-l-2 px-4 py-3.5', style.border, style.bg)}
              >
                <div className={cx('mb-1 flex items-center gap-2 text-sm font-medium', style.text)}>
                  <Icon name={style.icon} size={15} />
                  {block.title ?? ''}
                </div>
                <p className="text-pretty text-sm leading-relaxed">{block.text}</p>
              </div>
            )
          }

          case 'code':
            return (
              <figure key={index}>
                <pre className="editor-type overflow-x-auto rounded-card border border-line bg-sunken p-4">
                  {block.text}
                </pre>
                {block.caption && (
                  <figcaption className="mt-1.5 text-xs text-subtle">{block.caption}</figcaption>
                )}
              </figure>
            )

          case 'compare':
            return (
              <div key={index} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="overflow-hidden rounded-card border border-line">
                    <div className="flex items-center gap-1.5 border-b border-line bg-err-soft px-3 py-1.5 text-xs font-medium text-err">
                      <Icon name="x" size={12} />
                      {block.badLabel ?? t('learn.pitfall')}
                    </div>
                    <pre className="editor-type overflow-x-auto bg-sunken p-3.5">{block.bad}</pre>
                  </div>
                  <div className="overflow-hidden rounded-card border border-line">
                    <div className="flex items-center gap-1.5 border-b border-line bg-ok-soft px-3 py-1.5 text-xs font-medium text-ok">
                      <Icon name="check" size={12} />
                      {block.goodLabel ?? t('learn.solution')}
                    </div>
                    <pre className="editor-type overflow-x-auto bg-sunken p-3.5">{block.good}</pre>
                  </div>
                </div>
                {block.note && <p className="text-sm text-subtle">{block.note}</p>}
              </div>
            )

          case 'quote':
            return (
              <blockquote
                key={index}
                className="border-l-2 border-accent pl-4 text-pretty italic leading-relaxed text-muted"
              >
                {block.text}
                <footer className="mt-2 text-xs not-italic text-subtle">
                  {block.url ? (
                    <a
                      href={block.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 hover:text-fg"
                    >
                      {block.source}
                      <Icon name="external" size={11} />
                    </a>
                  ) : (
                    block.source
                  )}
                </footer>
              </blockquote>
            )
        }
      })}
    </div>
  )
}

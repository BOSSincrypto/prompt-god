import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { Link } from '@/app/router.tsx'
import { cx } from '@/lib/cx.ts'
import { Icon, type IconName } from './Icon.tsx'

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 font-medium rounded-field select-none whitespace-nowrap ' +
  'transition-[background-color,border-color,color,transform,opacity,filter] duration-150 ' +
  'active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none'

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:brightness-110',
  secondary: 'bg-surface border border-line hover:border-line-strong text-fg',
  ghost: 'text-muted hover:text-fg hover:bg-accent-soft',
  danger: 'bg-err text-white hover:brightness-110',
}

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[0.8125rem]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[0.9375rem]',
}

interface ButtonStyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  iconRight?: IconName
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleProps {}

/** Shared so a link can look exactly like a button without nesting one. */
export function buttonClass(
  variant: ButtonVariant = 'secondary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cx(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], className)
}

const iconSizeFor = (size: ButtonSize) => (size === 'sm' ? 15 : size === 'lg' ? 19 : 17)

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const iconSize = iconSizeFor(size)
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  )
}

/**
 * A link that looks like a button.
 *
 * Wrapping a `<Button>` in a `<Link>` nests a `<button>` inside an `<a>`: two
 * tab stops with the same accessible name for one action, and invalid HTML.
 * This renders a single anchor instead.
 */
export function LinkButton({
  to,
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  className,
  children,
  ...rest
}: ButtonStyleProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string }) {
  const iconSize = iconSizeFor(size)
  return (
    <Link to={to} className={buttonClass(variant, size, className)} {...rest}>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  padded?: boolean
}

export function Card({ interactive, padded = true, className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'relative bg-surface border border-line rounded-card shadow-card',
        padded && 'p-5',
        interactive &&
          'transition-[border-color,transform] duration-200 hover:border-line-strong hover:-translate-y-0.5',
        className,
      )}
      {...rest}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Badge                                                                      */
/* -------------------------------------------------------------------------- */

export type BadgeTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'err' | 'info'

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-sunken text-muted border-line',
  accent: 'bg-accent-soft text-accent border-transparent',
  ok: 'bg-ok-soft text-ok border-transparent',
  warn: 'bg-warn-soft text-warn border-transparent',
  err: 'bg-err-soft text-err border-transparent',
  info: 'bg-info-soft text-info border-transparent',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium leading-5',
        BADGE_TONE[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Layout helpers                                                             */
/* -------------------------------------------------------------------------- */

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx('relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12', className)}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  eyebrow?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-rise">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-accent">
            {eyebrow}
          </div>
        )}
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-pretty text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx('mb-12', className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function EmptyState({
  icon = 'sparkles',
  title,
  body,
  action,
}: {
  icon?: IconName
  title: ReactNode
  body?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line px-6 py-14 text-center">
      <Icon name={icon} size={28} className="text-subtle" />
      <div className="font-medium">{title}</div>
      {body && <p className="max-w-sm text-sm text-muted">{body}</p>}
      {action}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Progress bar                                                               */
/* -------------------------------------------------------------------------- */

const BAR_TONE = {
  accent: 'bg-accent',
  ok: 'bg-ok',
  warn: 'bg-warn',
  err: 'bg-err',
} as const

export function ProgressBar({
  value,
  max = 100,
  tone = 'accent',
  className,
  label,
}: {
  value: number
  max?: number
  tone?: keyof typeof BAR_TONE
  className?: string
  label?: string
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className={cx('h-1.5 w-full overflow-hidden rounded-full bg-sunken', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cx(
          'h-full rounded-full transition-[width] duration-500 ease-out-quint',
          BAR_TONE[tone],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Segmented control                                                          */
/* -------------------------------------------------------------------------- */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
  className,
  ariaLabel,
}: {
  value: T
  options: readonly { value: T; label: ReactNode; icon?: IconName }[]
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
  ariaLabel?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx(
        'inline-flex items-center gap-0.5 rounded-field border border-line bg-sunken p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-[0.5rem] font-medium transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-[0.75rem]' : 'h-8 px-3 text-[0.8125rem]',
              active ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
            )}
          >
            {option.icon && <Icon name={option.icon} size={14} />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Form fields                                                                */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-subtle">{hint}</p>}
    </div>
  )
}

export const inputClass =
  'w-full rounded-field border border-line bg-sunken px-3 py-2 text-sm text-fg ' +
  'placeholder:text-subtle transition-colors focus:border-line-strong'

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cx('animate-pulse rounded-field bg-sunken', className)} aria-hidden="true" />
  )
}

/** Route-level loading state — matches the shell so there is no layout jump. */
export function RouteFallback() {
  return (
    <Page>
      <Skeleton className="mb-3 h-9 w-64" />
      <Skeleton className="mb-10 h-5 w-96 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    </Page>
  )
}

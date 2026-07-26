import type { SVGProps } from 'react'

/**
 * A hand-picked icon set drawn on a 24x24 grid with a 1.75 stroke, shipped as
 * raw path data. This is ~2 KB for everything the app uses, versus pulling in
 * an icon package and its tree-shaking caveats.
 */
const PATHS = {
  home: 'M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  book: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  flask: 'M9 2h6M10 2v6.5L4.6 18a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3L14 8.5V2M7.5 14h9',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  chip: 'M6 6h12v12H6zM9.5 9.5h5v5h-5M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3',
  chart: 'M3 3v16.5A1.5 1.5 0 0 0 4.5 21H21M7 15l3.5-4 3 2.5L20 7',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.5 15H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.5V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.4a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1',
  menu: 'M3 6h18M3 12h18M3 18h18',
  x: 'M18 6 6 18M6 6l12 12',
  chevronRight: 'm9 5 7 7-7 7',
  chevronLeft: 'm15 5-7 7 7 7',
  chevronDown: 'm5 9 7 7 7-7',
  check: 'm4 12.5 5.5 5.5L20 6',
  copy: 'M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.35-4.35',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8',
  monitor: 'M3 4h18v12H3zM8 21h8M12 16v5',
  sparkles:
    'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M17 5h4M5 17v3M3.5 18.5h3',
  alert:
    'M12 9v5M12 17.5v.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0',
  alertCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 8v5M12 16.5v.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 16v-5M12 7.5v.01',
  zap: 'M13 2 4 14h7l-1 8 9-12h-7z',
  flame:
    'M12 22c4 0 7-2.7 7-6.5 0-4.5-4-6-5.5-11C11 7 9 8 9 11c-1-.7-1.5-2-1.5-3C6 10 5 12.4 5 15.5 5 19.3 8 22 12 22',
  trophy:
    'M7 4h10v6a5 5 0 0 1-10 0zM7 6H4.5A2.5 2.5 0 0 0 7 11M17 6h2.5A2.5 2.5 0 0 1 17 11M9 21h6M12 15v6',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4',
  play: 'M6 4.5 19 12 6 19.5z',
  refresh: 'M20 11a8 8 0 1 0-1.5 6M20 5v6h-6',
  download: 'M12 3v12M7 11l5 5 5-5M4 20h16',
  upload: 'M12 17V4M7 9l5-5 5 5M4 20h16',
  trash: 'M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14M10 10v7M14 10v7',
  external: 'M14 4h6v6M20 4 11 13M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  arrowRight: 'M4 12h15M13 6l6 6-6 6',
  arrowLeft: 'M20 12H5M11 18l-6-6 6-6',
  key: 'M15.5 3a5.5 5.5 0 1 0-4.6 8.5L3 19.4V21h3v-2h2v-2h2l1.3-1.3A5.5 5.5 0 0 0 15.5 3M16.5 7.5v.01',
  globe:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3.5 9h17M3.5 15h17M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  wand: 'M4 20 16 8M14 4l1 2.5L17.5 7.5 15 8.5 14 11l-1-2.5L10.5 7.5 13 6.5zM19.5 13l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z',
  target:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
  layers: 'm12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5',
  code: 'm8 6-6 6 6 6M16 6l6 6-6 6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5.2l3.4 2',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  wifiOff:
    'M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 3.5-2.3M19 13a10 10 0 0 0-4-2.7M2 8.8A15 15 0 0 1 7 6M22 8.8a15 15 0 0 0-9.7-2.7M12 20v.01',
  shield: 'M12 22s8-3.5 8-9.5V5.5L12 2 4 5.5V12.5C4 18.5 12 22 12 22M9 12l2 2 4-4',
  brain:
    'M9.5 3A3 3 0 0 0 7 7.5 3 3 0 0 0 5.5 13 3 3 0 0 0 8 17.9 2.5 2.5 0 0 0 12 20V4a2.5 2.5 0 0 0-2.5-1M14.5 3A3 3 0 0 1 17 7.5 3 3 0 0 1 18.5 13 3 3 0 0 1 16 17.9 2.5 2.5 0 0 1 12 20',
  scale: 'M12 3v18M7 21h10M6 7l-3 7h6zM18 7l-3 7h6zM6 7l6-2 6 2',
  save: 'M4 4h12l4 4v12H4zM8 4v6h7V4M8 20v-6h8v6',
} as const

export type IconName = keyof typeof PATHS

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  /** Set when the icon carries meaning on its own rather than labelling text. */
  label?: string
}

export function Icon({ name, size = 20, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

type ClassValue = string | number | null | undefined | false | ClassValue[]

/** Minimal className joiner — the app never needs Tailwind conflict merging. */
export function cx(...values: ClassValue[]): string {
  let out = ''
  for (const value of values) {
    if (!value) continue
    const part = Array.isArray(value) ? cx(...value) : String(value)
    if (part) out = out ? `${out} ${part}` : part
  }
  return out
}

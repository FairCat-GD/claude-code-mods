import { STRINGS } from '../strings'

// The terminal's context bar, in cells.
export const BAR_CELLS = 10

const tenths = (value: number) => `${Math.round(value * 10) / 10}`

// A number the engine left out or got wrong reads as unknown, never as NaN.
const known = (value: number | undefined): value is number => value !== undefined && Number.isFinite(value)

// A token count as a row shows it: 640, 9.5k, 38k, 1.2M.
export function tokens(count: number): string {
  if (!known(count)) return STRINGS.row.unknown
  const whole = Math.max(0, Math.round(count))
  if (whole < 1000) return `${whole}`
  const thousands = whole / 1000
  if (thousands < 9.95) return `${tenths(thousands)}k`
  if (thousands < 999.5) return `${Math.round(thousands)}k`
  return `${tenths(whole / 1_000_000)}M`
}

// Elapsed time: 0:42, then 1:02:05 from an hour.
export function elapsed(ms: number): string {
  if (!known(ms)) return STRINGS.row.unknown
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  return hours === 0 ? `${minutes}:${rest}` : `${hours}:${String(minutes).padStart(2, '0')}:${rest}`
}

// The context fill as a fraction for the app's bar; an unknown fill is empty, never a bar that only spins.
export const fill = (value: number | undefined) => (known(value) ? value / 100 : 0)

export const percent = (value: number | undefined) => (known(value) ? `${Math.round(value)}%` : STRINGS.row.unknown)

// An estimate in dollars: $0.25, $12.40, then whole dollars from $100; something spent under a cent reads <$0.01.
export function dollars(usd: number): string {
  if (!known(usd)) return STRINGS.row.unknown
  if (usd <= 0) return STRINGS.dollars('0.00')
  if (usd < 0.005) return STRINGS.underCent
  return STRINGS.dollars(usd < 99.995 ? usd.toFixed(2) : `${Math.round(usd)}`)
}

// A row's or the header's estimate, labelled as one.
export const estimate = (usd: number) => STRINGS.estimate(dollars(usd))

// The context fill in block characters; an unknown fill draws empty.
export function bar(value: number | undefined): string {
  const filled = !known(value) ? 0 : Math.min(BAR_CELLS, Math.max(0, Math.round((value / 100) * BAR_CELLS)))
  return '█'.repeat(filled) + '░'.repeat(BAR_CELLS - filled)
}

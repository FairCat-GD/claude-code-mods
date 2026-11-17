import { STRINGS } from '../strings'

// The terminal's context bar, in cells.
export const BAR_CELLS = 10

const tenths = (value: number) => `${Math.round(value * 10) / 10}`

// A token count as a row shows it: 640, 9.5k, 38k, 1.2M.
export function tokens(count: number): string {
  const whole = Math.max(0, Math.round(count))
  if (whole < 1000) return `${whole}`
  const thousands = whole / 1000
  if (thousands < 9.95) return `${tenths(thousands)}k`
  if (thousands < 999.5) return `${Math.round(thousands)}k`
  return `${tenths(whole / 1_000_000)}M`
}

// Elapsed time: 0:42, then 1:02:05 from an hour.
export function elapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  return hours === 0 ? `${minutes}:${rest}` : `${hours}:${String(minutes).padStart(2, '0')}:${rest}`
}

export const percent = (value: number | undefined) => (value === undefined ? STRINGS.row.unknownPercent : `${Math.round(value)}%`)

// The context fill in block characters; an unknown fill draws empty.
export function bar(value: number | undefined): string {
  const filled = value === undefined ? 0 : Math.min(BAR_CELLS, Math.max(0, Math.round((value / 100) * BAR_CELLS)))
  return '█'.repeat(filled) + '░'.repeat(BAR_CELLS - filled)
}

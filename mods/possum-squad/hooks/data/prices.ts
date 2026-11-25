import type { Tokens } from '../../types/index'
import { rowFor } from './models'

// Dollars per million tokens: uncached input, output, cache reads, and cache writes kept five minutes or an hour.
export type Rates = { input: number; output: number; cacheRead: number; cacheWrite: number; cacheWriteHour: number }

// T-12: each model's list prices as the published pricing page gave them, and when. Past `long.after` tokens of one
// request's prompt (its input, cache reads and cache writes together), that request pays `long.rates`.
export const PRICES: readonly { model: string; rates: Rates; long?: { after: number; rates: Rates }; read: string }[] = [
  { model: 'claude-fable-5-2', rates: { input: 8, output: 40, cacheRead: 0.2, cacheWrite: 10, cacheWriteHour: 16 }, read: '2026-11-25, pricing page' },
  {
    model: 'claude-haiku-5-5',
    rates: { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125, cacheWriteHour: 0.2 },
    long: { after: 100_000, rates: { input: 0.5, output: 2.5, cacheRead: 0.05, cacheWrite: 0.625, cacheWriteHour: 1 } },
    read: '2026-11-25, pricing page',
  },
  { model: 'claude-opus-5-5', rates: { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5, cacheWriteHour: 8 }, read: '2026-11-25, pricing page' },
  { model: 'claude-sonnet-5-5', rates: { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5, cacheWriteHour: 4 }, read: '2026-11-25, pricing page' },
]

// For a model the table does not name: the session's default model's prices.
export const DEFAULT_PRICED = 'claude-opus-5-5'

// A count the engine left out or got wrong costs nothing, so the estimate is never NaN.
const count = (value: number | undefined) => (value !== undefined && Number.isFinite(value) && value > 0 ? value : 0)

// Tokens at their model's list prices, in dollars. `hourWrites` is the part of the cache writes kept an hour; `prompt`,
// one request's whole prompt, picks the long-prompt rates. A turn's summed tokens give no `prompt`, so pay the base.
export function costOf(model: string | undefined, tokens: Tokens, options: { hourWrites?: number; prompt?: number } = {}): number {
  const row = rowFor(PRICES, model) ?? rowFor(PRICES, DEFAULT_PRICED)
  if (row === undefined) return 0
  const rates = row.long !== undefined && count(options.prompt) > row.long.after ? row.long.rates : row.rates
  const writes = count(tokens.cacheWrite)
  const hourWrites = Math.min(count(options.hourWrites), writes)
  const dollars =
    count(tokens.input) * rates.input +
    count(tokens.output) * rates.output +
    count(tokens.cacheRead) * rates.cacheRead +
    (writes - hourWrites) * rates.cacheWrite +
    hourWrites * rates.cacheWriteHour
  return dollars / 1_000_000
}

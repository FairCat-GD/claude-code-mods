import type { Tokens } from '../../types/index'
import { rowFor } from './models'

// Dollars per million tokens: uncached input, output, cache reads, and cache writes kept five minutes or an hour.
export type Rates = { input: number; output: number; cacheRead: number; cacheWrite: number; cacheWriteHour: number }

const READ = '2026-11-25, pricing page'
const FABLE_5_2: Rates = { input: 8, output: 40, cacheRead: 0.2, cacheWrite: 10, cacheWriteHour: 16 }
const FABLE_5_1: Rates = { input: 10, output: 50, cacheRead: 0.25, cacheWrite: 12.5, cacheWriteHour: 20 }
const FABLE_5: Rates = { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5, cacheWriteHour: 20 }
const OPUS_4_5_TO_5: Rates = { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25, cacheWriteHour: 10 }
const SONNET_4_5_TO_4_6: Rates = { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75, cacheWriteHour: 6 }

// T-12: each model the engine still serves, at its list prices as the published pricing page gave them, and when. Past
// `long.after` tokens of one request's prompt (its input, cache reads and cache writes together), that request pays
// `long.rates`.
export const PRICES: readonly { model: string; rates: Rates; long?: { after: number; rates: Rates }; read: string }[] = [
  { model: 'claude-fable-5-2', rates: FABLE_5_2, read: READ },
  { model: 'claude-mythos-5-2', rates: FABLE_5_2, read: READ },
  { model: 'claude-fable-5-1', rates: FABLE_5_1, read: READ },
  { model: 'claude-mythos-5-1', rates: FABLE_5_1, read: READ },
  { model: 'claude-fable-5', rates: FABLE_5, read: READ },
  { model: 'claude-mythos-5', rates: FABLE_5, read: READ },
  { model: 'claude-opus-5-5', rates: { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5, cacheWriteHour: 8 }, read: READ },
  { model: 'claude-opus-5', rates: OPUS_4_5_TO_5, read: READ },
  { model: 'claude-opus-4-8', rates: OPUS_4_5_TO_5, read: READ },
  { model: 'claude-opus-4-7', rates: OPUS_4_5_TO_5, read: READ },
  { model: 'claude-opus-4-6', rates: OPUS_4_5_TO_5, read: READ },
  { model: 'claude-opus-4-5', rates: OPUS_4_5_TO_5, read: READ },
  { model: 'claude-sonnet-5-5', rates: { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5, cacheWriteHour: 4 }, read: READ },
  { model: 'claude-sonnet-5', rates: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5, cacheWriteHour: 4 }, read: READ },
  { model: 'claude-sonnet-4-6', rates: SONNET_4_5_TO_4_6, read: READ },
  { model: 'claude-sonnet-4-5', rates: SONNET_4_5_TO_4_6, read: READ },
  {
    model: 'claude-haiku-5-5',
    rates: { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125, cacheWriteHour: 0.2 },
    long: { after: 100_000, rates: { input: 0.5, output: 2.5, cacheRead: 0.05, cacheWrite: 0.625, cacheWriteHour: 1 } },
    read: READ,
  },
  { model: 'claude-haiku-4-5', rates: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25, cacheWriteHour: 2 }, read: READ },
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

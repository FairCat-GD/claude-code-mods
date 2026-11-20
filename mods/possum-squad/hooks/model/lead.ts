import type { Lead, LeadContext, Runs, Tokens } from '../../types/index'
import { add, figures, fresh, NO_TOKENS } from './runs'

// The Lead before any measure or main turn: its context unknown, nothing counted.
export const NO_LEAD: Lead = { tokens: NO_TOKENS, workedMs: 0 }

// A figure the engine left out or got wrong is not counted.
const count = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined)

const sameContext = (a: LeadContext | undefined, b: LeadContext) => a?.tokens === b.tokens && a?.window === b.window && a?.percent === b.percent

// `session.measure`'s context on the Lead; one with no usable window changes nothing.
export function measured(lead: Lead, context: unknown): Lead {
  if (typeof context !== 'object' || context === null) return lead
  const given = context as { tokens?: unknown; window?: unknown; percent?: unknown }
  const window = count(given.window)
  if (window === undefined || window === 0) return lead
  const next: LeadContext = { window }
  const tokens = count(given.tokens)
  const percent = count(given.percent)
  if (tokens !== undefined) next.tokens = tokens
  if (percent !== undefined) next.percent = percent
  return sameContext(lead.context, next) ? lead : { ...lead, context: next }
}

export type TurnUsage = { input_tokens?: unknown; output_tokens?: unknown; cache_read_input_tokens?: unknown; cache_creation_input_tokens?: unknown }

// A main turn's end: its requests' tokens and its length, each counted only when the engine gave a number.
export function turnCounted(lead: Lead, usage: TurnUsage | undefined, durationMs: unknown): Lead {
  const spent: Tokens = {
    input: count(usage?.input_tokens) ?? 0,
    output: count(usage?.output_tokens) ?? 0,
    cacheRead: count(usage?.cache_read_input_tokens) ?? 0,
    cacheWrite: count(usage?.cache_creation_input_tokens) ?? 0,
  }
  const worked = count(durationMs) ?? 0
  if (worked === 0 && spent.input + spent.output + spent.cacheRead + spent.cacheWrite === 0) return lead
  return { ...lead, tokens: add(lead.tokens, spent), workedMs: lead.workedMs + worked }
}

export type LeadFigures = { tokens: number; contextPercent?: number }

// The engine's whole percent when it gave one, else the context's tokens over its window.
export function leadFigures(lead: Lead): LeadFigures {
  const tokens = fresh(lead.tokens)
  const context = lead.context
  if (context?.percent !== undefined) return { tokens, contextPercent: context.percent }
  if (context?.tokens !== undefined) return { tokens, contextPercent: (context.tokens / context.window) * 100 }
  return { tokens }
}

export type Totals = { tokens: number; workedMs: number }

// The header's figures: the Lead, every run kept, and what pruned runs had counted.
export function totals(lead: Lead, runs: Runs, now: number): Totals {
  return Object.values(runs.rows).reduce(
    (sum, run) => {
      const counted = figures(run, now)
      return { tokens: sum.tokens + counted.tokens, workedMs: sum.workedMs + counted.elapsedMs }
    },
    { tokens: fresh(lead.tokens) + runs.past.tokens, workedMs: lead.workedMs + runs.past.workedMs },
  )
}

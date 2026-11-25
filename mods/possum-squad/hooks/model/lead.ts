import type { Lead, LeadContext, Limit, Runs, Tokens } from '../../types/index'
import { LIMITS_KEPT } from '../config'
import { costOf } from '../data/prices'
import { add, figures, fresh, NO_TOKENS } from './runs'

// The Lead before any measure or main turn: its context and limits unknown, nothing counted.
export const NO_LEAD: Lead = { tokens: NO_TOKENS, workedMs: 0, usd: 0 }

// A figure the engine left out or got wrong is not counted.
const count = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined)

const sameContext = (a: LeadContext | undefined, b: LeadContext) => a?.tokens === b.tokens && a?.window === b.window && a?.percent === b.percent

function withContext(lead: Lead, context: unknown): Lead {
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

const sameLimits = (a: readonly Limit[] | undefined, b: readonly Limit[]) =>
  (a ?? []).length === b.length && b.every((one, at) => a?.[at]?.kind === one.kind && a[at]?.percent === one.percent)

// The windows the engine reported, in its order: each with a name and a percent, the first few. An empty list is none
// now (off a subscription, or a window that left); anything but a list says nothing.
function withLimits(lead: Lead, rateLimits: unknown): Lead {
  if (!Array.isArray(rateLimits)) return lead
  const limits: Limit[] = []
  for (const one of rateLimits as unknown[]) {
    if (typeof one !== 'object' || one === null) continue
    const { kind, percentUsed } = one as { kind?: unknown; percentUsed?: unknown }
    const percent = count(percentUsed)
    if (typeof kind === 'string' && kind.trim() !== '' && percent !== undefined) limits.push({ kind: kind.trim(), percent })
  }
  const kept = limits.slice(0, LIMITS_KEPT)
  if (sameLimits(lead.limits, kept)) return lead
  if (kept.length > 0) return { ...lead, limits: kept }
  const { limits: _, ...rest } = lead
  return rest
}

// `session.measure` on the Lead: its context, when the window is usable, and the plan's limits.
export const measured = (lead: Lead, context: unknown, rateLimits?: unknown): Lead => withLimits(withContext(lead, context), rateLimits)

export type TurnUsage = {
  input_tokens?: unknown
  output_tokens?: unknown
  cache_read_input_tokens?: unknown
  cache_creation_input_tokens?: unknown
  ephemeral_1h_input_tokens?: unknown
  model?: unknown
}

// A main turn's end: its requests' tokens, their estimate at the model that answered last, and its length, each counted
// only when the engine gave a number.
export function turnCounted(lead: Lead, usage: TurnUsage | undefined, durationMs: unknown): Lead {
  const spent: Tokens = {
    input: count(usage?.input_tokens) ?? 0,
    output: count(usage?.output_tokens) ?? 0,
    cacheRead: count(usage?.cache_read_input_tokens) ?? 0,
    cacheWrite: count(usage?.cache_creation_input_tokens) ?? 0,
  }
  const worked = count(durationMs) ?? 0
  if (worked === 0 && spent.input + spent.output + spent.cacheRead + spent.cacheWrite === 0) return lead
  const hourWrites = count(usage?.ephemeral_1h_input_tokens)
  const usd = costOf(typeof usage?.model === 'string' ? usage.model : undefined, spent, hourWrites === undefined ? {} : { hourWrites })
  return { ...lead, tokens: add(lead.tokens, spent), workedMs: lead.workedMs + worked, usd: lead.usd + usd }
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

export type Totals = { tokens: number; workedMs: number; usd: number }

// The header's figures: the Lead, every run kept by its own figures, and what pruned runs had counted.
export function totals(lead: Lead, runs: Runs, now: number): Totals {
  return Object.values(runs.rows).reduce(
    (sum, run) => {
      const counted = figures(run, now)
      return { tokens: sum.tokens + counted.tokens, workedMs: sum.workedMs + counted.elapsedMs, usd: sum.usd + run.usd }
    },
    { tokens: fresh(lead.tokens) + runs.past.tokens, workedMs: lead.workedMs + runs.past.workedMs, usd: lead.usd + runs.past.usd },
  )
}

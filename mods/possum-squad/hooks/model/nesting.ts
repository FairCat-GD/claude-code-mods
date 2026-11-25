import type { Runs, Tally } from '../../types/index'
import { fresh, parentsOf } from './runs'

// Each run's tokens and estimate with every helper's under it, at any depth, and what its pruned helpers had counted, by
// spawn order. Time and context stay each run's own: a helper's minutes pass inside its parent's.
export function rolledUp(runs: Runs): Map<number, Tally> {
  const parents = parentsOf(runs.rows)
  const helpers = new Map<number, number[]>()
  for (const [child, parent] of parents) helpers.set(parent, [...(helpers.get(parent) ?? []), child])
  const byOrder = new Map(Object.values(runs.rows).map(run => [run.order, run]))
  const rolled = new Map<number, Tally>()
  const inProgress = new Set<number>()
  const sum = (order: number): Tally => {
    const known = rolled.get(order)
    if (known !== undefined) return known
    const run = byOrder.get(order)
    // A loop of parents counts each run once.
    if (run === undefined || inProgress.has(order)) return { tokens: 0, usd: 0 }
    inProgress.add(order)
    let total: Tally = { tokens: fresh(run.tokens) + (run.prunedHelpers?.tokens ?? 0), usd: run.usd + (run.prunedHelpers?.usd ?? 0) }
    for (const child of helpers.get(order) ?? []) {
      const below = sum(child)
      total = { tokens: total.tokens + below.tokens, usd: total.usd + below.usd }
    }
    inProgress.delete(order)
    rolled.set(order, total)
    return total
  }
  for (const order of byOrder.keys()) sum(order)
  return rolled
}

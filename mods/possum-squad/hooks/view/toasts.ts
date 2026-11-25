import type { Runs } from '../../types/index'
import { TOAST_AFTER_MS } from '../config'
import { hasEnded } from '../model/runs'
import { STRINGS } from '../strings'
import { elapsed } from './format'
import { shortened } from './runs'

// Each takes `runs` before and after an event's record. A toast names its run by its description, cut as its row's.

// Whether the agent needs the person, by its row or, before its row has shown, its loop's entry.
function isAsking(runs: Runs, agentId: string): boolean {
  const run = runs.rows[agentId]
  return run === undefined ? runs.pending[agentId]?.ask !== undefined : run.state === 'needs-you'
}

// A permission request that moved the agent into needing the person; before its row has shown, it is `someone`. A
// later request while it still waits adds none.
export function askedToast(before: Runs, after: Runs, agentId: string): string | undefined {
  if (isAsking(before, agentId) || !isAsking(after, agentId)) return undefined
  const run = after.rows[agentId]
  return STRINGS.toasts.needsYou(run === undefined ? STRINGS.toasts.someone : shortened(run.description))
}

// The end of a run that was live and whose turn ran longer than T-10, a wait after it included: a teammate's or a
// resumed agent's turn is timed on its own, never from the run's first start.
export function endedToast(before: Runs, after: Runs, key: string): string | undefined {
  const was = before.rows[key]
  const run = after.rows[key]
  if (was === undefined || hasEnded(was) || run?.endedAt === undefined || !hasEnded(run)) return undefined
  const ranMs = run.endedAt - run.turnAt
  if (!(ranMs > TOAST_AFTER_MS)) return undefined
  const who = shortened(run.description)
  const time = elapsed(ranMs)
  if (run.state === 'finished') return STRINGS.toasts.finished(who, time)
  if (run.state === 'stopped') return STRINGS.toasts.stopped(who, time)
  return STRINGS.toasts.failed(who, time)
}

// Every run a record ended, in spawn order: the list's answer may end several at once.
export const endedToasts = (before: Runs, after: Runs): string[] =>
  Object.entries(after.rows)
    .sort(([, a], [, b]) => a.order - b.order)
    .flatMap(([key]) => endedToast(before, after, key) ?? [])

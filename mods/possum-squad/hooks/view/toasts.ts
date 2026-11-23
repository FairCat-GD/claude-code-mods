import type { Runs } from '../../types/index'
import { TOAST_AFTER_MS } from '../config'
import { hasEnded } from '../model/runs'
import { STRINGS } from '../strings'
import { elapsed } from './format'
import { shortened } from './runs'

// Each takes `runs` before and after an event's record. A toast names its run by its description, cut as its row's.

// A permission request that moved the agent into needing the person; before its row has shown, it is `someone`.
export function askedToast(before: Runs, after: Runs, agentId: string): string | undefined {
  if (after === before) return undefined
  const run = after.rows[agentId]
  return STRINGS.toasts.needsYou(run === undefined ? STRINGS.toasts.someone : shortened(run.description))
}

// The end of a run that was live and ran longer than T-10.
export function endedToast(before: Runs, after: Runs, agentId: string): string | undefined {
  const was = before.rows[agentId]
  const run = after.rows[agentId]
  if (was === undefined || hasEnded(was) || run?.endedAt === undefined || !hasEnded(run)) return undefined
  const ranMs = run.endedAt - run.startedAt
  if (!(ranMs > TOAST_AFTER_MS)) return undefined
  const who = shortened(run.description)
  if (run.state === 'finished') return STRINGS.toasts.finished(who, elapsed(ranMs))
  if (run.state === 'stopped') return STRINGS.toasts.stopped(who, elapsed(ranMs))
  return STRINGS.toasts.failed(who)
}

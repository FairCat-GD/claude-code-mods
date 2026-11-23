import type { Activity, Run } from '../../types/index'
import { ANIMATION_STEP_MS, MOMENT_GRACE_MS } from '../config'
import { MOMENT_STEPS, type Moment } from '../sprites/recipes'
import { STRINGS } from '../strings'
import type { RowData } from './row'

// "Reading shed/rack.txt"; an MCP tool by its own last name.
export function activityText(activity: Activity): string {
  const verb = STRINGS.activity[activity.tool]
  if (verb !== undefined && activity.target !== undefined) return `${verb} ${activity.target}`
  return STRINGS.using(activity.tool.split('__').pop() || activity.tool)
}

// The one-off a row's sprite plays while its moment is fresh: its ending, its dressing when the role came after its
// arrival, or its arrival, which dresses a role settled meanwhile. A time that cannot be read plays none.
export function momentOf(run: Run, now: number): Moment | undefined {
  const isFresh = (at: number | undefined, steps: number) => at !== undefined && now >= at && now - at < steps * ANIMATION_STEP_MS + MOMENT_GRACE_MS
  if (run.state === 'finished' || run.state === 'stopped') return isFresh(run.endedAt, MOMENT_STEPS[run.state]) ? 'ending' : undefined
  if (run.state === 'failed') return undefined
  const settledAt = run.role?.at
  if (settledAt !== undefined && settledAt - run.startedAt >= MOMENT_STEPS.arrival * ANIMATION_STEP_MS && isFresh(settledAt, MOMENT_STEPS.dressing)) {
    return 'dressing'
  }
  return isFresh(run.startedAt, MOMENT_STEPS.arrival) ? 'arrival' : undefined
}

// A run as its row shows it, given the figures the model worked out for it and the time it is drawn at.
export function rowData(run: Run, key: string, figures: { tokens: number; elapsedMs: number; contextPercent?: number }, now: number): RowData {
  const row: RowData = { id: key, order: run.order, state: run.state, description: run.description, ...figures }
  const moment = momentOf(run, now)
  if (moment !== undefined) row.moment = moment
  if (run.role !== undefined) {
    row.role = STRINGS.roles[run.role.id]
    row.roleId = run.role.id
  }
  if (run.model !== undefined) row.model = run.model
  if (run.effort !== undefined) row.effort = run.effort
  if (run.activity !== undefined) row.activity = activityText(run.activity)
  if (run.round > 1) row.round = run.round
  return row
}

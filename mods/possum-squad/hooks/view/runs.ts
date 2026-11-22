import type { Activity, Run } from '../../types/index'
import { STRINGS } from '../strings'
import type { RowData } from './row'

// "Reading shed/rack.txt"; an MCP tool by its own last name.
export function activityText(activity: Activity): string {
  const verb = STRINGS.activity[activity.tool]
  if (verb !== undefined && activity.target !== undefined) return `${verb} ${activity.target}`
  return STRINGS.using(activity.tool.split('__').pop() || activity.tool)
}

// A run as its row shows it, given the figures the model worked out for it.
export function rowData(run: Run, key: string, figures: { tokens: number; elapsedMs: number; contextPercent?: number }): RowData {
  const row: RowData = { id: key, state: run.state, description: run.description, ...figures }
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

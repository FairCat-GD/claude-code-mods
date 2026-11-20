import type { RenderElement } from 'claude-code'

import type { Activity, Run } from '../../types/index'
import { STRINGS } from '../strings'
import type { Shared } from './empty'
import { type DesktopTable, desktopRow, type RowData, terminalRow } from './row'

// "Reading shed/rack.txt"; an MCP tool by its own last name.
export function activityText(activity: Activity): string {
  const verb = STRINGS.activity[activity.tool]
  if (verb !== undefined && activity.target !== undefined) return `${verb} ${activity.target}`
  return STRINGS.using(activity.tool.split('__').pop() || activity.tool)
}

// A run as its row shows it, given the figures the model worked out for it.
export function rowData(run: Run, key: string, figures: { tokens: number; elapsedMs: number; contextPercent?: number }): RowData {
  const row: RowData = { id: key, state: run.state, description: run.description, ...figures }
  if (run.model !== undefined) row.model = run.model
  if (run.effort !== undefined) row.effort = run.effort
  if (run.activity !== undefined) row.activity = activityText(run.activity)
  if (run.round > 1) row.round = run.round
  return row
}

// One list, in spawn order; the sections come later. The terminal draws text rows, other surfaces the app's bar.
export function runsPanel(table: Shared | DesktopTable, isTerminal: boolean, rows: readonly RowData[]): RenderElement {
  const { Box } = table
  return (
    <Box flexDirection="column" gap={1}>
      {rows.map(row => (isTerminal || !('Progress' in table) ? terminalRow(table, row) : desktopRow(table, row)))}
    </Box>
  )
}

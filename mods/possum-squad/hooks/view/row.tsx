import type { Color, ElementConstructor, ProgressProps, RenderElement } from 'claude-code'

import type { RoleId, StateId } from '../../types/index'
import { STRINGS } from '../strings'
import type { Shared } from './empty'
import { bar, elapsed, fill, percent, tokens } from './format'

// One run as its row shows it. The description, model, effort and activity are agent text, drawn only as plain Text (I-04).
export type RowData = {
  id: string
  state: StateId
  description: string
  tokens: number
  elapsedMs: number
  // The role's name and id, once it is settled.
  role?: string
  roleId?: RoleId
  model?: string
  effort?: string
  activity?: string
  contextPercent?: number
  // Drawn from 2: the same task again after a finished run.
  round?: number
}

export type DesktopTable = Shared & { Progress: ElementConstructor<ProgressProps> }

// Each state's colour, from the app's theme; the word beside it says the same (I-06).
const COLOURS: Record<StateId, Color> = {
  starting: 'inactive',
  working: 'success',
  'needs-you': 'permission',
  quiet: 'warning',
  finished: 'subtle',
  failed: 'error',
  stopped: 'inactive',
}

const join = (parts: readonly (string | undefined)[]) => parts.filter(part => part !== undefined && part !== '').join(STRINGS.row.separator)
const details = (row: RowData) => join([row.role, row.model, row.effort])
const activity = (row: RowData) => row.activity ?? STRINGS.row.noActivity

function firstLine({ Box, Text }: Shared, row: RowData, mark?: RenderElement): RenderElement {
  return (
    <Box flexDirection="row" gap={1}>
      {mark}
      <Box flexGrow={1} flexShrink={1}>
        <Text wrap="end">{row.description}</Text>
      </Box>
      {row.round !== undefined && row.round > 1 ? <Text dimColor>{STRINGS.row.round(row.round)}</Text> : undefined}
      <Text color={COLOURS[row.state]}>{STRINGS.states[row.state]}</Text>
    </Box>
  )
}

// The terminal's row: a coloured mark, then four lines of text, the bar in block characters.
export function terminalRow(table: Shared, row: RowData): RenderElement {
  const { Box, Text } = table
  const mark = <Text color={COLOURS[row.state]}>{STRINGS.row.mark}</Text>
  const figures = join([`${STRINGS.row.contextShort} ${percent(row.contextPercent)}`, tokens(row.tokens), elapsed(row.elapsedMs)])
  return (
    <Box key={row.id} flexDirection="column">
      {firstLine(table, row, mark)}
      <Box flexDirection="column" paddingLeft={2}>
        <Text dimColor wrap="end">
          {details(row)}
        </Text>
        <Text wrap="end">{activity(row)}</Text>
        <Text dimColor>{`${bar(row.contextPercent)} ${figures}`}</Text>
      </Box>
    </Box>
  )
}

// The desktop's row: the sprite (the state's mark where the surface draws none) beside four lines. The last is the app's
// own bar, which draws its label and figure above the fill at the full width, so the numbers ride in its figure.
export function desktopRow(table: DesktopTable, row: RowData, sprite?: RenderElement): RenderElement {
  const { Box, Text, Progress } = table
  return (
    <Box key={row.id} flexDirection="row" gap={1}>
      {sprite ?? <Text color={COLOURS[row.state]}>{STRINGS.row.mark}</Text>}
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        {firstLine(table, row)}
        <Text size="footnote" dimColor wrap="end">
          {details(row)}
        </Text>
        <Text size="footnote" wrap="end">
          {activity(row)}
        </Text>
        <Progress
          label={STRINGS.row.context}
          value={fill(row.contextPercent)}
          valueText={join([percent(row.contextPercent), tokens(row.tokens), elapsed(row.elapsedMs)])}
        />
      </Box>
    </Box>
  )
}

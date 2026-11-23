import type { ButtonProps, Color, ElementConstructor, ProgressProps, RenderElement, SelectProps } from 'claude-code'

import type { RoleId, StateId } from '../../types/index'
import { isPickable, PICKABLE } from '../roles/rules'
import type { Moment } from '../sprites'
import { STRINGS } from '../strings'
import type { Shared } from './empty'
import { bar, elapsed, fill, percent, tokens } from './format'

// One run as its row shows it. The description, model, effort and activity are agent text, drawn only as plain Text (I-04).
export type RowData = {
  id: string
  // Spawn order: what the role picker names the run by, since its re-key leaves it alone.
  order: number
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
  // The one-off its sprite plays, around its moment.
  moment?: Moment
}

export type RowTable = Shared & { Button: ElementConstructor<ButtonProps>; Select: ElementConstructor<SelectProps> }
export type DesktopTable = RowTable & { Progress: ElementConstructor<ProgressProps> }

// The role's name is the picker's button; while the picker is open, a line under it offers the roles.
export type RolePicker = { isOpen: boolean; onToggle: () => void; onPick: (value: string) => void; onCancel: () => void }

const ROLE_OPTIONS = PICKABLE.map(id => ({ value: id, label: STRINGS.roles[id] }))

// Each state's colour, from the app's theme; the word beside it says the same (I-06).
export const COLOURS: Record<StateId | 'planned', Color> = {
  planned: 'inactive',
  starting: 'inactive',
  working: 'success',
  'needs-you': 'permission',
  quiet: 'warning',
  finished: 'subtle',
  failed: 'error',
  stopped: 'inactive',
}

const join = (parts: readonly (string | undefined)[]) => parts.filter(part => part !== undefined && part !== '').join(STRINGS.row.separator)
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

// Line 2: the role's name, which opens the picker, then the model and effort; agent text stays in its own Text.
function detailsLine({ Box, Text, Button }: RowTable, row: RowData, picker: RolePicker, isFootnote: boolean): RenderElement {
  const rest = join([row.model, row.effort])
  return (
    <Box flexDirection="row" gap={1}>
      <Button key={`role-${row.id}`} label={row.role ?? STRINGS.picker.pick} dimColor onPress={picker.onToggle} />
      {rest === '' ? undefined : (
        <Box flexGrow={1} flexShrink={1}>
          {isFootnote ? (
            <Text size="footnote" dimColor wrap="end">
              {rest}
            </Text>
          ) : (
            <Text dimColor wrap="end">
              {rest}
            </Text>
          )}
        </Box>
      )}
    </Box>
  )
}

// The picker's line: the roles, the run's own selected, and a way out without a pick.
function pickerLine({ Box, Button, Select }: RowTable, row: RowData, picker: RolePicker): RenderElement | undefined {
  if (!picker.isOpen) return undefined
  return (
    <Box flexDirection="row" gap={1}>
      {isPickable(row.roleId) ? (
        <Select key="role-pick" label={STRINGS.picker.label} options={ROLE_OPTIONS} value={row.roleId} onSelect={picker.onPick} />
      ) : (
        <Select key="role-pick" label={STRINGS.picker.label} options={ROLE_OPTIONS} onSelect={picker.onPick} />
      )}
      <Button key="role-cancel" label={STRINGS.picker.cancel} dimColor onPress={picker.onCancel} />
    </Box>
  )
}

// The terminal's row: a coloured mark, then four lines of text, the bar in block characters.
export function terminalRow(table: RowTable, row: RowData, picker: RolePicker): RenderElement {
  const { Box, Text } = table
  const mark = <Text color={COLOURS[row.state]}>{STRINGS.row.mark}</Text>
  const figures = join([`${STRINGS.row.contextShort} ${percent(row.contextPercent)}`, tokens(row.tokens), elapsed(row.elapsedMs)])
  return (
    <Box key={row.id} flexDirection="column">
      {firstLine(table, row, mark)}
      <Box flexDirection="column" paddingLeft={2}>
        {detailsLine(table, row, picker, false)}
        {pickerLine(table, row, picker)}
        <Text wrap="end">{activity(row)}</Text>
        <Text dimColor>{`${bar(row.contextPercent)} ${figures}`}</Text>
      </Box>
    </Box>
  )
}

// The desktop's row: the sprite (the state's mark where the surface draws none) beside four lines. The last is the app's
// own bar, which draws its label and figure above the fill at the full width, so the numbers ride in its figure.
export function desktopRow(table: DesktopTable, row: RowData, picker: RolePicker, sprite?: RenderElement): RenderElement {
  const { Box, Text, Progress } = table
  return (
    <Box key={row.id} flexDirection="row" gap={1}>
      {sprite ?? <Text color={COLOURS[row.state]}>{STRINGS.row.mark}</Text>}
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        {firstLine(table, row)}
        {detailsLine(table, row, picker, true)}
        {pickerLine(table, row, picker)}
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

import type { ButtonProps, Color, ElementConstructor, ProgressProps, RenderElement, SelectProps } from 'claude-code'

import type { RoleId, StateId } from '../../types/index'
import { isPickable, PICKABLE } from '../roles/rules'
import type { Moment } from '../sprites'
import { STRINGS } from '../strings'
import type { Shared } from './empty'
import { NEST_INDENT, NEST_LEVELS_DRAWN } from '../config'
import { bar, elapsed, estimate, fill, percent, tokens } from './format'

// One run as its row shows it. The description, model, effort and activity are agent text, drawn only as plain Text (I-04).
export type RowData = {
  id: string
  // Spawn order: what the role picker names the run by, since its re-key leaves it alone.
  order: number
  state: StateId
  description: string
  // Fresh tokens, its helpers' included; its time and context are its own.
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
  // The spawn order of the run that started it, when that run has a row: it is drawn under it within a section.
  parent?: number
  // With `cost` at `estimate`: its requests', and its helpers', at list prices.
  usd?: number
  // The one-off its sprite plays, around its moment.
  moment?: Moment
  // What Peek shows, given only while it is open.
  peek?: PeekData
}

// Peek's lines, each agent text whole as its own plain Text (I-04): the description, the brief, the last calls as
// activity lines, the files changed and the answer, each cut where the model cut it.
export type PeekData = {
  description: string
  brief?: string
  actions: readonly string[]
  files: readonly string[]
  answer?: string
  // The answer is an earlier turn's, while the run works again.
  isEarlierAnswer?: true
}

export type RowTable = Shared & { Button: ElementConstructor<ButtonProps>; Select: ElementConstructor<SelectProps> }
export type DesktopTable = RowTable & { Progress: ElementConstructor<ProgressProps> }

// The role's name is the picker's button; while the picker is open, a line under it offers the roles.
export type RolePicker = { isOpen: boolean; onToggle: () => void; onPick: (value: string) => void; onCancel: () => void }

// The row's Peek button, beside its activity.
export type PeekToggle = { isOpen: boolean; onToggle: () => void }

const ROLE_OPTIONS = PICKABLE.map(id => ({ value: id, label: STRINGS.roles[id] }))

// Each state's colour, from the app's theme; the word beside it says the same (I-06).
export const COLOURS: Record<StateId | 'planned', Color> = {
  planned: 'inactive',
  starting: 'inactive',
  working: 'success',
  'needs-you': 'permission',
  quiet: 'warning',
  waiting: 'inactive',
  finished: 'subtle',
  failed: 'error',
  stopped: 'inactive',
}

// In the desktop's CSS flex a one-line Text holds its Box at its width, pushing `peek` out, unless its minimum is 0.
const SHRINKS = { flexGrow: 1, flexShrink: 1, minWidth: 0, overflow: 'hidden' } as const

const join = (parts: readonly (string | undefined)[]) => parts.filter(part => part !== undefined && part !== '').join(STRINGS.row.separator)
const activity = (row: RowData) => row.activity ?? STRINGS.row.noActivity
const estimateOf = (row: RowData) => (row.usd === undefined ? undefined : estimate(row.usd))

// A helper under its parent is indented on the row's own Box, so nesting adds no element and no level.
const indentOf = (depth: number) => {
  const cells = Math.min(Math.max(0, depth), NEST_LEVELS_DRAWN) * NEST_INDENT
  return cells === 0 ? {} : { paddingLeft: cells }
}

function firstLine({ Box, Text }: Shared, row: RowData, mark?: RenderElement): RenderElement {
  return (
    <Box flexDirection="row" gap={1}>
      {mark}
      <Box {...SHRINKS}>
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
        <Box {...SHRINKS}>
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

// Line 3: the activity, cut to one line, then the button that opens or closes Peek.
function activityLine({ Box, Text, Button }: RowTable, row: RowData, peek: PeekToggle, isFootnote: boolean): RenderElement {
  return (
    <Box flexDirection="row" gap={1}>
      <Box {...SHRINKS}>
        {isFootnote ? (
          <Text size="footnote" wrap="end">
            {activity(row)}
          </Text>
        ) : (
          <Text wrap="end">{activity(row)}</Text>
        )}
      </Box>
      <Button key={`peek-${row.id}`} label={peek.isOpen ? STRINGS.peek.close : STRINGS.peek.open} dimColor onPress={peek.onToggle} />
    </Box>
  )
}

// Peek under the row: each part under its dim heading, a part with nothing left out.
function peekLines({ Box, Text }: Shared, row: RowData, isFootnote: boolean): RenderElement | undefined {
  const peek = row.peek
  if (peek === undefined) return undefined
  const line = (text: string, key: string) =>
    isFootnote ? (
      <Text key={key} size="footnote">
        {text}
      </Text>
    ) : (
      <Text key={key}>{text}</Text>
    )
  const heading = (text: string) =>
    isFootnote ? (
      <Text size="footnote" dimColor>
        {text}
      </Text>
    ) : (
      <Text dimColor>{text}</Text>
    )
  const part = (key: string, title: string, lines: readonly string[]) =>
    lines.length === 0 ? undefined : (
      <Box key={key} flexDirection="column">
        {heading(title)}
        {lines.map((text, at) => line(text, `${key}-${at}`))}
      </Box>
    )
  return (
    <Box key="peek" flexDirection="column" gap={1}>
      {line(peek.description, 'description')}
      {part('brief', STRINGS.peek.brief, peek.brief === undefined ? [] : [peek.brief])}
      {part('actions', STRINGS.peek.actions, peek.actions)}
      {part('files', STRINGS.peek.files, peek.files)}
      {part('answer', peek.isEarlierAnswer === true ? STRINGS.peek.lastAnswer : STRINGS.peek.answer, peek.answer === undefined ? [] : [peek.answer])}
    </Box>
  )
}

// The terminal's row: a coloured mark, then four lines of text, the bar in block characters, and Peek while open; a
// helper indented by its depth under its parent.
export function terminalRow(table: RowTable, row: RowData, picker: RolePicker, peek: PeekToggle, depth = 0): RenderElement {
  const { Box, Text } = table
  const mark = <Text color={COLOURS[row.state]}>{STRINGS.row.mark}</Text>
  const figures = join([`${STRINGS.row.contextShort} ${percent(row.contextPercent)}`, tokens(row.tokens), elapsed(row.elapsedMs), estimateOf(row)])
  return (
    <Box key={row.id} flexDirection="column" {...indentOf(depth)}>
      {firstLine(table, row, mark)}
      <Box flexDirection="column" paddingLeft={2}>
        {detailsLine(table, row, picker, false)}
        {pickerLine(table, row, picker)}
        {activityLine(table, row, peek, false)}
        <Text dimColor>{`${bar(row.contextPercent)} ${figures}`}</Text>
        {peekLines(table, row, false)}
      </Box>
    </Box>
  )
}

// The desktop's row: the sprite (the state's mark where the surface draws none) beside four lines. The last is the app's
// own bar, which draws its label and figure above the fill at the full width, so the numbers ride in its figure. A
// helper is indented by its depth under its parent.
export function desktopRow(table: DesktopTable, row: RowData, picker: RolePicker, peek: PeekToggle, sprite?: RenderElement, depth = 0): RenderElement {
  const { Box, Text, Progress } = table
  return (
    <Box key={row.id} flexDirection="row" gap={1} {...indentOf(depth)}>
      {sprite ?? <Text color={COLOURS[row.state]}>{STRINGS.row.mark}</Text>}
      {/* The minimum alone: hiding the column's overflow could clip the role picker. */}
      <Box flexDirection="column" flexGrow={1} flexShrink={1} minWidth={0}>
        {firstLine(table, row)}
        {detailsLine(table, row, picker, true)}
        {pickerLine(table, row, picker)}
        {activityLine(table, row, peek, true)}
        <Progress
          label={STRINGS.row.context}
          value={fill(row.contextPercent)}
          valueText={join([percent(row.contextPercent), tokens(row.tokens), elapsed(row.elapsedMs), estimateOf(row)])}
        />
        {peekLines(table, row, true)}
      </Box>
    </Box>
  )
}

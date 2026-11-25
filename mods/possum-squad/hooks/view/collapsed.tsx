import type { RenderElement } from 'claude-code'

import { STRINGS } from '../strings'
import type { RowTable } from './row'

// How many agents run and how many need the person, as the sections count them.
export type Counts = { running: number; needsYou: number }

const COLOUR = 'claude'

// The needs-you mark, in words (I-06), drawn only when anyone needs the person.
const needsYouOf = ({ Text }: RowTable, counts: Counts) =>
  counts.needsYou === 0 ? undefined : <Text color="permission">{STRINGS.collapsed.needsYou(counts.needsYou)}</Text>

const expandOf = ({ Button }: RowTable, onExpand?: () => void) =>
  onExpand === undefined ? undefined : <Button key="expand" label={STRINGS.expand} dimColor onPress={onExpand} />

// The terminal's collapsed view: one line, the Lead's mark, the running count, the needs-you mark and the way back.
export function terminalCollapsed(table: RowTable, counts: Counts, onExpand?: () => void): RenderElement {
  const { Box, Text } = table
  return (
    <Box key="collapsed" flexDirection="row" gap={1}>
      <Text color={COLOUR}>{STRINGS.row.mark}</Text>
      <Text bold>{String(counts.running)}</Text>
      <Text dimColor>{STRINGS.collapsed.running}</Text>
      {counts.needsYou === 0 ? undefined : <Text dimColor>{STRINGS.collapsed.between}</Text>}
      {needsYouOf(table, counts)}
      {expandOf(table, onExpand)}
    </Box>
  )
}

// The desktop's: the Lead carrying its joeys (the mark where the surface draws no sprite), beside the count, the
// needs-you mark and the way back.
export function desktopCollapsed(table: RowTable, counts: Counts, sprite?: RenderElement, onExpand?: () => void): RenderElement {
  const { Box, Text } = table
  return (
    <Box key="collapsed" flexDirection="row" gap={1} alignItems="center">
      {sprite ?? <Text color={COLOUR}>{STRINGS.row.mark}</Text>}
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Text bold>{String(counts.running)}</Text>
          <Text dimColor>{STRINGS.collapsed.running}</Text>
        </Box>
        {needsYouOf(table, counts)}
        {expandOf(table, onExpand)}
      </Box>
    </Box>
  )
}

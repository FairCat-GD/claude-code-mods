import type { RenderElement } from 'claude-code'

import type { Limit } from '../../types/index'
import { STRINGS } from '../strings'
import type { Shared } from './empty'
import { bar, elapsed, estimate, fill, percent, tokens } from './format'
import type { DesktopTable } from './row'

// The main session's own figures, and the header's totals over it and every run.
export type LeadData = { tokens: number; contextPercent?: number }
// `limits` once a measure gave any; `usd` only with `cost` at `estimate`.
export type SessionData = { tokens: number; workedMs: number; limits?: readonly Limit[]; usd?: number }

// The Lead is no run, so it has no state's colour; it takes the app's own.
const COLOUR = 'claude'

const figures = (lead: LeadData) => [percent(lead.contextPercent), tokens(lead.tokens)].join(STRINGS.row.separator)

// The terminal's Lead: its mark and name, then its context in block characters.
export function terminalLead({ Box, Text }: Shared, lead: LeadData): RenderElement {
  return (
    <Box key="lead" flexDirection="column">
      <Box flexDirection="row" gap={1}>
        <Text color={COLOUR}>{STRINGS.row.mark}</Text>
        <Text bold>{STRINGS.lead}</Text>
      </Box>
      <Box paddingLeft={2}>
        <Text dimColor>{`${bar(lead.contextPercent)} ${STRINGS.row.contextShort} ${figures(lead)}`}</Text>
      </Box>
    </Box>
  )
}

// The desktop's Lead: its sprite (the mark where the surface draws none) beside its name and the app's bar of its context.
export function desktopLead({ Box, Text, Progress }: DesktopTable, lead: LeadData, sprite?: RenderElement): RenderElement {
  return (
    <Box key="lead" flexDirection="row" gap={1}>
      {sprite ?? <Text color={COLOUR}>{STRINGS.row.mark}</Text>}
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        <Text weight="semibold">{STRINGS.lead}</Text>
        <Progress label={STRINGS.row.context} value={fill(lead.contextPercent)} valueText={figures(lead)} />
      </Box>
    </Box>
  )
}

const limitText = (limit: Limit) => STRINGS.limit(STRINGS.limits[limit.kind] ?? limit.kind, percent(limit.percent))

// The header's line, the same on every surface: the plan's limits, the totals, and the estimate when it is asked for.
export function sessionLine({ Text }: Shared, session: SessionData): RenderElement {
  const parts = [
    ...(session.limits ?? []).map(limitText),
    STRINGS.session(tokens(session.tokens), elapsed(session.workedMs)),
    ...(session.usd === undefined ? [] : [estimate(session.usd)]),
  ]
  return (
    <Text key="session" dimColor>
      {parts.join(STRINGS.row.separator)}
    </Text>
  )
}

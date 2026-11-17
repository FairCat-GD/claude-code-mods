import type { ElementConstructor, RenderElement, SvgProps } from 'claude-code'

import type { Entry, Limit } from '../spike'
import { BOBBING, QUERIED, SPRITE_PX } from '../sprites/fixture'
import { STRINGS } from '../strings'
import { emptyPanel, type Shared } from './empty'

// Enough framed sprites at once to see what the pane pays for them.
export const FRAMED = 20

export type SpikeData = {
  entries: readonly Entry[]
  // Absent when the usage call failed.
  asked: readonly Limit[] | undefined
  // Absent until a measurement arrived.
  measured: readonly Limit[] | undefined
  ticks: number
}

// Absent where the surface declares no `Svg`.
type Sprite = ElementConstructor<SvgProps> | undefined

const windows = (limits: readonly Limit[]) =>
  limits.length === 0 ? STRINGS.spike.noWindows : limits.map(limit => `${limit.kind} ${limit.percentUsed}%`).join(', ')

function sprites({ Box, Text }: Shared, Svg: Sprite): RenderElement {
  if (Svg === undefined) return <Text dimColor>{STRINGS.spike.desktopOnly}</Text>
  const sprite = (key: string, source: string, isInteractive: boolean) => (
    <Svg key={key} source={source} alt={STRINGS.spike.alt} width={SPRITE_PX} height={SPRITE_PX} {...(isInteractive ? { isInteractive } : {})} />
  )
  return (
    <Box flexDirection="column">
      <Text>{STRINGS.spike.framed(FRAMED)}</Text>
      <Box flexDirection="row" flexWrap="wrap">
        {Array.from({ length: FRAMED }, (_, i) => sprite(`framed${i}`, BOBBING, true))}
      </Box>
      <Text>{STRINGS.spike.image}</Text>
      {sprite('image', BOBBING, false)}
      <Text>{STRINGS.spike.queried}</Text>
      <Box flexDirection="row">
        {sprite('queriedFramed', QUERIED, true)}
        {sprite('queriedImage', QUERIED, false)}
      </Box>
    </Box>
  )
}

const title = (entry: Entry) =>
  `${entry.event}${entry.word === undefined ? '' : ` ${entry.word}`} · ${entry.isSubagent ? STRINGS.spike.subagent : STRINGS.spike.main}` +
  `  ×${entry.count}  #${entry.first}–#${entry.last}`

export function spikePanel(table: Shared, Svg: Sprite, data: SpikeData): RenderElement {
  const { Box, Text } = table
  return (
    <Box flexDirection="column">
      <Text bold>{STRINGS.spike.heading}</Text>
      <Text dimColor>{STRINGS.spike.note}</Text>
      {emptyPanel(table)}
      {sprites(table, Svg)}
      <Text bold>{STRINGS.spike.limits}</Text>
      <Text>{STRINGS.spike.asked(data.asked === undefined ? STRINGS.spike.unavailable : windows(data.asked))}</Text>
      <Text>{STRINGS.spike.measured(data.measured === undefined ? STRINGS.spike.notMeasured : windows(data.measured))}</Text>
      <Text bold>{STRINGS.spike.heard}</Text>
      <Text dimColor>{data.entries.length === 0 ? STRINGS.spike.nothingHeard : STRINGS.spike.order}</Text>
      {data.entries.map(entry => (
        <Box key={`${entry.event}|${entry.word ?? ''}|${entry.isSubagent}`} flexDirection="column">
          <Text>{title(entry)}</Text>
          <Text dimColor>{STRINGS.spike.input(entry.input)}</Text>
          <Text dimColor>{STRINGS.spike.result(entry.result)}</Text>
        </Box>
      ))}
      <Text dimColor>{STRINGS.spike.ticks(data.ticks)}</Text>
    </Box>
  )
}

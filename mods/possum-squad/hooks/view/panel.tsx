import type { ButtonProps, ElementConstructor, RenderElement, SvgProps } from 'claude-code'

import type { StateId } from '../../types/index'
import { sprite, squad } from '../sprites'
import { STRINGS } from '../strings'
import { emptyPanel, type Shared } from './empty'
import { desktopLead, type LeadData, type SessionData, sessionLine, terminalLead } from './lead'
import { type DesktopTable, desktopRow, type RowData, terminalRow } from './row'
import { spriteElement } from './sprite'

export type PanelTable = Shared & { Button: ElementConstructor<ButtonProps> }

export type PanelData = {
  lead: LeadData
  session: SessionData
  // Every run's row, in spawn order.
  rows: readonly RowData[]
  isFinishedOpen: boolean
  // The set the sprites wear, and whether they move.
  look: { set: string; motion: 'auto' | 'off' }
}

export type SectionId = keyof typeof STRINGS.sections

// The sections in their order, and the states each holds; once any run exists, Running is drawn even when empty.
export const SECTIONS: readonly { id: SectionId; states: readonly StateId[] }[] = [
  { id: 'needs-you', states: ['needs-you'] },
  { id: 'running', states: ['starting', 'working', 'quiet'] },
  { id: 'finished', states: ['finished', 'failed', 'stopped'] },
]

// The header (the Lead and the session's totals), then the sections, or the empty panel's line when no agent has run.
// The terminal draws text rows and block bars; other surfaces the app's own bar.
export function panel(table: PanelTable | (PanelTable & DesktopTable), isTerminal: boolean, data: PanelData, onToggleFinished: () => void): RenderElement {
  const { Box, Text, Button } = table
  const asText = isTerminal || !('Progress' in table)
  // Sprites wherever the surface draws an Svg; the terminal's table answers one too, so it is never asked.
  const Svg = asText || !('Svg' in table) ? undefined : (table as { Svg: ElementConstructor<SvgProps> }).Svg
  const { set, motion } = data.look
  const rowSprite = (one: RowData) =>
    Svg &&
    spriteElement(
      Svg,
      sprite({ set, role: one.roleId, pose: one.state, motion }),
      STRINGS.sprite.alt(one.role ?? STRINGS.sprite.plain, STRINGS.states[one.state]),
    )
  const leadSprite = Svg && spriteElement(Svg, sprite({ set, role: 'lead', pose: 'idle', motion }), STRINGS.roles.lead)
  const row = (one: RowData) => (asText ? terminalRow(table, one) : desktopRow(table, one, rowSprite(one)))
  const sections = SECTIONS.map(section => ({ ...section, rows: data.rows.filter(one => section.states.includes(one.state)) })).filter(
    section => section.id === 'running' || section.rows.length > 0,
  )
  return (
    <Box flexDirection="column" gap={1}>
      <Box key="header" flexDirection="column">
        {asText ? terminalLead(table, data.lead) : desktopLead(table, data.lead, leadSprite)}
        {sessionLine(table, data.session)}
      </Box>
      {data.rows.length === 0
        ? emptyPanel(table, Svg && spriteElement(Svg, squad(), STRINGS.sprite.squad))
        : sections.map(section => {
            const isFinished = section.id === 'finished'
            const isOpen = !isFinished || data.isFinishedOpen
            return (
              <Box key={`section-${section.id}`} flexDirection="column" gap={1}>
                <Box flexDirection="row" gap={1}>
                  <Text bold>{STRINGS.heading(STRINGS.sections[section.id], section.rows.length)}</Text>
                  {isFinished ? <Button key="finished" label={isOpen ? STRINGS.hide : STRINGS.show} dimColor onPress={onToggleFinished} /> : undefined}
                </Box>
                {isOpen ? section.rows.map(row) : undefined}
              </Box>
            )
          })}
    </Box>
  )
}

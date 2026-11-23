import type { ButtonProps, ElementConstructor, RenderElement, SvgProps } from 'claude-code'

import type { StateId } from '../../types/index'
import { type Gallery, sprite, squad } from '../sprites'
import { STRINGS } from '../strings'
import { emptyPanel, type Shared } from './empty'
import { desktopGallery, terminalGallery } from './gallery'
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
  // Drawn in the list's place while `/possums roles` has it open.
  gallery?: Gallery
}

export type PanelActions = { onToggleFinished: () => void; onCloseGallery: () => void }

export type SectionId = keyof typeof STRINGS.sections

// The sections in their order, and the states each holds; once any run exists, Running is drawn even when empty.
export const SECTIONS: readonly { id: SectionId; states: readonly StateId[] }[] = [
  { id: 'needs-you', states: ['needs-you'] },
  { id: 'running', states: ['starting', 'working', 'quiet'] },
  { id: 'finished', states: ['finished', 'failed', 'stopped'] },
]

// The header (the Lead and the session's totals), then the gallery, the sections, or the empty panel's line when no
// agent has run. The terminal draws text rows and block bars; other surfaces the app's own bar.
export function panel(table: PanelTable | (PanelTable & DesktopTable), isTerminal: boolean, data: PanelData, actions: PanelActions): RenderElement {
  const { Box, Text, Button } = table
  const asText = isTerminal || !('Progress' in table)
  // Sprites wherever the surface draws an Svg; the terminal's table answers one too, so it is never asked.
  const Svg = asText || !('Svg' in table) ? undefined : (table as { Svg: ElementConstructor<SvgProps> }).Svg
  const { set, motion } = data.look
  const rowSprite = (one: RowData) =>
    Svg &&
    spriteElement(
      Svg,
      sprite({ set, role: one.roleId, pose: one.state, motion, ...(one.moment === undefined ? {} : { moment: one.moment }) }),
      // An arrival stands as starting does, so its alt stays the same while the row's state moves on beneath it.
      STRINGS.sprite.alt(one.role ?? STRINGS.sprite.plain, STRINGS.states[one.moment === 'arrival' ? 'starting' : one.state]),
    )
  const leadSprite = Svg && spriteElement(Svg, sprite({ set, role: 'lead', pose: 'idle', motion }), STRINGS.roles.lead)
  const row = (one: RowData) => (asText ? terminalRow(table, one) : desktopRow(table, one, rowSprite(one)))
  const sections = SECTIONS.map(section => ({ ...section, rows: data.rows.filter(one => section.states.includes(one.state)) })).filter(
    section => section.id === 'running' || section.rows.length > 0,
  )
  const drawSection = (section: (typeof sections)[number]) => {
    const isFinished = section.id === 'finished'
    const isOpen = !isFinished || data.isFinishedOpen
    return (
      <Box key={`section-${section.id}`} flexDirection="column" gap={1}>
        <Box flexDirection="row" gap={1}>
          <Text bold>{STRINGS.heading(STRINGS.sections[section.id], section.rows.length)}</Text>
          {isFinished ? <Button key="finished" label={isOpen ? STRINGS.hide : STRINGS.show} dimColor onPress={actions.onToggleFinished} /> : undefined}
        </Box>
        {isOpen ? section.rows.map(row) : undefined}
      </Box>
    )
  }
  const list = () => {
    if (data.gallery !== undefined) {
      return asText ? terminalGallery(table, data.gallery, actions.onCloseGallery) : desktopGallery(table, data.gallery, data.look, Svg, actions.onCloseGallery)
    }
    return data.rows.length === 0 ? emptyPanel(table, Svg && spriteElement(Svg, squad(), STRINGS.sprite.squad)) : sections.map(drawSection)
  }
  return (
    <Box flexDirection="column" gap={1}>
      <Box key="header" flexDirection="column">
        {asText ? terminalLead(table, data.lead) : desktopLead(table, data.lead, leadSprite)}
        {sessionLine(table, data.session)}
      </Box>
      {list()}
    </Box>
  )
}

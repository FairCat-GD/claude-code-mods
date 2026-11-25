import type { ElementConstructor, RenderElement, SvgProps } from 'claude-code'

import type { StateId } from '../../types/index'
import { JOEYS_DRAWN, MOMENT_ROOM, ROWS_DRAWN, SPRITE_BUDGET } from '../config'
import { type Gallery, leadWith, type Sprite, sprite, squad } from '../sprites'
import { STRINGS } from '../strings'
import { type Counts, desktopCollapsed, terminalCollapsed } from './collapsed'
import { emptyPanel } from './empty'
import { desktopGallery, terminalGallery } from './gallery'
import { desktopLead, type LeadData, type SessionData, sessionLine, terminalLead } from './lead'
import { type DesktopTable, desktopRow, type PeekToggle, type RolePicker, type RowData, type RowTable, terminalRow } from './row'
import { spriteElement } from './sprite'

export type PanelTable = RowTable

export type PanelData = {
  lead: LeadData
  session: SessionData
  // Every run's row, in spawn order.
  rows: readonly RowData[]
  isFinishedOpen: boolean
  // The set the sprites wear, and whether they move.
  look: { set: string; motion: 'auto' | 'off' }
  // Drawn in the list's place while `/possums roles` has it open, one part at a time.
  gallery?: Gallery
  galleryPart?: number
  // The run whose role picker is open, by its spawn order.
  pickerFor?: number
  // The run whose Peek is open, by its spawn order.
  peekFor?: number
  // The person's collapsed view, and the desktop's minimized pane, which draws it whatever the person chose.
  isCollapsed?: boolean
  isWidget?: boolean
}

export type PanelActions = {
  onToggleFinished: () => void
  onCloseGallery: () => void
  onMoveGallery: (step: 1 | -1) => void
  // A row's role button, a pick from its picker, and the picker's way out; each names the run by its spawn order.
  onToggleRole: (order: number) => void
  onPickRole: (order: number, value: string) => void
  onCancelRole: () => void
  // A row's Peek button, naming the run by its spawn order.
  onTogglePeek: (order: number) => void
  // The header's button, and the collapsed view's way back.
  onCollapse: (isCollapsed: boolean) => void
}

export type SectionId = keyof typeof STRINGS.sections

// The sections in their order, and the states each holds; once any run exists, Running is drawn even when empty.
export const SECTIONS: readonly { id: SectionId; states: readonly StateId[] }[] = [
  { id: 'needs-you', states: ['needs-you'] },
  { id: 'running', states: ['starting', 'working', 'quiet'] },
  { id: 'finished', states: ['finished', 'failed', 'stopped'] },
]

// The agents in Running, and in Needs you, quiet ones running: every row, drawn or not.
export function countsOf(rows: readonly RowData[]): Counts {
  const [needsYou, running] = SECTIONS.slice(0, 2).map(section => rows.filter(one => section.states.includes(one.state)).length)
  return { running: running ?? 0, needsYou: needsYou ?? 0 }
}

const sizeOf = (sprites: readonly (Sprite | undefined)[]) => sprites.reduce((sum, one) => sum + (one?.source.length ?? 0), 0)

// Each row's sprite within the budget, in drawing order: its own while every row's fits. Past that, rows take their
// still while it fits and the rest none, then move again in order while the total still fits. So the first rows move,
// the next stand still, and the last draw their state's mark.
export function withinBudget(own: readonly Sprite[], still: (at: number) => Sprite, budget: number): (Sprite | undefined)[] {
  if (sizeOf(own) <= budget) return [...own]
  let left = budget
  let isFull = false
  const chosen = own.map((_, at): Sprite | undefined => {
    const one = isFull ? undefined : still(at)
    if (one === undefined || one.source.length > left) {
      isFull = true
      return undefined
    }
    left -= one.source.length
    return one
  })
  for (const [at, one] of chosen.entries()) {
    const mine = own[at]
    if (one === undefined || mine === undefined || one === mine) continue
    const more = mine.source.length - one.source.length
    if (more > left) break
    left -= more
    chosen[at] = mine
  }
  return chosen
}

// Each row's one-off where it fits, in drawing order: in what the rows left of the budget and the room above it. Only a
// row drawn as its steady look plays one, so a moment never moves another row between moving and still.
export function withMoments(
  chosen: readonly (Sprite | undefined)[],
  steady: readonly Sprite[],
  playing: readonly Sprite[],
  room: number,
): (Sprite | undefined)[] {
  let left = room
  return chosen.map((one, at) => {
    const moment = playing[at]
    if (one === undefined || one !== steady[at] || moment === undefined || moment === one) return one
    const more = moment.source.length - one.source.length
    if (more > left) return one
    left -= more
    return moment
  })
}

// The collapsed view: the Lead carrying a joey per running agent up to T-14, the count and the needs-you mark; with
// the way back to the list except in the minimized pane, where a press may not reach.
function collapsedPanel(table: PanelTable, asText: boolean, Svg: ElementConstructor<SvgProps> | undefined, data: PanelData, actions: PanelActions) {
  const counts = countsOf(data.rows)
  const onExpand = data.isWidget === true ? undefined : () => actions.onCollapse(false)
  if (asText) return terminalCollapsed(table, counts, onExpand)
  const joeys = Math.min(counts.running, JOEYS_DRAWN)
  const lead = Svg && spriteElement(Svg, leadWith(data.look.set, joeys, data.look.motion), STRINGS.collapsed.alt(joeys))
  return desktopCollapsed(table, counts, lead, onExpand)
}

// The header (the Lead and the session's totals), then the gallery, the sections, or the empty panel's line when no
// agent has run; or the collapsed view in their place. The terminal draws text rows and block bars; other surfaces
// the app's own bar.
export function panel(table: PanelTable | (PanelTable & DesktopTable), isTerminal: boolean, data: PanelData, actions: PanelActions): RenderElement {
  const { Box, Text, Button } = table
  const asText = isTerminal || !('Progress' in table)
  // Sprites wherever the surface draws an Svg; the terminal's table answers one too, so it is never asked.
  const Svg = asText || !('Svg' in table) ? undefined : (table as { Svg: ElementConstructor<SvgProps> }).Svg
  // The gallery the person asked for draws over their collapsed view; the minimized pane draws only the glance.
  if (data.isWidget === true || (data.isCollapsed === true && data.gallery === undefined)) {
    return (
      <Box flexDirection="column" gap={1}>
        {collapsedPanel(table, asText, Svg, data, actions)}
      </Box>
    )
  }
  const { set, motion } = data.look
  const lead = Svg && sprite({ set, role: 'lead', pose: 'idle', motion })
  const pickerOf = (one: RowData): RolePicker => ({
    isOpen: data.pickerFor === one.order,
    onToggle: () => actions.onToggleRole(one.order),
    onPick: value => actions.onPickRole(one.order, value),
    onCancel: actions.onCancelRole,
  })
  const peekOf = (one: RowData): PeekToggle => ({ isOpen: data.peekFor === one.order, onToggle: () => actions.onTogglePeek(one.order) })
  // Rows past the cap are not drawn, in drawing order: Needs you, Running, then Finished while open.
  let drawable = ROWS_DRAWN
  const sections = SECTIONS.map(section => {
    const rows = data.rows.filter(one => section.states.includes(one.state))
    const isOpen = section.id !== 'finished' || data.isFinishedOpen
    const shown = isOpen ? rows.slice(0, drawable) : []
    drawable -= shown.length
    return { ...section, rows, isOpen, shown }
  }).filter(section => section.id === 'running' || section.rows.length > 0)
  const shown = sections.flatMap(section => section.shown)
  // The budget is fitted on each row's steady look, which a moment elsewhere never changes, so no row flips between
  // moving and still while another arrives or ends; the one-offs then play in what is left. The gallery draws no row.
  const isList = Svg !== undefined && data.gallery === undefined
  const steady = isList ? shown.map(one => sprite({ set, role: one.roleId, pose: one.state, motion })) : []
  const playing = isList
    ? shown.map((one, at) => (one.moment === undefined ? steady[at] : sprite({ set, role: one.roleId, pose: one.state, motion, moment: one.moment })))
    : []
  // A still steady look is its own still, so a stopped row stands as it does under the budget.
  const still = (at: number) => {
    const mine = steady[at]
    return mine !== undefined && !mine.isAnimated ? mine : sprite({ set, role: shown[at]?.roleId, pose: shown[at]?.state ?? 'working', motion: 'off' })
  }
  const budget = SPRITE_BUDGET - (lead?.source.length ?? 0)
  const fitted = withinBudget(steady, still, budget)
  const sprites = withMoments(fitted, steady, playing as Sprite[], budget - sizeOf(fitted) + MOMENT_ROOM)
  const placeOf = new Map(shown.map((one, at) => [one, at] as const))
  const rowSprite = (one: RowData) => {
    const at = placeOf.get(one) ?? -1
    const drawn = sprites[at]
    if (Svg === undefined || drawn === undefined) return undefined
    // An arrival stands as starting does, so its alt stays the same while the row's state moves on beneath it; a row
    // the budget stills names its own state.
    const state = one.moment === 'arrival' && drawn === playing[at] ? 'starting' : one.state
    return spriteElement(Svg, drawn, STRINGS.sprite.alt(one.role ?? STRINGS.sprite.plain, STRINGS.states[state]))
  }
  const row = (one: RowData) =>
    asText ? terminalRow(table, one, pickerOf(one), peekOf(one)) : desktopRow(table, one, pickerOf(one), peekOf(one), rowSprite(one))
  const drawSection = (section: (typeof sections)[number]) => {
    const isFinished = section.id === 'finished'
    const hidden = section.isOpen ? section.rows.length - section.shown.length : 0
    return (
      <Box key={`section-${section.id}`} flexDirection="column" gap={1}>
        <Box flexDirection="row" gap={1}>
          <Text bold>{STRINGS.heading(STRINGS.sections[section.id], section.rows.length)}</Text>
          {isFinished ? <Button key="finished" label={section.isOpen ? STRINGS.hide : STRINGS.show} dimColor onPress={actions.onToggleFinished} /> : undefined}
        </Box>
        {section.shown.map(row)}
        {hidden > 0 ? (
          <Text key="more" dimColor>
            {STRINGS.more(hidden)}
          </Text>
        ) : undefined}
      </Box>
    )
  }
  const list = () => {
    if (data.gallery !== undefined) {
      const part = { at: data.galleryPart ?? 0, onMove: actions.onMoveGallery }
      return asText
        ? terminalGallery(table, data.gallery, part, actions.onCloseGallery)
        : desktopGallery(table, data.gallery, part, data.look, Svg, actions.onCloseGallery)
    }
    return data.rows.length === 0 ? emptyPanel(table, Svg && spriteElement(Svg, squad(), STRINGS.sprite.squad)) : sections.map(drawSection)
  }
  return (
    <Box flexDirection="column" gap={1}>
      <Box key="header" flexDirection="column">
        {asText ? terminalLead(table, data.lead) : desktopLead(table, data.lead, Svg && lead && spriteElement(Svg, lead, STRINGS.roles.lead))}
        <Box flexDirection="row" gap={1}>
          <Box flexGrow={1} flexShrink={1}>
            {sessionLine(table, data.session)}
          </Box>
          {/* Over the gallery a collapse would show nothing until it closes, so the button waits for the list. */}
          {data.gallery === undefined ? <Button key="collapse" label={STRINGS.collapse} dimColor onPress={() => actions.onCollapse(true)} /> : undefined}
        </Box>
      </Box>
      {list()}
    </Box>
  )
}

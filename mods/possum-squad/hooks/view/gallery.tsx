import type { ButtonProps, ElementConstructor, RenderElement, SvgProps } from 'claude-code'

import type { StateId } from '../../types/index'
import { GALLERY_ROLES_PER_PART } from '../config'
import { type Gallery, type Moment, sprite } from '../sprites'
import { STRINGS } from '../strings'
import type { Shared } from './empty'
import { COLOURS } from './row'
import { spriteElement } from './sprite'

export type GalleryState = StateId | 'planned'

// Every state a sprite has a pose for, in the order the motion table lists them.
export const GALLERY_STATES: readonly GalleryState[] = ['planned', 'starting', 'working', 'needs-you', 'quiet', 'finished', 'failed', 'stopped']

// The one-off each state shows, played again after a rest: arriving in starting, the ending in finished and stopped.
export const GALLERY_MOMENTS: Readonly<Partial<Record<GalleryState, Moment>>> = { starting: 'arrival', finished: 'ending', stopped: 'ending' }

export type GalleryTable = Shared & { Button: ElementConstructor<ButtonProps> }

// The part shown, from 0, and the press that moves one part either way.
export type GalleryPart = { at: number; onMove: (step: 1 | -1) => void }

// The gallery's parts: its roles a few at a time, in their order.
export const partsOf = (gallery: Gallery): number => Math.max(1, Math.ceil(gallery.roles.length / GALLERY_ROLES_PER_PART))

// One part along, wrapping at either end so the controls stay in place.
export const movedPart = (at: number, step: 1 | -1, parts: number): number => (((at + step) % parts) + parts) % parts

// A part that is not a whole number or lies past the last is the first.
export const shownPart = (gallery: Gallery, at: number): number => (Number.isInteger(at) && at >= 0 && at < partsOf(gallery) ? at : 0)

function rolesOf(gallery: Gallery, at: number): Gallery['roles'] {
  const from = shownPart(gallery, at) * GALLERY_ROLES_PER_PART
  return gallery.roles.slice(from, from + GALLERY_ROLES_PER_PART)
}

// The set's title and the close button, then the way between parts: previous, "2 of 6", next.
function heading({ Box, Text, Button }: GalleryTable, gallery: Gallery, part: GalleryPart, onClose: () => void): RenderElement {
  return (
    <Box key="gallery-heading" flexDirection="column">
      <Box flexDirection="row" gap={1}>
        <Text bold>{STRINGS.gallery.heading(gallery.title)}</Text>
        <Button key="gallery" label={STRINGS.gallery.close} dimColor onPress={onClose} />
      </Box>
      <Box flexDirection="row" gap={1}>
        <Button key="gallery-previous" label={STRINGS.gallery.previous} dimColor onPress={() => part.onMove(-1)} />
        <Text>{STRINGS.gallery.part(shownPart(gallery, part.at) + 1, partsOf(gallery))}</Text>
        <Button key="gallery-next" label={STRINGS.gallery.next} dimColor onPress={() => part.onMove(1)} />
      </Box>
    </Box>
  )
}

// The terminal draws no sprite: each state's mark and word, then the part's roles, each name and costume.
export function terminalGallery(table: GalleryTable, gallery: Gallery, part: GalleryPart, onClose: () => void): RenderElement {
  const { Box, Text } = table
  return (
    <Box key="gallery" flexDirection="column" gap={1}>
      {heading(table, gallery, part, onClose)}
      <Box key="states" flexDirection="column">
        <Text bold>{STRINGS.gallery.states}</Text>
        {GALLERY_STATES.map(state => (
          <Box key={state} flexDirection="row" gap={1}>
            <Text color={COLOURS[state]}>{STRINGS.row.mark}</Text>
            <Text>{STRINGS.states[state]}</Text>
          </Box>
        ))}
      </Box>
      <Box key="roles" flexDirection="column">
        <Text bold>{STRINGS.gallery.roles}</Text>
        {rolesOf(gallery, part.at).map(role => (
          <Box key={role.id} flexDirection="row" gap={1}>
            <Text>{STRINGS.roles[role.id]}</Text>
            <Text dimColor>{STRINGS.gallery.between}</Text>
            <Text dimColor>{role.costume}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// The part's roles, each name and costume over its eight poses in the set, moving as the motion setting lets them, each
// with its state's word; the state's mark where the surface draws no sprite.
export function desktopGallery(
  table: GalleryTable,
  gallery: Gallery,
  part: GalleryPart,
  look: { set: string; motion: 'auto' | 'off' },
  Svg: ElementConstructor<SvgProps> | undefined,
  onClose: () => void,
): RenderElement {
  const { Box, Text } = table
  const pose = (role: Gallery['roles'][number]['id'], state: GalleryState) => {
    if (Svg === undefined) return <Text color={COLOURS[state]}>{STRINGS.row.mark}</Text>
    const moment = Object.hasOwn(GALLERY_MOMENTS, state) ? GALLERY_MOMENTS[state] : undefined
    const drawn = sprite({ ...look, role, pose: state, ...(moment === undefined ? {} : { moment, isRepeated: true }) })
    return spriteElement(Svg, drawn, STRINGS.sprite.alt(STRINGS.roles[role], STRINGS.states[state]))
  }
  return (
    <Box key="gallery" flexDirection="column" gap={1}>
      {heading(table, gallery, part, onClose)}
      {rolesOf(gallery, part.at).map(role => (
        <Box key={role.id} flexDirection="column">
          <Box flexDirection="row" gap={1}>
            <Text weight="semibold">{STRINGS.roles[role.id]}</Text>
            <Text dimColor>{role.costume}</Text>
          </Box>
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            {GALLERY_STATES.map(state => (
              <Box key={state} flexDirection="column" alignItems="center">
                {pose(role.id, state)}
                <Text size="footnote" dimColor>
                  {STRINGS.states[state]}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

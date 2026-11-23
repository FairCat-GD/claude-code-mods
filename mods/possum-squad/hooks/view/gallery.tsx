import type { ButtonProps, ElementConstructor, RenderElement, SvgProps } from 'claude-code'

import type { StateId } from '../../types/index'
import { type Gallery, sprite } from '../sprites'
import { STRINGS } from '../strings'
import type { Shared } from './empty'
import { COLOURS } from './row'
import { spriteElement } from './sprite'

export type GalleryState = StateId | 'planned'

// Every state a sprite has a pose for, in the order the motion table lists them.
export const GALLERY_STATES: readonly GalleryState[] = ['planned', 'starting', 'working', 'needs-you', 'quiet', 'finished', 'failed', 'stopped']

export type GalleryTable = Shared & { Button: ElementConstructor<ButtonProps> }

function heading({ Box, Text, Button }: GalleryTable, gallery: Gallery, onClose: () => void): RenderElement {
  return (
    <Box key="gallery-heading" flexDirection="row" gap={1}>
      <Text bold>{STRINGS.gallery.heading(gallery.title)}</Text>
      <Button key="gallery" label={STRINGS.gallery.close} dimColor onPress={onClose} />
    </Box>
  )
}

// The terminal draws no sprite: each state's mark and word, then each role's name and costume.
export function terminalGallery(table: GalleryTable, gallery: Gallery, onClose: () => void): RenderElement {
  const { Box, Text } = table
  return (
    <Box key="gallery" flexDirection="column" gap={1}>
      {heading(table, gallery, onClose)}
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
        {gallery.roles.map(role => (
          <Box key={role.id} flexDirection="row" gap={1}>
            <Text>{STRINGS.roles[role.id]}</Text>
            <Text dimColor>{role.costume}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// Each role's name and costume over its eight poses in the set, still, each with its state's word; the state's mark
// where the surface draws no sprite.
export function desktopGallery(
  table: GalleryTable,
  gallery: Gallery,
  set: string,
  Svg: ElementConstructor<SvgProps> | undefined,
  onClose: () => void,
): RenderElement {
  const { Box, Text } = table
  const pose = (role: Gallery['roles'][number]['id'], state: GalleryState) =>
    Svg === undefined ? (
      <Text color={COLOURS[state]}>{STRINGS.row.mark}</Text>
    ) : (
      spriteElement(Svg, sprite({ set, role, pose: state, motion: 'off' }), STRINGS.sprite.alt(STRINGS.roles[role], STRINGS.states[state]))
    )
  return (
    <Box key="gallery" flexDirection="column" gap={1}>
      {heading(table, gallery, onClose)}
      {gallery.roles.map(role => (
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

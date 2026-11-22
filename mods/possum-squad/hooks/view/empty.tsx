import type { BoxProps, ElementConstructor, RenderElement, TextProps } from 'claude-code'

import { STRINGS } from '../strings'

// The elements every surface the pane draws on carries.
export type Shared = { Box: ElementConstructor<BoxProps>; Text: ElementConstructor<TextProps> }

// The squad asleep, where the surface draws sprites, above the line that says why the panel is empty.
export function emptyPanel({ Box, Text }: Shared, squad?: RenderElement): RenderElement {
  return (
    <Box flexDirection="column" gap={1}>
      {squad}
      <Text dimColor>{STRINGS.empty}</Text>
    </Box>
  )
}

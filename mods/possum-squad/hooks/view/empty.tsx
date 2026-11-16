import type { BoxProps, ElementConstructor, RenderElement, TextProps } from 'claude-code'

import { STRINGS } from '../strings'

// The elements every surface the pane draws on carries.
export type Shared = { Box: ElementConstructor<BoxProps>; Text: ElementConstructor<TextProps> }

export function emptyPanel({ Box, Text }: Shared): RenderElement {
  return (
    <Box flexDirection="column">
      <Text dimColor>{STRINGS.empty}</Text>
    </Box>
  )
}

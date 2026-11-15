// The moments the mod plays an effect for.
export type FxKind =
  | 'push'
  | 'commit'
  | 'tests'
  | 'compact'
  | 'helpers'
  | 'context'
  | 'redzone'
  | 'plan'
  | 'fixes'
  | 'review'
  | 'cherry'
  | 'merge'
  | 'rebase'
  | 'pr'

// Where effects play: in the conversation, under the row of what set them off
// (the strip above the prompt box for one with no row), or always in that strip.
export type Placement = 'conversation' | 'bottom'

// The effect on show: its identity (id), which one, which drawing of it (seed),
// its words, the helper count, number of findings or context percentage it draws
// (value), when it ends, and the conversation row it plays in (`tool:<id>`,
// `fx:(take N)` or `reply:<text>`), if any.
export type Shown = {
  id: number
  kind: FxKind
  seed: number
  title: string
  subtitle: string
  value: number
  until: number
  row?: string
}

declare module 'claude-code' {
  interface PluginState {
    'cartoon-fx': { shown: Shown | null; isYellow: boolean; isRed: boolean; placement: Placement }
  }
}

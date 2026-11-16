// The session's flags for the pane.
export type View = {
  // The person closed the pane this session, with its close mark or key.
  isClosedByPerson: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'possum-squad': { view: Shaped<View> }
  }
}

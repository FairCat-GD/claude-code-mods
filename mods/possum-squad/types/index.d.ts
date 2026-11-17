// The session's flags for the pane.
export type View = {
  // The person closed the pane this session, with its close mark or key.
  isClosedByPerson: boolean
}

// A run's state, by its id; `planned` is reserved.
export type StateId = 'starting' | 'working' | 'needs-you' | 'quiet' | 'finished' | 'failed' | 'stopped'

declare module 'claude-code' {
  interface PluginState {
    'possum-squad': { view: Shaped<View> }
  }
}

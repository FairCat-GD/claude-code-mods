// The session's flags for the pane.
export type View = {
  // The person closed the pane this session, with its close mark or key.
  isClosedByPerson: boolean
}

// A run's state, by its id; `planned` is reserved.
export type StateId = 'starting' | 'working' | 'needs-you' | 'quiet' | 'finished' | 'failed' | 'stopped'

// The token counts a run's model requests reported, summed.
export type Tokens = { input: number; output: number; cacheRead: number; cacheWrite: number }

// The last tool a run's model asked for, and what the call names: a path, a command's first line, a pattern.
export type Activity = { tool: string; target?: string }

// One agent's life, as its row shows it. Any plugin can read `runs`, so it holds what a row needs and no more.
export type Run = {
  // Absent until the spawn's result names it.
  agentId?: string
  parentId?: string
  type: string
  description: string
  // 2 and up when a finished run had the same description.
  round: number
  isTeammate: boolean
  state: StateId
  model?: string
  effort?: string
  startedAt: number
  endedAt?: number
  tokens: Tokens
  // The last request's size: its input, cache reads and cache writes.
  lastRequest?: number
  activity?: Activity
  // Calls the last step asked for, until the loop's next step or its end.
  inFlight: number
  // Spawn order, so rows keep their places.
  order: number
}

// What a loop's events said before any row claimed its agent id; drawn nowhere. Its turn has begun.
export type Pending = {
  model?: string
  effort?: string
  tokens: Tokens
  lastRequest?: number
  activity?: Activity
  inFlight: number
}

// Rows by key: the agent id once known, else the spawn's own key. Pending entries by agent id, oldest first.
export type Runs = { rows: Record<string, Run>; pending: Record<string, Pending>; next: number }

declare module 'claude-code' {
  interface PluginState {
    'possum-squad': { view: Shaped<View>; runs: Shaped<Runs> }
  }
}

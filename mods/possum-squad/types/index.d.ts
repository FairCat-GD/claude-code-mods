// The session's flags for the pane.
export type View = {
  // The person closed the pane this session, with its close mark or key.
  isClosedByPerson: boolean
  // `/possums roles` drew the gallery in the list's place; its close button or any close of the pane ends it.
  isGalleryOpen: boolean
  // The gallery's part shown, from 0; absent is the first. Its close drops it.
  galleryPart?: number
  // The run whose role picker is open, by its spawn order, which its re-key leaves alone.
  pickerFor?: number
}

// A run's state, by its id; `planned` is reserved.
export type StateId = 'starting' | 'working' | 'needs-you' | 'quiet' | 'finished' | 'failed' | 'stopped'

// The token counts a run's model requests reported, summed.
export type Tokens = { input: number; output: number; cacheRead: number; cacheWrite: number }

// The last tool a run's model asked for, and what the call names: a path, a command's first line, a pattern.
export type Activity = { tool: string; target?: string }

// The seventeen roles, by id; `lead` is the main session's alone.
export type RoleId =
  | 'lead'
  | 'scout'
  | 'planner'
  | 'builder'
  | 'tester'
  | 'bugcatcher'
  | 'reviewer'
  | 'researcher'
  | 'operator'
  | 'courier'
  | 'writer'
  | 'artist'
  | 'analyst'
  | 'guard'
  | 'janitor'
  | 'pilot'
  | 'helper'

// The rule that settled a role, or the person's pick (`manual`); nothing calls `stated`.
export type RoleSource = 'stated' | 'remembered' | 'type' | 'name' | 'keywords' | 'tools' | 'fallback' | 'manual'

// `at`: the clock's time it settled, which cues the hop into its outfit; absent when the clock could not be read.
export type Role = { id: RoleId; source: RoleSource; at?: number }

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
  // Absent until a rule settles it, so the row draws plain; after, only the person's pick changes it (I-07).
  role?: Role
  // Reads and searches seen while the role is unsettled.
  weakCalls?: number
  // A call of this turn went to the background, so the turn's end may not be the run's.
  hasBackgroundWork?: boolean
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
  // What its calls settled, or the reads and searches among them, for the row that claims it.
  role?: Role
  weakCalls?: number
  hasBackgroundWork?: boolean
  model?: string
  effort?: string
  tokens: Tokens
  lastRequest?: number
  activity?: Activity
  inFlight: number
}

// What ended runs had counted once Finished no longer keeps them, so the header's totals never drop.
export type Past = { tokens: number; workedMs: number }

// Rows by key: the agent id once known, else the spawn's own key. Pending entries by agent id, oldest first.
export type Runs = { rows: Record<string, Run>; pending: Record<string, Pending>; next: number; past: Past }

// The main session's context as `session.measure` last gave it: the last request's input over the model's window.
export type LeadContext = { tokens?: number; window: number; percent?: number }

// The main session's own numbers: its context, and its turns' tokens and time summed.
export type Lead = { context?: LeadContext; tokens: Tokens; workedMs: number }

declare module 'claude-code' {
  interface PluginState {
    'possum-squad': { view: Shaped<View>; runs: Shaped<Runs>; lead: Shaped<Lead> }
  }
}

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
  // The run whose Peek is open, by its spawn order; any close of the pane drops it.
  peekFor?: number
}

// A call's request to the person: its time, or none when the clock could not be read. Only a step begun after it moves
// the call on.
export type Ask = { at?: number }

// A run's state, by its id; `planned` is reserved.
export type StateId = 'starting' | 'working' | 'needs-you' | 'quiet' | 'finished' | 'failed' | 'stopped'

// The token counts a run's model requests reported, summed.
export type Tokens = { input: number; output: number; cacheRead: number; cacheWrite: number }

// Fresh tokens and the estimate in dollars, summed: what pruned helpers counted, kept for their nearest kept ancestor.
export type Tally = { tokens: number; usd: number }

// The last tool a run's model asked for, and what the call names: a path, a command's first line, a pattern.
export type Activity = { tool: string; target?: string }

// A text's first characters as Peek draws them, or a path's last; `isCut` when there was more.
export type Excerpt = { text: string; isCut?: true }

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
  // The spawn's prompt, its first characters.
  brief?: Excerpt
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
  // The time of its last event, from which a live run with no call in flight goes quiet.
  heardAt: number
  // When its current turn began: its start, a resume's result or its latest turn start.
  turnAt: number
  // While it needs the person, the call's request.
  ask?: Ask
  tokens: Tokens
  // Its requests at their models' list prices (T-12): an estimate, never a bill.
  usd: number
  // What its helpers had counted once Finished no longer keeps them, so its rolled-up totals never drop.
  prunedHelpers?: Tally
  // The last request's size: its input, cache reads and cache writes.
  lastRequest?: number
  activity?: Activity
  // The last calls it asked for, oldest first, and the files it changed, each once, the latest last, each its last
  // characters.
  actions?: Activity[]
  files?: Excerpt[]
  // Its latest turn's answer that had text, its first characters.
  answer?: Excerpt
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
  // A call of its waits on a permission prompt, so the row that claims it needs the person.
  ask?: Ask
  model?: string
  effort?: string
  tokens: Tokens
  usd: number
  lastRequest?: number
  activity?: Activity
  actions?: Activity[]
  files?: Excerpt[]
  inFlight: number
}

// What ended runs had counted once Finished no longer keeps them, so the header's totals never drop.
export type Past = { tokens: number; workedMs: number; usd: number }

// Rows by key: the agent id once known, else the spawn's own key. Pending entries by agent id, oldest first.
export type Runs = { rows: Record<string, Run>; pending: Record<string, Pending>; next: number; past: Past }

// The main session's context as `session.measure` last gave it: the last request's input over the model's window.
export type LeadContext = { tokens?: number; window: number; percent?: number }

// A plan's usage window as the engine last reported it: `five_hour`, `seven_day`, a gateway's `spend_limit`.
export type Limit = { kind: string; percent: number }

// The main session's own numbers: its context, its turns' tokens, time and estimate summed, and the plan's limits, absent
// until a measure gives one.
export type Lead = { context?: LeadContext; tokens: Tokens; workedMs: number; usd: number; limits?: Limit[] }

declare module 'claude-code' {
  interface PluginState {
    'possum-squad': { view: Shaped<View>; runs: Shaped<Runs>; lead: Shaped<Lead> }
  }
}

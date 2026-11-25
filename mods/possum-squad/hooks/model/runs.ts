import type { Activity, Ask, Excerpt, Past, Pending, Role, Run, Runs, StateId, Tokens } from '../../types/index'
import { ACTIONS_KEPT, FILES_KEPT, FINISHED_KEPT, PEEK_CHARS, QUIET_AFTER_MS, ROLE_SETTLES_MS } from '../config'
import { windowOf } from '../data/models'

// Each function takes `runs` and an event's record, and returns `runs` as it should now be. An event it cannot
// place changes nothing and returns the same object. A spawn, an end and the fallback role take the time.

const NO_PAST: Past = { tokens: 0, workedMs: 0 }
export const NO_RUNS: Runs = { rows: {}, pending: {}, next: 0, past: NO_PAST }
export const NO_TOKENS: Tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }

// Loops nobody spawned (the engine's own forks) are dropped at their end; this bounds any that never end.
export const PENDING_KEPT = 50

export type Spawn = {
  // The spawn's row key at its input: its tool call's id, with the agent's place in a workflow run, which all of the
  // run's agents share; empty for a fork no tool call starts.
  key: string
  type: string
  description: string
  // The prompt the agent is given.
  brief?: string
  isTeammate: boolean
  parentId?: string
  // The agent a resume continues.
  resumes?: string
  // What the type and description settle at once.
  role?: Role
}

export type Settled = { agentId?: string; model?: string; isDenied: boolean }

// `tools` is what the step's calls say of the role, read on from the run's earlier reads and searches.
export type Step = {
  model?: string
  effort?: string
  usage?: Tokens
  activity?: Activity
  // Every call it asked for, and the files those change.
  actions?: readonly Activity[]
  files?: readonly string[]
  calls: number
  tools?: { weak: number; role?: Role }
  // A call went to the background.
  hasBackground?: boolean
  // The step's time, when the clock could be read: a role its calls settle settled then.
  at?: number
  // When the step began, as read before its stream: the step that asked a call may end after the request.
  began?: number
}

// `answer` is the turn's answer, kept when it has text.
export type Ending = { reason: string; hasText: boolean; answer?: string }

const ENDED: readonly StateId[] = ['finished', 'failed', 'stopped']
export const hasEnded = (run: Run) => ENDED.includes(run.state)
export const isLive = (run: Run) => !hasEnded(run)
// The one-second clock runs for a live run, and for a run whose role may still fall back to Helper.
export const keepsClock = (run: Run) => isLive(run) || run.role === undefined

// An answer with text is Finished; aborted is Stopped; an error, a refusal or an empty answer is Failed. A teammate's
// turn that ends without text (it answered with a message) rests as Finished until its next turn.
export function endingOf(ending: Ending, isTeammate: boolean): StateId {
  if (ending.reason === 'aborted') return 'stopped'
  if (ending.reason === 'answer' && (ending.hasText || isTeammate)) return 'finished'
  return 'failed'
}

const without = <T>(record: Record<string, T>, key: string) => {
  const { [key]: _, ...rest } = record
  return rest
}

// A text's first characters, counted whole so an emoji is never split.
export function cutTo(text: string, characters: number): { text: string; isCut: boolean } {
  const all = Array.from(text)
  return all.length > characters ? { text: all.slice(0, characters).join(''), isCut: true } : { text, isCut: false }
}

// What Peek keeps of a brief or an answer: nothing more than it draws, since any plugin can read `runs`.
export function excerptOf(text: string): Excerpt {
  const cut = cutTo(text.trim(), PEEK_CHARS)
  return cut.isCut ? { text: cut.text, isCut: true } : { text: cut.text }
}

// The latest calls, oldest first.
const withActions = (held: readonly Activity[] | undefined, actions: readonly Activity[]) => [...(held ?? []), ...actions].slice(-ACTIONS_KEPT)

// Each file once, at the place it was last changed, so the latest stay.
function withFiles(held: readonly string[] | undefined, files: readonly string[]): string[] {
  const order = [...(held ?? [])]
  for (const file of files) {
    const at = order.indexOf(file)
    if (at !== -1) order.splice(at, 1)
    order.push(file)
  }
  return order.slice(-FILES_KEPT)
}

export const add = (a: Tokens, b: Tokens): Tokens => ({
  input: a.input + b.input,
  output: a.output + b.output,
  cacheRead: a.cacheRead + b.cacheRead,
  cacheWrite: a.cacheWrite + b.cacheWrite,
})

function roundFor(runs: Runs, description: string): number {
  const rounds = Object.values(runs.rows)
    .filter(run => run.state === 'finished' && run.description === description)
    .map(run => run.round)
  return rounds.length === 0 ? 1 : Math.max(...rounds) + 1
}

// A resumed agent is the same run come back, so it starts no round of its own.
function opened(runs: Runs, spawn: Spawn, at: number, agentId?: string): Run {
  const run: Run = {
    type: spawn.type,
    description: spawn.description,
    round: spawn.resumes === undefined ? roundFor(runs, spawn.description) : 1,
    isTeammate: spawn.isTeammate,
    state: 'starting',
    startedAt: at,
    heardAt: at,
    turnAt: at,
    tokens: NO_TOKENS,
    inFlight: 0,
    order: runs.next,
  }
  if (agentId !== undefined) run.agentId = agentId
  if (spawn.parentId !== undefined) run.parentId = spawn.parentId
  if (spawn.brief !== undefined && spawn.brief.trim() !== '') run.brief = excerptOf(spawn.brief)
  if (spawn.role !== undefined) run.role = { ...spawn.role, at }
  return run
}

// The one guard of I-07: evidence reaches only a run or entry whose role is unsettled. A role settled at a known time
// keeps it.
function withEvidence<T extends Run | Pending>(next: T, evidence: { weak?: number; role?: Role }, at?: number): T {
  if (next.role !== undefined) return next
  if (evidence.role !== undefined) {
    const { weakCalls: _, ...settled } = next
    return { ...settled, role: at === undefined ? evidence.role : { ...evidence.role, at } } as T
  }
  if (evidence.weak !== undefined && evidence.weak > 0) next.weakCalls = evidence.weak
  return next
}

// A step's numbers on a row or a pending entry: tokens summed, the last request's size, the model and effort in use.
function withStep<T extends Run | Pending>(held: T, step: Step): T {
  const next: T = { ...held, inFlight: step.calls }
  if (step.usage !== undefined) {
    next.tokens = add(held.tokens, step.usage)
    next.lastRequest = step.usage.input + step.usage.cacheRead + step.usage.cacheWrite
  }
  if (step.model !== undefined) next.model = step.model
  if (step.effort !== undefined) next.effort = step.effort
  if (step.activity !== undefined) next.activity = step.activity
  if (step.actions !== undefined && step.actions.length > 0) next.actions = withActions(held.actions, step.actions)
  if (step.files !== undefined && step.files.length > 0) next.files = withFiles(held.files, step.files)
  if (step.hasBackground === true) next.hasBackgroundWork = true
  return step.tools === undefined ? next : withEvidence(next, step.tools, step.at)
}

function claimed(run: Run, pending: Pending | undefined): Run {
  if (pending === undefined) return run
  const state = pending.ask === undefined ? 'working' : 'needs-you'
  const next: Run = { ...run, state, tokens: add(run.tokens, pending.tokens), inFlight: pending.inFlight }
  if (pending.ask !== undefined) next.ask = pending.ask
  if (pending.lastRequest !== undefined) next.lastRequest = pending.lastRequest
  if (pending.model !== undefined) next.model = pending.model
  if (pending.effort !== undefined) next.effort = pending.effort
  if (pending.activity !== undefined) next.activity = pending.activity
  if (pending.actions !== undefined) next.actions = withActions(run.actions, pending.actions)
  if (pending.files !== undefined) next.files = withFiles(run.files, pending.files)
  if (pending.hasBackgroundWork === true) next.hasBackgroundWork = true
  return withEvidence(next, {
    ...(pending.weakCalls === undefined ? {} : { weak: pending.weakCalls }),
    ...(pending.role === undefined ? {} : { role: pending.role }),
  })
}

// Finished keeps the latest T-06 ended runs; a teammate is never dropped, since its next turn returns it. What a
// dropped run counted stays in `past`.
function pruned(runs: Runs): Runs {
  const ended = Object.entries(runs.rows)
    .filter(([, run]) => hasEnded(run) && !run.isTeammate)
    .sort(([, a], [, b]) => (b.endedAt ?? 0) - (a.endedAt ?? 0) || b.order - a.order)
  if (ended.length <= FINISHED_KEPT) return runs
  const gone = ended.slice(FINISHED_KEPT)
  const dropped = new Set(gone.map(([key]) => key))
  const past = gone.reduce(
    (sum, [, run]) => ({ tokens: sum.tokens + fresh(run.tokens), workedMs: sum.workedMs + ((run.endedAt ?? run.startedAt) - run.startedAt) }),
    runs.past,
  )
  return { ...runs, rows: Object.fromEntries(Object.entries(runs.rows).filter(([key]) => !dropped.has(key))), past }
}

// An entry keeps its place when it changes, so the first dropped is the loop that began longest ago.
function withPending(runs: Runs, agentId: string, pending: Pending): Runs {
  const entries = Object.entries({ ...runs.pending, [agentId]: pending })
  return { ...runs, pending: entries.length > PENDING_KEPT ? Object.fromEntries(entries.slice(-PENDING_KEPT)) : Object.fromEntries(entries) }
}

const NO_PENDING: Pending = { tokens: NO_TOKENS, inFlight: 0 }

// A spawn opens its row at once, under its own key, so the row shows before the agent's id is known.
export function spawnOpened(runs: Runs, spawn: Spawn, at: number): Runs {
  if (spawn.resumes !== undefined || spawn.key === '' || runs.rows[spawn.key] !== undefined) return runs
  return { ...runs, rows: { ...runs.rows, [spawn.key]: opened(runs, spawn, at) }, next: runs.next + 1 }
}

// The spawn's result re-keys its row to the agent's id and claims what that loop said meanwhile. A result naming no
// agent here (a refusal among them) takes the row away. A resume that was not refused returns its agent's row to life.
export function spawnSettled(runs: Runs, spawn: Spawn, settled: Settled, at: number): Runs {
  const { agentId } = settled
  if (spawn.resumes !== undefined) {
    if (settled.isDenied) return runs
    const id = agentId ?? spawn.resumes
    const held = runs.rows[id]
    if (held === undefined) {
      const run = claimed({ ...opened(runs, spawn, at, id), ...(settled.model === undefined ? {} : { model: settled.model }) }, runs.pending[id])
      return { ...runs, rows: { ...runs.rows, [id]: run }, pending: without(runs.pending, id), next: runs.next + 1 }
    }
    if (!hasEnded(held)) return runs
    const { endedAt: _, ...resumed } = held
    return { ...runs, rows: { ...runs.rows, [id]: { ...resumed, state: 'starting', heardAt: at, turnAt: at } } }
  }
  const held = runs.rows[spawn.key] ?? (spawn.key === '' ? opened(runs, spawn, at) : undefined)
  const next = spawn.key === '' ? runs.next + 1 : runs.next
  const rows = without(runs.rows, spawn.key)
  if (held === undefined) return runs
  if (agentId === undefined) return spawn.key === '' ? runs : { ...runs, rows }
  const model = held.model ?? settled.model
  const run = claimed({ ...held, agentId, heardAt: at, ...(model === undefined ? {} : { model }) }, runs.pending[agentId])
  return { ...runs, rows: { ...rows, [agentId]: run }, pending: without(runs.pending, agentId), next }
}

// A turn of a known run puts it back to working, a resumed or a teammate's run included. `at` is its time, when the
// clock could be read.
export function turnStarted(runs: Runs, agentId: string, at?: number): Runs {
  const held = runs.rows[agentId]
  if (held !== undefined) {
    if (held.state === 'working' && held.endedAt === undefined && (at === undefined || at === held.heardAt)) return runs
    const { endedAt: _, hasBackgroundWork: __, ask: ___, ...run } = held
    return { ...runs, rows: { ...runs.rows, [agentId]: { ...run, state: 'working', ...(at === undefined ? {} : { heardAt: at, turnAt: at }) } } }
  }
  return runs.pending[agentId] === undefined ? withPending(runs, agentId, NO_PENDING) : runs
}

// The reads and searches a run or its pending entry has seen while its role is unsettled.
export const weakOf = (runs: Runs, agentId: string): number => (runs.rows[agentId] ?? runs.pending[agentId])?.weakCalls ?? 0

// The engine checks a call while the step that asked it still streams, so that step's record can come after the
// request: only a step begun after it is the call moved on, and one whose start is unknown is taken as one. A request
// whose time is unknown waits out the next record, the asking step's, and then the first step begun after that one
// ended. Returns the request still waiting, or none.
function waitAfter(ask: Ask, step: Step): Ask | undefined {
  if (ask.at === undefined) return { at: step.at ?? step.began ?? 0 }
  return step.began === undefined || step.began >= ask.at ? undefined : ask
}

// A later step is the asked call moved on, allowed or refused: a row that needed the person works again.
export function stepped(runs: Runs, agentId: string, step: Step): Runs {
  const held = runs.rows[agentId]
  if (held !== undefined) {
    const { ask, ...rest } = held
    const waiting = held.state === 'needs-you' && ask !== undefined ? waitAfter(ask, step) : undefined
    const run = withStep(held.state !== 'needs-you' ? held : waiting === undefined ? { ...rest, state: 'working' } : { ...rest, ask: waiting }, step)
    if (step.at !== undefined) run.heardAt = step.at
    return { ...runs, rows: { ...runs.rows, [agentId]: run } }
  }
  const { ask, ...entry } = runs.pending[agentId] ?? NO_PENDING
  const waiting = ask === undefined ? undefined : waitAfter(ask, step)
  return withPending(runs, agentId, withStep(waiting === undefined ? entry : { ...entry, ask: waiting }, step))
}

// A call of the agent's waits on a permission prompt: its live row needs the person until the call moves on. An entry
// no row has claimed yet keeps it for the row that will. A later call's request, while the row still waits, is the one
// a step must begin after.
export function asked(runs: Runs, agentId: string, at?: number): Runs {
  const ask: Ask = at === undefined ? {} : { at }
  const held = runs.rows[agentId]
  if (held !== undefined) {
    if (held.state !== 'starting' && held.state !== 'working' && held.state !== 'needs-you') return runs
    return { ...runs, rows: { ...runs.rows, [agentId]: { ...held, state: 'needs-you', ask, ...(at === undefined ? {} : { heardAt: at }) } } }
  }
  const pending = runs.pending[agentId]
  return pending === undefined ? runs : withPending(runs, agentId, { ...pending, ask })
}

// A run's turn ends it; a loop no spawn claimed by its end is dropped and never drawn. An answer with text is kept for
// Peek; one without leaves the last that had it, a teammate's earlier turn's.
export function turnEnded(runs: Runs, agentId: string, ending: Ending, at: number): Runs {
  const held = runs.rows[agentId]
  if (held === undefined) return runs.pending[agentId] === undefined ? runs : { ...runs, pending: without(runs.pending, agentId) }
  const { ask: _, ...rest } = held
  const run: Run = { ...rest, state: endingOf(ending, held.isTeammate), endedAt: at, inFlight: 0 }
  if (ending.hasText && ending.answer !== undefined && ending.answer.trim() !== '') run.answer = excerptOf(ending.answer)
  return pruned({ ...runs, rows: { ...runs.rows, [agentId]: run } })
}

// A run no rule settled is Helper once T-04 has passed since its start, or once it ends: no rule can fire after. A
// teammate's end, or one with work left in the background, may not be its last, so it waits for its next turn or T-04.
export function fellBack(runs: Runs, now: number, fallback: Role): Runs {
  const due = Object.entries(runs.rows).filter(
    ([, run]) => run.role === undefined && (now - run.startedAt >= ROLE_SETTLES_MS || (hasEnded(run) && !run.isTeammate && run.hasBackgroundWork !== true)),
  )
  if (due.length === 0) return runs
  const rows = { ...runs.rows }
  for (const [key, run] of due) {
    const { weakCalls: _, ...settled } = run
    rows[key] = { ...settled, role: { ...fallback, at: now } }
  }
  return { ...runs, rows }
}

// The row with that spawn order, under whichever key it is kept.
export const runOf = (runs: Runs, order: number): Run | undefined => Object.values(runs.rows).find(run => run.order === order)

// The person's pick: the one change to a settled role I-07 allows. Its time cues the hop into the new outfit.
export function reassigned(runs: Runs, order: number, role: Role): Runs {
  const entry = Object.entries(runs.rows).find(([, run]) => run.order === order)
  if (entry === undefined) return runs
  const [key, run] = entry
  const { weakCalls: _, ...picked } = run
  return { ...runs, rows: { ...runs.rows, [key]: { ...picked, role } } }
}

// A clear, a resume or a fork of the session starts the list and its totals over.
export const cleared = (runs: Runs): Runs =>
  Object.keys(runs.rows).length === 0 && Object.keys(runs.pending).length === 0 && runs.past.tokens === 0 && runs.past.workedMs === 0
    ? runs
    : { ...NO_RUNS, next: runs.next }

// No agent has had a row since the session began or was cleared.
export const isEmpty = (runs: Runs) => Object.keys(runs.rows).length === 0 && runs.past.tokens === 0 && runs.past.workedMs === 0

// The rows to draw, in spawn order.
export const shownRuns = (runs: Runs): Run[] => Object.values(runs.rows).sort((a, b) => a.order - b.order)

// How long a live run with no call in flight has heard nothing, once that is T-05 or more: it shows as quiet, which is
// worked out where it is drawn and never kept. A time that cannot be read says none. A step's calls are in flight until
// the loop's next step is recorded.
export function quietMs(run: Run, now: number): number | undefined {
  if ((run.state !== 'starting' && run.state !== 'working') || run.inFlight > 0) return undefined
  const quiet = now - run.heardAt
  return quiet >= QUIET_AFTER_MS ? quiet : undefined
}

export type Figures = { tokens: number; elapsedMs: number; contextPercent?: number }

// Fresh tokens are input, cache writes and output; cache reads are counted apart.
export const fresh = (tokens: Tokens) => tokens.input + tokens.cacheWrite + tokens.output

// Context is the last request's size over the model's window.
export function figures(run: Run, now: number): Figures {
  const tokens = fresh(run.tokens)
  const elapsedMs = (run.endedAt ?? now) - run.startedAt
  if (run.lastRequest === undefined) return { tokens, elapsedMs }
  return { tokens, elapsedMs, contextPercent: (run.lastRequest / windowOf(run.model)) * 100 }
}

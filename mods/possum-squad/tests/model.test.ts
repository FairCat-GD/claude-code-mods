import { expect, test } from 'claude-code/testing'

import type { Role, Runs } from '../types/index'
import { FINISHED_KEPT, ROLE_SETTLES_MS } from '../hooks/config'
import { DEFAULT_WINDOW, WINDOWS } from '../hooks/data/models'
import {
  cleared,
  endingOf,
  fellBack,
  figures,
  NO_RUNS,
  PENDING_KEPT,
  type Spawn,
  type Step,
  shownRuns,
  spawnOpened,
  spawnSettled,
  stepped,
  turnEnded,
  turnStarted,
  weakOf,
} from '../hooks/model/runs'
import { callsOf, TARGET_CHARS } from '../hooks/model/tools'
import { leadFigures, measured, NO_LEAD, totals, turnCounted } from '../hooks/model/lead'

// Fictional spawns and steps.
const SHOVELS: Spawn = { key: 'toolu_shovels', type: 'Explore', description: 'Count the shovels', isTeammate: false }
const RAKES: Spawn = { key: 'toolu_rakes', type: 'general-purpose', description: 'Rake the leaves', isTeammate: false }
const usage = (input: number, output: number, cacheRead: number, cacheWrite: number) => ({ input, output, cacheRead, cacheWrite })
const STEP: Step = { model: 'claude-haiku-5-5', effort: 'medium', usage: usage(120, 30, 4000, 50), calls: 0 }
const ANSWERED = { reason: 'answer', hasText: true }

// A spawn's input, then its result, at the given times.
const spawned = (runs: Runs, spawn: Spawn, agentId: string, at = 0) =>
  spawnSettled(spawnOpened(runs, spawn, at), spawn, { agentId, model: 'claude-sonnet-5-5', isDenied: false }, at)

test('a spawn opens a starting row at once, and its result re-keys it to the agent id with the resolved model', () => {
  const opened = spawnOpened(NO_RUNS, SHOVELS, 1_000)
  expect(Object.keys(opened.rows)).toEqual([SHOVELS.key])
  expect(opened.rows[SHOVELS.key]?.state).toBe('starting')

  const settled = spawnSettled(opened, SHOVELS, { agentId: 'agent-1', model: 'claude-sonnet-5-5', isDenied: false }, 1_005)
  expect(Object.keys(settled.rows)).toEqual(['agent-1'])
  expect(settled.rows['agent-1']).toMatchObject({ agentId: 'agent-1', model: 'claude-sonnet-5-5', state: 'starting', startedAt: 1_000 })
})

test("a loop's turn and step before the spawn's result wait as pending, and the re-key claims them", () => {
  let runs = spawnOpened(NO_RUNS, SHOVELS, 0)
  runs = turnStarted(runs, 'agent-1')
  runs = stepped(runs, 'agent-1', STEP)
  expect(Object.keys(runs.pending)).toEqual(['agent-1'])
  expect(shownRuns(runs).map(run => run.state)).toEqual(['starting'])

  runs = spawnSettled(runs, SHOVELS, { agentId: 'agent-1', model: 'claude-sonnet-5-5', isDenied: false }, 30)
  expect(runs.pending).toEqual({})
  // The step named the model in use, which outranks the spawn's.
  expect(runs.rows['agent-1']).toMatchObject({ state: 'working', model: 'claude-haiku-5-5', effort: 'medium', tokens: STEP.usage, lastRequest: 4_170 })
})

test('a loop no spawn claims is dropped at its end, and the pending list is bounded', () => {
  let runs = turnStarted(NO_RUNS, 'fork-1')
  runs = turnEnded(runs, 'fork-1', ANSWERED, 5)
  expect(runs).toEqual(NO_RUNS)

  for (let i = 0; i < PENDING_KEPT + 5; i++) runs = turnStarted(runs, `fork-${i}`)
  expect(Object.keys(runs.pending)).toHaveLength(PENDING_KEPT)
  expect(runs.pending['fork-0']).toBeUndefined()
  expect(runs.pending[`fork-${PENDING_KEPT + 4}`]).toBeDefined()
})

test('a refused spawn, a rejected one and a result naming no agent leave no row', () => {
  const opened = spawnOpened(NO_RUNS, SHOVELS, 0)
  expect(spawnSettled(opened, SHOVELS, { isDenied: true }, 1).rows).toEqual({})
  expect(spawnSettled(opened, SHOVELS, { model: 'claude-sonnet-5-5', isDenied: false }, 1).rows).toEqual({})
})

test("a workflow's agents share one tool call but get a row each", () => {
  const first: Spawn = { ...SHOVELS, key: 'toolu_workflow#1' }
  const second: Spawn = { ...RAKES, key: 'toolu_workflow#2' }
  let runs = spawnOpened(spawnOpened(NO_RUNS, first, 0), second, 0)
  runs = spawnSettled(runs, first, { agentId: 'agent-1', isDenied: false }, 1)
  runs = spawnSettled(runs, second, { agentId: 'agent-2', isDenied: false }, 1)
  expect(shownRuns(runs).map(run => run.description)).toEqual([SHOVELS.description, RAKES.description])
})

test('a fork no tool call starts opens at its result', () => {
  const fork: Spawn = { ...SHOVELS, key: '' }
  const opened = spawnOpened(NO_RUNS, fork, 0)
  expect(opened).toBe(NO_RUNS)
  expect(Object.keys(spawnSettled(opened, fork, { agentId: 'agent-1', isDenied: false }, 1).rows)).toEqual(['agent-1'])
})

test('a resumed agent returns to its row; a resume of an agent no row has opens one', () => {
  let runs = turnEnded(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1', ANSWERED, 50)
  const resume: Spawn = { ...SHOVELS, key: 'toolu_resume', resumes: 'agent-1' }
  expect(spawnOpened(runs, resume, 60)).toBe(runs)

  runs = spawnSettled(spawnOpened(runs, resume, 60), resume, { agentId: 'agent-1', isDenied: false }, 61)
  expect(shownRuns(runs)).toHaveLength(1)
  expect(runs.rows['agent-1']?.state).toBe('starting')
  expect(runs.rows['agent-1']?.endedAt).toBeUndefined()
  expect(turnStarted(runs, 'agent-1').rows['agent-1']?.state).toBe('working')

  // A refused resume leaves the finished row as it was.
  const ended = turnEnded(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1', ANSWERED, 50)
  expect(spawnSettled(ended, resume, { isDenied: true }, 61)).toBe(ended)

  const fresh = spawnSettled(NO_RUNS, { ...RAKES, key: 'toolu_r', resumes: 'agent-9' }, { agentId: 'agent-9', isDenied: false }, 5)
  expect(Object.keys(fresh.rows)).toEqual(['agent-9'])
  // The same agent come back is no second round, even beside a finished run of the same task.
  const beside = spawnSettled(ended, { ...SHOVELS, key: 'toolu_r', resumes: 'agent-9' }, { agentId: 'agent-9', isDenied: false }, 5)
  expect(beside.rows['agent-9']?.round).toBe(1)
})

test('a second spawn with a finished run’s description is round 2; a failed one does not count', () => {
  let runs = turnEnded(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1', ANSWERED, 10)
  runs = spawned(runs, { ...SHOVELS, key: 'toolu_again' }, 'agent-2')
  expect(runs.rows['agent-2']?.round).toBe(2)

  let failed = turnEnded(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1', { reason: 'error', hasText: false }, 10)
  failed = spawned(failed, { ...SHOVELS, key: 'toolu_again' }, 'agent-2')
  expect(failed.rows['agent-2']?.round).toBe(1)
})

test('the endings: text is finished, aborted is stopped, error, refusal and an empty answer are failed', () => {
  expect(endingOf({ reason: 'answer', hasText: true }, false)).toBe('finished')
  expect(endingOf({ reason: 'aborted', hasText: true }, false)).toBe('stopped')
  expect(endingOf({ reason: 'error', hasText: false }, false)).toBe('failed')
  expect(endingOf({ reason: 'refusal', hasText: false }, false)).toBe('failed')
  expect(endingOf({ reason: 'answer', hasText: false }, false)).toBe('failed')
  // A teammate answering with a message rests as finished; its other endings are anyone's.
  expect(endingOf({ reason: 'answer', hasText: false }, true)).toBe('finished')
  expect(endingOf({ reason: 'error', hasText: false }, true)).toBe('failed')
})

test("a teammate's next turn puts its row back to working, its time counted from its first start", () => {
  const mate: Spawn = { ...SHOVELS, isTeammate: true }
  let runs = turnStarted(spawned(NO_RUNS, mate, 'agent-1', 100), 'agent-1')
  runs = turnEnded(runs, 'agent-1', { reason: 'answer', hasText: false }, 200)
  expect(runs.rows['agent-1']?.state).toBe('finished')
  runs = turnStarted(runs, 'agent-1')
  expect(runs.rows['agent-1']).toMatchObject({ state: 'working', startedAt: 100 })
  expect(runs.rows['agent-1']?.endedAt).toBeUndefined()
})

test('tokens sum over steps, fresh apart from cache reads, and the context is the last request over the window', () => {
  let runs = spawned(NO_RUNS, SHOVELS, 'agent-1', 0)
  runs = stepped(runs, 'agent-1', STEP)
  runs = stepped(runs, 'agent-1', { ...STEP, usage: usage(80, 20, 6000, 0) })
  const run = runs.rows['agent-1']
  if (run === undefined) throw new Error('no run')
  expect(run.tokens).toEqual(usage(200, 50, 10_000, 50))
  expect(run.lastRequest).toBe(6_080)
  const known = WINDOWS.find(row => row.model === STEP.model)
  if (known === undefined) throw new Error('no window')
  expect(figures(run, 42_000)).toEqual({ tokens: 300, elapsedMs: 42_000, contextPercent: (6_080 / known.tokens) * 100 })
  expect(figures({ ...run, model: 'claude-fixture-unknown' }, 42_000).contextPercent).toBe((6_080 / DEFAULT_WINDOW) * 100)
  expect(figures({ ...run, model: known.model }, 42_000).contextPercent).toBe((6_080 / known.tokens) * 100)
  expect(figures({ ...run, model: `${known.model}-20990101` }, 42_000).contextPercent).toBe((6_080 / known.tokens) * 100)
  // An ended run's time stops.
  expect(figures({ ...run, endedAt: 9_000 }, 42_000).elapsedMs).toBe(9_000)
})

test('finished keeps the latest T-06 ended runs, and never drops a teammate or a working run', () => {
  let runs = spawned(NO_RUNS, { ...SHOVELS, key: 'toolu_mate', isTeammate: true }, 'mate', 0)
  runs = turnEnded(runs, 'mate', ANSWERED, 1)
  runs = spawned(runs, { ...RAKES, key: 'toolu_busy' }, 'busy', 0)
  for (let i = 0; i < FINISHED_KEPT + 3; i++) {
    runs = spawned(runs, { ...RAKES, key: `toolu_${i}` }, `agent-${i}`, 10 + i)
    runs = turnEnded(runs, `agent-${i}`, ANSWERED, 100 + i)
  }
  const kept = Object.keys(runs.rows)
  expect(kept).toContain('mate')
  expect(kept).toContain('busy')
  expect(kept).not.toContain('agent-0')
  expect(kept).not.toContain('agent-2')
  expect(kept).toContain('agent-3')
  expect(kept).toHaveLength(FINISHED_KEPT + 2)
})

test('a clear starts the list over; with nothing to clear it changes nothing', () => {
  const runs = turnStarted(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'fork-1')
  const empty = cleared(runs)
  expect(empty.rows).toEqual({})
  expect(empty.pending).toEqual({})
  expect(cleared(empty)).toBe(empty)
})

test("a step's activity is its last shown call, with what it names, cut to one line", () => {
  const long = 'x'.repeat(TARGET_CHARS + 20)
  expect(
    callsOf([
      { name: 'Grep', input: { pattern: 'rake' } },
      { name: 'Read', input: { file_path: 'shed/rack.txt' } },
    ]),
  ).toEqual({
    activity: { tool: 'Read', target: 'shed/rack.txt' },
    count: 2,
    clues: ['Grep', 'Read'],
  })
  expect(callsOf([{ name: 'Bash', input: { command: `count shovels\n${long}` } }]).activity?.target).toBe('count shovels')
  expect(callsOf([{ name: 'Bash', input: { command: long } }]).activity?.target).toHaveLength(TARGET_CHARS)
  expect(callsOf([{ name: 'mcp__garden__water', input: { bed: 3 } }]).activity).toEqual({ tool: 'mcp__garden__water' })
  // The hand-back of a report is no work to show, and odd input is no call.
  expect(callsOf([{ name: 'SubagentHandback', input: {} }])).toEqual({ count: 0, clues: [] })
  expect(callsOf(undefined)).toEqual({ count: 0, clues: [] })
  expect(callsOf([null, 7, { input: {} }])).toEqual({ count: 0, clues: [] })
})

test("a step's calls read as the role rules' clues: the tool's name, and a shell command whole after it", () => {
  const command = 'cd shed && npm test\necho done'
  expect(callsOf([{ name: 'Bash', input: { command } }]).clues).toEqual([`Bash:${command}`])
  expect(callsOf([{ name: 'Bash', input: {} }, { name: 'Bash' }]).clues).toEqual(['Bash', 'Bash'])
  expect(callsOf([{ name: 'Edit', input: { file_path: 'shed/rack.txt', old_string: 'Bash:git push' } }]).clues).toEqual(['Edit'])
  expect(
    callsOf([
      { name: 'SubagentHandback', input: {} },
      { name: 'Read', input: {} },
    ]).clues,
  ).toEqual(['Read'])
})

test('an event it cannot place changes nothing', () => {
  expect(turnEnded(NO_RUNS, 'nobody', ANSWERED, 1)).toBe(NO_RUNS)
  expect(spawnSettled(NO_RUNS, SHOVELS, { agentId: 'agent-1', isDenied: false }, 1)).toBe(NO_RUNS)
  const working = turnStarted(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1')
  expect(turnStarted(working, 'agent-1')).toBe(working)
})

// A main turn's usage as the engine reports it.
const turnUsage = (input: number, output: number, cacheRead: number, cacheWrite: number) => ({
  input_tokens: input,
  output_tokens: output,
  cache_read_input_tokens: cacheRead,
  cache_creation_input_tokens: cacheWrite,
})

test("the Lead counts each main turn's tokens and time, and only the numbers the engine gave", () => {
  let main = turnCounted(NO_LEAD, turnUsage(1_000, 200, 50_000, 300), 4_200)
  main = turnCounted(main, turnUsage(10, 5, 0, 0), 800)
  expect(main.tokens).toEqual(usage(1_010, 205, 50_000, 300))
  expect(main.workedMs).toBe(5_000)
  // Fresh tokens leave the cache reads out.
  expect(leadFigures(main).tokens).toBe(1_515)
  // An interrupted turn reports no usage; its time still counts.
  expect(turnCounted(main, undefined, 300)).toMatchObject({ tokens: main.tokens, workedMs: 5_300 })
  // A malformed turn changes nothing and never makes a figure NaN.
  expect(turnCounted(main, undefined, undefined)).toBe(main)
  expect(
    turnCounted(
      main,
      { input_tokens: Number.NaN, output_tokens: -4, cache_read_input_tokens: 'many', cache_creation_input_tokens: Number.POSITIVE_INFINITY },
      Number.NaN,
    ),
  ).toBe(main)
})

test("the Lead's context is the engine's percent, else its tokens over the window; a measure without a window changes nothing", () => {
  expect(leadFigures(NO_LEAD).contextPercent).toBeUndefined()
  const main = measured(NO_LEAD, { tokens: 310_000, window: 1_000_000, percent: 31 })
  expect(leadFigures(main).contextPercent).toBe(31)
  expect(measured(main, { tokens: 310_000, window: 1_000_000, percent: 31 })).toBe(main)
  expect(leadFigures(measured(NO_LEAD, { tokens: 250_000, window: 1_000_000 })).contextPercent).toBe(25)
  // A fresh window has no reading yet.
  expect(leadFigures(measured(NO_LEAD, { window: 1_000_000 })).contextPercent).toBeUndefined()
  for (const odd of [undefined, null, 7, {}, { window: 0 }, { window: Number.NaN, percent: 4 }]) expect(measured(NO_LEAD, odd)).toBe(NO_LEAD)
})

test('the totals are the Lead, every run kept, and what pruned runs counted', () => {
  let runs = stepped(spawned(NO_RUNS, SHOVELS, 'agent-1', 1_000), 'agent-1', STEP)
  runs = turnEnded(spawned(runs, RAKES, 'agent-2', 2_000), 'agent-2', ANSWERED, 5_000)
  runs = { ...runs, past: { tokens: 50, workedMs: 700 } }
  const main = turnCounted(NO_LEAD, turnUsage(1_000, 200, 0, 300), 4_200)
  // Tokens: the Lead's 1,500, the working run's 200, the ended run's none, 50 past. Time: 4,200, then 9,000 working
  // at 10,000, 3,000 ended, 700 past.
  expect(totals(main, runs, 10_000)).toEqual({ tokens: 1_750, workedMs: 16_900 })
})

test('a run Finished no longer keeps still counts in the totals, and a clear starts them over', () => {
  let runs = NO_RUNS
  for (let i = 0; i <= FINISHED_KEPT; i++) {
    runs = stepped(spawned(runs, { ...RAKES, key: `toolu_${i}` }, `agent-${i}`, 10 * i), `agent-${i}`, STEP)
    runs = turnEnded(runs, `agent-${i}`, ANSWERED, 10 * i + 5)
  }
  expect(runs.rows['agent-0']).toBeUndefined()
  // agent-0's 200 fresh tokens and 5 ms stay counted.
  expect(runs.past).toEqual({ tokens: 200, workedMs: 5 })
  expect(totals(NO_LEAD, runs, 0)).toEqual({ tokens: 200 * (FINISHED_KEPT + 1), workedMs: 5 * (FINISHED_KEPT + 1) })
  expect(cleared(runs).past).toEqual(NO_RUNS.past)
  // A past with nothing else beside it is still cleared.
  expect(cleared({ ...NO_RUNS, past: { tokens: 7, workedMs: 1 } }).past).toEqual(NO_RUNS.past)
})

// Roles as the rules settle them.
const BUILDER: Role = { id: 'builder', source: 'keywords' }
const SCOUT: Role = { id: 'scout', source: 'tools' }
const HELPER: Role = { id: 'helper', source: 'fallback' }
const RESEARCHER: Role = { id: 'researcher', source: 'tools' }

test("a spawn's role from its words is its row's from the start, and a resume keeps the row's", () => {
  const runs = spawned(NO_RUNS, { ...RAKES, role: BUILDER }, 'agent-1')
  expect(runs.rows['agent-1']?.role).toEqual(BUILDER)
  const ended = turnEnded(turnStarted(runs, 'agent-1'), 'agent-1', ANSWERED, 10)
  const resumed = spawnSettled(ended, { ...RAKES, key: 'toolu_again', resumes: 'agent-1', role: SCOUT }, { agentId: 'agent-1', isDenied: false }, 20)
  expect(resumed.rows['agent-1']?.role).toEqual(BUILDER)
})

test('a settled role never changes on later calls, whatever settled it (I-07)', () => {
  for (const role of [BUILDER, SCOUT, HELPER]) {
    const runs = turnStarted(spawned(NO_RUNS, { ...RAKES, role }, 'agent-1'), 'agent-1')
    const later = stepped(runs, 'agent-1', { ...STEP, tools: { weak: 0, role: RESEARCHER } })
    expect(later.rows['agent-1']?.role).toEqual(role)
    expect(fellBack(later, 1_000_000, HELPER).rows['agent-1']?.role).toEqual(role)
  }
})

test("an unsettled run counts its weak calls until a step's calls settle it", () => {
  const runs = turnStarted(spawned(NO_RUNS, RAKES, 'agent-1'), 'agent-1')
  expect(weakOf(runs, 'agent-1')).toBe(0)
  const searched = stepped(runs, 'agent-1', { ...STEP, tools: { weak: 3 } })
  expect(searched.rows['agent-1']?.role).toBeUndefined()
  expect(weakOf(searched, 'agent-1')).toBe(3)
  const settled = stepped(searched, 'agent-1', { ...STEP, tools: { weak: 6, role: SCOUT } })
  expect(settled.rows['agent-1']?.role).toEqual(SCOUT)
  expect(settled.rows['agent-1']?.weakCalls).toBeUndefined()
})

test("a loop's calls before the re-key settle its row only when the row's words did not", () => {
  const early = stepped(turnStarted(NO_RUNS, 'agent-1'), 'agent-1', { ...STEP, tools: { weak: 0, role: RESEARCHER } })
  expect(weakOf(early, 'agent-1')).toBe(0)
  expect(spawned(early, RAKES, 'agent-1').rows['agent-1']?.role).toEqual(RESEARCHER)
  expect(spawned(early, { ...RAKES, role: BUILDER }, 'agent-1').rows['agent-1']?.role).toEqual(BUILDER)

  const weak = stepped(turnStarted(NO_RUNS, 'agent-1'), 'agent-1', { ...STEP, tools: { weak: 2 } })
  expect(weakOf(weak, 'agent-1')).toBe(2)
  const claimed = spawned(weak, RAKES, 'agent-1')
  expect(claimed.rows['agent-1']?.role).toBeUndefined()
  expect(weakOf(claimed, 'agent-1')).toBe(2)
})

test("the fallback settles a run past T-04 or ended, but not a teammate's end, and leaves the rest alone", () => {
  const young = turnStarted(spawned(NO_RUNS, RAKES, 'agent-1', 0), 'agent-1')
  expect(fellBack(young, ROLE_SETTLES_MS - 1, HELPER)).toBe(young)
  expect(fellBack(young, ROLE_SETTLES_MS, HELPER).rows['agent-1']?.role).toEqual(HELPER)

  const ended = turnEnded(young, 'agent-1', ANSWERED, 10)
  expect(fellBack(ended, 10, HELPER).rows['agent-1']?.role).toEqual(HELPER)

  const teammate = turnEnded(turnStarted(spawned(NO_RUNS, { ...RAKES, isTeammate: true }, 'agent-2', 0), 'agent-2'), 'agent-2', ANSWERED, 10)
  expect(fellBack(teammate, 10, HELPER)).toBe(teammate)
  expect(fellBack(teammate, ROLE_SETTLES_MS, HELPER).rows['agent-2']?.role).toEqual(HELPER)

  const dressed = turnEnded(turnStarted(spawned(NO_RUNS, { ...RAKES, role: BUILDER }, 'agent-3', 0), 'agent-3'), 'agent-3', ANSWERED, 10)
  expect(fellBack(dressed, ROLE_SETTLES_MS * 2, HELPER)).toBe(dressed)
})

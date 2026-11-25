import { expect, test } from 'claude-code/testing'

import type { Role, Runs } from '../types/index'
import { FINISHED_KEPT, LIST_ANSWER_MS, QUIET_AFTER_MS, ROLE_SETTLES_MS } from '../hooks/config'
import { DEFAULT_WINDOW, WINDOWS } from '../hooks/data/models'
import {
  asked,
  cleared,
  cutTo,
  pathEnd,
  endingOf,
  fellBack,
  figures,
  hasKept,
  heldOut,
  isEmpty,
  keepsClock,
  listed,
  NO_RUNS,
  PENDING_KEPT,
  quietMs,
  reassigned,
  runOf,
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
import { STRINGS } from '../hooks/strings'
import { activityText } from '../hooks/view/runs'

// A turn's end as the engine's list settles it when it no longer lists the agent: the kept ending, at the turn's end.
const endedNow = (runs: Runs, agentId: string, ending: Parameters<typeof turnEnded>[2], at: number) => listed(turnEnded(runs, agentId, ending, at), new Map())

// Fictional spawns and steps.
const SHOVELS: Spawn = { key: 'toolu_shovels', type: 'Explore', description: 'Count the shovels', isTeammate: false }
const RAKES: Spawn = { key: 'toolu_rakes', type: 'general-purpose', description: 'Rake the leaves', isTeammate: false }
const usage = (input: number, output: number, cacheRead: number, cacheWrite: number) => ({ input, output, cacheRead, cacheWrite })
const STEP: Step = { model: 'claude-haiku-5-5', effort: 'medium', usage: usage(120, 30, 4000, 50), calls: 0 }
const ANSWERED = { reason: 'answer', hasText: true }
// Dollars as millionths, to the hundredth: a token count times its price per million, stated by hand.
const micro = (usd: number) => Math.round(usd * 100_000_000) / 100

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
  runs = endedNow(runs, 'fork-1', ANSWERED, 5)
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
  let runs = endedNow(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1', ANSWERED, 50)
  const resume: Spawn = { ...SHOVELS, key: 'toolu_resume', resumes: 'agent-1' }
  expect(spawnOpened(runs, resume, 60)).toBe(runs)

  runs = spawnSettled(spawnOpened(runs, resume, 60), resume, { agentId: 'agent-1', isDenied: false }, 61)
  expect(shownRuns(runs)).toHaveLength(1)
  expect(runs.rows['agent-1']?.state).toBe('starting')
  expect(runs.rows['agent-1']?.endedAt).toBeUndefined()
  expect(turnStarted(runs, 'agent-1').rows['agent-1']?.state).toBe('working')

  // A refused resume leaves the finished row as it was.
  const ended = endedNow(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1', ANSWERED, 50)
  expect(spawnSettled(ended, resume, { isDenied: true }, 61)).toBe(ended)

  const fresh = spawnSettled(NO_RUNS, { ...RAKES, key: 'toolu_r', resumes: 'agent-9' }, { agentId: 'agent-9', isDenied: false }, 5)
  expect(Object.keys(fresh.rows)).toEqual(['agent-9'])
  // The same agent come back is no second round, even beside a finished run of the same task.
  const beside = spawnSettled(ended, { ...SHOVELS, key: 'toolu_r', resumes: 'agent-9' }, { agentId: 'agent-9', isDenied: false }, 5)
  expect(beside.rows['agent-9']?.round).toBe(1)
})

test('a second spawn with a finished run’s description is round 2; a failed one does not count', () => {
  let runs = endedNow(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1', ANSWERED, 10)
  runs = spawned(runs, { ...SHOVELS, key: 'toolu_again' }, 'agent-2')
  expect(runs.rows['agent-2']?.round).toBe(2)

  let failed = endedNow(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1', { reason: 'error', hasText: false }, 10)
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
  runs = endedNow(runs, 'agent-1', { reason: 'answer', hasText: false }, 200)
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
  runs = endedNow(runs, 'mate', ANSWERED, 1)
  runs = spawned(runs, { ...RAKES, key: 'toolu_busy' }, 'busy', 0)
  for (let i = 0; i < FINISHED_KEPT + 3; i++) {
    runs = spawned(runs, { ...RAKES, key: `toolu_${i}` }, `agent-${i}`, 10 + i)
    runs = endedNow(runs, `agent-${i}`, ANSWERED, 100 + i)
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
    actions: [
      { tool: 'Grep', target: 'rake' },
      { tool: 'Read', target: 'shed/rack.txt' },
    ],
    files: [],
    count: 2,
    clues: ['Grep', 'Read'],
    hasBackground: false,
  })
  expect(callsOf([{ name: 'Bash', input: { command: `count shovels\n${long}` } }]).activity?.target).toBe('count shovels')
  expect(callsOf([{ name: 'Bash', input: { command: long } }]).activity?.target).toHaveLength(TARGET_CHARS)
  expect(callsOf([{ name: 'mcp__garden__water', input: { bed: 3 } }]).activity).toEqual({ tool: 'mcp__garden__water' })
  // The hand-back of a report is no work to show, and odd input is no call.
  expect(callsOf([{ name: 'SubagentHandback', input: {} }])).toEqual({ actions: [], files: [], count: 0, clues: [], hasBackground: false })
  expect(callsOf(undefined)).toEqual({ actions: [], files: [], count: 0, clues: [], hasBackground: false })
  expect(callsOf([null, 7, { input: {} }])).toEqual({ actions: [], files: [], count: 0, clues: [], hasBackground: false })
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

test('a step tells whether any of its calls went to the background', () => {
  expect(
    callsOf([
      { name: 'Read', input: {} },
      { name: 'Bash', input: { command: 'sleep 70', run_in_background: true } },
    ]).hasBackground,
  ).toBe(true)
  expect(callsOf([{ name: 'Bash', input: { command: 'sleep 70', run_in_background: 'yes' } }]).hasBackground).toBe(false)
  expect(callsOf([{ name: 'Bash', input: { command: 'sleep 70' } }]).hasBackground).toBe(false)
})

test('an event it cannot place changes nothing', () => {
  expect(endedNow(NO_RUNS, 'nobody', ANSWERED, 1)).toBe(NO_RUNS)
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
  runs = endedNow(spawned(runs, RAKES, 'agent-2', 2_000), 'agent-2', ANSWERED, 5_000)
  runs = { ...runs, past: { tokens: 50, workedMs: 700, usd: 0.5 } }
  const main = turnCounted(NO_LEAD, turnUsage(1_000, 200, 0, 300), 4_200)
  // Tokens: the Lead's 1,500, the working run's 200, the ended run's none, 50 past. Time: 4,200, then 9,000 working
  // at 10,000, 3,000 ended, 700 past.
  const { usd, ...counted } = totals(main, runs, 10_000)
  expect(counted).toEqual({ tokens: 1_750, workedMs: 16_900 })
  // Dollars: the Lead's turn at the default's prices (4,000 + 4,000 + 1,500), the working run's Haiku step
  // (12 + 15 + 40 + 6.25), the ended run's none, $0.50 past.
  expect(micro(usd)).toBe(9_500 + 73.25 + 500_000)
})

test('a run Finished no longer keeps still counts in the totals, and a clear starts them over', () => {
  let runs = NO_RUNS
  for (let i = 0; i <= FINISHED_KEPT; i++) {
    runs = stepped(spawned(runs, { ...RAKES, key: `toolu_${i}` }, `agent-${i}`, 10 * i), `agent-${i}`, STEP)
    runs = endedNow(runs, `agent-${i}`, ANSWERED, 10 * i + 5)
  }
  expect(runs.rows['agent-0']).toBeUndefined()
  // agent-0's 200 fresh tokens, 5 ms and its Haiku step's dollars stay counted.
  expect({ ...runs.past, usd: micro(runs.past.usd) }).toEqual({ tokens: 200, workedMs: 5, usd: 73.25 })
  const { usd, ...counted } = totals(NO_LEAD, runs, 0)
  expect(counted).toEqual({ tokens: 200 * (FINISHED_KEPT + 1), workedMs: 5 * (FINISHED_KEPT + 1) })
  expect(micro(usd)).toBe(73.25 * (FINISHED_KEPT + 1))
  expect(cleared(runs).past).toEqual(NO_RUNS.past)
  // A past with nothing else beside it is still cleared.
  expect(cleared({ ...NO_RUNS, past: { tokens: 7, workedMs: 1, usd: 0.01 } }).past).toEqual(NO_RUNS.past)
})

// Roles as the rules settle them.
const BUILDER: Role = { id: 'builder', source: 'keywords' }
const SCOUT: Role = { id: 'scout', source: 'tools' }
const HELPER: Role = { id: 'helper', source: 'fallback' }
const RESEARCHER: Role = { id: 'researcher', source: 'tools' }
// A role as a run keeps it: with the time it settled.
const settledAt = (role: Role, at: number): Role => ({ ...role, at })

test("a spawn's role from its words is its row's from the start, and a resume keeps the row's", () => {
  const runs = spawned(NO_RUNS, { ...RAKES, role: BUILDER }, 'agent-1', 5)
  expect(runs.rows['agent-1']?.role).toEqual(settledAt(BUILDER, 5))
  const ended = endedNow(turnStarted(runs, 'agent-1'), 'agent-1', ANSWERED, 10)
  const resumed = spawnSettled(ended, { ...RAKES, key: 'toolu_again', resumes: 'agent-1', role: SCOUT }, { agentId: 'agent-1', isDenied: false }, 20)
  expect(resumed.rows['agent-1']?.role).toEqual(settledAt(BUILDER, 5))
})

test('a settled role never changes on later calls, whatever settled it (I-07)', () => {
  for (const role of [BUILDER, SCOUT, HELPER]) {
    const runs = turnStarted(spawned(NO_RUNS, { ...RAKES, role }, 'agent-1'), 'agent-1')
    const later = stepped(runs, 'agent-1', { ...STEP, tools: { weak: 0, role: RESEARCHER }, at: 40 })
    expect(later.rows['agent-1']?.role).toEqual(settledAt(role, 0))
    expect(fellBack(later, 1_000_000, HELPER).rows['agent-1']?.role).toEqual(settledAt(role, 0))
  }
})

test("the person's pick replaces a settled role or settles a plain one, and stands against later calls and the fallback (I-07)", () => {
  const PICKED: Role = { id: 'tester', source: 'manual', at: 50 }
  for (const role of [BUILDER, undefined]) {
    const searched = stepped(turnStarted(spawned(NO_RUNS, { ...RAKES, ...(role === undefined ? {} : { role }) }, 'agent-1'), 'agent-1'), 'agent-1', {
      ...STEP,
      tools: { weak: 3 },
    })
    const order = searched.rows['agent-1']?.order as number
    const picked = reassigned(searched, order, PICKED)
    expect([picked.rows['agent-1']?.role, picked.rows['agent-1']?.weakCalls]).toEqual([PICKED, undefined])
    expect(runOf(picked, order)?.description).toBe(RAKES.description)
    const later = stepped(picked, 'agent-1', { ...STEP, tools: { weak: 0, role: RESEARCHER }, at: 60 })
    expect(later.rows['agent-1']?.role).toEqual(PICKED)
    expect(fellBack(endedNow(later, 'agent-1', ANSWERED, 70), 1_000_000, HELPER).rows['agent-1']?.role).toEqual(PICKED)
  }
  // A run that is gone, or never was, changes nothing.
  expect(reassigned(NO_RUNS, 0, PICKED)).toBe(NO_RUNS)
  // Before its re-key, a row is found by its spawn order all the same.
  const opened = spawnOpened(NO_RUNS, RAKES, 0)
  expect(reassigned(opened, 0, PICKED).rows[RAKES.key]?.role).toEqual(PICKED)
})

test('the list is empty until an agent has a row, and stays so for a run that was refused', () => {
  expect(isEmpty(NO_RUNS)).toBe(true)
  const opened = spawnOpened(NO_RUNS, RAKES, 0)
  expect(isEmpty(opened)).toBe(false)
  expect(isEmpty(spawnSettled(opened, RAKES, { isDenied: true }, 1))).toBe(true)
  expect(isEmpty(cleared(spawned(NO_RUNS, RAKES, 'agent-1')))).toBe(true)
})

test("an unsettled run counts its weak calls until a step's calls settle it", () => {
  const runs = turnStarted(spawned(NO_RUNS, RAKES, 'agent-1'), 'agent-1')
  expect(weakOf(runs, 'agent-1')).toBe(0)
  const searched = stepped(runs, 'agent-1', { ...STEP, tools: { weak: 3 } })
  expect(searched.rows['agent-1']?.role).toBeUndefined()
  expect(weakOf(searched, 'agent-1')).toBe(3)
  const settled = stepped(searched, 'agent-1', { ...STEP, tools: { weak: 6, role: SCOUT }, at: 30 })
  expect(settled.rows['agent-1']?.role).toEqual(settledAt(SCOUT, 30))
  expect(settled.rows['agent-1']?.weakCalls).toBeUndefined()
})

test("a loop's calls before the re-key settle its row only when the row's words did not", () => {
  const early = stepped(turnStarted(NO_RUNS, 'agent-1'), 'agent-1', { ...STEP, tools: { weak: 0, role: RESEARCHER }, at: 3 })
  expect(weakOf(early, 'agent-1')).toBe(0)
  // The pending entry's role keeps the time its calls settled it.
  expect(spawned(early, RAKES, 'agent-1', 7).rows['agent-1']?.role).toEqual(settledAt(RESEARCHER, 3))
  expect(spawned(early, { ...RAKES, role: BUILDER }, 'agent-1', 7).rows['agent-1']?.role).toEqual(settledAt(BUILDER, 7))

  const weak = stepped(turnStarted(NO_RUNS, 'agent-1'), 'agent-1', { ...STEP, tools: { weak: 2 } })
  expect(weakOf(weak, 'agent-1')).toBe(2)
  const claimed = spawned(weak, RAKES, 'agent-1')
  expect(claimed.rows['agent-1']?.role).toBeUndefined()
  expect(weakOf(claimed, 'agent-1')).toBe(2)
})

test("the fallback settles a run past T-04 or ended, but not a teammate's end, and leaves the rest alone", () => {
  const young = turnStarted(spawned(NO_RUNS, RAKES, 'agent-1', 0), 'agent-1')
  expect(fellBack(young, ROLE_SETTLES_MS - 1, HELPER)).toBe(young)
  expect(fellBack(young, ROLE_SETTLES_MS, HELPER).rows['agent-1']?.role).toEqual(settledAt(HELPER, ROLE_SETTLES_MS))

  const ended = endedNow(young, 'agent-1', ANSWERED, 10)
  expect(fellBack(ended, 10, HELPER).rows['agent-1']?.role).toEqual(settledAt(HELPER, 10))

  const teammate = endedNow(turnStarted(spawned(NO_RUNS, { ...RAKES, isTeammate: true }, 'agent-2', 0), 'agent-2'), 'agent-2', ANSWERED, 10)
  expect(fellBack(teammate, 10, HELPER)).toBe(teammate)
  expect(fellBack(teammate, ROLE_SETTLES_MS, HELPER).rows['agent-2']?.role).toEqual(settledAt(HELPER, ROLE_SETTLES_MS))

  const dressed = endedNow(turnStarted(spawned(NO_RUNS, { ...RAKES, role: BUILDER }, 'agent-3', 0), 'agent-3'), 'agent-3', ANSWERED, 10)
  expect(fellBack(dressed, ROLE_SETTLES_MS * 2, HELPER)).toBe(dressed)
})

test('a run whose turn left work in the background is not Helper at that end, and its next turn starts clean', () => {
  const started = turnStarted(spawned(NO_RUNS, RAKES, 'agent-1', 0), 'agent-1')
  const waiting = endedNow(stepped(started, 'agent-1', { ...STEP, hasBackground: true }), 'agent-1', ANSWERED, 10)
  expect(waiting.rows['agent-1']?.hasBackgroundWork).toBe(true)
  expect(fellBack(waiting, 10, HELPER)).toBe(waiting)
  expect(fellBack(waiting, ROLE_SETTLES_MS, HELPER).rows['agent-1']?.role).toEqual(settledAt(HELPER, ROLE_SETTLES_MS))
  const back = turnStarted(waiting, 'agent-1')
  expect(back.rows['agent-1']?.hasBackgroundWork).toBeUndefined()
  expect(fellBack(endedNow(back, 'agent-1', ANSWERED, 20), 20, HELPER).rows['agent-1']?.role).toEqual(settledAt(HELPER, 20))

  const early = stepped(turnStarted(NO_RUNS, 'agent-2'), 'agent-2', { ...STEP, hasBackground: true })
  expect(spawned(early, RAKES, 'agent-2').rows['agent-2']?.hasBackgroundWork).toBe(true)
})

test('a step whose time could not be read settles its role with no moment, so no hop plays for it', () => {
  const runs = turnStarted(spawned(NO_RUNS, RAKES, 'agent-1'), 'agent-1')
  expect(stepped(runs, 'agent-1', { ...STEP, tools: { weak: 0, role: SCOUT } }).rows['agent-1']?.role).toEqual(SCOUT)
  const early = stepped(turnStarted(NO_RUNS, 'agent-2'), 'agent-2', { ...STEP, tools: { weak: 0, role: SCOUT } })
  expect(spawned(early, RAKES, 'agent-2', 7).rows['agent-2']?.role).toEqual(SCOUT)
})

test('the clock is kept for a live run, and for an ended one whose role may still fall back', () => {
  const rowOf = (runs: Runs) => runs.rows['agent-1'] as NonNullable<Runs['rows'][string]>
  expect(keepsClock(rowOf(turnStarted(spawned(NO_RUNS, RAKES, 'agent-1', 0), 'agent-1')))).toBe(true)
  const teammate = endedNow(turnStarted(spawned(NO_RUNS, { ...RAKES, isTeammate: true }, 'agent-1', 0), 'agent-1'), 'agent-1', ANSWERED, 10)
  expect(keepsClock(rowOf(teammate))).toBe(true)
  expect(keepsClock(rowOf(fellBack(teammate, ROLE_SETTLES_MS, HELPER)))).toBe(false)
})

test("a live row's asked call moves it to needs-you, and its next step brings it back working; an ended or unknown one stays", () => {
  const working = turnStarted(spawned(NO_RUNS, SHOVELS, 'agent-1', 0), 'agent-1', 5)
  const waiting = asked(working, 'agent-1', 20)
  expect(waiting.rows['agent-1']).toMatchObject({ state: 'needs-you', heardAt: 20, ask: { at: 20 } })
  // Asked again while it waits, the later request is the one a step must begin after.
  expect(asked(waiting, 'agent-1', 30).rows['agent-1']).toMatchObject({ state: 'needs-you', heardAt: 30, ask: { at: 30 } })
  expect(stepped(waiting, 'agent-1', { ...STEP, at: 40 }).rows['agent-1']).toMatchObject({ state: 'working', heardAt: 40 })
  // A step whose start could not be read still ends the wait, and keeps the last time heard.
  expect(stepped(waiting, 'agent-1', STEP).rows['agent-1']).toMatchObject({ state: 'working', heardAt: 20 })
  // A starting row may ask too; one that has ended, or an agent no row or entry has, may not.
  expect(asked(spawned(NO_RUNS, SHOVELS, 'agent-1', 0), 'agent-1').rows['agent-1']?.state).toBe('needs-you')
  const ended = endedNow(working, 'agent-1', ANSWERED, 50)
  expect(asked(ended, 'agent-1', 60)).toBe(ended)
  expect(asked(working, 'agent-9', 60)).toBe(working)
})

test("an asked call before the re-key is kept on the loop's entry, and the row that claims it needs the person", () => {
  const pending = turnStarted(spawnOpened(NO_RUNS, SHOVELS, 0), 'agent-1')
  const waiting = asked(pending, 'agent-1', 10)
  expect(waiting.pending['agent-1']?.ask).toEqual({ at: 10 })
  expect(asked(waiting, 'agent-1', 20).pending['agent-1']?.ask).toEqual({ at: 20 })
  const claimed = spawnSettled(waiting, SHOVELS, { agentId: 'agent-1', model: 'claude-sonnet-5-5', isDenied: false }, 30)
  expect(claimed.rows['agent-1']).toMatchObject({ state: 'needs-you', heardAt: 30, ask: { at: 10 } })
  // A step before the claim moved the call on, so the row works.
  const movedOn = stepped(waiting, 'agent-1', STEP)
  expect(movedOn.pending['agent-1']?.ask).toBeUndefined()
  expect(spawnSettled(movedOn, SHOVELS, { agentId: 'agent-1', isDenied: false }, 30).rows['agent-1']?.state).toBe('working')
})

test('each event of a run is the last time it was heard: its spawn, its result, its turn and its steps', () => {
  const opened = spawnOpened(NO_RUNS, SHOVELS, 100)
  expect(opened.rows[SHOVELS.key]?.heardAt).toBe(100)
  const settled = spawnSettled(opened, SHOVELS, { agentId: 'agent-1', isDenied: false }, 150)
  expect(settled.rows['agent-1']?.heardAt).toBe(150)
  const started = turnStarted(settled, 'agent-1', 200)
  expect(started.rows['agent-1']?.heardAt).toBe(200)
  // A turn whose time could not be read keeps the last; a working row told nothing new is the same object.
  expect(turnStarted(started, 'agent-1').rows['agent-1']?.heardAt).toBe(200)
  expect(turnStarted(started, 'agent-1', 200)).toBe(started)
  expect(stepped(started, 'agent-1', { ...STEP, at: 250 }).rows['agent-1']?.heardAt).toBe(250)
  // A resume is heard at its result.
  const ended = endedNow(started, 'agent-1', ANSWERED, 300)
  const resumed = spawnSettled(ended, { ...SHOVELS, resumes: 'agent-1' }, { agentId: 'agent-1', isDenied: false }, 400)
  expect(resumed.rows['agent-1']).toMatchObject({ state: 'starting', heardAt: 400 })
})

test('a starting or working run with no call in flight is quiet from T-05 after it was last heard, and no other', () => {
  const working = turnStarted(spawned(NO_RUNS, SHOVELS, 'agent-1', 0), 'agent-1', 1_000).rows['agent-1'] as NonNullable<Runs['rows'][string]>
  expect(quietMs(working, 1_000 + QUIET_AFTER_MS - 1)).toBeUndefined()
  expect(quietMs(working, 1_000 + QUIET_AFTER_MS)).toBe(QUIET_AFTER_MS)
  expect(quietMs({ ...working, state: 'starting' }, 1_000 + QUIET_AFTER_MS)).toBe(QUIET_AFTER_MS)
  expect(quietMs({ ...working, inFlight: 1 }, 1_000 + 10 * QUIET_AFTER_MS)).toBeUndefined()
  for (const state of ['needs-you', 'finished', 'failed', 'stopped'] as const) {
    expect(quietMs({ ...working, state }, 1_000 + 10 * QUIET_AFTER_MS)).toBeUndefined()
  }
  // A time that cannot be read says nothing of quiet.
  expect(quietMs(working, Number.NaN)).toBeUndefined()
})

test('the step that asked a call, recorded after the request, leaves the row needing the person; a step begun after moves it on', () => {
  const working = turnStarted(spawned(NO_RUNS, SHOVELS, 'agent-1', 0), 'agent-1', 5)
  const waiting = asked(working, 'agent-1', 20)
  // The asking step began before the request and ends after it.
  const asker = stepped(waiting, 'agent-1', { ...STEP, calls: 1, began: 10, at: 25 })
  expect(asker.rows['agent-1']).toMatchObject({ state: 'needs-you', ask: { at: 20 }, inFlight: 1 })
  const next = stepped(asker, 'agent-1', { ...STEP, began: 30, at: 40 })
  expect(next.rows['agent-1']?.state).toBe('working')
  expect(next.rows['agent-1']?.ask).toBeUndefined()
  // The same for a loop's entry before the re-key.
  const entry = asked(turnStarted(spawnOpened(NO_RUNS, SHOVELS, 0), 'agent-1'), 'agent-1', 20)
  const entryAsker = stepped(entry, 'agent-1', { ...STEP, calls: 1, began: 10 })
  expect(entryAsker.pending['agent-1']?.ask).toEqual({ at: 20 })
  expect(stepped(entryAsker, 'agent-1', { ...STEP, began: 30 }).pending['agent-1']?.ask).toBeUndefined()
  // A turn's end, or a new turn, leaves nothing of the request behind.
  expect(endedNow(asker, 'agent-1', ANSWERED, 50).rows['agent-1']?.ask).toBeUndefined()
  expect(turnStarted(asker, 'agent-1', 50).rows['agent-1']).toMatchObject({ state: 'working' })
  expect(turnStarted(asker, 'agent-1', 50).rows['agent-1']?.ask).toBeUndefined()
})

test('a second call asked while the step after the first still streams keeps the row needing the person', () => {
  const working = turnStarted(spawned(NO_RUNS, SHOVELS, 'agent-1', 0), 'agent-1', 5)
  const first = stepped(asked(working, 'agent-1', 20), 'agent-1', { ...STEP, calls: 1, began: 10, at: 25 })
  // The next step begins at 30, after the first request, and asks again at 35 before its record.
  const second = asked(first, 'agent-1', 35)
  const recorded = stepped(second, 'agent-1', { ...STEP, calls: 1, began: 30, at: 40 })
  expect(recorded.rows['agent-1']).toMatchObject({ state: 'needs-you', ask: { at: 35 } })
  expect(stepped(recorded, 'agent-1', { ...STEP, began: 50, at: 60 }).rows['agent-1']?.state).toBe('working')
})

test("a request whose time could not be read waits out the asking step's record, then moves on at the next", () => {
  const working = turnStarted(spawned(NO_RUNS, SHOVELS, 'agent-1', 0), 'agent-1', 5)
  const waiting = asked(working, 'agent-1')
  expect(waiting.rows['agent-1']).toMatchObject({ state: 'needs-you', ask: {} })
  const asker = stepped(waiting, 'agent-1', { ...STEP, calls: 1, began: 10, at: 25 })
  expect(asker.rows['agent-1']).toMatchObject({ state: 'needs-you', ask: { at: 25 } })
  expect(stepped(asker, 'agent-1', { ...STEP, began: 30, at: 40 }).rows['agent-1']?.state).toBe('working')
  // With no time at all, the step after the asking one moves it on.
  const untimed = stepped(waiting, 'agent-1', { ...STEP, calls: 1 })
  expect(untimed.rows['agent-1']?.state).toBe('needs-you')
  expect(stepped(untimed, 'agent-1', STEP).rows['agent-1']?.state).toBe('working')
})

test("a turn's start is the turn's: the opening, a resume's result and each turn start", () => {
  const opened = spawned(NO_RUNS, SHOVELS, 'agent-1', 100)
  expect(opened.rows['agent-1']?.turnAt).toBe(100)
  const ended = endedNow(turnStarted(opened, 'agent-1', 110), 'agent-1', ANSWERED, 200)
  expect(ended.rows['agent-1']).toMatchObject({ startedAt: 100, turnAt: 110 })
  expect(turnStarted(ended, 'agent-1', 500).rows['agent-1']).toMatchObject({ startedAt: 100, turnAt: 500 })
  const resumed = spawnSettled(ended, { ...SHOVELS, resumes: 'agent-1' }, { agentId: 'agent-1', isDenied: false }, 900)
  expect(resumed.rows['agent-1']).toMatchObject({ startedAt: 100, turnAt: 900 })
})

// Peek's record, by its own numbers: the last five calls, the last ten files changed, and 600 characters of a brief or
// an answer.
const read = (path: string) => ({ name: 'Read', input: { file_path: path } })
const edit = (path: string) => ({ name: 'Edit', input: { file_path: path, old_string: 'a', new_string: 'b' } })
const stepOf = (uses: unknown[]): Step => {
  const calls = callsOf(uses)
  return { ...STEP, ...(calls.activity === undefined ? {} : { activity: calls.activity }), actions: calls.actions, files: calls.files, calls: calls.count }
}

test("a step's calls each become an action, and only the changing tools' paths are files", () => {
  const calls = callsOf([
    read('shed/rack.txt'),
    edit('shed/list.md'),
    { name: 'Write', input: { file_path: 'shed/new.md' } },
    { name: 'Bash', input: { command: 'ls' } },
  ])
  expect(calls.actions.map(action => action.tool)).toEqual(['Read', 'Edit', 'Write', 'Bash'])
  expect(calls.files).toEqual(['shed/list.md', 'shed/new.md'])
  expect(
    callsOf([
      { name: 'NotebookEdit', input: { notebook_path: 'beds.ipynb' } },
      { name: 'MultiEdit', input: { file_path: 'a.md' } },
    ]).files,
  ).toEqual(['beds.ipynb', 'a.md'])
})

test('after seven calls a run keeps the last five, oldest first, over steps and a pending entry', () => {
  let runs = spawned(NO_RUNS, SHOVELS, 'agent-1')
  runs = stepped(runs, 'agent-1', stepOf([read('one.txt'), read('two.txt'), read('three.txt')]))
  runs = stepped(runs, 'agent-1', stepOf([read('four.txt')]))
  runs = stepped(runs, 'agent-1', stepOf([read('five.txt'), read('six.txt'), read('seven.txt')]))
  expect(runs.rows['agent-1']?.actions?.map(action => action.target)).toEqual(['three.txt', 'four.txt', 'five.txt', 'six.txt', 'seven.txt'])

  // Calls seen before the re-key are the claimed row's.
  let early = turnStarted(spawnOpened(NO_RUNS, RAKES, 0), 'agent-2')
  early = stepped(early, 'agent-2', stepOf([read('bed.txt'), edit('bed.txt')]))
  early = spawnSettled(early, RAKES, { agentId: 'agent-2', isDenied: false }, 5)
  expect(early.rows['agent-2']).toMatchObject({
    actions: [
      { tool: 'Read', target: 'bed.txt' },
      { tool: 'Edit', target: 'bed.txt' },
    ],
    files: [{ text: 'bed.txt' }],
  })
})

test('a run keeps the files it changed each once, where last changed, at most ten', () => {
  let runs = spawned(NO_RUNS, SHOVELS, 'agent-1')
  runs = stepped(runs, 'agent-1', stepOf([edit('a.md'), edit('b.md'), read('c.md'), edit('a.md')]))
  expect(runs.rows['agent-1']?.files).toEqual([{ text: 'b.md' }, { text: 'a.md' }])
  const twelve = Array.from({ length: 12 }, (_, at) => edit(`bed-${at}.md`))
  runs = stepped(runs, 'agent-1', stepOf(twelve))
  expect(runs.rows['agent-1']?.files).toEqual(Array.from({ length: 10 }, (_, at) => ({ text: `bed-${at + 2}.md` })))
})

test("two files deep in one folder stay two, each kept by its path's last 80 characters", () => {
  const folder = `/fixture/${'orchard/north-field/'.repeat(5)}`
  const [rows, beds] = [`${folder}rows.md`, `${folder}beds.md`]
  expect(callsOf([edit(rows), edit(beds)]).files).toEqual([rows, beds])
  let runs = spawned(NO_RUNS, SHOVELS, 'agent-1')
  runs = stepped(runs, 'agent-1', stepOf([edit(rows), edit(beds), edit(rows)]))
  expect(runs.rows['agent-1']?.files).toEqual([
    { text: beds.slice(-TARGET_CHARS), isCut: true },
    { text: rows.slice(-TARGET_CHARS), isCut: true },
  ])
  expect(pathEnd('beds/a.md')).toEqual({ text: 'beds/a.md' })
})

test("a brief is the spawn's prompt and an answer its turn's, each its first 600 characters", () => {
  const brief = `  ${'Weed the north bed, then the south. '.repeat(20)}`
  const runs = spawned(NO_RUNS, { ...SHOVELS, brief }, 'agent-1')
  const kept = runs.rows['agent-1']?.brief
  expect(kept?.isCut).toBe(true)
  expect(Array.from(kept?.text ?? '')).toHaveLength(600)
  expect(kept?.text.startsWith('Weed the north bed')).toBe(true)
  expect(spawned(NO_RUNS, { ...SHOVELS, brief: 'Count them.\n' }, 'agent-1').rows['agent-1']?.brief).toEqual({ text: 'Count them.' })
  expect(spawned(NO_RUNS, { ...SHOVELS, brief: '  ' }, 'agent-1').rows['agent-1']?.brief).toBeUndefined()

  // An emoji is never split; 601 of them are cut to 600.
  const answer = '🌱'.repeat(601)
  const ended = endedNow(runs, 'agent-1', { reason: 'answer', hasText: true, answer }, 50)
  expect(ended.rows['agent-1']?.answer).toEqual({ text: '🌱'.repeat(600), isCut: true })
  expect(cutTo('🌱🌱', 1)).toEqual({ text: '🌱', isCut: true })
})

test("an end without text keeps the last answer that had it, and a resume keeps its row's brief", () => {
  let runs = spawned(NO_RUNS, { ...SHOVELS, isTeammate: true, brief: 'Count the shovels.' }, 'agent-1')
  runs = endedNow(runs, 'agent-1', { reason: 'answer', hasText: true, answer: 'Seven.' }, 50)
  runs = endedNow(turnStarted(runs, 'agent-1', 60), 'agent-1', { reason: 'answer', hasText: false, answer: '' }, 70)
  expect(runs.rows['agent-1']?.answer).toEqual({ text: 'Seven.' })

  const resume: Spawn = { ...SHOVELS, key: 'toolu_resume', resumes: 'agent-1', brief: 'Now count the rakes.' }
  const resumed = spawnSettled(runs, resume, { agentId: 'agent-1', isDenied: false }, 80)
  expect(resumed.rows['agent-1']?.brief).toEqual({ text: 'Count the shovels.' })
  // A resume no row has opens one with its own prompt.
  expect(spawnSettled(NO_RUNS, { ...resume, resumes: 'agent-9' }, { agentId: 'agent-9', isDenied: false }, 5).rows['agent-9']?.brief).toEqual({
    text: 'Now count the rakes.',
  })
})

test("a measure's limits are kept in its order, a few at most; one without a list keeps them, an empty list clears them", () => {
  const window = { window: 1_000_000 }
  const two = measured(NO_LEAD, window, [
    { kind: 'five_hour', percentUsed: 40, resetsAt: '2030-01-01T05:00:00Z' },
    { kind: 'seven_day', percentUsed: 12.5 },
  ])
  expect(two.limits).toEqual([
    { kind: 'five_hour', percent: 40 },
    { kind: 'seven_day', percent: 12.5 },
  ])
  // The same figures again change nothing; a measure with no usable window still brings its limits.
  expect(
    measured(two, window, [
      { kind: 'five_hour', percentUsed: 40 },
      { kind: 'seven_day', percentUsed: 12.5 },
    ]),
  ).toBe(two)
  expect(measured(NO_LEAD, undefined, [{ kind: 'five_hour', percentUsed: 3 }]).limits).toEqual([{ kind: 'five_hour', percent: 3 }])
  expect(measured(two, window, undefined)).toBe(two)
  expect(measured(two, window, 'many')).toBe(two)
  expect(measured(two, window, []).limits).toBeUndefined()
  const five = Array.from({ length: 5 }, (_, at) => ({ kind: `window_${at}`, percentUsed: at }))
  expect(measured(NO_LEAD, window, five).limits?.map(one => one.kind)).toEqual(['window_0', 'window_1', 'window_2', 'window_3'])
  for (const odd of [null, 7, {}, { kind: '', percentUsed: 1 }, { kind: 'five_hour', percentUsed: -1 }, { kind: 'five_hour', percentUsed: Number.NaN }]) {
    expect(measured(NO_LEAD, window, [odd]).limits).toBeUndefined()
  }
})

test("a run's steps add their estimate at the model that answered, an hour's writes and Haiku's long prompts at their own rates", () => {
  let runs = spawned(NO_RUNS, SHOVELS, 'agent-1', 0)
  // 120 × 0.10 + 30 × 0.50 + 4,000 × 0.01 + 50 × 0.125.
  runs = stepped(runs, 'agent-1', STEP)
  expect(micro(runs.rows['agent-1']?.usd ?? Number.NaN)).toBe(73.25)
  // The 50 writes kept an hour cost 0.20 each: 8 + 10 + 60 + 10.
  runs = stepped(runs, 'agent-1', { ...STEP, usage: usage(80, 20, 6_000, 50), hourWrites: 50 })
  expect(micro(runs.rows['agent-1']?.usd ?? Number.NaN)).toBe(73.25 + 88)
  // A prompt past 100,000 tokens pays five times: 90,000 × 0.50 + 1,000 × 2.50 + 20,000 × 0.05.
  runs = stepped(runs, 'agent-1', { ...STEP, usage: usage(90_000, 1_000, 20_000, 0) })
  expect(micro(runs.rows['agent-1']?.usd ?? Number.NaN)).toBe(73.25 + 88 + 45_000 + 2_500 + 1_000)
  // A step on Sonnet costs Sonnet's prices: 120 × 2 + 30 × 10 + 4,000 × 0.10 + 50 × 2.50.
  const sonnet = stepped(spawned(NO_RUNS, SHOVELS, 'agent-2', 0), 'agent-2', { ...STEP, model: 'claude-sonnet-5-5' })
  expect(micro(sonnet.rows['agent-2']?.usd ?? Number.NaN)).toBe(240 + 300 + 400 + 125)
})

test("a loop's estimate before the re-key is claimed with its row, and a main turn's is the Lead's", () => {
  let runs = spawnOpened(NO_RUNS, SHOVELS, 0)
  runs = stepped(runs, 'agent-1', STEP)
  runs = spawnSettled(runs, SHOVELS, { agentId: 'agent-1', isDenied: false }, 30)
  runs = stepped(runs, 'agent-1', STEP)
  expect(micro(runs.rows['agent-1']?.usd ?? Number.NaN)).toBe(2 * 73.25)
  // On Sonnet, 300 of the writes kept an hour: 1,000 × 2 + 200 × 10 + 200 × 2.50 + 100 × 4.
  const main = turnCounted(NO_LEAD, { ...turnUsage(1_000, 200, 0, 300), model: 'claude-sonnet-5-5', ephemeral_1h_input_tokens: 100 }, 4_200)
  expect(micro(main.usd)).toBe(2_000 + 2_000 + 500 + 400)
  expect(main.usd).toBe(turnCounted(main, undefined, 300).usd)
})

test('a past holding only dollars is not empty: a clear starts it over and the list is not new', () => {
  const runs = { ...NO_RUNS, past: { tokens: 0, workedMs: 0, usd: 0.01 } }
  expect(cleared(runs).past).toEqual(NO_RUNS.past)
  expect(isEmpty(runs)).toBe(false)
})

test("a call to a tool named as an Object's own key reads as any tool the table does not name", () => {
  expect(activityText({ tool: 'constructor', target: 'shed' })).toBe(STRINGS.using('constructor'))
  expect(activityText({ tool: 'Read', target: 'shed/rack.txt' })).toBe('Reading shed/rack.txt')
})

// What a run's ending leaves on it.
const endOf = (runs: Runs, agentId = 'agent-1') => {
  const run = runs.rows[agentId]
  return { state: run?.state, endedAt: run?.endedAt, keptEnding: run?.keptEnding }
}
const statuses = (status?: string) => new Map(status === undefined ? [] : [['agent-1', status]])

test("a live run's turn end keeps its ending and leaves it as it was: no end, no ask, no call in flight, its answer kept", () => {
  const started = stepped(turnStarted(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1', 10), 'agent-1', { ...STEP, calls: 2 })
  const held = turnEnded(asked(started, 'agent-1', 20), 'agent-1', { reason: 'answer', hasText: true, answer: 'Seven.' }, 50)
  const run = held.rows['agent-1']
  expect([run?.state, run?.endedAt, run?.ask, run?.inFlight, run?.keptEnding, run?.answer]).toEqual([
    'working',
    undefined,
    undefined,
    0,
    { state: 'finished', at: 50 },
    { text: 'Seven.' },
  ])
  expect(hasKept(held)).toBe(true)
  expect(hasKept(started)).toBe(false)
  // Each ending is kept as the state it ends in.
  expect(endOf(turnEnded(started, 'agent-1', { reason: 'aborted', hasText: false }, 50)).keptEnding).toEqual({ state: 'stopped', at: 50 })
  expect(endOf(turnEnded(started, 'agent-1', { reason: 'refusal', hasText: false }, 50)).keptEnding).toEqual({ state: 'failed', at: 50 })
  // A run already ended ends again at once.
  const ended = endedNow(started, 'agent-1', ANSWERED, 50)
  expect(endOf(turnEnded(ended, 'agent-1', { reason: 'error', hasText: false }, 60))).toEqual({ state: 'failed', endedAt: 60, keptEnding: undefined })
})

test('the list settles a kept ending: waiting waits, running or pending stays held, an end or an absence ends it', () => {
  const held = turnEnded(turnStarted(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1', 10), 'agent-1', ANSWERED, 50)
  for (const status of ['running', 'pending']) expect(listed(held, statuses(status), 60)).toBe(held)
  const waiting = listed(held, statuses('waiting'), 60)
  expect(endOf(waiting)).toEqual({ state: 'waiting', endedAt: undefined, keptEnding: { state: 'finished', at: 50 } })
  expect(listed(waiting, statuses('waiting'), 70)).toBe(waiting)
  expect(listed(waiting, statuses('running'), 70)).toBe(waiting)
  for (const status of ['completed', 'failed', 'killed', 'idle', undefined]) {
    // Held, it ends at its turn's end; waiting, when the list said so, its time having run on.
    expect([status, endOf(listed(held, statuses(status), 90))]).toEqual([status, { state: 'finished', endedAt: 50, keptEnding: undefined }])
    expect([status, endOf(listed(waiting, statuses(status), 90))]).toEqual([status, { state: 'finished', endedAt: 90, keptEnding: undefined }])
  }
  // A list that could not be read ends both; with no time, a waiting run at its turn's end.
  expect(endOf(listed(held, undefined, 90))).toEqual({ state: 'finished', endedAt: 50, keptEnding: undefined })
  expect(endOf(listed(waiting, undefined, 90))).toEqual({ state: 'finished', endedAt: 90, keptEnding: undefined })
  expect(endOf(listed(waiting, undefined))).toEqual({ state: 'finished', endedAt: 50, keptEnding: undefined })
  // A run with nothing kept is the list's no business.
  const working = turnStarted(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1', 10)
  expect(listed(working, statuses('completed'), 90)).toBe(working)
  expect(listed(working, undefined, 90)).toBe(working)
})

test("a held end the list has not answered ends at its turn's end once its bound has passed; a waiting run is left to the list", () => {
  const held = turnEnded(turnStarted(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1', 10), 'agent-1', ANSWERED, 50)
  expect(heldOut(held, 50 + LIST_ANSWER_MS - 1)).toBe(held)
  expect(endOf(heldOut(held, 50 + LIST_ANSWER_MS))).toEqual({ state: 'finished', endedAt: 50, keptEnding: undefined })
  const waiting = listed(held, statuses('waiting'), 60)
  expect(heldOut(waiting, 1_000_000)).toBe(waiting)
})

test('a waiting run is live: it keeps the clock, is never quiet, is not Helper by its end, and its next turn works with nothing kept', () => {
  const held = turnEnded(turnStarted(spawned(NO_RUNS, RAKES, 'agent-1'), 'agent-1', 10), 'agent-1', ANSWERED, 50)
  const waiting = listed(held, statuses('waiting'), 60)
  const run = waiting.rows['agent-1']
  if (run === undefined) throw new Error('no run')
  expect(keepsClock(run)).toBe(true)
  expect(quietMs(run, 60 + QUIET_AFTER_MS * 10)).toBeUndefined()
  // Held, the same: no call in flight, yet never quiet.
  const heldRun = held.rows['agent-1']
  if (heldRun === undefined) throw new Error('no run')
  expect(quietMs(heldRun, 60 + QUIET_AFTER_MS * 10)).toBeUndefined()
  // A run with no role is not Helper by an end that left it waiting, only once T-04 has passed.
  expect(fellBack(waiting, 70, HELPER).rows['agent-1']?.role).toBeUndefined()
  expect(fellBack(waiting, ROLE_SETTLES_MS, HELPER).rows['agent-1']?.role).toEqual(settledAt(HELPER, ROLE_SETTLES_MS))
  const next = turnStarted(waiting, 'agent-1', 80)
  expect(endOf(next)).toEqual({ state: 'working', endedAt: undefined, keptEnding: undefined })
  // A held run's next turn too, even at the time it was last heard.
  expect(endOf(turnStarted(held, 'agent-1', held.rows['agent-1']?.heardAt))).toEqual({ state: 'working', endedAt: undefined, keptEnding: undefined })
})

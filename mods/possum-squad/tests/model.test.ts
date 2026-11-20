import { expect, test } from 'claude-code/testing'

import type { Runs } from '../types/index'
import { FINISHED_KEPT } from '../hooks/config'
import { DEFAULT_WINDOW, WINDOWS } from '../hooks/data/models'
import {
  cleared,
  endingOf,
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
} from '../hooks/model/runs'
import { callsOf, TARGET_CHARS } from '../hooks/model/tools'

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
  })
  expect(callsOf([{ name: 'Bash', input: { command: `count shovels\n${long}` } }]).activity?.target).toBe('count shovels')
  expect(callsOf([{ name: 'Bash', input: { command: long } }]).activity?.target).toHaveLength(TARGET_CHARS)
  expect(callsOf([{ name: 'mcp__garden__water', input: { bed: 3 } }]).activity).toEqual({ tool: 'mcp__garden__water' })
  // The hand-back of a report is no work to show, and odd input is no call.
  expect(callsOf([{ name: 'SubagentHandback', input: {} }])).toEqual({ count: 0 })
  expect(callsOf(undefined)).toEqual({ count: 0 })
  expect(callsOf([null, 7, { input: {} }])).toEqual({ count: 0 })
})

test('an event it cannot place changes nothing', () => {
  expect(turnEnded(NO_RUNS, 'nobody', ANSWERED, 1)).toBe(NO_RUNS)
  expect(spawnSettled(NO_RUNS, SHOVELS, { agentId: 'agent-1', isDenied: false }, 1)).toBe(NO_RUNS)
  const working = turnStarted(spawned(NO_RUNS, SHOVELS, 'agent-1'), 'agent-1')
  expect(turnStarted(working, 'agent-1')).toBe(working)
})

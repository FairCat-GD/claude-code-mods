import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { FINISHED_KEPT, NEST_INDENT, NEST_LEVELS_DRAWN } from '../hooks/config'
import { rolledUp } from '../hooks/model/nesting'
import type { Runs } from '../types/index'
import { listed, NO_RUNS, type Spawn, spawnOpened, spawnSettled, stepped, turnEnded } from '../hooks/model/runs'
import { STRINGS } from '../hooks/strings'
import { nested } from '../hooks/view/panel'
import type { RowData } from '../hooks/view/row'
import { engine, MOUNT, SURFACES, store, turnEnds } from './engine'
import { PERMISSION_FROM_AGENT, SPAWN, STEP, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START } from './fixtures/events'

// A turn's end as the engine's list settles it when it no longer lists the agent: the kept ending, at the turn's end.
const endedNow = (runs: Runs, agentId: string, ending: Parameters<typeof turnEnded>[2], at: number) => listed(turnEnded(runs, agentId, ending, at), new Map())

type Surface = (typeof SURFACES)[number]

// Each step: 120 in, 50 written to the cache, 30 out, so 200 fresh tokens; its cache reads are not fresh.
const STEP_USAGE = { input_tokens: 120, output_tokens: 30, cache_read_input_tokens: 40_000, cache_creation_input_tokens: 50, model: 'claude-haiku-5-5' }

// The engine beneath the mod: agent ids in spawn order, each step with the usage above.
function world(on: On) {
  const ids = ['agent-a', 'agent-b', 'agent-c', 'agent-d']
  mock.clock(on, { now: 1_000 })
  engine(on)
  on('agent.spawn', () => ({ model: 'claude-haiku-5-5', agentId: ids.shift() ?? 'agent-extra' }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('classic.PermissionRequest', () => ({}))
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    return { ...STEPPED, turnId: e.turnId, index: e.index, usage: STEP_USAGE }
  })
}

async function drain(stream: AsyncGenerator<unknown, unknown>) {
  for (;;) if ((await stream.next()).done) return
}

// An agent spawned, its turn begun and one step taken; `parent` is the agent that spawned it.
async function started($: Engine, agentId: string, description: string, parent?: string) {
  await $.agent.spawn({ ...SPAWN, tool_use_id: `toolu_${agentId}`, description, ...(parent === undefined ? {} : { parentAgentId: parent }) })
  await $.turn.start({ ...TURN_START, agentId })
  await drain($.turn.step({ ...STEP, agentId }))
}

// What a surface draws: the texts in order, each row's indent by its agent, and the figures that hold a token count.
async function drawn($: Engine, surface: Surface) {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  const texts = (await pane.findAll({ type: 'Text' })).map(text => text.text)
  const indents: Record<string, unknown> = {}
  for (const id of ['agent-a', 'agent-b', 'agent-c', 'agent-d']) indents[id] = (await pane.find({ type: 'Box', key: id }))?.props.paddingLeft
  await pane.unmount()
  // The kit draws the desktop's bar as its labelled figure over the figure alone: the figure alone is counted.
  const withTokens = (count: string) => texts.filter(text => text.includes(` · ${count} · `) && !text.startsWith(`${STRINGS.row.context} `)).length
  return { texts, indents, withTokens }
}

const PLANT = 'Plant the north bed'
const WEIGH = 'Weigh the pumpkins'
const WATER = 'Water the seedlings'
const LABEL = 'Label the trays'

test("a spawn carrying a parent's id is drawn right under it, indented, and the parent's tokens include it (F-24)", async ($, on) => {
  world(on)
  store(on)
  // The helper is spawned after an unrelated agent, and still drawn under its parent before it.
  await started($, 'agent-a', PLANT)
  await started($, 'agent-b', WEIGH)
  await started($, 'agent-c', WATER, 'agent-a')
  for (const surface of SURFACES) {
    const { texts, indents, withTokens } = await drawn($, surface)
    const at = (text: string) => texts.indexOf(text)
    expect([surface, at(PLANT) < at(WATER), at(WATER) < at(WEIGH)]).toEqual([surface, true, true])
    expect([surface, indents]).toEqual([surface, { 'agent-a': undefined, 'agent-b': undefined, 'agent-c': NEST_INDENT, 'agent-d': undefined }])
    // The parent's 200 and its helper's 200; the others their own. The header counts each agent once: 600.
    expect([surface, withTokens('400'), withTokens('200')]).toEqual([surface, 1, 2])
    expect(texts.some(text => text.startsWith(STRINGS.session('600', '')))).toBe(true)
    // The section counts every agent.
    expect(texts).toContain(STRINGS.heading(STRINGS.sections.running, 3))
  }
})

test("a helper's helper sits a level deeper, and a helper whose state's section is not its parent's is drawn there as any row", async ($, on) => {
  world(on)
  store(on, { prefs: { finishedOpen: true } })
  await started($, 'agent-a', PLANT)
  await started($, 'agent-b', WATER, 'agent-a')
  await started($, 'agent-c', LABEL, 'agent-b')
  for (const surface of SURFACES) {
    const { indents, withTokens } = await drawn($, surface)
    expect([surface, indents['agent-b'], indents['agent-c'], withTokens('600')]).toEqual([surface, NEST_INDENT, 2 * NEST_INDENT, 1])
  }
  // The middle helper ends: it is drawn in Finished, and its own helper, still running, starts a branch of Running.
  await turnEnds($, { ...TURN_COMPLETE, agentId: 'agent-b' })
  // A helper that waits on the person is drawn in Needs you.
  await started($, 'agent-d', WEIGH, 'agent-a')
  await $.classic.PermissionRequest({ ...PERMISSION_FROM_AGENT, agent_id: 'agent-d' } as never)
  for (const surface of SURFACES) {
    const { texts, indents, withTokens } = await drawn($, surface)
    const at = (text: string) => texts.indexOf(text)
    const heading = (id: keyof typeof STRINGS.sections, count: number) => at(STRINGS.heading(STRINGS.sections[id], count))
    expect([surface, indents]).toEqual([surface, { 'agent-a': undefined, 'agent-b': undefined, 'agent-c': undefined, 'agent-d': undefined }])
    expect([surface, heading('needs-you', 1) < at(WEIGH), at(WEIGH) < heading('running', 2), heading('finished', 1) < at(WATER)]).toEqual([
      surface,
      true,
      true,
      true,
    ])
    // Wherever its helpers are drawn, the parent's tokens hold every one of them.
    expect([surface, withTokens('800')]).toEqual([surface, 1])
  }
})

test('a spawn naming a parent no row has is drawn as any row', async ($, on) => {
  world(on)
  store(on)
  await started($, 'agent-a', PLANT, 'agent-elsewhere')
  for (const surface of SURFACES) {
    const { indents, withTokens } = await drawn($, surface)
    expect([surface, indents['agent-a'], withTokens('200')]).toEqual([surface, undefined, 1])
  }
})

// Fictional spawns for the model alone.
const spawn = (key: string, parentId?: string, isTeammate = false): Spawn => ({
  key,
  type: 'general-purpose',
  description: `Tend bed ${key}`,
  isTeammate,
  ...(parentId === undefined ? {} : { parentId }),
})
const STEPPED_USAGE = { input: 120, output: 30, cacheRead: 40_000, cacheWrite: 50 }
// Dollars as millionths, to the hundredth.
const micro = (usd: number) => Math.round(usd * 100_000_000) / 100
const settled = (runs: typeof NO_RUNS, one: Spawn, agentId: string, at: number) =>
  stepped(spawnSettled(spawnOpened(runs, one, at), one, { agentId, isDenied: false }, at), agentId, {
    model: 'claude-haiku-5-5',
    usage: STEPPED_USAGE,
    calls: 0,
  })

test("a helper Finished no longer keeps still counts in its parent's totals, through a dropped middle one too", () => {
  // A teammate, never dropped, starts a helper, which starts its own; then more helpers than Finished keeps end.
  let runs = settled(NO_RUNS, spawn('toolu_t', undefined, true), 'agent-t', 0)
  runs = settled(runs, spawn('toolu_m', 'agent-t'), 'agent-m', 1)
  runs = settled(runs, spawn('toolu_g', 'agent-m'), 'agent-g', 2)
  runs = endedNow(runs, 'agent-g', { reason: 'answer', hasText: true }, 3)
  runs = endedNow(runs, 'agent-m', { reason: 'answer', hasText: true }, 4)
  for (let i = 0; i < FINISHED_KEPT; i++) {
    runs = settled(runs, spawn(`toolu_${i}`, 'agent-t'), `agent-${i}`, 10 + i)
    runs = endedNow(runs, `agent-${i}`, { reason: 'answer', hasText: true }, 100 + i)
  }
  expect([runs.rows['agent-g'], runs.rows['agent-m']]).toEqual([undefined, undefined])
  const teammate = runs.rows['agent-t']
  if (teammate === undefined) throw new Error('no teammate')
  // Each of the 33 agents took one Haiku step of 200 fresh tokens: 120 × 0.10 + 30 × 0.50 + 40,000 × 0.01 + 50 × 0.125.
  const rolled = rolledUp(runs).get(teammate.order)
  expect([rolled?.tokens, micro(rolled?.usd ?? Number.NaN)]).toEqual([200 * (FINISHED_KEPT + 3), 433.25 * (FINISHED_KEPT + 3)])
  expect(teammate.prunedHelpers?.tokens).toBe(400)
  // The session's own totals count the dropped ones once, in `past`.
  expect(runs.past.tokens).toBe(400)
})

test("a section's rows are drawn branch by branch in spawn order; a loop of parents is drawn from its first, each row once", () => {
  const row = (order: number, parent?: number): RowData => ({
    id: `row-${order}`,
    order,
    state: 'working',
    description: `Row ${order}`,
    tokens: 0,
    elapsedMs: 0,
    ...(parent === undefined ? {} : { parent }),
  })
  const shape = (rows: readonly RowData[]) => nested(rows).map(({ row: one, depth }) => [one.order, depth])
  // 3 under 0, 4 under 3, 2 under 1; 1 names a parent in another section, so it starts a branch in its place.
  expect(shape([row(0), row(1, 9), row(2, 1), row(3, 0), row(4, 3), row(5)])).toEqual([
    [0, 0],
    [3, 1],
    [4, 2],
    [1, 0],
    [2, 1],
    [5, 0],
  ])
  expect(shape([row(0, 1), row(1, 0), row(2, 2)])).toEqual([
    [2, 0],
    [0, 0],
    [1, 1],
  ])
  // Deeper than the indent goes, a helper keeps its place under its parent.
  const chain = Array.from({ length: NEST_LEVELS_DRAWN + 3 }, (_, at) => row(at, at === 0 ? undefined : at - 1))
  expect(shape(chain).map(([, depth]) => depth)).toEqual(chain.map((_, at) => at))
})

test('a kept helper of a dropped agent moves under the nearest agent still kept, or to the top with none, its share staying there', () => {
  // A teammate starts P, which starts H; P ends while H still works, then more helpers than Finished keeps end.
  let runs = settled(NO_RUNS, spawn('toolu_t', undefined, true), 'agent-t', 0)
  runs = settled(runs, spawn('toolu_p', 'agent-t'), 'agent-p', 1)
  runs = settled(runs, spawn('toolu_h', 'agent-p'), 'agent-h', 2)
  // A top-level agent with a helper of its own, which ends before it.
  runs = settled(runs, spawn('toolu_q'), 'agent-q', 3)
  runs = settled(runs, spawn('toolu_r', 'agent-q'), 'agent-r', 4)
  runs = endedNow(runs, 'agent-p', { reason: 'answer', hasText: true }, 5)
  runs = endedNow(runs, 'agent-q', { reason: 'answer', hasText: true }, 6)
  for (let i = 0; i < FINISHED_KEPT; i++) {
    runs = settled(runs, spawn(`toolu_${i}`, 'agent-t'), `agent-${i}`, 10 + i)
    runs = endedNow(runs, `agent-${i}`, { reason: 'answer', hasText: true }, 100 + i)
  }
  expect([runs.rows['agent-p'], runs.rows['agent-q'], runs.rows['agent-h']?.parentId, runs.rows['agent-r']?.parentId]).toEqual([
    undefined,
    undefined,
    'agent-t',
    undefined,
  ])
  const teammate = runs.rows['agent-t']
  if (teammate === undefined) throw new Error('no teammate')
  // The teammate, P (in its pruned helpers), H, and the 30 helpers that ended: one step of 200 each.
  expect(rolledUp(runs).get(teammate.order)?.tokens).toBe(200 * (FINISHED_KEPT + 3))
})

import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { PANE_COLUMNS } from '../hooks/config'
import { PANE } from '../hooks/register'
import { engine, hooksOf, POSSUMS, settled, store, turnEnds } from './engine'
import { PERMISSION_FROM_AGENT, SPAWN, STEP, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START, WAITING } from './fixtures/events'

// Another plugin's pane, shown in front of the mod's: the tabs draw their titles only while more than one is open.
const OTHER = { id: 'shed-board', isShown: true, isPlaced: true }

// The engine beneath the mod: its panes, a store that opens no pane by itself, a pinned clock, agent ids from their
// tool calls, the toasts shown, and the agent list the test gives.
function world(on: On) {
  const seen = engine(on)
  store(on, { prefs: { autoOpen: 'never' } })
  const clock = mock.clock(on, { now: 1_000 })
  const given = { listed: {} as Record<string, string> }
  on('agent.spawn', (_, e) => ({ model: 'claude-haiku-5-5', agentId: e.tool_use_id.replace('toolu_', 'agent-') }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('classic.PermissionRequest', () => WAITING)
  on('ui.toast', () => ({ value: undefined }))
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    return { ...STEPPED, turnId: e.turnId, index: e.index }
  })
  on('agent.list', () => ({ value: Object.entries(given.listed).map(([id, status]) => ({ id, status })) }) as never)
  return { seen, clock, given }
}

async function working($: Engine, n: number) {
  await $.agent.spawn({ ...SPAWN, subagentType: 'general-purpose', tool_use_id: `toolu_${n}`, description: `Mend fence ${n}` } as never)
  await $.turn.start({ ...TURN_START, agentId: `agent-${n}` })
}
async function asks($: Engine, n: number) {
  await $.classic.PermissionRequest({ ...PERMISSION_FROM_AGENT, agent_id: `agent-${n}` } as never)
  await settled()
}
async function steps($: Engine, n: number) {
  const stream = $.turn.step({ ...STEP, agentId: `agent-${n}` })
  for (;;) if ((await stream.next()).done) break
  await settled()
}

// The mod's pane open behind another plugin's.
async function behindOther($: Engine, seen: ReturnType<typeof engine>) {
  await $.command.run(POSSUMS)
  seen.panes = [{ id: PANE, isShown: false, isPlaced: true }, OTHER]
}

test("the pane's title counts the agents that need the person, then reads its plain name; behind another tab it is retitled, never raised (F-12)", async ($, on) => {
  const { seen } = world(on)
  await behindOther($, seen)
  await working($, 1)
  await working($, 2)
  const titles: (string | undefined)[] = []
  const note = () => titles.push(seen.titles.get(PANE))
  await asks($, 1)
  note()
  await asks($, 2)
  note()
  await steps($, 1)
  note()
  await steps($, 2)
  note()
  expect(titles).toEqual(['Possum Squad · 1 needs you', 'Possum Squad · 2 needs you', 'Possum Squad · 1 needs you', 'Possum Squad'])
  // Every retitle is an open with no `focus`, asked for the same width; the other pane stays in front.
  const retitles = seen.opens.slice(1)
  expect(retitles.map(open => open.title)).toEqual(titles)
  expect(retitles.every(open => open.focus === undefined && open.columns === PANE_COLUMNS)).toBe(true)
  expect(seen.panes).toEqual([{ id: PANE, isShown: false, isPlaced: true }, OTHER])
})

test('a pane that is closed, or open and waiting undrawn, is never opened by a retitle', async ($, on) => {
  const { seen } = world(on)
  await working($, 1)
  await asks($, 1)
  expect(seen.opens).toEqual([])
  seen.panes = [{ id: PANE, isShown: false, isPlaced: false }]
  await working($, 2)
  await asks($, 2)
  expect([seen.opens, seen.panes]).toEqual([[], [{ id: PANE, isShown: false, isPlaced: false }]])
})

test("a run asked while its turn's end is held leaves the count when the list ends it, and the title says so (F-12)", async ($, on) => {
  const { seen, given } = world(on)
  await behindOther($, seen)
  await working($, 1)
  await working($, 2)
  // The list still says running: the end is held, and the run can still ask.
  given.listed = { 'agent-1': 'running', 'agent-2': 'running' }
  await turnEnds($, { ...TURN_COMPLETE, agentId: 'agent-1' } as never)
  await asks($, 1)
  expect(seen.titles.get(PANE)).toBe('Possum Squad · 1 needs you')
  // Another agent's event reads the list, which now says the first has ended.
  given.listed = { 'agent-1': 'completed', 'agent-2': 'running' }
  await steps($, 2)
  expect(seen.titles.get(PANE)).toBe('Possum Squad')
})

test('/possums while an agent needs the person opens the pane with the count', async ($, on) => {
  const { seen } = world(on)
  await working($, 1)
  await asks($, 1)
  await $.command.run(POSSUMS)
  expect(seen.opens.map(open => open.title)).toEqual(['Possum Squad · 1 needs you'])
})

// The kit's `$` cannot close a pane as the person, so the races run the mod's own hooks over a stand-in engine: its
// state, a store that refuses reads (so every default holds), a pinned clock, and panes whose open and close the test
// steers.
type Hook = (...args: unknown[]) => Promise<unknown>
type Pane = { id: string; title: string; isShown: boolean; isFocused: boolean; isPlaced: boolean }

function standIn() {
  const values = new Map<string, { value: unknown; version: number }>()
  const keyOf = (ref: object) => JSON.stringify(ref)
  const { hooks } = hooksOf()
  const hook = (event: string) => hooks.get(event) as unknown as Hook
  const log = { opens: [] as { title: string; focus?: true }[], closes: 0 }
  let panes: Pane[] = [{ id: PANE, title: 'Possum Squad', isShown: true, isFocused: false, isPlaced: true }]
  // What the test does as the retitle reads the panes, or as its open is under way.
  const during: { read?: () => void; open?: () => Promise<void> } = {}
  const $ = {
    state: {
      get: async (ref: object) => values.get(keyOf(ref)) ?? { value: undefined, version: 0 },
      set: async (ref: object, value: unknown, options?: { ifVersion?: number }) => {
        const held = values.get(keyOf(ref))?.version ?? 0
        if (options?.ifVersion !== undefined && options.ifVersion !== held) return { isSet: false, version: held }
        values.set(keyOf(ref), { value, version: held + 1 })
        return { isSet: true, version: held + 1 }
      },
    },
    store: { get: async () => Promise.reject(new Error('the fixture store refuses reads')), set: async () => {} },
    clock: { now: async () => 1_000, every: () => ({ cancel: () => {} }) },
    ui: {
      panes: async () => {
        const listed = panes
        const act = during.read
        during.read = undefined
        act?.()
        return listed
      },
      open: async (pane: { id: string; title: string; focus?: true }) => {
        log.opens.push(pane.focus === undefined ? { title: pane.title } : { title: pane.title, focus: pane.focus })
        const act = during.open
        during.open = undefined
        await act?.()
        // The open lands: it opens a closed pane, or retitles an open one.
        const held = panes.find(one => one.id === pane.id)
        panes = [{ id: pane.id, title: pane.title, isShown: held?.isShown ?? true, isFocused: false, isPlaced: true }]
        return { isPlaced: true }
      },
      close: async () => {
        log.closes++
        panes = []
      },
      toast: () => {},
      invalidate: () => {},
    },
  }
  // The person's close: the engine raises the mod's `ui.close` hook, and the pane is gone once the hook passes it on;
  // the engine may answer the hook later than that (`settles`).
  const personCloses = (settles?: Promise<void>) =>
    hook('ui.close')($, { id: PANE, origin: { kind: 'person' } }, async () => {
      panes = []
      await settles
      return { value: undefined }
    })
  return {
    log,
    during,
    panes: () => panes,
    personCloses,
    spawn: async () => {
      await hook('agent.spawn')($, { ...SPAWN, tool_use_id: 'toolu_race' }, async () => ({ model: 'claude-haiku-5-5', agentId: 'agent-race' }))
      await settled()
    },
    asks: async () => {
      await hook('classic.PermissionRequest')($, { ...PERMISSION_FROM_AGENT, agent_id: 'agent-race' }, async () => WAITING)
      await settled()
    },
    possums: () => hook('command.run')($, { ...POSSUMS, args: 'open' }),
  }
}

test('a close the person makes as the retitle reads the panes stops it before its open (F-12)', async () => {
  const engine = standIn()
  await engine.spawn()
  engine.during.read = () => void engine.personCloses()
  await engine.asks()
  expect([engine.log.opens, engine.panes()]).toEqual([[], []])
})

test('a close the person makes while the retitle opens closes the pane again (F-12)', async () => {
  const engine = standIn()
  await engine.spawn()
  // The close is heard, then the retitle's open lands after it and opens the pane once more.
  engine.during.open = async () => void engine.personCloses()
  await engine.asks()
  expect([engine.log.opens, engine.log.closes, engine.panes()]).toEqual([[{ title: 'Possum Squad · 1 needs you' }], 1, []])
})

test("a close whose hook the engine answers only after the retitle's open is still heard there, and the pane closes again (F-12)", async () => {
  const engine = standIn()
  await engine.spawn()
  let answer = () => {}
  const settles = new Promise<void>(resolve => {
    answer = resolve
  })
  engine.during.open = async () => void engine.personCloses(settles)
  await engine.asks()
  answer()
  await settled()
  expect([engine.log.closes, engine.panes()]).toEqual([1, []])
})

test('a pane the person closes and opens again while the retitle opens stays open (F-12)', async () => {
  const engine = standIn()
  await engine.spawn()
  engine.during.open = async () => {
    await engine.personCloses()
    await engine.possums()
  }
  await engine.asks()
  expect(engine.log.closes).toBe(0)
  expect(engine.panes().map(pane => [pane.id, pane.title])).toEqual([[PANE, 'Possum Squad · 1 needs you']])
})

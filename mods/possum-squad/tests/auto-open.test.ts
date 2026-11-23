import { read } from 'claude-code'
import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { PANE_COLUMNS } from '../hooks/config'
import { PANE, view } from '../hooks/register'
import { STRINGS } from '../hooks/strings'
import { engine, hooksOf, POSSUMS, possums, store } from './engine'
import { SPAWN } from './fixtures/events'

const OPENED = { id: PANE, title: STRINGS.title, columns: PANE_COLUMNS }

// The engine beneath the mod: its panes, the store holding `autoOpen`, a pinned clock, and the next agent id for each
// spawn.
function world(on: On, autoOpen?: string, refusal?: string) {
  const seen = engine(on, refusal)
  store(on, autoOpen === undefined ? {} : { prefs: { autoOpen } })
  mock.clock(on, { now: 1_000 })
  let next = 0
  on('agent.spawn', async () => ({ model: 'claude-haiku-5-5', agentId: `agent-${++next}` }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('classic.SessionStart', () => ({}))
  return seen
}

let spawned = 0
const spawn = ($: Engine) => $.agent.spawn({ ...SPAWN, tool_use_id: `toolu_${++spawned}`, description: `Sweep path ${spawned}` })

test('with autoOpen at first, the first agent opens the pane once, without the keys; later agents open nothing (F-10)', async ($, on) => {
  const seen = world(on)
  // Three agents spawned together: one of them starts the list.
  await Promise.all([spawn($), spawn($), spawn($)])
  expect(seen.opens).toEqual([OPENED])
  await spawn($)
  expect(seen.opens).toHaveLength(1)
  // Hidden with /possums, it stays so for later agents.
  await $.command.run(POSSUMS)
  await spawn($)
  expect([seen.opens.length, seen.panes]).toEqual([1, []])
})

test('a cleared session starts the list over, so its first agent opens the pane again', async ($, on) => {
  const seen = world(on)
  await spawn($)
  await $.command.run(POSSUMS)
  await $.classic.SessionStart({ source: 'clear' } as never)
  await spawn($)
  expect(seen.opens).toEqual([OPENED, OPENED])
})

test('with autoOpen at always, every new agent opens a pane hidden with /possums; a resume does not', async ($, on) => {
  const seen = world(on, 'always')
  await spawn($)
  await $.command.run(POSSUMS)
  await spawn($)
  expect(seen.opens).toEqual([OPENED, OPENED])
  await $.command.run(POSSUMS)
  await $.agent.spawn({ ...SPAWN, tool_use_id: 'toolu_resume', resume: { agentId: 'agent-1' } } as never)
  expect([seen.opens.length, seen.panes]).toEqual([2, []])
})

test('an agent never opens a pane already open, shown or behind another tab', async ($, on) => {
  const seen = world(on, 'always')
  for (const isShown of [true, false]) {
    seen.panes = [{ id: PANE, isShown, isPlaced: true }]
    await spawn($)
    expect([isShown, seen.opens]).toEqual([isShown, []])
  }
})

test('with autoOpen at never, no agent opens the pane', async ($, on) => {
  const seen = world(on, 'never')
  await spawn($)
  await spawn($)
  expect(seen.opens).toEqual([])
})

test('an open the engine refuses opens nothing, and the spawn returns what the engine gave', async ($, on) => {
  const seen = world(on, undefined, 'another plugin holds this pane')
  expect(await spawn($)).toEqual({ model: 'claude-haiku-5-5', agentId: 'agent-1' })
  expect(seen.opens).toEqual([])
})

test('a store that cannot be read opens nothing, and the spawn returns what the engine gave', async ($, on) => {
  const seen = engine(on)
  store(on, {}, 'get')
  mock.clock(on, { now: 1_000 })
  on('agent.spawn', async () => ({ model: 'claude-haiku-5-5', agentId: 'agent-1' }))
  expect(await spawn($)).toEqual({ model: 'claude-haiku-5-5', agentId: 'agent-1' })
  expect(seen.opens).toEqual([])
  await $.command.run(possums('open'))
  expect(seen.opens).toHaveLength(1)
})

// The kit's `$` cannot close a pane as the person, so what follows runs the mod's own hooks over a stand-in engine: its
// state, its store holding `autoOpen`, a pinned clock, and its panes.
type Hook = (...args: unknown[]) => Promise<unknown>

function standIn(autoOpen: string) {
  const values = new Map<string, { value: unknown; version: number }>()
  const keyOf = (ref: object) => JSON.stringify(ref)
  const opens: unknown[] = []
  let panes: { id: string; title: string; isShown: boolean; isFocused: boolean; isPlaced: boolean }[] = []
  const $ = {
    state: {
      get: async (ref: object) => values.get(keyOf(ref)) ?? { value: undefined, version: 0 },
      set: async (ref: object, value: unknown, options?: { ifVersion?: number }) => {
        const now = values.get(keyOf(ref))?.version ?? 0
        if (options?.ifVersion !== undefined && options.ifVersion !== now) return { isSet: false, version: now }
        values.set(keyOf(ref), { value, version: now + 1 })
        return { isSet: true, version: now + 1 }
      },
    },
    store: { get: async (key: string) => (key === 'prefs' ? { autoOpen } : undefined), set: async () => {} },
    clock: { now: async () => 1_000, every: () => ({ cancel: () => {} }) },
    ui: {
      panes: async () => panes,
      open: async (pane: { id: string; title: string }) => {
        opens.push(pane)
        panes = [{ id: pane.id, title: pane.title, isShown: true, isFocused: false, isPlaced: true }]
        return { isPlaced: true }
      },
      close: async () => {
        panes = []
      },
      invalidate: () => {},
    },
  }
  const { hooks } = hooksOf()
  const hook = (event: string) => hooks.get(event) as unknown as Hook
  let spawns = 0
  return {
    opens,
    flags: () => read($ as never, view),
    // An agent starts; the open it may make is not awaited, so the stand-in lets it settle.
    spawn: async () => {
      spawns++
      const e = { ...SPAWN, tool_use_id: `toolu_stand_${spawns}`, description: `Rake bed ${spawns}` }
      await hook('agent.spawn')($, e, async () => ({ model: 'claude-haiku-5-5', agentId: `agent-stand-${spawns}` }))
      for (let i = 0; i < 100; i++) await Promise.resolve()
    },
    close: async (kind: 'person' | 'plugin') => {
      await $.ui.close()
      await hook('ui.close')($, { id: PANE, origin: { kind } }, async () => ({ value: undefined }))
    },
    possums: (args = '') => hook('command.run')($, { ...POSSUMS, args }),
  }
}

test('after the person closes the pane, no agent opens it; the person opening it again takes that back (F-10)', async () => {
  const engine = standIn('always')
  await engine.spawn()
  expect(engine.opens).toEqual([OPENED])
  await engine.close('person')
  await engine.spawn()
  await engine.spawn()
  expect([engine.opens.length, (await engine.flags()).isClosedByPerson]).toEqual([1, true])
  // Opened with /possums, then hidden with it: the close is no longer the person's, so the next agent opens it.
  await engine.possums()
  expect((await engine.flags()).isClosedByPerson).toBe(false)
  await engine.close('plugin')
  await engine.spawn()
  expect(engine.opens).toHaveLength(3)
})

test('with autoOpen at first, a person who closed the pane before any agent keeps it closed (F-10)', async () => {
  const engine = standIn('first')
  await engine.possums()
  await engine.close('person')
  await engine.spawn()
  expect(engine.opens).toHaveLength(1)
})

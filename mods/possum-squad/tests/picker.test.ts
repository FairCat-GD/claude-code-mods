import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { isCustomType, isPickable, PICKABLE, rememberedOf } from '../hooks/roles/rules'
import { STRINGS } from '../hooks/strings'
import { engine, MOUNT, POSSUMS, SURFACES, store } from './engine'
import { SPAWN } from './fixtures/events'

type Surface = (typeof SURFACES)[number]

// The engine beneath the mod: its panes, a store (refusing writes when asked), a pinned clock, and the next agent id
// for each spawn.
function world(on: On, refuse?: 'set', entries: Record<string, unknown> = {}) {
  engine(on)
  const kept = store(on, { prefs: { finishedOpen: true }, ...entries }, refuse)
  const clock = mock.clock(on, { now: 1_000 })
  let next = 0
  on('agent.spawn', async () => ({ model: 'claude-haiku-5-5', agentId: `agent-${++next}` }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  return { kept, clock }
}

// A custom type of the person's own, and the generic one.
const KEEPER = 'shed-keeper'
let spawned = 0
const spawn = ($: Engine, subagentType: string, description: string) =>
  $.agent.spawn({ ...SPAWN, tool_use_id: `toolu_pick_${++spawned}`, subagentType, description })

// The role button a row draws after its description; undefined while it is plain.
async function roleOf($: Engine, surface: Surface, description: string) {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  const elements = await pane.findAll({})
  await pane.unmount()
  const at = elements.findIndex(element => element.type === 'Text' && element.text === description)
  expect(at).toBeGreaterThanOrEqual(0)
  const label = elements.slice(at).find(element => element.type === 'Button')?.props.label
  return (Object.values(STRINGS.roles) as string[]).find(name => name === label)
}

// The person presses a row's role button, then picks in the picker it opens. Each write redraws at the redraw rate,
// on the kit's mocked clock.
async function pick($: Engine, clock: { advance: (ms: number) => Promise<void> }, surface: Surface, agentId: string, value: string) {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  await pane.press({ key: `role-${agentId}` })
  await clock.advance(100)
  const picker = await pane.find({ type: 'Select', key: 'role-pick' })
  await pane.select({ key: 'role-pick', value })
  await clock.advance(100)
  const after = await pane.find({ type: 'Select', key: 'role-pick' })
  await pane.unmount()
  return { picker, after }
}

for (const surface of SURFACES) {
  test(`${surface}: picking Tester for a custom type's row dresses it at once, and the next agent of that type is a Tester (F-07)`, async ($, on) => {
    const { kept, clock } = world(on)
    await spawn($, KEEPER, 'Take care of it')
    expect(await roleOf($, surface, 'Take care of it')).toBeUndefined()
    const { picker, after } = await pick($, clock, surface, 'agent-1', 'tester')
    expect(picker?.props.options).toEqual([{ value: 'detect', label: 'Detect' }, ...PICKABLE.map(id => ({ value: id, label: STRINGS.roles[id] }))])
    expect(after).toBeUndefined()
    expect(await roleOf($, surface, 'Take care of it')).toBe(STRINGS.roles.tester)
    expect(kept.held.get(`role:${KEEPER}`)).toBe('tester')
    // Its words would make it a Builder; the remembered pick comes first.
    await spawn($, KEEPER, 'Build the potting bench')
    expect(await roleOf($, surface, 'Build the potting bench')).toBe(STRINGS.roles.tester)
  })

  test(`${surface}: picking Tester for a generic agent's row dresses that run only, and the next one is detected as usual (F-07)`, async ($, on) => {
    const { kept, clock } = world(on)
    await spawn($, 'general-purpose', 'Take care of it')
    await pick($, clock, surface, 'agent-1', 'tester')
    expect(await roleOf($, surface, 'Take care of it')).toBe(STRINGS.roles.tester)
    expect(kept.writes.filter(write => write.key.startsWith('role:'))).toEqual([])
    await spawn($, 'general-purpose', 'Build the potting bench')
    await spawn($, 'general-purpose', 'See to it')
    expect([await roleOf($, surface, 'Build the potting bench'), await roleOf($, surface, 'See to it')]).toEqual([STRINGS.roles.builder, undefined])
  })

  test(`${surface}: the picker shows the run's role, closes on cancel, on a second press and with the pane, and a pick of no role changes nothing`, async ($, on) => {
    const { kept, clock } = world(on)
    await spawn($, 'Explore', 'Find the trowel')
    const pane = await $.ui.mount({ ...MOUNT, surface })
    await pane.press({ key: 'role-agent-1' })
    await clock.advance(100)
    expect((await pane.find({ type: 'Select', key: 'role-pick' }))?.props.value).toBe('scout')
    await pane.press({ key: 'role-cancel' })
    await clock.advance(100)
    expect(await pane.find({ type: 'Select', key: 'role-pick' })).toBeUndefined()
    await pane.press({ key: 'role-agent-1' })
    await clock.advance(100)
    await pane.press({ key: 'role-agent-1' })
    await clock.advance(100)
    expect(await pane.find({ type: 'Select', key: 'role-pick' })).toBeUndefined()
    // A value that is no role a person can pick changes nothing; the kit's surface refuses it before the mod hears.
    await pane.press({ key: 'role-agent-1' })
    await clock.advance(100)
    await pane.select({ key: 'role-pick', value: 'lead' }).catch(() => undefined)
    await clock.advance(100)
    await pane.unmount()
    // Closing the pane ends the picker, so it opens on the list.
    await $.command.run(POSSUMS)
    await $.command.run(POSSUMS)
    await clock.advance(100)
    const reopened = await $.ui.mount({ ...MOUNT, surface })
    expect(await reopened.find({ type: 'Select', key: 'role-pick' })).toBeUndefined()
    await reopened.unmount()
    expect(kept.writes.filter(write => write.key !== 'prefs')).toEqual([])
    expect(await roleOf($, surface, 'Find the trowel')).toBe(STRINGS.roles.scout)
  })

  test(`${surface}: picking the role a custom type's row already wears still remembers it for the type`, async ($, on) => {
    const { kept, clock } = world(on)
    await spawn($, KEEPER, 'Build the potting bench')
    expect(await roleOf($, surface, 'Build the potting bench')).toBe(STRINGS.roles.builder)
    await pick($, clock, surface, 'agent-1', 'builder')
    expect([await roleOf($, surface, 'Build the potting bench'), kept.held.get(`role:${KEEPER}`)]).toEqual([STRINGS.roles.builder, 'builder'])
  })

  test(`${surface}: a store that refuses the pick's memory still dresses the run`, async ($, on) => {
    const { kept, clock } = world(on, 'set')
    await spawn($, KEEPER, 'Take care of it')
    await pick($, clock, surface, 'agent-1', 'guard')
    expect(await roleOf($, surface, 'Take care of it')).toBe(STRINGS.roles.guard)
    expect(kept.held.get(`role:${KEEPER}`)).toBeUndefined()
  })
}

// Another plugin, beside the mod, that shows the role the mod keeps for agent-1, as stored under its shape.
const ROLE_READER = {
  name: 'role-reader',
  register: (on: On) => {
    on('command.run', { command: 'read-role' }, async $ => {
      const held = (await $.state.get({ plugin: 'possum-squad', key: 'runs' })).value
      return { text: JSON.stringify(held?.value.rows['agent-1']?.role ?? 'none') }
    })
  },
}
const keptRole = async ($: Engine) => JSON.parse((await $.command.run({ ...POSSUMS, command: 'read-role' })).text ?? '"none"')

for (const surface of SURFACES) {
  test(
    `${surface}: Detect on a custom type's remembered pick forgets it, and puts the run and the next one back on the rules (F-07)`,
    { plugins: [ROLE_READER] },
    async ($, on) => {
      const { kept, clock } = world(on, undefined, { [`role:${KEEPER}`]: 'tester' })
      await spawn($, KEEPER, 'Build the potting bench')
      expect(await roleOf($, surface, 'Build the potting bench')).toBe(STRINGS.roles.tester)
      await pick($, clock, surface, 'agent-1', 'detect')
      // Its words make it a Builder, timed at the pick so a live row hops into it.
      expect(await roleOf($, surface, 'Build the potting bench')).toBe(STRINGS.roles.builder)
      expect(await keptRole($)).toEqual({ id: 'builder', source: 'keywords', at: 1_100 })
      expect([kept.deletes, kept.held.has(`role:${KEEPER}`), kept.writes.filter(write => write.key !== 'prefs')]).toEqual([[`role:${KEEPER}`], false, []])
      await spawn($, KEEPER, 'Build the trellis')
      expect(await roleOf($, surface, 'Build the trellis')).toBe(STRINGS.roles.builder)
    },
  )

  test(`${surface}: Detect on a built-in or generic agent's row deletes nothing; with no rule to fire a young run goes plain (F-07)`, async ($, on) => {
    const { kept, clock } = world(on)
    await spawn($, 'Explore', 'Find the trowel')
    await spawn($, 'general-purpose', 'Take care of it')
    await pick($, clock, surface, 'agent-1', 'tester')
    await pick($, clock, surface, 'agent-2', 'tester')
    await pick($, clock, surface, 'agent-1', 'detect')
    await pick($, clock, surface, 'agent-2', 'detect')
    expect([await roleOf($, surface, 'Find the trowel'), await roleOf($, surface, 'Take care of it')]).toEqual([STRINGS.roles.scout, undefined])
    expect([kept.deletes, kept.writes.filter(write => write.key !== 'prefs')]).toEqual([[], []])
  })

  test(
    `${surface}: Detect on a row that already wears what the rules give keeps its moment, and a store that refuses keeps the memory`,
    { plugins: [ROLE_READER] },
    async ($, on) => {
      const { kept, clock } = world(on, 'set', { [`role:${KEEPER}`]: 'builder' })
      await spawn($, KEEPER, 'Build the potting bench')
      const before = await keptRole($)
      await pick($, clock, surface, 'agent-1', 'detect')
      expect([before, await keptRole($)]).toEqual([
        { id: 'builder', source: 'remembered', at: 1_000 },
        { id: 'builder', source: 'keywords', at: 1_000 },
      ])
      expect([kept.deletes, kept.held.get(`role:${KEEPER}`)]).toEqual([[], 'builder'])
    },
  )
}

test('the picker offers every role but Lead; only a custom type remembers, and a stored role no version knows is ignored', () => {
  expect(PICKABLE).toHaveLength(16)
  expect([...PICKABLE].sort()).toEqual(
    Object.keys(STRINGS.roles)
      .filter(id => id !== 'lead')
      .sort(),
  )
  expect(['lead', 'mime', 7, undefined, 'Tester'].map(isPickable)).toEqual([false, false, false, false, false])
  expect(['tester', 'lead', 'mime', { id: 'tester' }].map(rememberedOf)).toEqual(['tester', undefined, undefined, undefined])
  expect([KEEPER, 'general-purpose', 'claude', 'fork', '', 'Explore', 'Plan', 'GENERAL-PURPOSE', 3].map(isCustomType)).toEqual([
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ])
})

// Another plugin, beside the mod, handing on every pick as a role no person can pick.
const REWRITER = {
  name: 'pick-rewriter',
  register: (on: On) => {
    on('ui.select', { plugin: 'possum-squad' }, (_, e, next) => next({ ...e, value: 'lead' }))
  },
}

test('a pick another plugin turns into no pickable role changes nothing, stores nothing, and closes the picker', { plugins: [REWRITER] }, async ($, on) => {
  const { kept, clock } = world(on)
  for (const surface of SURFACES) {
    await spawn($, KEEPER, `Water bed ${surface}`)
    const { after } = await pick($, clock, surface, surface === 'terminal' ? 'agent-1' : 'agent-2', 'tester')
    expect([surface, after, await roleOf($, surface, `Water bed ${surface}`)]).toEqual([surface, undefined, undefined])
  }
  expect(kept.writes.filter(write => write.key !== 'prefs')).toEqual([])
})

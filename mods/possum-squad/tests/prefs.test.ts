import { expect, mock, test } from 'claude-code/testing'

import { readPrefs, SETTING_NAMES, SETTINGS, type SettingName } from '../hooks/settings'
import { STRINGS } from '../hooks/strings'
import { engine, MOUNT, possums, SURFACES, store } from './engine'
import {
  MEASURE,
  MEASURED,
  PERMISSION,
  PERMITTED,
  SESSION_START,
  SPAWN,
  SPAWNED,
  TURN_COMPLETE,
  TURN_COMPLETED,
  TURN_START,
  TURN_STARTED,
} from './fixtures/events'

const DEFAULTS = { autoOpen: 'first', cost: 'off', motion: 'auto', theme: 'classic', collapsed: false, finishedOpen: false }
const FLAGS = ['collapsed', 'finishedOpen']

test('prefs that are missing, not an object, or of values this version does not know read as the defaults', () => {
  for (const stored of [undefined, null, 'classic', 7, ['theme', 'horror'], {}]) expect(readPrefs(stored)).toEqual(DEFAULTS)
  expect(readPrefs({ theme: 'neon', motion: 'Off', cost: 3, collapsed: 'yes', finishedOpen: 1 })).toEqual(DEFAULTS)
  expect(readPrefs({ theme: 'horror', motion: 'off', collapsed: true, extra: 'kept' })).toEqual({
    ...DEFAULTS,
    theme: 'horror',
    motion: 'off',
    collapsed: true,
  })
})

test('a key or value this version does not know reads as the default, and is kept on the next write', async ($, on) => {
  engine(on)
  const stored = { theme: 'neon', motion: 'off', future: { level: 2 }, collapsed: true }
  const kept = store(on, { prefs: stored })

  const listed = (await $.command.run(possums('settings'))).text
  expect(listed).toContain(STRINGS.setting('theme', 'classic', SETTINGS.theme.values))
  expect(listed).toContain(STRINGS.setting('motion', 'off', SETTINGS.motion.values))

  await $.command.run(possums('set cost estimate'))
  expect(kept.held.get('prefs')).toEqual({ ...stored, cost: 'estimate' })
})

test("prefs are read just before each write, so another session's change made meanwhile stays", async ($, on) => {
  engine(on)
  const kept = store(on, { prefs: { autoOpen: 'never' } })
  await $.command.run(possums('set theme horror'))
  kept.held.set('prefs', { ...(kept.held.get('prefs') as object), motion: 'off' })
  await $.command.run(possums('set cost estimate'))
  expect(kept.held.get('prefs')).toEqual({ autoOpen: 'never', theme: 'horror', motion: 'off', cost: 'estimate' })
})

test('every store write holds only setting values and panel flags, never what an agent was asked or answered (I-03)', async ($, on) => {
  engine(on)
  on('agent.spawn', () => SPAWNED)
  on('turn.start', () => TURN_STARTED)
  on('turn.complete', () => TURN_COMPLETED)
  on('session.measure', () => MEASURED)
  on('classic.PermissionRequest', () => PERMITTED)
  on('classic.SessionStart', () => ({}))
  mock.clock(on)
  const kept = store(on, { prefs: { future: 'kept' } })

  await $.session.start(SESSION_START)
  await $.agent.spawn(SPAWN)
  await $.turn.start(TURN_START)
  await $.classic.PermissionRequest(PERMISSION)
  await $.classic.SessionStart({ source: 'clear' })
  await $.turn.complete(TURN_COMPLETE)
  await $.session.measure(MEASURE)
  // A run that ends after the clear, so Finished's show button is drawn and pressed on each surface.
  await $.agent.spawn(SPAWN)
  await $.turn.complete(TURN_COMPLETE)
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, surface })
    await pane.press({ key: 'finished' })
    await pane.unmount()
  }
  const sets = SETTING_NAMES.flatMap(name => SETTINGS[name].values.map(value => `set ${name} ${value}`))
  for (const args of ['open', 'settings', ...sets, '']) await $.command.run(possums(args))

  expect(kept.writes).toHaveLength(SURFACES.length + sets.length)
  const agentText = [SPAWN.prompt, SPAWN.description, TURN_START.text, TURN_COMPLETE.answer, SESSION_START.cwd, PERMISSION.tool_input.command]
  for (const write of kept.writes) {
    expect(write.key).toBe('prefs')
    for (const [key, value] of Object.entries(write.value as object)) {
      expect([...SETTING_NAMES, ...FLAGS, 'future']).toContain(key)
      if (key === 'future') expect(value).toBe('kept')
      else if (FLAGS.includes(key)) expect(typeof value).toBe('boolean')
      else expect(SETTINGS[key as SettingName].values as readonly unknown[]).toContain(value)
    }
    for (const text of agentText) expect(JSON.stringify(write)).not.toContain(text)
  }
})

test("a remembered pick is stored under its agent type's key as a role id, never what the agent was asked (I-03)", async ($, on) => {
  engine(on)
  on('agent.spawn', () => SPAWNED)
  const clock = mock.clock(on)
  const kept = store(on)
  const keeper = { ...SPAWN, subagentType: 'shed-keeper' }
  await $.agent.spawn(keeper)
  for (const [surface, role] of [
    ['terminal', 'tester'],
    ['desktop', 'guard'],
  ] as const) {
    const pane = await $.ui.mount({ ...MOUNT, surface })
    await pane.press({ key: `role-${SPAWNED.agentId}` })
    await clock.advance(100)
    await pane.select({ key: 'role-pick', value: role })
    await clock.advance(100)
    await pane.unmount()
  }
  expect(kept.writes).toEqual([
    { key: 'role:shed-keeper', value: 'tester' },
    { key: 'role:shed-keeper', value: 'guard' },
  ])
  for (const text of [keeper.prompt, keeper.description]) expect(JSON.stringify(kept.writes)).not.toContain(text)
})

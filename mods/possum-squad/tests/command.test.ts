import { expect, test } from 'claude-code/testing'

import { PANE_COLUMNS } from '../hooks/config'
import { PANE } from '../hooks/register'
import { SETTING_NAMES, SETTINGS, type SettingName } from '../hooks/settings'
import { STRINGS } from '../hooks/strings'
import { engine, possums, store } from './engine'

const OPENED = { id: PANE, title: STRINGS.title, columns: PANE_COLUMNS }
const SHOWN = [{ id: PANE, isShown: true, isPlaced: true }]

// What `/possums settings` should answer for these values.
const listing = (values: Record<SettingName, string>) =>
  [STRINGS.settingsHeading, ...SETTING_NAMES.map(name => STRINGS.setting(name, values[name], SETTINGS[name].values)), STRINGS.howToChange].join('\n')
const DEFAULTS = { autoOpen: 'first', cost: 'off', motion: 'auto', theme: 'classic' }

test('/possums open opens the pane, raises a hidden one, and never closes it', async ($, on) => {
  const seen = engine(on)

  expect((await $.command.run(possums('open'))).text).toBeUndefined()
  expect(seen.opens).toEqual([OPENED])

  expect((await $.command.run(possums('open'))).text).toBeUndefined()
  expect(seen.opens).toEqual([OPENED])
  expect(seen.panes).toEqual(SHOWN)

  for (const pane of [
    { id: PANE, isShown: false, isPlaced: true },
    { id: PANE, isShown: false, isPlaced: false },
  ]) {
    seen.panes = [pane]
    seen.opens = []
    expect((await $.command.run(possums('Open'))).text).toBeUndefined()
    expect(seen.opens).toEqual([{ ...OPENED, focus: true }])
    expect(seen.panes).toEqual(SHOWN)
  }
})

test('/possums followed by spaces alone still toggles the pane', async ($, on) => {
  const seen = engine(on)
  await $.command.run(possums('   '))
  expect(seen.panes).toEqual(SHOWN)
  await $.command.run(possums(' '))
  expect(seen.panes).toEqual([])
})

test('/possums set changes a setting, its name and value in any case, and answers the new value', async ($, on) => {
  engine(on)
  const kept = store(on)

  expect((await $.command.run(possums('set theme horror'))).text).toBe(STRINGS.isNow('theme', 'horror'))
  expect(kept.held.get('prefs')).toEqual({ theme: 'horror' })

  expect((await $.command.run(possums('SET autoopen  ALWAYS'))).text).toBe(STRINGS.isNow('autoOpen', 'always'))
  expect(kept.held.get('prefs')).toEqual({ theme: 'horror', autoOpen: 'always' })
})

test('/possums set with no name, or one it does not know, answers the names, and stores nothing', async ($, on) => {
  engine(on)
  const kept = store(on)
  for (const args of ['set colour red', 'set collapsed true', 'set language uk']) {
    expect((await $.command.run(possums(args))).text).toBe(STRINGS.noSuchSetting(SETTING_NAMES))
  }
  expect((await $.command.run(possums('set  '))).text).toBe(STRINGS.noName(SETTING_NAMES))
  expect(kept.writes).toEqual([])
})

test('/possums set with a value the setting does not take answers its values, and stores nothing', async ($, on) => {
  engine(on)
  const kept = store(on)
  for (const args of ['set theme neon', 'set theme', 'set motion off please', 'set cost 0']) {
    const name = args.split(' ')[1] as SettingName
    expect((await $.command.run(possums(args))).text).toBe(STRINGS.badValue(name, SETTINGS[name].values))
  }
  expect(kept.writes).toEqual([])
})

test('/possums settings lists every setting with its value: the defaults, then what was set', async ($, on) => {
  engine(on)
  store(on)
  expect((await $.command.run(possums('settings'))).text).toBe(listing(DEFAULTS))

  await $.command.run(possums('set motion off'))
  await $.command.run(possums('set cost estimate'))
  expect((await $.command.run(possums('Settings'))).text).toBe(listing({ ...DEFAULTS, motion: 'off', cost: 'estimate' }))
})

test('/possums with words it does not know answers how to use it, and leaves the pane alone', async ($, on) => {
  const seen = engine(on)
  const kept = store(on)
  for (const args of ['dance', 'roles now', 'open now', 'settings please', 'theme horror']) {
    expect((await $.command.run(possums(args))).text).toBe(STRINGS.usage)
  }
  expect(seen.opens).toEqual([])
  expect(seen.panes).toEqual([])
  expect(kept.writes).toEqual([])
})

test("every answer in words is the person's alone, kept out of what the model is sent", async ($, on) => {
  engine(on)
  store(on)
  for (const args of ['set theme horror', 'set colour red', 'set theme neon', 'settings', 'dance']) {
    const answer = await $.command.run(possums(args))
    expect(answer.text).toBeDefined()
    expect(answer.isTextDisplayOnly).toBe(true)
  }
})

test('a pane that cannot be opened answers in one line, kept out of what the model is sent', async ($, on) => {
  engine(on, 'another plugin holds this pane')
  const answer = await $.command.run(possums('open'))
  expect(answer.text).toBe(STRINGS.cannotToggle)
  expect(answer.isTextDisplayOnly).toBe(true)
})

test('a store that refuses answers in one line, for a change and for the list', async ($, on) => {
  engine(on)
  store(on, {}, 'set')
  expect((await $.command.run(possums('set theme horror'))).text).toBe(STRINGS.cannotStore)
  expect((await $.command.run(possums('settings'))).text).toBe(listing(DEFAULTS))
})

test('a store that cannot be read answers in one line, for a change and for the list', async ($, on) => {
  engine(on)
  const kept = store(on, {}, 'get')
  expect((await $.command.run(possums('settings'))).text).toBe(STRINGS.cannotStore)
  expect((await $.command.run(possums('set theme horror'))).text).toBe(STRINGS.cannotStore)
  expect(kept.writes).toEqual([])
})

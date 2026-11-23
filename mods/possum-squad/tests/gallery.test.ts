import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import type { RoleId } from '../types/index'
import { PANE } from '../hooks/register'
import { ART } from '../hooks/sprites/data'
import { sprite } from '../hooks/sprites/index'
import { STRINGS } from '../hooks/strings'
import { engine, MOUNT, POSSUMS, possums, SURFACES, store } from './engine'

const ROLE_IDS = Object.keys(STRINGS.roles) as RoleId[]
// The motion table's eight states, in its order.
const STATES = ['planned', 'starting', 'working', 'needs-you', 'quiet', 'finished', 'failed', 'stopped'] as const
const SHOWN = [{ id: PANE, isShown: true, isPlaced: true }]
const ROLES = possums('roles')

function world(on: On, prefs: Record<string, unknown> = {}) {
  const seen = engine(on)
  store(on, { prefs })
  const clock = mock.clock(on, { now: 1_000 })
  return { seen, clock }
}

type Drawn = { alt: string; source: string; isInteractive?: boolean }
type Seen = { sprites: Drawn[]; texts: string[]; emptyBoxes: number }

// What the pane draws on a surface. The kit's terminal draws an Svg as an empty Box, so those are counted.
async function drawnOn($: Engine, surface: (typeof SURFACES)[number]): Promise<Seen> {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  const elements = await pane.findAll({})
  await pane.unmount()
  return {
    sprites: elements.filter(element => element.type === 'Svg').map(element => element.props as Drawn),
    texts: elements.filter(element => element.type === 'Text').map(element => element.text),
    emptyBoxes: elements.filter(element => element.type === 'Box' && element.children.length === 0).length,
  }
}

const altOf = (role: RoleId, state: (typeof STATES)[number]) => STRINGS.sprite.alt(STRINGS.roles[role], STRINGS.states[state])
const costumes = (set: string) => ROLE_IDS.map(role => ART.sets[set]?.roles[role]?.costume ?? '')
const count = (texts: readonly string[], text: string) => texts.filter(one => one === text).length

test('/possums roles opens the pane on the gallery: 17 roles in 8 states, with role and costume names, on both surfaces (F-26)', async ($, on) => {
  const { seen } = world(on)
  expect((await $.command.run(ROLES)).text).toBeUndefined()
  expect(seen.panes).toEqual(SHOWN)
  expect(ROLE_IDS).toHaveLength(17)
  for (const surface of SURFACES) {
    const drawn = await drawnOn($, surface)
    expect(drawn.texts).toContain(STRINGS.gallery.heading('Classic'))
    expect(drawn.texts).not.toContain(STRINGS.empty)
    for (const [at, role] of ROLE_IDS.entries()) {
      expect([surface, role, drawn.texts.includes(STRINGS.roles[role]), drawn.texts.includes(costumes('classic')[at] ?? '')]).toEqual([
        surface,
        role,
        true,
        true,
      ])
    }
    if (surface === 'terminal') {
      expect([drawn.sprites, drawn.emptyBoxes]).toEqual([[], 0])
      for (const state of STATES) expect([state, count(drawn.texts, STRINGS.states[state])]).toEqual([state, 1])
      continue
    }
    // The Lead's sprite heads the pane; then each role in each state, still.
    const gallery = drawn.sprites.slice(1)
    expect(drawn.sprites[0]?.alt).toBe(STRINGS.roles.lead)
    expect(gallery.map(one => one.alt)).toEqual(ROLE_IDS.flatMap(role => STATES.map(state => altOf(role, state))))
    for (const [at, one] of gallery.entries()) {
      const role = ROLE_IDS[Math.floor(at / STATES.length)]
      const state = STATES[at % STATES.length] ?? 'planned'
      expect([one.alt, one.source === sprite({ set: 'classic', role, pose: state, motion: 'off' }).source, one.isInteractive]).toEqual([
        one.alt,
        true,
        undefined,
      ])
    }
    for (const state of STATES) expect([state, count(drawn.texts, STRINGS.states[state])]).toEqual([state, ROLE_IDS.length])
  }
})

test('the gallery wears the theme: its costume names and sprites follow the set, its role names never', async ($, on) => {
  world(on, { theme: 'steampunk' })
  await $.command.run(ROLES)
  for (const surface of SURFACES) {
    const steampunk = await drawnOn($, surface)
    await $.command.run(possums('set theme prehistoric'))
    const prehistoric = await drawnOn($, surface)
    await $.command.run(possums('set theme steampunk'))
    expect([steampunk.texts.includes(STRINGS.gallery.heading('Steampunk')), prehistoric.texts.includes(STRINGS.gallery.heading('Prehistoric'))]).toEqual([
      true,
      true,
    ])
    const names = (seen: Seen) => seen.texts.filter(text => Object.values(STRINGS.roles).includes(text as never))
    expect(names(prehistoric)).toEqual(names(steampunk))
    expect(names(steampunk)).toEqual(expect.arrayContaining(Object.values(STRINGS.roles)))
    for (const [set, seen] of [
      ['steampunk', steampunk],
      ['prehistoric', prehistoric],
    ] as const) {
      for (const costume of costumes(set)) expect([set, costume, seen.texts.includes(costume)]).toEqual([set, costume, true])
      if (surface === 'terminal') continue
      const builder = seen.sprites.find(one => one.alt === altOf('builder', 'working'))
      expect([set, builder?.source]).toEqual([set, sprite({ set, role: 'builder', pose: 'working', motion: 'off' }).source])
    }
  }
})

test("the gallery's close button draws the list again, on both surfaces", async ($, on) => {
  const { clock } = world(on)
  for (const surface of SURFACES) {
    await $.command.run(ROLES)
    const pane = await $.ui.mount({ ...MOUNT, surface })
    const texts = async () => (await pane.findAll({ type: 'Text' })).map(text => text.text)
    expect(await texts()).toContain(STRINGS.gallery.heading('Classic'))
    expect((await pane.find({ type: 'Button' }))?.props.label).toBe(STRINGS.gallery.close)
    await pane.press({ key: 'gallery' })
    await clock.advance(100)
    expect([surface, await texts()]).toEqual([surface, expect.arrayContaining([STRINGS.empty])])
    expect(await texts()).not.toContain(STRINGS.gallery.heading('Classic'))
    await pane.unmount()
  }
})

test('any close of the pane ends the gallery, so it opens again on the list', async ($, on) => {
  const { seen } = world(on)
  await $.command.run(ROLES)
  // `/possums` closes a shown pane, then opens it again.
  await $.command.run(POSSUMS)
  expect(seen.panes).toEqual([])
  await $.command.run(POSSUMS)
  for (const surface of SURFACES) {
    const drawn = await drawnOn($, surface)
    expect([surface, drawn.texts.includes(STRINGS.empty), drawn.texts.includes(STRINGS.gallery.heading('Classic'))]).toEqual([surface, true, false])
  }
})

test('/possums roles never closes the pane: it leaves a shown one open, and raises one behind another', async ($, on) => {
  const { seen } = world(on)
  await $.command.run(POSSUMS)
  await $.command.run(ROLES)
  await $.command.run(ROLES)
  expect(seen.panes).toEqual(SHOWN)
  expect(seen.opens).toHaveLength(1)
  seen.panes = [{ id: PANE, isShown: false, isPlaced: true }]
  await $.command.run(ROLES)
  expect(seen.opens.at(-1)).toEqual({ id: PANE, title: STRINGS.title, columns: expect.any(Number), focus: true })
  expect(seen.panes).toEqual(SHOWN)
})

// Another plugin, beside the mod, refusing its writes to `view`.
const REFUSER = {
  name: 'refuser',
  register: (on: On) => {
    on('state.set', (_, e, next) => (e.plugin === 'possum-squad' && e.key === 'view' ? ({ deny: 'the fixture refuses the write' } as never) : next(e)))
  },
}

test(
  "a gallery whose flag cannot be written answers in one line, kept out of the model's requests, and opens nothing",
  { plugins: [REFUSER] },
  async ($, on) => {
    const { seen } = world(on)
    const answer = await $.command.run(ROLES)
    expect([answer.text, answer.isTextDisplayOnly]).toEqual([STRINGS.cannotToggle, true])
    expect(seen.opens).toEqual([])
  },
)

import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import type { RoleId } from '../types/index'
import { PANE } from '../hooks/register'
import { ART } from '../hooks/sprites/data'
import { sprite } from '../hooks/sprites/index'
import { STRINGS } from '../hooks/strings'
import { engine, MOUNT, POSSUMS, possums, SURFACES, store } from './engine'
import { SPAWN } from './fixtures/events'

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
// Each state's one-off in the gallery, played again after a rest; planned and failed are still.
const MOMENTS = { starting: 'arrival', finished: 'ending', stopped: 'ending' } as const
const STILL_STATES: readonly string[] = ['planned', 'failed']
const cellOf = (set: string, role: RoleId, state: (typeof STATES)[number], motion: 'auto' | 'off') => {
  const moment = state in MOMENTS ? MOMENTS[state as keyof typeof MOMENTS] : undefined
  return sprite({ set, role, pose: state, motion, ...(moment === undefined ? {} : { moment, isRepeated: true }) })
}
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
      // Each role's name, then a dim separator, then its costume, so they never run together.
      for (const [at, role] of ROLE_IDS.entries()) {
        const from = drawn.texts.indexOf(STRINGS.roles[role])
        expect([role, drawn.texts.slice(from, from + 3)]).toEqual([role, [STRINGS.roles[role], STRINGS.gallery.between, costumes('classic')[at]]])
      }
      continue
    }
    // The Lead's sprite heads the pane; then each role in each state, moving and framed but for planned and failed.
    const gallery = drawn.sprites.slice(1)
    expect(drawn.sprites[0]?.alt).toBe(STRINGS.roles.lead)
    expect(gallery.map(one => one.alt)).toEqual(ROLE_IDS.flatMap(role => STATES.map(state => altOf(role, state))))
    for (const [at, one] of gallery.entries()) {
      const role = ROLE_IDS[Math.floor(at / STATES.length)] ?? 'lead'
      const state = STATES[at % STATES.length] ?? 'planned'
      const isStill = STILL_STATES.includes(state)
      expect([one.alt, one.source === cellOf('classic', role, state, 'auto').source, one.isInteractive]).toEqual([one.alt, true, isStill ? undefined : true])
      expect([one.alt, one.source.includes('<animate')]).toEqual([one.alt, !isStill])
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
      expect([set, builder?.source]).toEqual([set, sprite({ set, role: 'builder', pose: 'working', motion: 'auto' }).source])
    }
  }
})

test('with motion off every cell of the gallery is a still image, its one-offs not played', async ($, on) => {
  world(on, { motion: 'off' })
  await $.command.run(ROLES)
  const gallery = (await drawnOn($, 'desktop')).sprites.slice(1)
  expect(gallery).toHaveLength(ROLE_IDS.length * STATES.length)
  for (const [at, one] of gallery.entries()) {
    const role = ROLE_IDS[Math.floor(at / STATES.length)] ?? 'lead'
    const state = STATES[at % STATES.length] ?? 'planned'
    expect([one.alt, one.source === cellOf('classic', role, state, 'off').source, one.isInteractive, one.source.includes('<animate')]).toEqual([
      one.alt,
      true,
      undefined,
      false,
    ])
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

test('a pane that cannot be shown takes the gallery back, so the next drawing is the list', async ($, on) => {
  engine(on, 'another plugin holds this pane')
  store(on)
  mock.clock(on, { now: 1_000 })
  expect((await $.command.run(ROLES)).text).toBe(STRINGS.cannotToggle)
  for (const surface of SURFACES) {
    const drawn = await drawnOn($, surface)
    expect([surface, drawn.texts.includes(STRINGS.empty), drawn.texts.includes(STRINGS.gallery.heading('Classic'))]).toEqual([surface, true, false])
  }
})

test("the clock's beat redraws the list each second but leaves the gallery undrawn: its sprites move by themselves", async ($, on) => {
  const { clock } = world(on)
  let redraws = 0
  on('ui.invalidate', (_, e, next) => {
    redraws++
    return next(e)
  })
  on('agent.spawn', async () => ({ model: 'claude-haiku-5-5', agentId: 'agent-1' }))
  await $.command.run(POSSUMS)
  await $.agent.spawn(SPAWN)
  await clock.advance(3_000)
  const onList = redraws
  expect(onList).toBeGreaterThanOrEqual(3)
  await $.command.run(ROLES)
  await clock.advance(3_000)
  expect(redraws).toBe(onList)
  // Closed, the list's beat comes back.
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  await pane.press({ key: 'gallery' })
  await clock.advance(3_000)
  await pane.unmount()
  expect(redraws).toBeGreaterThanOrEqual(onList + 3)
})

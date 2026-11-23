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
type Seen = { sprites: Drawn[]; texts: string[]; names: string[]; emptyBoxes: number }
type Surface = (typeof SURFACES)[number]
type Clock = ReturnType<typeof mock.clock>

// The gallery's parts: three roles each, in the default set's order, so six for seventeen roles.
const PARTS = 6
const PER_PART = 3
const partOf = (at: number) => ROLE_IDS.slice(at * PER_PART, at * PER_PART + PER_PART)

const ROLE_NAMES: readonly string[] = Object.values(STRINGS.roles)

// What one drawing holds. A role's name is never dim, its costume's always, and some costumes share their role's name.
// The kit's terminal draws an Svg as an empty Box, so those are counted.
function seenOf(elements: readonly { type: string; props: unknown; text: string; children: readonly unknown[] }[]): Seen {
  const texts = elements.filter(element => element.type === 'Text')
  return {
    sprites: elements.filter(element => element.type === 'Svg').map(element => element.props as Drawn),
    texts: texts.map(element => element.text),
    names: texts
      .filter(element => (element.props as { dimColor?: boolean }).dimColor !== true && ROLE_NAMES.includes(element.text))
      .map(element => element.text),
    emptyBoxes: elements.filter(element => element.type === 'Box' && element.children.length === 0).length,
  }
}

// What the pane draws on a surface.
async function drawnOn($: Engine, surface: Surface): Promise<Seen> {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  const seen = seenOf(await pane.findAll({}))
  await pane.unmount()
  return seen
}

// Each part of the open gallery as a surface draws it, from the one shown, pressing next between them; the last press
// wraps it back to where it began.
async function partsOn($: Engine, clock: Clock, surface: Surface): Promise<Seen[]> {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  const parts: Seen[] = []
  for (let at = 0; at < PARTS; at++) {
    parts.push(seenOf(await pane.findAll({})))
    await pane.press({ key: 'gallery-next' })
    await clock.advance(100)
  }
  await pane.unmount()
  return parts
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
const costumeOf = (set: string, role: RoleId) => ART.sets[set]?.roles[role]?.costume ?? ''
const count = (texts: readonly string[], text: string) => texts.filter(one => one === text).length
const roleNames = (seen: Seen) => seen.names

test('/possums roles opens the pane on the gallery: 17 roles in 8 states, three roles a part, with role and costume names, on both surfaces (F-26)', async ($, on) => {
  const { seen, clock } = world(on)
  expect((await $.command.run(ROLES)).text).toBeUndefined()
  expect(seen.panes).toEqual(SHOWN)
  expect(ROLE_IDS).toHaveLength(17)
  for (const surface of SURFACES) {
    const parts = await partsOn($, clock, surface)
    // Every role once across the parts, in order, and the pressing came round to the first part again.
    expect([surface, parts.flatMap(roleNames)]).toEqual([surface, ROLE_IDS.map(role => STRINGS.roles[role])])
    expect((await drawnOn($, surface)).texts).toContain(STRINGS.gallery.part(1, PARTS))
    for (const [at, drawn] of parts.entries()) {
      const roles = partOf(at)
      expect(drawn.texts).toContain(STRINGS.gallery.heading('Classic'))
      expect(drawn.texts).toContain(STRINGS.gallery.part(at + 1, PARTS))
      expect(drawn.texts).not.toContain(STRINGS.empty)
      for (const role of roles) expect([surface, role, drawn.texts.includes(costumeOf('classic', role))]).toEqual([surface, role, true])
      if (surface === 'terminal') {
        expect([drawn.sprites, drawn.emptyBoxes]).toEqual([[], 0])
        for (const state of STATES) expect([state, count(drawn.texts, STRINGS.states[state])]).toEqual([state, 1])
        // Each role's name, then a dim separator, then its costume, so they never run together.
        for (const role of roles) {
          const from = drawn.texts.indexOf(STRINGS.roles[role])
          expect([role, drawn.texts.slice(from, from + 3)]).toEqual([role, [STRINGS.roles[role], STRINGS.gallery.between, costumeOf('classic', role)]])
        }
        continue
      }
      // The Lead's sprite heads the pane; then each of the part's roles in each state, moving and framed but for planned and failed.
      const gallery = drawn.sprites.slice(1)
      expect(drawn.sprites[0]?.alt).toBe(STRINGS.roles.lead)
      expect(gallery.map(one => one.alt)).toEqual(roles.flatMap(role => STATES.map(state => altOf(role, state))))
      for (const [cell, one] of gallery.entries()) {
        const role = roles[Math.floor(cell / STATES.length)] ?? 'lead'
        const state = STATES[cell % STATES.length] ?? 'planned'
        const isStill = STILL_STATES.includes(state)
        expect([one.alt, one.source === cellOf('classic', role, state, 'auto').source, one.isInteractive]).toEqual([one.alt, true, isStill ? undefined : true])
        expect([one.alt, one.source.includes('<animate')]).toEqual([one.alt, !isStill])
      }
      for (const state of STATES) expect([state, count(drawn.texts, STRINGS.states[state])]).toEqual([state, roles.length])
    }
  }
})

test('the gallery wears the theme: its costume names and sprites follow the set, its role names never', async ($, on) => {
  const { clock } = world(on, { theme: 'steampunk' })
  await $.command.run(ROLES)
  for (const surface of SURFACES) {
    const steampunk = await partsOn($, clock, surface)
    await $.command.run(possums('set theme prehistoric'))
    const prehistoric = await partsOn($, clock, surface)
    await $.command.run(possums('set theme steampunk'))
    expect([
      steampunk[0]?.texts.includes(STRINGS.gallery.heading('Steampunk')),
      prehistoric[0]?.texts.includes(STRINGS.gallery.heading('Prehistoric')),
    ]).toEqual([true, true])
    expect(prehistoric.flatMap(roleNames)).toEqual(steampunk.flatMap(roleNames))
    expect(steampunk.flatMap(roleNames)).toEqual(Object.values(STRINGS.roles))
    for (const [set, parts] of [
      ['steampunk', steampunk],
      ['prehistoric', prehistoric],
    ] as const) {
      const texts = parts.flatMap(part => part.texts)
      for (const costume of costumes(set)) expect([set, costume, texts.includes(costume)]).toEqual([set, costume, true])
      if (surface === 'terminal') continue
      const builder = parts.flatMap(part => part.sprites).find(one => one.alt === altOf('builder', 'working'))
      expect([set, builder?.source]).toEqual([set, sprite({ set, role: 'builder', pose: 'working', motion: 'auto' }).source])
    }
  }
})

test('with motion off every cell of the gallery is a still image, its one-offs not played', async ($, on) => {
  const { clock } = world(on, { motion: 'off' })
  await $.command.run(ROLES)
  const parts = await partsOn($, clock, 'desktop')
  const cells = parts.flatMap(part => part.sprites.slice(1))
  expect(cells).toHaveLength(ROLE_IDS.length * STATES.length)
  for (const [at, one] of cells.entries()) {
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

test("the gallery's previous and next move one part either way and wrap at the ends, on both surfaces", async ($, on) => {
  const { clock } = world(on)
  await $.command.run(ROLES)
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, surface })
    const shown = async () => {
      const seen = seenOf(await pane.findAll({}))
      return [seen.texts.find(text => /^\d+ of \d+$/.test(text)), roleNames(seen)]
    }
    const press = async (key: string) => {
      await pane.press({ key })
      await clock.advance(100)
    }
    const names = (at: number) => partOf(at).map(role => STRINGS.roles[role])
    expect([surface, await shown()]).toEqual([surface, [STRINGS.gallery.part(1, PARTS), names(0)]])
    await press('gallery-next')
    expect([surface, await shown()]).toEqual([surface, [STRINGS.gallery.part(2, PARTS), names(1)]])
    await press('gallery-previous')
    await press('gallery-previous')
    expect([surface, await shown()]).toEqual([surface, [STRINGS.gallery.part(6, PARTS), [STRINGS.roles.pilot, STRINGS.roles.helper]]])
    await press('gallery-next')
    expect([surface, await shown()]).toEqual([surface, [STRINGS.gallery.part(1, PARTS), names(0)]])
    await pane.unmount()
  }
})

test('the part stays through a change of set and a second /possums roles, and a gallery opened again starts on the first', async ($, on) => {
  const { clock } = world(on)
  await $.command.run(ROLES)
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  await pane.press({ key: 'gallery-next' })
  await clock.advance(100)
  await pane.press({ key: 'gallery-next' })
  await clock.advance(100)
  await $.command.run(possums('set theme horror'))
  await $.command.run(ROLES)
  await clock.advance(100)
  const third = seenOf(await pane.findAll({}))
  expect([third.texts.includes(STRINGS.gallery.part(3, PARTS)), roleNames(third)]).toEqual([true, partOf(2).map(role => STRINGS.roles[role])])
  await pane.press({ key: 'gallery' })
  await clock.advance(100)
  await pane.unmount()
  await $.command.run(ROLES)
  for (const surface of SURFACES) {
    const again = await drawnOn($, surface)
    expect([surface, again.texts.includes(STRINGS.gallery.part(1, PARTS)), roleNames(again)]).toEqual([
      surface,
      true,
      partOf(0).map(role => STRINGS.roles[role]),
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

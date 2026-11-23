import { type Engine, expect, mock, test } from 'claude-code/testing'

import type { RoleId } from '../types/index'
import { SETTINGS } from '../hooks/settings'
import { ART } from '../hooks/sprites/data'
import { costumeOf, drawSprite, galleryOf, type Look, sprite } from '../hooks/sprites/index'
import { type Pose, STILL } from '../hooks/sprites/recipes'
import type { Art, ArtRole, Layer } from '../hooks/sprites/types'
import { STRINGS } from '../hooks/strings'
import { engine, MOUNT, possums, SURFACES, store } from './engine'
import { SPAWN } from './fixtures/events'

const ROLE_IDS = Object.keys(STRINGS.roles) as RoleId[]
const POSES = Object.keys(STILL) as Pose[]
const MOTIONS = ['auto', 'off'] as const
const MOMENTS = [undefined, 'arrival', 'dressing', 'ending'] as const
const OTHER_SETS = SETTINGS.theme.values.filter(set => set !== ART.defaultSet)
const isDrawn = (layer: Layer) => /[^.\s]/.test(layer.rows)

test('the art holds the four sets the theme setting names, each with 17 outfits, 17 props and 17 costume names (F-27)', () => {
  expect(Object.keys(ART.sets)).toEqual([...SETTINGS.theme.values])
  expect(ART.defaultSet).toBe(SETTINGS.theme.initial)
  for (const [id, set] of Object.entries(ART.sets)) {
    expect([id, Object.keys(set.roles)]).toEqual([id, ROLE_IDS])
    for (const [role, art] of Object.entries(set.roles) as [RoleId, ArtRole][]) {
      expect([id, role, isDrawn(art.outfit), isDrawn(art.prop), art.costume.trim() !== '']).toEqual([id, role, true, true, true])
    }
  }
})

test('switching the set changes every dressed sprite, in every pose, moment and either motion (F-27)', () => {
  for (const set of OTHER_SETS) {
    for (const role of ROLE_IDS) {
      for (const pose of POSES) {
        for (const motion of MOTIONS) {
          for (const moment of MOMENTS) {
            const look: Look = { set, role, pose, motion, ...(moment === undefined ? {} : { moment }) }
            expect([look, sprite(look).source === sprite({ ...look, set: ART.defaultSet }).source]).toEqual([look, false])
          }
        }
      }
    }
  }
})

test("every set's gallery names the same 17 roles in the same order, each with that set's own costume", () => {
  for (const set of SETTINGS.theme.values) {
    const gallery = galleryOf(ART, set)
    expect([set, gallery.title, gallery.roles.map(role => role.id)]).toEqual([set, ART.sets[set]?.title, ROLE_IDS])
    expect([set, gallery.roles.map(role => role.costume)]).toEqual([set, ROLE_IDS.map(role => ART.sets[set]?.roles[role]?.costume)])
  }
})

// A fictional set of two roles: a hat and a stick each, in colours of the shared palette.
const layer = (top: number, rows: readonly string[]): Layer => ({ top, rows: `\n${rows.join('\n')}` })
const TINY_ROLE = (costume: string, colour: string): ArtRole => ({
  costume,
  outfit: layer(4, [`.............${colour.repeat(6)}`, `............${colour.repeat(8)}`]),
  prop: layer(18, ['..R', '..R', '..R']),
  propWorkDy: 1,
})
const TINY: Art = {
  ...ART,
  sets: { ...ART.sets, tiny: { title: 'Tiny', roles: { scout: TINY_ROLE('Mole', 'V'), builder: TINY_ROLE('Beaver', 'L') } } },
}

test('a fictional set of two roles draws those two and falls back to classic for the other fifteen, costume names too (F-27)', () => {
  const own = ['scout', 'builder']
  for (const role of ROLE_IDS) {
    for (const pose of POSES) {
      for (const motion of MOTIONS) {
        for (const moment of MOMENTS) {
          const look: Look = { set: 'tiny', role, pose, motion, ...(moment === undefined ? {} : { moment }) }
          const isSame = drawSprite(TINY, look).source === drawSprite(TINY, { ...look, set: ART.defaultSet }).source
          expect([look, isSame]).toEqual([look, !own.includes(role)])
        }
      }
    }
  }
  const gallery = galleryOf(TINY, 'tiny')
  expect(gallery.title).toBe('Tiny')
  expect(gallery.roles.map(role => role.costume)).toEqual(
    ROLE_IDS.map(role => (role === 'scout' ? 'Mole' : role === 'builder' ? 'Beaver' : ART.sets.classic?.roles[role]?.costume)),
  )
})

test('a set the art does not hold draws, names and titles as the default set', () => {
  expect(galleryOf(ART, 'gone')).toEqual(galleryOf(ART, ART.defaultSet))
  expect(costumeOf(ART, 'gone', 'scout')).toBe(ART.sets.classic?.roles.scout?.costume)
  expect(costumeOf(ART, 'classic', 'mime')).toBeUndefined()
})

type Seen = { sprites: { alt: string; source: string }[]; texts: string[] }

// What the pane draws on a surface: its sprites and its text.
async function drawnOn($: Engine, surface: (typeof SURFACES)[number]): Promise<Seen> {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  const elements = await pane.findAll({})
  await pane.unmount()
  return {
    sprites: elements.filter(element => element.type === 'Svg').map(element => element.props as Seen['sprites'][number]),
    texts: elements.filter(element => element.type === 'Text').map(element => element.text),
  }
}

test('/possums set theme redraws the pane in that set: every sprite changes, and no role name or other text (F-27)', async ($, on) => {
  engine(on)
  store(on)
  const clock = mock.clock(on, { now: 1_000 })
  on('agent.spawn', async () => ({ model: 'claude-haiku-5-5', agentId: 'agent-1' }))
  // An Explore agent is a Scout from its spawn; past its arrival it stands still.
  await $.agent.spawn(SPAWN)
  await clock.advance(5_000)
  const looks = (set: string) => [
    sprite({ set, role: 'lead', pose: 'idle', motion: 'auto' }).source,
    sprite({ set, role: 'scout', pose: 'starting', motion: 'auto' }).source,
  ]
  for (const surface of SURFACES) {
    const before = await drawnOn($, surface)
    await $.command.run(possums('set theme horror'))
    const after = await drawnOn($, surface)
    await $.command.run(possums('set theme classic'))
    expect([surface, after.texts]).toEqual([surface, before.texts])
    expect(before.texts.some(text => text.includes(STRINGS.roles.scout))).toBe(true)
    if (surface === 'terminal') {
      expect([before.sprites, after.sprites]).toEqual([[], []])
      continue
    }
    expect(after.sprites.map(one => one.alt)).toEqual(before.sprites.map(one => one.alt))
    expect(before.sprites.map(one => one.source)).toEqual(looks('classic'))
    expect(after.sprites.map(one => one.source)).toEqual(looks('horror'))
  }
})

import type { ElementTable, On, RenderElement } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import type { RoleId, StateId } from '../types/index'
import { DESCRIPTION_CHARS, SPRITE_BUDGET } from '../hooks/config'
import { TARGET_CHARS } from '../hooks/model/tools'
import { PICKABLE } from '../hooks/roles/rules'
import { sprite } from '../hooks/sprites/index'
import { STRINGS } from '../hooks/strings'
import { type PanelData, panel, withinBudget } from '../hooks/view/panel'
import type { RowData } from '../hooks/view/row'
import { engine, MOUNT, possums, SURFACES, store } from './engine'
import { DESKTOP_BOUND, isWithin, type Measure, measure } from './size'

type Surface = (typeof SURFACES)[number]

const NO_ACTIONS = {
  onToggleFinished: () => {},
  onCloseGallery: () => {},
  onMoveGallery: () => {},
  onToggleRole: () => {},
  onPickRole: () => {},
  onCancelRole: () => {},
}
const SETS = ['classic', 'steampunk', 'horror', 'prehistoric'] as const
const MOTIONS = ['auto', 'off'] as const
const PARTS = 6
const GALLERY_STATES = ['planned', 'starting', 'working', 'needs-you', 'quiet', 'finished', 'failed', 'stopped'] as const
const GALLERY_MOMENTS = { starting: 'arrival', finished: 'ending', stopped: 'ending' } as const

// The longest text a row draws: a description cut where the pane cuts it, and an activity naming a call's longest target.
const LONG_DESCRIPTION = `${'Sort the seed trays by colour, then label each for the spring beds '.repeat(3).slice(0, DESCRIPTION_CHARS)}${STRINGS.cut}`
const LONG_ACTIVITY = `${STRINGS.activity.Bash} ${'./plant --bed north --rows 12 --spacing 30cm --label spring '.repeat(3).slice(0, TARGET_CHARS)}`

// Fictional rows in the given states, each dressed, numbered, in its second round and playing its moment.
function rowsIn(states: readonly StateId[]): RowData[] {
  return states.map((state, at) => {
    const roleId = PICKABLE[at % PICKABLE.length] ?? 'helper'
    return {
      id: `row-${at}`,
      order: at,
      state,
      description: LONG_DESCRIPTION,
      role: STRINGS.roles[roleId],
      roleId,
      model: 'claude-sonnet-5-5',
      effort: 'medium',
      activity: LONG_ACTIVITY,
      contextPercent: 47.5,
      tokens: 1_234_567,
      elapsedMs: 3_725_000,
      round: 2,
      moment: state === 'finished' || state === 'stopped' ? 'ending' : state === 'failed' ? undefined : 'dressing',
    } satisfies RowData
  })
}
const times = (count: number, state: StateId): StateId[] => Array.from({ length: count }, () => state)
const LIVE: readonly StateId[] = ['working', 'needs-you', 'quiet', 'starting']
const ENDED: readonly StateId[] = ['finished', 'failed', 'stopped']

function listOf(rows: readonly RowData[], look: PanelData['look'], options: Partial<PanelData> = {}): PanelData {
  return {
    lead: { tokens: 9_999_999, contextPercent: 99 },
    session: { tokens: 99_999_999, workedMs: 36_000_000 },
    rows,
    isFinishedOpen: true,
    look,
    ...options,
  }
}

// The test's own drawing of the panel, over whatever list it is handed last.
const LIST = 'size-list'
function drawing(on: On) {
  let data = listOf([], { set: 'classic', motion: 'auto' })
  on('ui.render', { plugin: '*', requestId: LIST }, ($, e) => panel($.ui.resolve(e), e.surface === 'terminal', data, NO_ACTIONS))
  return (next: PanelData) => {
    data = next
  }
}

async function drawnOn($: Engine, surface: Surface, requestId: string) {
  const pane = await $.ui.mount({ ...MOUNT, requestId, surface })
  const tree = await pane.drawn()
  const elements = await pane.findAll({})
  await pane.unmount()
  return { size: measure(tree), elements }
}

const within = (size: Measure) => [size.nodes < DESKTOP_BOUND.nodes, size.depth < DESKTOP_BOUND.depth, size.chars < DESKTOP_BOUND.chars]

test('the count matches what the desktop drew: the whole gallery in one tree is past its bound with either motion, and fourteen working rows are within it', async ($, on) => {
  // The gallery as one tree drew it: every role in every pose, each sprite as the gallery draws it.
  let motion: 'auto' | 'off' = 'auto'
  on('ui.render', { plugin: '*', requestId: 'whole-gallery' }, ($, e) => {
    const table = $.ui.resolve(e) as ElementTable & { Svg?: (props: object) => RenderElement }
    const cells = (Object.keys(STRINGS.roles) as RoleId[]).flatMap(role =>
      GALLERY_STATES.map(state => {
        const moment = state in GALLERY_MOMENTS ? GALLERY_MOMENTS[state as keyof typeof GALLERY_MOMENTS] : undefined
        const drawn = sprite({ set: 'classic', role, pose: state, motion, ...(moment === undefined ? {} : { moment, isRepeated: true }) })
        return e.surface === 'terminal' || table.Svg === undefined
          ? table.Text({ children: STRINGS.row.mark })
          : table.Svg({ source: drawn.source, alt: `${role} ${state}`, width: 64, height: 64 })
      }),
    )
    return table.Box({ flexDirection: 'row', flexWrap: 'wrap', children: cells })
  })
  const draw = drawing(on)
  draw(listOf(rowsIn(times(14, 'working')), { set: 'classic', motion: 'auto' }))
  for (const surface of SURFACES) {
    const fourteen = await drawnOn($, surface, LIST)
    expect([surface, within(fourteen.size)]).toEqual([surface, [true, true, true]])
    for (const asked of MOTIONS) {
      motion = asked
      const whole = await drawnOn($, surface, 'whole-gallery')
      expect([surface, asked, isWithin(whole.size)]).toEqual([surface, asked, surface === 'terminal'])
    }
  }
})

test("every part of the gallery, in every set and either motion, is within the desktop's bound, on both surfaces", { timeoutMs: 60_000 }, async ($, on) => {
  engine(on)
  store(on, { prefs: {} })
  const clock = mock.clock(on, { now: 1_000 })
  await $.command.run(possums('roles'))
  for (const set of SETS) {
    for (const motion of MOTIONS) {
      await $.command.run(possums(`set theme ${set}`))
      await $.command.run(possums(`set motion ${motion}`))
      for (const surface of SURFACES) {
        const pane = await $.ui.mount({ ...MOUNT, surface })
        for (let at = 1; at <= PARTS; at++) {
          const texts = (await pane.findAll({ type: 'Text' })).map(text => text.text)
          const size = measure(await pane.drawn())
          expect([set, motion, surface, texts.includes(STRINGS.gallery.part(at, PARTS)), within(size)]).toEqual([
            set,
            motion,
            surface,
            true,
            [true, true, true],
          ])
          await pane.press({ key: 'gallery-next' })
          await clock.advance(100)
        }
        await pane.unmount()
      }
    }
  }
})

test("the pane with the most rows it draws is within the desktop's bound: sixty of ninety, long texts, moments, Finished and a picker open", async ($, on) => {
  const draw = drawing(on)
  const states = [
    ...Array.from({ length: 70 }, (_, at) => LIVE[at % LIVE.length] ?? 'working'),
    ...Array.from({ length: 20 }, (_, at) => ENDED[at % ENDED.length] ?? 'finished'),
  ]
  for (const set of SETS) {
    draw(listOf(rowsIn(states), { set, motion: 'auto' }, { pickerFor: 3 }))
    for (const surface of SURFACES) {
      const { size, elements } = await drawnOn($, surface, LIST)
      const rows = elements.filter(element => element.type === 'Button' && String((element.props as { key?: string }).key).startsWith('role-row-'))
      expect([set, surface, rows.length, within(size)]).toEqual([set, surface, 60, [true, true, true]])
    }
  }
})

test('past the budget the first rows move and the next stand still, the total within it; under it every row moves', async ($, on) => {
  const draw = drawing(on)
  const look = { set: 'classic', motion: 'auto' } as const
  for (const count of [40, 10]) {
    const rows = rowsIn(times(count, 'working')).map(({ moment: _, ...row }) => row)
    draw(listOf(rows, look))
    for (const surface of SURFACES) {
      const { elements } = await drawnOn($, surface, LIST)
      const sprites = elements.filter(element => element.type === 'Svg').map(element => element.props as { source: string; isInteractive?: boolean })
      const marks = elements.filter(element => element.type === 'Text' && element.text === STRINGS.row.mark).length
      if (surface === 'terminal') {
        expect([count, sprites]).toEqual([count, []])
        continue
      }
      const kinds = sprites.slice(1).map((one, at) => {
        const row = rows[at]
        const own = sprite({ ...look, role: row?.roleId, pose: 'working' }).source
        const still = sprite({ ...look, role: row?.roleId, pose: 'working', motion: 'off' }).source
        return one.source === own && one.isInteractive === true ? 'moves' : one.source === still && one.isInteractive === undefined ? 'still' : 'other'
      })
      const total = sprites.reduce((sum, one) => sum + one.source.length, 0)
      if (count === 10) {
        expect(kinds).toEqual(times(10, 'working').map(() => 'moves'))
        continue
      }
      const moving = kinds.filter(kind => kind === 'moves').length
      const still = kinds.filter(kind => kind === 'still').length
      // In drawing order: every moving row before every still one; the rows after them draw their mark.
      expect(kinds).toEqual([...Array.from({ length: moving }, () => 'moves'), ...Array.from({ length: still }, () => 'still')])
      expect([moving > 10, still > 0, marks, total <= SPRITE_BUDGET]).toEqual([true, true, count - moving - still, true])
    }
  }
})

test('the ladder: rows past the budget stand still, then draw no sprite, each in turn, never one ahead of an earlier row', () => {
  const sized = (length: number) => ({ source: 'x'.repeat(length), isAnimated: true, width: 32, height: 32 })
  const own = [sized(10), sized(10), sized(10), sized(10)]
  const stills = [sized(4), sized(4), sized(4), sized(4)]
  const kinds = (budget: number, mine = own) =>
    withinBudget(mine, at => stills[at] ?? sized(0), budget).map((one, at) => (one === undefined ? 'mark' : one === mine[at] ? 'moves' : 'still'))
  expect(kinds(40)).toEqual(['moves', 'moves', 'moves', 'moves'])
  expect(kinds(30)).toEqual(['moves', 'moves', 'still', 'still'])
  expect(kinds(10)).toEqual(['still', 'still', 'mark', 'mark'])
  expect(kinds(3)).toEqual(['mark', 'mark', 'mark', 'mark'])
  // A later row that would fit does not move while an earlier one cannot.
  expect(kinds(12, [sized(10), sized(5)]).slice(0, 2)).toEqual(['still', 'still'])
})

test('past sixty rows the rest are counted under their section, and the headings keep every row, on both surfaces', async ($, on) => {
  const draw = drawing(on)
  const look = { set: 'classic', motion: 'auto' } as const
  const cases = [
    { states: [...times(70, 'working'), ...times(20, 'finished')], isFinishedOpen: true, drawn: 60, more: [STRINGS.more(10), STRINGS.more(20)] },
    { states: [...times(70, 'working'), ...times(20, 'finished')], isFinishedOpen: false, drawn: 60, more: [STRINGS.more(10)] },
    { states: [...times(40, 'working'), ...times(30, 'finished')], isFinishedOpen: true, drawn: 60, more: [STRINGS.more(10)] },
  ]
  for (const [at, one] of cases.entries()) {
    draw(listOf(rowsIn(one.states), look, { isFinishedOpen: one.isFinishedOpen }))
    for (const surface of SURFACES) {
      const { elements } = await drawnOn($, surface, LIST)
      const texts = elements.filter(element => element.type === 'Text').map(element => element.text)
      const rows = elements.filter(element => element.type === 'Button' && String((element.props as { key?: string }).key).startsWith('role-row-'))
      const running = one.states.filter(state => state === 'working').length
      const finished = one.states.length - running
      expect([at, surface, rows.length, texts.filter(text => text.startsWith('and ') && text.endsWith(' more'))]).toEqual([at, surface, one.drawn, one.more])
      expect(texts).toContain(STRINGS.heading(STRINGS.sections.running, running))
      if (finished > 0) expect(texts).toContain(STRINGS.heading(STRINGS.sections.finished, finished))
    }
  }
})

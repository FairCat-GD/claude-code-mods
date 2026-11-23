import type { On } from 'claude-code'
import { type Engine, expect, test } from 'claude-code/testing'

import type { Run, StateId } from '../types/index'
import { NO_TOKENS } from '../hooks/model/runs'

import { sprite } from '../hooks/sprites/index'
import { STRINGS } from '../hooks/strings'
import { BAR_CELLS, bar, elapsed, fill, percent, tokens } from '../hooks/view/format'
import { desktopRow, type RolePicker, type RowData, terminalRow } from '../hooks/view/row'
import { momentOf } from '../hooks/view/runs'
import { spriteElement } from '../hooks/view/sprite'
import { MOUNT, SURFACES } from './engine'
import { LONG_ROW, MARKUP_ROW, ROWS } from './fixtures/rows'

const EVERY_ROW = [...ROWS, MARKUP_ROW, LONG_ROW]
const CLOSED: RolePicker = { isOpen: false, onToggle: () => {}, onPick: () => {}, onCancel: () => {} }

// A row's sprite as the panel draws it.
const spriteOf = (row: RowData) => sprite({ set: 'classic', role: row.roleId, pose: row.state, motion: 'auto' })

// The engine beneath the mod drawing one fixture row, picked by the request id, with the surface's builder; the desktop's
// with its sprite. A test plugin closes over nothing of this file, so the drawing is the test's own hook.
function drawRows(on: On) {
  on('ui.render', { plugin: '*' }, ($, e) => {
    const row = EVERY_ROW.find(one => one.id === e.requestId)
    if (row === undefined) throw new Error(`no fixture row ${e.requestId}`)
    const table = $.ui.resolve(e)
    if (e.surface === 'terminal') return terminalRow(table, row, CLOSED)
    const alt = STRINGS.sprite.alt(row.role ?? STRINGS.sprite.plain, STRINGS.states[row.state])
    return desktopRow(table, row, CLOSED, 'Svg' in table ? spriteElement(table.Svg, spriteOf(row), alt) : undefined)
  })
}

async function drawn($: Engine, surface: (typeof SURFACES)[number], row: RowData) {
  const pane = await $.ui.mount({ ...MOUNT, requestId: row.id, surface })
  const elements = await pane.findAll({})
  const texts = (await pane.findAll({ type: 'Text' })).map(text => text.text)
  await pane.unmount()
  return { elements, texts }
}

// Agent text, as the row draws it.
const agentText = (row: RowData) => [row.description, row.model, row.effort, row.activity].filter(text => text !== undefined)

test("a row's agent text is drawn only as plain Text, never as markup, a link or another element's prop (I-04)", async ($, on) => {
  drawRows(on)
  for (const surface of SURFACES) {
    for (const row of EVERY_ROW) {
      const { elements, texts } = await drawn($, surface, row)
      expect(texts).toContain(row.description)
      // Each in a Text of its own, whole: not folded into a label or another line.
      for (const whole of [row.description, row.activity]) {
        for (const text of texts.filter(one => whole !== undefined && one.includes(whole))) expect(text).toBe(whole)
      }
      expect(elements.filter(element => element.type === 'Markdown' || element.type === 'Link')).toEqual([])
      // The desktop's one Svg is the sprite, its source the mod's own art; its other props hold no agent text.
      const svgs = elements.filter(element => element.type === 'Svg')
      expect(svgs.map(svg => svg.props.source)).toEqual(surface === 'terminal' ? [] : [spriteOf(row).source])
      for (const element of elements.filter(one => one.type !== 'Text')) {
        const { source: _, ...props } = element.props as Record<string, unknown>
        for (const text of agentText(row)) expect(JSON.stringify(props)).not.toContain(text)
      }
    }
  }
})

test('every row carries its state word, on every surface (I-06)', async ($, on) => {
  drawRows(on)
  for (const surface of SURFACES) {
    for (const row of ROWS) {
      const { texts } = await drawn($, surface, row)
      expect(texts).toContain(STRINGS.states[row.state])
    }
  }
})

test("a row's four lines: description, then role, model and effort, the activity, and the numbers", async ($, on) => {
  drawRows(on)
  const working = ROWS.find(row => row.state === 'working') as RowData
  const starting = ROWS.find(row => row.state === 'starting') as RowData
  for (const surface of SURFACES) {
    const { elements, texts: full } = await drawn($, surface, working)
    // The role's name is its picker's button; the model and effort follow it as text.
    expect(elements.find(element => element.type === 'Button')?.props.label).toBe('Scout')
    expect(full).toContain('claude-haiku-5-5 · medium')
    expect(full).toContain('Reading shed/rack.txt')
    expect(full.some(text => text.includes('9%') && text.includes('18k') && text.includes('0:42'))).toBe(true)

    // Nothing known yet: a button to pick a role, no activity, an unknown context.
    const plain = await drawn($, surface, starting)
    expect(plain.elements.find(element => element.type === 'Button')?.props.label).toBe(STRINGS.picker.pick)
    const bare = plain.texts
    expect(bare).toContain(STRINGS.row.noActivity)
    expect(bare.some(text => text.includes(STRINGS.row.unknown) && text.includes('0:02'))).toBe(true)
  }
})

test('the description, details and activity are cut to one line, never wrapped', async ($, on) => {
  drawRows(on)
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, requestId: LONG_ROW.id, surface })
    const description = (await pane.findAll({ type: 'Text', text: LONG_ROW.description }))[0]
    expect(description?.props.wrap).toBe('end')
    const activity = (await pane.findAll({ type: 'Text', text: STRINGS.row.noActivity }))[0]
    expect(activity?.props.wrap).toBe('end')
    const details = (await pane.findAll({ type: 'Text', text: LONG_ROW.model }))[0]
    expect(details?.props.wrap).toBe('end')
    await pane.unmount()
  }
})

test('the terminal draws the context bar in block characters, with no element it lacks', async ($, on) => {
  drawRows(on)
  const working = ROWS.find(row => row.state === 'working') as RowData
  const { elements, texts } = await drawn($, 'terminal', working)
  expect(texts.some(text => text.startsWith(bar(working.contextPercent)))).toBe(true)
  expect(elements.map(element => element.type).filter(type => type !== 'Box' && type !== 'Text')).toEqual(['Button'])
})

test('token counts, times, percents and bars read as the row shows them', () => {
  expect([0, 640, 999, 1_000, 9_499, 9_960, 38_400, 999_400, 999_600, 1_234_567].map(tokens)).toEqual([
    '0',
    '640',
    '999',
    '1k',
    '9.5k',
    '10k',
    '38k',
    '999k',
    '1M',
    '1.2M',
  ])
  expect([0, 999, 42_000, 600_000, 3_599_999, 3_725_000, -5].map(elapsed)).toEqual(['0:00', '0:00', '0:42', '10:00', '59:59', '1:02:05', '0:00'])
  expect([9.4, 9.5, 100].map(percent)).toEqual(['9%', '10%', '100%'])
  expect(percent(undefined)).toBe(STRINGS.row.unknown)
  expect(bar(undefined)).toBe('░'.repeat(BAR_CELLS))
  expect(bar(0)).toBe('░'.repeat(BAR_CELLS))
  expect(bar(31)).toBe(`${'█'.repeat(3)}${'░'.repeat(BAR_CELLS - 3)}`)
  expect(bar(100)).toBe('█'.repeat(BAR_CELLS))
  expect(bar(250)).toBe('█'.repeat(BAR_CELLS))
  expect([fill(undefined), fill(50)]).toEqual([0, 0.5])
})

test('a number that is not finite reads as unknown, never as NaN', () => {
  for (const wrong of [Number.NaN, Number.POSITIVE_INFINITY]) {
    expect([tokens(wrong), elapsed(wrong), percent(wrong)]).toEqual([STRINGS.row.unknown, STRINGS.row.unknown, STRINGS.row.unknown])
    expect(bar(wrong)).toBe('░'.repeat(BAR_CELLS))
    expect(fill(wrong)).toBe(0)
  }
})

test("a row's moment is its arrival, a later role's hop or its ending, each for its one-off and one beat more", () => {
  const run: Run = {
    type: 'Explore',
    description: 'Count the shovels',
    round: 1,
    isTeammate: false,
    state: 'working',
    startedAt: 10_000,
    heardAt: 10_000,
    turnAt: 10_000,
    tokens: NO_TOKENS,
    inFlight: 0,
    order: 0,
  }
  // The arrival: three steps of the slide, a rest and a hop, 1 s at T-01, then a beat.
  expect([momentOf(run, 10_000), momentOf(run, 11_999), momentOf(run, 12_000), momentOf(run, 9_999)]).toEqual(['arrival', 'arrival', undefined, undefined])
  expect(momentOf({ ...run, state: 'starting' }, 10_000)).toBe('arrival')
  // A role settled while it arrived is dressed by the arrival; one settled after hops on its own, for one step and a beat.
  expect(momentOf({ ...run, role: { id: 'scout', source: 'type', at: 10_500 } }, 10_600)).toBe('arrival')
  const later: Run = { ...run, role: { id: 'builder', source: 'tools', at: 11_000 } }
  expect([momentOf(later, 11_000), momentOf(later, 12_199), momentOf(later, 12_200)]).toEqual(['dressing', 'dressing', undefined])
  // A role with no time plays no hop.
  expect(momentOf({ ...run, role: { id: 'builder', source: 'tools' } }, 15_000)).toBeUndefined()
  // The cheer lasts 3 s and the startle 1 s, the role settled at the end riding them; a failed run plays none.
  const ended = (state: StateId): Run => ({ ...run, state, endedAt: 20_000, role: { id: 'helper', source: 'fallback', at: 20_000 } })
  expect([momentOf(ended('finished'), 20_000), momentOf(ended('finished'), 23_999), momentOf(ended('finished'), 24_000)]).toEqual([
    'ending',
    'ending',
    undefined,
  ])
  expect([momentOf(ended('stopped'), 21_999), momentOf(ended('stopped'), 22_000)]).toEqual(['ending', undefined])
  expect(momentOf(ended('failed'), 20_000)).toBeUndefined()
  // A time that cannot be read plays none.
  expect(momentOf(run, Number.NaN)).toBeUndefined()
})

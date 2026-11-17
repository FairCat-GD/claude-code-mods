import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { STRINGS } from '../hooks/strings'
import { BAR_CELLS, bar, elapsed, percent, tokens } from '../hooks/view/format'
import { desktopRow, type RowData, terminalRow } from '../hooks/view/row'
import { MOUNT, SURFACES } from './engine'
import { LONG_ROW, MARKUP_ROW, ROWS } from './fixtures/rows'

const EVERY_ROW = [...ROWS, MARKUP_ROW, LONG_ROW]

// The engine beneath the mod drawing one fixture row, picked by the request id, with the surface's builder.
// A test plugin closes over nothing of this file, so the drawing is the test's own hook.
function drawRows(on: On) {
  on('ui.render', { plugin: '*' }, ($, e) => {
    const row = EVERY_ROW.find(one => one.id === e.requestId)
    if (row === undefined) throw new Error(`no fixture row ${e.requestId}`)
    const table = $.ui.resolve(e)
    return e.surface === 'terminal' ? terminalRow(table, row) : desktopRow(table, row)
  })
}

type Mounted = { findAll: (query: object) => Promise<{ type: string; text: string; props: Record<string, unknown> }[]>; unmount: () => Promise<void> }
type Mount = (target: object) => Promise<Mounted>

async function drawn(mount: Mount, surface: string, row: RowData) {
  const pane = await mount({ ...MOUNT, requestId: row.id, surface })
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
      const { elements, texts } = await drawn($.ui.mount as Mount, surface, row)
      expect(texts).toContain(row.description)
      // Each in a Text of its own, whole: not folded into a label or another line.
      for (const whole of [row.description, row.activity]) {
        for (const text of texts.filter(one => whole !== undefined && one.includes(whole))) expect(text).toBe(whole)
      }
      expect(elements.filter(element => element.type === 'Markdown' || element.type === 'Link' || element.type === 'Svg')).toEqual([])
      for (const element of elements.filter(one => one.type !== 'Text')) {
        for (const text of agentText(row)) expect(JSON.stringify(element.props)).not.toContain(text)
      }
    }
  }
})

test('every row carries its state word, on every surface (I-06)', async ($, on) => {
  drawRows(on)
  for (const surface of SURFACES) {
    for (const row of ROWS) {
      const { texts } = await drawn($.ui.mount as Mount, surface, row)
      expect(texts).toContain(STRINGS.states[row.state])
    }
  }
})

test("a row's four lines: description, then role, model and effort, the activity, and the numbers", async ($, on) => {
  drawRows(on)
  const working = ROWS.find(row => row.state === 'working') as RowData
  const starting = ROWS.find(row => row.state === 'starting') as RowData
  for (const surface of SURFACES) {
    const full = (await drawn($.ui.mount as Mount, surface, working)).texts
    expect(full).toContain('Scout · claude-haiku-5-5 · medium')
    expect(full).toContain('Reading shed/rack.txt')
    expect(full.some(text => text.includes('9%') && text.includes('18k') && text.includes('0:42'))).toBe(true)

    // Nothing known yet: no details, no activity, an unknown context.
    const bare = (await drawn($.ui.mount as Mount, surface, starting)).texts
    expect(bare).toContain(STRINGS.row.noActivity)
    expect(bare.some(text => text.includes(STRINGS.row.unknownPercent) && text.includes('0:02'))).toBe(true)
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
    await pane.unmount()
  }
})

test('the terminal draws the context bar in block characters, with no element it lacks', async ($, on) => {
  drawRows(on)
  const working = ROWS.find(row => row.state === 'working') as RowData
  const { elements, texts } = await drawn($.ui.mount as Mount, 'terminal', working)
  expect(texts.some(text => text.startsWith(bar(working.contextPercent)))).toBe(true)
  expect(elements.map(element => element.type).filter(type => type !== 'Box' && type !== 'Text')).toEqual([])
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
  expect(percent(undefined)).toBe(STRINGS.row.unknownPercent)
  expect(bar(undefined)).toBe('░'.repeat(BAR_CELLS))
  expect(bar(0)).toBe('░'.repeat(BAR_CELLS))
  expect(bar(31)).toBe(`${'█'.repeat(3)}${'░'.repeat(BAR_CELLS - 3)}`)
  expect(bar(100)).toBe('█'.repeat(BAR_CELLS))
  expect(bar(250)).toBe('█'.repeat(BAR_CELLS))
})

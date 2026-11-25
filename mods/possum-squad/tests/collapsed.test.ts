import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import type { StateId } from '../types/index'
import { STRINGS } from '../hooks/strings'
import { panel } from '../hooks/view/panel'
import type { RowData } from '../hooks/view/row'
import { engine, MOUNT, possums, SURFACES, store } from './engine'
import { SPAWN, TURN_START } from './fixtures/events'

type Surface = (typeof SURFACES)[number]

// The engine beneath the mod: its panes, a store holding the given prefs, a pinned clock, and the next agent id for
// each spawn.
function world(on: On, prefs: Record<string, unknown> = {}) {
  engine(on)
  const kept = store(on, { prefs })
  mock.clock(on, { now: 1_000 })
  let next = 0
  on('agent.spawn', async () => ({ model: 'claude-haiku-5-5', agentId: `agent-${++next}` }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  return kept
}

let spawned = 0
async function working($: Engine, count: number) {
  for (let at = 0; at < count; at++) {
    const { agentId } = await $.agent.spawn({ ...SPAWN, tool_use_id: `toolu_collapsed_${++spawned}`, description: `Water bed ${spawned}` })
    await $.turn.start({ ...TURN_START, agentId: agentId as string })
  }
}

const WIDGET = { ...MOUNT, props: { ...MOUNT.props, placement: 'widget' } } as const

async function drawn($: Engine, surface: Surface, mount: typeof MOUNT | typeof WIDGET = MOUNT) {
  const pane = await $.ui.mount({ ...mount, surface })
  const texts = (await pane.findAll({ type: 'Text' })).map(text => text.text)
  const buttons = (await pane.findAll({ type: 'Button' })).map(button => button.key)
  const svgs = (await pane.findAll({ type: 'Svg' })).map(svg => ({ source: String(svg.props.source), alt: svg.props.alt }))
  await pane.unmount()
  return { texts, buttons, svgs }
}

// The joey as the art draws it, and where the Lead carries the first, second and third.
const JOEY = ['KK...KK', 'KPGGGPK', 'WWWGWWW', 'WKWWWKW', '.WWPWW.', '.PP.PP.']
const SPOTS = [
  [23, 9],
  [23, 17],
  [25, 23],
] as const
const COLOURS: Record<string, string> = { K: '#26262e', P: '#f4a0b6', G: '#9a9ca6', W: '#f4f1eb' }

// The test's own reading of a still sprite: each pixel's fill, the light theme's outline left out.
function pixelsOf(source: string): Map<string, string> {
  const pixels = new Map<string, string>()
  const fills = source.replace(/<g class="o"[^>]*>.*?<\/g>/, '')
  for (const [, fill = '', d = ''] of fills.matchAll(/<path fill="([^"]+)" d="([^"]+)"/g)) {
    for (const [, x, y, w] of d.matchAll(/M(\d+) (\d+)h(\d+)v1h-\3/g)) {
      for (let at = 0; at < Number(w); at++) pixels.set(`${Number(x) + at} ${y}`, fill)
    }
  }
  return pixels
}

// How many of the spots carry the whole joey.
function joeysIn(source: string): number {
  const pixels = pixelsOf(source)
  return SPOTS.filter(([x, y]) => JOEY.every((row, dy) => [...row].every((key, dx) => key === '.' || pixels.get(`${x + dx} ${y + dy}`) === COLOURS[key])))
    .length
}

for (const surface of SURFACES) {
  test(`${surface}: four running agents give three joeys and the text "4", and no row is drawn (F-16)`, async ($, on) => {
    world(on, { collapsed: true })
    await working($, 4)
    const { texts, buttons, svgs } = await drawn($, surface)
    expect(texts).toContain('4')
    expect(texts).toContain(STRINGS.collapsed.running)
    expect(texts.some(text => text.startsWith('Water bed'))).toBe(false)
    expect(texts.some(text => text.includes('needs you'))).toBe(false)
    expect(buttons).toEqual(['expand'])
    if (surface === 'terminal') expect(svgs).toEqual([])
    else {
      expect(svgs.map(svg => svg.alt)).toEqual(['Lead, carrying 3 joeys'])
      expect(joeysIn(svgs[0]?.source ?? '')).toBe(3)
    }
  })

  test(`${surface}: the Lead carries a joey per running agent up to three, and the numeral counts every one`, async ($, on) => {
    world(on, { collapsed: true })
    const seen: { joeys: number; source?: string; texts: string[] }[] = []
    for (let count = 0; count <= 4; count++) {
      if (count > 0) await working($, 1)
      const { texts, svgs } = await drawn($, surface)
      seen.push({ joeys: joeysIn(svgs[0]?.source ?? ''), ...(svgs[0] === undefined ? {} : { source: svgs[0].source }), texts })
    }
    expect(seen.map(one => one.texts.includes(String(seen.indexOf(one))))).toEqual([true, true, true, true, true])
    if (surface === 'desktop') {
      expect(seen.map(one => one.joeys)).toEqual([0, 1, 2, 3, 3])
      expect(seen[4]?.source).toBe(seen[3]?.source)
      expect(seen[2]?.source).not.toBe(seen[3]?.source)
    }
  })

  test(`${surface}: a mount in the widget seat draws the collapsed view whatever the person chose, with no button`, async ($, on) => {
    world(on)
    await working($, 2)
    const full = await drawn($, surface)
    expect(full.texts.some(text => text.startsWith('Water bed'))).toBe(true)
    expect(full.buttons).toContain('collapse')

    const widget = await drawn($, surface, WIDGET)
    expect(widget.texts).toContain('2')
    expect(widget.texts.some(text => text.startsWith('Water bed'))).toBe(false)
    expect(widget.buttons).toEqual([])
    if (surface === 'desktop') expect(widget.svgs.map(svg => svg.alt)).toEqual(['Lead, carrying 2 joeys'])

    // The gallery the person asks for draws in the full pane, never in the glance.
    await $.command.run(possums('roles'))
    expect((await drawn($, surface, WIDGET)).texts).toContain('2')
    expect((await drawn($, surface)).texts.some(text => text.startsWith('Roles'))).toBe(true)
  })

  test(`${surface}: the header's collapse button keeps the person's choice in prefs alone, and expand brings the list back`, async ($, on) => {
    const kept = world(on, { theme: 'horror', future: 'kept' })
    await working($, 1)
    const pane = await $.ui.mount({ ...MOUNT, surface })
    await pane.press({ key: 'collapse' })
    expect(kept.writes).toEqual([{ key: 'prefs', value: { theme: 'horror', future: 'kept', collapsed: true } }])
    expect(await pane.find({ type: 'Button', key: 'expand' })).toBeDefined()
    expect(await pane.find({ type: 'Text', text: 'Water bed' })).toBeUndefined()
    await pane.press({ key: 'expand' })
    expect(kept.held.get('prefs')).toEqual({ theme: 'horror', future: 'kept', collapsed: false })
    expect(await pane.find({ type: 'Button', key: 'collapse' })).toBeDefined()
    await pane.unmount()
  })

  test(`${surface}: the gallery draws over a collapsed pane, whose header button then reads expand`, async ($, on) => {
    world(on, { collapsed: true })
    await working($, 1)
    await $.command.run(possums('roles'))
    const { texts, buttons } = await drawn($, surface)
    expect(texts.some(text => text.startsWith('Roles'))).toBe(true)
    expect(buttons[0]).toBe('collapse')
    const pane = await $.ui.mount({ ...MOUNT, surface })
    expect((await pane.find({ type: 'Button', key: 'collapse' }))?.props.label).toBe(STRINGS.expand)
    await pane.unmount()
  })
}

// The panel's own drawing, over fixture rows in the given states.
const LIST = 'collapsed-list'
const NO_ACTIONS = {
  onToggleFinished: () => {},
  onCloseGallery: () => {},
  onMoveGallery: () => {},
  onToggleRole: () => {},
  onPickRole: () => {},
  onCancelRole: () => {},
  onTogglePeek: () => {},
  onCollapse: () => {},
}
const rowsIn = (states: readonly StateId[]): RowData[] =>
  states.map((state, order) => ({ id: `row-${order}`, order, state, description: `Task ${order}`, tokens: 0, elapsedMs: 0 }))

for (const surface of SURFACES) {
  test(`${surface}: quiet and starting agents run, one needing the person is said apart, and ended ones are not counted`, async ($, on) => {
    const states: StateId[] = ['working', 'quiet', 'starting', 'needs-you', 'finished', 'failed', 'stopped']
    on('ui.render', { plugin: '*', requestId: LIST }, ($$, e) =>
      panel(
        $$.ui.resolve(e),
        e.surface === 'terminal',
        {
          lead: { tokens: 0 },
          session: { tokens: 0, workedMs: 0 },
          rows: rowsIn(states),
          isFinishedOpen: true,
          look: { set: 'classic', motion: 'auto' },
          isCollapsed: true,
        },
        NO_ACTIONS,
      ),
    )
    const pane = await $.ui.mount({ ...MOUNT, requestId: LIST, surface })
    const texts = (await pane.findAll({ type: 'Text' })).map(text => text.text)
    const mark = await pane.find({ type: 'Text', text: STRINGS.collapsed.needsYou(1) })
    await pane.unmount()
    expect(texts).toContain('3')
    expect(mark?.props.color).toBe('permission')
  })
}

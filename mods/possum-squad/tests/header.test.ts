import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { STRINGS } from '../hooks/strings'
import { elapsed, tokens } from '../hooks/view/format'
import { type PanelData, panel, type SectionId } from '../hooks/view/panel'
import { engine, MOUNT, possums, SURFACES, store } from './engine'
import { SPAWN, STEP, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START } from './fixtures/events'
import { ROWS } from './fixtures/rows'

type Surface = (typeof SURFACES)[number]

const LEAD = { tokens: 120_000, contextPercent: 31 }
const SESSION = { tokens: 254_000, workedMs: 252_000 }
const stateOf = (states: readonly string[]) => ROWS.filter(row => states.includes(row.state))
const ENDED = ['finished', 'failed', 'stopped']
const LOOK = { set: 'classic', motion: 'auto' } as const
const NO_ACTIONS = {
  onToggleFinished: () => {},
  onCloseGallery: () => {},
  onMoveGallery: () => {},
  onToggleRole: () => {},
  onPickRole: () => {},
  onCancelRole: () => {},
}

// The panels a fixture draws, by request id.
const PANELS: Record<string, PanelData> = {
  every: { lead: LEAD, session: SESSION, rows: ROWS, isFinishedOpen: false, look: LOOK },
  open: { lead: LEAD, session: SESSION, rows: ROWS, isFinishedOpen: true, look: LOOK },
  running: { lead: LEAD, session: SESSION, rows: stateOf(['starting', 'working', 'quiet']), isFinishedOpen: true, look: LOOK },
  ended: { lead: LEAD, session: SESSION, rows: stateOf(ENDED), isFinishedOpen: true, look: LOOK },
  none: { lead: { tokens: 0 }, session: { tokens: 0, workedMs: 0 }, rows: [], isFinishedOpen: false, look: LOOK },
}

// The test's own drawing of a fixture panel with the module's builder. `bare-<id>` draws the terminal with the kit's
// table stripped of `Svg`, which the kit's terminal answers with an empty Box: so a panel that drew one would fail.
function drawPanels(on: On) {
  on('ui.render', { plugin: '*' }, ($, e) => {
    const isBare = e.requestId.startsWith('bare-')
    const data = PANELS[isBare ? e.requestId.slice('bare-'.length) : e.requestId]
    if (data === undefined) throw new Error(`no fixture panel ${e.requestId}`)
    const table = $.ui.resolve(e)
    if (!isBare) return panel(table, e.surface === 'terminal', data, NO_ACTIONS)
    const { Svg: _, ...bare } = table as unknown as Record<string, unknown>
    return panel(bare as never, true, data, NO_ACTIONS)
  })
}

async function drawn($: Engine, surface: Surface, requestId: string = MOUNT.requestId) {
  const pane = await $.ui.mount({ ...MOUNT, requestId, surface })
  const elements = await pane.findAll({})
  const texts = (await pane.findAll({ type: 'Text' })).map(text => text.text)
  const button = await pane.find({ type: 'Button', key: 'finished' })
  await pane.unmount()
  return { elements, texts, button }
}

const NAMES = Object.values(STRINGS.sections)
const headingsOf = (texts: readonly string[]) => texts.filter(text => NAMES.some(name => text.startsWith(`${name} · `)))
const heading = (id: SectionId, count: number) => STRINGS.heading(STRINGS.sections[id], count)

test('the sections come in order with their counts, and an empty one other than Running is not drawn (F-04)', async ($, on) => {
  drawPanels(on)
  for (const surface of SURFACES) {
    expect(headingsOf((await drawn($, surface, 'every')).texts)).toEqual([heading('needs-you', 1), heading('running', 3), heading('finished', 3)])
    expect(headingsOf((await drawn($, surface, 'running')).texts)).toEqual([heading('running', 3)])
    expect(headingsOf((await drawn($, surface, 'ended')).texts)).toEqual([heading('running', 0), heading('finished', 3)])

    const none = (await drawn($, surface, 'none')).texts
    expect(headingsOf(none)).toEqual([])
    expect(none).toContain(STRINGS.empty)
  }
})

test('each row sits under its section, in spawn order; Finished stays collapsed until opened', async ($, on) => {
  drawPanels(on)
  const description = (state: string) => ROWS.find(row => row.state === state)?.description as string
  for (const surface of SURFACES) {
    const collapsed = await drawn($, surface, 'every')
    const at = (text: string) => collapsed.texts.indexOf(text)
    // Needs you's row, then Running's in spawn order: the needs-you row was spawned between working and quiet.
    expect(
      [heading('needs-you', 1), description('needs-you'), heading('running', 3), description('starting'), description('working'), description('quiet')].map(at),
    ).toEqual(
      [
        ...[
          heading('needs-you', 1),
          description('needs-you'),
          heading('running', 3),
          description('starting'),
          description('working'),
          description('quiet'),
        ].map(at),
      ].sort((a, b) => a - b),
    )
    expect(at(description('starting'))).toBeGreaterThan(at(heading('running', 3)))
    for (const state of ENDED) expect(collapsed.texts).not.toContain(description(state))
    expect(collapsed.button?.props.label).toBe(STRINGS.show)

    const open = await drawn($, surface, 'open')
    for (const state of ENDED) expect(open.texts.indexOf(description(state))).toBeGreaterThan(open.texts.indexOf(heading('finished', 3)))
    expect(open.button?.props.label).toBe(STRINGS.hide)
  }
})

test('the header is the Lead row, then the session line', async ($, on) => {
  drawPanels(on)
  for (const surface of SURFACES) {
    const { texts } = await drawn($, surface, 'every')
    expect(texts.indexOf(STRINGS.lead)).toBeLessThan(texts.indexOf(STRINGS.session('254k', '4:12')))
    expect(texts.indexOf(STRINGS.session('254k', '4:12'))).toBeLessThan(texts.indexOf(heading('needs-you', 1)))
    expect(texts.some(text => text.includes('31%') && text.includes('120k'))).toBe(true)
  }
})

test('the terminal draws every section and number as text, with no element it lacks (F-22)', async ($, on) => {
  drawPanels(on)
  for (const id of ['bare-every', 'bare-open', 'bare-none']) {
    const { elements } = await drawn($, 'terminal', id)
    expect([...new Set(elements.map(element => element.type))].filter(type => type !== 'Box' && type !== 'Text' && type !== 'Button')).toEqual([])
  }
  const { texts } = await drawn($, 'terminal', 'bare-open')
  // The Lead's bar in block characters, then a row's, then the section heads, all as text.
  expect(texts.some(text => text.startsWith('███'))).toBe(true)
  expect(headingsOf(texts)).toHaveLength(3)
})

// The engine beneath the mod for the tests that raise events: agent ids in turn, steps with this usage.
const STEP_USAGE = { input_tokens: 120, output_tokens: 30, cache_read_input_tokens: 40_000, cache_creation_input_tokens: 50, model: 'claude-haiku-5-5' }
function world(on: On) {
  const ids = ['agent-a', 'agent-b']
  const clock = mock.clock(on, { now: 1_000 })
  on('agent.spawn', () => ({ model: 'claude-sonnet-5-5', agentId: ids.shift() ?? 'agent-extra' }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    return { ...STEPPED, turnId: e.turnId, index: e.index, usage: STEP_USAGE }
  })
  return clock
}

async function drain(stream: AsyncGenerator<unknown, unknown>) {
  for (;;) if ((await stream.next()).done) return
}

test('with no agents the pane shows the Lead, its context unknown until a measure gives it (F-09)', async ($, on) => {
  world(on)
  for (const surface of SURFACES) {
    const before = (await drawn($, surface)).texts
    expect(before).toContain(STRINGS.lead)
    expect(before).toContain(STRINGS.empty)
    expect(before.some(text => text.includes(`${STRINGS.row.unknown} · 0`))).toBe(true)
  }
  await $.session.measure({ context: { tokens: 310_000, window: 1_000_000, percent: 31 }, rateLimits: [], changed: ['context'] })
  for (const surface of SURFACES) {
    const after = (await drawn($, surface)).texts
    expect(after).toContain(STRINGS.lead)
    expect(after.some(text => text.includes('31%'))).toBe(true)
  }
})

test('the header totals the Lead and every run, in tokens and in time (F-03)', async ($, on) => {
  const clock = world(on)
  // A working run with two steps: 400 fresh tokens, from 1,000.
  await $.agent.spawn(SPAWN)
  await $.turn.start({ ...TURN_START, agentId: 'agent-a' })
  await drain($.turn.step({ ...STEP, agentId: 'agent-a', index: 0 }))
  await drain($.turn.step({ ...STEP, agentId: 'agent-a', index: 1 }))
  // A run that ends at 3,000 after one step: 200 fresh tokens, 2 s.
  await $.agent.spawn({ ...SPAWN, tool_use_id: 'toolu_b', description: 'Weigh the pumpkins' })
  await drain($.turn.step({ ...STEP, agentId: 'agent-b', index: 0 }))
  await clock.set(3_000)
  await $.turn.complete({ ...TURN_COMPLETE, agentId: 'agent-b' })
  // A main turn of 4.2 s: 1,000 in, 300 written to the cache, 200 out; its cache reads are not fresh.
  const { agentId: _, ...main } = TURN_COMPLETE
  await $.turn.complete({
    ...main,
    durationMs: 4_200,
    usage: { ...TURN_COMPLETE.usage, input_tokens: 1_000, cache_creation_input_tokens: 300, output_tokens: 200 },
  })
  await clock.set(10_000)
  for (const surface of SURFACES) {
    const { texts } = await drawn($, surface)
    // The Lead's own figure, unmeasured: its context unknown, its fresh tokens.
    expect(texts.some(text => text.endsWith(`${STRINGS.row.unknown} · ${tokens(1_500)}`))).toBe(true)
    expect(texts).toContain(STRINGS.session(tokens(1_500 + 400 + 200), elapsed(4_200 + 9_000 + 2_000)))
  }
})

test("Finished's show button opens the section, remembers it, and a second press closes it", async ($, on) => {
  world(on)
  const kept = store(on)
  await $.agent.spawn(SPAWN)
  await $.turn.complete({ ...TURN_COMPLETE, agentId: 'agent-a' })
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, surface })
    const texts = async () => (await pane.findAll({ type: 'Text' })).map(text => text.text)
    const label = async () => (await pane.find({ type: 'Button' }))?.props.label

    expect(await label()).toBe(STRINGS.show)
    expect(await texts()).not.toContain(SPAWN.description)

    await pane.press({ key: 'finished' })
    expect(kept.held.get('prefs')).toEqual({ finishedOpen: true })
    expect(await label()).toBe(STRINGS.hide)
    expect(await texts()).toContain(SPAWN.description)

    await pane.press({ key: 'finished' })
    expect(kept.held.get('prefs')).toEqual({ finishedOpen: false })
    expect(await label()).toBe(STRINGS.show)
    expect(await texts()).not.toContain(SPAWN.description)
    await pane.unmount()
  }
})

test('a setting changed with /possums set redraws the pane at once', async ($, on) => {
  engine(on)
  store(on)
  let redraws = 0
  on('ui.invalidate', (_, e, next) => {
    redraws++
    return next(e)
  })
  await $.command.run(possums('set theme horror'))
  expect(redraws).toBe(1)
  await $.command.run(possums('set theme neon'))
  expect(redraws).toBe(1)
})

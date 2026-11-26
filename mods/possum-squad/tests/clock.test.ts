import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { PANE } from '../hooks/register'
import { STRINGS } from '../hooks/strings'
import { elapsed, tokens } from '../hooks/view/format'
import { engine, MOUNT, POSSUMS, possums, SURFACES, turnEnds } from './engine'
import { MAIN_COMPLETE, MAIN_START, SESSION_START, SPAWN, STEP, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START } from './fixtures/events'

// Another plugin, beside the mod, counting the periods the mod's timers ask for (one ahead of the beats run, while
// armed) and its looks at the panes, which each beat makes before anything else.
const PERIODS = {
  name: 'period-counter',
  register: (on: On) => {
    let asked = 0
    let looks = 0
    on('clock.every', (_, e, next) => {
      asked++
      return next(e)
    })
    on('ui.panes', (_, e, next) => {
      looks++
      return next(e)
    })
    on('command.run', { command: 'periods' }, async () => ({ text: String(asked) }))
    on('command.run', { command: 'looks' }, async () => ({ text: String(looks) }))
  },
}

// The same, refusing the second period it sees, which ends that timer without a word to the mod.
const ENDS_ONE = {
  name: 'period-refuser',
  register: (on: On) => {
    let asked = 0
    on('clock.every', (_, e, next) => {
      asked++
      return asked === 2 ? { deny: 'the fixture refuses one period' } : next(e)
    })
  },
}

const periods = async ($: Engine) => Number((await $.command.run({ ...POSSUMS, command: 'periods' })).text)
const looks = async ($: Engine) => Number((await $.command.run({ ...POSSUMS, command: 'looks' })).text)

// The engine beneath the mod: its panes, a pinned clock, agent ids in turn, and the redraws asked for.
function world(on: On) {
  const seen = engine(on)
  const clock = mock.clock(on, { now: 1_000 })
  let next = 0
  on('agent.spawn', () => ({ model: 'claude-sonnet-5-5', agentId: `agent-${++next}` }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('classic.SessionStart', () => ({}))
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    return { ...STEPPED, turnId: e.turnId, index: e.index }
  })
  let redraws = 0
  on('ui.invalidate', (_, e, next) => {
    redraws++
    return next(e)
  })
  return { seen, clock, redraws: () => redraws }
}

// A run spawned and working: agent-<n>, in spawn order.
async function working($: Engine, n: number) {
  await $.agent.spawn({ ...SPAWN, tool_use_id: `toolu_${n}`, description: `Task ${n}` })
  await $.turn.start({ ...TURN_START, agentId: `agent-${n}` })
}

const textsOf = async (pane: { findAll: (query: { type: 'Text' }) => Promise<{ text?: string }[]> }) =>
  (await pane.findAll({ type: 'Text' })).map(text => text.text)

test("a working row's time moves once a second while the pane shows, with no event (F-02)", async ($, on) => {
  const { clock } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  const panes = await Promise.all(SURFACES.map(surface => $.ui.mount({ ...MOUNT, surface })))
  await clock.advance(3_000)
  for (const pane of panes) {
    const texts = await textsOf(pane)
    expect(texts.some(text => text?.endsWith(` · ${elapsed(3_000)}`) && text.includes(STRINGS.row.unknown))).toBe(true)
    expect(texts).toContain(STRINGS.session(tokens(0), elapsed(3_000)))
    await pane.unmount()
  }
})

test('no timer while the pane is closed, though a run works (N-03)', { plugins: [PERIODS] }, async ($, on) => {
  const { clock, redraws } = world(on)
  await working($, 1)
  await clock.advance(5_000)
  expect(await periods($)).toBe(0)
  expect(redraws()).toBe(0)
})

test('no timer while the pane is open and nothing runs, or only ended runs (N-03)', { plugins: [PERIODS] }, async ($, on) => {
  const { clock, redraws } = world(on)
  await $.command.run(POSSUMS)
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  await clock.advance(5_000)
  await $.agent.spawn(SPAWN)
  await turnEnds($, { ...TURN_COMPLETE, agentId: 'agent-1' })
  await clock.advance(5_000)
  expect(await periods($)).toBeLessThanOrEqual(1)
  expect(redraws()).toBe(0)
  await pane.unmount()
})

test('the clock stops at once when the last run ends and when the pane closes (N-03)', { plugins: [PERIODS] }, async ($, on) => {
  const { clock, redraws } = world(on)
  const stops = [async () => turnEnds($, { ...TURN_COMPLETE, agentId: 'agent-1' }), async () => $.command.run(POSSUMS)]
  for (const [i, stop] of stops.entries()) {
    await $.command.run(possums('open'))
    await working($, i + 1)
    const pane = await $.ui.mount({ ...MOUNT, surface: 'terminal' })
    const ticking = redraws()
    await clock.advance(2_000)
    expect(redraws()).toBeGreaterThan(ticking)
    await stop()
    // A state write's redraw lands at the redraw rate, while the pane is still drawn.
    await clock.advance(100)
    await pane.unmount()
    // Stopped at once: no beat comes to look at the pane.
    const asked = await periods($)
    const looked = await looks($)
    const drawn = redraws()
    await clock.advance(5_000)
    expect(await periods($)).toBe(asked)
    expect(await looks($)).toBe(looked)
    expect(redraws()).toBe(drawn)
  }
})

// No pane is drawn here, so no redraw stops the clock: only the clear itself does.
test('a clear stops the clock at once (N-03)', { plugins: [PERIODS] }, async ($, on) => {
  const { clock } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  await clock.advance(2_000)
  expect(await looks($)).toBeGreaterThan(1)
  await $.classic.SessionStart({ source: 'clear' })
  const asked = await periods($)
  const looked = await looks($)
  await clock.advance(5_000)
  expect(await periods($)).toBe(asked)
  expect(await looks($)).toBe(looked)
})

test('after a session start with a run live and the pane closed, one beat finds it closed and stops (N-03)', { plugins: [PERIODS] }, async ($, on) => {
  const { clock, redraws } = world(on)
  await working($, 1)
  await $.session.start(SESSION_START)
  await clock.advance(1_000)
  const asked = await periods($)
  expect(asked).toBeLessThanOrEqual(2)
  await clock.advance(5_000)
  expect(await periods($)).toBe(asked)
  expect(redraws()).toBe(0)
})

test('three working runs redraw the pane once a second, their arrivals and an ending asking for no redraw of their own (N-04)', async ($, on) => {
  const { clock, redraws } = world(on)
  await $.command.run(POSSUMS)
  for (const n of [1, 2, 3]) await working($, n)
  const before = redraws()
  await clock.advance(3_000)
  expect(redraws() - before).toBe(3)
  // A fourth arrives and the first ends: the arrival and the cheer play inside their sprites.
  await working($, 4)
  await turnEnds($, { ...TURN_COMPLETE, agentId: 'agent-1' })
  const after = redraws()
  await clock.advance(3_000)
  expect(redraws() - after).toBe(3)
})

test('two session starts with a run live arm one timer, not two', { plugins: [PERIODS] }, async ($, on) => {
  const { seen, clock, redraws } = world(on)
  await working($, 1)
  seen.panes = [{ id: PANE, isShown: true, isPlaced: true }]
  await $.session.start(SESSION_START)
  await $.session.start(SESSION_START)
  await clock.advance(3_000)
  expect(redraws()).toBe(3)
  // One timer's three beats ask for four periods; a second timer would ask for as many again.
  expect(await periods($)).toBe(4)
})

test('a pane open behind another keeps its clock without redrawing, and is right the moment it shows', { plugins: [PERIODS] }, async ($, on) => {
  const { seen, clock, redraws } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  seen.panes = [{ id: PANE, isShown: false, isPlaced: true }]
  const asked = await periods($)
  await clock.advance(3_000)
  expect(redraws()).toBe(0)
  expect(await periods($)).toBe(asked + 3)

  seen.panes = [{ id: PANE, isShown: true, isPlaced: true }]
  await clock.advance(1_000)
  expect(redraws()).toBe(1)
  expect((await textsOf(pane)).some(text => text?.endsWith(` · ${elapsed(4_000)}`))).toBe(true)
  await pane.unmount()
})

test('a timer the engine ends is replaced at a later event', { plugins: [ENDS_ONE] }, async ($, on) => {
  const { clock, redraws } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  await clock.advance(1_000)
  expect(redraws()).toBe(1)
  // Its second period was refused: no beat for three seconds.
  await clock.advance(3_000)
  expect(redraws()).toBe(1)

  // A step redraws the pane, which finds the timer gone; the next step, a moment later, starts another.
  for (const index of [0, 1]) {
    const step = $.turn.step({ ...STEP, agentId: 'agent-1', index })
    for (;;) if ((await step.next()).done) break
    await clock.advance(100)
  }
  await clock.advance(2_000)
  expect(redraws()).toBe(3)
  expect((await textsOf(pane)).some(text => text?.endsWith(` · ${elapsed(6_200)}`))).toBe(true)
  await pane.unmount()
})

test('opening the pane while a run works starts the clock', async ($, on) => {
  const { clock, redraws } = world(on)
  await working($, 1)
  await clock.advance(2_000)
  expect(redraws()).toBe(0)
  await $.command.run(POSSUMS)
  await clock.advance(2_000)
  expect(redraws()).toBe(2)
})

test('/possums open on a shown pane starts a fresh clock, after the engine ended the last', { plugins: [ENDS_ONE] }, async ($, on) => {
  const { clock, redraws } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  await clock.advance(1_000)
  await clock.advance(3_000)
  expect(redraws()).toBe(1)
  await $.command.run(possums('open'))
  await clock.advance(2_000)
  expect(redraws()).toBe(3)
})

test('a beat that finds the pane open behind another lets later runs start the clock', async ($, on) => {
  const { seen, clock, redraws } = world(on)
  await working($, 1)
  // After a reload: the pane open but hidden, so nothing draws it; the session start arms for the live run.
  seen.panes = [{ id: PANE, isShown: false, isPlaced: true }]
  await $.session.start(SESSION_START)
  await clock.advance(1_000)
  await turnEnds($, { ...TURN_COMPLETE, agentId: 'agent-1' })
  await clock.advance(1_000)
  await working($, 2)
  seen.panes = [{ id: PANE, isShown: true, isPlaced: true }]
  await clock.advance(2_000)
  expect(redraws()).toBe(2)
})

// The main session's turn alone, with no agent: its start is timed, so the session line moves on the beat.
test(
  "a main turn's time moves once a second while the pane shows, with no event and no list read, and stands on its counted time at its end",
  { plugins: [PERIODS] },
  async ($, on) => {
    const { clock } = world(on)
    let reads = 0
    on('agent.list', () => {
      reads++
      return { value: [] } as never
    })
    await $.command.run(POSSUMS)
    const panes = await Promise.all(SURFACES.map(surface => $.ui.mount({ ...MOUNT, surface })))
    await $.turn.start(MAIN_START)
    for (const second of [1, 2, 3]) {
      await clock.advance(1_000)
      for (const pane of panes) expect(await textsOf(pane)).toContain(STRINGS.session(tokens(0), elapsed(second * 1_000)))
    }
    // The engine's length, longer than the clock's span of 3.5 s, replaces the running time; the clock stops.
    await clock.advance(500)
    await turnEnds($, { ...MAIN_COMPLETE, durationMs: 4_200 })
    await clock.advance(100)
    const asked = await periods($)
    const looked = await looks($)
    await clock.advance(5_000)
    for (const pane of panes) {
      expect(await textsOf(pane)).toContain(STRINGS.session(tokens(150), elapsed(4_200)))
      await pane.unmount()
    }
    expect([await periods($), await looks($), reads]).toEqual([asked, looked, 0])
  },
)

test("a main turn's end never steps the time back: an engine length shorter than the clock's span keeps the span", async ($, on) => {
  const { clock } = world(on)
  await $.command.run(POSSUMS)
  const panes = await Promise.all(SURFACES.map(surface => $.ui.mount({ ...MOUNT, surface })))
  await $.turn.start(MAIN_START)
  await clock.advance(3_500)
  for (const pane of panes) expect(await textsOf(pane)).toContain(STRINGS.session(tokens(0), elapsed(3_500)))
  await turnEnds($, { ...MAIN_COMPLETE, durationMs: 2_000 })
  await clock.advance(100)
  for (const pane of panes) {
    expect(await textsOf(pane)).toContain(STRINGS.session(tokens(150), elapsed(3_500)))
    await pane.unmount()
  }
})

test('no timer while the pane is closed, though a main turn runs (N-03)', { plugins: [PERIODS] }, async ($, on) => {
  const { clock, redraws } = world(on)
  await $.turn.start(MAIN_START)
  await clock.advance(5_000)
  expect(await periods($)).toBe(0)
  expect(redraws()).toBe(0)
})

test("opening the pane during a main turn starts the clock, the time counted from the turn's start", async ($, on) => {
  const { clock, redraws } = world(on)
  await $.turn.start(MAIN_START)
  await clock.advance(2_000)
  await $.command.run(POSSUMS)
  await clock.advance(2_000)
  expect(redraws()).toBe(2)
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, surface })
    expect(await textsOf(pane)).toContain(STRINGS.session(tokens(0), elapsed(4_000)))
    await pane.unmount()
  }
})

test('a clear during a main turn starts the time over: it reads 0:00 and stands until the next turn', { plugins: [PERIODS] }, async ($, on) => {
  const { clock } = world(on)
  await $.command.run(POSSUMS)
  const panes = await Promise.all(SURFACES.map(surface => $.ui.mount({ ...MOUNT, surface })))
  await $.turn.start(MAIN_START)
  await clock.advance(3_000)
  for (const pane of panes) expect(await textsOf(pane)).toContain(STRINGS.session(tokens(0), elapsed(3_000)))
  await $.classic.SessionStart({ source: 'clear' })
  await clock.advance(100)
  const asked = await periods($)
  await clock.advance(3_000)
  for (const pane of panes) expect(await textsOf(pane)).toContain(STRINGS.session(tokens(0), elapsed(0)))
  expect(await periods($)).toBe(asked)
  // The next main turn moves from zero.
  await $.turn.start({ ...MAIN_START, turnId: 'turn-main-2' })
  await clock.advance(2_000)
  for (const pane of panes) {
    expect(await textsOf(pane)).toContain(STRINGS.session(tokens(0), elapsed(2_000)))
    await pane.unmount()
  }
})

import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { DESCRIPTION_CHARS, QUIET_AFTER_MS, TOAST_AFTER_MS } from '../hooks/config'
import { PANE } from '../hooks/register'
import { STRINGS } from '../hooks/strings'
import { engine, MOUNT, POSSUMS, possums, SURFACES, store } from './engine'
import { PERMISSION_FROM_AGENT, PERMITTED, SPAWN, STEP, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START, WAITING } from './fixtures/events'

type Surface = (typeof SURFACES)[number]
type Use = { name: string; input: unknown }

const PING: Use = { name: 'Bash', input: { command: 'ping -c 5 127.0.0.1' } }
const usage = { input_tokens: 120, output_tokens: 30, cache_read_input_tokens: 4000, cache_creation_input_tokens: 0, model: 'claude-haiku-5-5' }

// The engine beneath the mod: its panes, a store that opens no pane by itself and keeps Finished open, a pinned clock,
// agent ids in turn, the toasts shown, a held spawn while the test says so, the answer a permission request gets, and
// each step asking for the calls the test names. A subagent's asked call finds nobody to answer it in a test, so the
// kit refuses it.
function world(on: On) {
  const seen = engine(on)
  store(on, { prefs: { autoOpen: 'never', finishedOpen: true } })
  const clock = mock.clock(on, { now: 1_000 })
  const toasts: string[] = []
  const given = {
    answer: WAITING as object,
    calls: [] as Use[],
    hold: undefined as Promise<void> | undefined,
    streaming: undefined as Promise<void> | undefined,
  }
  let next = 0
  on('agent.spawn', async () => {
    if (given.hold !== undefined) await given.hold
    return { model: 'claude-haiku-5-5', agentId: `agent-${++next}` }
  })
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('classic.PermissionRequest', () => given.answer)
  on('tool.check', () => ({ decision: 'ask', reason: 'the fixture asks' }) as never)
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    if (given.streaming !== undefined) await given.streaming
    return { ...STEPPED, turnId: e.turnId, index: e.index, usage, toolUses: given.calls }
  })
  return { seen, clock, toasts, given }
}

async function drain(stream: AsyncGenerator<unknown, unknown>) {
  for (;;) if ((await stream.next()).done) return
}

// A run spawned and working, agent-<n> in spawn order.
async function working($: Engine, n: number, description = `Count the shovels ${n}`) {
  await $.agent.spawn({ ...SPAWN, tool_use_id: `toolu_${n}`, description })
  await $.turn.start({ ...TURN_START, agentId: `agent-${n}` })
}
const step = ($: Engine, n: number) => drain($.turn.step({ ...STEP, agentId: `agent-${n}` }))
const request = ($: Engine, n: number) => $.classic.PermissionRequest({ ...PERMISSION_FROM_AGENT, agent_id: `agent-${n}` } as never)
const complete = ($: Engine, n: number, reason = 'answer', answer: string = TURN_COMPLETE.answer) =>
  $.turn.complete({ ...TURN_COMPLETE, reason, answer, isAborted: reason === 'aborted', agentId: `agent-${n}` } as never)

// A toast is not awaited by the event that raised it, so each test lets it settle before it looks.
const settled = async () => {
  for (let i = 0; i < 100; i++) await Promise.resolve()
}

async function drawn($: Engine, surface: Surface) {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  const texts = (await pane.findAll({ type: 'Text' })).map(text => text.text)
  const alts = (await pane.findAll({ type: 'Svg' })).map(svg => (svg.props as { alt: string }).alt)
  await pane.unmount()
  return { texts, alts }
}

// Past a new row's arrival, whose sprite names `starting` while it plays.
const ARRIVED = 3_000

const heading = (section: keyof typeof STRINGS.sections, count: number) => STRINGS.heading(STRINGS.sections[section], count)
const scout = (state: 'working' | 'needs-you' | 'quiet' | 'starting') => STRINGS.sprite.alt(STRINGS.roles.scout, STRINGS.states[state])

// Where the row is drawn and as what, on both surfaces: its section, its word, its sprite where one is drawn.
async function expectRow($: Engine, section: 'needs-you' | 'running', state: 'working' | 'needs-you' | 'quiet' | 'starting', line?: string) {
  for (const surface of SURFACES) {
    const { texts, alts } = await drawn($, surface)
    expect(texts).toContain(heading(section, 1))
    expect(texts).toContain(STRINGS.states[state])
    if (section === 'running') expect(texts).not.toContain(heading('needs-you', 1))
    if (line !== undefined) expect(texts).toContain(line)
    if (surface === 'desktop') expect(alts).toContain(scout(state))
  }
}

test("a subagent's call waiting on the person moves its row to Needs you, and back at its next step, refused or allowed (F-12)", async ($, on) => {
  const { clock, given } = world(on)
  await working($, 1)
  await clock.advance(ARRIVED)
  given.calls = [PING]
  await step($, 1)
  // The engine raises the request from the call itself; nobody answers it in a test, so the kit refuses it.
  await $.tool.call({ tool: 'Bash', command: 'ping -c 5 127.0.0.1', agentId: 'agent-1' } as never)
  await expectRow($, 'needs-you', 'needs-you', 'Running ping -c 5 127.0.0.1')
  // The refusal reaches the model in its next request: the row works again.
  given.calls = []
  await step($, 1)
  await expectRow($, 'running', 'working')
  // The engine's answer is empty while the person's prompt waits; their yes shows only as the call moving on.
  given.calls = [PING]
  await step($, 1)
  expect(await request($, 1)).toEqual(WAITING)
  await expectRow($, 'needs-you', 'needs-you')
  await step($, 1)
  await expectRow($, 'running', 'working')
  // A request, then the turn's end: the row ends as its turn did.
  await request($, 1)
  await complete($, 1)
  for (const surface of SURFACES) {
    const { texts } = await drawn($, surface)
    expect(texts).toContain(heading('finished', 1))
    expect(texts).not.toContain(heading('needs-you', 1))
  }
})

// As the terminal showed (CLI 2.1.330): the engine checks a call while the step that asked it still streams, so that
// step's record comes after the request.
test('the step that asked the call, ending after the request, leaves the row in Needs you; the next one moves it on (F-12)', async ($, on) => {
  const { clock, given } = world(on)
  await working($, 1)
  await clock.advance(ARRIVED)
  let release = () => {}
  given.streaming = new Promise<void>(resolve => {
    release = resolve
  })
  given.calls = [PING]
  const asking = step($, 1)
  await settled()
  await clock.advance(500)
  await request($, 1)
  release()
  await asking
  given.streaming = undefined
  await expectRow($, 'needs-you', 'needs-you', 'Running ping -c 5 127.0.0.1')
  await clock.advance(5_000)
  given.calls = []
  await step($, 1)
  await expectRow($, 'running', 'working')
})

test('a second call asked while the next step still streams keeps the row in Needs you, with one toast (F-12, F-14)', async ($, on) => {
  const { clock, given, toasts } = world(on)
  await working($, 1)
  await clock.advance(ARRIVED)
  // The first asking step: the request comes while it streams.
  let release = () => {}
  given.streaming = new Promise<void>(resolve => {
    release = resolve
  })
  given.calls = [PING]
  const first = step($, 1)
  await settled()
  await clock.advance(500)
  await request($, 1)
  release()
  await first
  // The person allows it; the next step begins after, and asks again before its record.
  await clock.advance(5_000)
  given.streaming = new Promise<void>(resolve => {
    release = resolve
  })
  const second = step($, 1)
  await settled()
  await clock.advance(500)
  await request($, 1)
  release()
  await second
  given.streaming = undefined
  await settled()
  await expectRow($, 'needs-you', 'needs-you')
  expect(toasts).toEqual(['Count the shovels 1 · needs you: waiting on a permission prompt'])
  await clock.advance(5_000)
  given.calls = []
  await step($, 1)
  await expectRow($, 'running', 'working')
})

test("a request another hook answered, the main session's, or one for an ended or unknown agent moves no row", async ($, on) => {
  const { clock, given, toasts } = world(on)
  await working($, 1)
  await clock.advance(ARRIVED)
  given.answer = PERMITTED
  expect(await request($, 1)).toEqual(PERMITTED)
  given.answer = WAITING
  const { agent_id: _, ...mains } = PERMISSION_FROM_AGENT
  await $.classic.PermissionRequest(mains as never)
  await request($, 7)
  await expectRow($, 'running', 'working')
  await complete($, 1)
  await request($, 1)
  await settled()
  for (const surface of SURFACES) expect((await drawn($, surface)).texts).not.toContain(heading('needs-you', 1))
  expect(toasts).toEqual([])
})

test("a request before the spawn's result is kept for the row that claims it", async ($, on) => {
  const { clock, given, toasts } = world(on)
  let release = () => {}
  given.hold = new Promise<void>(resolve => {
    release = resolve
  })
  const spawned = $.agent.spawn({ ...SPAWN, tool_use_id: 'toolu_1' })
  await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
  await request($, 1)
  await settled()
  // No row names the agent yet, so its toast cannot say which.
  expect(toasts).toEqual([STRINGS.toasts.needsYou(STRINGS.toasts.someone)])
  release()
  await spawned
  await clock.advance(ARRIVED)
  await expectRow($, 'needs-you', 'needs-you')
})

test('a live row with no call in flight is quiet after T-05, and an event wakes it (F-15)', async ($, on) => {
  const { clock } = world(on)
  await working($, 1)
  await step($, 1)
  await clock.advance(QUIET_AFTER_MS - 1)
  await expectRow($, 'running', 'working')
  await clock.advance(1)
  await expectRow($, 'running', 'quiet', STRINGS.row.quietFor(1))
  await clock.advance(60_000)
  await expectRow($, 'running', 'quiet', STRINGS.row.quietFor(2))
  await step($, 1)
  await expectRow($, 'running', 'working')
})

test('a row whose call is in flight, or that needs the person, is never quiet (F-15)', async ($, on) => {
  const { clock, given } = world(on)
  await working($, 1)
  given.calls = [PING]
  await step($, 1)
  await clock.advance(10 * QUIET_AFTER_MS)
  await expectRow($, 'running', 'working', 'Running ping -c 5 127.0.0.1')
  await request($, 1)
  await clock.advance(10 * QUIET_AFTER_MS)
  await expectRow($, 'needs-you', 'needs-you')
})

test('a spawn with no event after it goes quiet as it starts (F-15)', async ($, on) => {
  const { clock } = world(on)
  await $.agent.spawn({ ...SPAWN, tool_use_id: 'toolu_1' })
  await clock.advance(QUIET_AFTER_MS - 1)
  await expectRow($, 'running', 'starting')
  await clock.advance(1)
  await expectRow($, 'running', 'quiet', STRINGS.row.quietFor(1))
})

test('with the pane closed, one toast when a run needs the person and one when a long run ends (F-14)', async ($, on) => {
  const { clock, toasts } = world(on)
  await working($, 1)
  await request($, 1)
  // Still waiting: the second ask adds none.
  await request($, 1)
  await settled()
  expect(toasts).toEqual(['Count the shovels 1 · needs you: waiting on a permission prompt'])
  await step($, 1)
  await clock.advance(TOAST_AFTER_MS + 1_000)
  await complete($, 1)
  await settled()
  expect(toasts.slice(1)).toEqual(['Count the shovels 1 · finished after 1:01'])
  // A run of half T-10 ends with no toast, nor does T-10 itself; a long run that fails or is stopped says so.
  await working($, 2)
  await clock.advance(TOAST_AFTER_MS / 2)
  await complete($, 2)
  await working($, 3)
  await clock.advance(TOAST_AFTER_MS)
  await complete($, 3)
  await working($, 4)
  await working($, 5)
  await clock.advance(TOAST_AFTER_MS + 5_000)
  await complete($, 4, 'error', '')
  await complete($, 5, 'aborted', '')
  // A run that has ended already ends no more.
  await complete($, 5, 'aborted', '')
  await settled()
  expect(toasts.slice(2)).toEqual(['Count the shovels 4 · failed after 1:05', 'Count the shovels 5 · stopped after 1:05'])
})

test("a teammate's later turn is timed on its own: a short one ends with no toast (F-14)", async ($, on) => {
  const { clock, toasts } = world(on)
  await $.agent.spawn({ ...SPAWN, tool_use_id: 'toolu_1', description: 'Mind the shed', isTeammate: true } as never)
  await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
  await clock.advance(TOAST_AFTER_MS + 1_000)
  await complete($, 1, 'answer', '')
  await clock.advance(2 * TOAST_AFTER_MS)
  await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
  await clock.advance(5_000)
  await complete($, 1, 'answer', '')
  await settled()
  expect(toasts).toEqual(['Mind the shed · finished after 1:01'])
})

test('a toast names its run by its description cut as on its row', async ($, on) => {
  const { toasts } = world(on)
  const long = 'Sweep '.repeat(40).trim()
  await working($, 1, long)
  await request($, 1)
  await settled()
  expect(toasts).toEqual([STRINGS.toasts.needsYou(`${Array.from(long).slice(0, DESCRIPTION_CHARS).join('')}${STRINGS.cut}`)])
})

test('with the pane shown there is no toast; with it behind another tab there is (F-14)', async ($, on) => {
  const { clock, seen, toasts } = world(on)
  await $.command.run(POSSUMS)
  expect(seen.panes).toEqual([{ id: PANE, isShown: true, isPlaced: true }])
  await working($, 1)
  await request($, 1)
  await step($, 1)
  await clock.advance(TOAST_AFTER_MS + 1_000)
  await complete($, 1)
  await settled()
  expect(toasts).toEqual([])
  seen.panes = [{ id: PANE, isShown: false, isPlaced: true }]
  await working($, 2)
  await request($, 2)
  await clock.advance(TOAST_AFTER_MS + 1_000)
  await complete($, 2)
  await settled()
  expect(toasts).toEqual(['Count the shovels 2 · needs you: waiting on a permission prompt', 'Count the shovels 2 · finished after 1:01'])
})

test('with the gallery shown in the pane, the list is out of view, so there are toasts (F-14)', async ($, on) => {
  const { seen, toasts } = world(on)
  await $.command.run(possums('roles'))
  expect(seen.panes).toEqual([{ id: PANE, isShown: true, isPlaced: true }])
  await working($, 1)
  await request($, 1)
  await settled()
  expect(toasts).toEqual(['Count the shovels 1 · needs you: waiting on a permission prompt'])
})

// Another plugin, beside the mod, counting the periods the mod's timers ask for.
const PERIODS = {
  name: 'period-counter',
  register: (on: On) => {
    let asked = 0
    on('clock.every', (_, e, next) => {
      asked++
      return next(e)
    })
    on('command.run', { command: 'periods' }, async () => ({ text: String(asked) }))
  },
}

test('toasts while the pane is closed arm no timer (N-03)', { plugins: [PERIODS] }, async ($, on) => {
  const { clock, toasts } = world(on)
  await working($, 1)
  await request($, 1)
  await step($, 1)
  await clock.advance(TOAST_AFTER_MS + 1_000)
  await complete($, 1)
  await settled()
  expect(toasts).toHaveLength(2)
  expect((await $.command.run({ ...POSSUMS, command: 'periods' })).text).toBe('0')
})

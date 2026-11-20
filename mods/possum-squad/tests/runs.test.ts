import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { STRINGS } from '../hooks/strings'
import { MOUNT, SURFACES } from './engine'
import { SPAWN, STEP, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START } from './fixtures/events'

type Surface = (typeof SURFACES)[number]
const AGENT = 'agent-fixture-1'
const usage = { input_tokens: 120, output_tokens: 30, cache_read_input_tokens: 40_000, cache_creation_input_tokens: 50, model: 'claude-haiku-5-5' }

// The engine beneath the mod: each spawn gets the next agent id, unless the test holds or refuses it.
function world(on: On, options: { ids?: string[]; hold?: Promise<void>; refuse?: boolean } = {}) {
  const ids = [...(options.ids ?? [AGENT])]
  const clock = mock.clock(on, { now: 1_000 })
  on('agent.spawn', async () => {
    if (options.hold !== undefined) await options.hold
    if (options.refuse === true) return { deny: 'the fixture refuses the spawn' }
    return { model: 'claude-sonnet-5-5', agentId: ids.shift() ?? 'agent-extra' }
  })
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('classic.SessionStart', () => ({}))
  return clock
}

// A model request whose response asked for the given tool calls.
function steps(on: On, toolUses: { name: string; input: unknown }[] = []) {
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    return { ...STEPPED, turnId: e.turnId, index: e.index, usage, toolUses }
  })
}

async function drain(stream: AsyncGenerator<unknown, unknown>) {
  for (;;) if ((await stream.next()).done) return
}

const step = ($: Engine, agentId = AGENT, index = 0) => drain($.turn.step({ ...STEP, agentId, index }))
const start = ($: Engine, agentId = AGENT) => $.turn.start({ ...TURN_START, agentId })
// A subagent's turn ending; the endings the test names are wider than the fixture's own.
type Ending = { reason: string; answer: string; refusal?: { category: null; explanation: null } }
const complete = ($: Engine, ending: Ending, agentId = AGENT) =>
  $.turn.complete({ ...TURN_COMPLETE, isAborted: ending.reason === 'aborted', ...ending, agentId } as never)

async function drawn($: Engine, surface: Surface) {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  const elements = await pane.findAll({})
  const texts = (await pane.findAll({ type: 'Text' })).map(text => text.text)
  await pane.unmount()
  return { elements, texts }
}

test("a spawn's row shows at once, before its result names the agent (F-01)", async ($, on) => {
  let release = () => {}
  const clock = world(on, { hold: new Promise<void>(resolve => (release = resolve)) })
  const spawning = $.agent.spawn(SPAWN)
  await clock.settle()
  for (const surface of SURFACES) {
    const { texts } = await drawn($, surface)
    expect(texts).toContain(SPAWN.description)
    expect(texts).toContain(STRINGS.states.starting)
  }
  release()
  await spawning
})

test("a loop's turn and steps before the spawn's result join its row at the re-key", async ($, on) => {
  let release = () => {}
  world(on, { hold: new Promise<void>(resolve => (release = resolve)) })
  steps(on, [{ name: 'Read', input: { file_path: 'shed/rack.txt' } }])
  const spawning = $.agent.spawn(SPAWN)
  await start($)
  await step($)
  release()
  await spawning
  for (const surface of SURFACES) {
    const { texts } = await drawn($, surface)
    expect(texts).toContain(STRINGS.states.working)
    expect(texts).toContain('Reading shed/rack.txt')
    expect(texts.filter(text => text === SPAWN.description)).toHaveLength(1)
  }
})

test('after two model requests the row shows their fresh tokens, cache reads apart, and its context (F-02)', async ($, on) => {
  world(on)
  steps(on)
  await $.agent.spawn(SPAWN)
  await start($)
  await step($, AGENT, 0)
  await step($, AGENT, 1)
  for (const surface of SURFACES) {
    const { texts } = await drawn($, surface)
    // (120 + 50 + 30) twice is 400 fresh; the 80,000 cache reads stay out, and 40,170 of a 1M window is 4%.
    expect(texts.some(text => text.includes('400') && text.includes('4%'))).toBe(true)
    expect(texts.some(text => text.includes('claude-haiku-5-5') && text.includes('medium'))).toBe(true)
  }
})

test('the endings: text is finished, aborted is stopped, error, refusal and an empty answer are failed (F-11)', async ($, on) => {
  const endings = [
    { reason: 'answer', answer: 'Seven shovels.', word: STRINGS.states.finished },
    { reason: 'aborted', answer: '', word: STRINGS.states.stopped },
    { reason: 'error', answer: '', word: STRINGS.states.failed },
    { reason: 'refusal', answer: '', refusal: { category: null, explanation: null }, word: STRINGS.states.failed },
    { reason: 'answer', answer: '  ', word: STRINGS.states.failed },
  ]
  const ids = endings.map((_, i) => `agent-${i}`)
  world(on, { ids: [...ids] })
  for (const [i, { word: _, ...ending }] of endings.entries()) {
    await $.agent.spawn({ ...SPAWN, tool_use_id: `toolu_${i}`, description: `Task ${i}` })
    await complete($, ending, ids[i])
  }
  for (const surface of SURFACES) {
    const { texts } = await drawn($, surface)
    expect(texts.filter(text => Object.values(STRINGS.states).includes(text as never))).toEqual(endings.map(ending => ending.word))
  }
})

test('every run row carries its state word, on every surface (I-06)', async ($, on) => {
  world(on, { ids: ['agent-a', 'agent-b'] })
  await $.agent.spawn(SPAWN)
  await $.agent.spawn({ ...SPAWN, tool_use_id: 'toolu_b', description: 'Weigh the pumpkins' })
  await start($, 'agent-b')
  for (const surface of SURFACES) {
    const { texts } = await drawn($, surface)
    expect(texts).toContain(STRINGS.states.starting)
    expect(texts).toContain(STRINGS.states.working)
  }
})

test('a loop no spawn claims is dropped at its end and never drawn', async ($, on) => {
  world(on)
  await start($, 'fork-memory')
  await complete($, { reason: 'answer', answer: 'noted' }, 'fork-memory')
  for (const surface of SURFACES) expect((await drawn($, surface)).texts).toContain(STRINGS.empty)
})

test("a workflow's agents, which share one tool call, get a row each", async ($, on) => {
  let release = () => {}
  const clock = world(on, { ids: ['agent-1', 'agent-2'], hold: new Promise<void>(resolve => (release = resolve)) })
  const workflow = (agentIndex: number, description: string) => ({
    ...SPAWN,
    tool_use_id: 'toolu_workflow',
    workflow: { runId: 'wf_fixture', agentIndex },
    description,
  })
  // Both open before either's result comes back, as a workflow's agents do.
  const spawning = [$.agent.spawn(workflow(1, 'Count the shovels')), $.agent.spawn(workflow(2, 'Rake the leaves'))]
  await clock.settle()
  release()
  await Promise.all(spawning)
  for (const surface of SURFACES) {
    const { texts } = await drawn($, surface)
    expect(texts).toContain('Count the shovels')
    expect(texts).toContain('Rake the leaves')
  }
})

test('a refused spawn leaves no row', async ($, on) => {
  world(on, { refuse: true })
  expect(await $.agent.spawn(SPAWN)).toEqual({ deny: 'the fixture refuses the spawn' })
  for (const surface of SURFACES) expect((await drawn($, surface)).texts).toContain(STRINGS.empty)
})

test('a resumed agent returns to its row', async ($, on) => {
  world(on, { ids: [AGENT, AGENT] })
  await $.agent.spawn(SPAWN)
  await complete($, { reason: 'answer', answer: 'Seven.' })
  await $.agent.spawn({ ...SPAWN, tool_use_id: 'toolu_resume', resume: { agentId: AGENT } })
  await start($)
  for (const surface of SURFACES) {
    const { texts } = await drawn($, surface)
    expect(texts.filter(text => text === SPAWN.description)).toHaveLength(1)
    expect(texts).toContain(STRINGS.states.working)
  }
})

test('a second spawn of a finished task reads round 2', async ($, on) => {
  world(on, { ids: [AGENT, 'agent-again'] })
  await $.agent.spawn(SPAWN)
  await complete($, { reason: 'answer', answer: 'Seven.' })
  await $.agent.spawn({ ...SPAWN, tool_use_id: 'toolu_again' })
  for (const surface of SURFACES) {
    const { texts } = await drawn($, surface)
    expect(texts.filter(text => text === SPAWN.description)).toHaveLength(2)
    expect(texts).toContain(STRINGS.row.round(2))
  }
})

test("a teammate's next turn puts its row back to working", async ($, on) => {
  world(on)
  await $.agent.spawn({ ...SPAWN, isTeammate: true })
  await start($)
  await complete($, { reason: 'answer', answer: '' })
  expect((await drawn($, 'terminal')).texts).toContain(STRINGS.states.finished)
  await start($)
  expect((await drawn($, 'terminal')).texts).toContain(STRINGS.states.working)
})

test('a clear, a resume or a fork of the session empties the list; a startup or a compaction keeps it (F-23)', async ($, on) => {
  world(on, { ids: ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5'] })
  for (const source of ['startup', 'compact'] as const) {
    await $.agent.spawn(SPAWN)
    await $.classic.SessionStart({ source })
    expect((await drawn($, 'terminal')).texts).toContain(SPAWN.description)
  }
  for (const source of ['clear', 'resume', 'fork'] as const) {
    await $.agent.spawn(SPAWN)
    await $.classic.SessionStart({ source })
    for (const surface of SURFACES) expect((await drawn($, surface)).texts).toContain(STRINGS.empty)
  }
})

test("a call's arguments draw as plain Text in the activity line, never as markup or a link (I-04)", async ($, on) => {
  world(on)
  const path = '**bold** [hedge](https://example.test/hedge) <b>today</b>.txt'
  steps(on, [{ name: 'Read', input: { file_path: path } }])
  await $.agent.spawn(SPAWN)
  await step($)
  for (const surface of SURFACES) {
    const { elements, texts } = await drawn($, surface)
    expect(texts).toContain(`Reading ${path}`)
    expect(elements.filter(element => element.type === 'Markdown' || element.type === 'Link' || element.type === 'Svg')).toEqual([])
    for (const element of elements.filter(one => one.type !== 'Text')) expect(JSON.stringify(element.props)).not.toContain('hedge')
  }
})

// Another plugin, beside the mod, that shows the version `runs` stands at: 0 while never written.
const RUNS_READER = {
  name: 'runs-reader',
  register: (on: On) => {
    on('command.run', { command: 'read-runs' }, async $ => ({ text: String((await $.state.get({ plugin: 'possum-squad', key: 'runs' })).version) }))
  },
}

test("the main session's turns and steps never write runs", { plugins: [RUNS_READER] }, async ($, on) => {
  world(on)
  steps(on, [{ name: 'Read', input: { file_path: 'shed/rack.txt' } }])
  const { agentId: _, ...main } = TURN_START
  await $.turn.start(main)
  const { agentId: __, ...mainStep } = STEP
  await drain($.turn.step(mainStep))
  const { agentId: ___, ...mainEnd } = TURN_COMPLETE
  await $.turn.complete(mainEnd)
  const read = await $.command.run({ command: 'read-runs', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })
  expect(read.text).toBe('0')
})

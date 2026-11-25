import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { PANE } from '../hooks/register'
import { STRINGS } from '../hooks/strings'
import { engine, MOUNT, POSSUMS, possums, SURFACES, settled, store, turnEnds } from './engine'
import { PERMISSION_FROM_AGENT, SPAWN, STEP, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START, WAITING } from './fixtures/events'

type Surface = (typeof SURFACES)[number]
type Use = { name: string; input: unknown }
// What the engine's list says of each agent: its status, and its progress summary when it has one.
type Listed = Record<string, { status: string; label?: string; description?: string }>

// The engine beneath the mod: its panes, a store that opens no pane by itself and keeps Finished open, a pinned clock,
// agent ids from their tool calls, each model request answering with the calls queued for its agent, and the agent list
// the test gives, counting its reads.
function world(on: On) {
  const seen = engine(on)
  store(on, { prefs: { autoOpen: 'never', finishedOpen: true } })
  const clock = mock.clock(on, { now: 1_000 })
  // `held`: the next read takes the list as it is then, and answers only once the test releases it.
  const given = { listed: {} as Listed, reads: 0, isRefused: false, held: undefined as Promise<void> | undefined }
  const queued: Record<string, Use[][]> = {}
  on('agent.spawn', (_, e) => ({ model: 'claude-haiku-5-5', agentId: e.tool_use_id.replace('toolu_', 'agent-') }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('classic.PermissionRequest', () => WAITING)
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    const toolUses = queued[e.agentId ?? '']?.shift() ?? []
    return { ...STEPPED, turnId: e.turnId, index: e.index, toolUses }
  })
  on('agent.list', async () => {
    given.reads++
    if (given.isRefused) return { deny: 'the fixture refuses the list' }
    const listing = given.listed
    const held = given.held
    given.held = undefined
    if (held !== undefined) await held
    return { value: Object.entries(listing).map(([id, one]) => ({ id, description: '', ...one })) } as never
  })
  const queue = (n: number, uses: Use[]) => {
    const list = queued[`agent-${n}`] ?? []
    list.push(uses)
    queued[`agent-${n}`] = list
  }
  return { seen, clock, given, queue }
}

const GENERIC = { ...SPAWN, subagentType: 'general-purpose' }
async function working($: Engine, n: number, description = `Tend bed ${n}`) {
  await $.agent.spawn({ ...GENERIC, tool_use_id: `toolu_${n}`, description } as never)
  await $.turn.start({ ...TURN_START, agentId: `agent-${n}` })
}
async function drain(stream: AsyncGenerator<unknown, unknown>) {
  for (;;) if ((await stream.next()).done) return
}
const step = ($: Engine, n: number) => drain($.turn.step({ ...STEP, agentId: `agent-${n}` }))
const ends = ($: Engine, n: number, reason = 'answer', answer: string = TURN_COMPLETE.answer) =>
  turnEnds($, { ...TURN_COMPLETE, reason, answer, isAborted: reason === 'aborted', agentId: `agent-${n}` } as never)

// A subagent's absolute path, longer than a target keeps, and a long shell command.
const LONG_PATH = `/fixture/orchard/${'beds/north/'.repeat(8)}rack.txt`
const LONG_COMMAND = `./plant ${'--bed north --rows 12 '.repeat(8)}`
const read = (path: string): Use => ({ name: 'Read', input: { file_path: path } })
const run = (command: string): Use => ({ name: 'Bash', input: { command } })

// What a surface draws: its texts and elements, after pressing the named Peek buttons.
async function drawn($: Engine, clock: { advance: (ms: number) => Promise<void> }, surface: Surface, presses: readonly string[] = []) {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  for (const id of presses) {
    await pane.press({ key: `peek-${id}` })
    await clock.advance(100)
  }
  const elements = await pane.findAll({})
  const texts = (await pane.findAll({ type: 'Text' })).map(text => text.text)
  await pane.unmount()
  return { elements, texts }
}

test("a long path reads its file name first, on the row and in Peek's last actions; a long command keeps its start", async ($, on) => {
  const { clock, queue } = world(on)
  await working($, 1)
  await working($, 2)
  queue(1, [read(LONG_PATH)])
  queue(2, [run(LONG_COMMAND)])
  await step($, 1)
  await step($, 2)
  // The path's last 80 characters, its cut folder starting at a whole name.
  const pathLine = 'Reading rack.txt in …/beds/north/beds/north/beds/north/beds/north/beds/north/beds/north'
  const commandLine = `Running ${LONG_COMMAND.slice(0, 80)}…`
  // Peek's flag is kept in state, so one press opens it for both surfaces.
  await drawn($, clock, 'terminal', ['agent-1'])
  for (const surface of SURFACES) {
    const { texts } = await drawn($, clock, surface)
    expect(texts.filter(text => text === pathLine)).toHaveLength(2)
    expect(texts).toContain(commandLine)
    expect(texts.some(text => text?.includes(LONG_PATH))).toBe(false)
  }
})

test("the peek button is in every row's tree at any activity's length, beside a Box that may shrink to nothing", async ($, on) => {
  const { clock, queue } = world(on)
  await working($, 1)
  queue(1, [run(`cd /${'orchard/'.repeat(2_000)}`)])
  await step($, 1)
  for (const surface of SURFACES) {
    const { elements } = await drawn($, clock, surface)
    expect(elements.filter(one => one.type === 'Button' && one.key === 'peek-agent-1')).toHaveLength(1)
    // The description's, the model's, the activity's, and on the desktop the column beside the sprite.
    const shrinking = elements.filter(one => one.type === 'Box' && (one.props as { minWidth?: unknown }).minWidth === 0)
    expect(shrinking).toHaveLength(surface === 'terminal' ? 3 : 4)
    for (const box of shrinking) expect(box.props).toMatchObject({ flexGrow: 1, flexShrink: 1, minWidth: 0 })
  }
})

test('an ended row reads its last call in the past tense; a waiting or a needs-you one keeps the live verb', async ($, on) => {
  const { clock, given, queue } = world(on)
  for (const n of [1, 2, 3, 4, 5, 6]) await working($, n)
  queue(1, [run('npm test')])
  queue(2, [read('shed/rack.txt')])
  queue(3, [{ name: 'mcp__garden__water', input: {} }])
  queue(5, [run('ping -c 40 127.0.0.1')])
  queue(6, [run('ls shed')])
  for (const n of [1, 2, 3, 5, 6]) await step($, n)
  await $.classic.PermissionRequest({ ...PERMISSION_FROM_AGENT, agent_id: 'agent-6' } as never)
  given.listed = { 'agent-5': { status: 'waiting' } }
  await ends($, 1)
  await ends($, 2, 'error', '')
  await ends($, 3, 'aborted', '')
  await ends($, 4)
  await ends($, 5)
  for (const surface of SURFACES) {
    const { texts } = await drawn($, clock, surface)
    for (const line of ['Ran npm test', 'Read rack.txt in shed', 'Used water', 'No tool calls', 'Running ping -c 40 127.0.0.1', 'Running ls shed']) {
      expect(texts).toContain(line)
    }
    for (const live of ['Running npm test', 'Reading rack.txt in shed', 'Using water']) expect(texts).not.toContain(live)
  }
})

test("a listed summary shows on the row's third line as plain Text; one that is the description, or on a row that needs the person, quiet or ended, does not", async ($, on) => {
  const { clock, given, queue } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  await working($, 2, 'Count the shovels')
  await working($, 3)
  await working($, 4)
  await working($, 5)
  queue(1, [run('npm test')])
  queue(2, [run('ls shed')])
  queue(3, [run('ls shed')])
  queue(4, [run('npm test')])
  for (const n of [1, 2, 3, 4]) await step($, n)
  await $.classic.PermissionRequest({ ...PERMISSION_FROM_AGENT, agent_id: 'agent-3' } as never)
  const summary = 'Weeding **the** [north](https://example.test/north)\n  <b>bed</b>'
  given.listed = {
    'agent-1': { status: 'running', label: summary },
    'agent-2': { status: 'running', label: 'Count the shovels' },
    'agent-3': { status: 'running', label: 'Asking about the shed' },
    'agent-4': { status: 'completed', label: 'Finishing the tests' },
    'agent-5': { status: 'running', label: 'Resting in the shade' },
  }
  await ends($, 4)
  await clock.advance(1_000)
  await settled()
  // Agent 5 made no call and has been silent past T-05, so it reads quiet.
  await clock.advance(90_000)
  await settled()
  for (const surface of SURFACES) {
    const { elements, texts } = await drawn($, clock, surface)
    // Its line breaks and runs of spaces read as one space, the markup as it was written.
    expect(texts).toContain('Weeding **the** [north](https://example.test/north) <b>bed</b>')
    expect(elements.filter(one => one.type === 'Markdown' || one.type === 'Link')).toEqual([])
    expect(texts).not.toContain('Running npm test')
    expect(texts).toContain('Running ls shed')
    expect(texts).toContain('Ran npm test')
    expect(texts).toContain(STRINGS.row.quietFor(1))
    for (const hidden of ['Asking about the shed', 'Finishing the tests', 'Resting in the shade']) expect(texts).not.toContain(hidden)
  }
})

test('a summary longer than a row shows is cut at 100 characters, a list that cannot be read keeps it, and one that clears takes the call back', async ($, on) => {
  const { clock, given, queue } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  queue(1, [run('npm test')])
  await step($, 1)
  const words = 'Sorting the seed trays by colour and labelling each one for the spring beds '.repeat(3)
  given.listed = { 'agent-1': { status: 'running', label: words } }
  await clock.advance(1_000)
  await settled()
  for (const surface of SURFACES) expect((await drawn($, clock, surface)).texts).toContain(`${words.slice(0, 100)}…`)
  given.isRefused = true
  await clock.advance(1_000)
  await settled()
  for (const surface of SURFACES) expect((await drawn($, clock, surface)).texts).toContain(`${words.slice(0, 100)}…`)
  given.isRefused = false
  given.listed = { 'agent-1': { status: 'running', label: '   ' } }
  await clock.advance(1_000)
  await settled()
  for (const surface of SURFACES) expect((await drawn($, clock, surface)).texts).toContain('Running npm test')
})

test('the beat reads the list once a beat while a live run shows, and not behind another tab, over the gallery, or once all have ended', async ($, on) => {
  const { seen, clock, given } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  await clock.advance(3_000)
  await settled()
  expect(given.reads).toBe(3)

  seen.panes = [{ id: PANE, isShown: false, isPlaced: true }]
  await clock.advance(3_000)
  await settled()
  expect(given.reads).toBe(3)

  seen.panes = [{ id: PANE, isShown: true, isPlaced: true }]
  await $.command.run(possums('roles'))
  await clock.advance(3_000)
  await settled()
  expect(given.reads).toBe(3)

  given.listed = { 'agent-1': { status: 'completed' } }
  await ends($, 1)
  const atEnd = given.reads
  await clock.advance(3_000)
  await settled()
  expect(given.reads).toBe(atEnd)
})

test("a waiting or a starting row shows its summary; a label that is the engine's own description is none, though the row's differs", async ($, on) => {
  const { clock, given, queue } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  await working($, 2)
  await $.agent.spawn({ ...GENERIC, tool_use_id: 'toolu_3', description: 'Tend bed 3' } as never)
  queue(1, [run('ping -c 40 127.0.0.1')])
  queue(2, [run('npm test')])
  await step($, 1)
  await step($, 2)
  given.listed = { 'agent-1': { status: 'waiting', label: 'Waiting on the ping' } }
  await ends($, 1)
  given.listed = {
    'agent-1': { status: 'waiting', label: 'Waiting on the ping' },
    // A resume's description, say, which the row does not hold: the engine's stand-in for no summary.
    'agent-2': { status: 'running', label: 'Finish the beds', description: 'Finish the beds' },
    'agent-3': { status: 'running', label: 'Getting ready' },
  }
  await clock.advance(1_000)
  await settled()
  for (const surface of SURFACES) {
    const { texts } = await drawn($, clock, surface)
    expect(texts).toContain(STRINGS.states.waiting)
    expect(texts).toContain('Waiting on the ping')
    expect(texts).toContain(STRINGS.states.starting)
    expect(texts).toContain('Getting ready')
    expect(texts).not.toContain('Finish the beds')
    expect(texts).toContain('Running npm test')
  }
})

test("a read answered after a later one leaves the later one's summary", async ($, on) => {
  const { clock, given, queue } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  queue(1, [run('npm test')])
  await step($, 1)
  let release = () => {}
  given.held = new Promise<void>(resolve => (release = resolve))
  given.listed = { 'agent-1': { status: 'running', label: 'Reading the config' } }
  await clock.advance(1_000)
  given.listed = { 'agent-1': { status: 'running', label: 'Running the tests' } }
  await clock.advance(1_000)
  await settled()
  release()
  await settled()
  await clock.advance(100)
  for (const surface of SURFACES) {
    const { texts } = await drawn($, clock, surface)
    expect(texts).toContain('Running the tests')
    expect(texts).not.toContain('Reading the config')
  }
})

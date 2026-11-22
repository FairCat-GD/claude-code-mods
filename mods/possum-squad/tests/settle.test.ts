import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { ROLE_SETTLES_MS } from '../hooks/config'
import { detect } from '../hooks/roles/rules'
import { STRINGS } from '../hooks/strings'
import { engine, MOUNT, POSSUMS, SURFACES, store } from './engine'
import { CORPUS } from './fixtures/role-corpus'
import { SPAWN, STEP, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START } from './fixtures/events'

type Use = { name: string; input: unknown }

// Another plugin, beside the mod, counting the mod's writes to `runs`.
const WRITES = {
  name: 'write-counter',
  register: (on: On) => {
    let writes = 0
    on('state.set', (_, e, next) => {
      if (e.plugin === 'possum-squad' && e.key === 'runs') writes++
      return next(e)
    })
    on('command.run', { command: 'writes' }, async () => ({ text: String(writes) }))
  },
}
const writes = async ($: Engine) => Number((await $.command.run({ ...POSSUMS, command: 'writes' })).text)

// Another plugin, refusing the clock's time, or the mod's writes to `runs`, while the test says so.
const REFUSER = {
  name: 'refuser',
  register: (on: On) => {
    let refusing = ''
    on('clock.now', (_, e, next) => (refusing === 'clock' ? ({ deny: 'the fixture refuses the time' } as never) : next(e)))
    on('state.set', (_, e, next) =>
      refusing === 'runs' && e.plugin === 'possum-squad' && e.key === 'runs' ? ({ deny: 'the fixture refuses the write' } as never) : next(e),
    )
    on('command.run', { command: 'refuse' }, async (_, e) => {
      refusing = e.args
      return { text: refusing }
    })
  },
}
const refuse = ($: Engine, what: '' | 'clock' | 'runs') => $.command.run({ ...POSSUMS, command: 'refuse', args: what })

// The engine beneath the mod: its panes, a pinned clock, the next agent id for each spawn (held back while `hold` is
// pending), and each model request answering with the calls queued for it.
function world(on: On, hold?: Promise<void>) {
  engine(on)
  store(on, { prefs: { finishedOpen: true } })
  const clock = mock.clock(on, { now: 1_000 })
  let next = 0
  on('agent.spawn', async () => {
    if (hold !== undefined) await hold
    return { model: 'claude-sonnet-5-5', agentId: `agent-${++next}` }
  })
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  const queued: Use[][] = []
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    return { ...STEPPED, turnId: e.turnId, index: e.index, toolUses: queued.shift() ?? [] }
  })
  return { clock, queue: (uses: Use[]) => queued.push(uses) }
}

const GENERIC = { ...SPAWN, subagentType: 'general-purpose', description: 'Take care of it' }

async function drain(stream: AsyncGenerator<unknown, unknown>) {
  for (;;) if ((await stream.next()).done) return
}
const step = ($: Engine, agentId: string) => drain($.turn.step({ ...STEP, agentId }))
const start = ($: Engine, agentId: string) => $.turn.start({ ...TURN_START, agentId })
const complete = ($: Engine, agentId: string, answer: string = TURN_COMPLETE.answer) => $.turn.complete({ ...TURN_COMPLETE, agentId, answer } as never)

// On each surface, the role name the row with this description draws on its second line, which follows its
// description and state word; undefined while it draws plain.
async function roleDrawn($: Engine, description: string) {
  const names = Object.values(STRINGS.roles)
  const drawn: (string | undefined)[] = []
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, surface })
    const texts = (await pane.findAll({ type: 'Text' })).map(text => text.text ?? '')
    await pane.unmount()
    const at = texts.indexOf(description)
    expect(at).toBeGreaterThanOrEqual(0)
    const details = texts[at + 2] ?? ''
    drawn.push(names.find(name => details === name || details.startsWith(`${name}${STRINGS.row.separator}`)))
  }
  return drawn
}

const both = (name: string | undefined) => [name, name]

test('a row with no clue in its words arrives plain, and dresses when a decisive call settles it (F-06)', async ($, on) => {
  const { queue } = world(on)
  await $.agent.spawn(GENERIC)
  await start($, 'agent-1')
  queue([{ name: 'Read', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  expect(await roleDrawn($, GENERIC.description)).toEqual(both(undefined))
  queue([{ name: 'Edit', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  expect(await roleDrawn($, GENERIC.description)).toEqual(both(STRINGS.roles.builder))
})

test('with the pane open and no call at all, the clock settles Helper at T-04 (F-06)', async ($, on) => {
  const { clock } = world(on)
  await $.command.run(POSSUMS)
  await $.agent.spawn(GENERIC)
  await start($, 'agent-1')
  await clock.advance(ROLE_SETTLES_MS - 1_000)
  expect(await roleDrawn($, GENERIC.description)).toEqual(both(undefined))
  await clock.advance(2_000)
  expect(await roleDrawn($, GENERIC.description)).toEqual(both(STRINGS.roles.helper))
})

test('with the pane closed, a step past T-04 settles Helper before its calls count', async ($, on) => {
  const { clock, queue } = world(on)
  await $.agent.spawn(GENERIC)
  await start($, 'agent-1')
  await clock.advance(ROLE_SETTLES_MS + 5_000)
  expect(await roleDrawn($, GENERIC.description)).toEqual(both(undefined))
  queue([{ name: 'Edit', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  expect(await roleDrawn($, GENERIC.description)).toEqual(both(STRINGS.roles.helper))
})

test("a run that ends with no rule fired is Helper at its end; a teammate's end leaves it to its next turn", async ($, on) => {
  const { queue } = world(on)
  await $.agent.spawn({ ...GENERIC, tool_use_id: 'toolu_1', description: 'Continue' })
  await start($, 'agent-1')
  await complete($, 'agent-1')
  expect(await roleDrawn($, 'Continue')).toEqual(both(STRINGS.roles.helper))

  await $.agent.spawn({ ...GENERIC, tool_use_id: 'toolu_2', description: 'Next part', isTeammate: true })
  await start($, 'agent-2')
  await complete($, 'agent-2', '')
  expect(await roleDrawn($, 'Next part')).toEqual(both(undefined))
  await start($, 'agent-2')
  queue([{ name: 'Edit', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-2')
  expect(await roleDrawn($, 'Next part')).toEqual(both(STRINGS.roles.builder))
})

test("calls made before the spawn's result settle the row it joins, unless its words already did", async ($, on) => {
  let release = () => {}
  const { queue } = world(
    on,
    new Promise<void>(resolve => {
      release = resolve
    }),
  )
  const generic = $.agent.spawn({ ...GENERIC, tool_use_id: 'toolu_1' })
  const explorer = $.agent.spawn({ ...SPAWN, tool_use_id: 'toolu_2' })
  await start($, 'agent-1')
  queue([{ name: 'Edit', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  await start($, 'agent-2')
  queue([{ name: 'WebSearch', input: { query: 'rake handles' } }])
  await step($, 'agent-2')
  release()
  await Promise.all([generic, explorer])
  expect(await roleDrawn($, GENERIC.description)).toEqual(both(STRINGS.roles.builder))
  expect(await roleDrawn($, SPAWN.description)).toEqual(both(STRINGS.roles.scout))
})

test('a settled role stays through later decisive calls and past T-04 (I-07)', async ($, on) => {
  const { clock, queue } = world(on)
  await $.command.run(POSSUMS)
  await $.agent.spawn(GENERIC)
  await start($, 'agent-1')
  queue([{ name: 'Edit', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  queue([{ name: 'WebSearch', input: { query: 'rake handles' } }])
  await step($, 'agent-1')
  await clock.advance(ROLE_SETTLES_MS + 2_000)
  queue([{ name: 'Bash', input: { command: 'npm test' } }])
  await step($, 'agent-1')
  await complete($, 'agent-1')
  expect(await roleDrawn($, GENERIC.description)).toEqual(both(STRINGS.roles.builder))
})

test("the clock's beat writes runs once to settle Helper, and never on beats with nothing due", { plugins: [WRITES] }, async ($, on) => {
  const { clock } = world(on)
  await $.command.run(POSSUMS)
  await $.agent.spawn(GENERIC)
  await start($, 'agent-1')
  const before = await writes($)
  await clock.advance(ROLE_SETTLES_MS - 2_000)
  expect(await writes($)).toBe(before)
  await clock.advance(4_000)
  expect(await writes($)).toBe(before + 1)
  await clock.advance(5_000)
  expect(await writes($)).toBe(before + 1)
})

test('every corpus case with calls, raised as events, settles as the rules read it', async ($, on) => {
  const { queue } = world(on)
  const cases = [...CORPUS.dev, ...CORPUS.holdout].filter(item => item.tools !== undefined)
  for (const [i, item] of cases.entries()) {
    const agentId = `agent-${i + 1}`
    await $.agent.spawn({ ...SPAWN, tool_use_id: `toolu_${i + 1}`, subagentType: item.type ?? 'general-purpose', description: item.description })
    await start($, agentId)
    for (const call of item.tools ?? []) {
      const colon = call.indexOf(':')
      queue([colon < 0 ? { name: call, input: {} } : { name: call.slice(0, colon), input: { command: call.slice(colon + 1) } }])
      await step($, agentId)
    }
    await complete($, agentId)
    const expected = detect({ description: item.description, type: item.type ?? 'general-purpose', tools: item.tools ?? [], timedOut: true })
    expect(expected?.id).toBe(item.role)
    expect({ description: item.description, drawn: await roleDrawn($, item.description) }).toEqual({
      description: item.description,
      drawn: both(STRINGS.roles[item.role]),
    })
  }
})

test("a step whose clock cannot be read still records its numbers and its calls' evidence", { plugins: [REFUSER] }, async ($, on) => {
  const { queue } = world(on)
  await $.agent.spawn(GENERIC)
  await start($, 'agent-1')
  await refuse($, 'clock')
  queue([{ name: 'Edit', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  await refuse($, '')
  expect(await roleDrawn($, GENERIC.description)).toEqual(both(STRINGS.roles.builder))
})

test('a teammate resting with no role gets Helper from the clock at T-04, nothing else running', async ($, on) => {
  const { clock } = world(on)
  await $.command.run(POSSUMS)
  await $.agent.spawn({ ...GENERIC, description: 'Next part', isTeammate: true })
  await start($, 'agent-1')
  await complete($, 'agent-1', '')
  await clock.advance(ROLE_SETTLES_MS - 2_000)
  expect(await roleDrawn($, 'Next part')).toEqual(both(undefined))
  await clock.advance(3_000)
  expect(await roleDrawn($, 'Next part')).toEqual(both(STRINGS.roles.helper))
})

test("a turn that left work in the background ends with no role, and the next turn's calls settle it", async ($, on) => {
  const { queue } = world(on)
  await $.agent.spawn({ ...GENERIC, description: 'Continue' })
  await start($, 'agent-1')
  queue([{ name: 'Bash', input: { command: 'sleep 70', run_in_background: true } }])
  await step($, 'agent-1')
  await complete($, 'agent-1')
  expect(await roleDrawn($, 'Continue')).toEqual(both(undefined))
  await start($, 'agent-1')
  queue([{ name: 'Edit', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  await complete($, 'agent-1')
  expect(await roleDrawn($, 'Continue')).toEqual(both(STRINGS.roles.builder))
})

test('a refused write of Helper leaves the clock beating and redrawing, and the next beat settles it', { plugins: [REFUSER] }, async ($, on) => {
  const { clock } = world(on)
  let redraws = 0
  on('ui.invalidate', (_, e, next) => {
    redraws++
    return next(e)
  })
  await $.command.run(POSSUMS)
  await $.agent.spawn(GENERIC)
  await start($, 'agent-1')
  await refuse($, 'runs')
  await clock.advance(ROLE_SETTLES_MS + 1_000)
  const before = redraws
  await clock.advance(3_000)
  expect(redraws).toBeGreaterThanOrEqual(before + 3)
  await refuse($, '')
  expect(await roleDrawn($, GENERIC.description)).toEqual(both(undefined))
  await clock.advance(1_000)
  expect(await roleDrawn($, GENERIC.description)).toEqual(both(STRINGS.roles.helper))
})

import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { SPRITE_SCALE } from '../hooks/config'
import { sprite, squad } from '../hooks/sprites/index'
import { STRINGS } from '../hooks/strings'
import { panel } from '../hooks/view/panel'
import { engine, MOUNT, possums, SURFACES, store } from './engine'
import { SPAWN, STEP, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START } from './fixtures/events'
import { ROWS } from './fixtures/rows'

type Use = { name: string; input: unknown }

// The engine beneath the mod: its panes, the store's settings, a pinned clock, the next agent id for each spawn, and
// each model request answering with the calls queued for it.
function world(on: On, prefs: Record<string, unknown> = {}) {
  engine(on)
  store(on, { prefs: { finishedOpen: true, ...prefs } })
  const clock = mock.clock(on, { now: 1_000 })
  let next = 0
  on('agent.spawn', async () => ({ model: 'claude-sonnet-5-5', agentId: `agent-${++next}` }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  const queued: Use[][] = []
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    return { ...STEPPED, turnId: e.turnId, index: e.index, toolUses: queued.shift() ?? [] }
  })
  return { clock, queue: (uses: Use[]) => queued.push(uses) }
}

async function drain(stream: AsyncGenerator<unknown, unknown>) {
  for (;;) if ((await stream.next()).done) return
}
const step = ($: Engine, agentId: string) => drain($.turn.step({ ...STEP, agentId }))

// Each Svg the pane draws on a surface: its alt, source, size and whether it is framed.
type Drawn = { alt: string; source: string; width: number; isInteractive?: boolean }

// Each sprite the pane draws on a surface. The kit's terminal draws an Svg as an empty Box, so those count too there.
async function spritesOn($: Engine, surface: (typeof SURFACES)[number]): Promise<Drawn[]> {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  const elements = await pane.findAll({})
  await pane.unmount()
  return elements
    .filter(element => element.type === 'Svg' || (surface === 'terminal' && element.type === 'Box' && element.children.length === 0))
    .map(element => element.props as Drawn)
}

const GENERIC = { ...SPAWN, subagentType: 'general-purpose', description: 'Take care of it' }
const SIZE = 32 * SPRITE_SCALE
const PLAIN_WORKING = STRINGS.sprite.alt(STRINGS.sprite.plain, STRINGS.states.working)
// Past any arrival, a role's hop and an ending: each lasts its one-off and a beat more, the cheer's 3 s the longest.
const SETTLED_MS = 5_000

test('a row draws its sprite off the terminal, plain until its role settles, then hops into its outfit once; the terminal draws none', async ($, on) => {
  const { clock, queue } = world(on)
  await $.agent.spawn(GENERIC)
  await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
  await clock.advance(SETTLED_MS)
  queue([{ name: 'Read', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  const plain = Object.fromEntries(await Promise.all(SURFACES.map(async surface => [surface, await spritesOn($, surface)] as const)))
  queue([{ name: 'Edit', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  const hopping = Object.fromEntries(await Promise.all(SURFACES.map(async surface => [surface, await spritesOn($, surface)] as const)))
  await clock.advance(SETTLED_MS)
  for (const surface of SURFACES) {
    const dressed = await spritesOn($, surface)
    if (surface === 'terminal') {
      expect([plain[surface], hopping[surface], dressed]).toEqual([[], [], []])
      continue
    }
    const builder = { set: 'classic', role: 'builder', pose: 'working', motion: 'auto' } as const
    expect(plain[surface]?.map(drawn => drawn.alt)).toEqual([STRINGS.roles.lead, PLAIN_WORKING])
    expect(plain[surface]?.[1]?.source).toBe(sprite({ set: 'classic', pose: 'working', motion: 'auto' }).source)
    expect(hopping[surface]?.[1]?.alt).toBe(STRINGS.sprite.alt(STRINGS.roles.builder, STRINGS.states.working))
    expect(hopping[surface]?.[1]?.source).toBe(sprite({ ...builder, moment: 'dressing' }).source)
    expect(dressed[1]?.alt).toBe(STRINGS.sprite.alt(STRINGS.roles.builder, STRINGS.states.working))
    expect(dressed[1]?.source).toBe(sprite(builder).source)
    expect([hopping[surface]?.[1]?.isInteractive, dressed[1]?.width, dressed[1]?.isInteractive]).toEqual([true, SIZE, true])
  }
})

test('a new row slides in, dressed by a hop when its role is known at its spawn, whatever its state; past its arrival it works', async ($, on) => {
  const { clock } = world(on)
  // An Explore agent is a Scout from its spawn; a general-purpose one is plain.
  await $.agent.spawn(SPAWN)
  await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
  await $.agent.spawn({ ...GENERIC, tool_use_id: 'toolu_plain' })
  const arriving = await spritesOn($, 'desktop')
  await clock.advance(SETTLED_MS)
  const settled = await spritesOn($, 'desktop')
  const scout = { set: 'classic', role: 'scout', motion: 'auto' } as const
  expect(arriving.map(drawn => drawn.alt)).toEqual([
    STRINGS.roles.lead,
    // Its alt names the arrival's pose, so it stays the same while the row's state moves on beneath it.
    STRINGS.sprite.alt(STRINGS.roles.scout, STRINGS.states.starting),
    STRINGS.sprite.alt(STRINGS.sprite.plain, STRINGS.states.starting),
  ])
  // An arrival stands as starting does, so the row's state moving on inside it never starts it again.
  expect(arriving[1]?.source).toBe(sprite({ ...scout, pose: 'working', moment: 'arrival' }).source)
  expect(arriving[1]?.source).toBe(sprite({ ...scout, pose: 'starting', moment: 'arrival' }).source)
  expect(arriving[2]?.source).toBe(sprite({ set: 'classic', pose: 'starting', motion: 'auto', moment: 'arrival' }).source)
  expect(arriving.slice(1).map(drawn => drawn.isInteractive)).toEqual([true, true])
  expect(settled[1]?.source).toBe(sprite({ ...scout, pose: 'working' }).source)
  expect([settled[2]?.source, settled[2]?.isInteractive]).toEqual([sprite({ set: 'classic', pose: 'starting', motion: 'auto' }).source, undefined])
})

test('a finished run cheers then sleeps, and a stopped one startles, around their end; later each is a still image', async ($, on) => {
  const { clock } = world(on)
  for (const id of ['agent-1', 'agent-2']) {
    await $.agent.spawn({ ...SPAWN, tool_use_id: `toolu-${id}`, description: `Count the ${id} shovels` })
    await $.turn.start({ ...TURN_START, agentId: id })
  }
  await clock.advance(SETTLED_MS)
  await $.turn.complete({ ...TURN_COMPLETE, agentId: 'agent-1' })
  await $.turn.complete({ ...TURN_COMPLETE, agentId: 'agent-2', reason: 'aborted', isAborted: true })
  const ending = await spritesOn($, 'desktop')
  await clock.advance(SETTLED_MS)
  const after = await spritesOn($, 'desktop')
  const scout = (pose: 'finished' | 'stopped') => ({ set: 'classic', role: 'scout', pose, motion: 'auto' }) as const
  expect(ending.slice(1).map(drawn => drawn.alt)).toEqual([
    STRINGS.sprite.alt(STRINGS.roles.scout, STRINGS.states.finished),
    STRINGS.sprite.alt(STRINGS.roles.scout, STRINGS.states.stopped),
  ])
  expect(ending.slice(1).map(drawn => [drawn.source, drawn.isInteractive])).toEqual([
    [sprite({ ...scout('finished'), moment: 'ending' }).source, true],
    [sprite({ ...scout('stopped'), moment: 'ending' }).source, true],
  ])
  expect(after.slice(1).map(drawn => [drawn.source, drawn.isInteractive])).toEqual([
    [sprite(scout('finished')).source, undefined],
    [sprite(scout('stopped')).source, undefined],
  ])
})

test('with motion off no sprite in the pane holds an animation element or is framed, its moments included; on, what moves is framed (F-21)', async ($, on) => {
  const { clock, queue } = world(on, { motion: 'off' })
  for (const id of ['agent-1', 'agent-2', 'agent-3']) {
    await $.agent.spawn({ ...GENERIC, tool_use_id: `toolu-${id}`, description: `Sort the ${id} crates` })
    await $.turn.start({ ...TURN_START, agentId: id })
    queue([])
    await step($, id)
  }
  await $.turn.complete({ ...TURN_COMPLETE, agentId: 'agent-3' } as never)
  const still = Object.fromEntries(await Promise.all(SURFACES.map(async surface => [surface, await spritesOn($, surface)] as const)))
  await clock.advance(SETTLED_MS)
  await $.command.run(possums('set motion auto'))
  for (const surface of SURFACES) {
    const moving = await spritesOn($, surface)
    if (surface === 'terminal') {
      expect([still[surface], moving]).toEqual([[], []])
      continue
    }
    expect(still[surface]).toHaveLength(4)
    for (const drawn of still[surface] ?? []) {
      expect([drawn.alt, /<(animate|set)/.test(drawn.source), drawn.isInteractive]).toEqual([drawn.alt, false, undefined])
    }
    expect(moving.filter(drawn => drawn.isInteractive === true).map(drawn => drawn.alt)).toEqual([PLAIN_WORKING, PLAIN_WORKING])
    for (const drawn of moving.filter(one => one.isInteractive !== true)) expect([drawn.alt, drawn.source.includes('<animate')]).toEqual([drawn.alt, false])
  }
})

test("the Lead's sprite heads the pane off the terminal, and the empty pane draws the squad asleep; the terminal neither", async ($, on) => {
  world(on)
  for (const surface of SURFACES) {
    const drawn = await spritesOn($, surface)
    if (surface === 'terminal') {
      expect(drawn).toEqual([])
      continue
    }
    expect(drawn.map(one => one.alt)).toEqual([STRINGS.roles.lead, STRINGS.sprite.squad])
    expect(drawn[0]?.source).toBe(sprite({ set: 'classic', role: 'lead', pose: 'idle', motion: 'auto' }).source)
    expect([drawn[0]?.isInteractive, drawn[1]?.source, drawn[1]?.width]).toEqual([undefined, squad().source, squad().width * SPRITE_SCALE])
  }
})

test('each state a run reaches by its events draws that state in its row, past its moments (F-08)', async ($, on) => {
  const { clock } = world(on)
  // Explore agents are Scouts from their spawn: one starting, one working, then three ended each its own way.
  for (let i = 1; i <= 5; i++) await $.agent.spawn({ ...SPAWN, tool_use_id: `toolu-${i}`, description: `Tend bed ${i}` })
  for (let i = 2; i <= 5; i++) await $.turn.start({ ...TURN_START, agentId: `agent-${i}` })
  await $.turn.complete({ ...TURN_COMPLETE, agentId: 'agent-3' })
  await $.turn.complete({ ...TURN_COMPLETE, agentId: 'agent-4', reason: 'error' } as never)
  await $.turn.complete({ ...TURN_COMPLETE, agentId: 'agent-5', reason: 'aborted', isAborted: true })
  await clock.advance(SETTLED_MS)
  const states = ['starting', 'working', 'finished', 'failed', 'stopped'] as const
  const drawn = (await spritesOn($, 'desktop')).slice(1)
  expect(drawn.map(one => one.alt)).toEqual(states.map(state => STRINGS.sprite.alt(STRINGS.roles.scout, STRINGS.states[state])))
  expect(drawn.map(one => one.source)).toEqual(states.map(pose => sprite({ set: 'classic', role: 'scout', pose, motion: 'auto' }).source))
})

// The panel as the mod draws it, over fixture rows in every state at once, which the test's own drawing hands to the
// module's builder; `attention.test.ts` reaches needs-you and quiet by events.
const EVERY_STATE = 'every-state'
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

test('every state draws its own frame in its row, on every surface that draws sprites (F-08)', async ($, on) => {
  on('ui.render', { plugin: '*' }, ($, e) =>
    panel(
      $.ui.resolve(e),
      e.surface === 'terminal',
      {
        lead: { tokens: 0 },
        session: { tokens: 0, workedMs: 0 },
        rows: ROWS,
        isFinishedOpen: true,
        look: { set: 'classic', motion: 'auto' },
      },
      NO_ACTIONS,
    ),
  )
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, requestId: EVERY_STATE, surface })
    const elements = await pane.findAll({})
    const words = (await pane.findAll({ type: 'Text' })).map(text => text.text)
    await pane.unmount()
    // The state word on every row (I-06); sprites only where the surface draws them.
    for (const row of ROWS) expect(words).toContain(STRINGS.states[row.state])
    const drawn = elements.filter(element => element.type === 'Svg').map(element => element.props as Drawn)
    if (surface === 'terminal') {
      expect(drawn).toEqual([])
      continue
    }
    const bySection = [
      ...ROWS.filter(row => row.state === 'needs-you'),
      ...ROWS.filter(row => ['starting', 'working', 'quiet'].includes(row.state)),
      ...ROWS.filter(row => ['finished', 'failed', 'stopped'].includes(row.state)),
    ]
    expect(drawn.slice(1).map(one => one.source)).toEqual(
      bySection.map(row => sprite({ set: 'classic', role: row.roleId, pose: row.state, motion: 'auto' }).source),
    )
  }
})

test('a role the person picks dresses a live row with a hop, then stands in it; an ended row changes still', async ($, on) => {
  const { clock } = world(on)
  await $.agent.spawn(GENERIC)
  await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
  await $.agent.spawn({ ...GENERIC, tool_use_id: 'toolu_done', description: 'Stack the pots' })
  await $.turn.start({ ...TURN_START, agentId: 'agent-2' })
  await $.turn.complete({ ...TURN_COMPLETE, agentId: 'agent-2' })
  await clock.advance(SETTLED_MS)
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  for (const agentId of ['agent-1', 'agent-2']) {
    await pane.press({ key: `role-${agentId}` })
    await clock.advance(100)
    await pane.select({ key: 'role-pick', value: 'tester' })
    await clock.advance(100)
  }
  await pane.unmount()
  const tester = (pose: 'working' | 'finished') => ({ set: 'classic', role: 'tester', pose, motion: 'auto' }) as const
  const picked = (await spritesOn($, 'desktop')).slice(1)
  expect(picked.map(one => [one.alt, one.source, one.isInteractive])).toEqual([
    [STRINGS.sprite.alt(STRINGS.roles.tester, STRINGS.states.working), sprite({ ...tester('working'), moment: 'dressing' }).source, true],
    [STRINGS.sprite.alt(STRINGS.roles.tester, STRINGS.states.finished), sprite(tester('finished')).source, undefined],
  ])
  await clock.advance(SETTLED_MS)
  expect((await spritesOn($, 'desktop'))[1]?.source).toBe(sprite(tester('working')).source)
})

test('picking the role a row already wears leaves it as it is, with no hop', async ($, on) => {
  const { clock } = world(on)
  // An Explore agent is a Scout from its spawn.
  await $.agent.spawn(SPAWN)
  await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
  await clock.advance(SETTLED_MS)
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  await pane.press({ key: 'role-agent-1' })
  await clock.advance(100)
  await pane.select({ key: 'role-pick', value: 'scout' })
  await clock.advance(100)
  await pane.unmount()
  expect((await spritesOn($, 'desktop'))[1]?.source).toBe(sprite({ set: 'classic', role: 'scout', pose: 'working', motion: 'auto' }).source)
})

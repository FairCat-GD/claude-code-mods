import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { SPRITE_SCALE } from '../hooks/config'
import { sprite, squad } from '../hooks/sprites/index'
import { STRINGS } from '../hooks/strings'
import { engine, MOUNT, possums, SURFACES, store } from './engine'
import { SPAWN, STEP, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START } from './fixtures/events'

type Use = { name: string; input: unknown }

// The engine beneath the mod: its panes, the store's settings, a pinned clock, the next agent id for each spawn, and
// each model request answering with the calls queued for it.
function world(on: On, prefs: Record<string, unknown> = {}) {
  engine(on)
  store(on, { prefs: { finishedOpen: true, ...prefs } })
  mock.clock(on, { now: 1_000 })
  let next = 0
  on('agent.spawn', async () => ({ model: 'claude-sonnet-5-5', agentId: `agent-${++next}` }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  const queued: Use[][] = []
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    return { ...STEPPED, turnId: e.turnId, index: e.index, toolUses: queued.shift() ?? [] }
  })
  return (uses: Use[]) => queued.push(uses)
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

test('a row draws its sprite off the terminal, plain until its role settles, then dressed; the terminal draws none', async ($, on) => {
  const queue = world(on)
  await $.agent.spawn(GENERIC)
  await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
  queue([{ name: 'Read', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  const plain = Object.fromEntries(await Promise.all(SURFACES.map(async surface => [surface, await spritesOn($, surface)] as const)))
  queue([{ name: 'Edit', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  for (const surface of SURFACES) {
    const dressed = await spritesOn($, surface)
    if (surface === 'terminal') {
      expect([plain[surface], dressed]).toEqual([[], []])
      continue
    }
    expect(plain[surface]?.map(drawn => drawn.alt)).toEqual([STRINGS.roles.lead, PLAIN_WORKING])
    expect(plain[surface]?.[1]?.source).toBe(sprite({ set: 'classic', pose: 'working', motion: 'auto' }).source)
    expect(dressed[1]?.alt).toBe(STRINGS.sprite.alt(STRINGS.roles.builder, STRINGS.states.working))
    expect(dressed[1]?.source).toBe(sprite({ set: 'classic', role: 'builder', pose: 'working', motion: 'auto' }).source)
    expect([dressed[1]?.width, dressed[1]?.isInteractive]).toEqual([SIZE, true])
  }
})

test('with motion off no sprite in the pane holds an animation element or is framed; on, only a working one (F-21)', async ($, on) => {
  const queue = world(on, { motion: 'off' })
  for (const id of ['agent-1', 'agent-2', 'agent-3']) {
    await $.agent.spawn({ ...GENERIC, tool_use_id: `toolu-${id}`, description: `Sort the ${id} crates` })
    await $.turn.start({ ...TURN_START, agentId: id })
    queue([])
    await step($, id)
  }
  await $.turn.complete({ ...TURN_COMPLETE, agentId: 'agent-3' } as never)
  const still = Object.fromEntries(await Promise.all(SURFACES.map(async surface => [surface, await spritesOn($, surface)] as const)))
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

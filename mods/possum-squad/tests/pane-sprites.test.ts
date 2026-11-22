import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { SPRITE_SCALE } from '../hooks/config'
import { sprite, squad } from '../hooks/sprites/index'
import { STRINGS } from '../hooks/strings'
import { engine, MOUNT, possums, type SURFACES, store } from './engine'
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
async function svgsOn($: Engine, surface: (typeof SURFACES)[number]) {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  const svgs = (await pane.findAll({ type: 'Svg' })).map(svg => svg.props as { alt: string; source: string; width: number; isInteractive?: boolean })
  await pane.unmount()
  return svgs
}

// The terminal draws no sprite: no Svg, and none of the empty Boxes the kit's terminal draws for one.
async function terminalSprites($: Engine) {
  const pane = await $.ui.mount({ ...MOUNT, surface: 'terminal' })
  const elements = await pane.findAll({})
  await pane.unmount()
  return elements.filter(element => element.type === 'Svg' || (element.type === 'Box' && element.children.length === 0)).length
}

const GENERIC = { ...SPAWN, subagentType: 'general-purpose', description: 'Take care of it' }
const SIZE = 32 * SPRITE_SCALE

test('a row draws its sprite on the desktop, plain until its role settles, then dressed; the terminal draws none', async ($, on) => {
  const queue = world(on)
  await $.agent.spawn(GENERIC)
  await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
  queue([{ name: 'Read', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  const plain = await svgsOn($, 'desktop')
  expect(plain.map(svg => svg.alt)).toEqual([STRINGS.roles.lead, STRINGS.sprite.alt(STRINGS.sprite.plain, STRINGS.states.working)])
  expect(plain[1]?.source).toBe(sprite({ set: 'classic', pose: 'working', motion: 'auto' }).source)

  queue([{ name: 'Edit', input: { file_path: 'shed/rack.txt' } }])
  await step($, 'agent-1')
  const dressed = await svgsOn($, 'desktop')
  expect(dressed[1]?.alt).toBe(STRINGS.sprite.alt(STRINGS.roles.builder, STRINGS.states.working))
  expect(dressed[1]?.source).toBe(sprite({ set: 'classic', role: 'builder', pose: 'working', motion: 'auto' }).source)
  expect([dressed[1]?.width, dressed[1]?.isInteractive]).toEqual([SIZE, true])
  expect(await terminalSprites($)).toBe(0)
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
  const still = await svgsOn($, 'desktop')
  expect(still).toHaveLength(4)
  for (const svg of still) expect([svg.alt, /<(animate|set)/.test(svg.source), svg.isInteractive]).toEqual([svg.alt, false, undefined])

  await $.command.run(possums('set motion auto'))
  const moving = await svgsOn($, 'desktop')
  const framed = moving.filter(svg => svg.isInteractive === true).map(svg => svg.alt)
  expect(framed).toEqual([1, 2].map(() => STRINGS.sprite.alt(STRINGS.sprite.plain, STRINGS.states.working)))
  for (const svg of moving.filter(one => one.isInteractive !== true)) expect([svg.alt, svg.source.includes('<animate')]).toEqual([svg.alt, false])
})

test("the Lead's sprite heads the pane on the desktop, and the empty pane draws the squad asleep; the terminal neither", async ($, on) => {
  world(on)
  const svgs = await svgsOn($, 'desktop')
  expect(svgs.map(svg => svg.alt)).toEqual([STRINGS.roles.lead, STRINGS.sprite.squad])
  expect(svgs[0]?.source).toBe(sprite({ set: 'classic', role: 'lead', pose: 'idle', motion: 'auto' }).source)
  expect([svgs[0]?.isInteractive, svgs[1]?.source, svgs[1]?.width]).toEqual([undefined, squad().source, squad().width * SPRITE_SCALE])
  expect(await terminalSprites($)).toBe(0)
})

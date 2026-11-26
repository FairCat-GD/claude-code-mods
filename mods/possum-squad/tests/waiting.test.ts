import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { LIST_ANSWER_MS, NEST_INDENT, TOAST_AFTER_MS } from '../hooks/config'
import { STRINGS } from '../hooks/strings'
import { elapsed } from '../hooks/view/format'
import { engine, MOUNT, POSSUMS, SURFACES, settled, store, turnEnds } from './engine'
import { SPAWN, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START } from './fixtures/events'

type Surface = (typeof SURFACES)[number]
// What the engine's list answers: each agent's status by its id, or a refusal, a throw, or no answer at all.
type Listing = Record<string, string> | 'refuse' | 'throw' | 'hang'

// The engine beneath the mod: its panes, a store that opens no pane by itself and keeps Finished open, a pinned clock,
// agent ids from their tool calls, the toasts shown, and the agent list the test gives, counting its reads.
function world(on: On, prefs: Record<string, unknown> = {}) {
  engine(on)
  store(on, { prefs: { autoOpen: 'never', finishedOpen: true, ...prefs } })
  const clock = mock.clock(on, { now: 1_000 })
  const toasts: string[] = []
  const given = { listed: {} as Listing, reads: 0 }
  on('agent.spawn', (_, e) => ({ model: 'claude-haiku-5-5', agentId: e.tool_use_id.replace('toolu_', 'agent-') }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    return { ...STEPPED, turnId: e.turnId, index: e.index }
  })
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('agent.list', () => {
    given.reads++
    const listing = given.listed
    if (listing === 'refuse') return { deny: 'the fixture refuses the list' }
    if (listing === 'throw') throw new Error('the fixture list throws')
    if (listing === 'hang') return new Promise(() => {}) as never
    return { value: Object.entries(listing).map(([id, status]) => ({ id, status })) } as never
  })
  return { clock, toasts, given }
}

// A general agent whose words settle no role, spawned and working: agent-<n>.
const GENERIC = { ...SPAWN, subagentType: 'general-purpose' }
async function working($: Engine, n: number, description = `Take care of it ${n}`, more: Record<string, unknown> = {}) {
  await $.agent.spawn({ ...GENERIC, tool_use_id: `toolu_${n}`, description, ...more } as never)
  await $.turn.start({ ...TURN_START, agentId: `agent-${n}` })
}
const ends = ($: Engine, n: number, reason = 'answer', answer: string = TURN_COMPLETE.answer) =>
  turnEnds($, { ...TURN_COMPLETE, reason, answer, isAborted: reason === 'aborted', agentId: `agent-${n}` } as never)

// Past a new row's arrival, whose sprite names `starting` while it plays.
const ARRIVED = 3_000

const heading = (section: keyof typeof STRINGS.sections, count: number) => STRINGS.heading(STRINGS.sections[section], count)
const word = STRINGS.states

// What a surface draws: its texts, its sprites' alts, its buttons' labels, and each agent's indent.
async function drawn($: Engine, surface: Surface) {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  const texts = (await pane.findAll({ type: 'Text' })).map(text => text.text)
  const alts = (await pane.findAll({ type: 'Svg' })).map(svg => (svg.props as { alt: string }).alt)
  const buttons = (await pane.findAll({ type: 'Button' })).map(button => (button.props as { label: string }).label)
  const indents: Record<string, unknown> = {}
  for (const id of ['agent-1', 'agent-2']) indents[id] = (await pane.find({ type: 'Box', key: id }))?.props.paddingLeft
  await pane.unmount()
  const count = (text: string) => texts.filter(one => one === text).length
  return { texts, alts, buttons, indents, count }
}

test("a turn's end the list calls waiting leaves the row in Running as waiting, with no ending, no Helper and no toast (F-11)", async ($, on) => {
  const { clock, toasts, given } = world(on)
  await working($, 1)
  await working($, 2, 'Let the compost settle')
  await clock.advance(ARRIVED)
  // A short run with no role, and no call that went to the background.
  given.listed = { 'agent-1': 'waiting', 'agent-2': 'running' }
  await ends($, 1)
  for (const surface of SURFACES) {
    const { texts, alts, buttons, count } = await drawn($, surface)
    expect([surface, count(heading('running', 2)), count(word.waiting), count(word.working)]).toEqual([surface, 1, 1, 1])
    expect(texts).not.toContain(heading('finished', 1))
    // Its role is not settled by an end that was none: no Helper.
    expect(buttons).not.toContain(STRINGS.roles.helper)
    expect([surface, buttons.filter(label => label === STRINGS.picker.pick).length]).toEqual([surface, 2])
    if (surface === 'desktop') expect(alts).toContain(STRINGS.sprite.alt(STRINGS.sprite.plain, word.waiting))
  }
  // A run past T-10, its pane closed: its turn's end that leaves it waiting toasts nothing.
  await clock.advance(TOAST_AFTER_MS)
  given.listed = { 'agent-1': 'waiting', 'agent-2': 'waiting' }
  await ends($, 2)
  expect(toasts).toEqual([])
  for (const surface of SURFACES) expect([surface, (await drawn($, surface)).count(word.waiting)]).toEqual([surface, 2])
})

test('the collapsed view counts a waiting agent among the running', async ($, on) => {
  const { given } = world(on, { collapsed: true })
  await working($, 1)
  await working($, 2)
  given.listed = { 'agent-1': 'waiting' }
  await ends($, 1)
  for (const surface of SURFACES) {
    const { texts } = await drawn($, surface)
    expect([surface, texts.includes('2'), texts.includes(STRINGS.collapsed.running)]).toEqual([surface, true, true])
  }
})

test("a waiting run's next turn puts it back to working", async ($, on) => {
  const { clock, given } = world(on)
  await working($, 1)
  await clock.advance(ARRIVED)
  given.listed = { 'agent-1': 'waiting' }
  await ends($, 1)
  await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
  // A later list that still says waiting, read at another agent's event, holds nothing now.
  await working($, 2)
  await settled()
  for (const surface of SURFACES) {
    const { count } = await drawn($, surface)
    expect([surface, count(word.working), count(word.waiting)]).toEqual([surface, 2, 0])
  }
})

test("with the pane closed, another agent's event reads the list: a waiting run ends with its kept ending, timed through its wait, and toasts (F-11, F-14)", async ($, on) => {
  const { clock, toasts, given } = world(on)
  await working($, 1, 'Water the seedlings')
  await working($, 2, 'Rake the leaves')
  await working($, 3, 'Weigh the pumpkins')
  await clock.advance(ARRIVED)
  given.listed = { 'agent-1': 'waiting', 'agent-2': 'waiting', 'agent-3': 'waiting' }
  await ends($, 1)
  await ends($, 2, 'aborted')
  await ends($, 3, 'error', '')
  await clock.advance(90_000)
  expect(toasts).toEqual([])
  // The list says two ended and no longer lists the third.
  given.listed = { 'agent-1': 'completed', 'agent-2': 'killed' }
  await working($, 4, 'Label the trays')
  await settled()
  const ran = elapsed(ARRIVED + 90_000)
  expect(toasts).toEqual([
    STRINGS.toasts.finished('Water the seedlings', ran),
    STRINGS.toasts.stopped('Rake the leaves', ran),
    // The turn's error is kept through the wait.
    `Weigh the pumpkins · failed after ${ran}: an error`,
  ])
  for (const surface of SURFACES) {
    const { texts, count } = await drawn($, surface)
    expect([surface, count(heading('finished', 3)), count(word.finished), count(word.stopped), count(word.failed)]).toEqual([surface, 1, 1, 1, 1])
    expect([surface, texts.filter(text => text?.endsWith(` · ${ran}`) && !text.startsWith(`${STRINGS.row.context} `)).length]).toEqual([surface, 3])
  }
})

test('with the pane open, the beat reads the list and ends a waiting run as it says, at the time it said so', async ($, on) => {
  const { clock, given } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  await clock.advance(ARRIVED)
  given.listed = { 'agent-1': 'waiting' }
  await ends($, 1)
  await clock.advance(2_000)
  for (const surface of SURFACES) expect([surface, (await drawn($, surface)).count(word.waiting)]).toEqual([surface, 1])
  given.listed = { 'agent-1': 'completed' }
  await clock.advance(1_000)
  await settled()
  for (const surface of SURFACES) {
    const { texts, count } = await drawn($, surface)
    expect([surface, count(word.finished), count(heading('finished', 1))]).toEqual([surface, 1, 1])
    expect([surface, texts.some(text => text?.endsWith(` · ${elapsed(ARRIVED + 3_000)}`))]).toEqual([surface, true])
  }
})

for (const listing of ['refuse', 'throw'] as const) {
  test(`a list that ${listing === 'refuse' ? 'is refused' : 'throws'} ends the run as its turn did: Helper at its end, and a long one's toast`, async ($, on) => {
    const { clock, toasts, given } = world(on)
    await working($, 1)
    await working($, 2, 'Let the compost settle')
    await clock.advance(ARRIVED)
    given.listed = listing
    await ends($, 1)
    for (const surface of SURFACES) {
      const { buttons, count } = await drawn($, surface)
      expect([surface, count(heading('finished', 1)), buttons.includes(STRINGS.roles.helper)]).toEqual([surface, 1, true])
    }
    await clock.advance(TOAST_AFTER_MS)
    await ends($, 2)
    expect(toasts).toEqual([STRINGS.toasts.finished('Let the compost settle', elapsed(ARRIVED + TOAST_AFTER_MS))])
  })
}

test('a list that still says running leaves the turn held as it was; one that never answers ends it at the beat past its bound, a waiting run left be', async ($, on) => {
  const { clock, given } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  await working($, 2)
  await clock.advance(ARRIVED)
  given.listed = { 'agent-1': 'running', 'agent-2': 'waiting' }
  await ends($, 1)
  await ends($, 2)
  const states = async (surface: Surface) => {
    const { count } = await drawn($, surface)
    return [count(word.working), count(word.waiting), count(word.finished)]
  }
  for (const surface of SURFACES) expect([surface, await states(surface)]).toEqual([surface, [1, 1, 0]])
  given.listed = 'hang'
  await clock.advance(LIST_ANSWER_MS - 1_000)
  await settled()
  for (const surface of SURFACES) expect([surface, await states(surface)]).toEqual([surface, [1, 1, 0]])
  await clock.advance(1_000)
  await settled()
  for (const surface of SURFACES) {
    expect([surface, await states(surface)]).toEqual([surface, [0, 1, 1]])
    // Ended at its turn's end, as the turn gave it.
    expect([surface, (await drawn($, surface)).texts.some(text => text?.endsWith(` · ${elapsed(ARRIVED)}`))]).toEqual([surface, true])
  }
  await clock.advance(10_000)
  await settled()
  for (const surface of SURFACES) expect([surface, await states(surface)]).toEqual([surface, [0, 1, 1]])
})

test("a teammate's turn end the list calls idle rests finished, as before", async ($, on) => {
  const { clock, given } = world(on)
  await working($, 1, 'Tend the hives', { isTeammate: true })
  await clock.advance(ARRIVED)
  given.listed = { 'agent-1': 'idle' }
  await ends($, 1, 'answer', '')
  for (const surface of SURFACES) expect([surface, (await drawn($, surface)).count(word.finished)]).toEqual([surface, 1])
})

test('a waiting parent and its working helper both sit in Running, the helper drawn under it (F-24)', async ($, on) => {
  const { clock, given } = world(on)
  await working($, 1, 'Plant the north bed')
  await working($, 2, 'Water the seedlings', { parentAgentId: 'agent-1' })
  await clock.advance(ARRIVED)
  given.listed = { 'agent-1': 'waiting', 'agent-2': 'running' }
  await ends($, 1)
  for (const surface of SURFACES) {
    const { texts, indents } = await drawn($, surface)
    expect([surface, texts.includes(heading('running', 2)), texts.indexOf('Plant the north bed') < texts.indexOf('Water the seedlings')]).toEqual([
      surface,
      true,
      true,
    ])
    expect([surface, indents]).toEqual([surface, { 'agent-1': undefined, 'agent-2': NEST_INDENT }])
  }
})

test('the beat reads the list once a beat, whether a run waits or only works', async ($, on) => {
  const { clock, given } = world(on)
  await $.command.run(POSSUMS)
  await working($, 1)
  await working($, 2)
  // Two working runs: one read a beat, for their summaries.
  await clock.advance(3_000)
  await settled()
  expect(given.reads).toBe(3)
  given.listed = { 'agent-1': 'waiting' }
  await ends($, 1)
  const atEnd = given.reads
  expect(atEnd).toBe(4)
  // A waiting run and a working one: still one read a beat, not one for each.
  await clock.advance(3_000)
  await settled()
  expect(given.reads).toBe(atEnd + 3)
  given.listed = { 'agent-1': 'completed' }
  await clock.advance(1_000)
  await settled()
  expect(given.reads).toBe(atEnd + 4)
  // Agent 2 still works, so the clock beats on, reading once a beat.
  await clock.advance(3_000)
  await settled()
  expect(given.reads).toBe(atEnd + 7)
})

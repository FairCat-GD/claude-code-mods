import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { BOBBING, QUERIED, SPRITE_PX } from '../hooks/sprites/fixture'
import { STRINGS } from '../hooks/strings'
import { FRAMED } from '../hooks/view/spike'
import { engine, MOUNT, POSSUMS, SURFACES } from './engine'
import {
  MEASURE,
  MEASURED,
  PERMISSION,
  PERMITTED,
  SPAWN,
  SPAWNED,
  STEP,
  STEP_CHUNKS,
  STEPPED,
  TOOL_CALL,
  TOOL_CALLED,
  TOOL_CHECK,
  TOOL_CHECKED,
  TURN_COMPLETE,
  TURN_COMPLETED,
  TURN_START,
  TURN_STARTED,
  USAGE,
} from './fixtures/events'

// A check in the main session, so its entry stands apart from the subagent's.
const MAIN_CHECK = { tool: 'Read', input: { file_path: '/fixture/orchard/map.txt' }, tool_use_id: 'toolu_fixture_read' } as const
const WORDS = ['allow', 'ask', 'deny', 'answer', 'aborted', 'error', 'refusal']

const answerUsage = (on: On) => on('session.usage', () => ({ value: USAGE }))

async function ended(stream: AsyncGenerator<unknown, unknown>) {
  while (!(await stream.next()).done) {
    // the chunks are the caller's; only the end matters here
  }
}

async function textsOn(mounted: { findAll: (query: { type: string }) => Promise<{ text: string }[]> }) {
  return (await mounted.findAll({ type: 'Text' })).map(text => text.text)
}

// Every string a fixture holds, and every field name, to tell a value shown from a name shown.
function walk(value: unknown, strings: Set<string>, names: Set<string>) {
  if (typeof value === 'string') strings.add(value)
  else if (Array.isArray(value)) for (const item of value) walk(item, strings, names)
  else if (value !== null && typeof value === 'object')
    for (const [name, field] of Object.entries(value)) {
      names.add(name)
      walk(field, strings, names)
    }
}

test('a spawn shows its brief and description as field names, never as text', async ($, on) => {
  answerUsage(on)
  on('agent.spawn', () => SPAWNED)
  await $.agent.spawn(SPAWN)
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, surface })
    const drawn = JSON.stringify(await pane.drawn())
    expect(drawn).toContain('prompt string')
    expect(drawn).toContain('description string')
    expect(drawn).not.toContain(SPAWN.prompt)
    expect(drawn).not.toContain(SPAWN.description)
    await pane.unmount()
  }
})

test('the test sprites draw where Svg resolves, and the terminal says where to see them', async ($, on) => {
  answerUsage(on)
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, surface })
    const sprites = (await pane.findAll({ type: 'Svg' })).map(svg => svg.props)
    const note = await pane.find({ type: 'Text', text: STRINGS.spike.desktopOnly })
    if (surface === 'terminal') {
      expect(sprites).toEqual([])
      expect(note).toBeDefined()
    } else {
      const drawn = (source: string, isInteractive: boolean) =>
        sprites.filter(props => props.source === source && (props.isInteractive === true) === isInteractive)
      expect(drawn(BOBBING, true)).toHaveLength(FRAMED)
      expect(drawn(BOBBING, false)).toHaveLength(1)
      expect(drawn(QUERIED, true)).toHaveLength(1)
      expect(drawn(QUERIED, false)).toHaveLength(1)
      expect(sprites).toHaveLength(FRAMED + 3)
      for (const props of sprites) expect(props).toMatchObject({ alt: STRINGS.spike.alt, width: SPRITE_PX, height: SPRITE_PX })
      expect(note).toBeUndefined()
    }
    await pane.unmount()
  }
  expect(QUERIED).toContain('@media (prefers-color-scheme: light)')
  expect(QUERIED).toContain('@media (prefers-reduced-motion: reduce)')
  expect(BOBBING).toContain('<animateTransform')
})

test('the pane is redrawn once a mock second while open, never by what it hears, and not once closed', async ($, on) => {
  const clock = mock.clock(on)
  engine(on)
  answerUsage(on)
  on('agent.spawn', () => SPAWNED)
  on('tool.call', () => TOOL_CALLED)
  let redraws = 0
  on('ui.invalidate', (_, e, next) => {
    redraws++
    return next(e)
  })

  await $.agent.spawn(SPAWN)
  await clock.advance(2000)
  expect(redraws).toBe(0)

  await $.command.run(POSSUMS)
  for (let second = 1; second <= 3; second++) {
    await clock.advance(400)
    await $.agent.spawn(SPAWN)
    await $.tool.call(TOOL_CALL)
    await $.agent.spawn(SPAWN)
    await clock.advance(600)
    expect(redraws).toBe(second)
  }
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, surface })
    expect(await textsOn(pane)).toContain(STRINGS.spike.ticks(3))
    await pane.unmount()
  }

  await $.command.run(POSSUMS)
  await clock.advance(5000)
  expect(redraws).toBe(3)
})

test('every hooked event shows its count, its word and who raised it, in field names and types only', async ($, on) => {
  answerUsage(on)
  on('agent.spawn', () => SPAWNED)
  on('turn.start', () => TURN_STARTED)
  on('turn.step', async function* () {
    for (const chunk of STEP_CHUNKS) yield chunk
    return STEPPED
  })
  on('turn.complete', () => TURN_COMPLETED)
  on('tool.call', () => TOOL_CALLED)
  on('tool.check', () => TOOL_CHECKED)
  on('classic.PermissionRequest', () => PERMITTED)
  on('session.measure', () => MEASURED)

  await $.agent.spawn(SPAWN)
  await $.turn.start(TURN_START)
  await ended($.turn.step(STEP))
  await $.tool.check(TOOL_CHECK)
  await $.tool.check(MAIN_CHECK)
  await $.classic.PermissionRequest(PERMISSION)
  await $.tool.call(TOOL_CALL)
  await $.turn.complete(TURN_COMPLETE)
  await $.session.measure(MEASURE)
  await $.tool.check(TOOL_CHECK)

  const raised = [SPAWN, SPAWNED, TURN_START, TURN_STARTED, STEP, STEPPED, TOOL_CHECK, MAIN_CHECK, TOOL_CHECKED, PERMISSION]
  const strings = new Set<string>()
  const names = new Set<string>()
  walk([...raised, PERMITTED, TOOL_CALL, TOOL_CALLED, TURN_COMPLETE, TURN_COMPLETED, MEASURE, MEASURED], strings, names)
  const kinds = MEASURE.rateLimits.map(limit => limit.kind) as string[]
  const hidden = [...strings].filter(value => value !== '' && !WORDS.includes(value) && !kinds.includes(value) && !names.has(value))

  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, surface })
    const texts = await textsOn(pane)
    // The tool call checks itself and asks (#7, #8) before its own result comes back (#9).
    expect(texts.filter(text => text.includes(' · '))).toEqual([
      'agent.spawn · main  ×1  #1–#1',
      'turn.start · subagent  ×1  #2–#2',
      'turn.step · subagent  ×1  #3–#3',
      'turn.complete answer · subagent  ×1  #10–#10',
      'tool.call · subagent  ×1  #9–#9',
      'tool.check ask · main  ×1  #5–#5',
      'tool.check ask · subagent  ×3  #4–#12',
      'classic.PermissionRequest · main  ×1  #6–#6',
      'classic.PermissionRequest · subagent  ×1  #8–#8',
      'session.measure · main  ×1  #11–#11',
    ])
    expect(texts).toContain(STRINGS.spike.input('tool string, input {file_path string}, tool_use_id string'))
    expect(texts).toContain(
      STRINGS.spike.input(
        'context {tokens number, window number, percent number}, rateLimits [{kind string, percentUsed number, resetsAt string}], changed array',
      ),
    )
    expect(texts).toContain(
      STRINGS.spike.result(
        'turnId string, index number, answer string, toolUses [], stopReason string, usage {input_tokens number, output_tokens number, cache_read_input_tokens number, cache_creation_input_tokens number, model string}',
      ),
    )
    const drawn = JSON.stringify(await pane.drawn())
    for (const value of hidden) expect(drawn).not.toContain(value)
    await pane.unmount()
  }
})

test('usage shows the plan limits asked for and the ones last measured', async ($, on) => {
  answerUsage(on)
  on('session.measure', () => MEASURED)
  const showing = async (measured: string) => {
    for (const surface of SURFACES) {
      const pane = await $.ui.mount({ ...MOUNT, surface })
      const texts = await textsOn(pane)
      expect(texts).toContain(STRINGS.spike.asked('five_hour 41.5%, seven_day 7%'))
      expect(texts).toContain(STRINGS.spike.measured(measured))
      await pane.unmount()
    }
  }

  await showing(STRINGS.spike.notMeasured)
  await $.session.measure(MEASURE)
  await showing('five_hour 12%')
  await $.session.measure({ ...MEASURE, rateLimits: [] })
  await showing(STRINGS.spike.noWindows)
})

test('a usage call that fails still draws the pane, and says so', async ($, on) => {
  on('session.usage', () => ({ deny: 'this fixture keeps no ledger' }))
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, surface })
    const texts = await textsOn(pane)
    expect(texts).toContain(STRINGS.spike.asked(STRINGS.spike.unavailable))
    expect(texts).toContain(STRINGS.empty)
    await pane.unmount()
  }
})

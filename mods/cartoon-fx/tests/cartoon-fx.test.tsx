import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { committed, isReviewFix, pushedBranch, testsPassed } from '../hooks/detect'
import { drawFx, FX_MS, textBox } from '../hooks/fx'
import { RED, YELLOW } from '../hooks/zones'
import type { FxKind } from '../types'

const BAND = {
  plugin: 'cartoon-fx',
  component: 'AbovePrompt',
  requestId: 'band',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: true,
    maxRows: 12,
    bodyColumns: 85,
    scroll: { offset: 0, bodyRows: 1 },
    view: {},
  },
} as const

// The conversation row of tool call `id`, standing alone.
const callRow = (id: string, tool = 'Bash') =>
  ({
    plugin: 'cartoon-fx',
    component: 'ToolUse',
    requestId: id,
    props: { tool_use_id: id, tool, input: {}, isRunning: false, isErrored: false, isInterrupted: false },
  }) as const

const PUSHED = {
  stdout: '',
  stderr: 'To github.com:someone/repo.git\n   8577859..5e81772  main -> main\n',
  interrupted: false,
}
const TO = 'To github.com:someone/repo.git'
const REJECTED = { stdout: 'done', stderr: `${TO}\n ! [rejected]        main -> main (fetch first)\nerror: failed to push some refs`, interrupted: false }
// A Bash result as the detection rules read it.
const out = (stdout: string, stderr = '') => ({ stdout, stderr })
const COMMITTED = { stdout: '[main 5e81772] Add squish effect\n 1 file changed', stderr: '', interrupted: false }
const VERIFIED = { stdout: ' Test Files  6 passed (6)\n      Tests  42 passed (42)', stderr: '', interrupted: false }

// Stands in for the engine: every Bash call answers `result`, the context
// window reads `percent`, the store starts as `store`, the transcript holds
// `transcript.messages`, and anything else draws "engine".
function engine(on: Parameters<TestBody>[1], result: object, percent = 10, isError = false, store: Record<string, unknown> = {}) {
  const clock = mock.clock(on, { now: 1000 })
  const usage = { percent }
  const transcript: { messages: object[]; isRefused: boolean } = { messages: [], isRefused: false }
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.messages', () => {
    if (transcript.isRefused) throw new Error('transcript unreadable')

    return { value: transcript.messages as never }
  })
  on('command.register', () => ({ value: { command: 'fx' } }))
  on('store.get', (_, e) => ({ value: store[e.key] }))
  on('store.set', (_, e) => {
    store[e.key] = e.value

    return { value: undefined }
  })
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, percent: usage.percent }, rateLimits: [] } }))
  on('tool.call', () => (isError ? { result, isError: true } : { result }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  return { clock, usage, transcript }
}

// `/fx <args>` as typed at the prompt of a desktop session.
const fx = (args: string) => ({ command: 'fx', args, origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 98 } }) as const

const start = ($: Parameters<TestBody>[0]) => $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

test('a push plays confetti inside its own row, gone once the effect ends', async ($, on) => {
  const { clock } = engine(on, PUSHED)
  await start($)
  const row = await $.ui.mount({ ...callRow('t1'), surface: 'desktop' })
  const other = await $.ui.mount({ ...callRow('t0'), surface: 'desktop' })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await row.find({ type: 'Svg' })).toBeUndefined()

  await $.tool.call({ tool: 'Bash', command: 'git push origin main', tool_use_id: 't1' })
  const svg = await row.find({ type: 'Svg' })
  expect(svg?.props.alt).toBe('Pushed! main')
  expect(String(svg?.props.source)).toContain('Pushed!')
  expect((await row.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine') // the row itself stays
  expect(await other.find({ type: 'Svg' })).toBeUndefined()
  expect(await band.find({ type: 'Svg' })).toBeUndefined()

  await clock.advance(3000)
  expect(await row.find({ type: 'Svg' })).toBeDefined() // the whole drawing, and a little more
  await clock.advance(300)
  expect(await row.find({ type: 'Svg' })).toBeUndefined()
  for (const ui of [row, other, band]) await ui.unmount()
})

test('once the desktop folds the call into a group, the group row plays it', async ($, on) => {
  engine(on, PUSHED)
  await start($)
  await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't2' })
  const call = { tool: 'Bash', input: {}, isRunning: false, isErrored: false, isInterrupted: false }
  const group = (isExpanded: boolean) =>
    ({
      plugin: 'cartoon-fx',
      component: 'ToolGroup',
      requestId: 'group:t1',
      surface: 'desktop',
      props: {
        calls: [
          { ...call, tool_use_id: 't1' },
          { ...call, tool_use_id: 't2' },
        ],
        isActive: false,
        isExpanded,
      },
    }) as const

  const folded = await $.ui.mount(group(false))
  expect((await folded.find({ type: 'Svg' }))?.props.alt).toBe('Pushed! main')
  await folded.unmount()

  const unfolded = await $.ui.mount(group(true)) // its ToolUse rows play it instead
  expect(await unfolded.find({ type: 'Svg' })).toBeUndefined()
  await unfolded.unmount()
})

test('an accepted plan claps the board in its row', async ($, on) => {
  engine(on, { plan: 'Add a red zone', isAgent: false })
  await start($)
  await $.tool.call({ tool: 'ExitPlanMode', tool_use_id: 'plan1' })
  const row = await $.ui.mount({ ...callRow('plan1', 'ExitPlanMode'), surface: 'desktop' })

  expect((await row.find({ type: 'Svg' }))?.props.alt).toBe("Action! let's build!")
  await row.unmount()
})

test('a plan the person turned down plays nothing', async ($, on) => {
  const { clock } = engine(on, { plan: 'Add a red zone', isAgent: false }, 10, true)
  await start($)
  await $.tool.call({ tool: 'ExitPlanMode', tool_use_id: 'plan1' })
  const row = await $.ui.mount({ ...callRow('plan1', 'ExitPlanMode'), surface: 'desktop' })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  await clock.advance(1000)
  expect(await row.find({ type: 'Svg' })).toBeUndefined()
  expect(await band.find({ type: 'Svg' })).toBeUndefined()
  for (const ui of [row, band]) await ui.unmount()
})

test('an effect whose row never draws it moves to the strip', async ($, on) => {
  const { clock } = engine(on, PUSHED)
  await start($)
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't1' })
  expect(await band.find({ type: 'Svg' })).toBeUndefined() // its row should have it
  await clock.advance(900)
  expect((await band.find({ type: 'Svg' }))?.props.alt).toBe('Pushed! main')
  await band.unmount()
})

test('a row scrolled out of view counts as not drawn', async ($, on) => {
  const { clock } = engine(on, PUSHED)
  await start($)
  const offScreen = { ...callRow('t1'), props: { ...callRow('t1').props, onScreen: null } }
  const row = await $.ui.mount({ ...offScreen, surface: 'desktop' })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't1' })
  await clock.advance(900)
  expect((await band.find({ type: 'Svg' }))?.props.alt).toBe('Pushed! main')
  for (const ui of [row, band]) await ui.unmount()
})

test('a commit stamps its hash in its row', async ($, on) => {
  engine(on, COMMITTED)
  await start($)
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "Add squish effect"', tool_use_id: 't1' })
  const row = await $.ui.mount({ ...callRow('t1'), surface: 'desktop' })

  expect((await row.find({ type: 'Svg' }))?.props.alt).toBe('SAVED 5e81772')
  await row.unmount()
})

test('a review-fix commit squashes bugs instead of stamping', async ($, on) => {
  engine(on, { stdout: '[main 976cd29] review: the toast survives an unmount, and 6 smaller', stderr: '', interrupted: false })
  await start($)
  await $.tool.call({ tool: 'Bash', command: 'git commit -F /tmp/msg.txt', tool_use_id: 't1' })
  const row = await $.ui.mount({ ...callRow('t1'), surface: 'desktop' })

  expect((await row.find({ type: 'Svg' }))?.props.alt).toBe('Bugs squashed! review fixes · 976cd29')
  await row.unmount()
})

// What `/code-review` reports when it finishes, or after applying fixes.
const report = (id: string, outcomes: (string | undefined)[]) =>
  ({
    tool: 'ReportFindings',
    tool_use_id: id,
    findings: outcomes.map((outcome, i) => ({ file: 'a.ts', summary: `defect ${i}`, failure_scenario: 'x', ...(outcome ? { outcome } : {}) })),
  }) as never

// The transcript as the engine holds it, one message per block: a thinking
// block, the reply text, then the report's call.
const told = (text: string, id: string) => [
  { role: 'assistant', text: '', toolUses: [] },
  { role: 'assistant', text, toolUses: [] },
  { role: 'assistant', text: '', toolUses: [{ tool_use_id: id, tool: 'ReportFindings', input: {} }] },
]

// A reply's text row in the conversation.
const replyRow = (id: string, text: string) =>
  ({ plugin: 'cartoon-fx', component: 'AssistantMessage', requestId: id, surface: 'desktop', props: { text, isFirstOfReply: true } }) as const

test('a finished code review plays under the reply just before its card; a clean one says so', async ($, on) => {
  const { transcript } = engine(on, { text: 'reported' })
  await start($)
  transcript.messages = told('Here is the review.', 'r1')
  await $.tool.call(report('r1', [undefined, undefined, undefined]))
  const reply = await $.ui.mount(replyRow('m1', 'Here is the review.'))
  const card = await $.ui.mount({ ...callRow('r1', 'ReportFindings'), surface: 'desktop' })
  expect((await reply.find({ type: 'Svg' }))?.props.alt).toBe('Reviewed! 3 findings')
  expect((await reply.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine') // the reply itself stays
  expect(await card.find({ type: 'Svg' })).toBeUndefined()
  for (const ui of [reply, card]) await ui.unmount()

  transcript.messages = told('Nothing to report.', 'r2')
  await $.tool.call(report('r2', []))
  const clean = await $.ui.mount(replyRow('m2', 'Nothing to report.'))
  expect((await clean.find({ type: 'Svg' }))?.props.alt).toBe('Reviewed! no findings, all clear')
  await clean.unmount()
})

test('fixes applied after a review squash bugs under the call before the card, with the exact count; none fixed plays nothing', async ($, on) => {
  const { clock, transcript } = engine(on, { text: 'reported' })
  await start($)
  transcript.messages = [
    { role: 'assistant', text: '', toolUses: [{ tool_use_id: 'e1', tool: 'Edit', input: {} }] },
    { role: 'user', text: '', toolUses: [], toolResults: [{ tool_use_id: 'e1', text: 'edited' }] },
    { role: 'assistant', text: '', toolUses: [{ tool_use_id: 'r1', tool: 'ReportFindings', input: {} }] },
  ]
  await $.tool.call(report('r1', ['fixed', 'skipped', 'fixed']))
  const edit = await $.ui.mount({ ...callRow('e1', 'Edit'), surface: 'desktop' })
  expect((await edit.find({ type: 'Svg' }))?.props.alt).toBe('Bugs squashed! 2 review defects fixed')
  await edit.unmount()
  await clock.advance(4000)

  transcript.messages = told('Applied what I could.', 'r2')
  await $.tool.call(report('r2', ['skipped', 'no_change_needed']))
  const none = await $.ui.mount(replyRow('m2', 'Applied what I could.'))
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await clock.advance(1000)
  expect(await none.find({ type: 'Svg' })).toBeUndefined()
  expect(await band.find({ type: 'Svg' })).toBeUndefined()
  for (const ui of [none, band]) await ui.unmount()
})

test('a findings card does not count as drawn, so a review with no row before it moves to the strip', async ($, on) => {
  const { clock, transcript } = engine(on, { text: 'reported' })
  await start($)
  transcript.messages = [
    { role: 'user', text: '/code-review', toolUses: [] },
    { role: 'assistant', text: '', toolUses: [{ tool_use_id: 'r1', tool: 'ReportFindings', input: {} }] },
  ]
  const card = await $.ui.mount({ ...callRow('r1', 'ReportFindings'), surface: 'desktop' })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  await $.tool.call(report('r1', [undefined]))
  expect(await card.find({ type: 'Svg' })).toBeUndefined()
  expect(await band.find({ type: 'Svg' })).toBeUndefined()
  await clock.advance(900)
  expect((await band.find({ type: 'Svg' }))?.props.alt).toBe('Reviewed! 1 finding')
  for (const ui of [card, band]) await ui.unmount()
})

test('a transcript it cannot read still moves a review to the strip', async ($, on) => {
  const { clock, transcript } = engine(on, { text: 'reported' })
  await start($)
  transcript.isRefused = true
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  await $.tool.call(report('r1', [undefined, undefined]))
  await clock.advance(900)
  expect((await band.find({ type: 'Svg' }))?.props.alt).toBe('Reviewed! 2 findings')
  await band.unmount()
})

test('of two replies with the same words, only the newer one plays the review', async ($, on) => {
  const { transcript } = engine(on, { text: 'reported' })
  await start($)
  const older = await $.ui.mount(replyRow('m1', 'Done.'))
  const newer = await $.ui.mount(replyRow('m2', 'Done.'))

  transcript.messages = told('Done.', 'r1')
  await $.tool.call(report('r1', [undefined]))
  expect(await older.find({ type: 'Svg' })).toBeUndefined()
  expect((await newer.find({ type: 'Svg' }))?.props.alt).toBe('Reviewed! 1 finding')
  for (const ui of [older, newer]) await ui.unmount()
})

test('a review follows a call made beside it, or the text of the message that holds it', async ($, on) => {
  const { clock, transcript } = engine(on, { text: 'reported' })
  await start($)
  transcript.messages = [
    {
      role: 'assistant',
      text: 'Reading, then reporting.',
      toolUses: [
        { tool_use_id: 'g1', tool: 'Grep', input: {} },
        { tool_use_id: 'r1', tool: 'ReportFindings', input: {} },
      ],
    },
  ]
  await $.tool.call(report('r1', [undefined]))
  const grep = await $.ui.mount({ ...callRow('g1', 'Grep'), surface: 'desktop' })
  expect((await grep.find({ type: 'Svg' }))?.props.alt).toBe('Reviewed! 1 finding')
  await grep.unmount()
  await clock.advance(4000)

  transcript.messages = [{ role: 'assistant', text: 'All clear.', toolUses: [{ tool_use_id: 'r2', tool: 'ReportFindings', input: {} }] }]
  await $.tool.call(report('r2', []))
  const reply = await $.ui.mount(replyRow('m3', 'All clear.'))
  expect((await reply.find({ type: 'Svg' }))?.props.alt).toBe('Reviewed! no findings, all clear')
  await reply.unmount()
})

test('under /fx place bottom, a review and its fixes play in the strip', async ($, on) => {
  const { clock, transcript } = engine(on, { text: 'reported' }, 10, false, { placement: 'bottom' })
  await start($)
  const reply = await $.ui.mount(replyRow('m1', 'Here is the review.'))
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  transcript.messages = told('Here is the review.', 'r1')
  await $.tool.call(report('r1', [undefined, undefined]))
  expect(await reply.find({ type: 'Svg' })).toBeUndefined()
  expect((await band.find({ type: 'Svg' }))?.props.alt).toBe('Reviewed! 2 findings')
  await clock.advance(4000)

  transcript.messages = told('Here is the review.', 'r2')
  await $.tool.call(report('r2', ['fixed', 'skipped']))
  expect(await reply.find({ type: 'Svg' })).toBeUndefined()
  expect((await band.find({ type: 'Svg' }))?.props.alt).toBe('Bugs squashed! 1 review defect fixed')
  for (const ui of [reply, band]) await ui.unmount()
})

test('an effect drawn as the 201st row keeps its mark, so it does not replay in the strip', async ($, on) => {
  const { clock } = engine(on, PUSHED)
  await start($)
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  for (let i = 0; i <= 200; i++) {
    await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: `t${i}` })
    const row = await $.ui.mount({ ...callRow(`t${i}`), surface: 'desktop' })
    await row.unmount()
    if (i < 200) await clock.advance(1000)
  }

  await clock.advance(900)
  expect(await band.find({ type: 'Svg' })).toBeUndefined()
  await band.unmount()
})

test("the strip's marks are bounded too: past 200, the oldest row counts as not drawn", async ($, on) => {
  const { clock } = engine(on, PUSHED)
  await start($)
  const strip = await $.ui.mount({ ...BAND, surface: 'terminal' })
  for (let i = 0; i <= 200; i++) {
    await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: `t${i}` })
    await clock.advance(1000)
  }
  await strip.unmount()
  await clock.advance(4000)

  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't0' }) // no row draws it now
  await clock.advance(900)
  expect((await band.find({ type: 'Svg' }))?.props.alt).toBe('Pushed! main')
  await band.unmount()
})

test('a passing verify run shows the checkmark with its count', async ($, on) => {
  engine(on, VERIFIED)
  await start($)
  await $.tool.call({ tool: 'Bash', command: 'npm run verify', tool_use_id: 't1' })
  const row = await $.ui.mount({ ...callRow('t1'), surface: 'desktop' })

  expect((await row.find({ type: 'Svg' }))?.props.alt).toBe('All green! 42 passed')
  await row.unmount()
})

test('a compaction has no row of its own, so it squishes in the strip', async ($, on) => {
  engine(on, {})
  const summary = { role: 'user' as const, text: 'Summary of the work so far', toolUses: [] }
  on('session.compact', () => ({ messages: [summary], tokensBefore: 142318, tokensAfter: 18204 }))
  await start($)
  await $.session.compact({ trigger: 'manual', messages: [summary, { ...summary, role: 'assistant' }] })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  expect((await band.find({ type: 'Svg' }))?.props.alt).toBe('Squished! 142k → 18k tokens')
  await band.unmount()
})

test('subagents started together play once in the Agent row, with their count', async ($, on) => {
  const { clock } = engine(on, {})
  on('agent.spawn', () => ({ model: 'haiku', agentId: 'a1' }))
  await start($)
  const spawn = (description: string) =>
    $.agent.spawn({
      tool_use_id: 'agent1',
      prompt: 'go',
      description,
      subagentType: 'Explore',
      provider: { plugin: 'engine', tier: 'core' },
      parentModel: 'claude-opus-5-5',
      background: false,
      fork: false,
    })
  await Promise.all(['Explore auth', 'Explore UI', 'Plan fix'].map(spawn))
  const row = await $.ui.mount({ ...callRow('agent1', 'Agent'), surface: 'desktop' })
  expect(await row.find({ type: 'Svg' })).toBeUndefined()

  await clock.advance(400)
  expect((await row.find({ type: 'Svg' }))?.props.alt).toBe('×3 helpers!')
  await row.unmount()
})

test('the context gauge plays once on entering the yellow zone, again only after leaving it', async ($, on) => {
  const { clock, usage } = engine(on, { stdout: '', stderr: '', interrupted: false })
  await start($)
  const call = (id: string) => $.tool.call({ tool: 'Bash', command: 'ls', tool_use_id: id })
  const drawnIn = async (id: string) => {
    const row = await $.ui.mount({ ...callRow(id), surface: 'desktop' })
    const alt = (await row.find({ type: 'Svg' }))?.props.alt
    await row.unmount()

    return alt
  }

  await call('t1')
  expect(await drawnIn('t1')).toBeUndefined()

  usage.percent = 76
  await call('t2')
  expect(await drawnIn('t2')).toBe('Yellow zone! context 76% full')
  await clock.advance(4000)

  usage.percent = 81
  await call('t3')
  expect(await drawnIn('t3')).toBeUndefined()

  usage.percent = 30
  await call('t4')
  usage.percent = 77
  await call('t5')
  expect(await drawnIn('t5')).toBe('Yellow zone! context 77% full')
})

test('the red zone plays once past 90%, alone when the yellow was skipped, again only after dropping below 85%', async ($, on) => {
  const { clock, usage } = engine(on, { stdout: '', stderr: '', interrupted: false })
  await start($)
  const call = (id: string) => $.tool.call({ tool: 'Bash', command: 'ls', tool_use_id: id })
  const drawnIn = async (id: string) => {
    const row = await $.ui.mount({ ...callRow(id), surface: 'desktop' })
    const alt = (await row.find({ type: 'Svg' }))?.props.alt
    await row.unmount()

    return alt
  }

  usage.percent = 92 // straight past the yellow
  await call('t1')
  expect(await drawnIn('t1')).toBe('Red zone! context 92% full')
  await clock.advance(4000)

  usage.percent = 95
  await call('t2')
  usage.percent = 88 // down, but not out of the red's reset
  await call('t3')
  usage.percent = 91
  await call('t4')
  for (const id of ['t2', 't3', 't4']) expect(await drawnIn(id)).toBeUndefined()

  usage.percent = 80 // below 85%: the red may play again; still yellow, so no yellow
  await call('t5')
  expect(await drawnIn('t5')).toBeUndefined()
  usage.percent = 93
  await call('t6')
  expect(await drawnIn('t6')).toBe('Red zone! context 93% full')
})

test('/fx all plays every animation in its own output row, one after another', async ($, on) => {
  const { clock } = engine(on, {})
  await start($)

  const ran = await $.command.run(fx('all'))
  expect(ran.text).toBe('playing plan, commit, push, tests, review, fixes, compact, helpers, context, redzone (take 1)')
  const row = await $.ui.mount({
    plugin: 'cartoon-fx',
    component: 'CommandOutput',
    requestId: 'out1',
    surface: 'desktop',
    props: { command: 'fx', args: 'all', text: `cartoon-fx: ${ran.text ?? ''}`, isErrored: false }, // the engine adds the name
  })
  const alt = async () => (await row.find({ type: 'Svg' }))?.props.alt

  expect(await alt()).toBe("Action! let's build!")
  await clock.advance(2600 + 600 + 300)
  expect(await alt()).toBe('SAVED 5e81772')
  await clock.advance(2300 + 600 + 300)
  expect(await alt()).toBe('Pushed! main')
  await row.unmount()
})

test('a second /fx run plays in its own row, not the first one', async ($, on) => {
  engine(on, {})
  await start($)
  const outputRow = (requestId: string, text: string) =>
    $.ui.mount({
      plugin: 'cartoon-fx',
      component: 'CommandOutput',
      requestId,
      surface: 'desktop',
      props: { command: 'fx', args: 'push', text: `cartoon-fx: ${text}`, isErrored: false },
    })

  const first = await $.command.run(fx('push'))
  const second = await $.command.run(fx('tests'))
  expect(second.text).toBe('playing tests (take 2)')
  const firstRow = await outputRow('out1', first.text ?? '')
  const secondRow = await outputRow('out2', second.text ?? '')

  expect(await firstRow.find({ type: 'Svg' })).toBeUndefined()
  expect((await secondRow.find({ type: 'Svg' }))?.props.alt).toBe('All green! 42 passed')
  for (const ui of [firstRow, secondRow]) await ui.unmount()
})

test('/fx names what it has when asked for something else', async ($, on) => {
  engine(on, {})
  await start($)

  const ran = await $.command.run(fx('fireworks'))
  expect(ran.text).toBe('cartoon-fx has no "fireworks". Try: plan, commit, push, tests, review, fixes, compact, helpers, context, redzone or all.')
})

test('/fx place bottom keeps effects in the strip, and is remembered', async ($, on) => {
  const kept: Record<string, unknown> = {}
  engine(on, PUSHED, 10, false, kept)
  await start($)
  const row = await $.ui.mount({ ...callRow('t1'), surface: 'desktop' })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  const ran = await $.command.run(fx('place  Bottom'))
  expect(ran.text).toBe('cartoon-fx: animations play above the prompt box.')
  expect(kept.placement).toBe('bottom')

  await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't1' })
  expect(await row.find({ type: 'Svg' })).toBeUndefined()
  expect((await band.find({ type: 'Svg' }))?.props.alt).toBe('Pushed! main')

  expect((await $.command.run(fx('place conversation'))).text).toBe('cartoon-fx: animations play in the conversation, under what set them off.')
  expect(kept.placement).toBe('conversation')
  for (const ui of [row, band]) await ui.unmount()
})

test('a placement kept from an earlier session is used from the start', async ($, on) => {
  engine(on, PUSHED, 10, false, { placement: 'bottom' })
  await start($)
  await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't1' })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  expect((await band.find({ type: 'Svg' }))?.props.alt).toBe('Pushed! main')
  await band.unmount()
})

test('the svg shows the middle of its drawing box, drawn 3.2 times its size', async ($, on) => {
  engine(on, PUSHED)
  await start($)
  await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't1' })
  const row = await $.ui.mount({ ...callRow('t1'), surface: 'desktop' })

  expect(String((await row.find({ type: 'Svg' }))?.props.source)).toContain('viewBox="90 0 260 190" width="832" height="608"')
  await row.unmount()
})

test('the terminal gets a row of coloured glyphs in the strip instead', async ($, on) => {
  engine(on, PUSHED)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't1' })
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const row = await $.ui.mount({ ...callRow('t1'), surface: 'terminal' })

  expect((await band.find({ type: 'Text', text: /Pushed/ }))?.text).toBe(' Pushed! main ')
  expect((await row.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  for (const ui of [band, row]) await ui.unmount()
})

test('a failed push draws nothing', async ($, on) => {
  engine(on, { ...PUSHED, stderr: '! [rejected] main -> main (fetch first)' }, 10, true)
  await start($)
  await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't1' })
  const row = await $.ui.mount({ ...callRow('t1'), surface: 'desktop' })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  expect(await row.find({ type: 'Svg' })).toBeUndefined()
  expect(await band.find({ type: 'Svg' })).toBeUndefined()
  for (const ui of [row, band]) await ui.unmount()
})

test('a rejected push behind "; echo done" returns no error, and draws nothing', async ($, on) => {
  engine(on, REJECTED)
  await start($)
  await $.tool.call({ tool: 'Bash', command: 'git push origin main; echo done', tool_use_id: 't1' })
  const row = await $.ui.mount({ ...callRow('t1'), surface: 'desktop' })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  expect(await row.find({ type: 'Svg' })).toBeUndefined()
  expect(await band.find({ type: 'Svg' })).toBeUndefined()
  for (const ui of [row, band]) await ui.unmount()
})

test('on the terminal the strip shows a row effect at once, with no replay', async ($, on) => {
  const { clock } = engine(on, PUSHED)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const glyphs = async () => (await band.findAll({ type: 'Text' })).map(text => text.text).join('')

  await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't1' })
  const before = await glyphs()
  expect(before).toContain('Pushed! main')
  await clock.advance(900)
  expect(await glyphs()).toBe(before) // the same drawing, not a fresh one
  await band.unmount()
})

test("a subagent's push plays in the strip straight away", async ($, on) => {
  engine(on, PUSHED)
  await start($)
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 's1', agentId: 'a1' } as never)
  expect((await band.find({ type: 'Svg' }))?.props.alt).toBe('Pushed! main')
  await band.unmount()
})

test('/fx takes are numbered across sessions', async ($, on) => {
  engine(on, {}, 10, false, { fxTakes: 41 })
  await start($)

  expect((await $.command.run(fx('push'))).text).toBe('playing push (take 42)')
})

test('a placement another session stored applies from the next effect', async ($, on) => {
  const kept: Record<string, unknown> = {}
  engine(on, PUSHED, 10, false, kept)
  await start($)
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })

  kept.placement = 'bottom' // `/fx place bottom` in another session
  await $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't1' })
  expect((await band.find({ type: 'Svg' }))?.props.alt).toBe('Pushed! main')
  await band.unmount()
})

test('what counts as a push, a commit and a passing test run', () => {
  expect(pushedBranch('git push origin main', out('', PUSHED.stderr))).toBe('main')
  expect(pushedBranch('git -C app push', out('', `${TO}\n * [new branch]      feat/x -> feat/x`))).toBe('feat/x')
  expect(pushedBranch('git push', { ...out(''), gitOperation: { push: { branch: 'dev' } } })).toBe('dev')
  expect(pushedBranch('git push', out('', 'Everything up-to-date'))).toBeUndefined()
  expect(pushedBranch('git push --dry-run', out('', PUSHED.stderr))).toBeUndefined()
  expect(pushedBranch('git log --oneline', out('a -> b'))).toBeUndefined()
  expect(pushedBranch('git push origin main && git log --oneline -n 3', out('', PUSHED.stderr))).toBe('main')
  expect(pushedBranch('git commit -n -m x && git push', out('', PUSHED.stderr))).toBe('main')
  expect(pushedBranch('git push -n', out('', PUSHED.stderr))).toBeUndefined()
  expect(pushedBranch('git fetch && git push', out('', `From github.com:a/b\n * branch  main -> FETCH_HEAD\n${PUSHED.stderr}`))).toBe('main')

  expect(committed('git commit -m x', out(COMMITTED.stdout))).toEqual({ sha: '5e81772', isAmend: false, subject: 'Add squish effect' })
  expect(committed('git commit -n -m x', out('[main (root-commit) abc1234] x'))).toEqual({ sha: 'abc1234', isAmend: false, subject: 'x' })
  expect(committed('git commit --amend --no-edit', out('[main 9f8e7d6] x'))).toEqual({ sha: '9f8e7d6', isAmend: true, subject: 'x' })
  expect(
    committed('git commit -F msg.txt', {
      ...out('[main 976cd29] review: the toast survives, and 6 smaller'),
      gitOperation: { commit: { sha: '976cd29f00', kind: 'committed' } },
    }),
  ).toEqual({ sha: '976cd29', isAmend: false, subject: 'review: the toast survives, and 6 smaller' })

  expect(isReviewFix('review: a malformed journal line no longer blocks calls, and 9 smaller')).toBe(true)
  expect(isReviewFix('fix: architecture review II: a panic beside a refresh halts with a note')).toBe(true)
  expect(isReviewFix('fix: Electron 44.9, with the Chromium and Node fixes')).toBe(false)
  expect(isReviewFix('docs: close round 4')).toBe(false)
  expect(isReviewFix('Add a code review checklist to the docs')).toBe(false)
  expect(committed('git commit -m x', out('nothing to commit, working tree clean'))).toBeUndefined()

  expect(testsPassed('npm run verify', out(VERIFIED.stdout))).toBe('42 passed')
  expect(testsPassed('cargo xtask verify', out('test result: ok. 12 passed; 0 failed'))).toBe('12 passed')
  expect(testsPassed('npm test 2>&1 | tail -5', out('Tests  3 failed | 39 passed (42)'))).toBeUndefined()
  expect(testsPassed('claude plugin test .', out('(pass) a\n(fail) b\n 1 pass\n 1 fail'))).toBeUndefined()
  expect(testsPassed('claude plugin test .', out('(pass) a failed push draws nothing\n 9 pass\n 0 fail'))).toBe('9 passed')
  expect(testsPassed('ls tests', out('a.test.ts'))).toBeUndefined()
  expect(testsPassed('cd app && CI=1 npm test', out(VERIFIED.stdout))).toBe('42 passed')
  expect(testsPassed('(cd app && npm test)', out(VERIFIED.stdout))).toBe('42 passed')
  expect(testsPassed('uv run pytest -q', out('12 passed in 0.31s'))).toBe('12 passed')
  expect(testsPassed('python -m pytest', out('12 passed in 0.31s'))).toBe('12 passed')
  expect(testsPassed('pnpm vitest run', out(VERIFIED.stdout))).toBe('42 passed')
  expect(testsPassed('npx playwright test', out('  5 passed (3.1s)'))).toBe('5 passed')
})

test('a test run needs its runner at the start of a part, and a pass in its output', () => {
  const passing = out(VERIFIED.stdout)

  // Wrappers, launchers and their flags before the runner.
  expect(testsPassed('npm test 2>&1 | tail -5', passing)).toBe('42 passed')
  expect(testsPassed('timeout 600 npm test', passing)).toBe('42 passed')
  expect(testsPassed('{ npm test; } 2>&1 | tail -20', passing)).toBe('42 passed')
  expect(testsPassed('bash -c "npm test"', passing)).toBe('42 passed')
  expect(testsPassed('NODE_OPTIONS="--max-old-space-size=4096 --no-warnings" npm test', passing)).toBe('42 passed')
  expect(testsPassed('npx -y vitest run', passing)).toBe('42 passed')
  expect(testsPassed('pnpm --filter app vitest', passing)).toBe('42 passed')
  expect(testsPassed('bun run vitest', passing)).toBe('42 passed')
  expect(testsPassed('uvx pytest', passing)).toBe('42 passed')
  expect(testsPassed('./node_modules/.bin/jest', passing)).toBe('42 passed')

  // A command that only names a runner is no run, whatever it prints.
  expect(testsPassed('cat jest-results.txt', passing)).toBeUndefined()
  expect(testsPassed('grep -r pytest ci.log', out('ci.log: 12 passed in 0.31s'))).toBeUndefined()
  expect(testsPassed('npx playwright show-report', out('  5 passed (3.1s)'))).toBeUndefined()
  expect(testsPassed('ls\njest.config.js', passing)).toBeUndefined()

  // A run counts only when its output says it passed.
  expect(testsPassed('go test ./...', out('ok  \texample.com/app\t0.012s'))).toBe('')
  expect(testsPassed('swift test', out('Executed 12 tests, with 0 failures (0 unexpected)'))).toBe('')
  expect(testsPassed('npm test', out(''))).toBeUndefined()
  expect(testsPassed('cat <<EOF\npytest is slow\nEOF', out('pytest is slow'))).toBeUndefined()
})

test("a push counts on git's ref line under its To line, or on the engine's report where git printed none", () => {
  const ref = (line: string) => out('', `${TO}\n${line}`)

  // A ref line under To plays, whatever else the output holds.
  expect(
    pushedBranch('git push && git push --tags', {
      ...ref('   8577859..5e81772  main -> main\nEverything up-to-date'),
      gitOperation: { push: { branch: 'main' } },
    }),
  ).toBe('main')
  expect(pushedBranch('git push && git push --tags', ref('   8577859..5e81772  main -> main\nEverything up-to-date'))).toBe('main')

  // A tag the engine leaves out plays by its name.
  expect(pushedBranch('git push --tags', ref(' * [new tag]         v1.2.0 -> v1.2.0'))).toBe('v1.2.0')

  // Rejected, up to date, or with no To line: nothing was pushed.
  expect(pushedBranch('git push origin main; echo done', REJECTED)).toBeUndefined()
  expect(pushedBranch('git push -v', ref(' = [up to date]      main -> main'))).toBeUndefined()
  expect(pushedBranch('git push origin main dev', ref(' ! [rejected]        main -> main (fetch first)\n   8577859..5e81772  dev -> dev'))).toBe('dev')
  expect(pushedBranch('git push -q && git log --decorate -1', out('5e81772 (HEAD -> main, origin/main) x'))).toBeUndefined()

  // The engine also takes a pull's fetched line for the push: git's own report outranks it.
  const pulled = `From github.com:someone/repo\n   1a2b3c4..8577859  main       -> origin/main\n`
  const engineSays = { gitOperation: { push: { branch: 'origin/main' } } }
  expect(pushedBranch('git pull && git push', { ...out('', `${pulled}Everything up-to-date`), ...engineSays })).toBeUndefined()
  expect(pushedBranch('git pull && git push', { ...out('', `${pulled}${REJECTED.stderr}`), ...engineSays })).toBeUndefined()
  expect(pushedBranch('git pull && git push', { ...out('', `${pulled}${TO}\n   8577859..5e81772  main -> main`), ...engineSays })).toBe('main')
})

test('the git subcommand is the first word after git and its global options', () => {
  const pushed = out('', `${TO}\n   8577859..5e81772  main -> main`)

  expect(pushedBranch('git log --decorate --grep=push -3', out('5e81772 (HEAD -> main, origin/main) x'))).toBeUndefined()
  expect(pushedBranch("git commit -m 'fix push'", out('[main 5e81772] fix push\n rename a.ts -> b.ts (100%)'))).toBeUndefined()
  expect(pushedBranch('git status -sb # check before push', out('R  old.ts -> new.ts'))).toBeUndefined()

  // The log's `-n` is not the push's dry run.
  expect(pushedBranch('git log --grep=push -n 5 && git push origin main', pushed)).toBe('main')
  expect(pushedBranch('git -C "my app" push', pushed)).toBe('main')
  expect(pushedBranch('git --git-dir=.git --no-pager push', pushed)).toBe('main')
  expect(committed('git -c user.name=someone commit -m x', out('[main 5e81772] x'))).toEqual({ sha: '5e81772', isAmend: false, subject: 'x' })
  expect(committed('git --no-pager commit -m x', out('[main 5e81772] x'))).toEqual({ sha: '5e81772', isAmend: false, subject: 'x' })
  expect(committed('git log -1 --format="[main 5e81772] %s" # the last commit', out('[main 5e81772] x'))).toBeUndefined()
})

test('a commit on a detached HEAD counts, and a cherry-pick is no commit', () => {
  expect(committed('git commit -m x', out('[detached HEAD 5e81772] x'))).toEqual({ sha: '5e81772', isAmend: false, subject: 'x' })
  expect(committed('git commit -m x', { ...out('[detached HEAD 5e81772] x'), gitOperation: { commit: { sha: '5e81772ab', kind: 'committed' } } })).toEqual({
    sha: '5e81772',
    isAmend: false,
    subject: 'x',
  })

  expect(committed('git cherry-pick 1a2b3c4', out('[main 5e81772] x'))).toBeUndefined()
  expect(
    committed('git cherry-pick 1a2b3c4', { ...out('[main 5e81772] x'), gitOperation: { commit: { sha: '5e81772ab', kind: 'cherry-picked' } } }),
  ).toBeUndefined()
})

test('more runners count, each by what it prints for a pass', () => {
  expect(testsPassed('node --test "tests/*.test.ts"', out('✔ adds (0.07ms)\nℹ tests 48\nℹ suites 0\nℹ pass 48\nℹ fail 0\nℹ cancelled 0'))).toBe('48 passed')
  expect(testsPassed('node --test-reporter=tap --test', out('# tests 48\n# pass 48\n# fail 0'))).toBe('48 passed')
  expect(testsPassed('bundle exec rspec', out('Finished in 0.4 seconds\n12 examples, 0 failures, 1 pending'))).toBe('')
  expect(testsPassed('dotnet test', out('Passed!  - Failed:     0, Passed:    12, Skipped:     0, Total:    12 - App.Tests.dll'))).toBe('12 passed')
  expect(testsPassed('dotnet test', out('Test summary: total: 12, failed: 0, succeeded: 12, skipped: 0'))).toBe('12 passed')
  expect(testsPassed('./gradlew test', out('> Task :test\n\nBUILD SUCCESSFUL in 4s'))).toBe('')
  expect(testsPassed('gradle --no-daemon :app:test', out('BUILD SUCCESSFUL in 4s'))).toBe('')
  expect(testsPassed('mvn -q clean test', out('[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0\n[INFO] BUILD SUCCESS'))).toBe('')
  expect(testsPassed("xcodebuild -scheme App -destination 'platform=macOS' test", out('** TEST SUCCEEDED **'))).toBe('')
  expect(testsPassed('vendor/bin/phpunit', out('OK (12 tests, 30 assertions)'))).toBe('')
  expect(testsPassed('mix test', out('Finished in 0.1 seconds\n1 doctest, 12 tests, 0 failures'))).toBe('')

  expect(testsPassed('node app.js', out('ℹ pass 48'))).toBeUndefined()
  expect(testsPassed('xcodebuild -scheme App build', out('** BUILD SUCCEEDED **'))).toBeUndefined()
  expect(testsPassed('mvn test-compile', out('[INFO] BUILD SUCCESS'))).toBeUndefined()
})

test("a failure plays nothing, and a FAIL mark counts only at a line's start", () => {
  expect(testsPassed('npm test', out('   ✓ src/badge.test.ts > shows FAIL badge\n Test Files  1 passed (1)\n      Tests  12 passed (12)'))).toBe('12 passed')
  expect(testsPassed('npm test 2>&1 | tail', out(' FAIL  src/badge.test.ts > shows a badge\n      Tests  12 passed (12)'))).toBeUndefined()

  expect(testsPassed('node --test', out('ℹ tests 3\nℹ pass 2\nℹ fail 1'))).toBeUndefined()
  expect(testsPassed('bundle exec rspec', out('12 examples, 1 failure'))).toBeUndefined()
  expect(testsPassed('dotnet test', out('Failed!  - Failed:     1, Passed:    11, Skipped:     0, Total:    12'))).toBeUndefined()
  expect(testsPassed('dotnet test', out('Test summary: total: 12, failed: 1, succeeded: 11, skipped: 0'))).toBeUndefined()
  expect(testsPassed('./gradlew test | tail', out('12 tests completed, 1 failed\n\nBUILD FAILED in 4s'))).toBeUndefined()
  expect(testsPassed('mvn test | tail', out('[ERROR] Tests run: 12, Failures: 0, Errors: 1, Skipped: 0\n[INFO] BUILD FAILURE'))).toBeUndefined()
  expect(testsPassed('xcodebuild test -scheme App | tail', out('** TEST FAILED **'))).toBeUndefined()
  expect(testsPassed('phpunit | tail', out('FAILURES!\nTests: 12, Assertions: 30, Failures: 1.'))).toBeUndefined()
  expect(testsPassed('mix test | tail', out('12 tests, 1 failure'))).toBeUndefined()
  expect(testsPassed('claude plugin test . | tail -2', out(' 49 pass\n 1 fail'))).toBeUndefined()
  expect(testsPassed('npm run verify 2>&1 | tail -3', out('      Tests  42 passed (42)\ncartoon-fx: lint  FAIL\nverify: FAIL'))).toBeUndefined()
})

test('quotes, heredocs and comments keep a command whole', () => {
  const passing = out(' Test Files  1 passed (1)\n      Tests  42 passed (42)')

  expect(testsPassed('cat <<EOF\npytest is slow\nEOF', passing)).toBeUndefined()
  expect(testsPassed("cat <<-'EOF' > notes.md\n\tnpm test; then ship\n\tEOF", passing)).toBeUndefined()
  expect(testsPassed('echo "first; npm test"', passing)).toBeUndefined()
  expect(testsPassed("printf 'a | pytest'", passing)).toBeUndefined()
  expect(testsPassed('ls # and then; npm test', passing)).toBeUndefined()

  const message = `git commit -m "$(cat <<'EOF'\nfix: the "push" step; then git push\nEOF\n)"`
  expect(committed(message, out('[main 5e81772] fix: the "push" step'))).toEqual({ sha: '5e81772', isAmend: false, subject: 'fix: the "push" step' })
  expect(pushedBranch(message, out('[main 5e81772] x', `${TO}\n   8577859..5e81772  main -> main`))).toBeUndefined()

  // What the shell still runs as a command of its own.
  expect(testsPassed('bash -c "cd app && npm test"', passing)).toBe('42 passed')
  expect(testsPassed("sh -c 'cd app; pytest -q'", out('12 passed in 0.31s'))).toBe('12 passed')
  expect(testsPassed('npm test \\\n  -- --coverage', passing)).toBe('42 passed')
  expect(testsPassed('cat <<EOF > notes.md\nsome notes\nEOF\nnpm test', passing)).toBe('42 passed')
  expect(testsPassed('cat <<\\EOF > notes.md\nsome $notes\nEOF\nnpm test', passing)).toBe('42 passed')
  expect(testsPassed('n=$((1<<4))\nnpm test', passing)).toBe('42 passed')
})

// ---- the drawings, read back from drawFx's output -------------------------

// One element of a drawing: drawFx writes well-formed markup with
// double-quoted attributes and no comments.
type El = { tag: string; attrs: Record<string, string>; children: El[]; text: string; parent?: El }

function parse(svg: string): El {
  const root: El = { tag: '#root', attrs: {}, children: [], text: '' }
  let at = root
  for (const [, close, tag, attrs, selfClosing, text] of svg.matchAll(/<(\/?)([\w-]+)([^>]*?)(\/?)>|([^<]+)/g)) {
    if (text !== undefined) {
      at.text += text
    } else if (close) {
      at = at.parent ?? root
    } else {
      const pairs = [...(attrs ?? '').matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1] ?? '', m[2] ?? ''] as const)
      const el: El = { tag: tag ?? '', attrs: Object.fromEntries(pairs), children: [], text: '', parent: at }
      at.children.push(el)
      if (!selfClosing) at = el
    }
  }

  return root
}

const all = (el: El): El[] => [el, ...el.children.flatMap(all)]
const named = (el: El, cls: string) => all(el).filter(e => e.attrs.class === cls)
const nums = (s = '') => [...s.matchAll(/-?\d+(?:\.\d+)?/g)].map(m => Number(m[0]))
const seconds = (s = '') => Number.parseFloat(s)
const unescapeXml = (s: string) => s.replace(/&(amp|lt|gt|quot|apos);/g, (_, e: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[e] ?? e)

// 2D affine matrices, [a b c d e f] as SVG writes them.
type M = [number, number, number, number, number, number]
const ID: M = [1, 0, 0, 1, 0, 0]
const mul = (m: M, k: M): M => [
  m[0] * k[0] + m[2] * k[1],
  m[1] * k[0] + m[3] * k[1],
  m[0] * k[2] + m[2] * k[3],
  m[1] * k[2] + m[3] * k[3],
  m[0] * k[4] + m[2] * k[5] + m[4],
  m[1] * k[4] + m[3] * k[5] + m[5],
]
const apply = (m: M, [x, y]: readonly [number, number]): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]

function step(kind: string, v: number[]): M {
  if (kind === 'translate') return [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0]
  if (kind === 'scale') return [v[0] ?? 1, 0, 0, v[1] ?? v[0] ?? 1, 0, 0]
  const a = ((v[0] ?? 0) * Math.PI) / 180
  const [cx = 0, cy = 0] = v.slice(1)

  return mul(mul([1, 0, 0, 1, cx, cy], [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]), [1, 0, 0, 1, -cx, -cy])
}

const transform = (s = ''): M => [...s.matchAll(/(translate|scale|rotate)\(([^)]*)\)/g)].reduce((m, [, kind, v]) => mul(m, step(kind ?? '', nums(v))), ID)

// An element's own transform where it lands, at its largest: an animated
// translate at its last value, an animated scale at its peak on each axis.
function own(el: El): M {
  const motion = el.children.find(child => child.tag === 'animateTransform')
  const values = (motion?.attrs.values ?? '').split(';').map(v => nums(v))
  if (motion?.attrs.type === 'translate') return step('translate', values.at(-1) ?? [])
  if (motion?.attrs.type === 'scale') {
    return step('scale', [Math.max(...values.map(v => v[0] ?? 1)), Math.max(...values.map(v => v[1] ?? v[0] ?? 1))])
  }

  return transform(el.attrs.transform)
}
// From `top`'s frame (the view's, by default) down to `el`'s.
const toView = (el: El, top?: El): M => (el === top || el.parent === undefined ? ID : mul(toView(el.parent, top), own(el)))

// A shape's corners in its own units, its stroke included; a text's from the
// same estimate the drawing fits its words by.
function corners(el: El): [number, number][] {
  const at = (key: string) => Number(el.attrs[key] ?? 0)
  const half = at('stroke-width') / 2
  const box = (x1: number, y1: number, x2: number, y2: number): [number, number][] => [
    [Math.min(x1, x2) - half, Math.min(y1, y2) - half],
    [Math.max(x1, x2) + half, Math.min(y1, y2) - half],
    [Math.min(x1, x2) - half, Math.max(y1, y2) + half],
    [Math.max(x1, x2) + half, Math.max(y1, y2) + half],
  ]
  if (el.tag === 'rect') return box(at('x'), at('y'), at('x') + at('width'), at('y') + at('height'))
  if (el.tag === 'circle') return box(at('cx') - at('r'), at('cy') - at('r'), at('cx') + at('r'), at('cy') + at('r'))
  if (el.tag === 'line') return box(at('x1'), at('y1'), at('x2'), at('y2'))
  if (el.tag === 'text') {
    const size = at('font-size')
    const { width, top, bottom } = textBox(unescapeXml(el.text), size, {
      spacing: at('letter-spacing'),
      stroke: at('stroke-width'),
      isCentred: el.attrs['dominant-baseline'] !== undefined,
    })
    return [-width / 2, width / 2].flatMap(x => [at('y') + top, at('y') + bottom].map(y => [x, y] as [number, number]))
  }

  return []
}

// The part of the drawing box the svg shows.
function viewOf(root: El) {
  const [x = 0, y = 0, width = 0, height = 0] = nums(all(root).find(e => e.tag === 'svg')?.attrs.viewBox)

  return { left: x, top: y, right: x + width, bottom: y + height }
}
const outside = (view: ReturnType<typeof viewOf>, [x, y]: [number, number]) => x < view.left || x > view.right || y < view.top || y > view.bottom

// Every kind, with the longest words the mod gives it, and its values' extremes.
const LONG_BRANCH = 'feature/a-very-long-branch-name-that-keeps-going-on-and-on'
const DRAWN: [FxKind, string, string, number][] = [
  ['plan', 'Action!', "let's build!", 0],
  ['commit', 'SAVED', '5e81772', 0],
  ['commit', 'AMENDED', '9f8e7d6', 0],
  ['push', 'Pushed!', 'main', 0],
  ['push', 'Pushed!', LONG_BRANCH, 0],
  ['tests', 'All green!', '123456 passed', 0],
  ['tests', 'All green!', '', 0],
  ...[0, 1, 4, 12].map((n): [FxKind, string, string, number] => ['review', 'Reviewed!', n === 0 ? 'no findings, all clear' : `${n} findings`, n]),
  ['fixes', 'Bugs squashed!', '12 review defects fixed', 12],
  ['fixes', 'Bugs squashed!', 'review fixes · 976cd29', 0],
  ['compact', 'Squished!', '1423k → 182k tokens', 0],
  ['helpers', 'Helper out!', 'Map every caller of the parser an…', 1],
  ...[0, 5, 9].map((n): [FxKind, string, string, number] => ['helpers', `×${n} helpers!`, '', n]),
  ...[-5, 0, 76, 100, 140].map((n): [FxKind, string, string, number] => ['context', 'Yellow zone!', `context ${n}% full`, n]),
  ...[92, 100, 140].map((n): [FxKind, string, string, number] => ['redzone', 'Red zone!', `context ${n}% full`, n]),
]

test('every drawing, of every kind and its extremes, stays under the Svg cap', () => {
  const kinds = new Set(DRAWN.map(([kind]) => kind))
  expect([...kinds].sort()).toEqual(Object.keys(FX_MS).sort())

  const over = DRAWN.map(([kind, title, subtitle, value]) => ({ kind, value, length: drawFx(kind, 1000, title, subtitle, value).length }))
  expect(over.filter(drawing => drawing.length > 131072)).toEqual([])
})

test('every label stays inside the view at its peak, the longest words of every kind included', () => {
  const clipped = DRAWN.flatMap(([kind, title, subtitle, value]) => {
    const root = parse(drawFx(kind, 1000, title, subtitle, value))
    const view = viewOf(root)
    const labels = named(root, 'label')
    expect(labels.length).toBeGreaterThan(0)

    return labels.flatMap(label =>
      all(label)
        .filter(e => e.tag === 'text')
        .filter(text => corners(text).some(corner => outside(view, apply(toView(text), corner))))
        .map(text => `${kind}: ${text.text}`),
    )
  })
  expect(clipped).toEqual([])

  // Too long even at the smallest size, the words are cut, and say so.
  const [label] = named(parse(drawFx('push', 1000, 'Pushed!', LONG_BRANCH)), 'label')
  const branch = all(label ?? parse('')).find(e => e.tag === 'text' && e.attrs.y !== undefined)?.text ?? ''
  expect(branch.endsWith('…')).toBe(true)
  expect(LONG_BRANCH.startsWith(branch.slice(0, -1))).toBe(true)
})

test("the review's magnifying glass stays inside the view along its whole path", () => {
  for (const findings of [0, 1, 3, 4, 12]) {
    const root = parse(drawFx('review', 1000, 'Reviewed!', `${findings} findings`, findings))
    const view = viewOf(root)
    const [lens] = named(root, 'lens')
    const path = (lens?.children.find(e => e.tag === 'animateMotion')?.attrs.values ?? '').split(';').map(point => nums(point))
    expect(path.length).toBeGreaterThan(2)
    const parts = all(lens ?? root).filter(e => e.tag === 'circle' || e.tag === 'line')
    expect(parts.length).toBeGreaterThan(0)

    // The motion moves the lens within its own frame: after its translate, before what it holds.
    const out = path.flatMap(([dx = 0, dy = 0]) => {
      const moved = mul(toView(lens ?? root), step('translate', [dx, dy]))
      return parts.flatMap(part => corners(part).map(corner => apply(mul(moved, toView(part, lens)), corner))).filter(point => outside(view, point))
    })
    expect(out).toEqual([])
  }
})

test("the review's marks never overlap, even at their peak", () => {
  for (let findings = 1; findings <= 12; findings++) {
    const marks = named(parse(drawFx('review', 1000, 'Reviewed!', `${findings} findings`, findings)), 'mark').map(mark => {
      const dot = all(mark).find(e => e.tag === 'circle')
      const m = toView(dot ?? mark)
      const [x, y] = apply(m, [Number(dot?.attrs.cx ?? 0), Number(dot?.attrs.cy ?? 0)])

      return { x, y, r: (Number(dot?.attrs.r ?? 0) + Number(dot?.attrs['stroke-width'] ?? 0) / 2) * Math.hypot(m[0], m[1]) }
    })
    expect(marks).toHaveLength(Math.min(findings, 4))
    const touching = marks.flatMap((a, i) => marks.slice(i + 1).filter(b => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r))
    expect(touching).toEqual([])
  }
})

test("the gauge's bands change colour where the zones start", () => {
  for (const [kind, percent] of [
    ['context', 76],
    ['redzone', 92],
  ] as const) {
    const root = parse(drawFx(kind, 1000, 'Zone!', '', percent))
    const [x0 = 0, y0 = 0] = nums(/translate\(([^)]*)\)/.exec(named(root, 'needle')[0]?.attrs.transform ?? '')?.[1])
    const at = (x = 0, y = 0) => Math.round(1000 * (1 - Math.atan2(y0 - y, x - x0) / Math.PI)) / 10
    const edges = named(root, 'band').map(band => {
      const [x1, y1, , , , , , x2, y2] = nums(band.attrs.d)
      return [at(x1, y1), at(x2, y2)]
    })
    expect(edges).toEqual([
      [0, YELLOW],
      [YELLOW, RED],
      [RED, 100],
    ])
  }
})

test('a puff of smoke shrinks away whole: no circle in it fades on its own', () => {
  const puffs = DRAWN.flatMap(([kind, title, subtitle, value]) => named(parse(drawFx(kind, 1000, title, subtitle, value)), 'puff'))
  expect(puffs.length).toBeGreaterThan(10)

  const circles = puffs.flatMap(puff => all(puff).filter(e => e.tag === 'circle'))
  const fading = circles.filter(circle => circle.children.some(child => child.attrs.attributeName === 'opacity'))
  const staying = circles.filter(circle => nums(circle.children.find(child => child.attrs.attributeName === 'r')?.attrs.values).at(-1) !== 0)
  expect({ fading: fading.length, staying: staying.length }).toEqual({ fading: 0, staying: 0 })
})

test('the helpers land inside the view, in front of the smoke, and stay until the label goes', () => {
  for (const count of [1, 2, 3, 4, 5, 9]) {
    const root = parse(drawFx('helpers', 1000, `×${count} helpers!`, '', count))
    const view = viewOf(root)
    const order = all(root)
    const helpers = named(root, 'helper')
    expect(helpers).toHaveLength(Math.min(count, 5))

    const smoke = named(root, 'puff').flatMap(all)
    expect(Math.max(...smoke.map(e => order.indexOf(e)))).toBeLessThan(Math.min(...helpers.map(e => order.indexOf(e))))

    const out = helpers.flatMap(helper =>
      all(helper)
        .filter(e => e.tag === 'rect')
        .flatMap(rect => corners(rect).map(corner => apply(toView(rect), corner)))
        .filter(point => outside(view, point)),
    )
    expect(out).toEqual([])

    // The label's fade starts at the end of its hold; each helper's no earlier.
    const fadeOf = (el: El | undefined) => {
      const fade = el?.children.find(child => child.attrs.attributeName === 'opacity')
      const holds = nums(fade?.attrs.keyTimes).at(-2) ?? 0
      return seconds(fade?.attrs.begin) + seconds(fade?.attrs.dur) * holds
    }
    const label = fadeOf(named(root, 'label')[0]?.parent)
    for (const helper of helpers) expect(fadeOf(helper)).toBeGreaterThanOrEqual(label)
  }
})

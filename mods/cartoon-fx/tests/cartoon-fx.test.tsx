import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { committed, isReviewFix, pushedBranch, testsPassed } from '../hooks/detect'

const BAND = {
  plugin: 'cartoon-fx',
  component: 'AbovePrompt',
  requestId: 'band',
  props: {
    hasSurvey: false,
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

test('the svg shows the middle of its drawing box, drawn twice the 0.5 size', async ($, on) => {
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
  const out = (stdout: string, stderr = '') => ({ stdout, stderr })

  expect(pushedBranch('git push origin main', out('', PUSHED.stderr))).toBe('main')
  expect(pushedBranch('git -C app push', out('', ' * [new branch]      feat/x -> feat/x'))).toBe('feat/x')
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

  // A command that only names a runner runs no tests.
  expect(testsPassed('cat jest.config.js', out(''))).toBeUndefined()
  expect(testsPassed('npm ls vitest', out('app@1.0.0\n└── vitest@3.2.4'))).toBeUndefined()
  expect(testsPassed('grep -r pytest .', out('setup.cfg:addopts = pytest'))).toBeUndefined()
  expect(testsPassed('npx playwright install', out('Downloading Chromium 140.0'))).toBeUndefined()
})

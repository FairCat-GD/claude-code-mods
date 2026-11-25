import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { STRINGS } from '../hooks/strings'
import { engine, MOUNT, POSSUMS, SURFACES, store, turnEnds } from './engine'
import { SPAWN, STEP, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START } from './fixtures/events'

type Surface = (typeof SURFACES)[number]
type Use = { name: string; input: unknown }

// The engine beneath the mod: its panes, a store, a pinned clock, the next agent id for each spawn, and each model
// request answering with the calls queued for it.
function world(on: On) {
  engine(on)
  const kept = store(on, { prefs: { finishedOpen: true } })
  const clock = mock.clock(on, { now: 1_000 })
  let next = 0
  on('agent.spawn', async () => ({ model: 'claude-haiku-5-5', agentId: `agent-${++next}` }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  const queued: Use[][] = []
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    return { ...STEPPED, turnId: e.turnId, index: e.index, toolUses: queued.shift() ?? [] }
  })
  return { kept, clock, queue: (uses: Use[]) => queued.push(uses) }
}

let spawned = 0
const spawn = ($: Engine, fields: { description: string; prompt?: string }) =>
  $.agent.spawn({ ...SPAWN, tool_use_id: `toolu_peek_${++spawned}`, subagentType: 'general-purpose', ...fields })

async function drain(stream: AsyncGenerator<unknown, unknown>) {
  for (;;) if ((await stream.next()).done) return
}
const step = ($: Engine, agentId: string) => drain($.turn.step({ ...STEP, agentId }))
const complete = ($: Engine, agentId: string, answer: string) => turnEnds($, { ...TURN_COMPLETE, agentId, answer } as never)

const read = (path: string): Use => ({ name: 'Read', input: { file_path: path } })
const edit = (path: string): Use => ({ name: 'Edit', input: { file_path: path, old_string: 'a', new_string: 'b' } })

// The pane as drawn, after pressing each Peek button named, each press's write redrawn on the kit's clock.
async function peeked($: Engine, clock: { advance: (ms: number) => Promise<void> }, surface: Surface, presses: readonly string[]) {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  for (const agentId of presses) {
    await pane.press({ key: `peek-${agentId}` })
    await clock.advance(100)
  }
  const elements = await pane.findAll({})
  const texts = (await pane.findAll({ type: 'Text' })).map(text => text.text)
  const buttons = (await pane.findAll({ type: 'Button' })).filter(button => button.key?.startsWith('peek-')).map(button => [button.key, button.props.label])
  await pane.unmount()
  return { elements, texts, buttons }
}

// The lines under a heading of Peek, up to the next heading or the end.
const HEADINGS: readonly string[] = [STRINGS.peek.brief, STRINGS.peek.actions, STRINGS.peek.files, STRINGS.peek.answer, STRINGS.peek.lastAnswer]
function under(texts: readonly string[], heading: string): string[] | undefined {
  const at = texts.indexOf(heading)
  if (at === -1) return undefined
  const after = texts.slice(at + 1)
  const end = after.findIndex(text => HEADINGS.includes(text))
  return end === -1 ? after : after.slice(0, end)
}

for (const surface of SURFACES) {
  test(`${surface}: after seven tool calls Peek lists the last five, each as its own plain Text (F-13, I-04)`, async ($, on) => {
    const { clock, queue } = world(on)
    await spawn($, { description: 'Count the shovels' })
    await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
    const files = ['one.txt', 'two.txt', 'three.txt', 'four.txt', 'five.txt', 'six.txt', 'seven.txt']
    queue(files.slice(0, 3).map(read))
    queue(files.slice(3, 4).map(read))
    queue(files.slice(4).map(read))
    for (let at = 0; at < 3; at++) await step($, 'agent-1')

    const closed = await peeked($, clock, surface, [])
    expect(under(closed.texts, STRINGS.peek.actions)).toBeUndefined()
    expect(closed.buttons).toEqual([['peek-agent-1', 'peek']])

    const { elements, texts, buttons } = await peeked($, clock, surface, ['agent-1'])
    expect(buttons).toEqual([['peek-agent-1', 'hide']])
    expect(under(texts, STRINGS.peek.actions)).toEqual(['Reading three.txt', 'Reading four.txt', 'Reading five.txt', 'Reading six.txt', 'Reading seven.txt'])
    expect(texts).not.toContain('Reading one.txt')
    expect(texts).not.toContain('Reading two.txt')
    expect(under(texts, STRINGS.peek.brief)?.[0]).toBe(SPAWN.prompt)
    expect(elements.filter(element => element.type === 'Markdown' || element.type === 'Link')).toEqual([])
    // Only reads so far: no file changed, and no answer before the end.
    expect(under(texts, STRINGS.peek.files)).toBeUndefined()
    expect(under(texts, STRINGS.peek.answer)).toBeUndefined()
  })

  test(`${surface}: Peek shows a brief and an answer cut at 600 characters, and the latest ten files changed, each once`, async ($, on) => {
    const { clock, queue } = world(on)
    const prompt = 'Weed the north bed, then the south one. '.repeat(20)
    await spawn($, { description: 'Weed the beds', prompt })
    await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
    queue([read('beds/plan.md'), edit('beds/a.md'), edit('beds/b.md'), edit('beds/a.md')])
    queue(Array.from({ length: 10 }, (_, at) => edit(`beds/row-${at}.md`)))
    await step($, 'agent-1')
    await step($, 'agent-1')
    const answer = 'The north bed is weeded. '.repeat(30)
    await complete($, 'agent-1', answer)

    const { texts } = await peeked($, clock, surface, ['agent-1'])
    expect(under(texts, STRINGS.peek.brief)).toEqual([`${prompt.slice(0, 600)}${STRINGS.cut}`])
    expect(under(texts, STRINGS.peek.answer)).toEqual([`${answer.slice(0, 600)}${STRINGS.cut}`])
    expect(under(texts, STRINGS.peek.files)).toEqual(Array.from({ length: 10 }, (_, at) => `beds/row-${at}.md`))
    // Reads are no file changed; an edit seen again moves to the end, and the oldest past ten go.
    expect(texts).not.toContain('beds/plan.md')
    expect(texts).not.toContain('beds/b.md')
  })

  test(`${surface}: hide closes Peek, peeking another row moves it, and a close of the pane drops it; none writes the store`, async ($, on) => {
    const { kept, clock } = world(on)
    await spawn($, { description: 'Count the shovels' })
    await spawn($, { description: 'Rake the leaves' })
    const writes = kept.writes.length

    const first = await peeked($, clock, surface, ['agent-1'])
    expect(first.buttons).toEqual([
      ['peek-agent-1', 'hide'],
      ['peek-agent-2', 'peek'],
    ])
    const moved = await peeked($, clock, surface, ['agent-2'])
    expect(moved.buttons).toEqual([
      ['peek-agent-1', 'peek'],
      ['peek-agent-2', 'hide'],
    ])
    expect(moved.texts.filter(text => HEADINGS.includes(text))).toEqual([STRINGS.peek.brief])
    const hidden = await peeked($, clock, surface, ['agent-2'])
    expect(hidden.texts.filter(text => HEADINGS.includes(text))).toEqual([])

    await peeked($, clock, surface, ['agent-1'])
    await $.command.run(POSSUMS)
    await $.command.run(POSSUMS)
    const reopened = await peeked($, clock, surface, [])
    expect(reopened.buttons).toEqual([
      ['peek-agent-1', 'peek'],
      ['peek-agent-2', 'peek'],
    ])
    expect(kept.writes.length).toBe(writes)
  })

  test(`${surface}: a file deep in its folders shows its end, its name kept, after an ellipsis`, async ($, on) => {
    const { clock, queue } = world(on)
    const path = `/fixture/${'orchard/north-field/'.repeat(5)}beds/rows.md`
    await spawn($, { description: 'Mark the rows' })
    await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
    queue([edit(path)])
    await step($, 'agent-1')
    const { texts } = await peeked($, clock, surface, ['agent-1'])
    expect(under(texts, STRINGS.peek.files)).toEqual([`${STRINGS.cut}${path.slice(-80)}`])
  })

  test(`${surface}: while an answered run works again, its answer is shown as the last one, and a new one replaces it`, async ($, on) => {
    const { clock } = world(on)
    await spawn($, { description: 'Count the shovels' })
    await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
    await complete($, 'agent-1', 'Seven shovels.')
    expect(under((await peeked($, clock, surface, ['agent-1'])).texts, STRINGS.peek.answer)).toEqual(['Seven shovels.'])
    // A turn of its own again, as a teammate's next or a resumed agent's.
    await $.turn.start({ ...TURN_START, agentId: 'agent-1' })
    const working = (await peeked($, clock, surface, [])).texts
    expect(working).not.toContain(STRINGS.peek.answer)
    expect(working.slice(working.indexOf(STRINGS.peek.lastAnswer) + 1)).toEqual(['Seven shovels.'])
    await complete($, 'agent-1', 'Nine rakes.')
    const ended = (await peeked($, clock, surface, [])).texts
    expect(ended).not.toContain(STRINGS.peek.lastAnswer)
    expect(under(ended, STRINGS.peek.answer)).toEqual(['Nine rakes.'])
  })

  test(`${surface}: a description with markdown, a link and a tag draws whole in Peek as plain text (I-04)`, async ($, on) => {
    const { clock } = world(on)
    const description = '**Fix** the [gate](https://example.test/gate) <b>now</b>, then `count` the rakes'
    await spawn($, { description, prompt: '# Steps\n\n1. Open [the shed](https://example.test/shed)\n2. Count' })
    const { elements, texts } = await peeked($, clock, surface, ['agent-1'])
    // Once on the row's first line, once at the head of Peek.
    expect(texts.filter(text => text === description)).toHaveLength(2)
    expect(under(texts, STRINGS.peek.brief)).toEqual(['# Steps\n\n1. Open [the shed](https://example.test/shed)\n2. Count'])
    expect(elements.filter(element => element.type === 'Markdown' || element.type === 'Link')).toEqual([])
    // No element but a Text holds the agent's text.
    for (const element of elements.filter(one => one.type !== 'Text')) {
      expect(JSON.stringify(element.props)).not.toContain('example.test')
    }
  })
}

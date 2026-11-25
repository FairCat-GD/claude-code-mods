import type { On } from 'claude-code'
import { type Engine, expect, mock, test } from 'claude-code/testing'

import { costOf, PRICES } from '../hooks/data/prices'
import { STRINGS } from '../hooks/strings'
import { dollars } from '../hooks/view/format'
import { engine, MOUNT, possums, SURFACES, store } from './engine'
import { SPAWN, STEP, STEP_CHUNKS, STEPPED, TURN_COMPLETE, TURN_START } from './fixtures/events'

// Dollars as millionths, to the hundredth: a token count times its price per million, stated by hand.
const micro = (usd: number) => Math.round(usd * 100_000_000) / 100
const TOKENS = { input: 1_000, output: 200, cacheRead: 50_000, cacheWrite: 300 }

test("each model's tokens cost its list prices, an hour's cache writes their own, and Haiku's long prompts its higher rates (T-12)", () => {
  // Opus 5.5: 1,000 × 4, 200 × 20, 50,000 × 0.20, 300 × 5.
  expect(micro(costOf('claude-opus-5-5', TOKENS))).toBe(4_000 + 4_000 + 10_000 + 1_500)
  // Sonnet 5.5: × 2, × 10, × 0.10, × 2.50. Fable 5.2: × 8, × 40, × 0.20, × 10.
  expect(micro(costOf('claude-sonnet-5-5', TOKENS))).toBe(2_000 + 2_000 + 5_000 + 750)
  expect(micro(costOf('claude-fable-5-2', TOKENS))).toBe(8_000 + 8_000 + 10_000 + 3_000)
  // Haiku 5.5: × 0.10, × 0.50, × 0.01, × 0.125, and five times that past a prompt of 100,000 tokens.
  expect(micro(costOf('claude-haiku-5-5', TOKENS, { prompt: 100_000 }))).toBe(100 + 100 + 500 + 37.5)
  expect(micro(costOf('claude-haiku-5-5', TOKENS, { prompt: 100_001 }))).toBe(500 + 500 + 2_500 + 187.5)
  // A hundred of the 300 writes kept an hour cost 8 rather than 5; more than were written is all of them.
  expect(micro(costOf('claude-opus-5-5', TOKENS, { hourWrites: 100 }))).toBe(4_000 + 4_000 + 10_000 + 200 * 5 + 100 * 8)
  expect(micro(costOf('claude-opus-5-5', TOKENS, { hourWrites: 900 }))).toBe(4_000 + 4_000 + 10_000 + 300 * 8)
})

test('an id with a suffix finds its model, an unknown one costs the default, and no count the engine got wrong costs anything', () => {
  expect(micro(costOf('claude-sonnet-5-5-20990101', TOKENS))).toBe(9_750)
  expect(micro(costOf('claude-fixture-unknown', TOKENS))).toBe(19_500)
  expect(micro(costOf(undefined, TOKENS))).toBe(19_500)
  expect(costOf('claude-opus-5-5', { input: Number.NaN, output: -5, cacheRead: Number.POSITIVE_INFINITY, cacheWrite: 0 }, { hourWrites: Number.NaN })).toBe(0)
  // Every row is dated, and names a model once.
  expect(PRICES.every(row => row.read.startsWith('2026-'))).toBe(true)
  expect(new Set(PRICES.map(row => row.model)).size).toBe(PRICES.length)
})

test('an estimate reads in cents, whole dollars from a hundred, and under a cent as such', () => {
  expect([0, 0.004, 0.006, 0.25, 12.4, 99.996, 123.4, Number.NaN].map(dollars)).toEqual([
    '$0.00',
    '<$0.01',
    '$0.01',
    '$0.25',
    '$12.40',
    '$100',
    '$123',
    STRINGS.row.unknown,
  ])
})

// Each subagent step on Sonnet 5.5: 10,000 in, 3,000 out, 100,000 cache reads and 10,000 cache writes kept an hour, so
// 20,000 + 30,000 + 10,000 + 40,000 millionths.
const STEP_USAGE = {
  input_tokens: 10_000,
  output_tokens: 3_000,
  cache_read_input_tokens: 100_000,
  cache_creation_input_tokens: 10_000,
  ephemeral_5m_input_tokens: 0,
  ephemeral_1h_input_tokens: 10_000,
  model: 'claude-sonnet-5-5',
}
// The main turn on Opus 5.5: 5,000 in, 1,000 out, 2,000 written, so 20,000 + 20,000 + 10,000.
const MAIN_USAGE = { input_tokens: 5_000, output_tokens: 1_000, cache_read_input_tokens: 0, cache_creation_input_tokens: 2_000, model: 'claude-opus-5-5' }

function world(on: On) {
  mock.clock(on, { now: 1_000 })
  engine(on)
  on('agent.spawn', () => ({ model: 'claude-sonnet-5-5', agentId: 'agent-a' }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('turn.step', async function* (_, e) {
    for (const chunk of STEP_CHUNKS) yield chunk
    return { ...STEPPED, turnId: e.turnId, index: e.index, usage: STEP_USAGE }
  })
}

async function drain(stream: AsyncGenerator<unknown, unknown>) {
  for (;;) if ((await stream.next()).done) return
}

// A subagent with two steps, and one main turn.
async function session($: Engine) {
  await $.agent.spawn(SPAWN)
  await $.turn.start({ ...TURN_START, agentId: 'agent-a' })
  await drain($.turn.step({ ...STEP, agentId: 'agent-a', index: 0 }))
  await drain($.turn.step({ ...STEP, agentId: 'agent-a', index: 1 }))
  const { agentId: _, ...main } = TURN_COMPLETE
  await $.turn.complete({ ...main, usage: MAIN_USAGE })
}

// Every string a surface's tree holds, each element's text and each of its props' string values; and the texts alone,
// without the labelled copy of a figure the kit draws over the desktop's bar.
async function drawnOn($: Engine, surface: (typeof SURFACES)[number]) {
  const pane = await $.ui.mount({ ...MOUNT, surface })
  const elements = await pane.findAll({})
  await pane.unmount()
  const strings = elements.flatMap(element => [element.text, ...Object.values(element.props).filter(value => typeof value === 'string')]) as string[]
  const texts = elements.filter(element => element.type === 'Text' && !element.text.startsWith(`${STRINGS.row.context} `)).map(element => element.text)
  return { strings, texts }
}

test('with cost off, no currency sign appears anywhere in the pane, on either surface (F-20)', async ($, on) => {
  world(on)
  store(on)
  await session($)
  for (const surface of SURFACES) {
    const { strings } = await drawnOn($, surface)
    // The header is drawn: the Lead's 8,000 fresh tokens and the run's 46,000, the main turn's 4.2 s.
    expect([surface, strings.includes(STRINGS.session('54k', '0:04'))]).toEqual([surface, true])
    expect([surface, strings.filter(text => text.includes('$'))]).toEqual([surface, []])
  }
})

test("with cost at estimate, each row and the header show the estimate, the header's the Lead's and every row's (F-20)", async ($, on) => {
  world(on)
  store(on)
  await session($)
  await $.command.run(possums('set cost estimate'))
  for (const surface of SURFACES) {
    const { strings, texts } = await drawnOn($, surface)
    // The row: two steps of $0.10. The header: those and the main turn's $0.05.
    expect([surface, texts.filter(text => text.endsWith(` · ${STRINGS.estimate('$0.20')}`)).length]).toEqual([surface, 1])
    expect([surface, texts.filter(text => text.endsWith(` · ${STRINGS.estimate('$0.25')}`)).length]).toEqual([surface, 1])
    expect([surface, strings.filter(text => text.includes('$') && !text.includes(STRINGS.estimate(''))).length]).toEqual([surface, 0])
  }
  // Back off, the figures go with it.
  await $.command.run(possums('set cost off'))
  for (const surface of SURFACES) expect([surface, (await drawnOn($, surface)).strings.filter(text => text.includes('$'))]).toEqual([surface, []])
})

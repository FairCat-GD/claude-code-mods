import { expect, test } from 'claude-code/testing'

import { hooksOf } from './engine'
import {
  CLEARED,
  MEASURE,
  MEASURED,
  PERMISSION,
  PERMITTED,
  SESSION_START,
  SPAWN,
  SPAWNED,
  STEP,
  STEP_CHUNKS,
  STARTED,
  STEPPED,
  TURN_COMPLETE,
  TURN_COMPLETED,
  TURN_START,
  TURN_STARTED,
} from './fixtures/events'

// The stream as its caller reads it: every chunk, then the result it ends with. The kit's own
// stream carries no `.result`, so the result is read from its end.
async function drain(stream: AsyncGenerator<unknown, unknown>) {
  const chunks: unknown[] = []
  for (;;) {
    const step = await stream.next()
    if (step.done) return { chunks, result: step.value }
    chunks.push(step.value)
  }
}

// Each hook here stands for the engine beneath the mod, answering with the fixture's result.
test('every hooked event gets back exactly what the engine gave', async ($, on) => {
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('session.start', () => STARTED)
  on('agent.spawn', () => SPAWNED)
  on('turn.start', () => TURN_STARTED)
  on('turn.complete', () => TURN_COMPLETED)
  on('session.measure', () => MEASURED)
  on('classic.PermissionRequest', () => PERMITTED)
  on('classic.SessionStart', () => CLEARED)

  expect(await $.session.start(SESSION_START)).toEqual(STARTED)
  expect(await $.agent.spawn(SPAWN)).toEqual(SPAWNED)
  expect(await $.turn.start(TURN_START)).toEqual(TURN_STARTED)
  expect(await $.turn.complete(TURN_COMPLETE)).toEqual(TURN_COMPLETED)
  expect(await $.session.measure(MEASURE)).toEqual(MEASURED)
  expect(await $.classic.PermissionRequest(PERMISSION)).toEqual(PERMITTED)
  expect(await $.classic.SessionStart({ source: 'clear' })).toEqual(CLEARED)
})

test('an event of a shape the mod does not know passes on with what the engine gave', async ($, on) => {
  on('agent.spawn', () => SPAWNED)
  on('turn.start', () => TURN_STARTED)
  on('turn.complete', () => TURN_COMPLETED)
  on('session.measure', () => MEASURED)
  on('classic.PermissionRequest', () => PERMITTED)
  on('classic.SessionStart', () => CLEARED)
  on('turn.step', async function* () {
    for (const chunk of STEP_CHUNKS) yield chunk
    return STEPPED
  })
  const malformed = { surprise: [null, { deeper: 7 }] } as never

  expect(await $.agent.spawn(malformed)).toEqual(SPAWNED)
  expect(await $.turn.start(malformed)).toEqual(TURN_STARTED)
  expect(await $.turn.complete(malformed)).toEqual(TURN_COMPLETED)
  expect(await $.session.measure(malformed)).toEqual(MEASURED)
  expect(await $.classic.PermissionRequest(malformed)).toEqual(PERMITTED)
  expect(await $.classic.SessionStart(malformed)).toEqual(CLEARED)
  // The engine refuses a step with no turnId, index or model before any hook, so only the rest is strange.
  const strangeStep = { turnId: STEP.turnId, index: STEP.index, model: STEP.model, surprise: [null, { deeper: 7 }] } as never
  expect((await drain($.turn.step(strangeStep))).result).toEqual(STEPPED)
})

test("a model request's stream reaches the caller unchanged and in order, then its result", async ($, on) => {
  on('turn.step', async function* () {
    for (const chunk of STEP_CHUNKS) yield chunk
    return STEPPED
  })

  const { chunks, result } = await drain($.turn.step(STEP))

  expect(chunks).toEqual(STEP_CHUNKS)
  expect(result).toEqual(STEPPED)
})

// A hook on either, even one passing every call on, turns off a tool's move to the background and its live output.
test('watching leaves every tool call alone: the mod hooks neither tool.call nor tool.run', () => {
  const { hooks } = hooksOf()
  expect(hooks.has('tool.call')).toBe(false)
  expect(hooks.has('tool.run')).toBe(false)
})

// The hooks run here on their own, with a `$` whose state and clock refuse every call, and a `next` standing for the engine.
test('a fault in reading or recording an event never changes what the engine gave (I-05)', async () => {
  const { hooks } = hooksOf()
  const refusing = {
    clock: { now: async () => Promise.reject(new Error('the fixture clock refuses')) },
    state: {
      get: async () => Promise.reject(new Error('the fixture state refuses reads')),
      set: async () => Promise.reject(new Error('the fixture state refuses writes')),
    },
  }
  type Plain = ($: unknown, e: unknown, next: (e: unknown) => Promise<unknown>) => Promise<unknown>
  const plain = (event: string) => hooks.get(event) as unknown as Plain
  const cases: [string, unknown, unknown][] = [
    ['agent.spawn', SPAWN, SPAWNED],
    ['turn.start', TURN_START, TURN_STARTED],
    ['turn.complete', TURN_COMPLETE, TURN_COMPLETED],
    ['classic.SessionStart', { source: 'clear' }, CLEARED],
  ]
  for (const [event, e, given] of cases) expect(await plain(event)(refusing, e, async () => given)).toEqual(given)

  type Streaming = ($: unknown, e: unknown, next: (e: unknown) => AsyncGenerator<unknown, unknown>) => AsyncGenerator<unknown, unknown>
  const stepHook = hooks.get('turn.step') as unknown as Streaming
  const engineStep = async function* () {
    for (const chunk of STEP_CHUNKS) yield chunk
    return STEPPED
  }
  const { chunks, result } = await drain(stepHook(refusing, STEP, engineStep))
  expect(chunks).toEqual(STEP_CHUNKS)
  expect(result).toEqual(STEPPED)
})

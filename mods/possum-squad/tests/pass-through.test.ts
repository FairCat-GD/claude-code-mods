import { expect, test } from 'claude-code/testing'

import {
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
  TOOL_CALL,
  TOOL_CALLED,
  TOOL_CHECK,
  TOOL_CHECKED,
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
  on('tool.call', () => TOOL_CALLED)
  on('tool.check', () => TOOL_CHECKED)
  on('session.measure', () => MEASURED)
  on('classic.PermissionRequest', () => PERMITTED)

  expect(await $.session.start(SESSION_START)).toEqual(STARTED)
  expect(await $.agent.spawn(SPAWN)).toEqual(SPAWNED)
  expect(await $.turn.start(TURN_START)).toEqual(TURN_STARTED)
  expect(await $.turn.complete(TURN_COMPLETE)).toEqual(TURN_COMPLETED)
  expect(await $.tool.call(TOOL_CALL)).toEqual(TOOL_CALLED)
  expect(await $.tool.check(TOOL_CHECK)).toEqual(TOOL_CHECKED)
  expect(await $.session.measure(MEASURE)).toEqual(MEASURED)
  expect(await $.classic.PermissionRequest(PERMISSION)).toEqual(PERMITTED)
})

test('an event of a shape the mod does not know passes on with what the engine gave', async ($, on) => {
  on('agent.spawn', () => SPAWNED)
  on('turn.start', () => TURN_STARTED)
  on('turn.complete', () => TURN_COMPLETED)
  on('tool.call', () => TOOL_CALLED)
  on('tool.check', () => TOOL_CHECKED)
  on('session.measure', () => MEASURED)
  on('classic.PermissionRequest', () => PERMITTED)
  on('turn.step', async function* () {
    for (const chunk of STEP_CHUNKS) yield chunk
    return STEPPED
  })
  const malformed = { surprise: [null, { deeper: 7 }] } as never

  expect(await $.agent.spawn(malformed)).toEqual(SPAWNED)
  expect(await $.turn.start(malformed)).toEqual(TURN_STARTED)
  expect(await $.turn.complete(malformed)).toEqual(TURN_COMPLETED)
  expect(await $.tool.call(malformed)).toEqual(TOOL_CALLED)
  expect(await $.tool.check(malformed)).toEqual(TOOL_CHECKED)
  expect(await $.session.measure(malformed)).toEqual(MEASURED)
  expect(await $.classic.PermissionRequest(malformed)).toEqual(PERMITTED)
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

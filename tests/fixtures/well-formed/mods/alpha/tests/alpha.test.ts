import { expect, test } from 'claude-code/testing'

// Runs only under `claude plugin test`; in Node its import fails, so collecting it would show.
test('the fictional greeting is a sentence', async () => {
  expect('Hello from a fictional mod.').toMatch(/\.$/)
})

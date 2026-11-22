import { expect, test } from 'claude-code/testing'

import { shout } from '../tools/shout.ts'

test('a test reached into tools/', () => {
  expect(shout('fixture')).toBe('FIXTURE!')
})

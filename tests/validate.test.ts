import assert from 'node:assert/strict'
import { test } from 'node:test'

import { judge } from '../scripts/validate.ts'

const CLAUDE_MD = {
  path: 'root',
  message: 'CLAUDE.md at the plugin root is not loaded as project context. To ship context with your plugin, use a skill (skills/<name>/SKILL.md) instead.',
}
const report = (warnings: object[] = [], errors: object[] = [], success = true) => ({
  success,
  manifest: { errors: [], warnings: [] },
  contents: [{ errors, warnings }],
})

test("the warning a mod's own CLAUDE.md draws is the one allowed", () => {
  assert.deepEqual(judge(report([CLAUDE_MD])), [])
})

test('any other warning fails', () => {
  assert.deepEqual(judge(report([CLAUDE_MD, { path: 'description', message: 'No description' }])), ['warning at description: No description'])
})

test('an error fails', () => {
  assert.deepEqual(judge(report([], [{ path: 'name', message: 'Required' }], false)), ['error at name: Required'])
})

test('a report that did not succeed fails, even with nothing listed', () => {
  assert.deepEqual(judge(report([], [], false)), ['validate did not succeed'])
})

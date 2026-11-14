import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

import { ROOT } from '../scripts/repo.ts'
import { describe, judge } from '../scripts/validate.ts'
import { temporaryFolder } from './support.ts'

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

test('the readable report lists the notes, and marks the allowed warning', () => {
  const lines = describe({ manifest: { notes: [] }, contents: [{ warnings: [CLAUDE_MD] }, { notes: ['./register.ts hooks: session.start'] }] })
  assert.deepEqual(lines, [`  warning at root: ${CLAUDE_MD.message} (expected)`, '  ./register.ts hooks: session.start'])
})

test("run alone, it gives claude an environment without the owner's live mods", t => {
  const bin = temporaryFolder(t)
  const seen = join(bin, 'seen-env')
  // A stand-in CLI: it records the environment it was given and reports a passing validate.
  writeFileSync(join(bin, 'claude'), `#!/bin/sh\nenv > '${seen}'\necho '{"success":true,"manifest":{"errors":[],"warnings":[]},"contents":[]}'\n`, {
    mode: 0o755,
  })
  const env = { PATH: `${bin}:/usr/bin:/bin`, CLAUDE_CODE_PLUGIN_DIRS: '/fictional/live-mods', CANARY: 'kept' }
  const run = spawnSync(process.execPath, ['scripts/validate.ts', bin], { cwd: ROOT, env, encoding: 'utf8' })
  assert.equal(run.status, 0, run.stdout + run.stderr)
  const given = readFileSync(seen, 'utf8')
  assert.match(given, /^CANARY=kept$/m)
  assert.doesNotMatch(given, /CLAUDE_CODE_PLUGIN_DIRS/)
})

import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

import { cliVersion, declarationsProblem, laidVersion } from '../scripts/repo.ts'
import { launchCommand, outcome } from '../scripts/types.ts'
import { temporaryFolder } from './support.ts'

const lay = (folder: string, firstLine: string) => {
  mkdirSync(join(folder, '.claude-plugin/types/claude-code'), { recursive: true })
  writeFileSync(join(folder, '.claude-plugin/types/claude-code/index.d.ts'), `${firstLine}\nexport {}\n`)
  writeFileSync(join(folder, '.claude-plugin/types/tsconfig.json'), '{}\n')
}

test("the session keeps the owner's live mods out three ways, and loads each folder", () => {
  const { command, args, env } = launchCommand('/bin/claude', ['/r/mods/alpha', '/r/templates/mod-template'], {
    PATH: '/bin',
    CLAUDE_CODE_PLUGIN_DIRS: '~/live',
  })
  assert.equal(command, '/bin/claude')
  assert.deepEqual(env, { PATH: '/bin' })
  assert.deepEqual(args, [
    '--setting-sources',
    'project,local',
    '--settings',
    '{"env":{"CLAUDE_CODE_PLUGIN_DIRS":""}}',
    '--plugin-dir',
    '/r/mods/alpha',
    '--plugin-dir',
    '/r/templates/mod-template',
  ])
})

test('the version lines parse', t => {
  assert.equal(cliVersion('2.1.296 (Claude Code)\n'), '2.1.296')
  const folder = temporaryFolder(t)
  assert.equal(laidVersion(folder), undefined)
  lay(folder, '// Written by Claude Code 2.1.308.')
  assert.equal(laidVersion(folder), '2.1.308')
})

test('missing or stale declarations name the fix', t => {
  const folder = temporaryFolder(t)
  assert.equal(declarationsProblem(folder, 'mods/alpha', '2.1.296'), 'mods/alpha has no API declarations in .claude-plugin/types/: run `npm run types`')
  lay(folder, '// Written by Claude Code 2.1.295.')
  assert.equal(
    declarationsProblem(folder, 'mods/alpha', '2.1.296'),
    "mods/alpha's API declarations are from Claude Code 2.1.295, the CLI is 2.1.296: run `npm run types`",
  )
  lay(folder, '// Written by Claude Code 2.1.296.')
  assert.equal(declarationsProblem(folder, 'mods/alpha', '2.1.296'), undefined)
})

test('a CLI that updated itself during the session asks for another run', () => {
  assert.deepEqual(outcome('2.1.296', '2.1.296', []), { lines: ['types: declarations laid from Claude Code 2.1.296'], ok: true })
  const updated = outcome('2.1.296', '2.1.310', ["mods/alpha's API declarations are from Claude Code 2.1.296, the CLI is 2.1.310: run `npm run types`"])
  assert.equal(updated.ok, false)
  assert.ok(updated.lines.includes('types: the CLI updated itself from 2.1.296 to 2.1.310 during the session; run `npm run types` again'))
})

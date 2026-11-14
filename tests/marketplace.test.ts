import assert from 'node:assert/strict'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { type TestContext, test } from 'node:test'

import { check, newestVersion, trackedPaths } from '../scripts/marketplace.ts'
import { FIXTURES, git, temporaryFolder } from './support.ts'

const MARKETPLACE = '.claude-plugin/marketplace.json'
const ALPHA = 'mods/alpha/.claude-plugin/plugin.json'

// A copy of a fixture root that the test may break.
const copyOf = (t: TestContext, fixture: string) => {
  const dir = temporaryFolder(t)
  cpSync(join(FIXTURES, fixture), dir, { recursive: true })
  return dir
}

const edit = (dir: string, path: string, change: (json: Record<string, unknown>) => void) => {
  const json = JSON.parse(readFileSync(join(dir, path), 'utf8'))
  change(json)
  writeFileSync(join(dir, path), JSON.stringify(json))
}

test('a marketplace that agrees with its folders passes', t => {
  assert.deepEqual(check(copyOf(t, 'well-formed'), []), [])
})

test('a folder under mods/ with no entry is reported', t => {
  const dir = copyOf(t, 'well-formed')
  cpSync(join(dir, 'mods/alpha'), join(dir, 'mods/delta'), { recursive: true })
  edit(dir, 'mods/delta/.claude-plugin/plugin.json', json => {
    json.name = 'delta'
  })
  assert.deepEqual(check(dir, []), [`${MARKETPLACE}: mods/delta has no entry`])
})

test('an entry with no folder is reported', t => {
  const dir = copyOf(t, 'well-formed')
  edit(dir, MARKETPLACE, json => {
    ;(json.plugins as unknown[]).push({ name: 'beta', source: './mods/beta', description: 'Fictional.' })
  })
  assert.deepEqual(check(dir, []), [`${MARKETPLACE}: plugins[1]: "beta" has no folder under mods/`])
})

test("a plugin.json whose name is not its folder's is reported", t => {
  const dir = copyOf(t, 'well-formed')
  edit(dir, ALPHA, json => {
    json.name = 'alfa'
  })
  assert.deepEqual(check(dir, []), [`mods/alpha/.claude-plugin/plugin.json: name "alfa" is not the folder's, "alpha"`])
})

test('an entry carrying a version is reported', t => {
  const dir = copyOf(t, 'well-formed')
  edit(dir, MARKETPLACE, json => {
    ;(json.plugins as Record<string, unknown>[])[0] = { name: 'alpha', source: './mods/alpha', description: 'Fictional.', version: '0.1.0' }
  })
  assert.deepEqual(check(dir, []), [`${MARKETPLACE}: plugins[0] ("alpha") carries a version; it belongs in plugin.json alone`])
})

test('a plugin.json missing a field is reported', t => {
  const dir = copyOf(t, 'well-formed')
  edit(dir, ALPHA, json => {
    delete json.license
  })
  assert.deepEqual(check(dir, []), [`${ALPHA}: license is not "MIT"`])
})

test('a changelog whose newest entry is not the version is reported', t => {
  const dir = copyOf(t, 'well-formed')
  edit(dir, ALPHA, json => {
    json.version = '0.2.0'
  })
  assert.deepEqual(check(dir, []), ['mods/alpha/CHANGELOG.md: newest entry is 0.1.0, plugin.json says 0.2.0'])
})

test('a tracked file under .claude-plugin/types/ is reported', t => {
  const dir = copyOf(t, 'well-formed')
  mkdirSync(join(dir, 'mods/alpha/.claude-plugin/types'))
  writeFileSync(join(dir, 'mods/alpha/.claude-plugin/types/index.d.ts'), 'export {}\n')
  writeFileSync(join(dir, '.gitignore'), '**/.claude-plugin/types/\n')
  git(dir, 'init', '-q', '-b', 'main')
  git(dir, 'add', '.')
  assert.deepEqual(check(dir, trackedPaths(dir)), [])
  git(dir, 'add', '-f', 'mods/alpha/.claude-plugin/types/index.d.ts')
  assert.deepEqual(check(dir, trackedPaths(dir)), [
    "mods/alpha/.claude-plugin/types/index.d.ts: the engine's declarations are tracked; they are never committed",
  ])
})

test('a marketplace that disagrees with its folders is reported both ways', t => {
  assert.deepEqual(check(copyOf(t, 'disagreeing'), []), [
    `${MARKETPLACE}: plugins[1]: "beta" has no folder under mods/`,
    `${MARKETPLACE}: mods/gamma has no entry`,
  ])
})

test('no marketplace file is consistent only while mods/ is empty', t => {
  const dir = copyOf(t, 'well-formed')
  rmSync(join(dir, MARKETPLACE))
  assert.deepEqual(check(dir, []), [`${MARKETPLACE}: missing, but mods/ holds alpha`])
  rmSync(join(dir, 'mods'), { recursive: true })
  assert.deepEqual(check(dir, []), [])
})

test("the template's manifest is checked, though it has no entry", t => {
  const dir = copyOf(t, 'well-formed')
  cpSync(join(dir, 'mods/alpha'), join(dir, 'templates/mod-template'), { recursive: true })
  edit(dir, 'templates/mod-template/.claude-plugin/plugin.json', json => {
    json.name = 'mod-template'
  })
  assert.deepEqual(check(dir, []), [])
  edit(dir, 'templates/mod-template/.claude-plugin/plugin.json', json => {
    delete json.author
  })
  assert.deepEqual(check(dir, []), ['templates/mod-template/.claude-plugin/plugin.json: author is not { "name": "FairCat-GD" }'])
})

test('a marketplace with no description is reported', t => {
  const dir = copyOf(t, 'well-formed')
  edit(dir, MARKETPLACE, json => {
    delete json.description
  })
  assert.deepEqual(check(dir, []), [`${MARKETPLACE}: no description`])
})

test("a version heading inside a fenced example is not the changelog's newest entry", () => {
  const changelog = '# Changelog\n\nEach entry looks like:\n\n```markdown\n## [9.9.9] — <date>\n```\n\n## [Unreleased]\n\n## [0.2.0] — 2026-01-02\n'
  assert.equal(newestVersion(changelog), '0.2.0')
  assert.equal(newestVersion('~~~\n## [1.0.0]\n~~~\n## [0.3.0]\n'), '0.3.0')
})

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { type TestContext, test } from 'node:test'

import { check } from '../scripts/marketplace.ts'
import { formatJson, newMod } from '../scripts/new-mod.ts'
import { claudeCommand, DECLARATIONS, ROOT, TEMPLATE } from '../scripts/repo.ts'
import { FIXTURES, temporaryFolder } from './support.ts'

const DESCRIPTION = 'Fictional: paints the prompt a colour no one has seen.'
const TODAY = '2031-02-03'

// A repository root whose marketplace lists `alpha`, with the real template beside it, so a new
// place the template names itself in is caught.
const scratchRoot = (t: TestContext) => {
  const root = temporaryFolder(t)
  cpSync(join(FIXTURES, 'well-formed'), root, { recursive: true })
  const engineFiles = join(ROOT, TEMPLATE, DECLARATIONS)
  cpSync(join(ROOT, TEMPLATE), join(root, TEMPLATE), { recursive: true, filter: path => !path.startsWith(engineFiles) })
  return root
}

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => (entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]))

// Every file under `root`, by path, with its contents.
const snapshot = (root: string) => Object.fromEntries(files(root).map(file => [relative(root, file), readFileSync(file, 'utf8')]))

test('a mod made from the template names itself everywhere, never the template', t => {
  const root = scratchRoot(t)
  const written = newMod(root, 'gamma', DESCRIPTION, TODAY)
  const made = files(join(root, 'mods/gamma'))
  assert.ok(made.length > 0)
  assert.ok(written.includes('mods/gamma/tests/gamma.test.ts'))
  for (const file of made) {
    assert.doesNotMatch(relative(root, file), /mod-template/)
    assert.doesNotMatch(readFileSync(file, 'utf8'), /mod-template/, relative(root, file))
  }
  assert.match(readFileSync(join(root, 'mods/gamma/hooks/register.ts'), 'utf8'), /'gamma is loaded\.'/)
})

test('the mod starts at 0.1.0, dated the day it was made, with its entry in name order', t => {
  const root = scratchRoot(t)
  newMod(root, 'gamma', DESCRIPTION, TODAY)
  newMod(root, 'beta', DESCRIPTION, TODAY)
  const manifest = JSON.parse(readFileSync(join(root, 'mods/gamma/.claude-plugin/plugin.json'), 'utf8'))
  assert.deepEqual([manifest.name, manifest.version, manifest.description], ['gamma', '0.1.0', DESCRIPTION])
  assert.match(readFileSync(join(root, 'mods/gamma/CHANGELOG.md'), 'utf8'), /^## \[0\.1\.0\] — 2031-02-03$/m)
  const marketplace = readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8')
  assert.deepEqual(
    JSON.parse(marketplace).plugins.map((entry: { name: string }) => entry.name),
    ['alpha', 'beta', 'gamma'],
  )
  assert.deepEqual(JSON.parse(marketplace).plugins[2], { name: 'gamma', source: './mods/gamma', description: DESCRIPTION })
  assert.equal(marketplace, formatJson(JSON.parse(marketplace)))
})

test('one-field objects stay on one line, as the repository writes them', () => {
  assert.equal(
    formatJson({ owner: { name: 'FairCat-GD' }, plugins: [{ name: 'a', source: './mods/a' }] }),
    '{\n  "owner": { "name": "FairCat-GD" },\n  "plugins": [\n    {\n      "name": "a",\n      "source": "./mods/a"\n    }\n  ]\n}\n',
  )
})

test('the marketplace stage passes on the root the mod was made in, and validate on the mod', t => {
  const root = scratchRoot(t)
  newMod(root, 'gamma', DESCRIPTION, TODAY)
  assert.deepEqual(check(root, []), [])
  const { argv, env } = claudeCommand('plugin', 'validate', '--strict', root)
  const [command = '', ...args] = argv
  const strict = spawnSync(command, args, { encoding: 'utf8', env })
  assert.equal(strict.status, 0, strict.stdout + strict.stderr)
  const validate = spawnSync(process.execPath, ['scripts/validate.ts', join(root, 'mods/gamma')], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(validate.status, 0, validate.stdout + validate.stderr)
  assert.match(validate.stdout, /^validate: 0 problem\(s\)$/m)
})

test('a name that cannot be a mod, a missing description and an existing folder are refused, writing nothing', t => {
  const root = scratchRoot(t)
  newMod(root, 'gamma', DESCRIPTION, TODAY)
  const before = snapshot(root)
  const refused: [string, string, RegExp][] = [
    ['Gamma', DESCRIPTION, /not lowercase kebab-case/],
    ['delta_mod', DESCRIPTION, /not lowercase kebab-case/],
    ['-delta', DESCRIPTION, /not lowercase kebab-case/],
    ['delta-', DESCRIPTION, /not lowercase kebab-case/],
    ['delta--mod', DESCRIPTION, /not lowercase kebab-case/],
    ['', DESCRIPTION, /not lowercase kebab-case/],
    ['mod-template', DESCRIPTION, /the template's own name/],
    ['tests', DESCRIPTION, /the name of a verify stage/],
    ['tooling-tests', DESCRIPTION, /the name of a verify stage/],
    ['delta', '  ', /a description is required/],
    ['alpha', DESCRIPTION, /mods\/alpha exists already/],
    ['gamma', DESCRIPTION, /mods\/gamma exists already/],
  ]
  for (const [name, description, why] of refused) {
    assert.throws(() => newMod(root, name, description, TODAY), why, name)
    assert.deepEqual(snapshot(root), before, name)
  }
})

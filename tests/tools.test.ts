import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { test } from 'node:test'

import { ROOT } from '../scripts/repo.ts'
import { toolFiles, typeProblems } from '../scripts/tools.ts'
import { FIXTURES, temporaryFolder } from './support.ts'

const fixture = (name: string) => join(FIXTURES, name)

// The context a test's own `node --test` would hand down, set here so every run proves it is removed.
const tools = (word: string, folder: string) =>
  spawnSync(process.execPath, ['scripts/tools.ts', word, folder.startsWith('/') ? folder : fixture(folder)], {
    cwd: ROOT,
    env: { ...process.env, NODE_TEST_CONTEXT: 'child-v8' },
    encoding: 'utf8',
  })

test('the listing leaves tools/fixtures/ out, and a .d.ts is neither a tool nor a spec', () => {
  const listed = (name: string) =>
    Object.fromEntries(Object.entries(toolFiles(fixture(name))).map(([key, paths]) => [key, paths.map(path => relative(fixture(name), path))]))
  assert.deepEqual(listed('tooled-mod'), { typed: ['tools/shout.spec.ts', 'tools/shout.ts'], specs: ['tools/shout.spec.ts'], tools: ['tools/shout.ts'] })
  assert.deepEqual(listed('declarations-only-mod'), { typed: ['tools/shapes.d.ts'], specs: [], tools: [] })
})

test("a clean tool types as an ES module against Node's types, and tools/fixtures/ is left out", () => {
  assert.deepEqual(typeProblems(fixture('tooled-mod')), [])
  assert.deepEqual(typeProblems(fixture('declarations-only-mod')), [])
})

test("a tool's type error fails, at its line", () => {
  assert.deepEqual(typeProblems(fixture('mistyped-mod')), ["tools/count.ts:2: TS2322 Type 'string' is not assignable to type 'number'."])
})

test('a passing spec runs, and a spec under tools/fixtures/ does not', () => {
  const run = tools('specs', 'tooled-mod')
  assert.equal(run.status, 0, run.stdout + run.stderr)
  assert.match(run.stdout, /the fictional tool shouts every word of its fixture/)
  assert.doesNotMatch(run.stdout, /a spec under tools\/fixtures\/ ran/)
})

test('a failing spec fails', () => {
  const run = tools('specs', 'failing-spec-mod')
  assert.equal(run.status, 1, run.stdout + run.stderr)
  assert.match(run.stdout, /the fictional spec fails on purpose/)
  assert.match(run.stdout, /^node --test failed on tools\/half\.spec\.ts$/m)
})

test('a tools/ with a tool and no spec fails, naming the tool', () => {
  const run = tools('specs', 'unspecced-mod')
  assert.equal(run.status, 1, run.stdout + run.stderr)
  assert.match(run.stdout, /^tools\/ holds a tool and no spec \(tools\/lonely\.ts\): its tests are \*\.spec\.ts beside it$/m)
})

test('a tools/ holding only a .d.ts passes, with nothing to run', () => {
  const run = tools('specs', 'declarations-only-mod')
  assert.equal(run.status, 0, run.stdout + run.stderr)
  assert.equal(run.stdout, 'tools specs: 0 problem(s)\n')
})

test('a word that is neither types nor specs exits 2', () => {
  assert.equal(tools('lint', 'tooled-mod').status, 2)
})

test('a spec whose path node --test would read as a glob is refused, and the others still run', t => {
  const dir = temporaryFolder(t)
  mkdirSync(join(dir, 'tools'))
  writeFileSync(join(dir, 'tools/plain.spec.ts'), "import { test } from 'node:test'\ntest('the plain spec ran', () => {})\n")
  writeFileSync(join(dir, 'tools/sheet[1].spec.ts'), "import { test } from 'node:test'\ntest('the bracketed spec ran', () => {})\n")
  const run = tools('specs', dir)
  assert.equal(run.status, 1, run.stdout + run.stderr)
  assert.match(run.stdout, /^tools\/sheet\[1\]\.spec\.ts: its path holds a character node --test reads as a glob: rename it$/m)
  assert.match(run.stdout, /the plain spec ran/)
  assert.doesNotMatch(run.stdout, /the bracketed spec ran/)
})

test('the listing leaves out a fixtures folder in any case, as the import scan does', t => {
  const dir = temporaryFolder(t)
  mkdirSync(join(dir, 'tools/Fixtures'), { recursive: true })
  writeFileSync(join(dir, 'tools/Fixtures/broken.spec.ts'), 'export const broken = 1\n')
  writeFileSync(join(dir, 'tools/convert.ts'), 'export const convert = 1\n')
  assert.deepEqual(
    toolFiles(dir).typed.map(path => relative(dir, path)),
    ['tools/convert.ts'],
  )
})

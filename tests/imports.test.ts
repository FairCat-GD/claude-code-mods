import assert from 'node:assert/strict'
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { type TestContext, test } from 'node:test'

import { declaredModules, scanImports } from '../scripts/imports.ts'
import { FIXTURES, temporaryFolder } from './support.ts'

const DECLARED = declaredModules(join(FIXTURES, 'declarations'))

test('the declared modules are read from the declarations', () => {
  assert.deepEqual([...DECLARED].sort(), ['claude-code', 'claude-code/testing', 'fictional-noun'])
})

test('a well-formed mod, its relative and bare imports inside the rules, passes', () => {
  assert.deepEqual(scanImports(join(FIXTURES, 'well-formed/mods/alpha'), DECLARED), [])
})

test('a relative import that leaves the folder and an unknown module are reported', () => {
  assert.deepEqual(scanImports(join(FIXTURES, 'leaky-mod'), DECLARED), [
    "hooks/register.ts:1: '../../outside' leaves the mod's folder",
    "hooks/register.ts:2: 'left-pad' is no module the engine declares (claude-code, claude-code/testing, fictional-noun)",
  ])
})

test('a module only the declarations name passes, so no list is kept in the scan', t => {
  const dir = temporaryFolder(t)
  mkdirSync(join(dir, 'hooks'))
  writeFileSync(join(dir, 'hooks/register.ts'), "import { noun } from 'fictional-noun'\nexport const register = () => noun\n")
  assert.deepEqual(scanImports(dir, DECLARED), [])
  assert.deepEqual(scanImports(dir, new Set(['claude-code'])), ["hooks/register.ts:1: 'fictional-noun' is no module the engine declares (claude-code)"])
})

test('a relative import that resolves to no file is reported', t => {
  const dir = temporaryFolder(t)
  mkdirSync(join(dir, 'hooks'))
  writeFileSync(join(dir, 'hooks/register.ts'), "export { gone } from './gone'\n")
  assert.deepEqual(scanImports(dir, DECLARED), ["hooks/register.ts:1: './gone' resolves to no file"])
})

test("the engine's own declarations inside the folder are not scanned", t => {
  const dir = temporaryFolder(t)
  mkdirSync(join(dir, '.claude-plugin/types/claude-code'), { recursive: true })
  writeFileSync(join(dir, '.claude-plugin/types/claude-code/index.d.ts'), "import type { X } from 'somewhere-else'\nexport type Y = X\n")
  assert.deepEqual(scanImports(dir, DECLARED), [])
})

test('claude-code-tools is a folder of additions to claude-code, not a module to import', t => {
  const dir = temporaryFolder(t)
  mkdirSync(join(dir, 'hooks'))
  writeFileSync(join(dir, 'hooks/register.ts'), "import type { BuiltinToolInputs } from 'claude-code-tools'\nexport type Inputs = BuiltinToolInputs\n")
  assert.deepEqual(scanImports(dir, DECLARED), [
    "hooks/register.ts:1: 'claude-code-tools' is no module the engine declares (claude-code, claude-code/testing, fictional-noun)",
  ])
})

test('a folder inside whose name starts with two dots stays inside', t => {
  const dir = temporaryFolder(t)
  mkdirSync(join(dir, 'hooks'))
  mkdirSync(join(dir, '..shared'))
  writeFileSync(join(dir, '..shared/util.ts'), "export const util = 'inside'\n")
  writeFileSync(join(dir, 'hooks/register.ts'), "export { util } from '../..shared/util'\n")
  assert.deepEqual(scanImports(dir, DECLARED), [])
})

test('a .js specifier resolves to the TypeScript source it names', t => {
  const dir = temporaryFolder(t)
  mkdirSync(join(dir, 'hooks'))
  writeFileSync(join(dir, 'hooks/fx.ts'), "export const fx = 'drawn'\n")
  writeFileSync(join(dir, 'hooks/register.ts'), "export { fx } from './fx.js'\nexport { gone } from './gone.js'\n")
  assert.deepEqual(scanImports(dir, DECLARED), ["hooks/register.ts:2: './gone.js' resolves to no file"])
})

test('reference directives are scanned: a path names a file, a types reference a module', t => {
  const dir = temporaryFolder(t)
  mkdirSync(join(dir, 'hooks'))
  writeFileSync(join(dir, 'hooks/local.d.ts'), 'export {}\n')
  writeFileSync(join(dir, 'hooks/register.ts'), '/// <reference path="local.d.ts" />\n/// <reference types="node" />\nexport const register = () => {}\n')
  assert.deepEqual(scanImports(dir, DECLARED), [
    "hooks/register.ts:2: 'node' is no module the engine declares (claude-code, claude-code/testing, fictional-noun)",
  ])
})

test("a tool's node: imports and its imports inside tools/ pass, beside the hooks' own", () => {
  assert.deepEqual(scanImports(join(FIXTURES, 'tooled-mod'), DECLARED), [])
})

test('the wall around tools/ holds both ways', () => {
  const engine = 'is no module the engine declares (claude-code, claude-code/testing, fictional-noun)'
  const into = 'reaches into tools/, which runs on Node, never in the engine'
  const only = 'a tool imports only from tools/ and node: modules'
  assert.deepEqual(scanImports(join(FIXTURES, 'walled-mod'), DECLARED), [
    `hooks/register.ts:1: 'node:fs' ${engine}`,
    `hooks/register.ts:3: '../tools/shout.ts' ${into}`,
    `tests/walled.test.ts:3: '../tools/shout.ts' ${into}`,
    'tools/legacy.mjs:1: a source under tools/ must be .ts',
    "tools/shout.ts:1: 'node' is a types reference: the tools' type check supplies Node's types",
    `tools/shout.ts:3: 'left-pad' is no node: module: ${only}`,
    `tools/shout.ts:5: '../hooks/register.ts' leaves tools/: ${only}`,
    `types/index.d.ts:1: '../tools/shout.ts' ${into}`,
  ])
})

test('a tool names a module Node has, by its node: name', t => {
  const dir = temporaryFolder(t)
  mkdirSync(join(dir, 'tools'))
  writeFileSync(
    join(dir, 'tools/convert.ts'),
    "import { readFileSync } from 'fs'\nimport { nothing } from 'node:nothing'\nimport { test } from 'node:test'\nexport const convert = [readFileSync, nothing, test]\n",
  )
  assert.deepEqual(scanImports(dir, DECLARED), [
    "tools/convert.ts:1: 'fs' is no node: module: a tool imports only from tools/ and node: modules",
    "tools/convert.ts:2: 'node:nothing' is no node: module: a tool imports only from tools/ and node: modules",
  ])
})

// A mod in a scratch folder, its files written from a map of path to text.
const scratchMod = (t: TestContext, files: Record<string, string>) => {
  const dir = join(temporaryFolder(t), 'mod')
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), text)
  }
  return dir
}

test('the wall ignores case, as the disk does', t => {
  const into = scanImports(
    scratchMod(t, { 'tools/shout.ts': 'export const shout = 1\n', 'hooks/a.ts': "export { shout } from '../Tools/shout.ts'\n" }),
    DECLARED,
  )
  assert.equal(into.length, 1)
  assert.match(into[0] ?? '', /^hooks\/a\.ts:1: '\.\.\/Tools\/shout\.ts' /)
  assert.deepEqual(scanImports(scratchMod(t, { 'Tools/shout.ts': 'export const shout = 1\n' }), DECLARED), [
    'Tools/shout.ts:1: a folder named tools/ in another case: name it tools/',
  ])
})

test('a symbolic link in the folder is refused, so nothing reaches past the scan through one', t => {
  const dir = scratchMod(t, { 'hooks/register.ts': 'export const register = 1\n' })
  mkdirSync(join(dir, '../outside'))
  writeFileSync(join(dir, '../outside/v.ts'), "import ts from 'typescript'\nexport const v = ts\n")
  symlinkSync('../outside', join(dir, 'tools'))
  symlinkSync('register.ts', join(dir, 'hooks/link.ts'))
  assert.deepEqual(scanImports(dir, DECLARED), [
    'hooks/link.ts:1: a symbolic link, which the import scan does not follow: replace it with what it points to',
    'tools:1: a symbolic link, which the import scan does not follow: replace it with what it points to',
  ])
})

test('tools/ holds only .ts, but in tools/fixtures/, where a source must be .ts too', t => {
  const dir = scratchMod(t, {
    'tools/run.sh': 'echo fictional\n',
    'tools/fixtures/sample.json': '{}\n',
    'tools/fixtures/legacy.mjs': 'export const legacy = 1\n',
  })
  assert.deepEqual(scanImports(dir, DECLARED), [
    'tools/fixtures/legacy.mjs:1: a source under tools/ must be .ts',
    'tools/run.sh:1: a file under tools/ but outside tools/fixtures/ must be .ts',
  ])
})

test('the wall judges the file an import resolves to: a root tools.ts is no tool, a tools/index.ts is', t => {
  const file = scratchMod(t, { 'tools.ts': 'export const t = 1\n', 'hooks/e.ts': "export { t } from '../tools'\n" })
  assert.deepEqual(scanImports(file, DECLARED), [])
  const index = scratchMod(t, { 'tools/index.ts': 'export const t = 1\n', 'hooks/e.ts': "export { t } from '../tools'\n" })
  assert.deepEqual(scanImports(index, DECLARED), ["hooks/e.ts:1: '../tools' reaches into tools/, which runs on Node, never in the engine"])
})

test('a reference path crosses the wall like an import, both ways', t => {
  const dir = scratchMod(t, {
    'hooks/shapes.d.ts': 'export type Hook = 1\n',
    'tools/shapes.d.ts': 'export type Tool = 1\n',
    'hooks/register.ts': '/// <reference path="../tools/shapes.d.ts" />\nexport const register = 1\n',
    'tools/convert.ts': '/// <reference path="../hooks/shapes.d.ts" />\nexport const convert = 1\n',
  })
  assert.deepEqual(scanImports(dir, DECLARED), [
    "hooks/register.ts:1: '../tools/shapes.d.ts' reaches into tools/, which runs on Node, never in the engine",
    "tools/convert.ts:1: '../hooks/shapes.d.ts' leaves tools/: a tool imports only from tools/ and node: modules",
  ])
})

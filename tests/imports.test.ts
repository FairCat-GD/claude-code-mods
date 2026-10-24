import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

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

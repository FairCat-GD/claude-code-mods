import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

import { findClaude, main, plan, runStage, SetupError, type Stage, TOOLING_TESTS } from '../scripts/verify.ts'
import { temporaryFolder } from './support.ts'

const FOLDERS = [
  { name: 'alpha', path: 'mods/alpha' },
  { name: 'beta', path: 'mods/beta' },
  { name: 'mod-template', path: 'templates/mod-template' },
]
const REPO_STAGES = ['format', 'lint', 'types', 'tooling-tests', 'marketplace', 'hygiene']
const quiet = () => {}
const exits = (code: number) => ({ argv: [process.execPath, '-e', `process.exit(${code})`] })
const names = (planned: ReturnType<typeof plan>) => {
  assert.ok(Array.isArray(planned), String(planned))
  return planned.map(stage => stage.name)
}

test('every command in a stage runs after one fails', t => {
  const marker = join(temporaryFolder(t), 'ran')
  const stage: Stage = {
    name: 'probe',
    commands: () => [exits(1), { argv: [process.execPath, '-e', `require('fs').writeFileSync(${JSON.stringify(marker)}, '')`] }],
  }
  const [passed] = runStage(stage, quiet)
  assert.equal(passed, false)
  assert.ok(existsSync(marker))
})

test('a missing claude is a setup error that names the fix', () => {
  assert.throws(
    () => findClaude(''),
    (error: unknown) => error instanceof SetupError && /install Claude Code's CLI/.test(error.message),
  )
})

test('a stage that cannot start fails alone', () => {
  const lines: string[] = []
  const broken: Stage = {
    name: 'broken',
    commands: () => {
      throw new SetupError('claude not found')
    },
  }
  assert.equal(
    main([], [broken, { name: 'fine', commands: () => [exits(0)] }], line => lines.push(line)),
    1,
  )
  const summary = lines.slice(lines.indexOf('\n== summary ==') + 1)
  assert.deepEqual(
    summary.slice(0, 2).map(line => line.split(/\s+/).slice(0, 2)),
    [
      ['broken', 'FAIL'],
      ['fine', 'PASS'],
    ],
  )
  assert.ok(lines.includes('verify: broken cannot start: claude not found'))
})

test("verify -- <mod> runs the repo stages and that mod's stages only", () => {
  const scoped = plan(['beta'], FOLDERS)
  assert.ok(Array.isArray(scoped))
  assert.deepEqual(
    scoped.map(stage => stage.name),
    [...REPO_STAGES, 'beta: validate', 'beta: types', 'beta: tests', 'beta: imports'],
  )
  const full = plan([], FOLDERS)
  assert.ok(Array.isArray(full))
  assert.deepEqual(
    full.map(stage => stage.name).filter(name => name.endsWith(': validate')),
    ['alpha: validate', 'beta: validate', 'mod-template: validate'],
  )
})

test('an unknown name exits 2 and lists the stages and mods', () => {
  const lines: string[] = []
  assert.equal(
    main(['nope'], plan(['nope'], FOLDERS), line => lines.push(line)),
    2,
  )
  assert.deepEqual(lines, [
    'verify: unknown name(s) nope; stages: format, lint, types, tooling-tests, marketplace, hygiene, validate, tests, imports; mods: alpha, beta, mod-template',
  ])
})

test('a stage name runs that stage alone', () => {
  assert.deepEqual(names(plan(['hygiene'], FOLDERS)), ['hygiene'])
  assert.deepEqual(names(plan(['format', 'hygiene'], FOLDERS)), ['format', 'hygiene'])
})

test('a mod and a stage name run that stage for that mod', () => {
  assert.deepEqual(names(plan(['beta', 'tests'], FOLDERS)), ['beta: tests'])
})

test("types names the tooling's types and each folder's", () => {
  assert.deepEqual(names(plan(['types'], FOLDERS)), ['types', 'alpha: types', 'beta: types', 'mod-template: types'])
})

test('a name that is both a stage and a mod is the stage', () => {
  assert.deepEqual(names(plan(['tests'], [...FOLDERS, { name: 'tests', path: 'mods/tests' }])), [
    'alpha: tests',
    'beta: tests',
    'mod-template: tests',
    'tests: tests',
  ])
})

test('--message and --all reach hygiene, with the draft resolved where npm was run', () => {
  const planned = plan(['hygiene', '--message', 'draft', '--all'], FOLDERS, '/work')
  assert.ok(Array.isArray(planned))
  assert.deepEqual(planned[0]?.commands()[0]?.argv.slice(1), ['scripts/hygiene.ts', '--message', '/work/draft', '--all'])
  const full = plan(['--message', '/elsewhere/draft'], FOLDERS, '/work')
  assert.ok(Array.isArray(full))
  assert.deepEqual(
    full
      .find(stage => stage.name === 'hygiene')
      ?.commands()[0]
      ?.argv.slice(1),
    ['scripts/hygiene.ts', '--message', '/elsewhere/draft'],
  )
})

test('--message or --all without hygiene exits 2', () => {
  for (const argv of [
    ['tests', '--all'],
    ['format', '--message', 'draft'],
  ]) {
    const lines: string[] = []
    assert.equal(
      main(argv, plan(argv, FOLDERS), line => lines.push(line)),
      2,
    )
    assert.deepEqual(lines, ['verify: --message and --all are for hygiene, which the names leave out'])
  }
})

test('a --message with no file exits 2', () => {
  assert.equal(main(['--message'], plan(['--message'], FOLDERS), quiet), 2)
})

test('tooling-tests collects nothing under tests/fixtures/, even a fixture test file', t => {
  const dir = temporaryFolder(t)
  mkdirSync(join(dir, 'tests/fixtures/m/tests'), { recursive: true })
  writeFileSync(join(dir, 'tests/ok.test.ts'), "import { test } from 'node:test'\ntest('top-level test ran', () => {})\n")
  writeFileSync(
    join(dir, 'tests/fixtures/m/tests/bad.test.ts'),
    "import { test } from 'node:test'\ntest('fixture test ran', () => { throw new Error('collected') })\n",
  )
  const { NODE_TEST_CONTEXT: _, ...env } = process.env
  const run = spawnSync(process.execPath, TOOLING_TESTS, { cwd: dir, env, encoding: 'utf8' })
  assert.equal(run.status, 0, run.stdout)
  assert.match(run.stdout, /top-level test ran/)
  assert.doesNotMatch(run.stdout, /fixture test ran/)
})

test('any error that stops a stage starting fails that stage alone', () => {
  const lines: string[] = []
  const throwing: Stage = {
    name: 'throwing',
    commands: () => {
      throw new Error('Command failed: claude --version')
    },
  }
  assert.equal(
    main([], [throwing, { name: 'fine', commands: () => [exits(0)] }], line => lines.push(line)),
    1,
  )
  assert.ok(lines.includes('verify: throwing cannot start: Command failed: claude --version'))
  assert.ok(lines.some(line => /^fine\s+PASS/.test(line)))
})

test('a directory named claude on PATH is passed over for the CLI further down', t => {
  const first = join(temporaryFolder(t), 'first')
  const second = join(temporaryFolder(t), 'second')
  mkdirSync(join(first, 'claude'), { recursive: true })
  mkdirSync(second)
  writeFileSync(join(second, 'claude'), '#!/bin/sh\n', { mode: 0o755 })
  assert.equal(findClaude(`${first}:${second}`), join(second, 'claude'))
  assert.throws(() => findClaude(first), SetupError)
})

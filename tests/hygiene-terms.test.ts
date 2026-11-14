import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

import { HygieneError, loadTerms, mask, run, tokens } from '../scripts/hygiene.ts'
import { CYRILLIC_TERM, cli, draft, HYGIENE, pushedRepo, SECRETS, scan, TERM, TERMS } from './hygiene-support.ts'
import { temporaryFolder } from './support.ts'

// The term list

test('a missing term list fails', t => {
  assert.throws(
    () => loadTerms(join(temporaryFolder(t), 'absent.txt')),
    (error: unknown) => error instanceof HygieneError && error.message.startsWith('no term list at '),
  )
})

test('a missing term list at the default place fails the stage, named by ~', t => {
  const repo = pushedRepo(t)
  const result = spawnSync(process.execPath, [HYGIENE], { cwd: repo.path, env: { ...process.env, HOME: temporaryFolder(t) }, encoding: 'utf8' })
  assert.equal(result.status, 1)
  assert.equal(result.stdout, 'hygiene: no term list at ~/.config/hygiene/terms.txt\n')
})

test('an empty term list passes', t => {
  const repo = pushedRepo(t)
  repo.write('b.md', `${TERM}\n`)
  const empty = join(temporaryFolder(t), 'terms.txt')
  writeFileSync(empty, '')
  assert.deepEqual(run(repo.path, empty, { sources: [] }).failures, [])
})

test('terms are composed, trimmed and lowercased', t => {
  const file = join(temporaryFolder(t), 'terms.txt')
  writeFileSync(file, `  ${CYRILLIC_TERM.toUpperCase().normalize('NFD')}  \n\n${TERM}\nterm2\n`)
  assert.deepEqual([...loadTerms(file)].sort(), [TERM.toLowerCase(), 'term2', CYRILLIC_TERM.toLowerCase()].sort())
})

for (const line of ['two words', 'hyphen-ated', 'dotted.name']) {
  test(`a term list line that could never match fails without printing it: ${line}`, t => {
    const file = join(temporaryFolder(t), 'terms.txt')
    writeFileSync(file, `${TERM}\n${line}\n`)
    assert.throws(
      () => loadTerms(file),
      (error: unknown) => error instanceof HygieneError && error.message === 'term list line 2 is not one word',
    )
  })
}

// Tokens

test('a run splits into its camel-case words and digit groups', () => {
  assert.deepEqual([...tokens('XMLParser')].sort(), ['parser', 'xml', 'xmlparser'])
  assert.deepEqual([...tokens('notes2026v')].sort(), ['2026', 'notes', 'notes2026v', 'v'])
  assert.ok(tokens('a_word-b').has('word'))
})

const WRITTEN = {
  plain: TERM,
  uppercase: TERM.toUpperCase(),
  'camel case': `my${TERM}Notes`,
  'beside digits': `${TERM.toLowerCase()}2026`,
  Cyrillic: `Привет, ${CYRILLIC_TERM}!`,
  'Cyrillic camel case': `мой${CYRILLIC_TERM}Текст`,
  'Cyrillic, decomposed': CYRILLIC_TERM.normalize('NFD'),
}
for (const [name, text] of Object.entries(WRITTEN)) {
  test(`a term is found however it is written: ${name}`, t => {
    const repo = pushedRepo(t)
    repo.write('b.md', `${text}\n`)
    assert.deepEqual(scan(repo).failures, ['b.md:1: private term'])
  })
}

test('a term joined inside one lowercase run is not found', t => {
  const repo = pushedRepo(t)
  repo.write('b.md', `my${TERM.toLowerCase()}notes\n`)
  assert.deepEqual(scan(repo).failures, [])
})

// What a hit prints

test('a term in a path is masked', t => {
  const repo = pushedRepo(t)
  repo.write(`notes/${TERM}-plan.md`)
  assert.deepEqual(scan(repo).failures, ['notes/***: private term in the path'])
  assert.equal(mask('notes/plan.md', loadTerms(TERMS)), 'notes/plan.md')
})

test('no output names the term or the secret', t => {
  const repo = pushedRepo(t)
  repo.write('b.md', `${TERM} ${SECRETS.github}\n`)
  const result = cli(repo, '--all', '--message', draft(repo, `subject\n\n${CYRILLIC_TERM}\n`))
  assert.equal(result.status, 1)
  assert.match(result.stdout, /^b\.md:1: private term$/m)
  assert.match(result.stdout, /^b\.md:1: secret$/m)
  assert.match(result.stdout, /^draft line 3: private term$/m)
  for (const banned of [TERM, CYRILLIC_TERM, SECRETS.github ?? '']) assert.ok(!result.stdout.toLowerCase().includes(banned.toLowerCase()))
})

// Errors

test('outside a git repository the stage fails, saying so', t => {
  const result = spawnSync(process.execPath, [HYGIENE, '--terms', TERMS], { cwd: temporaryFolder(t), encoding: 'utf8' })
  assert.equal(result.status, 1)
  assert.equal(result.stdout, 'hygiene: not inside a git repository\n')
})

test('an unknown option fails the stage, saying so', t => {
  const result = cli(pushedRepo(t), '--everything')
  assert.equal(result.status, 1)
  assert.match(result.stdout, /^hygiene: Unknown option '--everything'/)
})

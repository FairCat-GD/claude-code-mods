import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

import { check, commitMessages, loadTerms, scanFiles, scanMessages } from '../scripts/hygiene.ts'
import { temporaryFolder } from './support.ts'

const PROBE = 'zqxhygieneprobe'
const PROBE_HASH = createHash('sha256').update(PROBE).digest('hex')
const TERMS = new Set([PROBE_HASH])
// Assembled from pieces so that this file never holds what the stage bans.
const TRAILER = `Co${'-authored-by'}: Someone <someone@example.invalid>`
const GENERATED = `Gener${'ated'} with some tool`
const SESSION_LINK = `https://clau${'de.ai'}/code/session_0123`

const git = (repo: string, ...args: string[]) => {
  const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }
  execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', ...args], { cwd: repo, env, stdio: 'ignore' })
}

test('the terms file holds at least the seven hashes', () => {
  const terms = loadTerms()
  assert.ok(terms.size >= 7)
  assert.ok([...terms].every(term => /^[0-9a-f]{64}$/.test(term)))
})

test('a term in a file is reported by file and line, never by name', t => {
  const dir = temporaryFolder(t)
  writeFileSync(join(dir, 'notes.txt'), `first line\nsecond line, ${PROBE.toUpperCase()}!\n`)
  writeFileSync(join(dir, 'clean.txt'), 'nothing to see\n')
  const problems = scanFiles(dir, ['notes.txt', 'clean.txt'], TERMS)
  assert.deepEqual(problems, [`notes.txt:2: private term (hash ${PROBE_HASH.slice(0, 12)})`])
  assert.ok(!problems.join('').includes(PROBE))
})

test('a term joined to a word or number is reported', t => {
  const dir = temporaryFolder(t)
  const capitalized = PROBE[0]?.toUpperCase() + PROBE.slice(1)
  writeFileSync(join(dir, 'joined.txt'), `my${capitalized}Notes\n${PROBE}2026\n`)
  const problems = scanFiles(dir, ['joined.txt'], TERMS)
  assert.deepEqual(
    problems.map(problem => problem.split(': ')[0]),
    ['joined.txt:1', 'joined.txt:2'],
  )
})

test('a term in a path is reported', t => {
  const dir = temporaryFolder(t)
  const name = `${PROBE}-notes.txt`
  writeFileSync(join(dir, name), 'nothing to see\n')
  assert.deepEqual(scanFiles(dir, [name], TERMS), [`${name}: private term in the path (hash ${PROBE_HASH.slice(0, 12)})`])
})

test('binary files are skipped', t => {
  const dir = temporaryFolder(t)
  writeFileSync(join(dir, 'image.bin'), Buffer.concat([Buffer.from([0]), Buffer.from(PROBE)]))
  assert.deepEqual(scanFiles(dir, ['image.bin'], TERMS), [])
})

test('attribution in commit messages is reported', t => {
  const dir = temporaryFolder(t)
  git(dir, 'init', '-q', '-b', 'main')
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'feat: clean\n\nA plain body.')
  git(dir, 'commit', '-q', '--allow-empty', '-m', `fix: one\n\n${TRAILER}`)
  git(dir, 'commit', '-q', '--allow-empty', '-m', `fix: two\n\n${GENERATED}`)
  git(dir, 'commit', '-q', '--allow-empty', '-m', `fix: three\n\nSee ${SESSION_LINK}`)
  git(dir, 'commit', '-q', '--allow-empty', '-m', `fix: four\n\nAbout ${PROBE}.`)
  const problems = scanMessages(commitMessages(dir), TERMS)
  const kinds = problems.map(problem => problem.slice(problem.indexOf(': ') + 2)).sort()
  assert.deepEqual(kinds, ['AI session link', 'co-author trailer', 'generated-with line', `private term (hash ${PROBE_HASH.slice(0, 12)})`])
  assert.ok(problems.every(problem => problem.includes(', message line 3: ')))
})

test('a term staged but gone from the working tree is reported', t => {
  const dir = temporaryFolder(t)
  git(dir, 'init', '-q', '-b', 'main')
  writeFileSync(join(dir, 'notes.txt'), `a ${PROBE}\n`)
  git(dir, 'add', 'notes.txt')
  writeFileSync(join(dir, 'notes.txt'), 'clean again\n')
  assert.deepEqual(check(dir, TERMS), [`notes.txt (staged):1: private term (hash ${PROBE_HASH.slice(0, 12)})`])
})

test('a clean repository passes', t => {
  const dir = temporaryFolder(t)
  writeFileSync(join(dir, 'README.md'), 'A fictional project.\n')
  git(dir, 'init', '-q', '-b', 'main')
  git(dir, 'add', 'README.md')
  git(dir, 'commit', '-q', '-m', 'docs: a readme\n\nA plain body.')
  writeFileSync(join(dir, 'untracked.txt'), `${PROBE}\n`)
  assert.deepEqual(check(dir, new Set()), [])
  assert.deepEqual(check(dir, TERMS), [`untracked.txt:1: private term (hash ${PROBE_HASH.slice(0, 12)})`])
})

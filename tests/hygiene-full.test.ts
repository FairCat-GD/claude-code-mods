import assert from 'node:assert/strict'
import { copyFileSync, existsSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

import { run, stampPath } from '../scripts/hygiene.ts'
import { cli, draft, FAR_FUTURE, pushedRepo, scan, setStamp, TERM, TERMS } from './hygiene-support.ts'
import { git, scratchRepo, temporaryFolder } from './support.ts'

// The full scan

test('a missing stamp turns a routine run into a full scan, which still reads the draft', t => {
  const repo = scratchRepo(t)
  repo.commit('docs: notes', { 'b.md': `${TERM}\n` })
  repo.markPushed()
  const report = run(repo.path, TERMS, { message: draft(repo, `subject\n\nabout ${TERM}\n`), sources: [] })
  assert.equal(report.fullScan, true)
  assert.deepEqual(report.failures, ['draft line 3: private term', 'b.md:1: private term'])
})

test('a term list touched after the stamp turns a routine run into a full scan', t => {
  const repo = pushedRepo(t)
  const terms = join(temporaryFolder(t), 'terms.txt')
  copyFileSync(TERMS, terms)
  setStamp(repo, 1_000_000_000)
  assert.equal(run(repo.path, terms, { sources: [] }).fullScan, true)
  setStamp(repo, FAR_FUTURE)
  assert.equal(run(repo.path, terms, { sources: [] }).fullScan, false)
})

test('a stage source touched after the stamp turns a routine run into a full scan', t => {
  const repo = pushedRepo(t)
  const terms = join(temporaryFolder(t), 'terms.txt')
  copyFileSync(TERMS, terms)
  utimesSync(terms, 1_000_000_000, 1_000_000_000)
  const source = join(temporaryFolder(t), 'source.ts')
  writeFileSync(source, '')
  utimesSync(source, 1_700_000_000, 1_700_000_000)
  setStamp(repo, 1_500_000_000)
  assert.equal(run(repo.path, terms, { sources: [] }).fullScan, false)
  assert.equal(run(repo.path, terms, { sources: [source] }).fullScan, true)
})

test('a clean full scan renews the stamp', t => {
  const repo = pushedRepo(t)
  const stamp = setStamp(repo, 1_000_000_000)
  assert.deepEqual(scan(repo, { full: true }).failures, [])
  assert.ok(statSync(stamp).mtimeMs > 1_000_000_000_000)
})

test('a full scan holding a file hit fails and leaves the stamp as it was', t => {
  const repo = scratchRepo(t)
  repo.commit('docs: notes', { 'b.md': `${TERM}\n` })
  repo.markPushed()
  const stamp = setStamp(repo, 1_000_000_000)
  assert.deepEqual(scan(repo, { full: true }).failures, ['b.md:1: private term'])
  assert.equal(statSync(stamp).mtimeMs, 1_000_000_000_000)
  rmSync(stamp)
  assert.equal(run(repo.path, TERMS, { sources: [] }).fullScan, true)
  assert.ok(!existsSync(stamp))
})

test('a full scan reads the staged contents of every path', t => {
  const repo = pushedRepo(t)
  repo.write('a.md', `${TERM}\n`)
  git(repo.path, 'add', 'a.md')
  repo.write('a.md', 'nothing to see\n')
  assert.deepEqual(scan(repo, { full: true }).failures, ['a.md:1: private term'])
})

test('a hit in a pushed message passes a full scan and is counted on the last line', t => {
  const repo = pushedRepo(t)
  repo.commit(`docs: notes\n\nabout ${TERM}`)
  repo.markPushed()
  const place = `commit ${repo.head().slice(0, 10)} line 3: private term`
  assert.deepEqual(scan(repo, { full: true }), { failures: [], pushed: [place], fullScan: true })
  const result = cli(repo, '--all')
  assert.equal(result.status, 0)
  assert.deepEqual(result.stdout.trimEnd().split('\n'), ['hygiene: clean', `pushed ${place}`, 'hygiene: full scan, 1 hit(s) in pushed history'])
})

test('a hit in a message on no remote fails a full scan', t => {
  const repo = pushedRepo(t)
  repo.commit(`docs: notes\n\nabout ${TERM}`)
  assert.deepEqual(scan(repo, { full: true }).failures, [`commit ${repo.head().slice(0, 10)} line 3: private term`])
})

test('a routine run prints no pushed count', t => {
  const repo = pushedRepo(t)
  setStamp(repo, FAR_FUTURE)
  const result = cli(repo)
  assert.equal(result.status, 0)
  assert.equal(result.stdout, 'hygiene: clean\n')
})

test('the stamp lives in the shared git directory', t => {
  const repo = pushedRepo(t)
  const worktree = join(repo.path, '..', 'worktree')
  git(repo.path, 'worktree', 'add', '-q', '-b', 'part', worktree)
  assert.equal(stampPath(worktree), stampPath(repo.path))
})

test('a full scan reads a conflicted path from its working copy', t => {
  const repo = scratchRepo(t)
  repo.commit('docs: start', { 'a.md': 'start\n', '.env': 'start\n' })
  repo.markPushed()
  git(repo.path, 'checkout', '-q', '-b', 'side')
  repo.commit('docs: side', { 'a.md': 'side\n', '.env': 'side\n' })
  git(repo.path, 'checkout', '-q', 'main')
  repo.commit('docs: main', { 'a.md': 'main\n', '.env': 'main\n' })
  assert.throws(() => git(repo.path, 'merge', '-q', 'side'))
  repo.write('a.md', `${TERM}\n`)
  repo.write('.env', 'resolved\n')
  assert.deepEqual(scan(repo, { full: true }).failures, ['.env: an env file a commit could record', 'a.md:1: private term'])
})

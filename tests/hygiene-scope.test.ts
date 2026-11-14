import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

import { HygieneError } from '../scripts/hygiene.ts'
import { pushedRepo, scan, TERM } from './hygiene-support.ts'
import { git, scratchRepo } from './support.ts'

// What a routine run reads

test('a repository with no commits passes', t => {
  const repo = scratchRepo(t)
  repo.write('b.md', `${TERM}\n`)
  assert.deepEqual(scan(repo).failures, [])
})

test('a change left unstaged is read', t => {
  const repo = pushedRepo(t)
  repo.write('a.md', `${TERM}\n`)
  assert.deepEqual(scan(repo).failures, ['a.md:1: private term'])
})

test('both versions of a path are read', t => {
  const repo = pushedRepo(t)
  repo.write('a.md', `${TERM}\n`)
  git(repo.path, 'add', 'a.md')
  repo.write('a.md', `clean\n${TERM}\n`)
  assert.deepEqual(scan(repo).failures, ['a.md:1: private term', 'a.md:2: private term'])
})

test('a hit seen twice is reported once', t => {
  const repo = pushedRepo(t)
  repo.write('a.md', `${TERM}\n`)
  git(repo.path, 'add', 'a.md')
  repo.write('a.md', `${TERM}\nclean\n`)
  assert.deepEqual(scan(repo).failures, ['a.md:1: private term'])
})

test('an untracked file is read and an ignored one is not', t => {
  const repo = scratchRepo(t)
  repo.commit('chore: ignore a file', { '.gitignore': 'ignored.md\n' })
  repo.markPushed()
  repo.write('ignored.md', `${TERM}\n`)
  repo.write('fresh.md', `${TERM}\n`)
  assert.deepEqual(scan(repo).failures, ['fresh.md:1: private term'])
})

test('a commit on no remote is read', t => {
  const repo = pushedRepo(t)
  repo.commit('docs: notes', { 'b.md': `${TERM}\n` })
  assert.deepEqual(scan(repo).failures, ['b.md:1: private term'])
})

test('a pushed commit is skipped by a routine run', t => {
  const repo = pushedRepo(t)
  repo.commit('docs: notes', { 'b.md': `${TERM}\n` })
  repo.markPushed()
  assert.deepEqual(scan(repo).failures, [])
})

test('a file committed without the stage is read as it stands now, so a later fix passes', t => {
  const repo = pushedRepo(t)
  repo.commit('docs: notes', { 'b.md': `clean\n${TERM}\n` })
  assert.deepEqual(scan(repo).failures, ['b.md:2: private term'])
  repo.commit('docs: fix the notes', { 'b.md': 'clean\n' })
  assert.deepEqual(scan(repo).failures, [])
})

test('a removal left unstaged still fails on the staged copy', t => {
  const repo = pushedRepo(t)
  repo.commit('docs: notes', { 'b.md': `${TERM}\n` })
  repo.markPushed()
  rmSync(join(repo.path, 'b.md'))
  assert.deepEqual(scan(repo).failures, ['b.md:1: private term'])
  git(repo.path, 'rm', '-q', '--cached', 'b.md')
  assert.deepEqual(scan(repo).failures, [])
})

test('removing a path that holds a term passes', t => {
  const repo = pushedRepo(t)
  repo.commit('docs: notes', { 'b.md': `${TERM}\n` })
  git(repo.path, 'rm', '-q', 'b.md')
  assert.deepEqual(scan(repo).failures, [])
})

test('renaming a path that holds a term passes', t => {
  const repo = pushedRepo(t)
  repo.commit('docs: notes', { [`${TERM}.md`]: 'nothing to see\n' })
  repo.markPushed()
  git(repo.path, 'mv', `${TERM}.md`, 'notes.md')
  assert.deepEqual(scan(repo).failures, [])
})

test('a path no longer in the tree is skipped', t => {
  const repo = pushedRepo(t)
  repo.commit('docs: notes', { 'b.md': `${TERM}\n` })
  git(repo.path, 'rm', '-q', 'b.md')
  repo.commit('docs: drop the notes')
  assert.deepEqual(scan(repo).failures, [])
})

test('a change made only by a merge resolution is read', t => {
  const repo = pushedRepo(t)
  git(repo.path, 'checkout', '-q', '-b', 'side')
  repo.commit('docs: side', { 'c.md': 'nothing to see\n' })
  git(repo.path, 'checkout', '-q', 'main')
  repo.commit('docs: main', { 'd.md': 'nothing to see\n' })
  git(repo.path, 'merge', '-q', '--no-ff', '--no-commit', 'side')
  repo.write('a.md', `${TERM}\n`)
  git(repo.path, 'add', 'a.md')
  git(repo.path, 'commit', '-q', '-m', 'merge: side')
  assert.deepEqual(scan(repo).failures, ['a.md:1: private term'])
})

test('a binary file is skipped', t => {
  const repo = pushedRepo(t)
  writeFileSync(join(repo.path, 'image.bin'), Buffer.concat([Buffer.from([0]), Buffer.from(TERM)]))
  assert.deepEqual(scan(repo).failures, [])
})

test('a submodule entry is skipped', t => {
  const repo = scratchRepo(t)
  repo.commit(`docs: about ${TERM}`)
  repo.markPushed()
  git(repo.path, 'update-index', '--add', '--cacheinfo', `160000,${repo.head()},module`)
  assert.deepEqual(scan(repo).failures, [])
})

test('a symlink is read as its target and never followed', t => {
  const repo = pushedRepo(t)
  const outside = join(repo.path, '..', 'outside.md')
  writeFileSync(outside, `${TERM}\n`)
  symlinkSync(outside, join(repo.path, 'link.md'))
  assert.deepEqual(scan(repo).failures, [])
  rmSync(join(repo.path, 'link.md'))
  symlinkSync(TERM, join(repo.path, 'link.md'))
  assert.deepEqual(scan(repo).failures, ['link.md:1: private term'])
})

test('signature checks in the git config do not disturb what is read', t => {
  const repo = pushedRepo(t)
  const signing = join(repo.path, '..', 'signing')
  execFileSync('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-f', signing])
  const config = { 'gpg.format': 'ssh', 'user.signingKey': `${signing}.pub`, 'commit.gpgSign': 'true', 'log.showSignature': 'true' }
  for (const [name, value] of Object.entries(config)) git(repo.path, 'config', name, value)
  repo.commit(`docs: notes\n\nabout ${TERM}`, { 'b.md': `${TERM}\n` })
  assert.deepEqual(scan(repo).failures, ['b.md:1: private term', `commit ${repo.head().slice(0, 10)} line 3: private term`])
})

test('an object the stage cannot read fails it, rather than shifting what it reads', t => {
  const repo = pushedRepo(t)
  const ghost = '1'.repeat(40)
  git(repo.path, 'update-index', '--add', '--cacheinfo', `100644,${ghost},ghost.md`)
  repo.write('later.md', `${TERM}\n`)
  git(repo.path, 'add', 'later.md')
  assert.throws(
    () => scan(repo),
    (error: unknown) => error instanceof HygieneError && error.message === `cannot read object ${ghost.slice(0, 10)}`,
  )
})

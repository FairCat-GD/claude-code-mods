import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, rmSync, statSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { type TestContext, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { HygieneError, loadTerms, mask, run, stampPath, tokens } from '../scripts/hygiene.ts'
import { FIXTURES, GIT_ISOLATION, git, type ScratchRepo, scratchRepo, temporaryFolder } from './support.ts'

// The stage's own git calls read no config but the scratch repository's.
Object.assign(process.env, GIT_ISOLATION)

const HYGIENE = fileURLToPath(new URL('../scripts/hygiene.ts', import.meta.url))
const TERMS = join(FIXTURES, 'hygiene-terms.txt')
const TERM = 'Brumvex'
const CYRILLIC_TERM = 'Йорвинд'
const FAR_FUTURE = 4_000_000_000

const pushedRepo = (t: TestContext) => {
  const repo = scratchRepo(t)
  repo.commit('docs: a readme', { 'a.md': 'nothing to see\n' })
  repo.markPushed()
  return repo
}

const setStamp = (repo: ScratchRepo, seconds: number) => {
  const stamp = stampPath(repo.path)
  writeFileSync(stamp, '')
  utimesSync(stamp, seconds, seconds)
  return stamp
}

// A routine run unless asked otherwise: a fresh stamp, and no stage source to outdate it.
const scan = (repo: ScratchRepo, { message, full = false }: { message?: string; full?: boolean } = {}) => {
  if (!full) setStamp(repo, FAR_FUTURE)
  return run(repo.path, TERMS, { message, full, sources: [] })
}

const draft = (repo: ScratchRepo, text: string) => {
  const path = join(repo.path, '..', 'draft')
  writeFileSync(path, text)
  return path
}

const cli = (repo: ScratchRepo, ...args: string[]) => spawnSync(process.execPath, [HYGIENE, '--terms', TERMS, ...args], { cwd: repo.path, encoding: 'utf8' })

// A token-shaped string, built at run time so that no file here holds one.
const key = (start: string, length: number, alphabet = 'aB3') => start + alphabet.repeat(length).slice(0, length)

const DASHES = '-'.repeat(5)
const SECRETS: Record<string, string> = {
  'private key': `${DASHES}BEGIN RSA PRIVATE KEY${DASHES}`,
  'private key, no words': `${DASHES}BEGIN PRIVATE KEY${DASHES}`,
  aws: key(`AK${'IA'}`, 16, 'A1'),
  'aws session': key(`AS${'IA'}`, 16, 'B2'),
  github: key(`gh${'p_'}`, 36),
  'github server': key(`gh${'s_'}`, 36),
  'github fine-grained': `github${'_pat_'}${key('', 22)}_${key('', 59)}`,
  slack: `xo${'xb-'}12345-${key('', 12)}`,
  anthropic: `sk${'-ant-api03-'}${key('', 80)}`,
  'openai project': `sk${'-proj-'}${key('', 40)}`,
  'openai service': `sk${'-svcacct-'}${key('', 40)}`,
  'openai admin': `sk${'-admin-'}${key('', 40)}`,
  'openai plain': `sk-${key('', 48)}`,
}

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

// Secrets

for (const [name, secret] of Object.entries(SECRETS)) {
  test(`a secret fails: ${name}`, t => {
    const repo = pushedRepo(t)
    repo.write('b.md', `value = ${secret}\n`)
    assert.deepEqual(scan(repo).failures, ['b.md:1: secret'])
  })
}

test('a secret in the draft fails', t => {
  const repo = pushedRepo(t)
  assert.deepEqual(scan(repo, { message: draft(repo, SECRETS.aws ?? '') }).failures, ['draft line 1: secret'])
})

const NEAR_MISSES = {
  'a hyphenated name holding the plain prefix': `a task-sk-${key('', 48)} name`,
  'a fixture prefix': `github${'_pat_'}TEST`,
  'a short token': `gh${'p_'}short`,
  'a word after the key prefix': `AK${'IA'}_NOT_A_KEY`,
  'a short key': `sk${'-ant-'}too-short`,
}
for (const [name, text] of Object.entries(NEAR_MISSES)) {
  test(`a near miss passes: ${name}`, t => {
    const repo = pushedRepo(t)
    repo.write('b.md', `${text}\n`)
    assert.deepEqual(scan(repo).failures, [])
  })
}

for (const path of ['.env', '.env.local', 'tests/fixtures/.env', '.ENV', '.Env.local']) {
  test(`an env file a commit could record fails: ${path}`, t => {
    const repo = pushedRepo(t)
    repo.write(path)
    assert.deepEqual(scan(repo).failures, [`${path}: an env file a commit could record`])
  })
}

test('a tracked env file fails even unchanged', t => {
  const repo = scratchRepo(t)
  repo.commit('chore: settings', { '.env': 'nothing to see\n' })
  repo.markPushed()
  assert.deepEqual(scan(repo).failures, ['.env: an env file a commit could record'])
})

for (const path of ['.env.example', '.env.sample', '.env.template', '.envrc']) {
  test(`an env template passes: ${path}`, t => {
    const repo = pushedRepo(t)
    repo.write(path)
    assert.deepEqual(scan(repo).failures, [])
  })
}

// Conflict markers

for (const marker of [`${'<'.repeat(7)} ours`, `${'>'.repeat(7)} theirs`]) {
  test(`a conflict marker fails: ${marker.slice(0, 1)}`, t => {
    const repo = pushedRepo(t)
    repo.write('b.md', `text\n${marker}\n`)
    assert.deepEqual(scan(repo).failures, ['b.md:2: conflict marker'])
  })
}

const NOT_MARKERS = {
  'a bare line': '='.repeat(7),
  'a heading underline': `Heading\n${'='.repeat(7)}`,
  'a marker inside a sentence': `inside ${'<'.repeat(7)} a sentence`,
}
for (const [name, text] of Object.entries(NOT_MARKERS)) {
  test(`not a conflict marker: ${name}`, t => {
    const repo = pushedRepo(t)
    repo.write('b.md', `${text}\n`)
    assert.deepEqual(scan(repo).failures, [])
  })
}

// The draft and attribution

test('a term in the draft fails', t => {
  const repo = pushedRepo(t)
  assert.deepEqual(scan(repo, { message: draft(repo, `subject\n\nabout ${TERM}\n`) }).failures, ['draft line 3: private term'])
})

test('a missing draft fails', t => {
  const repo = pushedRepo(t)
  assert.throws(
    () => run(repo.path, TERMS, { message: join(repo.path, 'absent'), sources: [] }),
    (error: unknown) => error instanceof HygieneError && error.message.startsWith('no draft at '),
  )
})

const ATTRIBUTION = [
  `Co${'-Authored'}-By: Someone <someone@example.invalid>`,
  `co${'-authored'}-by: a person`,
  `Generated with ${'Claude'} Code`,
  `generated with [${'Claude'} Code](https://example.invalid)`,
  `Written by Chat${'GPT'}`,
  `Built using Co${'pilot'}`,
  `Produced with the help of an ${'AI'}`,
  `See https://clau${'de.ai'}/code/session_abc`,
  `See https://chat${'gpt.com'}/share/abc`,
  `Assisted-by: ${'Claude'}`,
  `Generated-by: ${'Claude'} Code`,
  `Built with ${'Cursor'}`,
]
for (const [index, line] of ATTRIBUTION.entries()) {
  test(`attribution in the draft fails: form ${index + 1}`, t => {
    const repo = pushedRepo(t)
    assert.deepEqual(scan(repo, { message: draft(repo, `subject\n\n${line}\n`) }).failures, ['draft line 3: attribution'])
  })
}

const ORDINARY = [
  'generated with the codegen script',
  'written by a member',
  'a mod for Claude Code, built with its plugin API',
  'the hook calls Claude through the Messages API',
  'the listing is built with cursor pagination',
  'the check is built with claude-haiku-5-5',
  'generated by the nightly pass',
]
for (const line of ORDINARY) {
  test(`an ordinary line passes the attribution check: ${line}`, t => {
    const repo = pushedRepo(t)
    assert.deepEqual(scan(repo, { message: draft(repo, `subject\n\n${line}\n`) }).failures, [])
  })
}

test('attribution in a file is not checked', t => {
  const repo = pushedRepo(t)
  repo.write('b.md', `${ATTRIBUTION[2]}\n`)
  assert.deepEqual(scan(repo).failures, [])
})

test('attribution in a commit on no remote fails', t => {
  const repo = pushedRepo(t)
  repo.commit(`fix: one\n\n${ATTRIBUTION[0]}`)
  assert.deepEqual(scan(repo).failures, [`commit ${repo.head().slice(0, 10)} line 3: attribution`])
})

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

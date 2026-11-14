import { spawnSync } from 'node:child_process'
import { utimesSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { fileURLToPath } from 'node:url'

import { run, stampPath } from '../scripts/hygiene.ts'
import { FIXTURES, GIT_ISOLATION, type ScratchRepo, scratchRepo } from './support.ts'

// The stage's own git calls read no config but the scratch repository's.
Object.assign(process.env, GIT_ISOLATION)

export const HYGIENE = fileURLToPath(new URL('../scripts/hygiene.ts', import.meta.url))
export const TERMS = join(FIXTURES, 'hygiene-terms.txt')
export const TERM = 'Brumvex'
export const CYRILLIC_TERM = 'Йорвинд'
export const FAR_FUTURE = 4_000_000_000

export const pushedRepo = (t: TestContext) => {
  const repo = scratchRepo(t)
  repo.commit('docs: a readme', { 'a.md': 'nothing to see\n' })
  repo.markPushed()
  return repo
}

export const setStamp = (repo: ScratchRepo, seconds: number) => {
  const stamp = stampPath(repo.path)
  writeFileSync(stamp, '')
  utimesSync(stamp, seconds, seconds)
  return stamp
}

// A routine run unless asked otherwise: a fresh stamp, and no stage source to outdate it.
export const scan = (repo: ScratchRepo, { message, full = false }: { message?: string; full?: boolean } = {}) => {
  if (!full) setStamp(repo, FAR_FUTURE)
  return run(repo.path, TERMS, { message, full, sources: [] })
}

export const draft = (repo: ScratchRepo, text: string) => {
  const path = join(repo.path, '..', 'draft')
  writeFileSync(path, text)
  return path
}

export const cli = (repo: ScratchRepo, ...args: string[]) =>
  spawnSync(process.execPath, [HYGIENE, '--terms', TERMS, ...args], { cwd: repo.path, encoding: 'utf8' })

// A token-shaped string, built at run time so that no file here holds one.
export const key = (start: string, length: number, alphabet = 'aB3') => start + alphabet.repeat(length).slice(0, length)

export const DASHES = '-'.repeat(5)
export const SECRETS: Record<string, string> = {
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

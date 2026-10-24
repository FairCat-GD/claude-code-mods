// Keeps private terms and AI attribution out of the repository's files and commit messages.

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isFile, ROOT } from './repo.ts'

export const TERMS_FILE = fileURLToPath(new URL('hygiene_terms.txt', import.meta.url))
const RUN = /[a-z0-9]+/g
// Camel-case words and digit groups inside a run, so a term joined to another word is still seen.
const SUBTOKEN = /[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g
// biome-ignore lint/suspicious/noControlCharactersInRegex: the boundaries Python's str.splitlines() splits on, which the line numbers follow.
const LINE_BREAK = /\r\n|[\n\v\f\r\x1c-\x1e\x85\u2028\u2029]/
const GITLINK = '160000'
// Assembled from pieces so that this file never holds what it bans.
const ATTRIBUTION: Record<string, RegExp> = {
  'co-author trailer': new RegExp(`^[ \\t]*co${'-author'}ed-by[ \\t]*:`, 'gim'),
  'generated-with line': new RegExp(`gener${'ated'}\\s+with`, 'gi'),
  'AI session link': new RegExp(`https?://(?:[a-z0-9-]+\\.)*(?:clau${'de\\.ai'}|chat${'gpt\\.com'})/`, 'gi'),
}

export type Terms = ReadonlySet<string>

const splitLines = (text: string): string[] => {
  const lines = text.split(LINE_BREAK)
  if (lines.at(-1) === '') lines.pop()
  return lines
}

const decode = (data: Uint8Array) => new TextDecoder('utf-8').decode(data)

export const loadTerms = (path = TERMS_FILE): Terms =>
  new Set(
    splitLines(readFileSync(path, 'utf8'))
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')),
  )

const digests = new Map<string, string>()
const digest = (token: string) => {
  let hash = digests.get(token)
  if (hash === undefined) {
    hash = createHash('sha256').update(token, 'utf8').digest('hex')
    digests.set(token, hash)
  }
  return hash
}

function* termHits(text: string, terms: Terms): Generator<[number, string]> {
  for (const [index, line] of splitLines(text).entries()) {
    const tokens = new Set(line.toLowerCase().match(RUN) ?? [])
    for (const token of line.match(SUBTOKEN) ?? []) tokens.add(token.toLowerCase())
    const hits = new Set([...tokens].map(digest).filter(hash => terms.has(hash)))
    for (const hash of [...hits].sort()) yield [index + 1, hash]
  }
}

export const scanFiles = (root: string, paths: Iterable<string>, terms: Terms): string[] => {
  const problems: string[] = []
  for (const path of paths) {
    for (const [, hash] of termHits(path, terms)) problems.push(`${path}: private term in the path (hash ${hash.slice(0, 12)})`)
    const file = join(root, path)
    if (!isFile(file)) continue
    const data = readFileSync(file)
    if (data.includes(0)) continue
    for (const [number, hash] of termHits(decode(data), terms)) problems.push(`${path}:${number}: private term (hash ${hash.slice(0, 12)})`)
  }
  return problems
}

export const scanStaged = (root: string, staged: ReadonlyMap<string, Buffer>, terms: Terms): string[] => {
  const problems: string[] = []
  for (const [path, data] of staged) {
    const file = join(root, path)
    if (data.includes(0) || (isFile(file) && readFileSync(file).equals(data))) continue
    for (const [number, hash] of termHits(decode(data), terms)) problems.push(`${path} (staged):${number}: private term (hash ${hash.slice(0, 12)})`)
  }
  return problems
}

export const scanMessages = (commits: Iterable<[string, string]>, terms: Terms): string[] => {
  const problems: string[] = []
  for (const [sha, message] of commits) {
    for (const [kind, pattern] of Object.entries(ATTRIBUTION)) {
      for (const match of message.matchAll(pattern)) {
        const number = message.slice(0, match.index).split('\n').length
        problems.push(`commit ${sha.slice(0, 12)}, message line ${number}: ${kind}`)
      }
    }
    for (const [number, hash] of termHits(message, terms)) {
      problems.push(`commit ${sha.slice(0, 12)}, message line ${number}: private term (hash ${hash.slice(0, 12)})`)
    }
  }
  return problems
}

const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 30 })

export const repositoryFiles = (root: string): string[] => {
  // Untracked files count too, so a new file is checked before it is staged.
  const listing = git(root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard')
  return [...new Set(listing.split('\0').filter(Boolean))].sort()
}

export const stagedContents = (root: string): Map<string, Buffer> => {
  // The index is what a commit records, and it can differ from the working tree.
  const entries = new Map<string, string>()
  for (const entry of git(root, 'ls-files', '-z', '--stage').split('\0').filter(Boolean)) {
    const tab = entry.indexOf('\t')
    const [mode = '', sha = ''] = entry.slice(0, tab).split(' ')
    if (mode !== GITLINK) entries.set(entry.slice(tab + 1), sha)
  }
  const input = [...entries.values()].map(sha => `${sha}\n`).join('')
  const batch = execFileSync('git', ['cat-file', '--batch'], { cwd: root, input, maxBuffer: 1 << 30 })
  const contents = new Map<string, Buffer>()
  let offset = 0
  for (const path of entries.keys()) {
    const headerEnd = batch.indexOf(0x0a, offset)
    const size = Number(batch.subarray(offset, headerEnd).toString('utf8').split(' ')[2])
    contents.set(path, batch.subarray(headerEnd + 1, headerEnd + 1 + size))
    offset = headerEnd + 1 + size + 1
  }
  return contents
}

export const commitMessages = (root: string): [string, string][] => {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', 'HEAD'], { cwd: root, stdio: 'ignore' })
  } catch {
    return []
  }
  const log = git(root, 'log', '--format=%H%x00%B%x1e', 'HEAD')
  return log
    .split('\x1e')
    .map(record => record.replace(/^\n+|\n+$/g, ''))
    .filter(Boolean)
    .map(record => {
      const nul = record.indexOf('\0')
      return [record.slice(0, nul), record.slice(nul + 1)]
    })
}

export const check = (root: string, terms: Terms): string[] => [
  ...scanFiles(root, repositoryFiles(root), terms),
  ...scanStaged(root, stagedContents(root), terms),
  ...scanMessages(commitMessages(root), terms),
]

if (import.meta.main) {
  const problems = check(ROOT, loadTerms())
  for (const problem of problems) console.log(problem)
  console.log(`hygiene: ${problems.length} problem(s)`)
  process.exitCode = problems.length ? 1 : 0
}

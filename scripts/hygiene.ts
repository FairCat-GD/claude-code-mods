// The hygiene stage: nothing private, no secret and no conflict marker enters the history.
// Usage: node scripts/hygiene.ts [--terms <file>] [--message <draft>] [--all]

import { execFileSync, spawnSync } from 'node:child_process'
import { closeSync, existsSync, lstatSync, openSync, readFileSync, readlinkSync, statSync, utimesSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

export const SOURCES = [fileURLToPath(import.meta.url)]
const STAMP = 'hygiene-scanned'
const GITLINK = '160000'
const ENV_TEMPLATES = new Set(['.env.example', '.env.sample', '.env.template'])

// Letters, their marks and digits, in any script.
const RUN = /[\p{L}\p{M}\p{N}]+/gu
const ONE_WORD = /^[\p{L}\p{M}\p{N}]+$/u
const UPPER = /\p{Lu}/u
const LOWER = /\p{Ll}/u
const DIGIT = /\p{N}/u

const DASHES = '-'.repeat(5)
const NOT_BEFORE_TOKEN = '(?<![A-Za-z0-9_])'
const NOT_AFTER_TOKEN = '(?![A-Za-z0-9_])'
const NOT_BEFORE_KEY = '(?<![A-Za-z0-9_-])'
const KEY_BODY = '[A-Za-z0-9_-]'
const SECRETS = [
  `${DASHES}BEGIN [A-Z0-9 ]*PRIVATE KEY${DASHES}`,
  `(?<![A-Z0-9])(?:AK${'IA'}|AS${'IA'})[A-Z0-9]{16}(?![A-Z0-9])`,
  `${NOT_BEFORE_TOKEN}gh[pousr]_[A-Za-z0-9]{36}${NOT_AFTER_TOKEN}`,
  `${NOT_BEFORE_TOKEN}github${'_pat_'}[A-Za-z0-9]{22}_[A-Za-z0-9]{59}${NOT_AFTER_TOKEN}`,
  `(?<![A-Za-z0-9-])xox[bpars]-[0-9]+-[A-Za-z0-9-]+`,
  `${NOT_BEFORE_KEY}sk${'-ant-'}[a-z]+[0-9]{2}-${KEY_BODY}{80,}`,
  `${NOT_BEFORE_KEY}sk-(?:proj|svcacct|admin)-${KEY_BODY}{40,}`,
  `${NOT_BEFORE_KEY}sk-[A-Za-z0-9]{48}(?!${KEY_BODY})`,
].map(shape => new RegExp(shape))

// Tools, not the companies behind them. A model id is a setting, and only a capitalised Cursor is the tool.
const AI_TOOL = `\\[?(?:clau${'de'}(?!-)|chatgpt|gpt|copilot|(?-i:Cursor)|codex|gemini|ai)\\b`
const ATTRIBUTION = [
  `^\\s*co${'-authored'}-by\\s*:`,
  `\\b(?:generated|written|authored|created|built|assisted|produced)[\\s-]+(?:with|by|using)[\\s:]+(?:the\\s+help\\s+of\\s+)?(?:an?\\s+)?${AI_TOOL}`,
  `\\b(?:[a-z0-9-]+\\.)*(?:clau${'de'}\\.ai|chat${'gpt'}\\.com|chat\\.open${'ai'}\\.com|gem${'ini'}\\.google\\.com)/`,
].map(pattern => new RegExp(pattern, 'i'))

// At the start of a line only: Markdown underlines headings with the middle marker.
const CONFLICT_MARKERS = [`${'<'.repeat(7)} `, `${'>'.repeat(7)} `]

export class HygieneError extends Error {}

export type Terms = ReadonlySet<string>
export type Report = { failures: string[]; pushed: string[]; fullScan: boolean }
type Entry = { mode: string; sha: string }
type Index = { merged: Map<string, Entry>; unmerged: Set<string> }

const tilde = (path: string) => (path.startsWith(`${homedir()}/`) ? `~${path.slice(homedir().length)}` : path)

// The camel-case words and digit groups of a run, read before lowercasing.
const parts = (run: string): string[] => {
  const chars = [...run]
  const starts = [0]
  for (let index = 1; index < chars.length; index++) {
    const before = chars[index - 1] ?? ''
    const here = chars[index] ?? ''
    const after = chars[index + 1] ?? ''
    if (DIGIT.test(before) !== DIGIT.test(here) || (LOWER.test(before) && UPPER.test(here)) || (UPPER.test(before) && UPPER.test(here) && LOWER.test(after)))
      starts.push(index)
  }
  return starts.map((start, index) => chars.slice(start, starts[index + 1]).join(''))
}

export const tokens = (text: string): Set<string> => {
  const found = new Set<string>()
  for (const [run] of text.normalize('NFC').matchAll(RUN)) {
    found.add(run.toLowerCase())
    for (const part of parts(run)) found.add(part.toLowerCase())
  }
  return found
}

const holdsTerm = (text: string, terms: Terms) => [...tokens(text)].some(token => terms.has(token))

const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT'

export const loadTerms = (path: string): Terms => {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch (error) {
    if (missing(error)) throw new HygieneError(`no term list at ${tilde(path)}`)
    throw error
  }
  const terms = new Set<string>()
  for (const [index, line] of text.split('\n').entries()) {
    const term = line.normalize('NFC').trim().toLowerCase()
    if (!term) continue
    // A line of two words could never match, and would look clean.
    if (!ONE_WORD.test(term)) throw new HygieneError(`term list line ${index + 1} is not one word`)
    terms.add(term)
  }
  return terms
}

// A path that is safe to print: a component holding a term would print the term.
export const mask = (path: string, terms: Terms) =>
  path
    .split('/')
    .map(part => (holdsTerm(part, terms) ? '***' : part))
    .join('/')

// In any case: APFS opens `.ENV` as `.env`.
const isEnvFile = (path: string) => {
  const name = basename(path).toLowerCase()
  return (name === '.env' || name.startsWith('.env.')) && !ENV_TEMPLATES.has(name)
}

function* lineHits(line: string, terms: Terms): Generator<string> {
  if (holdsTerm(line, terms)) yield 'private term'
  if (SECRETS.some(shape => shape.test(line))) yield 'secret'
}

function* fileHits(text: string, terms: Terms): Generator<[number, string]> {
  for (const [index, line] of text.split('\n').entries()) {
    for (const kind of lineHits(line, terms)) yield [index + 1, kind]
    if (CONFLICT_MARKERS.some(marker => line.startsWith(marker))) yield [index + 1, 'conflict marker']
  }
}

function* messageHits(text: string, terms: Terms): Generator<[number, string]> {
  for (const [index, line] of text.split('\n').entries()) {
    for (const kind of lineHits(line, terms)) yield [index + 1, kind]
    if (ATTRIBUTION.some(pattern => pattern.test(line))) yield [index + 1, 'attribution']
  }
}

// Signature checks would print into the output parsed here.
const git = (repo: string, args: string[], input?: string): Buffer =>
  execFileSync('git', ['-c', 'log.showSignature=false', ...args], {
    cwd: repo,
    input,
    maxBuffer: 1 << 30,
    stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
  })

const gitOk = (repo: string, args: string[]) => spawnSync('git', args, { cwd: repo, stdio: 'ignore' }).status === 0

// The entries of a `-z` listing.
const listed = (output: Buffer) => output.toString('utf8').split('\0').filter(Boolean)

// The fields and the path of each entry in an index or tree listing.
const fields = (output: Buffer) =>
  listed(output).map(entry => {
    const tab = entry.indexOf('\t')
    return { meta: entry.slice(0, tab).split(' '), path: entry.slice(tab + 1) }
  })

// A conflicted path has no single staged version; its working copy is all there is to read.
const readIndex = (repo: string): Index => {
  const index: Index = { merged: new Map(), unmerged: new Set() }
  for (const { meta, path } of fields(git(repo, ['ls-files', '--stage', '-z']))) {
    if (meta[2] === '0') index.merged.set(path, { mode: meta[0] ?? '', sha: meta[1] ?? '' })
    else index.unmerged.add(path)
  }
  return index
}

const headEntries = (repo: string) =>
  new Map(fields(git(repo, ['ls-tree', '-r', '-z', 'HEAD'])).map(({ meta, path }) => [path, { mode: meta[0] ?? '', sha: meta[2] ?? '' }]))

// Files a commit could record that git does not know yet; ignored ones stay out.
const untracked = (repo: string) => listed(git(repo, ['ls-files', '--others', '--exclude-standard', '-z']))

// The contents of many objects through one `git cat-file --batch`.
const blobs = (repo: string, shas: string[]): Buffer[] => {
  if (!shas.length) return []
  const batch = git(repo, ['cat-file', '--batch'], shas.map(sha => `${sha}\n`).join(''))
  const contents: Buffer[] = []
  let offset = 0
  for (const sha of shas) {
    const headerEnd = batch.indexOf(0x0a, offset)
    const size = Number(batch.subarray(offset, headerEnd).toString('utf8').split(' ')[2])
    // A missing object would shift every later read; the stage cannot judge what it cannot read.
    if (!Number.isInteger(size)) throw new HygieneError(`cannot read object ${sha.slice(0, 10)}`)
    contents.push(batch.subarray(headerEnd + 1, headerEnd + 1 + size))
    offset = headerEnd + 1 + size + 1
  }
  return contents
}

const workingCopy = (repo: string, path: string): Buffer | undefined => {
  const file = join(repo, path)
  let stat: ReturnType<typeof lstatSync>
  try {
    stat = lstatSync(file)
  } catch {
    return undefined
  }
  // A link is its target's name. Following one could walk out of the repository.
  if (stat.isSymbolicLink()) return Buffer.from(readlinkSync(file))
  return stat.isFile() ? readFileSync(file) : undefined
}

// Hits in a path and its versions. With no version it has left the tree, which is the fix.
function* pathHits(path: string, versions: Buffer[], terms: Terms): Generator<string> {
  if (!versions.length) return
  const printable = mask(path, terms)
  if (holdsTerm(path, terms)) yield `${printable}: private term in the path`
  for (const data of versions) {
    if (data.includes(0)) continue
    for (const [number, kind] of fileHits(data.toString('utf8'), terms)) yield `${printable}:${number}: ${kind}`
  }
}

// The staged and the working copy of each path, once if they match.
const scanFiles = (repo: string, paths: Iterable<string>, index: Map<string, Entry>, terms: Terms): string[] => {
  const sorted = [...paths].filter(path => index.get(path)?.mode !== GITLINK).sort()
  const inIndex = sorted.filter(path => index.has(path))
  const contents = blobs(
    repo,
    inIndex.map(path => index.get(path)?.sha ?? ''),
  )
  const staged = new Map(inIndex.map((path, at) => [path, contents[at]]))
  return sorted.flatMap(path => {
    const versions = [staged.get(path), workingCopy(repo, path)].filter(data => data !== undefined)
    const [first, second] = versions
    return [...pathHits(path, first && second?.equals(first) ? [first] : versions, terms)]
  })
}

// Files that commits on no remote changed, as they stand now.
const scanAtHead = (repo: string, paths: Iterable<string>, terms: Terms): string[] => {
  const changed = [...paths]
  if (!changed.length) return []
  const tree = headEntries(repo)
  const present = changed.filter(path => (tree.get(path)?.mode ?? GITLINK) !== GITLINK).sort()
  const contents = blobs(
    repo,
    present.map(path => tree.get(path)?.sha ?? ''),
  )
  return present.flatMap((path, at) => [...pathHits(path, contents[at] ? [contents[at]] : [], terms)])
}

const envFiles = (paths: Iterable<string>, terms: Terms) =>
  [...paths]
    .filter(isEnvFile)
    .sort()
    .map(path => `${mask(path, terms)}: an env file a commit could record`)

const pathsACommitCouldChange = (repo: string, fresh: string[]) => {
  const changed = new Set(fresh)
  for (const against of [['HEAD'], ['--cached', 'HEAD'], []])
    for (const path of listed(git(repo, ['diff', '--name-only', '-z', '--no-renames', ...against]))) changed.add(path)
  return changed
}

const commits = (repo: string, revisions: string[]): [string, string][] => {
  const fields = git(repo, ['log', '--format=%H%x00%B%x00', ...revisions])
    .toString('utf8')
    .split('\0')
  const found: [string, string][] = []
  for (let at = 0; at + 1 < fields.length; at += 2) found.push([(fields[at] ?? '').trim(), fields[at + 1] ?? ''])
  return found
}

const toplevel = (cwd: string) => {
  try {
    return git(cwd, ['rev-parse', '--show-toplevel']).toString('utf8').trim()
  } catch {
    throw new HygieneError('not inside a git repository')
  }
}

export const stampPath = (repo: string) => join(git(repo, ['rev-parse', '--path-format=absolute', '--git-common-dir']).toString('utf8').trim(), STAMP)

const needsFullScan = (stamp: string, inputs: string[]) => {
  if (!existsSync(stamp)) return true
  const scanned = statSync(stamp, { bigint: true }).mtimeNs
  return inputs.some(input => statSync(input, { bigint: true }).mtimeNs > scanned)
}

const touch = (path: string) => {
  closeSync(openSync(path, 'a'))
  const now = new Date()
  utimesSync(path, now, now)
}

export const run = (
  repo: string,
  termsPath: string,
  { message, full = false, sources = SOURCES }: { message?: string; full?: boolean; sources?: string[] } = {},
): Report => {
  const terms = loadTerms(termsPath)
  let draft: string | undefined
  if (message !== undefined) {
    try {
      draft = readFileSync(message, 'utf8')
    } catch (error) {
      if (missing(error)) throw new HygieneError(`no draft at ${tilde(message)}`)
      throw error
    }
  }
  if (!gitOk(repo, ['rev-parse', '--verify', '--quiet', 'HEAD'])) return { failures: [], pushed: [], fullScan: false }

  const stamp = stampPath(repo)
  const fullScan = full || needsFullScan(stamp, [termsPath, ...sources])
  const { merged: index, unmerged } = readIndex(repo)
  const fresh = untracked(repo)
  const everything = new Set([...index.keys(), ...unmerged, ...fresh])
  const failures: string[] = []

  if (draft !== undefined) for (const [number, kind] of messageHits(draft, terms)) failures.push(`draft line ${number}: ${kind}`)
  failures.push(...envFiles(everything, terms))

  const unpushed = ['HEAD', '--not', '--remotes']
  if (fullScan) failures.push(...scanFiles(repo, everything, index, terms))
  else {
    const changing = pathsACommitCouldChange(repo, fresh)
    failures.push(...scanFiles(repo, changing, index, terms))
    const changed = listed(git(repo, ['log', '--format=', '--name-only', '-z', '--no-renames', '--diff-merges=first-parent', ...unpushed]))
    // A path about to change is judged by its new versions, or no fix to it could ever pass.
    failures.push(...scanAtHead(repo, new Set(changed.filter(path => !changing.has(path))), terms))
  }

  const onNoRemote = new Set(
    git(repo, ['rev-list', ...unpushed])
      .toString('utf8')
      .split(/\s+/)
      .filter(Boolean),
  )
  const pushed: string[] = []
  for (const [sha, body] of commits(repo, fullScan ? ['HEAD'] : unpushed)) {
    for (const [number, kind] of messageHits(body, terms)) {
      const place = `commit ${sha.slice(0, 10)} line ${number}: ${kind}`
      if (onNoRemote.has(sha)) failures.push(place)
      else pushed.push(place)
    }
  }

  // A path's staged and working copies can hit on the same line.
  const unique = [...new Set(failures)]
  if (fullScan && !unique.length) touch(stamp)
  return { failures: unique, pushed, fullScan }
}

const main = (argv: string[], log: (line: string) => void = console.log): number => {
  let report: Report
  try {
    const { values } = parseArgs({
      args: argv,
      options: { terms: { type: 'string' }, message: { type: 'string' }, all: { type: 'boolean', default: false } },
    })
    const repo = toplevel(process.cwd())
    const terms = resolve(values.terms ?? join(homedir(), '.config', 'hygiene', 'terms.txt'))
    report = run(repo, terms, { message: values.message === undefined ? undefined : resolve(values.message), full: values.all })
  } catch (error) {
    // Anything else is a bug in the stage, and keeps its stack.
    if (!(error instanceof HygieneError || String((error as NodeJS.ErrnoException).code).startsWith('ERR_PARSE_ARGS'))) throw error
    log(`hygiene: ${(error as Error).message}`)
    return 1
  }
  for (const failure of report.failures) log(failure)
  log(report.failures.length ? `hygiene: ${report.failures.length} hit(s)` : 'hygiene: clean')
  if (report.fullScan) {
    for (const place of report.pushed) log(`pushed ${place}`)
    log(`hygiene: full scan, ${report.pushed.length} hit(s) in pushed history`)
  }
  return report.failures.length ? 1 : 0
}

if (import.meta.main) process.exitCode = main(process.argv.slice(2))

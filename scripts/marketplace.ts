// Holds the marketplace to the folders under mods/, each manifest to its changelog, and keeps the
// engine's declarations out of git.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import { modNames, ROOT, TEMPLATE } from './repo.ts'

const MARKETPLACE = '.claude-plugin/marketplace.json'
const NAME = 'claude-code-mods'
const OWNER = 'FairCat-GD'
const VERSION = /^\d+\.\d+\.\d+$/
const ENGINE_FILES = /(^|\/)\.claude-plugin\/types(\/|$)/

type Json = Record<string, unknown>

const readJson = (file: string, problems: string[], label: string): Json | undefined => {
  if (!existsSync(file)) {
    problems.push(`${label}: missing`)
    return undefined
  }
  try {
    const value: unknown = JSON.parse(readFileSync(file, 'utf8'))
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Json
    problems.push(`${label}: not a JSON object`)
  } catch (error) {
    problems.push(`${label}: not valid JSON (${(error as Error).message})`)
  }
  return undefined
}

const isText = (value: unknown) => typeof value === 'string' && value.trim() !== ''
const ownerName = (value: unknown) => (value && typeof value === 'object' ? (value as Json).name : undefined)

// The newest version a changelog has an entry for, past [Unreleased]; a fenced example is no entry.
export const newestVersion = (changelog: string) => {
  let fence: string | undefined
  for (const line of changelog.split('\n')) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1]
    if (marker && (fence === undefined || marker.startsWith(fence))) fence = fence === undefined ? marker : undefined
    else if (fence === undefined) {
      const version = /^## \[(\d+\.\d+\.\d+)\]/.exec(line)?.[1]
      if (version) return version
    }
  }
  return undefined
}

const checkManifest = (root: string, folder: string): string[] => {
  const problems: string[] = []
  const name = basename(folder)
  const manifest = readJson(join(root, folder, '.claude-plugin/plugin.json'), problems, `${folder}/.claude-plugin/plugin.json`)
  if (manifest) {
    const label = `${folder}/.claude-plugin/plugin.json`
    if (manifest.name !== name) problems.push(`${label}: name ${JSON.stringify(manifest.name)} is not the folder's, "${name}"`)
    if (typeof manifest.version !== 'string' || !VERSION.test(manifest.version)) problems.push(`${label}: version is not x.y.z`)
    if (!isText(manifest.description)) problems.push(`${label}: no description`)
    if (ownerName(manifest.author) !== OWNER) problems.push(`${label}: author is not { "name": "${OWNER}" }`)
    if (manifest.license !== 'MIT') problems.push(`${label}: license is not "MIT"`)
  }
  const changelog = join(root, folder, 'CHANGELOG.md')
  if (!existsSync(changelog)) problems.push(`${folder}/CHANGELOG.md: missing`)
  else if (manifest && typeof manifest.version === 'string') {
    const newest = newestVersion(readFileSync(changelog, 'utf8'))
    if (newest !== manifest.version) problems.push(`${folder}/CHANGELOG.md: newest entry is ${newest ?? 'none'}, plugin.json says ${manifest.version}`)
  }
  return problems
}

const checkEntries = (root: string, mods: string[]): string[] => {
  const problems: string[] = []
  if (!existsSync(join(root, MARKETPLACE))) {
    if (mods.length) problems.push(`${MARKETPLACE}: missing, but mods/ holds ${mods.join(', ')}`)
    return problems
  }
  const marketplace = readJson(join(root, MARKETPLACE), problems, MARKETPLACE)
  if (!marketplace) return problems
  if (marketplace.name !== NAME) problems.push(`${MARKETPLACE}: name is not "${NAME}"`)
  if (ownerName(marketplace.owner) !== OWNER) problems.push(`${MARKETPLACE}: owner is not { "name": "${OWNER}" }`)
  if (!isText(marketplace.description)) problems.push(`${MARKETPLACE}: no description`)
  if (!Array.isArray(marketplace.plugins)) {
    problems.push(`${MARKETPLACE}: plugins is not a list`)
    return problems
  }
  const listed: string[] = []
  for (const [index, entry] of (marketplace.plugins as unknown[]).entries()) {
    const label = `${MARKETPLACE}: plugins[${index}]`
    if (!entry || typeof entry !== 'object') {
      problems.push(`${label} is not an object`)
      continue
    }
    const { name, source, description } = entry as Json
    if (typeof name !== 'string') {
      problems.push(`${label} has no name`)
      continue
    }
    if (listed.includes(name)) problems.push(`${label}: "${name}" is listed twice`)
    listed.push(name)
    if ('version' in entry) problems.push(`${label} ("${name}") carries a version; it belongs in plugin.json alone`)
    if (source !== `./mods/${name}`) problems.push(`${label} ("${name}"): source is not "./mods/${name}"`)
    if (!isText(description)) problems.push(`${label} ("${name}") has no description`)
    if (!mods.includes(name)) problems.push(`${label}: "${name}" has no folder under mods/`)
  }
  for (const mod of mods) if (!listed.includes(mod)) problems.push(`${MARKETPLACE}: mods/${mod} has no entry`)
  const known = listed.filter(name => mods.includes(name))
  if (known.join('\n') !== [...known].sort().join('\n')) problems.push(`${MARKETPLACE}: entries are not in folder-name order`)
  return problems
}

export const check = (root: string, tracked: readonly string[]): string[] => {
  const mods = modNames(root)
  return [
    ...checkEntries(root, mods),
    ...mods.flatMap(mod => checkManifest(root, `mods/${mod}`)),
    ...(existsSync(join(root, TEMPLATE)) ? checkManifest(root, TEMPLATE) : []),
    ...tracked.filter(path => ENGINE_FILES.test(path)).map(path => `${path}: the engine's declarations are tracked; they are never committed`),
  ]
}

export const trackedPaths = (root: string) => execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)

if (import.meta.main) {
  const problems = check(ROOT, trackedPaths(ROOT))
  for (const problem of problems) console.log(problem)
  console.log(`marketplace: ${problems.length} problem(s)`)
  process.exitCode = problems.length ? 1 : 0
}

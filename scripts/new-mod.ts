// Makes a mod from the template: its folder under mods/, renamed throughout, and its marketplace
// entry. Nothing else in the repository is written.
//
// Usage: npm run new-mod -- <name> "<description>"

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'

import { DECLARATIONS, filesUnder, type Json, MARKETPLACE, ROOT, TEMPLATE, TEMPLATE_NAME } from './repo.ts'
import { STAGE_NAMES } from './verify.ts'

const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const VERSION = '0.1.0'
const LINE_WIDTH = 160

// Two-space JSON, with an object of one plain field on one line where it fits, as Biome keeps it.
export const formatJson = (value: unknown) =>
  `${JSON.stringify(value, null, 2).replace(/^(.*)\{\n\s+("[^"\n]*": "[^"\n]*")\n\s*\}(,?)$/gm, (whole, before: string, field: string, comma: string) => {
    const line = `${before}{ ${field} }${comma}`
    return line.length <= LINE_WIDTH ? line : whole
  })}\n`

// The text of a file, or undefined for one that is not UTF-8 text, which is copied as it is.
const textOf = (bytes: Buffer) => {
  if (bytes.includes(0)) return undefined
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return undefined
  }
}

export const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

// Why `name` and `description` cannot make a mod in `root`, if they cannot.
export const refusal = (root: string, name: string, description: string): string | undefined => {
  if (!NAME.test(name)) return `"${name}" is not lowercase kebab-case (a-z, 0-9, single hyphens between)`
  if (name === TEMPLATE_NAME) return `"${name}" is the template's own name`
  if (STAGE_NAMES.includes(name)) return `"${name}" is the name of a verify stage, which \`verify -- ${name}\` would mean instead`
  if (existsSync(join(root, 'mods', name))) return `mods/${name} exists already`
  if (!description.trim()) return 'a description is required: npm run new-mod -- <name> "<what it does>"'
  if (!existsSync(join(root, TEMPLATE))) return `${TEMPLATE} is missing`
  return undefined
}

const parseObject = (text: string, label: string): Json => {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (error) {
    throw new Error(`${label}: ${(error as Error).message}`)
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}: not a JSON object`)
  return value as Json
}

// Every file the mod is made of, by its path under `root`, read and renamed before anything is written.
const plan = (root: string, name: string, description: string, today: string): Map<string, Buffer | string> => {
  const source = join(root, TEMPLATE)
  const engineFiles = join(source, DECLARATIONS)
  const files = new Map<string, Buffer | string>()
  for (const file of filesUnder(source, path => path === engineFiles || basename(path) === '.DS_Store')) {
    const path = join('mods', name, relative(source, file).replaceAll(TEMPLATE_NAME, name))
    const bytes = readFileSync(file)
    const text = textOf(bytes)
    files.set(path, text === undefined ? bytes : text.replaceAll(TEMPLATE_NAME, name))
  }

  const manifestPath = join('mods', name, '.claude-plugin/plugin.json')
  const manifest = files.get(manifestPath)
  if (typeof manifest !== 'string') throw new Error(`${TEMPLATE}/.claude-plugin/plugin.json is missing`)
  files.set(manifestPath, formatJson({ ...parseObject(manifest, manifestPath), version: VERSION, description }))

  const changelogPath = join('mods', name, 'CHANGELOG.md')
  const changelog = files.get(changelogPath)
  const entry = /^## \[\d+\.\d+\.\d+\] — .*$/m
  if (typeof changelog !== 'string' || !entry.test(changelog)) throw new Error(`${TEMPLATE}/CHANGELOG.md has no version entry`)
  files.set(changelogPath, changelog.replace(entry, `## [${VERSION}] — ${today}`))

  if (!existsSync(join(root, MARKETPLACE))) throw new Error(`${MARKETPLACE} is missing`)
  const marketplace = parseObject(readFileSync(join(root, MARKETPLACE), 'utf8'), MARKETPLACE)
  if (!Array.isArray(marketplace.plugins)) throw new Error(`${MARKETPLACE}: plugins is not a list`)
  const plugins = [...(marketplace.plugins as Json[]), { name, source: `./mods/${name}`, description }]
  plugins.sort((a, b) => (String(a.name) < String(b.name) ? -1 : 1))
  files.set(MARKETPLACE, formatJson({ ...marketplace, plugins }))
  return files
}

// The files written, relative to `root`. Whatever stops it leaves the repository as it was.
export const newMod = (root: string, name: string, description: string, today: string): string[] => {
  const problem = refusal(root, name, description)
  if (problem) throw new Error(problem)
  const files = plan(root, name, description, today)
  const marketplace = files.get(MARKETPLACE) as string
  files.delete(MARKETPLACE)
  const target = join(root, 'mods', name)
  try {
    for (const [path, contents] of files) {
      mkdirSync(dirname(join(root, path)), { recursive: true })
      writeFileSync(join(root, path), contents)
    }
    writeFileSync(join(root, MARKETPLACE), marketplace)
  } catch (error) {
    rmSync(target, { recursive: true, force: true })
    throw error
  }
  return [...[...files.keys()].sort(), MARKETPLACE]
}

// What the owner does next, which the script leaves to them.
export const nextSteps = (name: string, description: string) => [
  `new-mod: made mods/${name} and its marketplace entry, at ${VERSION}. Left to do:`,
  "  1. Add the mod's row to README.md's table of mods, in name order, rewording as it reads best:",
  `     | [${name}](mods/${name}/) | ${description.replaceAll('|', '\\|')} |`,
  '  2. Run `npm run types` in a terminal, so the engine lays the API declarations beside it.',
  `  3. Run \`npm run verify -- ${name}\`.`,
  `  4. Open the mod's intake: its handoff is mods/${name}/docs/next-session-prompt.md.`,
]

if (import.meta.main) {
  const [name = '', description = ''] = process.argv.slice(2)
  try {
    newMod(ROOT, name, description, isoDate(new Date()))
    for (const line of nextSteps(name, description)) console.log(line)
  } catch (error) {
    console.log(`new-mod: ${(error as Error).message}; nothing was written`)
    process.exitCode = 1
  }
}

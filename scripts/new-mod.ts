// Makes a mod from the template: its folder under mods/, renamed throughout, and its marketplace
// entry. Nothing else in the repository is written.
//
// Usage: npm run new-mod -- <name> "<description>"

import { cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'

import { DECLARATIONS, ROOT, TEMPLATE } from './repo.ts'
import { STAGE_NAMES } from './verify.ts'

const TEMPLATE_NAME = 'mod-template'
const MARKETPLACE = '.claude-plugin/marketplace.json'
const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const VERSION = '0.1.0'

type Json = Record<string, unknown>

// Two-space JSON, with an object of one plain field kept on one line, as the repository writes it.
export const formatJson = (value: unknown) => `${JSON.stringify(value, null, 2).replace(/\{\n\s+("[^"\n]*": "[^"\n]*")\n\s*\}/g, '{ $1 }')}\n`

// Why `name` and `description` cannot make a mod in `root`, if they cannot.
export const refusal = (root: string, name: string, description: string): string | undefined => {
  if (!NAME.test(name)) return `"${name}" is not lowercase kebab-case (a-z, 0-9, single hyphens between)`
  if (name === TEMPLATE_NAME) return `"${name}" is the template's own name`
  if (STAGE_NAMES.includes(name)) return `"${name}" is the name of a verify stage, which \`verify -- ${name}\` would mean instead`
  if (existsSync(join(root, 'mods', name))) return `mods/${name} exists already`
  if (!description.trim()) return 'a description is required: npm run new-mod -- <name> "<what it does>"'
  if (!existsSync(join(root, TEMPLATE))) return `${TEMPLATE} is missing`
  if (!existsSync(join(root, MARKETPLACE))) return `${MARKETPLACE} is missing`
  const marketplace = JSON.parse(readFileSync(join(root, MARKETPLACE), 'utf8')) as Json
  if (!Array.isArray(marketplace.plugins)) return `${MARKETPLACE}: plugins is not a list`
  return undefined
}

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]))

// The files written, relative to `root`; throws with the refusal, having written nothing.
export const newMod = (root: string, name: string, description: string, today: string): string[] => {
  const problem = refusal(root, name, description)
  if (problem) throw new Error(problem)
  const source = join(root, TEMPLATE)
  const target = join(root, 'mods', name)
  const engineFiles = join(source, DECLARATIONS)
  cpSync(source, target, {
    recursive: true,
    filter: path => path !== engineFiles && !path.startsWith(`${engineFiles}/`) && basename(path) !== '.DS_Store',
  })
  for (const file of walk(target)) {
    const text = readFileSync(file, 'utf8')
    if (text.includes(TEMPLATE_NAME)) writeFileSync(file, text.replaceAll(TEMPLATE_NAME, name))
    const renamed = join(file, '..', basename(file).replaceAll(TEMPLATE_NAME, name))
    if (renamed !== file) renameSync(file, renamed)
  }

  const manifestPath = join(target, '.claude-plugin/plugin.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Json
  writeFileSync(manifestPath, formatJson({ ...manifest, version: VERSION, description }))

  const changelogPath = join(target, 'CHANGELOG.md')
  writeFileSync(changelogPath, readFileSync(changelogPath, 'utf8').replace(/^## \[\d+\.\d+\.\d+\] — .*$/m, `## [${VERSION}] — ${today}`))

  const marketplacePath = join(root, MARKETPLACE)
  const marketplace = JSON.parse(readFileSync(marketplacePath, 'utf8')) as Json & { plugins: Json[] }
  const plugins = [...marketplace.plugins, { name, source: `./mods/${name}`, description }]
  plugins.sort((a, b) => (String(a.name) < String(b.name) ? -1 : 1))
  writeFileSync(marketplacePath, formatJson({ ...marketplace, plugins }))

  return [
    ...walk(target)
      .map(file => relative(root, file))
      .sort(),
    MARKETPLACE,
  ]
}

// What the owner does next, which the script leaves to them.
export const nextSteps = (name: string, description: string) => [
  `new-mod: made mods/${name} and its marketplace entry, at ${VERSION}. Left to do:`,
  "  1. Add the mod's row to README.md's table of mods, in name order, rewording as it reads best:",
  `     | [${name}](mods/${name}/) | ${description} |`,
  '  2. Run `npm run types` in a terminal, so the engine lays the API declarations beside it.',
  `  3. Run \`npm run verify -- ${name}\`.`,
  `  4. Open the mod's intake: its handoff is mods/${name}/docs/next-session-prompt.md.`,
]

if (import.meta.main) {
  const [name = '', description = ''] = process.argv.slice(2)
  const problem = refusal(ROOT, name, description)
  if (problem) {
    console.log(`new-mod: ${problem}; nothing was written`)
    process.exitCode = 1
  } else {
    newMod(ROOT, name, description, new Date().toLocaleDateString('en-CA'))
    for (const line of nextSteps(name, description)) console.log(line)
  }
}

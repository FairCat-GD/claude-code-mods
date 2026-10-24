// Where the repository keeps its mods, and the API declarations the engine lays beside each.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('..', import.meta.url))
export const TEMPLATE = 'templates/mod-template'
export const DECLARATIONS = '.claude-plugin/types'
export const TYPES_FIX = 'run `npm run types`'

export const modNames = (root = ROOT): string[] => {
  const mods = join(root, 'mods')
  if (!existsSync(mods)) return []
  return readdirSync(mods, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
}

// Every folder the per-mod stages check, by the name `verify -- <name>` takes.
export const modFolders = (root = ROOT): { name: string; path: string }[] => [
  ...modNames(root).map(name => ({ name, path: `mods/${name}` })),
  ...(existsSync(join(root, TEMPLATE)) ? [{ name: 'mod-template', path: TEMPLATE }] : []),
]

export const cliVersion = (output: string) => output.trim().split(/\s+/)[0] ?? ''

export const laidVersion = (folder: string): string | undefined => {
  const file = join(folder, DECLARATIONS, 'claude-code', 'index.d.ts')
  if (!existsSync(file)) return undefined
  return /^\/\/ Written by Claude Code (\S+?)\.?$/m.exec(readFileSync(file, 'utf8').split('\n', 1)[0] ?? '')?.[1] ?? ''
}

// Why a folder's declarations cannot type it against the CLI's build, if they cannot.
export const declarationsProblem = (folder: string, label: string, cli: string): string | undefined => {
  const laid = laidVersion(folder)
  if (laid === undefined || !existsSync(join(folder, DECLARATIONS, 'tsconfig.json')))
    return `${label} has no API declarations in ${DECLARATIONS}/: ${TYPES_FIX}`
  if (laid !== cli) return `${label}'s API declarations are from Claude Code ${laid || 'an unknown build'}, the CLI is ${cli}: ${TYPES_FIX}`
  return undefined
}

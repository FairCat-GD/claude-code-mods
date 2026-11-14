// What the scripts share: where the mods are, how to run `claude`, and the API declarations the
// engine lays beside each mod.

import { execFileSync } from 'node:child_process'
import { accessSync, constants, existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { delimiter, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('..', import.meta.url))
export const TEMPLATE = 'templates/mod-template'
export const DECLARATIONS = '.claude-plugin/types'
export const TYPES_FIX = 'run `npm run types`'

export type Folder = { name: string; path: string }

// What stops a check starting, with the fix it names.
export class SetupError extends Error {}

export const isFile = (path: string) => {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

// The owner's live mods never load into a `claude` the tooling starts.
export const hermeticEnv = (env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv => {
  const { CLAUDE_CODE_PLUGIN_DIRS: _, ...rest } = env
  return rest
}

export const findClaude = (path = process.env.PATH ?? '') => {
  for (const dir of path.split(delimiter).filter(Boolean)) {
    const file = join(dir, 'claude')
    if (!isFile(file)) continue
    try {
      accessSync(file, constants.X_OK)
      return file
    } catch {}
  }
  throw new SetupError("claude not found on PATH: install Claude Code's CLI, which runs `claude plugin validate` and `claude plugin test`")
}

export const claudeCommand = (...args: string[]) => ({ argv: [findClaude(), ...args], env: hermeticEnv() })

export const cliVersion = (output: string) => output.trim().split(/\s+/)[0] ?? ''

// The CLI's version now; it can update itself mid-run, so a caller that needs one reading keeps it.
export const readClaudeVersion = () => cliVersion(execFileSync(findClaude(), ['--version'], { encoding: 'utf8', env: hermeticEnv(), timeout: 60_000 }))

export const modNames = (root = ROOT): string[] => {
  const mods = join(root, 'mods')
  if (!existsSync(mods)) return []
  return readdirSync(mods, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
}

// Every folder the per-mod stages check, by the name `verify -- <name>` takes.
export const modFolders = (root = ROOT): Folder[] => [
  ...modNames(root).map(name => ({ name, path: `mods/${name}` })),
  ...(existsSync(join(root, TEMPLATE)) ? [{ name: 'mod-template', path: TEMPLATE }] : []),
]

export const laidVersion = (folder: string): string | undefined => {
  const file = join(folder, DECLARATIONS, 'claude-code', 'index.d.ts')
  if (!existsSync(file)) return undefined
  return /^\/\/ Written by Claude Code (\S+?)\.?$/m.exec(readFileSync(file, 'utf8').split('\n', 1)[0] ?? '')?.[1] ?? ''
}

export const noDeclarations = (label: string) => `${label} has no API declarations in ${DECLARATIONS}/: ${TYPES_FIX}`

// Why a folder's declarations cannot type it against the CLI's build, if they cannot.
export const declarationsProblem = (folder: string, label: string, cli: string): string | undefined => {
  const laid = laidVersion(folder)
  if (laid === undefined || !existsSync(join(folder, DECLARATIONS, 'tsconfig.json'))) return noDeclarations(label)
  if (laid !== cli) return `${label}'s API declarations are from Claude Code ${laid || 'an unknown build'}, the CLI is ${cli}: ${TYPES_FIX}`
  return undefined
}

// The folders whose declarations cannot type them against the CLI's build, each with why.
export const staleFolders = (folders: readonly Folder[], cli: string, root = ROOT) =>
  folders.flatMap(folder => {
    const problem = declarationsProblem(join(root, folder.path), folder.path, cli)
    return problem ? [{ folder, problem }] : []
  })

// A check's last lines: each problem, then the count; the exit code follows.
export const report = (stage: string, problems: readonly string[], prefix = '') => {
  for (const problem of problems) console.log(`${prefix}${problem}`)
  console.log(`${stage}: ${problems.length} problem(s)`)
  process.exitCode = problems.length ? 1 : 0
}

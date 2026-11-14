// The gate: the repo stages, then four stages per mod and for the template, each failing on its
// own, then a summary. Names pick stages, mods or both; hygiene takes the drafted message.
//
// Usage: npm run verify [-- <stage or mod> ...] [--message <draft>] [--all]

import { execFileSync, spawnSync } from 'node:child_process'
import { accessSync, constants, existsSync } from 'node:fs'
import { delimiter, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { cliVersion, declarationsProblem, type Folder, hermeticEnv, isFile, modFolders, ROOT } from './repo.ts'

export class SetupError extends Error {}

export type Command = { argv: string[]; env?: NodeJS.ProcessEnv }
export type Stage = { name: string; commands: () => Command[] }

export const TOOLING_TESTS = ['--test', 'tests/*.test.ts']
const TOOLING_PATHS = ['scripts', 'tests', '.claude-plugin', 'package.json', 'tsconfig.json', 'biome.json']

const bin = (name: string) => {
  const path = join(ROOT, 'node_modules', '.bin', name)
  if (!existsSync(path)) throw new SetupError(`${name} is not installed: run \`npm ci\``)
  return path
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

let cli: string | undefined
const claudeVersion = () => {
  cli ??= cliVersion(execFileSync(findClaude(), ['--version'], { encoding: 'utf8', env: hermeticEnv(), timeout: 60_000 }))
  return cli
}

const claude = (...args: string[]): Command => ({ argv: [findClaude(), ...args], env: hermeticEnv() })
const node = (...args: string[]): Command => ({ argv: [process.execPath, ...args] })

type Hygiene = { message?: string; all: boolean }

const repoStages = (scope: Folder[] | undefined, { message, all }: Hygiene): Stage[] => {
  const paths = scope ? [...TOOLING_PATHS.filter(path => existsSync(join(ROOT, path))), ...scope.map(folder => folder.path)] : ['.']
  return [
    { name: 'format', commands: () => [{ argv: [bin('biome'), 'format', ...paths] }] },
    { name: 'lint', commands: () => [{ argv: [bin('biome'), 'lint', '--error-on-warnings', ...paths] }] },
    { name: 'types', commands: () => [{ argv: [bin('tsc'), '-p', 'tsconfig.json'] }] },
    { name: 'tooling-tests', commands: () => [node(...TOOLING_TESTS)] },
    {
      name: 'marketplace',
      commands: () => [
        node('scripts/marketplace.ts'),
        ...(existsSync(join(ROOT, '.claude-plugin/marketplace.json')) ? [claude('plugin', 'validate', '--strict', '.')] : []),
      ],
    },
    {
      name: 'hygiene',
      commands: () => [node('scripts/hygiene.ts', ...(message === undefined ? [] : ['--message', message]), ...(all ? ['--all'] : []))],
    },
  ]
}

const folderStages = (path: string): Record<string, Stage['commands']> => ({
  validate: () => {
    findClaude()
    return [{ ...node('scripts/validate.ts', path), env: hermeticEnv() }]
  },
  types: () => {
    const problem = declarationsProblem(join(ROOT, path), path, claudeVersion())
    if (problem) throw new SetupError(problem)
    return [{ argv: [bin('tsc'), '-p', path] }]
  },
  tests: () => [claude('plugin', 'test', path)],
  imports: () => [node('scripts/imports.ts', path)],
})

// Every stage's name; `types` names the tooling's and each folder's.
const STAGE_NAMES = [...new Set([...repoStages(undefined, { all: false }).map(stage => stage.name), ...Object.keys(folderStages(''))])]

const parseOptions = (argv: readonly string[]) =>
  parseArgs({ args: [...argv], allowPositionals: true, options: { message: { type: 'string' }, all: { type: 'boolean', default: false } } })

// The stages `verify -- <names>` picks, or why it picks none.
export const plan = (argv: readonly string[], folders: Folder[] = modFolders(), cwd = process.env.INIT_CWD ?? process.cwd()): Stage[] | string => {
  let parsed: ReturnType<typeof parseOptions>
  try {
    parsed = parseOptions(argv)
  } catch (error) {
    return (error as Error).message
  }
  const { positionals: names, values } = parsed
  const unknown = names.filter(name => !STAGE_NAMES.includes(name) && !folders.some(folder => folder.name === name))
  if (unknown.length)
    return `unknown name(s) ${unknown.join(', ')}; stages: ${STAGE_NAMES.join(', ')}; mods: ${folders.map(folder => folder.name).join(', ') || 'none'}`
  const ambiguous = names.filter(name => STAGE_NAMES.includes(name) && folders.some(folder => folder.name === name))
  if (ambiguous.length) return `${ambiguous.join(', ')} names both a stage and a mod: rename the mod`
  const kinds = names.filter(name => STAGE_NAMES.includes(name))
  const picked = (kind: string) => !kinds.length || kinds.includes(kind)
  if ((values.message !== undefined || values.all) && !picked('hygiene')) return '--message and --all are for hygiene, which the names leave out'
  const named = folders.filter(folder => names.includes(folder.name))
  const chosen = named.length ? named : folders
  const hygiene = { message: values.message === undefined ? undefined : resolve(cwd, values.message), all: values.all }
  return [
    ...repoStages(named.length ? named : undefined, hygiene).filter(stage => picked(stage.name)),
    ...chosen.flatMap(folder =>
      Object.entries(folderStages(folder.path))
        .filter(([kind]) => picked(kind))
        .map(([kind, commands]) => ({ name: `${folder.name}: ${kind}`, commands })),
    ),
  ]
}

const call = ({ argv, env }: Command, log: (line: string) => void) => {
  const [command = '', ...args] = argv
  const result = spawnSync(command, args, { cwd: ROOT, env: env ?? process.env, stdio: 'inherit' })
  if (result.error) log(`verify: cannot run ${command}: ${result.error.message}`)
  return result.status === 0
}

export const runStage = (stage: Stage, log: (line: string) => void = console.log): [boolean, number] => {
  log(`\n== ${stage.name} ==`)
  const start = performance.now()
  let commands: Command[]
  try {
    commands = stage.commands()
  } catch (error) {
    // Whatever stops a stage starting fails that stage alone; the others still run.
    log(`verify: ${stage.name} cannot start: ${(error as Error).message}`)
    return [false, (performance.now() - start) / 1000]
  }
  // Every command runs, even after one fails, so each reports its own errors.
  const results = commands.map(command => call(command, log))
  return [results.every(Boolean), (performance.now() - start) / 1000]
}

export const main = (argv: readonly string[], planned = plan(argv), log: (line: string) => void = console.log): number => {
  if (typeof planned === 'string') {
    log(`verify: ${planned}`)
    return 2
  }
  const results = planned.map(stage => [stage.name, ...runStage(stage, log)] as const)
  const width = Math.max(...results.map(([name]) => name.length))
  log('\n== summary ==')
  for (const [name, passed, seconds] of results) log(`${name.padEnd(width)}  ${passed ? 'PASS' : 'FAIL'}  ${seconds.toFixed(1).padStart(6)}s`)
  const failed = results.filter(([, passed]) => !passed).map(([name]) => name)
  log(`verify: ${failed.length ? `FAIL (${failed.join(', ')})` : 'PASS'}`)
  return failed.length ? 1 : 0
}

if (import.meta.main) process.exitCode = main(process.argv.slice(2))

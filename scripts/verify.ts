// The gate: the repo stages, then four stages per mod and for the template, each failing on its
// own, then a summary.
//
// Usage: npm run verify [-- <mod> ...]

import { execFileSync, spawnSync } from 'node:child_process'
import { accessSync, constants, existsSync } from 'node:fs'
import { delimiter, join } from 'node:path'

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

const repoStages = (scope: Folder[] | undefined): Stage[] => {
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
    { name: 'hygiene', commands: () => [node('scripts/hygiene.ts')] },
  ]
}

const folderStages = ({ name, path }: Folder): Stage[] => [
  {
    name: `${name}: validate`,
    commands: () => {
      findClaude()
      return [{ ...node('scripts/validate.ts', path), env: hermeticEnv() }]
    },
  },
  {
    name: `${name}: types`,
    commands: () => {
      const problem = declarationsProblem(join(ROOT, path), path, claudeVersion())
      if (problem) throw new SetupError(problem)
      return [{ argv: [bin('tsc'), '-p', path] }]
    },
  },
  { name: `${name}: tests`, commands: () => [claude('plugin', 'test', path)] },
  { name: `${name}: imports`, commands: () => [node('scripts/imports.ts', path)] },
]

// The stages for `verify -- <names>`: every folder when none is named.
export const plan = (names: readonly string[], folders: Folder[] = modFolders()): Stage[] | { unknown: string[]; known: string[] } => {
  const unknown = names.filter(name => !folders.some(folder => folder.name === name))
  if (unknown.length) return { unknown, known: folders.map(folder => folder.name) }
  const chosen = names.length ? folders.filter(folder => names.includes(folder.name)) : folders
  return [...repoStages(names.length ? chosen : undefined), ...chosen.flatMap(folderStages)]
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
  if (!Array.isArray(planned)) {
    log(`verify: unknown mod(s) ${planned.unknown.join(', ')}; mods: ${planned.known.join(', ') || 'none'}`)
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

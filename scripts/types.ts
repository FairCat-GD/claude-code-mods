// Has the engine lay this build's API declarations beside each mod and the template, by loading
// them in an interactive Claude Code session: no command writes them.

import { execFileSync, spawnSync } from 'node:child_process'
import { join } from 'node:path'

import { cliVersion, declarationsProblem, modFolders, ROOT } from './repo.ts'

// The owner's live mods stay out of the session: the engine would lay declarations into them too.
export const launchCommand = (folders: readonly string[], env: NodeJS.ProcessEnv = process.env) => {
  const { CLAUDE_CODE_PLUGIN_DIRS: _, ...rest } = env
  const args = [
    '--setting-sources',
    'project,local',
    '--settings',
    JSON.stringify({ env: { CLAUDE_CODE_PLUGIN_DIRS: '' } }),
    ...folders.flatMap(folder => ['--plugin-dir', folder]),
  ]
  return { command: 'claude', args, env: rest }
}

const problems = (folders: { name: string; path: string }[], cli: string) =>
  folders.map(folder => declarationsProblem(join(ROOT, folder.path), folder.path, cli)).filter(problem => problem !== undefined)

if (import.meta.main) {
  const folders = modFolders()
  let cli = ''
  try {
    cli = cliVersion(execFileSync('claude', ['--version'], { encoding: 'utf8' }))
  } catch {
    console.log("types: claude not found on PATH; install Claude Code's CLI first")
    process.exit(1)
  }
  const stale = folders.filter(folder => declarationsProblem(join(ROOT, folder.path), folder.path, cli))
  if (!stale.length) {
    console.log(`types: every folder's declarations are from Claude Code ${cli}`)
    process.exit(0)
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log('types: this starts an interactive Claude Code session; run `npm run types` in a terminal')
    process.exit(1)
  }
  console.log(`types: starting Claude Code ${cli} to lay the API declarations in ${stale.map(folder => folder.path).join(', ')}.`)
  console.log('types: when its prompt shows, type /exit.')
  const { command, args, env } = launchCommand(
    stale.map(folder => join(ROOT, folder.path)),
    process.env,
  )
  spawnSync(command, args, { cwd: ROOT, env, stdio: 'inherit' })
  const left = problems(folders, cli)
  for (const problem of left) console.log(`types: ${problem}`)
  console.log(left.length ? `types: ${left.length} folder(s) still without this build's declarations` : `types: declarations laid from Claude Code ${cli}`)
  process.exitCode = left.length ? 1 : 0
}

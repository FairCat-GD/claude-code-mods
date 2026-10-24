// Has the engine lay this build's API declarations beside each mod and the template, by loading
// them in an interactive Claude Code session: no command writes them.

import { execFileSync, spawnSync } from 'node:child_process'
import { join } from 'node:path'

import { cliVersion, hermeticEnv, modFolders, ROOT, staleFolders } from './repo.ts'

// The owner's live mods stay out of the session: the engine would lay declarations into them too.
export const launchCommand = (folders: readonly string[], env: NodeJS.ProcessEnv = process.env) => {
  const args = [
    '--setting-sources',
    'project,local',
    '--settings',
    JSON.stringify({ env: { CLAUDE_CODE_PLUGIN_DIRS: '' } }),
    ...folders.flatMap(folder => ['--plugin-dir', folder]),
  ]
  return { command: 'claude', args, env: hermeticEnv(env) }
}

// What a session leaves to say, judged against the CLI as it is once the session has ended.
export const outcome = (before: string, after: string, problems: readonly string[]) => {
  const lines = problems.map(problem => `types: ${problem}`)
  if (after !== before) lines.push(`types: the CLI updated itself from ${before} to ${after} during the session; run \`npm run types\` again`)
  const ok = !problems.length && after === before
  lines.push(ok ? `types: declarations laid from Claude Code ${after}` : `types: ${problems.length} folder(s) without this build's declarations`)
  return { lines, ok }
}

const readCli = () => {
  try {
    return cliVersion(execFileSync('claude', ['--version'], { encoding: 'utf8', env: hermeticEnv() }))
  } catch {
    console.log("types: claude not found on PATH; install Claude Code's CLI first")
    process.exit(1)
  }
}

if (import.meta.main) {
  const folders = modFolders()
  const before = readCli()
  const stale = staleFolders(folders, before)
  if (!stale.length) {
    console.log(`types: every folder's declarations are from Claude Code ${before}`)
    process.exit(0)
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log('types: this starts an interactive Claude Code session; run `npm run types` in a terminal')
    process.exit(1)
  }
  console.log(`types: starting Claude Code ${before} to lay the API declarations in ${stale.map(({ folder }) => folder.path).join(', ')}.`)
  console.log('types: when its prompt shows, type /exit.')
  const { command, args, env } = launchCommand(stale.map(({ folder }) => join(ROOT, folder.path)))
  spawnSync(command, args, { cwd: ROOT, env, stdio: 'inherit' })
  const after = readCli()
  const { lines, ok } = outcome(
    before,
    after,
    staleFolders(folders, after).map(({ problem }) => problem),
  )
  for (const line of lines) console.log(line)
  process.exitCode = ok ? 0 : 1
}

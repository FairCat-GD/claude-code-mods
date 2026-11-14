import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { TestContext } from 'node:test'
import { fileURLToPath } from 'node:url'

export const FIXTURES = fileURLToPath(new URL('fixtures/', import.meta.url))

// A scratch repository reads no git config but its own.
export const GIT_ISOLATION = { GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }

// A fresh folder of the test's own, removed when the test ends.
export const temporaryFolder = (t: TestContext) => {
  const dir = mkdtempSync(join(tmpdir(), 'claude-code-mods-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

export const git = (repo: string, ...args: string[]) =>
  execFileSync('git', args, { cwd: repo, env: { ...process.env, ...GIT_ISOLATION }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

export type ScratchRepo = ReturnType<typeof scratchRepo>

// A repository in the test's own folder, with room beside it for files outside the repository.
export const scratchRepo = (t: TestContext) => {
  const path = join(temporaryFolder(t), 'repo')
  mkdirSync(path)
  git(path, 'init', '-q', '-b', 'main')
  const config = { 'user.name': 'Test', 'user.email': 'test@example.invalid', 'core.excludesFile': '/dev/null', 'commit.gpgSign': 'false' }
  for (const [key, value] of Object.entries(config)) git(path, 'config', key, value)
  const write = (file: string, text = 'nothing to see\n') => {
    mkdirSync(dirname(join(path, file)), { recursive: true })
    writeFileSync(join(path, file), text)
  }
  return {
    path,
    write,
    commit: (message: string, files: Record<string, string> = {}) => {
      for (const [file, text] of Object.entries(files)) {
        write(file, text)
        git(path, 'add', '--', file)
      }
      git(path, 'commit', '-q', '--allow-empty', '-m', message)
    },
    markPushed: () => git(path, 'update-ref', 'refs/remotes/origin/main', 'HEAD'),
    head: () => git(path, 'rev-parse', 'HEAD').trim(),
  }
}

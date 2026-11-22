// A mod's `tools/`: TypeScript run by hand on the repository's Node, never loaded by the engine.
// `types` types it with the tooling's own compiler options; `specs` runs its Node tests.
//
// Usage: node scripts/tools.ts <types|specs> <folder>

import { spawnSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import ts from 'typescript'

import { filesUnder, ROOT, report } from './repo.ts'

const GLOB = /[*?[\]{}()!+@\\]/

// Every `.ts` under the folder's `tools/` but `tools/fixtures/`: the specs, and the tools, which are
// neither specs nor declaration files.
export const toolFiles = (folder: string) => {
  const tools = resolve(folder, 'tools')
  const fixtures = join(tools, 'fixtures')
  const typed = statSync(tools, { throwIfNoEntry: false })?.isDirectory()
    ? filesUnder(tools, path => path === fixtures)
        .filter(path => path.endsWith('.ts'))
        .sort()
    : []
  return {
    typed,
    specs: typed.filter(path => path.endsWith('.spec.ts')),
    tools: typed.filter(path => !path.endsWith('.spec.ts') && !path.endsWith('.d.ts')),
  }
}

const line = (folder: string) => (diagnostic: ts.Diagnostic) => {
  const message = `TS${diagnostic.code} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`
  if (!diagnostic.file || diagnostic.start === undefined) return message
  const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
  return `${relative(resolve(folder), diagnostic.file.fileName)}:${line + 1}: ${message}`
}

// The tools' type errors, against Node's types, with the root `tsconfig.json`'s options.
export const typeProblems = (folder: string): string[] => {
  const { typed } = toolFiles(folder)
  if (!typed.length) return []
  const config = ts.getParsedCommandLineOfConfigFile(
    join(ROOT, 'tsconfig.json'),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: diagnostic => {
        throw new Error(line(folder)(diagnostic))
      },
    },
  )
  if (!config) throw new Error(`cannot read ${join(ROOT, 'tsconfig.json')}`)
  return [...config.errors, ...ts.getPreEmitDiagnostics(ts.createProgram(typed, config.options))].map(line(folder))
}

// Runs the specs by name; a `tools/` with a tool and no spec fails.
export const specProblems = (folder: string): string[] => {
  const { specs, tools } = toolFiles(folder)
  const own = (path: string) => relative(resolve(folder), path)
  if (!specs.length) return tools.length ? [`tools/ holds a tool and no spec (${tools.map(own).join(', ')}): its tests are *.spec.ts beside it`] : []
  // `node --test` reads each path as a glob, and passes when a pattern matches no file.
  const globbed = specs.filter(spec => GLOB.test(relative(ROOT, spec)))
  const problems = globbed.map(spec => `${own(spec)}: its path holds a character node --test reads as a glob: rename it`)
  const runnable = specs.filter(spec => !globbed.includes(spec))
  if (!runnable.length) return problems
  // A `node --test` started inside another inherits NODE_TEST_CONTEXT, then runs nothing and passes.
  const { NODE_TEST_CONTEXT: _, ...env } = process.env
  const run = spawnSync(process.execPath, ['--test', ...runnable.map(spec => relative(ROOT, spec))], { cwd: ROOT, env, stdio: 'inherit' })
  if (run.error) return [...problems, `cannot run node --test: ${run.error.message}`]
  return run.status === 0 ? problems : [...problems, `node --test failed on ${runnable.map(own).join(', ')}`]
}

if (import.meta.main) {
  const [word, folder = '.'] = process.argv.slice(2)
  const check = word === 'types' ? typeProblems : word === 'specs' ? specProblems : undefined
  if (!check) {
    console.log('usage: node scripts/tools.ts <types|specs> <folder>')
    process.exitCode = 2
  } else {
    let problems: string[]
    try {
      problems = check(folder)
    } catch (error) {
      problems = [(error as Error).message]
    }
    report(`tools ${word}`, problems)
  }
}

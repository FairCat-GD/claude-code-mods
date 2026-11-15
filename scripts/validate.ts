// `claude plugin validate`, failing on every error and warning but the one a mod's own workflow
// CLAUDE.md always draws.
//
// Usage: node scripts/validate.ts <folder>

import { spawnSync } from 'node:child_process'

import { claudeCommand, report } from './repo.ts'

// A mod's CLAUDE.md is for the sessions that develop it, never context it ships, so the warning
// that it is not loaded as context is expected.
const EXPECTED = { path: 'root', message: /^CLAUDE\.md at the plugin root is not loaded as project context\b/ }

type Finding = { path?: string; message?: string }

const findings = (node: unknown, key: 'errors' | 'warnings'): Finding[] => {
  if (Array.isArray(node)) return node.flatMap(item => findings(item, key))
  if (!node || typeof node !== 'object') return []
  return Object.entries(node).flatMap(([name, value]) => (name === key && Array.isArray(value) ? (value as Finding[]) : findings(value, key)))
}

const isExpected = (warning: Finding) => warning.path === EXPECTED.path && EXPECTED.message.test(warning.message ?? '')

// What fails the stage in a `validate --json` report.
export const judge = (result: unknown): string[] => {
  const problems = [
    ...findings(result, 'errors').map(error => `error at ${error.path}: ${error.message}`),
    ...findings(result, 'warnings')
      .filter(warning => !isExpected(warning))
      .map(warning => `warning at ${warning.path}: ${warning.message}`),
  ]
  if (!problems.length && (result as { success?: unknown } | null)?.success !== true) problems.push('validate did not succeed')
  return problems
}

// The report as lines to read: what each file hooks and calls, then what it was faulted for.
export const describe = (result: unknown): string[] => {
  const files = [(result as { manifest?: unknown })?.manifest, ...(((result as { contents?: unknown[] })?.contents ?? []) as unknown[])]
  return files.flatMap(file => {
    const { notes = [], errors = [], warnings = [] } = (file ?? {}) as { notes?: string[]; errors?: Finding[]; warnings?: Finding[] }
    return [
      ...notes.map(note => `  ${note}`),
      ...errors.map(error => `  error at ${error.path}: ${error.message}`),
      ...warnings.map(warning => `  warning at ${warning.path}: ${warning.message}${isExpected(warning) ? ' (expected)' : ''}`),
    ]
  })
}

if (import.meta.main) {
  const folder = process.argv[2] ?? '.'
  let problems: string[]
  try {
    const { argv, env } = claudeCommand('plugin', 'validate', '--json', folder)
    const [command = '', ...args] = argv
    const run = spawnSync(command, args, { encoding: 'utf8', env })
    if (run.error) throw new Error(`cannot run claude: ${run.error.message}`)
    let parsed: unknown
    try {
      parsed = JSON.parse(run.stdout)
    } catch (error) {
      throw new Error(`validate printed no JSON report: ${run.stderr.trim() || run.stdout.trim() || (error as Error).message}`)
    }
    for (const line of describe(parsed)) console.log(line)
    problems = judge(parsed)
  } catch (error) {
    problems = [(error as Error).message]
  }
  report('validate', problems, 'validate: ')
}

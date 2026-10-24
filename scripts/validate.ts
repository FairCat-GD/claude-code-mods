// `claude plugin validate`, failing on every error and warning but the one a mod's own workflow
// CLAUDE.md always draws.
//
// Usage: node scripts/validate.ts <folder>

import { spawnSync } from 'node:child_process'

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
export const judge = (report: unknown): string[] => {
  const problems = [
    ...findings(report, 'errors').map(error => `error at ${error.path}: ${error.message}`),
    ...findings(report, 'warnings')
      .filter(warning => !isExpected(warning))
      .map(warning => `warning at ${warning.path}: ${warning.message}`),
  ]
  if (!problems.length && (report as { success?: unknown } | null)?.success !== true) problems.push('validate did not succeed')
  return problems
}

// The report as lines to read: what each file hooks and calls, then what it was faulted for.
export const describe = (report: unknown): string[] => {
  const files = [(report as { manifest?: unknown })?.manifest, ...(((report as { contents?: unknown[] })?.contents ?? []) as unknown[])]
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
  const run = spawnSync('claude', ['plugin', 'validate', '--json', folder], { encoding: 'utf8' })
  let problems: string[]
  try {
    if (run.error) throw run.error
    const report: unknown = JSON.parse(run.stdout)
    for (const line of describe(report)) console.log(line)
    problems = judge(report)
  } catch (error) {
    problems = [
      run.error
        ? `cannot run claude: ${run.error.message}`
        : `validate printed no JSON report: ${run.stderr.trim() || run.stdout.trim() || (error as Error).message}`,
    ]
  }
  for (const problem of problems) console.log(`validate: ${problem}`)
  console.log(`validate: ${problems.length} problem(s)`)
  process.exitCode = problems.length ? 1 : 0
}

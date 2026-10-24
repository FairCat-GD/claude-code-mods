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

if (import.meta.main) {
  const folder = process.argv[2] ?? '.'
  // The readable report first, then the JSON one, which the stage is judged by.
  const shown = spawnSync('claude', ['plugin', 'validate', folder], { stdio: 'inherit' })
  const json = spawnSync('claude', ['plugin', 'validate', '--json', folder], { encoding: 'utf8' })
  let problems: string[]
  try {
    problems = shown.error || json.error ? [`cannot run claude: ${(shown.error ?? json.error)?.message}`] : judge(JSON.parse(json.stdout))
  } catch {
    problems = [`validate printed no JSON report: ${json.stderr.trim() || json.stdout.trim()}`]
  }
  for (const problem of problems) console.log(`validate: ${problem}`)
  console.log(`validate: ${problems.length} problem(s)`)
  process.exitCode = problems.length ? 1 : 0
}

// Reads what a finished Bash call did: a push, a commit, a passing test run.

// What a finished Bash call hands back, as far as these checks need it.
export type BashOutput = {
  stdout: string
  stderr: string
  backgroundTaskId?: string
  gitOperation?: { push?: { branch: string }; commit?: { sha: string; kind: string } }
}

// The commands of a compound one (`cd app && npm test | tail`), split where the shell would.
const parts = (command: string) => command.split(/&&|\|\||[;|\n]/)

// The part of a compound command that runs `git <sub>` (`git -C dir push`, the
// push of `git commit -m x && git push`), so flags elsewhere in the line are not
// read as its own. A word "push" or "commit" in some other git command still
// needs git's own report in the output to count.
const gitPart = (command: string, sub: 'push' | 'commit') => parts(command).find(part => new RegExp(`\\bgit\\b.*\\b${sub}\\b`).test(part))
const PUSH_DRY_RUN = /\s(--dry-run|-n)(\s|$)/
const DRY_RUN = /\s--dry-run(\s|$)/

// A test run is a part that starts with its runner, so a command that only names
// one (`cat jest.config.js`, `npm ls vitest`) is no run. Before the runner may come
// `VAR=value` words, `(` or `{`, and wrappers such as `timeout 600` or `bash -c "`.
const LEAD = String.raw`(?:[A-Za-z_]\w*=(?:"[^"]*"|'[^']*'|\S*)\s+|[({]\s*|(?:time|env|nice|command|exec|timeout\s+\S+)\s+|(?:ba|z)?sh\s+-c\s+['"]?)*`
// Flags, each with an optional value: the `-y` of `npx -y vitest`, `--filter app`.
const FLAGS = String.raw`(?:-\S+\s+(?:[^-\s]\S*\s+)?)*`
const LAUNCHER = String.raw`(?:npx|bunx|uvx|npm\s+exec|pnpm(?:\s+(?:exec|dlx))?|yarn(?:\s+dlx)?|bun\s+(?:run|x)|uv\s+run|poetry\s+run|python[\d.]*\s+-m)\s+${FLAGS}`
const RUNNERS = [
  String.raw`(?:npm|pnpm|yarn|bun)\s+${FLAGS}(?:run\s+)?(?:test|verify)`,
  String.raw`(?:${LAUNCHER})?(?:\S*/)?(?:vitest|jest|pytest|playwright\s+test)`,
  String.raw`go\s+test|cargo\s+(?:test|nextest|xtask\s+verify)|swift\s+test|deno\s+test`,
  String.raw`make\s+(?:test|check|verify)|claude\s+plugin\s+test`,
]
// The runner ends at its word: `npm run test:unit` counts, `jest.config.js` doesn't.
const TEST_RUN = new RegExp(String.raw`^\s*${LEAD}(?:${RUNNERS.join('|')})(?![\w./])`)
// A piped run (`npm test | tail`) exits with the pipe's last command, so the
// output has the last word: any failure it reports means the run did not pass.
const FAILED_COUNT = /\b[1-9]\d*\s+(?:failed|failing|failures?|errors?)\b/i
const FAILED_MARK = /\bFAIL(?:ED)?\b|^\s*\(fail\)|test result: FAILED/m
const PASSED_COUNT = /\b(\d+)\s+(?:passed|passing|pass)\b/gi
// Runners that print no "N passed" still say so: go's `ok`/`PASS`, XCTest, swift-testing.
const PASSED_MARK = /^\s*(?:ok|PASS)\b|\bExecuted \d+ tests?, with 0 failures\b|\btests?'? passed\b|\bverify: PASS\b/m

const printed = (out: BashOutput) => `${out.stdout}\n${out.stderr}`

// The branch a successful push updated, or undefined when nothing was pushed.
export function pushedBranch(command: string, out: BashOutput): string | undefined {
  const part = gitPart(command, 'push')
  if (out.backgroundTaskId !== undefined || part === undefined || PUSH_DRY_RUN.test(part)) {
    return undefined
  }
  const text = printed(out)
  if (/Everything up-to-date/.test(text)) {
    return undefined
  }
  // The push's own ref lines follow its "To <remote>" line; a fetch or pull
  // earlier in the command prints "->" lines of its own before it.
  const pushed = text.search(/^To \S/m)

  return out.gitOperation?.push?.branch ?? /\S+\s+->\s+(\S+)/.exec(pushed < 0 ? text : text.slice(pushed))?.[1]
}

// The commit just made (short hash, whether an amend, its subject as git printed
// it), or undefined when none was.
export function committed(command: string, out: BashOutput): { sha: string; isAmend: boolean; subject: string } | undefined {
  const part = gitPart(command, 'commit')
  if (out.backgroundTaskId !== undefined || part === undefined || DRY_RUN.test(part)) {
    return undefined
  }
  const line = /^\[[^\]\s]+(?: \([^)]*\))? ([0-9a-f]{7,40})\] ?(.*)$/m.exec(out.stdout)
  const subject = line?.[2] ?? ''
  const made = out.gitOperation?.commit
  if (made !== undefined) {
    return { sha: made.sha.slice(0, 7), isAmend: made.kind === 'amended', subject }
  }
  const sha = line?.[1]

  return sha === undefined ? undefined : { sha: sha.slice(0, 7), isAmend: /\s--amend\b/.test(command), subject }
}

// "42 passed" (or "" without a count) for a test run whose output says it passed,
// else undefined.
export function testsPassed(command: string, out: BashOutput): string | undefined {
  if (out.backgroundTaskId !== undefined || !parts(command).some(part => TEST_RUN.test(part))) {
    return undefined
  }
  const text = printed(out)
  if (FAILED_COUNT.test(text) || FAILED_MARK.test(text)) {
    return undefined
  }
  const counts = [...text.matchAll(PASSED_COUNT)].map(match => Number(match[1]))
  if (counts.length === 0) {
    return PASSED_MARK.test(text) ? '' : undefined
  }

  return `${Math.max(...counts)} passed`
}

// A commit of fixes a code review found: `review: ...`, or a `fix:` that names a review.
export const isReviewFix = (subject: string) => /^review\b/i.test(subject) || (/^fix\b/i.test(subject) && /\breview\b/i.test(subject))

// 142318 → "142k".
export const tokens = (count: number) => (count >= 1000 ? `${Math.round(count / 1000)}k` : String(count))

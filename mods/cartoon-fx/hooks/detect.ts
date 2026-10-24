// Reads what a finished Bash call did: a push, a commit, a passing test run.

// What a finished Bash call hands back, as far as these checks need it.
export type BashOutput = {
  stdout: string
  stderr: string
  backgroundTaskId?: string
  gitOperation?: { push?: { branch: string }; commit?: { sha: string; kind: string } }
}

// The part of a compound command that runs `git <sub>` (`git -C dir push`, the
// push of `git commit -m x && git push`), so flags elsewhere in the line are not
// read as its own. A word "push" or "commit" in some other git command still
// needs git's own report in the output to count.
const gitPart = (command: string, sub: 'push' | 'commit') =>
  command.split(/&&|\|\||[;|\n]/).find(part => new RegExp(`\\bgit\\b.*\\b${sub}\\b`).test(part))
const PUSH_DRY_RUN = /\s(--dry-run|-n)(\s|$)/
const DRY_RUN = /\s--dry-run(\s|$)/

const TEST_RUN =
  /\b(?:(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:test|verify)|npx\s+(?:vitest|jest|playwright)|vitest|jest|pytest|go\s+test|cargo\s+(?:test|nextest|xtask\s+verify)|swift\s+test|deno\s+test|bun\s+test|make\s+(?:test|check|verify)|claude\s+plugin\s+test)\b/
// A piped run (`npm test | tail`) exits with the pipe's last command, so the
// output has the last word: any failure it reports means the run did not pass.
const FAILED_COUNT = /\b[1-9]\d*\s+(?:failed|failing|failures?|errors?)\b/i
const FAILED_MARK = /\bFAIL(?:ED)?\b|^\s*\(fail\)|test result: FAILED/m
const PASSED_COUNT = /\b(\d+)\s+(?:passed|passing|pass)\b/gi

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

// "42 passed" (or "" without a count) for a test run that passed, else undefined.
export function testsPassed(command: string, out: BashOutput): string | undefined {
  if (out.backgroundTaskId !== undefined || !TEST_RUN.test(command)) {
    return undefined
  }
  const text = printed(out)
  if (FAILED_COUNT.test(text) || FAILED_MARK.test(text)) {
    return undefined
  }
  const counts = [...text.matchAll(PASSED_COUNT)].map(match => Number(match[1]))

  return counts.length === 0 ? '' : `${Math.max(...counts)} passed`
}

// A commit of fixes a code review found: `review: ...`, or a `fix:` that names a review.
export const isReviewFix = (subject: string) =>
  /^review\b/i.test(subject) || (/^fix\b/i.test(subject) && /\breview\b/i.test(subject))

// 142318 → "142k".
export const tokens = (count: number) => (count >= 1000 ? `${Math.round(count / 1000)}k` : String(count))

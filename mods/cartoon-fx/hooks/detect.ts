// Reads what a finished Bash call did: a push, a commit, a passing test run.

// What a finished Bash call hands back, as far as these checks need it.
export type BashOutput = {
  stdout: string
  stderr: string
  backgroundTaskId?: string
  gitOperation?: { push?: { branch: string }; commit?: { sha: string; kind: string } }
}

// The commands of a compound one (`cd app && npm test | tail`), split where the shell
// would: never inside quotes, `$(…)`, backticks, a comment or a heredoc's body.
function parts(command: string): string[] {
  const found: string[] = []
  const open: string[] = [] // the quotes and `$(` being read, innermost last
  const heredocs: { word: string; isIndented: boolean }[] = []
  let part = ''
  const cut = () => {
    found.push(part)
    part = ''
  }
  for (let i = 0; i < command.length; i++) {
    const c = command.charAt(i)
    const inside = open.at(-1)
    if (inside === "'") {
      if (c === "'") open.pop()
      part += c
      continue
    }
    if (c === '\\') {
      // A backslash keeps the next character, and before a newline joins the lines.
      if (command.charAt(i + 1) !== '\n') part += command.slice(i, i + 2)
      i++
      continue
    }
    if (c === '$' && command.charAt(i + 1) === '(') {
      open.push('(')
      part += '$('
      i++
      continue
    }
    if (inside === '"' || inside === '`') {
      if (c === inside) open.pop()
      else if (c === '`') open.push(c)
      part += c
      continue
    }
    // At the top, or inside `$(…)`; in `$((…))` arithmetic, `<<` is a shift.
    const isArithmetic = open.length >= 2 && open.at(-2) === '(' && inside === '('
    const doc = c === '<' && !isArithmetic ? /^<<(-?)\s*(?:'([^']*)'|"([^"]*)"|([^\s;&|<>()'"]+))/.exec(command.slice(i)) : null
    if (doc !== null && command.charAt(i - 1) !== '<' && command.charAt(i + 2) !== '<') {
      heredocs.push({ word: doc[2] ?? doc[3] ?? (doc[4] ?? '').replace(/\\/g, ''), isIndented: doc[1] === '-' })
      part += doc[0]
      i += doc[0].length - 1
    } else if (c === '\n' && heredocs.length > 0) {
      if (open.length === 0) cut()
      i = pastBodies(command, i + 1, heredocs.splice(0)) - 1
    } else if (c === '#' && /(?:^|[\s;&|()])$/.test(part)) {
      const end = command.indexOf('\n', i)
      i = (end < 0 ? command.length : end) - 1
    } else if (open.length === 0 && /^(?:&&|\|\||[;|\n])/.test(command.slice(i, i + 2))) {
      cut()
      if (command.startsWith('&&', i) || command.startsWith('||', i)) i++
    } else {
      if (c === "'" || c === '"' || c === '`' || (c === '(' && inside === '(')) open.push(c)
      else if (c === ')' && inside === '(') open.pop()
      part += c
    }
  }
  cut()

  // `bash -c '…'` runs a command line of its own.
  return found.flatMap(part => {
    const inner = SH_C.exec(part)
    return inner === null ? [part] : [part, ...parts(inner[1] ?? (inner[2] ?? '').replace(/\\(.)/g, '$1'))]
  })
}
const SH_C = /(?:^|[\s(])(?:ba|z)?sh\s+-c\s+(?:'([^']*)'|"((?:[^"\\]|\\.)*)")/

// The last command's parts, kept: each Bash call reads them for a push, a commit,
// a test run and their order.
let lastParts: { command: string; found: readonly string[] } | undefined
function partsOf(command: string): readonly string[] {
  if (lastParts?.command !== command) {
    lastParts = { command, found: parts(command) }
  }

  return lastParts.found
}

// Where the bodies of `docs`, starting at `from`, end: just past each delimiter's line.
function pastBodies(command: string, from: number, docs: { word: string; isIndented: boolean }[]) {
  let at = from
  for (const doc of docs) {
    while (at < command.length) {
      const end = command.indexOf('\n', at)
      const line = command.slice(at, end < 0 ? command.length : end)
      at = end < 0 ? command.length : end + 1
      if ((doc.isIndented ? line.replace(/^\t+/, '') : line) === doc.word) break
    }
  }

  return at
}

// A part's git subcommand: the first word after `git` and its global options
// (`git -C app push`), so a later word (`git log --grep=push`) is not one.
const WORD = String.raw`(?:"[^"]*"|'[^']*'|[^\s"'])+`
const GIT = new RegExp(String.raw`(?<![\w.-])git(?:\s+(?:-[Cc]\s+${WORD}|--no-pager|--[\w-]+=${WORD}))*\s+([\w-]+)`)
const subOf = (part: string) => GIT.exec(part)?.[1]
const gitPart = (command: string, sub: 'push' | 'commit') => partsOf(command).find(part => subOf(part) === sub)
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
  String.raw`node\s+(?:-\S+\s+)*?--test(?!-)|dotnet\s+test|mix\s+test`,
  String.raw`(?:bundle\s+exec\s+)?(?:\S*/)?rspec|(?:php\s+)?(?:\S*/)?phpunit`,
  // Not maven's `test-compile`, which runs no tests.
  String.raw`(?:\S*/)?gradlew?\s+${FLAGS}(?:\S*:)?test(?!-)|(?:\S*/)?mvnw?\s+${FLAGS}(?:clean\s+${FLAGS})?test(?!-)`,
  // xcodebuild takes its action after its options.
  String.raw`xcodebuild(?:\s+\S+)*?\s+test(?:-without-building)?`,
]
// The runner ends at its word: `npm run test:unit` counts, `jest.config.js` doesn't.
const TEST_RUN = new RegExp(String.raw`^\s*${LEAD}(?:${RUNNERS.join('|')})(?![\w./])`)
// A piped run (`npm test | tail`) exits with the pipe's last command, so the
// output has the last word: any failure it reports means the run did not pass.
const FAILED_COUNT = /\b[1-9]\d*\s+(?:fail|failed|failing|failures?|errors?)\b/i
// node's `ℹ fail 1`, dotnet's `Failed: 1`, maven's and phpunit's `Failures: 1`.
const FAILED_TALLY = /^\s*(?:ℹ|#)?\s*fail\s+[1-9]|\b(?:[Ff]ailed|Failures|Errors):\s*[1-9]/m
// A failure mark counts where runners print it, at a line's start (after maven's
// `[ERROR]`, go's `--- `, xcodebuild's `** `), so a test named "shows FAIL" passes.
const FAILED_MARK =
  /^\s*(?:\[[A-Z]+\]\s+)?(?:--- |\*\* )?(?:(?:BUILD|TEST) )?FAIL(?:ED|URES?)?\b|^\s*(?:\(fail\)|ERRORS!)|test result: FAILED|\bverify: FAIL\b/m
const PASSED_COUNT = /\b(\d+)\s+(?:passed|passing|pass)\b/gi
// node's `ℹ pass 48`, dotnet's `Passed: 12` and newer `succeeded: 12`.
const PASSED_TALLY = /^\s*(?:ℹ|#)?\s*pass\s+(\d+)\s*$|\b(?:Passed|succeeded):\s*(\d+)/gm
// Runners that print no "N passed" still say so: go's `ok`/`PASS`, XCTest, swift-testing,
// rspec and mix, gradle and maven, xcodebuild, phpunit.
const PASSED_MARK = new RegExp(
  [
    String.raw`^\s*(?:ok|PASS)\b|\bExecuted \d+ tests?, with 0 failures\b|\btests?'? passed\b|\bverify: PASS\b`,
    String.raw`\b\d+ (?:examples?|tests?), 0 failures\b|\bBUILD SUCCESS(?:FUL)?\b|\*\* TEST SUCCEEDED \*\*|^OK (?:\(\d+ tests?|, but\b)`,
  ].join('|'),
  'm',
)

const printed = (out: BashOutput) => `${out.stdout}\n${out.stderr}`

// Where each moment ran: the index of the first part that pushed, committed or
// ran tests, or undefined where none did (an alias the engine reported).
export function ranAt(command: string): Record<'push' | 'commit' | 'tests', number | undefined> {
  const found = partsOf(command)
  const first = (does: (part: string) => boolean) => {
    const at = found.findIndex(does)
    return at < 0 ? undefined : at
  }

  return {
    push: first(part => subOf(part) === 'push'),
    commit: first(part => subOf(part) === 'commit'),
    tests: first(part => TEST_RUN.test(part)),
  }
}

// The branch a successful push updated, or undefined when nothing was pushed.
// git's own report under `To` outranks the engine's, which also takes a fetch's
// `a..b main -> origin/main` line for the push.
export function pushedBranch(command: string, out: BashOutput): string | undefined {
  const reported = out.gitOperation?.push?.branch
  const part = gitPart(command, 'push')
  if (out.backgroundTaskId !== undefined || (reported === undefined && (part === undefined || PUSH_DRY_RUN.test(part)))) {
    return undefined
  }
  const text = printed(out)
  if (/^To \S/m.test(text)) {
    return refPushed(text)
  }

  return /Everything up-to-date/.test(text) ? undefined : reported
}

// The first ref a push's report names under its `To <remote>` line, past those
// rejected (`!`) or already up to date (`=`).
function refPushed(text: string) {
  const lines = text.split(/\r\n|\r|\n/)
  for (const [i, line] of lines.entries()) {
    if (!line.startsWith('To ')) continue
    for (const ref of lines.slice(i + 1)) {
      if (!/^\s/.test(ref)) break
      const to = /\S\s+->\s+(\S+)/.exec(ref)?.[1]
      if (to !== undefined && !/^\s*[!=]\s/.test(ref)) return to
    }
  }

  return undefined
}

// The commit just made (short hash, whether an amend, its subject as git printed
// it), or undefined when none was. A cherry-pick is not one.
export function committed(command: string, out: BashOutput): { sha: string; isAmend: boolean; subject: string } | undefined {
  if (out.backgroundTaskId !== undefined) {
    return undefined
  }
  const line = /^\[(?:[^\]\s]+|detached HEAD)(?: \([^)]*\))? ([0-9a-f]{7,40})\] ?(.*)$/m.exec(out.stdout)
  const subject = line?.[2] ?? ''
  const made = out.gitOperation?.commit
  if (made !== undefined && made.kind !== 'cherry-picked') {
    return { sha: made.sha.slice(0, 7), isAmend: made.kind === 'amended', subject }
  }
  const part = gitPart(command, 'commit')
  const sha = line?.[1]

  return part === undefined || DRY_RUN.test(part) || sha === undefined ? undefined : { sha: sha.slice(0, 7), isAmend: /\s--amend\b/.test(part), subject }
}

// "42 passed" (or "" without a count) for a test run whose output says it passed,
// else undefined.
export function testsPassed(command: string, out: BashOutput): string | undefined {
  if (out.backgroundTaskId !== undefined || !partsOf(command).some(part => TEST_RUN.test(part))) {
    return undefined
  }
  const text = printed(out)
  if (FAILED_COUNT.test(text) || FAILED_TALLY.test(text) || FAILED_MARK.test(text)) {
    return undefined
  }
  const counts = [...text.matchAll(PASSED_COUNT), ...text.matchAll(PASSED_TALLY)].map(match => Number(match[1] ?? match[2]))
  if (counts.length === 0) {
    return PASSED_MARK.test(text) ? '' : undefined
  }

  return `${Math.max(...counts)} passed`
}

// A commit of fixes a code review found: `review: ...`, or a `fix:` that names a review.
export const isReviewFix = (subject: string) => /^review\b/i.test(subject) || (/^fix\b/i.test(subject) && /\breview\b/i.test(subject))

// 142318 → "142k".
export const tokens = (count: number) => (count >= 1000 ? `${Math.round(count / 1000)}k` : String(count))

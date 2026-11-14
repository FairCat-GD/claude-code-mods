# cartoon-fx — architecture, as built

This is cartoon-fx as it stands at 0.11.1, written from its code. Every session that changes the
mod keeps it true.

## Overview

cartoon-fx is one hooks module (`hooks/register.tsx`), with three helpers beside it:
- `hooks/detect.ts` reads what a finished Bash call did: a push, a commit, a passing test run;
- `hooks/fx.ts` draws each effect as an animated SVG string;
- `hooks/zones.ts` holds the context window's zones, which the hooks play by and the gauge
  draws.

It does two things:
- **It watches the session.** Tool calls, compactions, subagent starts and finished turns. When
  something worth marking happens, it **plays** an effect: one `Shown` value in `$.state`, held
  for the effect's length plus a short hold.
- **It draws the effect on show.** Its `ui.render` hooks draw it into one of two places:
  - the conversation row that set it off, or for a card the desktop draws its own way, the row
    just before it (desktop only);
  - the strip above the prompt (`AbovePrompt`). The terminal always uses the strip, as a row of
    coloured glyphs.

One effect is on show at a time. A new one replaces any still playing.

| File | Lines | Holds |
|---|---|---|
| `hooks/register.tsx` | 506 | the hooks, playing and placement |
| `hooks/detect.ts` | 221 | the Bash readers, `isReviewFix`, `tokens` |
| `hooks/fx.ts` | 969 | the ten drawings, their SMIL helpers, and fitting words |
| `hooks/zones.ts` | 8 | the yellow and red zones and their resets |
| `types/index.d.ts` | 26 | `FxKind`, `Placement`, `Shown`, and the `$.state` contract |
| `tests/cartoon-fx.test.tsx` | 1105 | 50 tests |

## The invariants

1. **An effect's fault never costs a call its result.** Every gating hook awaits `next(e)` first,
   then plays. Its `.catch((_$, e, next) => next(e))` lets the call go on unchanged if the mod
   throws. The context check runs beside the result (`void watchContext(…).catch(…)`), so no call
   waits on it. *Enforced by* `claude plugin validate`, which lists 5 gating hooks, each with a
   `.catch`.
2. **The mod only reacts.** It never denies, rewrites or delays a call, a compaction or a spawn.
   It returns what `next` returned. *Enforced by* the code and by the tests, which check that the
   row still draws the engine's own content, with the effect beneath it.
3. **The same seed always draws the same picture.** `random(seed)` is a seeded PRNG, so a redraw
   doesn't reshuffle the confetti. *Enforced by* the terminal test, which checks the glyphs are
   identical 900 ms later.
4. **A failure plays nothing.** A denied or errored call, a dry run, a rejected push, a push with
   nothing to push, a test run that reports any failure, and a plan turned down all play nothing.
   *Enforced by* tests for the failed push, the rejected push, the plan turned down, the failing
   runs, and none fixed.
5. **The drawings carry no script.** Each effect is SVG animated with SMIL alone, so it draws
   wherever the app shows an `<Svg>`.

## The hooks

`validate` lists 13 hooks, 5 of them gating, and 4 state keys.

| Hook | Gating | Reacts to | Plays |
|---|---|---|---|
| `session.start` | | a new or reloaded session | Clears `shown` (a reload drops the timers that would end it), takes up the stored placement, and registers `/fx` (`immediate`). |
| `tool.call` `{ tool: 'Bash' }` | ✓ | a finished Bash call | `push`, else a review-fix commit as `fixes`, else `commit`, else `tests`. |
| `tool.call` `{ tool: 'ExitPlanMode' }` | ✓ | a plan the person accepted | `plan`, unless a teammate's plan still waits on its lead (`awaitingLeaderApproval`). |
| `tool.call` (every tool) | ✓ | `ReportFindings`, and every finished call | `review` or `fixes` from a code review's report, in the row just before its card; then the context check. |
| `turn.complete` | | a finished turn | The context check. |
| `session.compact` | ✓ | a compaction, not a precompute or a subagent's | `compact`, with tokens before and after. |
| `agent.spawn` | ✓ | a subagent started | `helpers`, gathering spawns within 400 ms into one, with their count. |
| `command.run` `{ command: 'fx' }` | | `/fx` | Replays effects, or stores a placement. |
| `ui.render` `ToolUse` | | a tool call's own row (desktop) | Draws the effect under the row that set it off. Passes over a call the desktop draws as its own card (`OWN_CARDS`). |
| `ui.render` `ToolGroup` | | a folded group of calls (desktop) | Draws the effect under the group holding its call. An unfolded group's rows are `ToolUse`. |
| `ui.render` `AssistantMessage` | | a reply's text row (desktop) | Draws a review's effect under the reply whose text comes just before its card. |
| `ui.render` `CommandOutput` `{ command: 'fx' }` | | `/fx`'s output row (desktop) | Draws the effect under the row whose `(take N)` tag it carries. |
| `ui.render` `AbovePrompt` | | the strip above the prompt | Draws effects with no row, effects under `/fx place bottom`, and fallbacks from rows; on the terminal, every effect as glyphs. Stays out of the way of a survey (`hasSurvey`). |

## Detection (`hooks/detect.ts`)

- **The engine's report first,** but for a push that git reported itself. A Bash call's
  `gitOperation` is the engine's own reading of what git did. Where it names a commit, it decides;
  where it names a push, it decides unless git printed its own report, which outranks it. Git's
  printed output is the fallback for what the engine leaves out. Read from the CLI build 2.1.325,
  whose desktop engine holds the same pattern, the engine:
  - anchors the subcommand as `gitPart` below does, but takes no `--no-pager`;
  - reports a commit from the first `[<branch>|detached HEAD] (root-commit)? <sha>]` line, of kind
    `cherry-picked` when the command has `git cherry-pick`, `amended` with `--amend`, else
    `committed`;
  - reports a push only without `-n`/`--dry-run`, from the first ref line shaped `sha..sha` or
    `[new branch]` anywhere in the output, so a rejected, up-to-date, deleted or `[new tag]` ref
    is no push, but a fetch's or pull's `a..b main -> origin/main` line earlier in the command
    is;
  - reports nothing for a call in the background.
- **The parts of a command.** `parts` splits a compound command where the shell would: at `&&`,
  `||`, `;`, `|` and newlines, but never inside quotes, `$(…)`, backticks or a heredoc's body,
  and after `\` a newline only joins the lines. A heredoc's body (`<<`, `<<-`, a quoted
  delimiter) and a `#` comment belong to no part. The string of `sh|bash|zsh -c '…'` is split
  again, as a command of its own.
- **The git part of a command.** A part's subcommand is the first word after `git` and its global
  options (`-C <dir>`, `-c <key=value>`, `--no-pager`, `--<option>=<value>`), so `git log
  --grep=push` is no push. `gitPart` takes the part whose subcommand is `push` or `commit`; a flag
  elsewhere in the line (the `-n` of `git log -n 5`) is not read as the push's own.
- **A push** needs the engine's `gitOperation.push`, or a push part with no `--dry-run` or
  `-n`. Where git printed its own report, under a `To <remote>` line, that decides: the first
  indented ref line with `->` that is not a rejection (`!`) or already up to date (`=`) names
  the branch, or a tag, and with none nothing plays. With no `To` line, the engine's branch
  plays, unless git said "Everything up-to-date". So a log's `HEAD -> main`, a rename's
  `a -> b` or a pull's fetched line never plays.
- **A commit** plays the engine's `gitOperation.commit` of kind `committed` or `amended`, with the
  subject from git's printed line. A `cherry-picked` one plays nothing yet. Otherwise it needs a
  commit part with no `--dry-run`, and git's `[<branch>|detached HEAD] (…)? <sha>] subject` line;
  it is an amend when that part has `--amend`.
- **A review-fix commit** is one whose subject starts `review`, or starts `fix` and names a review.
  It plays `fixes` in place of the stamp.
- **A passing test run** is a part that starts with one of `RUNNERS`
  (`npm|pnpm|yarn|bun (run) test|verify`, `vitest`, `jest`, `pytest`, `playwright test`,
  `go test`, `cargo test|nextest|xtask verify`, `swift test`, `deno test`,
  `make test|check|verify`, `claude plugin test`, `node --test`, `dotnet test`, `mix test`,
  `(bundle exec) rspec`, `(php) phpunit`, `gradle|gradlew (:mod:)test`,
  `mvn|mvnw (clean) test` but not `test-compile`, and `xcodebuild … test`, whose action follows
  its options). A path may come before rspec, phpunit, gradle and mvn.
  - Only `LEAD` may come before it: `VAR=value` words (quoted values too), `(` or `{`, and the
    wrappers `time`, `env`, `nice`, `command`, `exec`, `timeout <n>` and `sh|bash|zsh -c`.
  - Before `vitest`, `jest`, `pytest` or `playwright test` may also come a `LAUNCHER` (`npx`,
    `bunx`, `uvx`, `npm exec`, `pnpm (exec|dlx)`, `yarn (dlx)`, `bun run|x`, `uv run`,
    `poetry run`, `python -m`) with its flags, and a path (`./node_modules/.bin/jest`).
  - The runner ends at its word, so `npm run test:unit` counts and `jest.config.js` doesn't.
    A command that only names a runner (`cat jest.config.js`, `npm ls vitest`,
    `npx playwright install`) is no run.
  - It must print no failure: no count (`N fail`, `failed`, `failing`, `failures`, `errors`),
    no tally of one or more (node's `fail N` line, dotnet's `Failed: N`, maven's and phpunit's
    `Failures: N` or `Errors: N`), and no mark. A mark counts only at a line's start, after
    spaces, a `[LEVEL]` prefix, `--- ` or `** `: `FAIL`, `FAILED`, `FAILURES!`, `ERRORS!`,
    `BUILD FAILED|FAILURE`, `TEST FAILED`, a `(fail)` line; `test result: FAILED` and
    `verify: FAIL` count anywhere. So a test named "shows FAIL badge" passes. A piped run exits
    with the pipe's last command, so the printed output has the last word.
  - It must print a pass: an `N passed|passing|pass` count or a tally (node's `pass N` line,
    dotnet's `Passed: N` or `succeeded: N`), or with neither, a runner's own mark (`PASSED_MARK`:
    a line starting `ok` or `PASS`, XCTest's "with 0 failures", "tests passed", `verify: PASS`,
    `N examples|tests, 0 failures`, `BUILD SUCCESS(FUL)`, `** TEST SUCCEEDED **`, phpunit's
    `OK (N tests` or `OK, but`). A run that prints none plays nothing.
  - The count shown is the largest count or tally, or none with only a mark.
- **Calls in the background** (`backgroundTaskId`) count as none of these.
- **One command may do several.** The push wins, then the commit, then the tests.

## The drawings (`hooks/fx.ts`)

- **The box and the view.** Every effect fits one 440 × 190 box. The SVG shows its middle 260
  units (`viewBox="90 0 260 190"`), drawn ×3.2 (832 × 608); a narrower surface shrinks it. Pieces
  that fly past the sides leave the frame.
- **The animation** is SMIL (`animate`, `animateTransform`, `animateMotion`), with no script.
  Shared pieces: the tilted label, smoke clouds, motion rays, sparkles and squash streaks.
- **What pops** springs to `PEAK` (1.28) times its size before it settles; the stamp's imprint
  lands at 1.35.
- **Words that fit.** A label fits its title and subtitle inside the view, with a 4-unit margin,
  at its pop's peak, its tilt included. It shrinks each in half steps down to 70% of its size
  (a subtitle to 10), then cuts it with "…". Each drawing passes the height its label lands at
  with the words the tests cover; a label moves up or down only for words longer than those.
  The stamp fits its word inside the imprint's inner frame (down to 20; AMENDED needs it) and
  its hash under it. `alt` keeps the whole words.
  - Widths come from `textBox`, an estimate: no text metrics reach a mod. Each character class
    counts a little over the widest of its letters, as Chromium on macOS measured Arial Rounded
    MT Bold (where the font stack lands there) and system-ui, at weights 800 and 900. Any other
    character counts a whole em.
- **Smoke** (`cloud`) is overlapping circles, an edge layer under a fill layer, that swell,
  drift out and shrink to nothing. None fades, so no edge shows through a fill on any
  background.
- **Names for the tests.** The pieces the structural tests read carry a `class`: `label`,
  `lens`, `mark`, `band`, `needle`, `puff` and `helper`. Nothing else reads them.
- **The ten effects and their lengths** (`FX_MS`):

  | Kind | Drawing | ms |
  |---|---|---|
  | `plan` | a clapperboard snaps shut | 2600 |
  | `commit` | a rubber stamp leaves SAVED or AMENDED and the hash | 2300 |
  | `push` | confetti, 46 pieces, with the branch | 2600 |
  | `tests` | a checkmark badge with the count | 2400 |
  | `review` | a magnifying glass zigzags down a page; a red "!" after each flagged line (up to 4) as the glass reaches it, or a green check | 2800 |
  | `fixes` | a bug walks in and is swatted | 2700 |
  | `compact` | a press squishes pages into a cube | 2600 |
  | `helpers` | a smoke bomb drops and bursts; up to five pixel ninjas leap out in front of the smoke, land and hold a victory pose | 2600 |
  | `context` | a gauge swings into the yellow | 3100 |
  | `redzone` | a gauge slams into the red, rattles and steams | 3300 |

- **`value`** is the helper count, the context percentage, or the number of findings. Past
  the drawn range it is clamped: five helpers at most and one at least, four marks, and the
  needle between 0 and 100.
- **The gauge's bands** are green to `YELLOW`, yellow to `RED`, red to 100, read from
  `hooks/zones.ts`, the same numbers the context check plays by.

## Playing and placement

- **`play`** takes up the stored placement, then sets `shown`. That is `{ kind, seed, title,
  subtitle, value, until, row? }`, with `seed` the clock's now.
  - It schedules the end: `FX_MS[kind] + HOLD_MS` (600 ms). The hold lets a surface that mounts
    late still show the whole drawing.
  - The end clears `shown` only while it still holds this seed.
- **Rows.** An effect belongs to the row of what set it off: `tool:<tool_use_id>` for a call, or
  `fx:(take N)` for `/fx`'s output row.
  - **A card the desktop draws its own way** (`OWN_CARDS`: `ReportFindings`) shows no hook's
    tree. The desktop raises its `ToolUse` row while the call runs, with no `onScreen`, then puts
    its card in that row's place (measured, desktop 2.1.308). So the `ToolUse` hook passes it
    over, and it never counts as drawn.
  - A review plays in the row just before its card instead. `rowBefore` reads
    `$.session.messages()`, which holds one message per block. It walks back past thinking and
    tool results to the nearest earlier call (`tool:<id>`) or reply text (`reply:<its text>`). It
    stops at the person's prompt. With no such row, or a transcript it cannot read, the review
    keeps the card's row, and the fallback moves it to the strip.
  - Replies are matched by text, so two can share one. Only the reply row that first drew last
    takes the effect: `replies` keeps each row's text and that order, for the 500 rows seen last.
  - A subagent's calls have no row in the main transcript, so they play in the strip at once.
  - A compaction has no row either.
- **Where it draws.** With `placement` `conversation` (the default), the desktop draws it under its
  row (`ToolUse`), under the folded `ToolGroup` that holds the call, or under the reply row
  (`AssistantMessage`) whose text matches. With `bottom`, or with no row, it draws in the strip.
  - Every row hook reads `shown`, so each mounted row redraws when an effect starts. An earlier
    row picks up an effect played after it was drawn.
- **The fallback.** 900 ms after playing, an effect whose row has not drawn it is played again in
  the strip, as a fresh effect with no row. A row drawn with `onScreen: null`, scrolled out of
  view, counts as not drawn. Examples: a group folded away, a row scrolled off, a review with no
  row before its card. The strip marks a row's effect as drawn when it shows it, so the terminal
  never replays.
  - `drawnRows` keeps the 200 rows drawn last. Drawing a row again moves it to the newest end, so
    the row of the effect on show is never the one let go.
  - The desktop reports no `onScreen` (measured, desktop 2.1.308), so there a drawn row always
    counts.
  - The engine gives a mod's `tool.call` and `ui.render` hooks one module memory (measured,
    desktop 2.1.308). So the fallback, timed from the call's hook, sees the marks the rows leave
    in `drawnRows`.
- **The terminal** draws no SVG. The strip shows five glyphs (`✦ • ▪ ✶ ✧ ◆ ∗ ❋`) on each side of
  the words, coloured from the same seed. Rows are left alone.
- **`/fx`** replays from `SAMPLES`, fixed words and values, in the order of `/fx all`. Each starts
  after the one before has finished (length + hold + 300 ms). All of them play in that run's
  output row, found by its `(take N)` tag. The engine puts the plugin's name before the output
  text, so the tag, not the whole text, identifies the row.

## Values: `$.state` and `$.store`

**`$.state`**, declared in `types/index.d.ts` under `PluginState['cartoon-fx']`, lasts for the
session:

| Key | Type | Holds |
|---|---|---|
| `shown` | `Shown \| null` | the effect on show |
| `isYellow` | `boolean` | the context window is in its yellow zone (set at `YELLOW`, 75%, cleared below `RESET`, 70%) |
| `isRed` | `boolean` | in its red zone (set at `RED`, 90%, cleared below `RED_RESET`, 85%) |
| `placement` | `Placement` | `conversation` or `bottom`, as taken up from the store |

**`$.store`** holds the owner's data, kept across sessions:

| Key | Holds | Written by |
|---|---|---|
| `placement` | `conversation` or `bottom` | `/fx place …` |
| `fxTakes` | the number of the last `/fx` take | every `/fx` run |

- **How the store is keyed.** The engine keys a plugin's store by its id, `<name>@<marketplace>`,
  not by its name. It keeps it in `~/.claude/plugins/store/`, one JSON file per id; an id with `@`
  is written as `<id, @ → _>-<12 hex of its SHA-256>.json`.
  - The installed release, `cartoon-fx@claude-code-mods`, uses
    `cartoon-fx_claude-code-mods-6577be291cc9.json`.
  - A `--plugin-dir` copy, `cartoon-fx@inline`, uses `cartoon-fx_inline-7a58292beebc.json`.
  - The engine carries a store to a new id only for renamed built-in plugins. So a new name or a
    new marketplace starts empty.
- **Read forward-only.** A stored `placement` that isn't one of the two values is ignored. A
  missing `fxTakes` counts as 0.

## Reach

Beyond the hooks above, cartoon-fx calls only what `validate` lists:
- `$.store.get` and `$.store.set`, for the two values above;
- `$.state.get` and `$.state.set` (through `read` and `update`), for its own four values;
- `$.session.usage()`, for the context window's percentage;
- `$.session.messages()`, for the row just before a review's card;
- `$.command.register`, for `/fx`;
- `$.clock.now` and `$.clock.after`, for timers;
- `$.ui.resolve`, for the elements it draws.

It uses no network, process or file access.

## Testing strategy — the layers, and what each cannot see

The repository's six layers (root `docs/spec/SPEC.md` §7) apply. For this mod:
- **`claude plugin test`** runs the 50 tests in `tests/cartoon-fx.test.tsx`.
  - A stand-in engine answers Bash calls, the store, the usage reading and every render. The clock
    is pinned (`mock.clock`).
  - Rows are mounted on the `desktop` surface, and the terminal tests on `terminal`.
  - Eight tests cover the detection rules as plain functions, and one hook test the rejected
    push behind `; echo done`. Their output is fictional, shaped on what each tool prints: git's
    and node's as measured on this machine (node 26.7.0), the other new runners' from their
    documented output, since none is installed here.
  - Seven read `drawFx`'s output back as structure, for every kind with the longest words the
    mod gives it and the extremes of its value. A small parser in the test file finds the named
    pieces and composes their transforms, taking an animated translate at its last value and
    an animated scale at its peak. They check:
    - each drawing stays under the `<Svg>` cap of 131,072 characters;
    - every label's peak box, the lens along its path, and every helper where it lands lie
      inside the view;
    - the marks never touch;
    - the bands' edges equal the zones;
    - no puff circle fades on its own;
    - the helpers are drawn after the smoke and fade no sooner than the label.
- **What the kit cannot see:**
  - what an `<Svg>` actually paints, or whether the app runs its SMIL: the structural tests
    check the geometry the code writes, with text widths estimated, and the frames are checked
    by eye;
  - how the desktop folds calls into groups and scrolls rows in a live session;
  - the real order and timing of tool results, turns and compactions;
  - real git and test-runner output beyond the fixtures;
  - a desktop engine newer than the CLI.
- **By hand.** `/fx all` played every effect in the desktop app (under its row) and in the terminal
  (glyphs in the strip), on the installed release (CLI 2.1.310, desktop 2.1.308). On the installed
  0.10.2, in a desktop session started after the update, a `/code-review` with five findings
  played "Reviewed!" beside its findings card, and its re-report with the fixes played "Bugs
  squashed!" there too, under `placement: conversation`. At 0.11.0, the owner checked every
  drawing's frames by eye before the commit, paused at set times on dark and light in a
  browser, and the strip of a `--plugin-dir` terminal session played all ten (CLI 2.1.325). On
  the installed 0.11.0, `/fx all` in a desktop session (engine 2.1.325) played all ten in its
  row.
  What nobody has checked by hand is in `docs/BACKLOG.md`.

## Packaging

- **The release.** The owner installs the release from this repository's marketplace as
  `cartoon-fx@claude-code-mods`, at user scope. The installed copy is the mod's tracked files at
  the pushed commit, every one of them (19 at 0.11.1), byte for byte. That includes `CLAUDE.md`,
  `docs/` and the tests. It lives in
  `~/.claude/plugins/cache/claude-code-mods/cartoon-fx/<version>/`, and changes only when
  `claude plugin update cartoon-fx` finds a new version.
- **An unpushed build.** A `claude --plugin-dir mods/cartoon-fx` session replaces the installed
  copy for that session (the engine logs `Plugin "cartoon-fx" from --plugin-dir overrides
  installed version`; measured interactive and headless, CLI 2.1.310). It runs as
  `cartoon-fx@inline`, against its own store, so trying a build never touches the release's
  stored values.
- **Updating.** `claude plugin update cartoon-fx` refreshes the marketplace clone, then installs
  the pushed `plugin.json` version only if it differs from the installed one. A push that keeps
  the version, docs alone or a fix without a bump, never reaches the installed copy; it reports
  "already at the latest version". So every change meant for the owner cuts a version. The bare
  name resolves to `cartoon-fx@claude-code-mods`. A new session loads the update.
  - Measured from 0.10.1 to 0.10.2 (CLI 2.1.310). It reported `updated from 0.10.1 to 0.10.2 for
    scope user. Restart to apply changes.` It added a `0.10.2/` folder beside `0.10.1/`, byte for
    byte the pushed commit. `installed_plugins.json` then named that folder and the commit's sha,
    and the stored `placement` and `fxTakes` were unchanged.

## Deliberate decisions

- **The drawing is built once per effect.** Rows and the strip draw again on every scroll, and the
  confetti alone is some 50,000 characters. `svgOf` keeps the last drawing, keyed by seed.
- **Placement is read from the store on every play.** `/fx place` in one session applies in every
  other open session from its next effect.
- **`/fx` takes are numbered across sessions** (`fxTakes`), so the rows of a resumed transcript
  never share a tag.
- **Thresholds with hysteresis.** Yellow at 75% (reset below 70%) and red at 90% (reset below
  85%), so a window hovering at a line plays once. Going straight past the yellow into the red
  plays the red alone. `hooks/zones.ts` is their one home, so the gauge's bands cannot drift
  from them.
- **A label's width is estimated, and generous.** With no text metrics, the estimate leans wide
  (6–13% over each word measured), so a long word shrinks a little sooner than it must rather
  than ever clip. A font other than those measured (another system's fallback) is not
  covered.
- **Smoke shrinks rather than fades.** A puff drawn as overlapping layers cannot fade cleanly
  circle by circle, and shrinking keeps it opaque, and cartoonish, to the end.
- **Subagents started within 400 ms play as one effect,** with their count, under the first one's
  Agent row.
- **A `/code-review` report plays twice at most:** `review` with its findings, then `fixes` with
  the count fixed once fixes are applied. A report with outcomes but none fixed plays nothing.
- **The context check runs on every finished call and every finished turn,** beside the result,
  so a tool-heavy turn crosses the line on the call that crossed it.
- **A precompute and a subagent's compaction play nothing.** Only the main conversation's own
  compaction squishes.
- **A review plays beside its card, not under it.** No hook can draw under the desktop's
  findings card, and the owner wants reviews in the conversation, not the strip. Nothing ties the
  call to the message id of the reply before it, so `rowBefore` matches that reply by its text.
- **A review's effect is awaited before the report's result returns.** Run beside the result, it
  raced the test kit, which does not wait for it, and the read it costs comes once per review.

- **The engine's `gitOperation` decides a commit, and a push where git printed no report of its
  own; printed output is the fallback.** The engine reads git's output with the same rules on
  every surface, and a test can hand the hooks a report. Git's own `To` block outranks the
  engine's push, because the engine also reads a fetch's ref line as one. The fallback keeps what
  the engine leaves out: a tag push, `git --no-pager`, and an engine that gives no report.
- **A tag push plays "Pushed!" with the tag's name.** The owner's call at D1's start: the engine
  reports no push for a `[new tag]` ref, so it plays from git's printed line.

## Known debt, deliberately deferred

In `docs/BACKLOG.md` under *Deferred*:
- detection by reading printed output, which a change to git's or a runner's wording would break:
  every test run, and a push or commit the engine does not report;
- a cast where the declarations don't name the shape: `awaitingLeaderApproval`.

## Baseline (v0.11.1)

| Check | Expected |
|---|---|
| `npm run verify -- cartoon-fx` | green: the 6 repo stages, then `validate`, `types`, `tests` and `imports` for cartoon-fx |
| `claude plugin test mods/cartoon-fx` | 50 pass, in one file |
| `validate`: hooks / gating / state keys | 13 / 5 (each with a `.catch`) / 4 |
| `validate` warnings | none but the allowed "CLAUDE.md at the plugin root is not loaded as project context" |
| `tsc` and the import scan | clean |

Measured on CLI 2.1.325. A documentation or refactoring change should not move any of these; if
one moves, that is the finding.

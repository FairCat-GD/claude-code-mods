# cartoon-fx — architecture, as built

This is cartoon-fx as it stands at 0.10.1, written from its code. Every session that changes the
mod keeps it true.

## Overview

cartoon-fx is one hooks module (`hooks/register.tsx`), with two helpers beside it:
- `hooks/detect.ts` reads what a finished Bash call did: a push, a commit, a passing test run;
- `hooks/fx.ts` draws each effect as an animated SVG string.

It does two things:
- **It watches the session.** Tool calls, compactions, subagent starts and finished turns. When
  something worth marking happens, it **plays** an effect: one `Shown` value in `$.state`, held
  for the effect's length plus a short hold.
- **It draws the effect on show.** Its `ui.render` hooks draw it into one of two places:
  - the conversation row that set it off (desktop only);
  - the strip above the prompt (`AbovePrompt`). The terminal always uses the strip, as a row of
    coloured glyphs.

One effect is on show at a time. A new one replaces any still playing.

| File | Lines | Holds |
|---|---|---|
| `hooks/register.tsx` | 438 | the hooks, playing and placement |
| `hooks/detect.ts` | 84 | the Bash readers, `isReviewFix`, `tokens` |
| `hooks/fx.ts` | 801 | the ten drawings and their SMIL helpers |
| `types/index.d.ts` | 25 | `FxKind`, `Placement`, `Shown`, and the `$.state` contract |
| `tests/cartoon-fx.test.tsx` | 527 | 28 tests |

## The invariants

1. **An effect's fault never costs a call its result.** Every gating hook awaits `next(e)` first,
   then plays. Its `.catch(($, e, next) => next(e))` lets the call go on unchanged if the mod
   throws. The context check runs beside the result (`void watchContext(…).catch(…)`), so no call
   waits on it. *Enforced by* `claude plugin validate`, which lists 5 gating hooks, each with a
   `.catch`.
2. **The mod only reacts.** It never denies, rewrites or delays a call, a compaction or a spawn.
   It returns what `next` returned. *Enforced by* the code and by the tests, which check that the
   row still draws the engine's own content, with the effect beneath it.
3. **The same seed always draws the same picture.** `random(seed)` is a seeded PRNG, so a redraw
   doesn't reshuffle the confetti. *Enforced by* the terminal test, which checks the glyphs are
   identical 900 ms later.
4. **A failure plays nothing.** A denied or errored call, a dry run, a push with nothing to push,
   a test run that reports any failure, and a plan turned down all play nothing. *Enforced by*
   tests for the failed push, the plan turned down, the failing run, and none fixed.
5. **The drawings carry no script.** Each effect is SVG animated with SMIL alone, so it draws
   wherever the app shows an `<Svg>`.

## The hooks

`validate` lists 12 hooks, 5 of them gating, and 4 state keys.

| Hook | Gating | Reacts to | Plays |
|---|---|---|---|
| `session.start` | | a new or reloaded session | Clears `shown` (a reload drops the timers that would end it), takes up the stored placement, and registers `/fx` (`immediate`). |
| `tool.call` `{ tool: 'Bash' }` | ✓ | a finished Bash call | `push`, else a review-fix commit as `fixes`, else `commit`, else `tests`. |
| `tool.call` `{ tool: 'ExitPlanMode' }` | ✓ | a plan the person accepted | `plan`, unless a teammate's plan still waits on its lead (`awaitingLeaderApproval`). |
| `tool.call` (every tool) | ✓ | `ReportFindings`, and every finished call | `review` or `fixes` from a code review's report; then the context check. |
| `turn.complete` | | a finished turn | The context check. |
| `session.compact` | ✓ | a compaction, not a precompute or a subagent's | `compact`, with tokens before and after. |
| `agent.spawn` | ✓ | a subagent started | `helpers`, gathering spawns within 400 ms into one, with their count. |
| `command.run` `{ command: 'fx' }` | | `/fx` | Replays effects, or stores a placement. |
| `ui.render` `ToolUse` | | a tool call's own row (desktop) | Draws the effect under the row that set it off. |
| `ui.render` `ToolGroup` | | a folded group of calls (desktop) | Draws the effect under the group holding its call. An unfolded group's rows are `ToolUse`. |
| `ui.render` `CommandOutput` `{ command: 'fx' }` | | `/fx`'s output row (desktop) | Draws the effect under the row whose `(take N)` tag it carries. |
| `ui.render` `AbovePrompt` | | the strip above the prompt | Draws effects with no row, effects under `/fx place bottom`, and fallbacks from rows; on the terminal, every effect as glyphs. Stays out of the way of a survey (`hasSurvey`). |

## Detection (`hooks/detect.ts`)

- **The git part of a command.** `gitPart` splits a compound command on `&&`, `||`, `;`, `|` and
  newlines, and takes the part that runs `git … push` or `git … commit`. A flag elsewhere in the
  line (the `-n` of `git commit -n`) is not read as the push's own.
- **A push** needs that part, no `--dry-run` or `-n`, and no "Everything up-to-date". Its branch
  comes from the call's `gitOperation.push.branch` when the engine gives one. Otherwise it comes
  from the first `-> branch` after the push's `To <remote>` line, so a fetch or pull earlier in the
  command doesn't count.
- **A commit** needs that part and no `--dry-run`. Its short hash comes from `gitOperation.commit`,
  or from git's `[branch (root-commit)? sha] subject` line. It is an amend when the engine says
  `amended`, or when the command has `--amend`.
- **A review-fix commit** is one whose subject starts `review`, or starts `fix` and names a review.
  It plays `fixes` in place of the stamp.
- **A passing test run** is one of a list of runners (`npm|pnpm|yarn|bun (run) test|verify`,
  `vitest`, `jest`, `playwright`, `pytest`, `go test`, `cargo test|nextest|xtask verify`,
  `swift test`, `deno test`, `make test|check|verify`, `claude plugin test`).
  - It must print no failure count (`N failed`, `failing`, `errors`), no `FAIL`/`FAILED` mark,
    no `(fail)` line and no `test result: FAILED`. A piped run exits with the pipe's last command,
    so the printed output has the last word.
  - The count shown is the largest `N passed|passing|pass`.
- **Calls in the background** (`backgroundTaskId`) count as none of these.
- **One command may do several.** The push wins, then the commit, then the tests.

## The drawings (`hooks/fx.ts`)

- **The box and the view.** Every effect fits one 440 × 190 box. The SVG shows its middle 260
  units (`viewBox="90 0 260 190"`), drawn ×3.2 (832 × 608); a narrower surface shrinks it. Pieces
  that fly past the sides leave the frame.
- **The animation** is SMIL (`animate`, `animateTransform`, `animateMotion`), with no script.
  Shared pieces: the tilted label, smoke clouds, motion rays, sparkles and squash streaks.
- **The ten effects and their lengths** (`FX_MS`):

  | Kind | Drawing | ms |
  |---|---|---|
  | `plan` | a clapperboard snaps shut | 2600 |
  | `commit` | a rubber stamp leaves SAVED or AMENDED and the hash | 2300 |
  | `push` | confetti, 46 pieces, with the branch | 2600 |
  | `tests` | a checkmark badge with the count | 2400 |
  | `review` | a magnifying glass sweeps a page; a red "!" per finding (up to 4), or a green check | 2800 |
  | `fixes` | a bug walks in and is swatted | 2700 |
  | `compact` | a press squishes pages into a cube | 2600 |
  | `helpers` | up to five pixel ninjas dash out of a smoke bomb | 2600 |
  | `context` | a gauge swings into the yellow | 3100 |
  | `redzone` | a gauge slams into the red, rattles and steams | 3300 |

- **`value`** is the helper count, the context percentage, or the number of findings.

## Playing and placement

- **`play`** takes up the stored placement, then sets `shown`. That is `{ kind, seed, title,
  subtitle, value, until, row? }`, with `seed` the clock's now.
  - It schedules the end: `FX_MS[kind] + HOLD_MS` (600 ms). The hold lets a surface that mounts
    late still show the whole drawing.
  - The end clears `shown` only while it still holds this seed.
- **Rows.** An effect belongs to the row of what set it off: `tool:<tool_use_id>` for a call, or
  `fx:(take N)` for `/fx`'s output row.
  - A subagent's calls have no row in the main transcript, so they play in the strip at once.
  - A compaction has no row either.
- **Where it draws.** With `placement` `conversation` (the default), the desktop draws it under its
  row (`ToolUse`), or under the folded `ToolGroup` that holds the call. With `bottom`, or with no
  row, it draws in the strip.
- **The fallback.** 900 ms after playing, an effect whose row has not drawn it is played again in
  the strip, as a fresh effect with no row. A row drawn with `onScreen: null`, scrolled out of
  view, counts as not drawn. Examples: a card the app draws its own way, a group folded away, a row
  scrolled off. The strip marks a row's effect as drawn when it shows it, so the terminal never
  replays.
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
| `isYellow` | `boolean` | the context window is in its yellow zone (set at 75%, cleared below 70%) |
| `isRed` | `boolean` | in its red zone (set at 90%, cleared below 85%) |
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
- `$.command.register`, for `/fx`;
- `$.clock.now` and `$.clock.after`, for timers;
- `$.ui.resolve`, for the elements it draws.

It uses no network, process or file access.

## Testing strategy — the layers, and what each cannot see

The repository's six layers (root `docs/spec/SPEC.md` §7) apply. For this mod:
- **`claude plugin test`** runs the 28 tests in `tests/cartoon-fx.test.tsx`.
  - A stand-in engine answers Bash calls, the store, the usage reading and every render. The clock
    is pinned (`mock.clock`).
  - Rows are mounted on the `desktop` surface, and the terminal tests on `terminal`.
  - One test covers the detection rules as plain functions.
- **What the kit cannot see:**
  - what an `<Svg>` actually paints, or whether the app runs its SMIL;
  - how the desktop folds calls into groups and scrolls rows in a live session;
  - the real order and timing of tool results, turns and compactions;
  - real git and test-runner output beyond the fixtures;
  - a desktop engine newer than the CLI.
- **By hand.** `/fx all` played every effect in the desktop app (under its row) and in the terminal
  (glyphs in the strip), on the installed release (CLI 2.1.310, desktop 2.1.308). What nobody has
  checked by hand is in `docs/BACKLOG.md`.

## Packaging

- **The release.** The owner installs the release from this repository's marketplace as
  `cartoon-fx@claude-code-mods`, at user scope. The installed copy is the mod's tracked files at
  the pushed commit, all 14 of them, byte for byte. That includes `CLAUDE.md`, `docs/` and the
  tests. It lives in `~/.claude/plugins/cache/claude-code-mods/cartoon-fx/<version>/`, and changes
  only on `claude plugin update cartoon-fx`.
- **An unpushed build.** A `claude --plugin-dir mods/cartoon-fx` session replaces the installed
  copy for that session (the engine logs `Plugin "cartoon-fx" from --plugin-dir overrides
  installed version`; measured interactive and headless, CLI 2.1.310). It runs as
  `cartoon-fx@inline`, against its own store, so trying a build never touches the release's
  stored values.
- **Updating.** `claude plugin update cartoon-fx` picks up pushed work; the bare name resolves to
  `cartoon-fx@claude-code-mods` (`claude plugin details cartoon-fx`). A new session loads it.

## Deliberate decisions

- **The drawing is built once per effect.** Rows and the strip draw again on every scroll, and the
  confetti alone is some 50,000 characters. `svgOf` keeps the last drawing, keyed by seed.
- **Placement is read from the store on every play.** `/fx place` in one session applies in every
  other open session from its next effect.
- **`/fx` takes are numbered across sessions** (`fxTakes`), so the rows of a resumed transcript
  never share a tag.
- **Thresholds with hysteresis.** Yellow at 75% (reset below 70%) and red at 90% (reset below
  85%), so a window hovering at a line plays once. Going straight past the yellow into the red
  plays the red alone.
- **Subagents started within 400 ms play as one effect,** with their count, under the first one's
  Agent row.
- **A `/code-review` report plays twice at most:** `review` with its findings, then `fixes` with
  the count fixed once fixes are applied. A report with outcomes but none fixed plays nothing.
- **The context check runs on every finished call and every finished turn,** beside the result,
  so a tool-heavy turn crosses the line on the call that crossed it.
- **A precompute and a subagent's compaction play nothing.** Only the main conversation's own
  compaction squishes.
- **The four copied source files keep their own layout.** The folder's `biome.json` turns Biome's
  formatter off for them, and `noUnusedFunctionParameters` off for `register.tsx` (mod
  `CLAUDE.md`).

## Known debt, deliberately deferred

In `docs/BACKLOG.md` under *Deferred*:
- the Biome reformat of the four copied files, and deleting the folder's `biome.json`;
- detection by reading printed output, which a change to git's or a runner's wording would break,
  where the engine gives no `gitOperation`;
- `drawnRows` is emptied wholesale once it passes 200 rows. A row's effect that is still playing
  at that moment may replay in the strip;
- casts where the declarations don't name the shape: the `ReportFindings` tool and its findings,
  and `awaitingLeaderApproval`.

## Baseline (v0.10.1)

| Check | Expected |
|---|---|
| `npm run verify -- cartoon-fx` | green: the 6 repo stages, then `validate`, `types`, `tests` and `imports` for cartoon-fx |
| `claude plugin test mods/cartoon-fx` | 28 pass, in one file |
| `validate`: hooks / gating / state keys | 12 / 5 (each with a `.catch`) / 4 |
| `validate` warnings | none but the allowed "CLAUDE.md at the plugin root is not loaded as project context" |
| `tsc` and the import scan | clean |

Measured on CLI 2.1.310. A documentation or refactoring change should not move any of these; if
one moves, that is the finding.

# Backlog

Work that has been named but belongs to no session. Each item needs its own intake before it runs
(a `docs/spec/FEATURE-*.md` with the request verbatim and the decisions resolved, then a block
in `docs/spec/SESSIONS.md`; see the root `docs/DEVELOPMENT-WORKFLOW.md`). When an item is picked
up, it moves out of this file.

## Deferred

- **Reformat the code with Biome, and delete this folder's `biome.json`.** Left out at the
  import, which copied the code byte for byte. At width 160, Biome changes 139 lines in
  `detect.ts`, `fx.ts`, `register.tsx` and the test file, the four files whose formatting the
  folder's `biome.json` turns off. Lint wants the five
  `.catch(($, e, next) => next(e))` handlers to name their unused `$` as `_$`. Nobody using the
  mod sees either change, so it cuts no version.
- **Detection reads printed output.** Where the engine gives no `gitOperation`, `detect.ts` finds
  a push's branch and a commit's hash in git's printed lines. It judges a test run by its runner's
  wording. A change to either wording breaks it quietly: nothing plays. Read from the as-built
  code, in repo Session 3.
- **`drawnRows` is emptied wholesale past 200 rows.** An effect still playing at that moment loses
  its "drawn" mark, and may replay in the strip. Read from the as-built code, in repo Session 3.
- **Casts where the declarations name no shape:**
  - `(e.tool as string) === 'ReportFindings'` and its `findings`;
  - `awaitingLeaderApproval` on `ExitPlanMode`'s result.

  A declarations change would not show in `tsc`. Read from the as-built code, in repo Session 3.

## Not yet checked by hand

Checks that need a person at the machine. Each has an automated check covering most of it;
these are the parts only a person can see. `/fx all` was checked by hand on the installed release
at 0.10.1, in the desktop app and in a terminal.

- **Real triggers on the installed release** (0.10.1): a commit, a push, a passing
  `npm run verify`, an accepted plan, a `/code-review` and its fixes, each in a live desktop
  session. The tests cover each against fixture output.
- **The folded group** (0.10.1): a push inside a run of calls the desktop folds into one row plays
  under the group. Covered by the `ToolGroup` test.
- **The move to the strip** (0.10.1): an effect whose row is scrolled out of view plays in the
  strip after about a second. Covered by the fallback tests.
- **The zones in a live session** (0.10.1): the yellow at 75% and the red at 90%, each once. Covered
  by the two gauge tests.
- **A compaction and live subagents** (0.10.1): the squish in the strip, and several subagents as
  one "×N helpers!". Covered by their tests.
- **`/fx place bottom` across sessions** (0.10.1): set in one session, it applies in another open
  one from its next effect. Covered by the two placement tests.
- **The update path** (0.10.1): after the next push, `claude plugin update cartoon-fx` brings the
  installed copy to the pushed commit, and a new session runs it. The bare name resolves to the
  install (`claude plugin details cartoon-fx`); the update itself has not run.

## Directions

## Decided against

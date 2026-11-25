Read what Session 12a's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 12a's block and Session 12's done-note, then this
file, and do Session 12a: waiting, not finished. 12a covers:
- a subagent's turn that ends while the engine lists it `waiting` (its own background shell, a
  helper it waits on) leaves its row in Running as `waiting`, in quiet's pose, instead of
  finished;
- the engine's list read unawaited at that turn's end and on the clock's beat while a run
  waits; the kept ending applied when the list says it ended, or no longer lists it;
- the ending's toast at the real end, and no Helper at the turn's end.

Release 0.14.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–12, 7a and 9a are done; 12a, 12b, 12c, 12d and
  13 remain. **12a to 12d were inserted at Session 13's plan** (2026-11-25, with the owner): the
  owner had that plan reviewed adversarially and accepted all eight of the review's ideas, so
  1.0.0 waits for them (the header of `SESSIONS.md`, and `SPEC.md` decision 1's amendment).
  Session 13's block carries amendments from that review for when it runs.
- **Push status:** `origin/main` holds everything through Session 12's review commit (`bafcd85`),
  0.13.0 among it. Waiting locally: `docs(possum-squad): insert sessions 12a to 12d before 1.0.0`
  and its review commit, if any. List `origin/main..HEAD` before any push, and name any commit
  that is not the session's.
- **The owner looked at the installed 0.13.0 in the desktop app** at Session 13's plan (dark
  theme, engine 2.1.330), with four subagents and a helper of one of them: sprites in their outfits,
  finished ones dozing with their "z", the crown, the role buttons, the session line with the
  limits, and a helper indented under its parent in Finished, all as expected. **A defect:** a
  long activity pushes each row's `peek` button out of the pane, so Peek cannot be opened from
  most subagent rows there. It is in 12b's scope. The rest is still unseen (`docs/BACKLOG.md`).
- **What 12a builds on:**
  - `turn.complete` (`hooks/register.tsx:613-627`) ends a run in one `recordAt`: `turnEnded`
    (`hooks/model/runs.ts:353-360`) by `endingOf` (`runs.ts:65-71`), then `fellBack`
    (`runs.ts:364-376`), and `endedToast` (`hooks/view/toasts.ts:25-37`) against the state
    before. `hasBackgroundWork` (set from a step's `hasBackground`, cleared by `turnStarted`)
    already keeps Helper off such a turn's end.
  - The clock: `keepsClock` (`runs.ts:63`) is a live run or one with no role; `tick`
    (`register.tsx:107-121`) stops with no pane or no such run; `keepTime` arms only while the
    pane is open and is not called at `turn.complete`.
  - Sections: `panel.tsx:53-57` (Running is `starting`, `working`, `quiet`). Quiet's pose:
    `STILL.quiet`, `BOB_PACE.quiet` and `LIVE` in `hooks/sprites/recipes.ts`.
  - `$.agent.list()` is async, takes no argument and answers `AgentInfo[]`; read `status`, not
    `taskStatus`, which says `completed` for any subagent whose turn ended. It is on the
    allow-list and not yet called. `'agent.list'` is a hookable event, so a test can answer it.
- **Decided parts of `ARCHITECTURE.md` changed at Session 13's plan,** each with a Decision log
  line and a *Not yet built* line naming its session: *The hooks* (the list read; the main
  loop's `turn.start`, 12c), *Values* (`prefs.toasts`, `detect`), *The run model* (`waiting`),
  *Roles* (`detect`), *Sprites and sets* (`waiting`'s pose), *The panel* (the activity, `peek`,
  the clock during a main turn), *Attention* (the toasts' setting and reason, the tab title).
- **Picked up from `docs/BACKLOG.md`** and moved out of it: background work reading finished
  (12a), a path's end (12b), forgetting a remembered role (12d).
- **Drift the review spotted, for Session 13's cold read:** *Known debt* says 86% of the
  characters where *The panel* and Session 12 say 87%; one line gives 225,793 characters where
  another gives 227,422; *Known debt* still calls the sprites unseen in the desktop app; the
  baseline says about 14 s where Session 12's numbers say about 15 s.
- **The engines:** CLI 2.1.330; the desktop app ran engine 2.1.330 on 2026-11-25.
- **Baseline** (ARCHITECTURE's table, v0.13.0, CLI 2.1.330): 285 tests in 24 files; the tools'
  specs 10 in 2; `validate` 11 hooks, 4 gating each with a `.catch`, 3 state keys, and the
  calls line of the table. 12a adds `$.agent.list` to that line.

## Watch for

- **Drive hand checks yourself:** `screen -U -dmS <name> env -u CLAUDE_CODE_PLUGIN_DIRS claude
  --plugin-dir mods/possum-squad`, attached in a Terminal-panel tab with `screen -U -r <name>`
  (mods/possum-squad/CLAUDE.md, *Watch for*).
  - Type with `-X stuff $'…\r'`; a prompt needs a second `\r`, and `$'\025'` clears a
    suggested prompt first.
  - The docked pane is as tall as the tab: past a few rows the rest are cut off. `/clear`
    starts the list over when a check needs its rows in view.
  - A subagent may not `sleep` in the foreground; `ping -c <seconds> 127.0.0.1` stays there, and
    a subagent asked to start it in the background is the case 12a needs.
- **The `@inline` copy keeps its own store,** and its `theme` is `horror`, `cost` `off`: ask
  before a check changes any of it, and put back what it changes, `collapsed` included.
- **The sprite frame check is the slow test** (about 7 s, given `timeoutMs: 30_000`).
- **A check that builds its expectation from the module it checks cannot fail:** state each
  expectation in the test, and falsify each new check.
- **The engine's `status` is now, not at the turn's end:** a late read may already see the
  agent's next turn (`running`), which is not an end either.

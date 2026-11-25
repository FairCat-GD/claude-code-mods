Read what Session 12c's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 12c's block and Session 12b's done-note, then this
file, and do Session 12c: the Lead's time during a main turn. 12c covers:
- the main loop's `turn.start` keeps the turn's start, read from the clock, and its `turn.step`
  still makes no `$` call;
- the clock beats during a main turn while the pane is open, so the session line's time moves;
- at the turn's end the counted time replaces the running one;
- where the start lives (`lead`, as `lead-3`, or module memory, as proposed), asked at the
  start.

Release 0.16.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–12, 7a, 9a, 12a and 12b are done; 12c, 12d and 13
  remain, then 1.0.0 (the header of `SESSIONS.md`, and `SPEC.md` decision 1's amendment).
  Session 13's block carries amendments from the review of its plan for when it runs.
- **Push status:** `origin/main` holds everything through Session 12a's review commit. Session
  12b's commit waits locally, with its review commit once the owner's review has run. List
  `origin/main..HEAD` before any push, and name any commit that is not the session's.
- **What 12c builds on, from 12b:**
  - The beat (`tick`, `hooks/register.tsx`) now reads `view` before its settles, and reads the
    engine's list once a beat at most. It reads while a turn's end is kept; otherwise while the
    pane is shown, the gallery closed and a run live, for the summaries.
  - 12c's beat during a main turn with no run live must not start a list read: the condition
    names `isLive` runs.
  - `keepsClock` and `armIfLive` still name runs alone; 12c widens them for the main turn.
  - `runs` is `runs-9`; `lead` is `lead-2`, and a field 12c adds to `Lead` makes it `lead-3`,
    which the mod's `CLAUDE.md` names.
- **12b's open look:** `peek` in reach in the desktop app rests on `minWidth` 0 on the row's
  shrinking Boxes, which the kit cannot judge. Only the owner's look after a push confirms it
  (`docs/BACKLOG.md`, *Peek and the collapsed view*; and *The activity line*).
- **Drift the review of Session 13's plan spotted, for Session 13's cold read:** *Known debt*
  says 86% of the characters where *The panel* and Session 12 say 87% (12b moved the worst list
  to 89%, which *Known debt*'s line does not say either); *Known debt* still calls the sprites
  unseen in the desktop app.
- **The engines:** CLI 2.1.330; the desktop app ran engine 2.1.330 on 2026-11-23, the last
  reading.
- **Baseline** (ARCHITECTURE's table, v0.15.0, CLI 2.1.330): 313 tests in 26 files, about 18 s;
  the tools' specs 10 in 2; `validate` 11 hooks, 4 gating each with a `.catch`, 3 state keys,
  the calls line unchanged.

## Watch for

- **Drive hand checks yourself:** `screen -U -dmS <name> env -u CLAUDE_CODE_PLUGIN_DIRS claude
  --permission-mode auto --plugin-dir mods/possum-squad`, attached in a Terminal-panel tab with
  `screen -U -r <name>` (mods/possum-squad/CLAUDE.md, *Watch for*).
  - Type with `-X stuff $'…'`, then a separate `-X stuff $'\r'` a second later; `$'\025'`
    clears a suggested prompt first. A prompt typed while Claude works waits in the box.
  - The `@inline` copy's pane did not open by itself at 12b: type `/possums`.
  - To wait, run a foreground `ping -c <seconds> 127.0.0.1` in the shell, or wait on a process
    (`until ! pgrep -f "<command>"`); the harness blocks `sleep`.
- **A probe plugin** for an engine question can live in the scratchpad (manifest and
  `hooks/hooks.json` naming a `register.ts`), loaded alone by `--plugin-dir`, answering a
  command with what it logged; 12a and 12b measured `$.agent.list()` that way. Never in the
  repository.
- **The engine validates every element's props:** a falsification that puts an unknown prop on
  an element makes the drawing refuse, not the check fail. A `key` before a spread is legal.
- **A falsification run under load can time out the sprites' size test** (N-02, about 3 s
  alone): read which test failed, not only that one did.
- **`biome check --write` sorts imports in files you did not touch:** use `biome format --write`
  and `biome lint`, as the root CLAUDE.md says.
- **The `@inline` copy keeps its own store,** and its `theme` is `horror`, `cost` `off`: ask
  before a check changes any of it, and put back what it changes, `collapsed` included.
- **A check that builds its expectation from the module it checks cannot fail:** state each
  expectation in the test, and falsify each new check.

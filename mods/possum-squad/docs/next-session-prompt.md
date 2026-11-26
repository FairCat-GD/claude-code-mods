Read what Session 12d's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 12d's block and Session 12c's done-note, then this
file, and do Session 12d: toasts, the tab title and `detect`. 12d covers:
- the failed toast names its reason (an error, a refusal or an empty answer), which the run
  keeps, so `runs` changes its tag;
- a `toasts` setting: `all` (the default), `needs` or `off`;
- the pane's tab title counting the agents that need the person;
- `detect` as the role picker's first entry, deleting a custom type's `role:<agent type>`;
- asked at the start: the retitle's race with a close, and what `detect` does to the row at
  once.

Release 0.17.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–12, 7a, 9a and 12a–12c are done; 12d and 13
  remain, then 1.0.0 (the header of `SESSIONS.md`, and `SPEC.md` decision 1's amendment).
  Session 13's block carries amendments from the review of its plan for when it runs.
- **Push status:** pushed on 2026-11-26 with the owner's approval: `origin/main` holds
  everything through `review(possum-squad): a main turn's start outliving its end, and 4
  smaller`, Session 12c's review, with 0.16.0 before it. Nothing waits locally. List `origin/main..HEAD` before any push, and name any commit that is not the
  session's.
- **What 12d builds on, from 12c:**
  - The running main turn is `mainTurn` (its id and start), module memory in
    `hooks/register.tsx`, with `endedTurnId` beside it; `keepsTime(held)` (a main turn, or a
    shown run that `keepsClock`) is the clock's one condition, in `tick`, `armIfLive` and
    `drawPane`.
  - The main loop's `turn.start` reads the clock and arms it while the pane is open; its
    `turn.complete` reads the clock when a start is kept. Its `turn.step` makes no `$` call, and
    a test checks that.
  - `runs` is `runs-9` (a field 12d adds to `Run` makes it `runs-10`); `lead` is `lead-2`;
    `view` is `view-5`. The mod's `CLAUDE.md` names each tag.
- **Open looks in the desktop app:** 12b's `peek` in reach, which rests on `minWidth` 0 that the
  kit cannot judge (`docs/BACKLOG.md`, *Peek and the collapsed view*; *The activity line*), and
  12c's moving session line (*The main session's time through a turn*). Only the owner's look
  after a push confirms them.
- **Drift the review of Session 13's plan spotted, for Session 13's cold read:** Session 12's
  done-note says 87% of the characters, where *The panel* and *Known debt* now say 89% (12b's
  longer line 3); one line gives 225,793 characters where another gives 227,422; *Known debt*
  still calls the sprites unseen in the desktop app.
- **The engines:** CLI 2.1.330; the desktop app ran engine 2.1.330 on 2026-11-23, the last
  reading.
- **Baseline** (ARCHITECTURE's table, v0.16.0, CLI 2.1.330): 328 tests in 26 files, about 18 s;
  the tools' specs 10 in 2; `validate` 11 hooks, 4 gating each with a `.catch`, 3 state keys,
  the calls line unchanged. 12d's `$.store.delete` will add to the calls line: record it.

## Watch for

- **Drive hand checks yourself:** `screen -U -dmS <name> zsh -lc "exec env -u
  CLAUDE_CODE_PLUGIN_DIRS claude --permission-mode auto --plugin-dir mods/possum-squad"` from the
  repository's root, and read it detached with `screen -S <name> -p 0 -X hardcopy -h <file>`
  and `grep -a`, with no `width` command (mods/possum-squad/CLAUDE.md, *Watch for*). The pane
  then draws inline, above the prompt.
  - Type with `-X stuff $'…'`, then a separate `-X stuff $'\r'` a second later; `$'\025'`
    clears a suggested prompt first. A prompt typed while Claude works waits in the box.
  - The `@inline` copy's pane does not open by itself: type `/possums`.
  - To wait, run a foreground `ping -c <seconds> 127.0.0.1` in the shell, or wait on a process
    (`until ! pgrep -f "<command>"`); the harness blocks `sleep`.
- **A probe plugin** for an engine question can live in the scratchpad (manifest and
  `hooks/hooks.json` naming a `register.ts`), loaded alone by `--plugin-dir`, answering a
  command with what it logged; 12a, 12b and 12c measured that way. Never in the repository.
- **The tab title needs a second pane:** a title shows only while more than one pane is open,
  so a hand check needs another plugin's pane beside this one.
- **The engine validates every element's props:** a falsification that puts an unknown prop on
  an element makes the drawing refuse, not the check fail. A `key` before a spread is legal.
- **A falsification run under load can time out the sprites' size test** (N-02, about 3 s
  alone): read which test failed, not only that one did.
- **`biome check --write` sorts imports in files you did not touch:** use `biome format --write`
  and `biome lint`, as the root CLAUDE.md says.
- **The `@inline` copy keeps its own store,** and its `theme` is `horror`, `cost` `off`: ask
  before a check changes any of it, and put back what it changes, `collapsed` included. A
  `toasts` change in a hand check is such a change.
- **A check that builds its expectation from the module it checks cannot fail:** state each
  expectation in the test, and falsify each new check.

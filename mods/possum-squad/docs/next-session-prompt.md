Read what Session 12b's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 12b's block and Session 12a's done-note, then this
file, and do Session 12b: the activity line. 12b covers:
- a path-like call target keeps its end (its file name), on the activity line and in Peek's last
  actions; a command keeps its start;
- the `peek` button keeps its room at any activity's length (the owner's desktop look found it
  pushed out of the pane);
- an ended row's last call read in the past tense (proposed, to confirm at the start);
- the engine's progress summary (`AgentInfo.label`) on the activity line, read by the beat
  (measure first how often 2.1.330 fills it).

Release 0.15.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–12, 7a, 9a and 12a are done; 12b, 12c, 12d and 13
  remain, then 1.0.0 (the header of `SESSIONS.md`, and `SPEC.md` decision 1's amendment).
  Session 13's block carries amendments from the review of its plan for when it runs.
- **Push status:** pushed on 2026-11-25 with the owner's approval: `origin/main` holds
  everything through `review(possum-squad): an undrawn pane kept no clock, and 5 smaller`,
  Session 12a's review, with 0.14.0 before it. Nothing waits locally. List `origin/main..HEAD`
  before any push, and name any commit that is not the session's.
- **What 12b builds on, from 12a:**
  - `readList` in `hooks/register.tsx` is the one caller of `$.agent.list()`, started unawaited
    after a record that keeps a turn's end, and by the beat (`tick` → `settleHeld`) only while
    `hasKept(runs)`. 12b's summary widens the beat's read to any live run shown: keep one read
    a beat, and keep `waiting`'s handling (`listed`) as it is. `AgentInfo.label` is there in the
    same answer; the probe saw `status` and `taskStatus` only, so `label`'s filling is
    unmeasured.
  - `runs` is `runs-8`; a field 12b adds to `Run` or `Activity` makes it `runs-9`, and the mod's
    `CLAUDE.md` names the tag.
  - The activity: `targetOf` (`hooks/model/tools.ts`) cuts at `TARGET_CHARS` (80) from the
    start; `pathEnd` (`hooks/model/runs.ts`) keeps a path's end for Peek's files;
    `activityText` (`hooks/view/runs.ts`) reads `STRINGS.activity`'s live verbs;
    `activityLine` (`hooks/view/row.tsx`) draws the `Text wrap="end"` in a growing, shrinking
    `Box`, then the `peek` `Button`.
  - A waiting row (12a) shows its last call too, as a live row: whether 12b's past tense applies
    to it is the start's question (it is not ended).
- **The engine ran every Agent call in the background** at 2.1.330, even one asked for in the
  foreground (12a's review): a foreground subagent's list status at its end is unmeasured.
- **The tests:** a test that ends a run uses `turnEnds` (`tests/engine.ts`), which lets the
  unawaited list read land; the kit rejects an unhooked `$.agent.list()`, so a world that needs
  the list hooks `agent.list` (`tests/waiting.test.ts`). A model test ends a run with
  `listed(turnEnded(…), new Map())` (`endedNow`).
- **Drift the review of Session 13's plan spotted, for Session 13's cold read:** *Known debt*
  says 86% of the characters where *The panel* and Session 12 say 87%; one line gives 225,793
  characters where another gives 227,422; *Known debt* still calls the sprites unseen in the
  desktop app.
- **The engines:** CLI 2.1.330; the desktop app ran engine 2.1.330 on 2026-11-23, the last
  reading.
- **Baseline** (ARCHITECTURE's table, v0.14.0, CLI 2.1.330): 304 tests in 25 files, about 17 s;
  the tools' specs 10 in 2; `validate` 11 hooks, 4 gating each with a `.catch`, 3 state keys,
  and the calls line with `$.agent.list`.

## Watch for

- **Drive hand checks yourself:** `screen -U -dmS <name> env -u CLAUDE_CODE_PLUGIN_DIRS claude
  --permission-mode auto --plugin-dir mods/possum-squad`, attached in a Terminal-panel tab with
  `screen -U -r <name>` (mods/possum-squad/CLAUDE.md, *Watch for*).
  - Type with `-X stuff $'…'`, then a separate `-X stuff $'\r'` a second later; `$'\025'`
    clears a suggested prompt first. A prompt typed while Claude works waits in the box.
  - To wait for a background shell, wait on its process (`until ! pgrep -f "<command>"`), not
    on a `sleep`, which the harness blocks.
- **A probe plugin** for an engine question can live in the scratchpad (manifest and
  `hooks/hooks.json` naming a `register.ts`), loaded alone by `--plugin-dir`, answering a
  command with what it logged; 12a's measured `$.agent.list()` that way. Never in the
  repository.
- **`biome check --write` sorts imports in files you did not touch:** use `biome format --write`
  and `biome lint`, as the root CLAUDE.md says.
- **The `@inline` copy keeps its own store,** and its `theme` is `horror`, `cost` `off`: ask
  before a check changes any of it, and put back what it changes, `collapsed` included.
- **The desktop's layout is not the kit's:** the kit drew the `peek` button the desktop pushed
  out. Only the owner's look after a push confirms that fix.
- **A check that builds its expectation from the module it checks cannot fail:** state each
  expectation in the test, and falsify each new check.

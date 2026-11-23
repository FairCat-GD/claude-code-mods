Read what Session 9's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 9's block and Session 7a's done-note, then this
file, and do Session 9: role picker, states and auto-open.

Session 9 covers:
- the role picker: pressing a row's sprite offers the 17 roles, applied to that run at once and
  stored under `role:<agent type>` for a custom type only;
- states wired to runs;
- auto-open per `prefs.autoOpen`, a pane the person closed staying closed for the session.

Release 0.10.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–8 and 7a are done; Sessions 9–13 remain. 9
  releases 0.10.0.
- **Push status:** pushed on 2026-11-23 with the user's approval: `origin/main` holds everything
  through Session 7a's review commit. Nothing waits locally. List `origin/main..HEAD` before any
  push, and name any commit that is not the session's.
- **0.7.0 to 0.9.0 wait for the owner's install and desktop look** (`docs/BACKLOG.md`, *Not yet
  checked by hand*): ask at the start whether they were seen, and record it in 9's done-note.
  If the gallery's 102 moving sprites are not smooth, that choice returns to the owner.
- **What Session 7a left for Session 9:**
  - **Every state already draws its recipe** (`drawSprite`, `animationOf`): F-08's frames are
    held per state in `tests/sprites.test.ts`, and the rows draw whatever state a run is in.
    No run reaches `needs-you` or `quiet` yet (Session 10); "states wired to runs" is what is
    left of that line, and F-08's kit test can read the row's sprite against `sprite({ … })`.
  - **A row's sprite carries a moment** (`RowData.moment`, `momentOf` in `hooks/view/runs.ts`):
    its arrival, its hop into the outfit, or its ending, each while its time is fresh. An
    ending shows only while Finished is open, which is collapsed by default; the owner may want
    that changed once they see it. The
    picker's reassignment changes `Role`; I-07's reassignment should set `Role.at` to the press's
    time if it is to hop, or leave it, which plays none: a choice for the plan.
  - **`Role.at`** is the clock's time a role settled, absent when a step's clock was refused;
    `runs` is at `runs-4`. A reassignment that adds fields bumps it again.
  - **The picker presses the sprite:** an `Svg` takes no press (the block's Watch for), and a
    moving sprite is framed (`isInteractive`), which may take the press itself; measure where a
    press lands on both forms.
  - **Kit tests that draw sprites** pin the clock and move it past every moment (`SETTLED_MS`,
    5 s, in `tests/pane-sprites.test.ts`) before reading a row's settled look.
- **The engines:** CLI 2.1.330, which laid every folder's declarations. The desktop app ran
  engine 2.1.326 on 2026-11-20.
- **Decisions written down nowhere else:**
  - Whether `/possums` opening the pane again should clear `view.isClosedByPerson` is still
    undecided: today the flag stays set for the session. Session 9's auto-open needs it.
- **For the user to decide, when they choose:** a subagent waiting on its own background shell
  reads "finished" (`docs/BACKLOG.md`, *Deferred*).
- **Baseline** (ARCHITECTURE's table, v0.9.0, CLI 2.1.330):
  - 166 tests in 16 files, about 12 s, and 10 tool specs in 2 files;
  - `validate`: 11 hooks, 4 gating each with a `.catch`, 3 state keys;
  - calls: `$.clock.every`, `$.clock.now`, `$.command.register`, `$.state.get`, `$.state.set`,
    `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.invalidate`, `$.ui.open`, `$.ui.panes`,
    `$.ui.resolve`.

## Watch for

- **Drive hand checks yourself:** `screen -U -dmS <name> claude --plugin-dir mods/possum-squad`,
  attached in a Terminal-panel tab with `screen -U -r <name>` (mods/possum-squad/CLAUDE.md,
  *Watch for*). A prompt typed with `-X stuff` while the pane is open may need a second `\r`
  to submit. A pane's `Button` could not be pressed that way in Session 7.
- **The `@inline` copy keeps its own store,** and its `theme` is `horror`: a terminal check
  reads that set, not `classic`. Put back anything a check changes.
- **The sprite frame check is the slow test** (about 5 s, given `timeoutMs: 30_000`): a new
  look multiplies it; keep its reader's memos (`rectanglesOf`, `faintness`).
- **`data.ts` is generated:** change `art/` and run `node mods/possum-squad/tools/art.ts`.
- **A check that builds its expectation from the module it checks cannot fail:** the sprite
  tests state each recipe's steps themselves; keep it so, and falsify each new check.
- **The desktop has not shown these sprites yet.** It runs the installed release only.

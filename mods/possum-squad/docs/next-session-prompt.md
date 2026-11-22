Read what Session 6's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 6's block and Session 8's done-note, then this
file, and do Session 6: sprites.

Session 6 covers:
- `art/` seeded from `research/art/`;
- the converter in `tools/`, and `hooks/sprites/data.ts`;
- the compositor, the SVG writer and the cache;
- `classic` in every state's still pose and the work loop, each row wearing its run's role;
- motion off.

Release 0.7.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–5 and 8 are done; Sessions 6, 7, 7a and 9–13
  remain. Session 8 ran before Session 6 (amended in both blocks and the table), so Sessions 6,
  7 and 7a release 0.7.0, 0.8.0 and 0.9.0.
- **Before anything:** Session 6 needs the repo-level round that teaches the gate `tools/`
  committed (`SPEC.md` decision 9). It was not on 2026-11-22. If it still is not, ask the user
  which session runs instead, and log the swap as an amendment in both blocks. Its request,
  ready to give that intake:

  > The gate must take a mod's `tools/` folder: Node scripts run by hand, never loaded by the
  > engine. The import scan should allow `node:` imports there and refuse any import of
  > `tools/` from `hooks/` or `tests/`; `tools/` should be type-checked against Node's types;
  > and the round should say how a tool's own behaviour is tested. possum-squad's sprite
  > converter is the first user.
- **Push status:** pushed on 2026-11-22 with the user's approval: `origin/main` holds everything
  through Session 8's review commit. Nothing waits locally. List `origin/main..HEAD` before any
  push, and name any commit that is not the session's.
- **Ask at the start:** whether the user has installed 0.6.0, and whether roles showed in the
  desktop app (`docs/BACKLOG.md`, *Roles in the desktop app*).
- **The engines:** the CLI is 2.1.330, and every folder's declarations were laid by it. The
  desktop app ran engine 2.1.326 on 2026-11-20.
- **What Session 8 left for Session 6:**
  - **Every run has `role?: Role`** in `runs` (`runs-3`): `{ id, source }`, absent while
    unsettled. A row wears `run.role`'s outfit and draws the plain opossum while it is absent.
    `RowData.role` is the role's name; the sprite needs the id, so `rowData` or the row's
    caller passes it on.
  - **The Lead's sprite** is the `lead` role's; no run ever gets `lead`.
  - **Role names** are `STRINGS.roles`, the art manifest's `roleNames`; costume names come with
    `data.ts`.
  - **The clock's beat now writes `runs`** when Helper is due, and runs while a role may still
    fall back (`keepsClock`); a redraw must not restart a sprite's animation (N-04).
- **For Session 7a:** the dressing hop needs the moment a role settled. Every settle has the
  time now (a spawn, a step, an end, a beat), so 7a adds it to `Role`, with a shape bump.
- **For the user to decide, when they choose:** a subagent waiting on its own background shell
  reads "finished" (`docs/BACKLOG.md`, *Deferred*); since 0.6.0 its role stays open there, as
  a teammate's does. It touches *The run model*, so it is not Session 6's.
- **Decisions written down nowhere else:**
  - Whether `/possums` opening the pane again should clear `view.isClosedByPerson` is still
    undecided: today the flag stays set for the session. It matters at Session 9 (auto-open).
- **Baseline** (ARCHITECTURE's table, v0.6.0, CLI 2.1.330):
  - 122 tests in 11 files;
  - `validate`: 11 hooks, 4 gating each with a `.catch`, 3 state keys;
  - calls: `$.clock.every`, `$.clock.now`, `$.command.register`, `$.state.get`, `$.state.set`,
    `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.invalidate`, `$.ui.open`, `$.ui.panes`,
    `$.ui.resolve`.

## Watch for

- **Drive hand checks yourself** in GNU `screen` (mods/possum-squad/CLAUDE.md, *Watch for*):
  the user asked for this over relaying prompts through them. `npm run types` runs the same
  way: start it detached, send `/exit` once its prompt shows.
- **A subagent may not `sleep` in the foreground;** use `ping -c <seconds> 127.0.0.1`.
- **A probe for the desktop needs another route.** A plugin folder named by
  `CLAUDE_CODE_PLUGIN_DIRS` was not loaded into a desktop Code session (engine 2.1.326). The
  desktop runs only the installed release; plan desktop checks for after a push.
- **A kit test cannot read state from its own hooks:** the host refuses the read. Read what the
  pane draws, or count writes with a plugin hooking `state.set`.
- **A check the code already covers twice cannot fail.** Falsify each new check by breaking the
  code it guards, and change the test until it fails at its own step.

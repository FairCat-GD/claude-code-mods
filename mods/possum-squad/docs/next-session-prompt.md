Read what Session 6's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 6's block and Session 5's done-note, then this
file, and do Session 6: sprites.

Session 6 covers:
- `art/` seeded from `research/art/`;
- the converter in `tools/`, and `hooks/sprites/data.ts`;
- the compositor, the SVG writer and the cache;
- `classic` in every state's still pose and the work loop;
- motion off.

Release 0.6.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–5 are done; Sessions 6–13 and 7a remain.
- **Push status:** pushed on 2026-11-20 with the user's approval: `origin/main` holds
  everything through Session 5's review commit (`review(possum-squad): a beat never marked the
  pane open, and 7 smaller`). Nothing waits locally. List `origin/main..HEAD` before any push,
  and name any commit that is not the session's.
- **Ask at the start:** whether the user has installed 0.5.0, and how the desktop pane compared
  with the transcript (`docs/BACKLOG.md`, *The header, sections and clock in the desktop app*).
  The block's three-agent check is recorded at this session's start.
- **The repo-level round for `tools/`** (`SPEC.md` decision 9) is still the user's to open, in
  its own chat; no repo-level file records it yet. If it is not committed when this session
  opens, Session 8 runs first, logged as an amendment in both blocks. Its request, ready to
  give that intake:

  > The gate must take a mod's `tools/` folder: Node scripts run by hand, never loaded by the
  > engine. The import scan should allow `node:` imports there and refuse any import of
  > `tools/` from `hooks/` or `tests/`; `tools/` should be type-checked against Node's types;
  > and the round should say how a tool's own behaviour is tested. possum-squad's sprite
  > converter is the first user.
- **The engines:** the CLI is 2.1.329, and every folder's declarations were laid by it. The
  desktop app ran engine 2.1.326 on 2026-11-20.
- **What Session 5 left for Session 6:**
  - **The sprite's slots are ready:** `desktopRow` takes a sprite in its leading slot, and
    `desktopLead` draws the Lead's mark where its sprite goes (`hooks/view/lead.tsx`). The empty
    panel's line is drawn under the header; the squad asleep goes with it.
  - **`prefs` is read while drawing,** and each change redraws the pane by hand. `motion` and
    `theme` join `finishedOpen` there; the redraw is already in `/possums set`.
  - **The clock redraws once a second** while a run is live and the pane is shown. Sprites
    animate inside their own SVG and need no redraw (N-04); one redraw a second must not restart
    an animation.
- **For the user to decide, when they choose:** a subagent waiting on its own background shell
  reads "finished", since its turn ended (`docs/BACKLOG.md`, *Deferred*). Tell the user at the
  start; it touches *The run model*, so it is not this session's to change.
- **Decisions written down nowhere else:**
  - Whether `/possums` opening the pane again should clear `view.isClosedByPerson` is still
    undecided: today the flag stays set for the session. It matters at Session 9 (auto-open).
- **Session 10's block was amended at Session 4:** Needs you ends at the asking agent's next
  `turn.step` or its `turn.complete`.
- **Baseline** (ARCHITECTURE's table, v0.5.0):
  - 92 tests in 9 files;
  - `validate`: 11 hooks, 4 gating each with a `.catch`, 3 state keys;
  - calls: `$.clock.every`, `$.clock.now`, `$.command.register`, `$.state.get`, `$.state.set`,
    `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.invalidate`, `$.ui.open`, `$.ui.panes`,
    `$.ui.resolve`.

## Watch for

- **A probe for the desktop needs another route.** A plugin folder named by
  `CLAUDE_CODE_PLUGIN_DIRS` was not loaded into a desktop Code session (engine 2.1.326). The
  desktop runs only the installed release; plan desktop checks for after a push.
- **A slash command sent from one session to another arrives as text,** not as a command. A
  hand check that needs `/possums` or a probe's command needs the user at the prompt.
- **The Terminal panel keeps only a screen of a fullscreen session.** Read a hand check's
  output from its transcript under `~/.claude/projects/`, by the session's id.
- **A check the code already covers twice cannot fail.** Session 5 found four: falsify each new
  check by breaking the code it guards, and change the test until it fails at its own step.

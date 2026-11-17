Read what Session 4's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 4's block and Session 3's done-note, then this
file, and do Session 4: runs.

Session 4 covers:
- **first, two measurements,** each brought to the owner before anything is built on it:
  - a tool call's source;
  - how a subagent's end arrives;
- the run model in `hooks/model/`;
- rows drawn from runs with Session 3's builders;
- reload and clear.

Release 0.4.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–3 are done; Sessions 4–13 and 7a remain.
- **Push status:** `origin/main` holds everything through Session 2's review commit. Session 3's
  commits wait locally until the owner approves a push. List `origin/main..HEAD` before any
  push, and name any commit that is not the session's. Ask whether 0.3.0 was pushed and
  installed.
- **The engines:** the CLI is 2.1.326; the desktop app ran engine 2.1.325 for the 0.2.0 run. A
  done-note records the versions its checks ran on.
- **The two measurements Session 4's block now opens with:**
  - **A tool call's source.** A `tool.call` or `tool.run` hook that may match a tool turns off
    three things for that tool, even as a pass-through: moving it to the background, a served
    call's live output, and Code Mode's wait for a stopped result. The declarations say so at
    `tool.run`: "As at `tool.call`…". 0.3.0 hooks neither, and a test fails if either comes
    back.
    - Measure whether `classic.PreToolUse` and `classic.PostToolUse` (with
      `PostToolUseFailure`) avoid the cost. The declarations say nothing either way.
    - Check what they carry: `tool_use_id`, `agent_id`, `tool_name` and `tool_input`.
    - How to see the cost by hand: start a long `sleep` through Bash in a terminal session with
      the mod loaded, and try to move it to the background.
    - Then the owner picks. Needs you's end signal (Session 10) follows the choice: `tool.run`
      marks an allowed call about to run.
  - **A subagent's end.** The desktop listed no `turn.complete` from a subagent, though two of
    three had answered, while the main session's three turns completed. The terminal's entry
    was cut off in Session 2.
    - Measure in both builds what marks a subagent's end: its `turn.complete` with `agentId`,
      `classic.SubagentStop` (in the declarations), or something else.
    - Another event is the owner's call: it changes *The hooks* and *The run model*.
- **What Session 3 left for later sessions:**
  - `register.tsx`'s pass-throughs are plain `next(e)`. A reading guard (the old `passOn`:
    read inside `try`, return what `next` gave) comes back with Session 4's readers. I-05's
    *Enforced by* says so.
  - `StateId` is in `types/index.d.ts`; `runs` joins it there. The import scan accepts a type
    import from `types/`.
  - `RowData`, `terminalRow` and `desktopRow` are in `hooks/view/row.tsx`, drawn by nothing
    yet. The desktop's look is unseen: its fourth line is the app's `Progress`, which the
    engine draws as a label line over a full-width fill. Session 4's hand check is the first
    look.
  - `$.store` is not reactive. Nothing drawn reads `prefs` yet, so `set` redraws nothing; the
    first session that draws from `prefs` also calls `$.ui.invalidate` after a `set`.
  - Tests that draw module builders use the test's own `ui.render` hook with
    `{ plugin: '*' }`: an inline test plugin closes over nothing of the file.
- **Decisions written down nowhere else:**
  - Whether `/possums` opening the pane again should clear `view.isClosedByPerson` is still
    undecided: today the flag stays set for the session. It matters at Session 9 (auto-open).
- **The repo-level round for `tools/`** (`SPEC.md` decision 9) is still the owner's to open, in
  its own chat, before Session 6; no repo-level file records it. Its request, ready to give
  that intake:

  > The gate must take a mod's `tools/` folder: Node scripts run by hand, never loaded by the
  > engine. The import scan should allow `node:` imports there and refuse any import of
  > `tools/` from `hooks/` or `tests/`; `tools/` should be type-checked against Node's types;
  > and the round should say how a tool's own behaviour is tested. possum-squad's sprite
  > converter is the first user.

  If it is not committed when Session 6 opens, Session 8 runs first, logged as an amendment.
- **Baseline** (ARCHITECTURE's table, v0.3.0): 33 tests in 5 files; `validate` 10 hooks, 3
  gating each with a `.catch`, 1 state key.
  - Calls: `$.command.register`, `$.state.get`, `$.state.set`, `$.store.get`, `$.store.set`,
    `$.ui.close`, `$.ui.open`, `$.ui.panes`, `$.ui.resolve`.
  - Session 4 adds `runs` as a state key, and possibly `$.ui.invalidate` back.

## Watch for

- **The two measurements are facts, the choices are the owner's.** Record what the kit and the
  terminal show, then ask; never pick a source because the code is easier.
- **Every hook added runs in every session the owner starts.** A pass-through can still change
  behaviour, as `tool.call`'s did: read each event's declaration for remarks on hooking it
  before adding one.

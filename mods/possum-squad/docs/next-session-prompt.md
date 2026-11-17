Read what Session 3's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 3's block and Session 2's done-note, then this
file, and do Session 3: the panel shell. 3 covers:
- first, the desktop run's results recorded, and the four spike decisions made with the owner;
- the spike removed: the test view, the fixture, the log, the clock, `userConfig`, and any hook
  no later session needs;
- `/possums open`, `set`, `settings`, and `prefs` in the store through one write function;
- the four-line row on both surfaces, from fictional data.

Release 0.3.0. Ask the block's *Ask at the start* questions before the plan, after recording
the desktop run.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–2 are done; Sessions 3–13 and 7a remain.
- **Push status:** pushed on 2026-11-17 with the owner's approval: `origin/main` holds
  everything through Session 2's review commit
  (`review(possum-squad): tool arguments showed inner names, and 7 smaller`). Nothing waits
  locally. Ask whether the owner has installed 0.2.0 and done the desktop run.
- **0.1.0 is installed** (the owner's answer at Session 2). After the push, the owner installs
  0.2.0 with `claude plugin update possum-squad` and starts a new desktop session.
- **The desktop run, before Session 3's plan** (the owner agreed to it):
  1. In the desktop app, open the pane with `/possums`, and switch the permission mode away
     from auto, so a permission prompt can show.
  2. Prompt 1: *Start three subagents in parallel: one lists the folders in mods/, one counts
     the lines of README.md, one reads the first entry of mods/possum-squad/CHANGELOG.md. Each
     answers in one line.*
  3. Prompt 2: *Start one subagent and have it run the shell command
     `echo possum > "$TMPDIR/possum-spike.txt"`, then report back.* Before answering the
     prompt, look at which entries have appeared.
  4. Look at the plugin's settings in the desktop app for "Test setting (does nothing)", and
     whether it can be changed there. Change it only last: it reloads the mod and empties the
     log.
- **What to record from it** (into Session 3's done-note, then Session 3's Decided parts):
  - **the clock, first:** whether the "Redrawn by the clock" count rises once a second. It was
    never seen in an engine: the tick calls `$` from a finished `/possums` dispatch, which the
    kit allows. If it stays at 0, the redraw question below has no answer, and Session 5's
    clock needs another way to call `$`;
  - **SMIL in a pane:** whether the twenty framed sprites bob, whether the app stays smooth
    and responsive, whether the image form bobs, and whether the once-a-second redraw
    restarts or stutters a bob;
  - **light theme and reduced motion:** whether `QUERIED` darkens under the app's light theme
    and stands still with the system's reduced motion, framed and as an image;
  - **the permission wait:** the entries for `tool.check ask · subagent` and
    `classic.PermissionRequest · subagent`, whether each appeared before the prompt was
    answered, and the `tool.call · subagent` entry's arrival after it (decision 16, F-12);
  - **every entry's field names,** especially those the terminal cut off: `turn.complete`,
    `tool.call`, `tool.check`, `session.measure`; and the desktop engine's version;
  - **manifest settings:** whether the desktop's plugin manager offers the test setting.
- **What the spike already showed** (*Context*'s Built part; the done-note has the rest):
  - plan limits arrive on a subscription, from both `$.session.usage()` and `session.measure`;
  - a spawn's result came back before its agent's first turn, the agents in the background;
  - the terminal's `/config` lists a `userConfig` field, and changing it reloads the mod;
  - a pane taller than its seat is cut off in the terminal, and the mouse did not scroll it:
    the real panel's height matters from this session's row onwards;
  - in the kit, a tool call raises its own `tool.check` and `classic.PermissionRequest` (with
    `agent_id` from a subagent) before its result;
  - the kit's terminal table answers `Svg`, drawing nothing: narrow on `e.surface`;
  - the engine refuses a module that passes `$` to a function declared inside `register`.
- **Decisions written down nowhere else:**
  - whether `/possums` opening the pane again should clear `view.isClosedByPerson` was not
    decided: today the flag stays set for the session. It matters at Session 9 (auto-open);
  - `/possums` still ignores the words after it, so `/possums open` can close the pane:
    this session builds the words (the Session 1 review's skipped finding);
  - after a reload the spike's clock waits for the next `/possums` open; the real clock
    (Session 5) is re-armed at `session.start`, per *The panel*.
- **The repo-level round for `tools/`** (`SPEC.md` decision 9) is still the owner's to open, in
  its own chat, before Session 6; no repo-level file records it. Its request, ready to give
  that intake:

  > The gate must take a mod's `tools/` folder: Node scripts run by hand, never loaded by the
  > engine. The import scan should allow `node:` imports there and refuse any import of
  > `tools/` from `hooks/` or `tests/`; `tools/` should be type-checked against Node's types;
  > and the round should say how a tool's own behaviour is tested. possum-squad's sprite
  > converter is the first user.

  If it is not committed when Session 6 opens, Session 8 runs first, logged as an amendment.
- **Baseline** (ARCHITECTURE's table, v0.2.0): 23 tests in 3 files; `validate` 12 hooks, 5
  gating each with a `.catch`, 1 state key. Calls: `$.clock.every`, `$.command.register`,
  `$.session.usage`, `$.state.get`, `$.state.set`, `$.ui.close`, `$.ui.invalidate`, `$.ui.open`,
  `$.ui.panes`, `$.ui.resolve`. Removing the spike drops the first three or keeps those the
  panel shell needs; `$.store.get` and `$.store.set` come with `prefs`, both on *Reach*.

## Watch for

- **The spike answers are the owner's.** Record what the desktop showed, then ask; never pick
  an answer because the code is easier.
- **`tests/engine.ts` stays:** the stand-in, the shared test values and `hooksOf` are not
  spike code.
  `tests/spike.test.ts`, `hooks/spike.ts`, `hooks/sprites/fixture.ts` and
  `hooks/view/spike.tsx` go.
- **Removing `userConfig` leaves any value the owner set in their settings.** Say so in the
  changelog line; never edit the owner's settings to clean it (invariant 7).

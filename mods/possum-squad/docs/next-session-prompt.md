Read what Session 2's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 2's block and Session 1's done-note, then this
file, and do Session 2: the spike build. 2 covers:
- the fixture sprites in the pane (twenty animated, one as an image, one with media queries, a
  redraw every second);
- each hooked event's shape as text in the pane (field names and value types only);
- usage from `$.session.usage()` and `session.measure`, and one throwaway `userConfig` field;
- the 0.2.0 changelog entry and *Context*'s Built part from the terminal.

Release 0.2.0. Ask the block's *Ask at the start* question before the plan.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0 and 1 are done; Sessions 2–13 and 7a remain.
- **Push status:** pushed on 2026-11-17 with the owner's approval: `origin/main` holds
  everything through Session 1's review commit
  (`review(possum-squad): /possums closed a hidden pane, and 3 smaller`). Nothing waits
  locally. Whether the owner has installed 0.1.0 is not recorded; ask at the start.
- **What Session 1 left that Session 2 builds on:**
  - `hooks/register.tsx` holds every hook. Each pass-through is `passOn(e, await next(e))`, and
    `turn.step` is `return passOn(e, yield* next(e))`. `passOn(e, result, read?)` runs `read`
    inside `try` and returns the result untouched. Session 2's readers go in as that third
    argument, so a reader's fault never reaches the event. On `turn.step` the reader sees the
    finished result, after the last chunk.
  - The pane's `ui.render` hook draws `emptyPanel` from `hooks/view/empty.tsx`, which takes
    `Box` and `Text`. The spike's drawing goes beside it in `hooks/view/`; `Svg` exists only in
    the desktop's table, so a builder that draws it narrows on `e.surface`.
  - The `$.state` contract is `types/index.d.ts`: `view` alone, as `Shaped<View>` under the tag
    `view-1`. A spike value the pane draws needs a key declared there; anything shown must be
    field names and types, never values (I-03, I-04).
  - The tests stand in for the engine with bottom hooks: `engine(on)` in
    `tests/panel.test.ts`, the fixtures in `tests/fixtures/events.ts`, and `drain()` in
    `tests/pass-through.test.ts` for streams.
- **What the kit does that the specs don't say** (CLI 2.1.326; *Context*'s Built part):
  - The stream the kit's `$.turn.step` returns has no `.result`; read the result from the
    stream's end.
  - A test cannot close a pane as the person.
  - An inline test plugin may not pass `$` to an imported helper, and cannot close over the
    test file: spell `$.state.get(...)` out, and pass data through results.
  - The engine refuses a `next(e)` argument missing a field it needs, and reports the hook
    skipped.
- **Decisions written down nowhere else:**
  - The owner checked 0.1.0 by hand in `claude --plugin-dir mods/possum-squad`: `/possums`
    opens and closes the pane, and opens it under 110 columns, so an open from the command
    counts as asked.
  - Whether `/possums` opening the pane again should clear `view.isClosedByPerson` was not
    decided: today the flag stays set for the session. It matters at Session 9 (auto-open).
  - `/possums` closes the pane only when it `isShown`; an open pane out of view is reopened
    with `focus: true` to raise it (the review's main finding). The command still ignores the
    words after it, so `/possums open` can close the pane: Session 3 builds the words and owns
    that (the review's skipped finding).
  - The PNG layers in `docs/spec/research/art/` hold pixel data only (no text chunks), checked
    at intake, since hygiene cannot read binaries.
- **The repo-level round for `tools/`** (`SPEC.md` decision 9) is still the owner's to open, in
  its own chat, before Session 6; no repo-level file records it. Its request, ready to give
  that intake:

  > The gate must take a mod's `tools/` folder: Node scripts run by hand, never loaded by the
  > engine. The import scan should allow `node:` imports there and refuse any import of
  > `tools/` from `hooks/` or `tests/`; `tools/` should be type-checked against Node's types;
  > and the round should say how a tool's own behaviour is tested. possum-squad's sprite
  > converter is the first user.

  If it is not committed when Session 6 opens, Session 8 runs first, logged as an amendment.
- **Baseline** (ARCHITECTURE's table, v0.1.0): 11 tests in 2 files; `validate` 12 hooks, 5 gating
  each with a `.catch`, 1 state key. Its calls are `$.command.register`, `$.state.get`,
  `$.state.set`, `$.ui.close`, `$.ui.open`, `$.ui.panes` and `$.ui.resolve`. A call the spike
  adds outside *Reach* (`$.session.usage` is in it) is the owner's to allow.

## Watch for

- **0.2.0 installed shows the spike in every session the owner starts.** Field names and types
  only, never a value; a value there is the owner's work on screen and in screenshots.
- **A reader runs only after `next` returned, inside `passOn`.** In `turn.step`, nothing between
  yields: read the result after `yield* next(e)`.
- **A redraw every second is a `$.clock.every` timer.** Pin the clock in its test
  (`mock.clock`), and cancel the timer when the pane closes.
- **The desktop's results exist only after the push and the owner's install.** Record what the
  terminal showed in the done-note, and say the rest waits for Session 3's start.

Read what Session 7a's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 7a's block and Session 7's done-note, then this
file, and do Session 7a: state animations.

Session 7a covers:
- every state's animation as its recipe, on every set, each with its still form for `motion`
  `off`: arrival and the dressing hop, the work loop, the sign, the doze, the cheer then sleep,
  playing dead, the startle;
- the moment a role settles joins `Role`, with its own shape bump, for the hop;
- the gallery animates, framed.

Release 0.9.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–8 are done; Sessions 7a and 9–13 remain. 7a
  releases 0.9.0.
- **Push status:** pushed on 2026-11-23 with the user's approval: `origin/main` holds everything
  through Session 7's review commit. Nothing waits locally. List `origin/main..HEAD` before any
  push, and name any commit that is not the session's.
- **0.7.0 and 0.8.0 wait for the owner's install and desktop look** (`docs/BACKLOG.md`, *Not yet
  checked by hand*): ask at the start whether they were seen, and record it in 7a's done-note.
- **What Session 7 left for Session 7a:**
  - **The gallery draws still poses:** `desktopGallery` in `hooks/view/gallery.tsx` asks
    `sprite({ set, role, pose, motion: 'off' })`. Animating it means passing `prefs.motion`
    (the panel has it in `data.look`) and letting `spriteElement` frame what moves: 136 framed
    sprites at once, which the Decision log sends back to the owner if not smooth.
  - **The clock's beat leaves the gallery undrawn** (Session 7's review): a redraw resent all
    136 sources each second. Animating it does not change that: SMIL plays inside each sprite,
    so the gallery still needs no beat.
  - **`planned` is a still, faded pose** (`COLOURINGS.greyed`, an `opacity` group with the
    outline outside it). `drawSprite` returns it before the work-loop branch, so it never
    animates; keep it so, since the recipe is still.
  - **`drawSprite`** animates only `working` today. Each new recipe's loop can reuse
    `workLoop`'s parts and `loopSvg`, which take any parts and steps; the reduced-motion still
    copy is each pose's `stillFrame`.
  - **`stopped`'s still pose is the startled frame** (the manifest's recipe), but the PDD's
    animation ends on idle, so the settled frame and the motion-off pose will differ; 7a
    decides which `motion` `off` shows.
  - **The sprite checks run over all four sets** (`every` in `tests/sprites.test.ts`); the
    run takes about 4 s, and each loop's outline check plays its SMIL a step at a time, so new
    loops multiply that.
- **The engines:** CLI 2.1.330, which laid every folder's declarations. The desktop app ran
  engine 2.1.326 on 2026-11-20.
- **Decisions written down nowhere else:**
  - Whether `/possums` opening the pane again should clear `view.isClosedByPerson` is still
    undecided: today the flag stays set for the session. It matters at Session 9 (auto-open).
- **For the user to decide, when they choose:** a subagent waiting on its own background shell
  reads "finished" (`docs/BACKLOG.md`, *Deferred*).
- **Baseline** (ARCHITECTURE's table, v0.8.0, CLI 2.1.330):
  - 157 tests in 16 files, and 10 tool specs in 2 files;
  - `validate`: 11 hooks, 4 gating each with a `.catch`, 3 state keys;
  - calls: `$.clock.every`, `$.clock.now`, `$.command.register`, `$.state.get`, `$.state.set`,
    `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.invalidate`, `$.ui.open`, `$.ui.panes`,
    `$.ui.resolve`.

## Watch for

- **Drive hand checks yourself:** `screen -U -dmS <name> claude --plugin-dir mods/possum-squad`,
  attached in a Terminal-panel tab with `screen -U -r <name>` (mods/possum-squad/CLAUDE.md,
  *Watch for*). A pane's `Button` could not be pressed that way in Session 7: ctrl+x then tab
  through `screen` did not move the focus.
- **The `@inline` copy keeps its own store,** and its `theme` was `horror` at Session 7's
  start: a terminal check reads that set, not `classic`. Put back anything a check changes.
- **The kit's terminal draws an `Svg` as an empty `Box`:** a terminal check counts those too.
- **`data.ts` is generated:** change `art/` and run `node mods/possum-squad/tools/art.ts`; the
  converter's spec fails while they differ.
- **A check the code already covers twice cannot fail,** and neither can one that builds its
  expectation from the module it checks: falsify each new check by breaking the code it guards.
- **The desktop has not shown these sprites yet.** It runs the installed release only; plan the
  animations' look for after the push (`docs/BACKLOG.md`).

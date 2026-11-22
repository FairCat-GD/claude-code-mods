Read what Session 7's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 7's block and Session 6's done-note, then this
file, and do Session 7: sets and gallery.

Session 7 covers:
- `theme` drawn: the pane wears `prefs.theme`'s set, and `/possums set theme` redraws at once;
- a role a set lacks falls back to `classic`, and costume names per set;
- `/possums roles`: the gallery of 17 roles in 8 states, on both surfaces.

Release 0.8.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–6 and 8 are done; Sessions 7, 7a and 9–13
  remain. Sessions 7 and 7a release 0.8.0 and 0.9.0.
- **Push status:** pushed on 2026-11-22 with the user's approval: `origin/main` holds everything
  through Session 6's review commit. Nothing waits locally. List `origin/main..HEAD` before any
  push, and name any commit that is not the session's.
- **0.7.0 waits for the owner's install and desktop look** (`docs/BACKLOG.md`, *Not yet checked
  by hand*): ask at the start whether it was seen, and record it in Session 7's done-note.
- **What Session 6 left for Session 7:**
  - **`data.ts` already holds all four sets,** with their costume names, as Session 6's gate
    required. `dressOf` (`hooks/sprites/index.ts`) already falls back to the default set's role
    and to plain for an unknown one. What is left: `drawPane` passes `ART.defaultSet` today, and
    should pass `prefs.theme`; F-27's tests (17 outfits, props and costume names per set;
    switching changes every sprite and no role name; a fictional two-role set falls back).
  - **`planned` has no pose yet.** The sprite module's poses are the 7 states and `idle`;
    `STILL` in `recipes.ts` maps each to a recipe. The manifest's `planned` recipe is idle,
    "greyed: 70% luminance grey, 30% colour, then 45% toward the background", carried in
    `data.ts` as `colour: 'greyed'`. Greyed inside `opacity`, the outline `#464650` falls to
    about 2.7:1, and greying changes which colours count as faint. Ask the owner how it is
    greyed before drawing it (amended in Session 7's block).
  - **The gallery can use `sprite({ set, role, pose, motion })`** for each role and pose, and
    `spriteElement` for the `Svg`. Costume names are `ART.sets[set].roles[role].costume`; role
    names `STRINGS.roles`.
  - **N-02 across every set** is already met: still poses 1.6k–3.4k characters, the work loop
    at most 8.7k, measured over all four.
- **For Session 7a:** `stopped`'s still pose is the startled frame (the manifest's recipe), but
  the PDD's animation ends on idle, so the settled frame and the motion-off pose will differ;
  7a decides which `motion off` shows. The work loop's parts and `loopSvg` take any parts and
  steps, so 7a's recipes can reuse them.
- **The engines:** CLI 2.1.330, which laid every folder's declarations. The desktop app ran
  engine 2.1.326 on 2026-11-20.
- **Decisions written down nowhere else:**
  - Whether `/possums` opening the pane again should clear `view.isClosedByPerson` is still
    undecided: today the flag stays set for the session. It matters at Session 9 (auto-open).
- **For the user to decide, when they choose:** a subagent waiting on its own background shell
  reads "finished" (`docs/BACKLOG.md`, *Deferred*).
- **Baseline** (ARCHITECTURE's table, v0.7.0, CLI 2.1.330):
  - 141 tests in 14 files, and 10 tool specs in 2 files;
  - `validate`: 11 hooks, 4 gating each with a `.catch`, 3 state keys;
  - calls: `$.clock.every`, `$.clock.now`, `$.command.register`, `$.state.get`, `$.state.set`,
    `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.invalidate`, `$.ui.open`, `$.ui.panes`,
    `$.ui.resolve`.

## Watch for

- **Drive hand checks yourself:** `screen -U -dmS <name> claude --plugin-dir mods/possum-squad`,
  attached in a Terminal-panel tab with `screen -U -r <name>` (mods/possum-squad/CLAUDE.md,
  *Watch for*); detached `hardcopy` was unreliable here. `npm run types` runs the same way.
- **The kit's terminal draws an `Svg` as an empty `Box`:** a terminal check counts those too.
- **`data.ts` is generated:** change `art/` and run `node mods/possum-squad/tools/art.ts`; the
  converter's spec fails while they differ.
- **A check the code already covers twice cannot fail.** Falsify each new check by breaking the
  code it guards, and change the test until it fails at its own step: four of Session 6's
  could not fail as first written.
- **The desktop has not shown these sprites yet.** It runs the installed release only; plan the
  gallery's look for after the push (`docs/BACKLOG.md`).

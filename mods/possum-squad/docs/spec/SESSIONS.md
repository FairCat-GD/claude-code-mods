# The session plan: round 1, the agents panel

One block per session, in order, each run by *The session cycle* in the root
`docs/DEVELOPMENT-WORKFLOW.md`. The request and its resolved decisions are in `SPEC.md` beside
this file, with the frozen design draft `PDD.md` and its inputs in `research/`; all are
read-only; do not re-litigate them. A session that finds its block wrong amends it and records
the reason in the block and in `docs/next-session-prompt.md`. Session 13 closes the round: it
deletes this file, `SPEC.md`, `PDD.md` and `research/`, and anything left open moves to
`docs/BACKLOG.md`.

In every Read line, `SPEC` decisions are by number, `PDD` places by part and ID, and
`ARCHITECTURE` sections by name. Standing gates, each from the session that adds its test, then
in every session that touches what it guards: N-01, I-01, I-02 and I-05 from Session 1; I-03
and I-04 from Session 3; I-06 from Session 4. N-07 and I-08 are review rules in every session.

| Session | Scope | Decisions | Version |
|---|---|---|---|
| 1 | Skeleton: `/possums` toggles the pane on both surfaces; the state file; the hooks the spikes read, passing every event through | 10, 12, 19, 21; *The hooks*, *Values*, *The panel*, *Reach* | **0.1.0** |
| 2 | Spike build: fixture sprites in the pane, the event shapes as text, usage; the spike notes | 12, 15, 16, 17 | **0.2.0** |
| 3 | Panel shell: the spike results decided; `/possums open`, `set`, `settings`; `prefs`; the row on both surfaces | 5, 6, 15, 16, 19 | **0.3.0** |
| 4 | Runs: subagents as live rows with tokens, context and endings; reload and clear | 12, 13, 14 | **0.4.0** |
| 5 | The Lead, header totals, sections, Finished, the one-second clock; the terminal complete | 17, 18 | **0.5.0** |
| 6 | Sprites: `art/` seeded, the converter, compositor and SVG writer; `classic` in every state's still pose and the work loop; motion off | 5, 9, 15, 17 | **0.7.0** |
| 7 | Sets and gallery: `theme`, the other three sets, `/possums roles` | 5, 15 | **0.8.0** |
| 7a | Every state's animation | 15 | **0.9.0** |
| 8 | Roles: the reference ported, the corpus, arrival and dressing | 2, 20 | **0.6.0** |
| 9 | Role picker and memory, states wired to runs, auto-open | 6, 19 | **0.10.0** |
| 9a | The gallery within what the desktop draws: its limit found, the gallery redrawn within it, a size test for the pane | 5, 15, 17 | **0.10.1** |
| 10 | Attention: Needs you, gone quiet, toasts | 16 | **0.11.0** |
| 11 | Peek and the collapsed view; the `widget` seat | 18 | **0.12.0** |
| 12 | Plan limits, the cost estimate, nested helpers | 1, 22 | **0.13.0** |
| 12a | Waiting, not finished: an agent held by its own background work reads `waiting` | 1, 13 (both amended); *The run model* | **0.14.0** |
| 12b | The activity line: a path's end, the engine's progress summary, `peek` in reach, an ended row's last call | 1 (amended); *The panel* | **0.15.0** |
| 12c | The Lead's time moving during a main turn | 1 (amended); *The hooks*, *The panel* | **0.16.0** |
| 12d | Toasts and the tab: the failed toast's reason, the `toasts` setting, the tab title, `detect` in the picker | 1 (amended); *Attention*, *The command and settings* | **0.17.0** |
| 13 | Docs, changelog, manual runs; `ARCHITECTURE.md` read cold; close the round | all | **1.0.0**, tagged `possum-squad-v1.0.0` |

Session 8 ran before Session 6 (amended at Session 8's plan, with the owner: the repo-level round
that teaches the gate `tools/` was not committed, as Session 6's block foresaw). It released
0.6.0, so Sessions 6, 7 and 7a release 0.7.0, 0.8.0 and 0.9.0.

Sessions 12a to 12d were inserted at Session 13's plan (2026-11-25, with the owner). The owner
asked for an adversarial review of that plan "and potential features/improvements to the
plugin. if any will be accepted we will move 1.0.0 release until they are done". The owner
accepted all eight of the review's ideas, and two defects their desktop look at 0.13.0 found at
the same plan join 12b. So 1.0.0 waits: Session 13 runs after 12d, as its block's amendment says.

---

## 1: Skeleton

**Read:** `SPEC.md` §2 decisions 2, 10, 12, 19, 21, §3; `PDD.md` Part 4 *Input & interaction
model*, *States & edge cases*, Part 5 N-01, N-07, I-01, I-05, Part 6 *Names that never change*,
Part 8 *Stack & architecture*; `ARCHITECTURE.md` *Context*, *Layout and boundaries*, *The
hooks*, *Values: `$.state` and `$.store`*, *The panel*, *The command and settings*, *Reach*,
*Testing strategy*, *Packaging*; `DEVELOPMENT-WORKFLOW.md` *Day one*.

- **The module** (*Layout and boundaries*).
  - `hooks/register.ts` becomes `hooks/register.tsx`, named in `hooks/hooks.json`; `/hello`, its
    `GREETING` and `tests/possum-squad.test.ts`'s one test go.
  - `types/index.d.ts` declares `view` under `PluginState['possum-squad']`; `plugin.json` names it
    under `types`. The other keys are added by the sessions that write them.
- **`/possums` toggles the pane** (*The command and settings*, *The panel*).
  - Registered at `session.start` with `immediate`; on `command.run` it opens the pane
    `possum-squad` (title "Possum Squad", T-13 columns) or closes it, and prints nothing.
  - The pane draws the empty panel's line on both surfaces, built in `hooks/view/` from
    `hooks/strings.ts`.
  - `ui.close` with `origin.kind` `person` records it in `view`.
- **Pass-through hooks** for what Session 2 reads (*The hooks*): `agent.spawn`, `turn.start`,
  `turn.step` (streaming), `turn.complete`, `tool.call`, `tool.check`, `session.measure`,
  `classic.PermissionRequest`. Each awaits `next`, reads nothing yet, and returns what `next`
  gave; each body is wrapped (I-05).
- **Docs.**
  - `CHANGELOG.md`: the 0.1.0 entry rewritten for what the owner now sees (no one installed the
    made one).
  - README: what the mod does, the install lines, `/possums`.
  - `ARCHITECTURE.md`: the Built parts of *Overview*, *Context*, *Layout and boundaries*, *The
    hooks*, *Values*, *The panel*, *The command and settings*, *Reach*; the invariants'
    *Enforced by* for I-01, I-02, I-05 and N-01; the baseline table, with `validate`'s hook,
    gating and calls counts.
  - `CLAUDE.md`: the slash command, the state keys.
- **Confirms:** *The hooks* (the failure rule, `turn.step`'s body), *Values* (`view`), *The
  panel* (the pane, the toggle), *The command and settings* (`immediate`), *Reach*.

**Gates:**
- `npm run verify -- possum-squad`, with these tests, each over `['terminal', 'desktop']` where
  it draws:
  - session start registers `/possums` and no tool (N-01);
  - `/possums` opens the pane, a second `/possums` closes it; the pane draws the empty panel;
  - a close by the person is recorded in `view`; a close by the plugin is not;
  - for each hooked event, the result equals what the stub returned (I-01), and a malformed
    event passes on unchanged (I-05);
  - `turn.step`'s chunks reach the caller unchanged and in order.
- `claude --plugin-dir mods/possum-squad` in a terminal, by the owner: `/possums` opens and
  closes the pane.

**Watch for:**
- **`turn.step` is an async generator.** A plain function is a type error; a chunk yielded
  stays, so nothing may throw between yields.
- **Every hook runs in every session the owner starts** once 0.1.0 is installed, this
  repository's sessions included. A pass-through that changes anything is the worst bug the mod
  can have.
- **A pane the mod opens unasked is placed only from 144 columns in the terminal** (110 once the
  person has opened that id). Whether a pane opened from `/possums` counts as asked is not
  known: measure it.
- **No `$.state` write inside `ui.render`.** The engine refuses it.

**Done (2026-11-17, 0.1.0).**
- **Decided with the user:**
  - at plan time, `$.ui.panes` joins *Reach*'s allow-list, so `/possums` asks the engine
    whether the pane is open rather than keeping a flag in `view` (*Decision log*);
  - the parts under **Confirms**, as built: *The hooks* (the failure rule: a guarded read and a
    passing `.catch`; `turn.step`'s body `return passOn(e, yield* next(e))`), *Values* (`view`),
    *The panel* (the pane, the toggle), *The command and settings* (`immediate`), *Reach*.
- **The module.** `hooks/register.ts` became `hooks/register.tsx`, named in `hooks/hooks.json`;
  `/hello`, `GREETING` and the template's test are gone. Beside it are `hooks/config.ts`
  (`PANE_COLUMNS`, T-13), `hooks/strings.ts` and `hooks/view/empty.tsx` (`emptyPanel`, one
  builder for both surfaces). `types/index.d.ts` declares `view` as `Shaped<View>`, and
  `plugin.json` names it under `types`.
- **`/possums`.** It is registered at `session.start` with `immediate`. On `command.run` it
  reads `$.ui.panes()`, then closes the pane or opens it (title "Possum Squad", 46 columns),
  and answers `{}`. A rejected call answers one plain line.
- **The pane.** The `ui.render` hook for `Pane` / `possum-squad` draws the empty panel's line
  and touches no state.
- **The close.** The `ui.close` hook records a close by the person (not refused) in
  `view.isClosedByPerson`, through `update`, inside a guard.
- **Pass-through hooks.** `agent.spawn`, `turn.start`, `turn.complete`, `tool.call`,
  `tool.check`, `session.measure` and `classic.PermissionRequest` are each
  `passOn(e, await next(e))`, with no reader yet. `turn.step` is
  `return passOn(e, yield* next(e))`. Every hook but `command.run` and `ui.render` has a
  `.catch` that passes the event on.
- **Tests.** `tests/panel.test.ts` (6) and `tests/pass-through.test.ts` (3), with fictional
  events in `tests/fixtures/events.ts`. Each block gate has its test; the UI ones loop over
  terminal and desktop.
- **Docs.** The 0.1.0 entry in `CHANGELOG.md` was rewritten. Also written: the README, the user
  guide, `ARCHITECTURE.md`'s Built parts, the *Enforced by* of I-01, I-02, I-05 and N-01, the
  baseline and the decision log, and `CLAUDE.md`'s command and state-key lines.
- **Amendments:**
  - **`$.ui.panes` is called, beyond *Reach* as written.** The toggle needs to know whether the
    pane is open; the user chose the engine's list over a flag in `view` at plan time.
  - **The person's close is tested on the hook alone.** The kit's `$` cannot close a pane as
    the person (only the engine sets `origin`), so that test runs the module's `ui.close` hook
    with a `$` holding only state. The plugin's own close is tested through the kit, with an
    inline plugin reading the stored value. The session's own finding.
  - **`turn.step`'s malformed case keeps the engine's required fields.** The engine fails a step
    with no `turnId`, `index` or `model` in its own chain, before any hook. The test raises a
    step with only those fields and fields the mod does not know. The session's own finding.
- **Measured** (CLI 2.1.326, the kit):
  - a `next(e)` given a malformed argument is refused, and the hook is reported skipped; the
    event goes on with the result from beneath;
  - inside a hook, `next(e)` on `turn.step` carries `.result`, equal to what `yield*` returns;
    the kit's own `$.turn.step` stream has no `.result`, so tests read the stream's end;
  - an inline test plugin may not pass `$` to an imported helper (`read`), and cannot close over
    the test file;
  - `validate` lists 5 of the 12 hooks as gating.
- **Checked by hand:** the user, in `claude --plugin-dir mods/possum-squad` (CLI 2.1.326):
  - `/possums` opens the pane with the empty line, and a second `/possums` closes it;
  - in a window under 110 columns, `/possums` opens it above the prompt, so an open from the
    command counts as asked;
  - the desktop app waits for a push and install.
- **Falsified**, each failing at its own test:
  - a `$.tool.register` at session start;
  - the toggle that always opens;
  - the pane drawing another line;
  - `view` written on any origin (both close tests), and never written;
  - `passOn` altering the result (all three pass-through tests);
  - a hook answering its own result for an unknown shape;
  - `turn.step` dropping its first chunk, and swapping two;
  - a refused open answering nothing.
- **Numbers:** 9 tests (+8), in 2 files. `validate`: 12 hooks (+10), 5 gating (+5), each with a
  `.catch`; 1 state key (`view`, +1); calls `$.command.register`, `$.state.get`, `$.state.set`,
  `$.ui.close`, `$.ui.open`, `$.ui.panes`, `$.ui.resolve`.
- **Review (`/code-review high`), 8 findings: 4 fixed and 4 skipped.**
  - **`/possums` closed a pane the person could not see.** A pane open as a tab behind another
    pane, or waiting undrawn, was closed by the toggle. Now only a pane that `isShown` closes;
    an open pane not in view is opened again with `focus: true`, which the declarations say
    raises it. `isPlaced` was dropped from the check, since an unplaced pane is never shown
    (its falsification could not fail). The user chose the fix; whether the surfaces raise the
    tab is unchecked by hand (`docs/BACKLOG.md`).
  - **I-01's test left out `session.start`.** It now raises it with a fictional input and
    expects the stand-in's result.
  - **No test made the flag's write fail.** One now runs the `ui.close` hook with a state that
    refuses every write, and expects the close's result unchanged.
  - **`View`'s comment described auto-open,** which is not built. It now says what the flag
    holds.
  - **Skipped:** `/possums` with words after it still toggles, so `/possums open` can close the
    pane. Changing it changes behaviour; the user left it to Session 3, which builds the words.
  - **Skipped:** `turn.step`'s `.catch` might replay chunks already passed up. The declarations
    say the handler continues the stream, the hook cannot fail on its own (its read is
    guarded), and the kit cannot make it fail mid-stream.
  - **Skipped:** `passOn`'s reader is passed by no hook. Session 2 adds the readers, and the
    block asks for wrapped bodies from Session 1.
  - **Skipped:** the person-close test captures the last `ui.close` hook `register` makes. The
    kit offers no way to close a pane as the person; the capture is the narrowest stand-in.
  - **Falsified:**
    - closing any listed pane, and a raise without `focus` (the hidden-pane test);
    - `session.start` returning its own result (the I-01 test);
    - the flag's write unguarded (the failed-write test).
  - **Numbers after the review:** 11 tests (+2): panel 8, pass-through 3. `validate` unchanged.

---

## 2: Spike build

**Read:** `SPEC.md` §2 decisions 12, 15, 16, 17; `PDD.md` Part 5 *Constraints & assumptions*,
Part 7 *Motion & feedback*, Part 8 *Technical risks*, Part 12 H2, H4; `ARCHITECTURE.md`
*Context*, *The hooks*, *Sprites and sets*, *The panel*, *Attention*, *Testing strategy*.

- **Fixture sprites in the pane** (*Sprites and sets*): one hand-written 32×32 SVG in
  `hooks/sprites/`, a two-frame SMIL bob, drawn at 64 px:
  - twenty of it with `isInteractive`, to see SMIL in a pane and the pane's cost of twenty
    frames;
  - one without `isInteractive`, to see the image form;
  - one whose fill changes under `@media (prefers-color-scheme: light)` and whose animation
    stops under `@media (prefers-reduced-motion: reduce)`;
  - a redraw every second, to see whether a redraw restarts a running animation.
- **The event shapes, as text in the pane** (*The hooks*): for each hooked event, a count and
  the last seen field names with their value types, never a value; `tool.check`'s decision and
  `turn.complete`'s reason, which are the engine's words.
- **Usage:** `$.session.usage()`'s rate-limit kinds and percents, and `session.measure`'s.
- **Manifest settings:** one throwaway `userConfig` field in `plugin.json`, to see whether the
  desktop app's plugin manager offers to edit it (decision 6 stands either way; the answer
  closes the PDD's Assumed row). Session 3 removes it.
- **Docs.**
  - `CHANGELOG.md`: 0.2.0, saying the pane shows test drawings for now.
  - `ARCHITECTURE.md`: *Context*'s Built part with what the terminal showed; the desktop's
    results come at Session 3's start.
  - `docs/BACKLOG.md`: nothing, unless a spike is left unanswered.
- **Ask at the start of 2:** whether the owner can install this release and run, in the
  desktop app, one prompt that starts three subagents and one that raises a permission prompt
  inside a subagent, before Session 3.

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - a spawn raised with a fictional description and brief shows the field names and never the
    text (I-03, I-04);
  - the fixture sprites resolve on the desktop surface and are absent on the terminal surface;
  - the pane's redraw is at most once a mock second (N-04's ground).
- After the push: the owner's run in the desktop app, recorded at Session 3's start.

**Watch for:**
- **Field names only.** The spike build is installed and shows in every session; a value
  shown there is the owner's work on screen and in screenshots.
- **The desktop's results exist only after the push,** so they cannot be in this done-note:
  record what the terminal showed, and say the rest waits.
- **A spike hook stays only if a later session needs it** (Session 3 removes the rest).

**Done (2026-11-17, 0.2.0).**
- **Decided with the user:**
  - the block's question: the user will install 0.2.0 after the push and run the two prompts in
    the desktop app before Session 3;
  - 0.1.0 is installed (the handoff's open point);
  - the terminal check runs this session, in the app's Terminal panel, read from there.
- **The spike's memory.** `hooks/spike.ts` keeps the event log in `register`'s closure, not in
  `$.state`. `passOn`'s reader `hear(event)` notes each event there synchronously, so no event
  waits on a write, only the clock redraws the pane, and the state contract is unchanged. The
  log keys each event by name, the engine's word and main or subagent, and keeps:
  - a count;
  - the first and last arrival number;
  - the last input's and result's field names and types.

  Nested keys show only for fields the engine defines and for a tool's arguments, one level
  deep.
- **The view.** `hooks/view/spike.tsx` draws, under a heading and the empty line:
  - the fixture sprites from `hooks/sprites/fixture.ts`, where `e.surface` is not the terminal:
    twenty framed, one image, and the media-query sprite framed and as an image;
  - the plan limits asked for and last measured;
  - the log;
  - the clock's tick count.

  A drawing that fails draws the empty panel.
- **The clock.** `/possums` arms one `$.clock.every(1000)` when it opens or raises the pane; each
  tick calls `$.ui.invalidate('ui.render')`; any close of the pane cancels it.
- **The manifest.** 0.2.0, with one throwaway `userConfig` field, `testSetting`, a boolean
  defaulting to `false`.
- **Tests.**
  - `tests/spike.test.ts` (6):
    - the spawn gate;
    - the sprites on both surfaces;
    - the redraw at once a mock second, with none before the open or after a close;
    - every event's entries, with no fixture value drawn;
    - usage asked and measured;
    - a failed usage call.
  - The engine's stand-in and the shared test values moved to `tests/engine.ts`.
- **Docs.**
  - `CHANGELOG.md` 0.2.0, the README's version line, and the user guide's test view.
  - `ARCHITECTURE.md`'s Built parts: *Overview*, *Context*, *Stack and pins*, *Layout*, *The
    hooks*, *Values*, *Sprites and sets*, *The panel*, *The command and settings*, *Reach* and
    *Packaging*; and the baseline.
- **Amendments:**
  - **The log is keyed by event, word and main or subagent, with arrival numbers;** the block
    asks for one count per event. Amended at plan time, with the user, so `ask` and `allow`
    don't overwrite each other and the order of results shows.
  - **The media-query sprite is drawn twice,** framed and as an image; the block asks for one.
    Amended at plan time, with the user: still sprites will be images.
  - **The spike's values live in memory, not in a `$.state` key** as the handoff assumed.
    Settled at plan time, with the user, for the reasons above.
  - **Sprites follow `e.surface`, not the table.** The plan said "where `Svg` is in the
    table"; the kit's terminal table answers `Svg`. The session's own finding.
  - **The clock is armed inline in the command's hook.** The engine refuses a module that
    passes `$` to a function declared inside `register`. The session's own finding.
  - **The terminal's lower entries were not read** (below). Their answers come from the
    desktop run.
- **Measured** (CLI 2.1.326):
  - the kit:
    - a tool call whose check asks raises its own `tool.check`, then
      `classic.PermissionRequest` (with `agent_id` from a subagent), before its result;
    - the kit's terminal table answers `Svg`, drawing an empty `Box`;
    - a module passing `$` to an inner function does not load;
    - validate checks `userConfig`'s schema (a bad `type` is an error).
  - the terminal, in `claude --plugin-dir mods/possum-squad`, by the user:
    - `agent.spawn`'s and `turn.*`'s field names, as in *Context*;
    - `turn.step`'s usage also carries `ephemeral_5m_input_tokens` and
      `ephemeral_1h_input_tokens`;
    - a spawn's result came back before its agent's first `turn.start`, the agents running in
      the background;
    - `$.session.usage()` and `session.measure` both gave `five_hour` and `seven_day` percents
      on a subscription;
    - `/config` lists "Test setting (does nothing) · possum-squad", and changing it reloads the
      mod, which empties the log and stops the clock while the pane stays open;
    - the pane is cut off when taller than its seat: about fifteen rows inline, and half the
      list docked at full height, where the mouse did not scroll it.
- **Checked by hand:**
  - the user, in the terminal (CLI 2.1.326):
    - the test view draws: the heading, the sprite note, the plan limits, and the first half of
      the event list;
    - the `classic.PermissionRequest` entry showed while the subagent's permission prompt
      waited;
    - the entries for `turn.complete`, `tool.call`, `tool.check` and `session.measure`, and the
      redraw count, were cut off and not read.
  - The desktop app waits for the push and the user's install, at Session 3's start.
- **Falsified,** each failing at its own test:
  - the shape showing string values (the spawn gate and the every-event test);
  - an `Svg` drawn on the terminal, and one framed sprite dropped (the sprites test);
  - the timer at 500 ms, and a close that leaves it running (the redraw test);
  - the measured kinds dropped (the usage test);
  - `tool.call`'s tool name shown (the every-event test).
- **Numbers:**
  - 17 tests (+6), in 3 files: panel 8, pass-through 3, spike 6;
  - `validate` 12 hooks, 5 gating, each with a `.catch`, and 1 state key: all unchanged;
  - calls +`$.clock.every`, +`$.session.usage`, +`$.ui.invalidate`, all on *Reach*'s
    allow-list.
- **Review (`/code-review high`), 8 findings: 8 fixed and 0 skipped.** The user chose to fix
  all eight.
  - **A tool argument named like an engine field showed its nested key names.** The fields to
    open were matched by name on every event, so a `tool.call` argument called `context` or
    `usage` drew the names inside it. Now each event lists the fields its engine defines, and
    `tool.call` opens none.
  - **The clock was never seen working in an engine.** The tick calls `$` from a finished
    `/possums` dispatch; the kit allows it, and the terminal's redraw count was cut off. Recorded
    as unverified in *The panel* and the handoff, first on the desktop run's checklist.
  - **The tick was unguarded.** A redraw that throws now waits for the next tick.
  - **A close that failed beneath left the clock running.** The `ui.close` hook's `.catch`
    now cancels it too.
  - **Three behaviours had no test:**
    - a drawing that fails draws the empty panel;
    - a close by the person stops the clock;
    - a raise starts it.

    Each has one now. The first two run the module's hooks with a `$` of their own, through
    `hooksOf` in `tests/engine.ts`, which the panel tests' close-hook capture now uses too.
  - **The note said "Field names and types only"** while the view shows plan limits and the
    engine's words. It now names what else shows (and avoids a word a fixture holds as a
    value).
  - **The render resolved the table twice;** it now reads `Svg` from the one table.
  - **`sprite()` wrote the `Svg` element twice** to switch one prop; it is one element now.
  - **Falsified,** each failing at its own test:
    - `tool.call` opening `context` and `usage` (the tool-argument test);
    - the tick unguarded (the tick test);
    - the `.catch` not cancelling (the failed-close test);
    - the body not cancelling (the person-close test and the redraw test);
    - a raise not arming (the raise test and the person-close test);
    - no fallback drawing (the fallback test).
  - **Numbers after the review:** 23 tests (+6), in 3 files: panel 8, pass-through 3, spike
    12. `validate` is unchanged.

---

## 3: Panel shell

**Read:** `SPEC.md` §2 decisions 5, 6, 15, 16, 19; `PDD.md` Part 4 *Input & interaction model*,
*Information architecture*, Part 6 *Names that never change*, Part 7 *Key screens & flows*,
*Voice, tone & microcopy*; `ARCHITECTURE.md` *The invariants* (I-03, I-04), *Values: `$.state`
and `$.store`*, *The panel*, *The command and settings*, *Sprites and sets* (the light theme),
*Attention* (Needs you).

- **The spike results, decided with the owner first** (decisions 15, 16):
  - go or stop on SMIL in a pane; if stop, what replaces it (still poses, or the `Client`
    region);
  - how sprites stay readable on the light theme, and whether `motion` `auto` follows the
    reduced-motion query;
  - whether F-12 stays, and on which signal;
  - whether the gallery's 136 sprites animate or are still.
  Each answer goes into `ARCHITECTURE.md`'s Decided part, with a *Decision log* line, and amends
  the later blocks it reaches.
- **The spike view goes:** the fixture sprites, the shape view, the throwaway `userConfig`
  field, and every spike hook no later session needs.
- **`/possums open`, `set`, `settings`** (*The command and settings*), and `prefs` in the store
  through one write function whose payload type holds only setting values and flags (I-03).
- **The row on both surfaces** (*The panel*): `hooks/view/` builds the four-line row with its
  state word from fictional data; the product still shows the empty panel until Session 4.
- **Docs.**
  - `CHANGELOG.md`: 0.3.0.
  - `ARCHITECTURE.md`: the Decided parts above; Built for *Values* (`prefs`), *The command and
    settings*, *The panel* (the row); I-03 and I-04's *Enforced by*.
  - `USER-GUIDE.md`: the commands and settings, replacing the made placeholder.
  - `CLAUDE.md`: the store key `prefs`.
- **Ask at the start of 3:** the four spike questions above.
- **Confirms:** *Values* (`prefs` and its defaults, forward-only reading), *The command and
  settings*.

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - `set` with a good name and value, a bad name, a bad value; `settings` lists every value;
  - `prefs` with an unknown key keeps it on write; an unknown value reads as the default;
  - every store write's payload holds only allowed fields (I-03);
  - a fixture row draws its description only inside `Text`, on both surfaces (I-04), and its
    state word (I-06).

**Watch for:**
- **The spike answers are the owner's,** and each Decided change is logged; do not pick one
  because the code is easier.
- **`prefs` is read and written whole,** across every session the owner has open: read it just
  before writing, never from a copy kept since start.

**Done (2026-11-17, 0.3.0).**
- **Decided with the user:**
  - **The desktop run of 0.2.0,** done by the user at the session's start, from the session's
    steps. Its results are in *Context* and under **Measured** below.
  - **The four spike questions,** each answered as recommended:
    - SMIL goes ahead: a sprite that animates is framed, a still one an image;
    - on the light theme, each sprite's own media query draws the outline where an edge colour
      is under 3:1, and none on the dark theme;
    - `motion` `auto` follows the system's reduced motion through the framed sprite's own
      media query;
    - F-12 stays, beginning on `classic.PermissionRequest` by `agent_id`, so the `tool.check`
      hook goes;
    - the gallery animates, framed.
  - **A finding the session raised from the declarations:** a `tool.call` or `tool.run` hook
    turns off a tool's move to the background and its live output, even as a pass-through.
    The user chose to drop the `tool.call` hook in 0.3.0, and to have Session 4 measure the
    classic tool-use hooks and bring the source back to them.
  - **Confirms,** both confirmed with the plan's approval, unchanged:
    - *Values*: `prefs`, its defaults and forward-only reading;
    - *The command and settings*.
- **The spike removed:**
  - its files: `hooks/spike.ts`, `hooks/sprites/fixture.ts`, `hooks/view/spike.tsx` and
    `tests/spike.test.ts`;
  - from the code: the clock, the usage call, the `userConfig` field, `STRINGS.spike`, and the
    `tool.check` and `tool.call` hooks.
  - The remaining event hooks are plain `next(e)` pass-throughs; `passOn` returns with Session
    4's readers.
- **The command.** `parseWords` (`hooks/settings.ts`) reads the words, and top-level
  functions in `register.tsx` answer them:
  - `showPane` serves the toggle and `open`, which never closes;
  - `listSettings` answers `settings`;
  - `changeSetting` answers `set`;
  - unknown words get the usage line.

  Every answer in words carries `isTextDisplayOnly`. The registration carries an argument
  hint.
- **`prefs`.** `hooks/settings.ts` holds the settings table, `readPrefs` (forward-only) and
  `mergePrefs`. `writeStore`, the one store writer (I-03), reads just before it writes.
- **The row.** `hooks/view/row.tsx` has `RowData`, `terminalRow` and `desktopRow`;
  `hooks/view/format.ts` the numbers and the block bar. `StateId` is in `types/index.d.ts`.
  Nothing in the product draws a row yet.
- **Docs:**
  - `ARCHITECTURE.md`'s Decided parts, each with a *Decision log* line: *Context*, *The hooks*,
    *Sprites and sets*, *The panel* (the gallery) and *Attention*;
  - its Built parts for the same sections and *Values*, *The command and settings*, *Reach*,
    *Packaging*, *Stack and pins* and *Layout*, with I-01, I-03, I-04, I-05 and N-01's
    *Enforced by* and the baseline;
  - `CHANGELOG.md` 0.3.0, the README, the user guide and the mod's `CLAUDE.md`;
  - `docs/BACKLOG.md`'s *Not yet checked by hand*.
- **Amendments:**
  - **Later blocks, for the decisions** (amended at plan time, with the user):
    - Session 4 measures a tool call's source and a subagent's end first, and draws with this
      session's row builders;
    - Session 6 gets the light-theme and reduced-motion styles and their gates;
    - Sessions 7 and 7a get the gallery, animated and framed;
    - Session 10 gets Needs you on the request.
  - **The desktop bar carries the numbers.** The plan put the tokens and time in a `Text` beside
    the app's `Progress`. The kit showed the engine draws a `Progress` as its label and figure
    above a full-width fill, which would squeeze a neighbour, so they ride in its value text.
    The session's own finding.
  - **The row test draws through the test's own hook.** The plan's test plugin cannot see the
    test file: the kit runs an inline plugin's `register` with nothing of the file in scope.
    The session's own finding.
  - **The I-04 test also requires the description and activity whole, in a `Text` of their
    own,** since a `Progress` label becomes `Text` and would otherwise pass. The session's own
    finding.
  - **`hooks/settings.ts` is a file the Decided layout does not name;** the reason is in
    *Layout*'s Built part. Planned with the user.
- **Measured:**
  - The desktop, engine 2.1.325, 0.2.0 installed, by the user:
    - the clock's count rose once a second;
    - twenty framed sprites bobbed with the app smooth, and the image form bobbed too; a
      redraw neither restarted nor stuttered a bob;
    - `prefers-color-scheme: light` followed the app's theme, framed and as an image;
      `prefers-reduced-motion` stopped only the framed one;
    - two asked Bash calls from subagents each raised `tool.check` `ask`, then
      `classic.PermissionRequest`, both back while the prompt waited;
    - no subagent `turn.complete` was listed;
    - `turn.step`'s usage had no `ephemeral_*` fields;
    - the plugin manager listed and changed the `userConfig` field;
    - the field names are in *Context*.
  - The declarations and the kit, CLI 2.1.326:
    - the `tool.call`/`tool.run` hook cost;
    - `tool.run`'s timing;
    - `$.store` not being reactive;
    - `isTextDisplayOnly` holding only on the queued lanes;
    - `Progress` drawn as `Box` and `Text`;
    - an inline test plugin closing over nothing;
    - the import scan accepting a type import from `types/index.d.ts`.
- **Checked by hand:** in the terminal, CLI 2.1.326, `claude --plugin-dir mods/possum-squad`,
  typed by the user and read from the Terminal panel:
  - `/possums settings` listed the four settings with their defaults and values;
  - `set theme horror` answered "theme is now horror.";
  - `set colour red` answered the setting names, and `set theme neon` the theme's values;
  - the engine puts `possum-squad:` before each answer's first line;
  - the pane ended docked and shown with the empty panel.

  The user also typed `/possums open` twice and `/possums` twice. Those print nothing and left
  no row in the transcript, so whether `open` kept the pane shown and the toggle closed it was
  not seen; only the final shown pane was. The desktop waits for the push (`docs/BACKLOG.md`).
- **Falsified,** each failing at its own test:
  - `open` closing a shown pane;
  - `mergePrefs` dropping what was stored;
  - an unknown value read as stored;
  - the spawn hook storing a description (the I-03 test);
  - the description as the bar's label (the I-04 test);
  - a state word left out (the I-06 test);
  - the display-only flag dropped;
  - a `tool.call` hook added back;
  - a setting missing from the list;
  - a copy kept since the first write (the read-before-write test). It passed until the test
    seeded the store, then failed;
  - a bad value stored.
- **Numbers:**
  - 33 tests (+10), in 5 files: command 11, panel 8, pass-through 4, prefs 4, row 6 (spike −12);
  - `validate` 10 hooks (−2), 3 gating (−2), each with a `.catch`, and 1 state key;
  - calls: −`$.clock.every`, −`$.session.usage`, −`$.ui.invalidate`; +`$.store.get`,
    +`$.store.set`, both on *Reach*'s allow-list.
- **Review (`/code-review high`), 10 findings: 10 fixed and 0 skipped.** The user chose to fix
  all ten.
  - **The changelog said answers typed between turns are not sent to Claude,** which nothing
    measured: the declarations read `isTextDisplayOnly` only on the queued lanes. The changelog,
    the user guide and N-01's note now say what is known. The check by hand is in
    `docs/BACKLOG.md`.
  - **This done-note recorded `open` and the toggle as checked by hand,** though the terminal
    showed neither; the hand-check bullet now says what was seen.
  - **The settings list's first line ran into the engine's `possum-squad:` prefix** and
    wrapped. It now starts with a heading, "Possum Squad settings:".
  - **The number formats printed `NaN`** for a value that is not finite. `tokens`, `elapsed`
    and `percent` read it as `–`, the bar draws empty, and the desktop bar's fill (`fill`) is
    empty rather than the one that only spins.
  - **The changelog said a tool's live output was fixed;** the declarations name only a served
    call's. Reworded.
  - **`/possums set` alone answered "There is no such setting".** It now answers "Name a
    setting: …".
  - **The one-line test did not check the details line.** `LONG_ROW` now has a long model, and
    both surfaces' details line is checked.
  - **The parsed `set` carried a derived `change`.** `changeOf` in `hooks/settings.ts` builds
    it at the call.
  - **A comment named buttons that do not exist yet.** It now says what the flags are.
  - **The row tests cast `$.ui.mount` to a local type.** They take the kit's `Engine` now.
  - **Falsified,** each failing at its own test:
    - `tokens` unguarded and `fill` unguarded (the non-finite test);
    - the details line uncut, on each surface (the one-line test);
    - a bare `set` answered as no such setting;
    - the heading dropped (the settings and store tests).
  - **Numbers after the review:** 34 tests (+1), in 5 files: command 11, panel 8, pass-through
    4, prefs 4, row 7. `validate` is unchanged.

---

## 4: Runs

**Read:** `SPEC.md` §2 decisions 12, 13, 14; `PDD.md` Part 4 *Worked examples*, *States & edge
cases*, Part 5 F-01, F-02, F-11, F-23, I-06, Part 6 *Domain model*, *Data lifecycle*, Part 5
*Tunables* (T-06, T-07, T-11); `ARCHITECTURE.md` *Context* (what the desktop showed), *The
invariants* (I-01, I-03, I-05, I-06), *The hooks*, *Values: `$.state` and `$.store`*, *The run
model*, *The panel*.

- **Two measurements first** (amended at Session 3, with the owner):
  - **A tool call's source.** A `tool.call` or `tool.run` hook turns off a tool's move to the
    background and its live output, even as a pass-through, so 0.3.0 hooks neither. Measure, in
    the kit and by hand, whether the classic `PreToolUse` and `PostToolUse` hooks avoid that
    and carry what a row needs (`tool_use_id`, `agent_id`, the tool and its input). Then bring
    the choice to the owner before building on it. Needs you's end signal (Session 10) comes
    with it.
  - **A subagent's end.** The desktop (2.1.325) listed no `turn.complete` from a subagent,
    though two had answered. Measure what marks a subagent's end in both builds before the
    endings are built on `turn.complete`. If it is another event (`classic.SubagentStop`,
    say), bring it to the owner: it changes *The hooks* and *The run model*.
- **`hooks/model/`,** pure: event records in, runs out, per *The run model*: open, re-key,
  ignore unknown loops, resume, teammates, round 2, endings, fresh and cache tokens, context
  percent from `hooks/data/`'s dated window table (T-11).
- **`register.tsx`** turns `agent.spawn`, `turn.start`, `turn.step`, `turn.complete` and a tool
  call's start and end (by the source the owner picks) into records, and writes `runs` through
  `update`; `types/index.d.ts` declares `runs` (its runs carry `StateId`, already declared
  there). A reading guard returns: each pass-through is a plain `next(e)` in 0.3.0.
- **Rows draw** with Session 3's `terminalRow` and `desktopRow` (`hooks/view/row.tsx`), from
  `RowData`.
- **Rows in the pane** under one Running list (sections come in Session 5), with the activity
  line from the last tool call.
- **Reload and clear:** runs survive a reload; `classic.SessionStart` with `clear`, `resume` or
  `fork` redraws from the reset state.
- **Docs.**
  - `CHANGELOG.md`: 0.4.0.
  - `ARCHITECTURE.md`: Built for *The run model*, *The hooks*, *Values* (`runs`); I-06's
    *Enforced by*.
  - `USER-GUIDE.md`: what a row shows and how runs end.
  - `docs/BACKLOG.md`: the reload half of F-23 under *Not yet checked by hand*, if the kit
    cannot reload a module.
- **Confirms:** *The run model* (every rule of how events join to rows, and the endings), *Values*
  (`runs` written only through `update`).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - a spawn then a mount finds a row with that description (F-01);
  - after two model requests the row's fresh tokens equal the stubbed sum, cache reads apart
    (F-02);
  - the four endings, including an empty answer and a refusal (F-11);
  - a turn event that arrives before the spawn's result is kept pending and merges into the
    right row at the re-key; a pending entry no spawn claims is dropped at its loop's
    `turn.complete` and never drawn;
  - a resumed agent returns to its row; a second spawn with a finished run's description is
    "round 2";
  - after a clear-type session start the list is empty (F-23); across a reload, if the kit can
    raise one, the rows stay.

**Watch for:**
- **The agent id arrives only with the spawn's result,** after `next` resolves; the spawn
  input's `model` is the caller's, not the one that runs.
- **A teammate has several `turn.complete`s,** one per turn; it is not finished at the first.
- **`runs` is shared by every hook writing at once:** a read and a later `set` loses updates.
- **Another plugin can read `runs`:** keep in it only what a row needs.

**Done (2026-11-20, 0.4.0).**
- **Decided with the user:**
  - **At the plan:**
    - 0.3.0 was installed;
    - the desktop half is measured with a probe loaded through `CLAUDE_CODE_PLUGIN_DIRS`;
    - N-07 is amended, so event hooks read the time with `$.clock.now()`;
    - the plan has an adversarial review before approval. Its 14 findings were folded in; the
      largest:
      - a workflow's agents share one `tool_use_id`;
      - a refused or agentless spawn must not leave a row;
      - the main loop's events make no `$` call;
      - `view/` may not read `data/`.
  - **After the measurements, each as recommended:**
    - a tool call's start comes from `turn.step`'s `toolUses`, with no new hook, and Needs you
      ends at the agent's next step or its end;
    - a subagent ends on `turn.complete` only;
    - a teammate's turn that ends with no text is Finished;
    - the desktop's end is checked by hand after the push.
  - **Confirms,** both with the picks, unchanged but for the teammate's ending:
    - *The run model*;
    - *Values* (`runs` written only through `update`).
- **Shipped:**
  - **The model.** `hooks/model/runs.ts` turns spawn, turn and step records into `Runs`, and
    `hooks/model/tools.ts` turns a step's calls into an activity. `hooks/data/models.ts` holds
    the dated window table, and `types/index.d.ts` declares `runs` (`runs-1`).
  - **The hooks.** `hooks/register.tsx` records `agent.spawn`, `turn.start`, `turn.step` and
    `turn.complete` through `record`, the reading guard, and empties `runs` on a clear-type
    `classic.SessionStart`.
  - **The pane** draws each run's row, oldest first, with `terminalRow` or `desktopRow`, and a
    round from 2.
- **Amendments:**
  - **Rows open at the spawn's input,** keyed `tool_use_id#agentIndex` for a workflow's agent.
    The plan's finding, from the declarations.
  - **A resume opens nothing at its input,** and returns its row at its result unless refused.
    Same source.
  - **The endings:** a teammate's empty answer is Finished. The user's choice; *The run model*'s
    Decided part is amended and logged.
  - **Round 2 counts only a Finished run,** as Decided words it. A failed or stopped one starts
    round 1.
  - **The probe's desktop half** failed: the desktop app did not load the folder. It became a
    hand check after the push, by the user's choice.
  - **The window table holds Haiku, Opus and Sonnet 5.5 at 1,000,000,** measured, and the same
    as the default; the plan left the default open.
- **Measured** (the details are in *Context*):
  - **The kit, CLI 2.1.329:** `classic.PreToolUse` carries no `agentId`, even for a subagent's
    call.
  - **The terminal,** hermetic, CLI 2.1.329, the user typing:
    - with a pass-through `tool.call` hook live, a Bash command still moved to the background
      with ctrl+b, and a `run_in_background` call still returned at once; likewise with the
      classic hooks;
    - in eight spawns, the agent's `turn.start` came before the spawn's result;
    - every subagent's end was one `turn.complete` with its reason, after `agent.report` and
      `classic.SubagentStop`. The latter also fired for the engine's helpers, and twice for one
      agent;
    - a clear reset `$.state`;
    - `$.agent.list()` gave 1,000,000-token windows.
  - **The desktop,** engine 2.1.326: a plugin folder named by `CLAUDE_CODE_PLUGIN_DIRS` was not
    loaded.
  - **The declarations** were laid again for 2.1.328, then 2.1.329, as the CLI updated itself.
    2.1.329 adds `agent.report` and `tool.offer`; the `tool.call` and `tool.run` remarks and the
    kit are unchanged.
- **Checked by hand,** in the terminal, CLI 2.1.329: `claude --plugin-dir mods/possum-squad`
  with the probe, user settings skipped, typed by the user.
  - ctrl+b still moved a foreground Bash command to the background.
  - Two subagents' rows read their description, model and effort, then "Running ping -c 20
    127.0.0.1" and `ctx 19% · 37k · 0:32`, then finished. That 19% was over the 200,000
    placeholder, replaced by the measured 1,000,000.
  - `/clear` left the empty panel.
  - Not seen: a reload (`docs/BACKLOG.md`), and the desktop (after the push).
- **Falsified,** each failing at its own test:
  - opening at the input, the pending claim, cache reads kept apart, aborted as stopped, the
    teammate's ending, a refused spawn, round 2, the resume, the fork's clear;
  - the workflow key, which passed until the test overlapped the two spawns;
  - the main loop's writes, the guard, T-06 sparing teammates, the pending cap, the target's
    cut, the hand-back hidden, the activity kept out of the bar's label, and no change keeping
    the same object.
  - **The `isDenied` check on a plain spawn's result could not fail,** since a refusal names no
    agent. It was removed, and kept for a resume, where its test fails without it.
- **Numbers:**
  - 64 tests (+30) in 7 files (+2): command 11, model 15 (new), panel 8, pass-through 5 (+1),
    prefs 4, row 7, runs 14 (new);
  - `validate`: 11 hooks (+1 `classic.SessionStart`), 4 gating (+1), each with a `.catch`;
    2 state keys (+`runs`);
  - calls: +`$.clock.now`, on *Reach*'s allow-list.
- **Review (`/code-review high`), 9 findings: 9 fixed and 0 skipped.** The user chose to fix
  all nine.
  - **A spawn whose engine call rejects** had no test of its own. A test now runs the spawn hook
    with a rejecting `next`: the row it opened is gone, and the failure goes on.
  - **Two UI tests drew the terminal alone,** the teammate's and the clear's kept half. Both
    loop over the surfaces now, as the root `CLAUDE.md` asks.
  - **The handoff did not record Session 10's amended end signal,** as `SESSIONS.md`'s header
    asks. It does now.
  - **The pane's drawing had no fallback:** a refused state read or clock call would have put
    the engine's error in its place. A refused state read now draws the empty panel, and a
    refused clock the times as `–`.
  - **A resume that opens a row took a round from its description,** so a resumed agent could
    read "round 2". It now starts in round 1.
  - **`Pending.isWorking` was always true;** it is gone, and a claimed row is Working.
  - **`Activity.at` was written and never read;** it is gone, and so is `Pending.at`. Pending
    entries keep their insertion order, and the oldest is dropped first.
  - **Each subagent step waited on a clock read** beside the state's read and write. `record`
    no longer reads the clock; `recordAt` does, for a spawn and an end alone.
  - **The done-note named the edit to the user's settings,** which the root `CLAUDE.md` keeps out
    of done-notes. It now records only what was measured.
  - **Falsified,** each failing at its own test:
    - the rejected spawn's settling dropped;
    - the clock's fallback and the state's fallback each removed;
    - a resume's round taken from its description;
    - the newest pending entry dropped first.
  - **Numbers after the review:** 67 tests (+3), in 7 files: command 11, model 15,
    panel 8, pass-through 5, prefs 4, row 7, runs 17 (+3). `validate` is unchanged.

---

## 5: The Lead, header and sections

**Read:** `SPEC.md` §2 decisions 17, 18; `PDD.md` Part 4 *Information architecture*, *States &
edge cases*, Part 5 F-02, F-03, F-04, F-09, F-22, N-03, Part 7 *Key screens & flows*;
`ARCHITECTURE.md` *The hooks* (`session.measure`), *Values: `$.state` and `$.store`* (`lead`),
*The run model*, *The panel*, *Testing strategy*.

- **The Lead** from `session.measure` and `$.session.usage()` at start; `lead` declared in
  `types/index.d.ts`.
- **The header:** the Lead row and the session line; totals over the Lead and every run.
- **Sections** in their order; Finished collapsed by default with its show button
  (`prefs.finishedOpen`); the latest T-06 kept.
- **The one-second clock** (*The panel*): armed only while a run is working and the pane is
  shown; re-armed at `session.start` after a reload.
- **The terminal complete:** every section and number as text rows, coloured state marks,
  block bars, no `Svg`.
- **Docs.**
  - `CHANGELOG.md`: 0.5.0.
  - `ARCHITECTURE.md`: Built for *The panel* and *Values* (`lead`).
  - `USER-GUIDE.md`: the panel's layout.
  - `CLAUDE.md`: the state key `lead`.

**Gates:**
- `npm run verify -- possum-squad`, with these tests, each over both surfaces:
  - with a mock clock, a working row reads 0:03 after three seconds (F-02);
  - the header total equals the Lead plus the rows (F-03);
  - a fixture with a run in each state draws the sections in order, empty ones left out (F-04);
  - with no agents the pane shows the Lead with a context figure from stubbed usage (F-09);
  - the terminal tree holds no `Svg` and validates (F-22);
  - no timer while the pane is closed or nothing runs (N-03).
- After the push, the owner runs three agents and compares the panel with the transcript;
  recorded at Session 6's start.

**Watch for:**
- **A reload cancels timers,** and `session.start` fires again after it: arm once, never twice.
- **`session.measure` fires after the main session's turns,** not a subagent's: a row's numbers
  come from its own events.

**Done (2026-11-20, 0.5.0).**
- **Decided with the user:**
  - **At the plan:**
    - 0.4.0 was installed, and its rows showed and ended in the desktop app;
    - the Lead's tokens and time come from the main session's `turn.complete`, one `lead` write
      per main turn; `session.measure` carries no running token count;
    - the header's time is total work time: the Lead's turns plus every run's time;
    - the plan has an adversarial review before approval. Its 13 findings were folded in; the
      largest:
      - a timer the engine ends goes silently, so the clock is armed only from dispatches that
        are not drawings, and a drawing clears a dead one;
      - `session.start` awaiting `$.session.usage()` and `$.ui.panes()` would break N-07;
      - a clock stopped while the pane is hidden leaves its times frozen once it shows;
      - three planned checks could not fail as written.
  - **After the review, each as recommended:**
    - no seed at start: N-07 stays, and the Lead's context reads "–" until the first reply;
    - the clock runs while the pane is open, and redraws only while it is shown.
- **Shipped:**
  - **The model.** `hooks/model/lead.ts` keeps the Lead from measures and main turns, and gives
    the header's totals. `runs.ts` keeps what pruned runs counted in `past`.
    `types/index.d.ts` declares `lead` (`lead-1`), and `runs` moves to `runs-2`.
  - **The view.** `hooks/view/panel.tsx` draws the header and the sections, Finished with its
    show button; `hooks/view/lead.tsx` draws the Lead row on each surface, and the session line.
    `runsPanel` is gone, and `runs.tsx` is `runs.ts`.
  - **The hooks.** `session.measure` and the main session's `turn.complete` record the Lead, and
    a clear-type `classic.SessionStart` resets it. The one-second clock lives in module memory.
    `/possums set` and the show button redraw the pane.
- **Amendments:**
  - **No `$.session.usage()` at start.** The owner's choice, after the review: it would have
    broken N-07. F-09's test stubs `session.measure` instead.
  - **The clock runs while the pane is open,** not only while it is shown. The owner's choice;
    *The panel*'s Decided part is amended and logged.
  - **The main session's `turn.complete` writes `lead`.** Session 4's handoff kept every
    main-loop event free of `$` calls; the owner's choice narrows that to `turn.start` and
    `turn.step`.
  - **A subagent's steps arm the clock too,** not only its spawn and turn start. A subagent's
    turn starts once per run, so a timer the engine ended would otherwise stay gone. Found by
    the test of that case.
  - **`runs` gains `past`,** under a new shape tag, so the header's totals keep what pruned runs
    counted. The plan's, from the block's "the latest T-06 kept".
- **Measured,** the kit on CLI 2.1.329 (the details are in *Context*):
  - each test loads the module afresh;
  - a timer armed in an event hook beats after the hook returns;
  - a refused period ends an interval silently, and a plugin hooking `clock.every` sees one
    period more than the beats;
  - a state write's redraw lands at the redraw rate on the mocked clock;
  - state versions are numbered across the test file;
  - a plugin's logs are not shown.
- **Checked by hand,** in the terminal, CLI 2.1.329: `claude --plugin-dir mods/possum-squad`,
  typed by the user, in two sessions.
  - The Lead read its context and tokens after the first reply. The session line totalled the
    Lead and the rows: 46k was the Lead's 22k and the run's 24k, and 1:20 the run's 1:13 plus
    the main turns.
  - Running, then Finished with `[ show ]`. A press opened it, and the choice held in the next
    session.
  - A subagent running `ping -c 70 127.0.0.1`, with no other event: its time ticked every
    second; closing and reopening the pane kept the times right; they stopped at its end.
  - **Found:** a subagent that started `sleep 90` in the background, then ended its turn to wait
    on it, read "finished", while Claude Code listed it as waiting on a shell. Its turn's end is
    the ending Session 4 chose. Whether its row went back to working when the shell ended was
    not seen. It is the user's to decide (`docs/BACKLOG.md`).
  - Not seen: a reload, and the desktop (after the push).
- **Falsified,** each failing at its own test:
  - the Lead: any number counted, a zero window taken, no percent from tokens, a malformed turn
    counted;
  - the totals: `past` left out of them, forgotten at a prune, kept by a clear;
  - the panel: Running hidden when empty, the sections out of order, Finished never folded, the
    session line above the Lead, an `Svg` drawn in the terminal;
  - the hooks: a measure or a main turn not recorded, the show button or `/possums set` not
    redrawing, the show button writing other text, the guard gone from `recordLead` and from
    `session.start`'s arming;
  - the clock: never armed at a spawn or turn start, armed while closed, armed with nothing
    live, left running at a close, at the last run's end and at a clear, beating on with no
    pane, armed twice, stopped while hidden, redrawing while hidden, a dead timer kept, steps
    never arming.
  - **Four checks could not fail as first written,** and were changed until they did:
    - F-22's, since the kit's terminal answers `Svg` with an empty `Box`: it now draws with
      that table stripped of `Svg`;
    - the clock's stops, since the beat's own checks stop it one beat later: the tests count
      the beat's looks at the panes, and the clear has a test with no pane drawn;
    - arming twice, which the generation check made inert: the test counts periods;
    - a malformed main `turn.complete` in the pass-through test, which the engine refuses
      before the hook records: that assertion was dropped, and the model test holds the rule.
- **Numbers:**
  - 89 tests (+22) in 9 files (+2): clock 10 (new), command 11, header 8 (new), model 19 (+4),
    panel 8, pass-through 5, prefs 4, row 7, runs 17;
  - `validate`: 11 hooks, 4 gating, each with a `.catch`; 3 state keys (+`lead`);
  - calls: +`$.clock.every` and +`$.ui.invalidate`, both on *Reach*'s allow-list.
- **Review (`/code-review high`), 8 findings: 8 fixed and 0 skipped.** The user chose to fix
  all eight.
  - **A beat never marked the pane open.** After a reload with the pane hidden, a beat found
    the pane but left the flag unset, so once that timer stopped no later run armed one. The
    beat now marks the pane open or closed by what it finds.
  - **Opening the pane with a run already live** armed the clock untested. Two tests cover it
    now.
  - **`/possums open` on a shown pane** returned before arming, so it could not restart a timer
    the engine had ended. Any `/possums` or `/possums open` with a run live now starts a fresh
    timer.
  - **A drawing whose read of `runs` was refused** stopped the clock. It now leaves it alone.
    No kit test could fail on it: with the old code too, the kit's clock beat on after such a
    drawing, for a reason not found. Recorded under *Known debt*.
  - **`recordLead` read the Lead before its `update`,** a second read on every main turn's end
    to save a rare redraw. It is a plain `update` now.
  - **The changelog and user guide promised** a hidden pane catches up within a second, which no
    hand check saw. They now say what the code does, and `docs/BACKLOG.md` holds the check.
  - **Two comments:** `SECTIONS` said Running is drawn even when empty, which holds only once a
    run exists; the clock's three-line comment is one line, its generation's why on its own.
  - **Falsified,** each failing at its own test: the beat leaving the flag, opening never
    arming, `/possums open` keeping a dead timer.
  - **Numbers after the review:** 92 tests (+3), in 9 files: clock 13 (+3), command 11,
    header 8, model 19, panel 8, pass-through 5, prefs 4, row 7, runs 17. `validate` is
    unchanged.

---

## 6: Sprites

**Read:** `SPEC.md` §2 decisions 5, 9, 15, 17; `PDD.md` Part 6 *Sprites*, Part 7 *Visual
direction*, *Motion & feedback*, Part 8 *Stack & architecture* (Drawing, Art source, Art tool),
Part 5 F-21, N-02, N-06, T-01, T-02; `research/art/manifest.json` and `research/sprites/` (the
recipes' reference); `ARCHITECTURE.md` *Layout and boundaries*, *Sprites and sets*, *The panel*,
*Testing strategy*.

- **Before anything:** the repo-level round that teaches the gate `tools/` is committed. If it
  is not, this session swaps with Session 8, logged as an amendment in both blocks (amended at
  Session 8's plan, with the owner: it was not, so Session 8 ran first and released 0.6.0).
- **`art/`,** seeded from `research/art/`: the PNGs copied unchanged; `manifest.json` and
  `palette.json` copied, then formatted with `npx biome format --write`, their content
  unchanged.
- **The converter** in `tools/`: reads `art/`, writes `hooks/sprites/data.ts` (palette indices
  and layers for every set, recipes, costume names), Biome-clean; run by the session, its output
  committed.
- **The compositor, the SVG writer and the cache** in `hooks/sprites/`; `classic` drawn in
  every state's still pose and in the work loop; `motion` `off` writes no animation element.
  As decided at Session 3 (*Sprites and sets*; amended at Session 3, with the owner):
  - each sprite carries a `prefers-color-scheme: light` style that draws the one-pixel outline
    for its edge colours under 3:1 against the light background;
  - with `motion` `auto`, an animated sprite also carries a `prefers-reduced-motion: reduce`
    style that hides the animation and shows its still pose;
  - an animated sprite is drawn framed (`isInteractive`), a still one as an image.
- **Rows draw their sprite** on surfaces where `Svg` resolves (decision 17), in
  `desktopRow`'s leading slot, which holds the state's mark until then (amended at Session 8's
  plan, with the owner: Session 8 ran first, so each row wears its run's role, `run.role`, and
  draws the plain opossum while the role is unsettled). (Amended at Session 6's plan, with the
  owner: the Lead's sprite and the empty panel's sleeping squad come too, Decided in *The
  panel*.)
- **Docs.**
  - `CHANGELOG.md`: 0.7.0 (amended at Session 8's plan).
  - `ARCHITECTURE.md`: Built for *Sprites and sets*, *Layout and boundaries* (`art/`, `tools/`),
    the converter's row of *Testing strategy*.
  - `CLAUDE.md`: how to run the converter.
- **Confirms:** *Sprites and sets* (layers, recipes, SVG, the cache), *Layout and boundaries*
  (`tools/` imports nothing from `hooks/`).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - every role and state of `classic` is under 16,000 characters (N-02; amended at Session 6's
    plan, with the owner: `planned`, reserved in `StateId`, is drawn with Session 7's gallery);
  - with `motion` off no `Svg` source holds an animation element (F-21);
  - sprites stay readable on the light theme (N-06): every edge colour under 3:1 against the
    light background is outlined inside the light-theme style, and no outline is drawn outside
    it (amended at Session 3, with the owner);
  - an animated sprite holds the reduced-motion style with its still pose and is framed, and a
    still one is neither (F-21; amended at Session 3, with the owner);
  - `data.ts` holds every layer `manifest.json` names (the converter's own checks are what the
    repo-level round decides).

**Watch for:**
- **`research/` is input:** copy from it, never edit it.
- **The kit's JSON is not Biome's shape** (one-space indents, one value per line): copied as it
  is, `art/manifest.json` and `art/palette.json` fail `format`. Format the copies; the frozen
  originals under `docs/` are not read by Biome.
- **The generated file must come out Biome-clean,** or `format` fails on a file no one wrote by
  hand.
- **One `Svg` source holds at most 131,072 characters,** and every sprite needs `alt`.


**Done (2026-11-22, 0.7.0).**
- **Decided with the user:**
  - **At the start:** the repo-level round for `tools/` had closed (`docs: close round 2`), so
    this session ran as planned. 0.6.0 was installed, and roles showed on the desktop app's
    rows; the backlog item is gone.
  - **At the plan:**
    - **The SVG shape.** Each run of a row is a rectangle written as a subpath of one `<path>`
      per colour. As `<rect>` elements, an animated sprite with its reduced-motion copy and
      outline measured about 17–18k characters for the largest classic roles, over N-02. At the
      owner's request a second model weighed it, and agreed: it set aside `<use>`, never seen
      on the desktop, and CSS over SMIL, unverified.
    - **The Lead's sprite and the empty panel's sleeping squad** come now, Decided in *The
      panel* but not in the block.
    - **`failed` turns rows 3..29 over,** not 7..29: 11 of the 68 outfits reach above row 7,
      the highest to row 3, and would lose their hats. It holds no prop, as the reference drew
      it. `art/manifest.json`'s recipe text says so, changed after the unchanged seed.
    - **The plan had an adversarial review** (the same second model). Its findings were folded
      in; the largest:
      - an outline drawn per part, each beneath its own fills, painted over the parts drawn
        before it, up to 40 wrong pixels a frame; each step's outline is now its own, exactly;
      - Biome's line-fit rule landed on real layers (the joey, two 3- and 4-row props); a
        layer's rows are now a template literal, which Biome leaves alone;
      - the converter refused a set lacking a role, though a role a set lacks falls back
        (Decided); only the default set must be whole;
      - `planned`, reserved in `StateId`, greyed inside `opacity` would put its outline under
        3:1; it goes to Session 7's gallery;
      - a stored unknown role must draw plain, never throw inside the drawing.
  - **At the docs:** *Sprites and sets* and *Layout and boundaries* confirmed as built.
- **Shipped:**
  - **`art/`,** the round's `research/art/`: 141 PNGs unchanged (`cmp`), `manifest.json` and
    `palette.json` formatted with their content unchanged (deep-equal), then `failed`'s flip.
  - **The converter,** `tools/art.ts`, with `tools/png.ts` (reads 8-bit RGBA PNG, and writes it
    for the specs), their specs, and `tools/fixtures/art.ts`, a fictional art folder as data,
    written to a temporary folder by the spec. It writes `hooks/sprites/data.ts`: four sets, 68
    roles, four extras, about 87k characters, Biome-clean as written.
  - **`hooks/sprites/`:** `types.ts`, `data.ts`, `compose.ts`, `recipes.ts`, `svg.ts` and
    `index.ts` (the cache, `dressOf`'s fallback, and the squad). T-01 and T-02 in
    `hooks/config.ts`.
  - **The view:** `hooks/view/sprite.tsx`; `RowData.roleId`; `panel` gives each row, the Lead and
    the empty panel its sprite off the terminal, with `prefs.motion`, in `classic`;
    `STRINGS.sprite` holds the alts.
- **Readings settled within scope:**
  - each state's still pose is its manifest recipe's frame: `starting` and the Lead are idle,
    `quiet` the blink, `stopped` the startled frame (7a's animation ends on idle instead);
  - the prop follows the compose order (none under an extra) and is never held on its back; the
    plain opossum is the body alone;
  - the light panel is the reference's `#f8f6f0`, the outline `#464650`, from four neighbours;
    the same 15 colours fall under 3:1 against `#f8f6f0`, `#faf9f5` and `#ffffff`;
  - the work loop is 20 steps of T-01, the bob on odd steps and the blink on step 18; every
    animation is a discrete `animateTransform` or `animate opacity`, with step 0 in its
    attributes;
  - the tongue sits by the nose's row as the flip moves it.
- **Amendments:** in Session 6 (the Lead and the squad; `planned` to Session 7) and Session 7
  (`data.ts` already holds the four sets and the fallback; `planned`'s greying to the owner
  first).
- **Measured** (CLI 2.1.330, Node 26.7.0):
  - sizes over all four sets: a still pose 1.6k–3.4k characters, the work loop at most 8.7k,
    the squad 5.0k;
  - in the kit, all 288 classic looks from a cold cache in 167 ms, one work loop in 3.5 ms;
  - `validate` unchanged: 11 hooks, 4 gating each with a `.catch`, 3 state keys, the same calls.
- **Checked by hand:**
  - **every classic pose,** still and the loop's first frame, on dark and on a forced light
    theme, drawn by Quick Look from a scratch page: outfits, sign, "z", "!", the hats kept on
    their backs, and the outline only round pale edges;
  - **in the terminal,** `claude --plugin-dir mods/possum-squad` (CLI 2.1.330), driven by the
    session: `/possums` docked the Lead, the session line and the empty panel's line, text only;
    one Explore agent's row read "finished", Scout, its activity and its block bar, as before.
  - **Found:** detached `screen` 4.0.3 gave empty or stale hardcopies after a `width` command;
    attached in a Terminal-panel tab with `-U`, it read cleanly (`CLAUDE.md`, *Watch for*).
  - Not seen: the desktop (after the push; `docs/BACKLOG.md`).
- **Falsified,** each failing at its own test, 26 breaks: the bob leaving the seam row; the flip
  off by one; the eyes closed over the outfit; the contrast threshold at 2; the outline on the
  dark query; the loop's outline from step 0; a reduced-motion copy of another frame; animation
  with motion off; the size budget; the blink on a bob step; an unknown role throwing; a prop
  under an extra; a prop on its back; no Lead sprite; the description in the alt; a row dropping
  its role id; partial alpha accepted; every set made to be whole; a colour allowed twice; an
  unknown body read as none; Paeth's third choice; a stale `data.ts`; a role the strings name
  and the art lacks; a worded mark not drawn; a sprite on the terminal; a set left out of
  `data.ts`.
  - **Four could not fail as first written:**
    - the fixture's rows 26 and 27 were the same, so a seam row left unbobbed looked right; the
      seam row is distinct now;
    - `recipes.ts` hid the prop beside an extra, which the compositor already does; the copy is
      gone, and the compositor's branch is the one broken;
    - the PNG spec wrote and read with the module's own predictor, so a wrong one round-tripped;
      a Paeth encoding written apart in the spec, with a pixel that reaches the third choice,
      catches it (the first break, a tie, changed nothing);
    - the kit's terminal draws an `Svg` as an empty `Box`; the terminal checks count those.
- **Numbers:**
  - 141 tests (+19) in 14 files (+3): clock 13, command 11, compose 8 (new), header 8, model 28,
    pane-sprites 3 (new), panel 8, pass-through 5, prefs 4, roles 9, row 7, runs 17, settle 12,
    sprites 8 (new);
  - the tools' specs: 10 in 2 files (new), art 6, png 4;
  - `validate` unchanged; the gate green on CLI 2.1.330.
- **Review (`/code-review high`), 7 findings, all minor: 7 fixed and 0 skipped.** The user chose
  to fix all seven.
  - **The converter** now refuses a flip whose move puts a row off the canvas, an extra larger
    than the canvas, a title or costume with a line break or control character (it would end
    the quoted string in `data.ts`), and a layer path that leaves `art/`.
  - **Sets, roles and poses are looked up by their own keys,** so a stored `constructor` draws
    plain instead of throwing in the drawing.
  - **A comment said "for now":** it states the present.
  - **The pane tests loop over both surfaces,** as the root `CLAUDE.md` asks; the empty-`Box`
    stand-in is counted on the terminal only, since the desktop draws real empty `Box`es.
  - **Falsified,** each failing at its own case or test: each of the four converter checks
    removed; `in` for the own-key lookup; a sprite on the terminal, no row sprite and motion off
    animating, against the reworked pane tests.
  - **Numbers after the review:** 141 tests in 14 files, unchanged (the inherited names join
    `sprites.test.ts`'s plain-opossum test); the tools' specs 10 in 2 files, with four more broken
    inputs; `validate` unchanged.

---

## 7: Sets and gallery

**Read:** `SPEC.md` §2 decisions 5, 15; `PDD.md` Part 6 *Roles and outfits*, *The other sets*,
*Sprites*, Part 5 F-26, F-27, N-02, N-05; `ARCHITECTURE.md` *Sprites and sets*, *The panel* (the
gallery), *The command and settings*, *Testing strategy*.

- **The other three sets** in `data.ts`; `/possums set theme` redraws at once; a role a set lacks
  falls back to `classic`; costume names per set. (Amended at Session 6's plan, with the owner:
  `data.ts` already holds all four sets and their costume names, as Session 6's gate required,
  and `dressOf` already falls back; this session draws `prefs.theme` and adds F-27's tests.)
- **`/possums roles`:** the gallery of 17 roles in 8 states, with role and costume names, on both
  surfaces (text on the terminal), in Session 6's still poses; Session 7a animates it, framed,
  as decided at Session 3 (amended at Session 3, with the owner). (Amended at Session 6's plan,
  with the owner: `planned`'s pose comes here. Greyed inside `opacity`, as the manifest's words
  suggest, its outline falls under 3:1, so how it is greyed goes to the owner first.)
- **Docs.**
  - `CHANGELOG.md`: 0.8.0 (amended at Session 8's plan).
  - `ARCHITECTURE.md`: Built for *Sprites and sets*, *The panel* (the gallery), *The command and
    settings* (`roles`).
  - `USER-GUIDE.md`: themes and the gallery.

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - every set has 17 outfits, 17 props and 17 costume names; switching `theme` changes every
    sprite and no role name; a fictional two-role set falls back to `classic` for the other 15
    (F-27);
  - every role and state of every set is under 16,000 characters (N-02);
  - the gallery holds 17 roles and 8 states on both surfaces (F-26).
- N-05 timed by hand: building the tree for 20 rows, recorded in the done-note.


**Done (2026-11-23, 0.8.0).**
- **Decided with the user:**
  - **At the start:** 0.7.0 was not yet looked at in the desktop app; the backlog item stays,
    and 0.8.0's sets and gallery join it.
  - **`planned`'s greying** (the amendment's question): faded with the outline outside. The
    fills are greyed (70% luma, 30% colour) inside one `<g opacity="0.55">`; the light theme's
    outline is drawn outside it at full strength, around every colour faint as it is seen
    faded over `#f8f6f0` (29 of 32). The manifest's recipe stands. Set aside: greyed only (it
    drops the fade), and a fade baked per theme (exact only on the reference's panels, twice
    the size).
  - **At the plan, as readings within scope:** the gallery shows still poses (`motion` `off`,
    so 136 images, none framed), since the block says Session 6's still poses and 7a animates
    it; it replaces the sections, not the header; `planned` is a pose, not a run state
    (`StateId` unchanged); a `close` button ends it, and so does any close of the pane;
    `/possums roles` opens or raises, never closes; a costume name falls back with its outfit.
- **Shipped:**
  - **Sprites:** `Pose` gains `planned`; `COLOURINGS` in `recipes.ts` draws the manifest's
    `greyed`; `svg.ts` gains `greyed`, `seenOver` and a faded still; `index.ts` gains
    `costumeOf` and `galleryOf`, with `dressOf`'s fallback.
  - **The theme drawn:** `drawPane` passes `prefs.theme`; `/possums set theme` already redrew.
  - **The gallery:** `/possums roles` (`parseWords`, `showGallery`), `view` at `view-2` with
    `isGalleryOpen`, `hooks/view/gallery.tsx` (one builder per surface), `panel`'s
    `PanelActions`, `COLOURS` exported with `planned`, and the strings (hint, usage, `planned`,
    the gallery's).
  - **Docs:** `CHANGELOG.md` 0.8.0; `ARCHITECTURE.md` Built for *Overview*, *Layout*, *The
    hooks*, *Values*, *Sprites and sets*, *The panel*, *The command and settings*, *Reach*,
    the testing table, a known-debt line, the baseline and a Decision log line;
    `USER-GUIDE.md` (sets, the gallery, `roles`, the `theme` row); `README.md`; the mod's
    `CLAUDE.md` (`roles`, `view-2`); `docs/BACKLOG.md`.
- **Readings settled within scope:**
  - a close of the pane writes `view` only when it changes it (the gallery open, or the
    person's close), so the standing test that the mod's own close writes nothing holds;
  - a refused write of the gallery's flag answers `cannotToggle` and opens nothing;
  - a surface that draws no `Svg` gets the state's mark in each gallery cell.
- **Measured** (CLI 2.1.330):
  - **N-05,** in the kit from a scratch copy of the mod: the pane's tree for 20 rows, desktop,
    0.21 ms median of 200 (max 1.0 ms) with the sprites cached; the first build, writing its
    20 sprites, about 32 ms (known debt); the terminal's 0.18 ms. The gallery's first draw of a
    set, writing 136 sprites, about 43 ms, then 0.33 ms;
  - the test run grew from 1.7 s to 4.1 s with the sprite checks over all four sets;
  - `validate` unchanged: 11 hooks, 4 gating each with a `.catch`, 3 state keys, the same calls.
- **Checked by hand:**
  - **in the terminal,** `claude --plugin-dir mods/possum-squad` driven through `screen`:
    `/possums roles` drew the text gallery (its copy's stored theme was `horror`: "Roles ·
    Horror", "Lead Vampire count"); `/possums set theme prehistoric` redrew it at once ("Tribe
    chief"); `/possums` twice closed the pane and opened it on the list. The copy's theme was
    set back as found. Not done: pressing `close` from the keyboard, since ctrl+x then tab
    through `screen` did not move the focus (`docs/BACKLOG.md`);
  - **by Quick Look,** every set's gallery poses on dark and on a forced light theme; steampunk
    dark, horror light, prehistoric dark and classic light looked at in full: eight states a
    role, `planned` greyed and faded, outlined on light alone;
  - not seen: the desktop (after the push; `docs/BACKLOG.md`).
- **Falsified,** each failing at its own test, 21 breaks: the pane drawing the default set;
  a costume with no fallback; the outline inside the fade; faintness judged unfaded; a gallery
  lacking `quiet`; gallery sprites animated and framed; a close keeping the gallery; `roles`
  toggling; a row's role name changing with the set; a gallery's role name changing with it; a
  refused flag ignored; `planned` not greyed; no fallback to the default set; a set lacking a
  role (a key renamed in a copy of `data.ts`, put back); the cache ignoring the set; a `close`
  that does nothing; the terminal drawing the desktop's gallery; an unknown set's own title; the
  colouring's word renamed; the terminal's gallery without costumes; `roles` not parsed.
  - **One check could not fail as first written:** the gallery test built its expectations
    from the module's own `GALLERY_STATES`, so a state missing there would have gone unseen;
    it now names the motion table's eight states itself.
- **Numbers:**
  - 154 tests (+13) in 16 files (+2): clock 13, command 11, compose 8, gallery 6 (new), header
    8, model 28, pane-sprites 3, panel 8, pass-through 5, prefs 4, roles 9, row 7, runs 17, sets
    6 (new), settle 12, sprites 9 (+1);
  - the tools' specs unchanged: 10 in 2 files;
  - `validate` unchanged; the gate green on CLI 2.1.330.
- **Review (`/code-review high`), 6 findings, 1 important and 5 minor: 6 fixed and 0 skipped.**
  The user chose to fix all six.
  - **The gallery was redrawn every second** while a run was live: each beat sent its 136
    sprite sources again, about 400k characters, for the header's time alone. The beat now
    leaves the gallery undrawn; the header's time moves on events until it closes.
  - **A refused open kept the gallery's flag,** so a later `/possums` opened on the gallery;
    `showGallery` clears it when the pane cannot be shown.
  - **The terminal gallery ran role and costume together** ("Bug catcher Monster hunter"): a
    dim `·` now sits between them.
  - **The docs called `planned` sitting;** it is the standing idle frame, greyed and faded.
  - **`greyed`'s comment claimed the reference's exact sums;** it rounds where the reference
    truncates, and the fade is the drawing's opacity. The comment says "after" it.
  - **No test held a person's close clearing the gallery:** the close-hook test now opens it
    first, for each origin, and for a refused close.
  - **Falsified,** each failing at its own test: the beat redrawing the gallery; the refused
    open keeping the flag; no separator; the person's close keeping the gallery.
  - **Numbers after the review:** 157 tests (+3) in 16 files: gallery 8 (+2), panel 9 (+1);
    the tools' specs and `validate` unchanged.

---

## 7a: State animations

Split from Session 7 at the intake's review: the sets, the gallery and every state's animation
were too much for one chat.

**Read:** `SPEC.md` §2 decision 15; `PDD.md` Part 7 *Motion & feedback*, Part 5 F-08, F-21,
N-02, N-04, T-01; `research/sprites/` (each recipe's reference); `ARCHITECTURE.md` *Sprites and
sets*, *The panel*, *Testing strategy*.

- **Every state's animation** as its recipe, on every set: arrival and the dressing hop, the
  work loop, the sign, the doze, the cheer then sleep, playing dead, the startle; each with its
  still form for `motion` `off`. (Amended at Session 8's plan, with the owner: the hop comes
  here whole from Session 8, which ran before the sprites. A role often settles while its run
  is already working, and `runs` does not say when; every settle now has the time, so this
  session adds the moment to `Role`, with its own shape bump.)
- **The gallery animates, framed,** as decided at Session 3 (amended at Session 3, with the
  owner). Only twenty frames were measured at once: the owner's look after the push says
  whether 136 stay smooth, and if not, the choice returns to the owner.
- **Docs.**
  - `CHANGELOG.md`: 0.9.0 (amended at Session 8's plan).
  - `ARCHITECTURE.md`: Built for *Sprites and sets*.
- **Confirms:** *Sprites and sets* (the recipes, SMIL in steps of T-01).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - for each state, the sprite holds that state's frames, and with `motion` off no animation
    element (F-08's art, F-21);
  - every animated sprite of every set is under 16,000 characters (N-02);
  - with three agents working, at most one invalidation per mock second (N-04).
- After the push, the owner reviews each set in the gallery on the desktop app (H6); a set not
  ready is cut whole (decision 5); what goes to polish is listed in `docs/BACKLOG.md`.

**Watch for:**
- **One-shot recipes** (finished, stopped) settle on their own. The desktop run showed a
  once-a-second redraw neither restarting nor stuttering a running bob; a one-shot that has
  settled is still checked by hand.


**Done (2026-11-23, 0.9.0).**
- **Decided with the user:**
  - **At the start:** 0.7.0 and 0.8.0 were not yet looked at in the desktop app; the backlog
    item stays, and 0.9.0 joins it.
  - **`stopped` with `motion` `off`** (and the reduced-motion copy) stays the startled frame, the
    art's own pose; its animation settles idle, as the recipe says. Set aside: idle in both.
  - **The gallery's one-offs repeat:** each plays, rests 10 steps (2 s) and plays again. Set
    aside: once when the gallery opens.
  - **The arrival plays in a row's first moments whatever its state,** cued by its start time:
    `starting` lasts milliseconds. Set aside: only while starting.
  - **Readings at the plan:** `failed` stays still (its recipe); in rows a one-off plays only
    around its moment, never on a remount; the ending carries the outfit when the role settles
    at the end, so no hop precedes a cheer.
  - **Confirms:** *Sprites and sets* confirmed as built.
- **Shipped:**
  - **The moment a role settles:** `Role.at` (`types/index.d.ts`), stamped at the spawn, a step
    (`Step.at`, passed by the `turn.step` hook) and the fallback; a pending role keeps its
    step's; `runs` at `runs-4`.
  - **The recipes** (`recipes.ts`): `Moment`; `HOP`, `SLIDE`, `CHEER_HOPS`, `Z_RISE`,
    `STARTLE_STEPS`, `REST_STEPS`, `BOB_PACE`, `MOMENT_STEPS`; `bobLoop`, `arrival`,
    `dressing`, `cheer`, `startle`, `then`, `repeated`, `playable`, `animationOf`; `SETTLED`
    and `settledFrame` (`stopped` stands once its startle is over). `Loop` gains `once`.
  - **The writer** (`svg.ts`): `animated` writes each attribute's steps played once, then held
    (`fill="freeze"`) or looped (`begin`, `repeatCount="indefinite"`); `once` 0 is byte for
    byte 0.8.0's output (all 360 looks it drew, compared).
  - **The cache** (`index.ts`): `Look` gains `moment` and `isRepeated`; `normalised` keys a
    look as it is drawn, an arrival as `starting`.
  - **The view:** `momentOf` and `rowData`'s `now` (`hooks/view/runs.ts`), `RowData.moment`,
    `MOMENT_GRACE_MS` (1 s) in `config.ts`; `panel` passes the moment; `desktopGallery` takes
    the look's motion and `GALLERY_MOMENTS`, repeated.
  - **Docs:** `CHANGELOG.md` 0.9.0; `ARCHITECTURE.md` Built for *Overview*, *Values*, *Roles*,
    *Sprites and sets*, *The panel*, four known-debt lines, the baseline and four Decision log
    lines; `USER-GUIDE.md`; `README.md`; the mod's `CLAUDE.md` (`runs-4`); `docs/BACKLOG.md`.
- **Amendments:**
  - **The gallery repeats its one-offs,** where the block said only that it animates, framed:
    the owner's choice at the start.
- **Measured** (CLI 2.1.330):
  - **N-02:** every look of every set, moments included, at most 13,952 characters (the
    gallery's repeating cheer); a cheer 13.6k, a dressing 10.8k, an arrival 10.6k, a startle
    10.4k, quiet 8.3k, needs-you 8.1k.
  - **The gallery's first draw of a set** in the kit, from a scratch copy: 0.19–0.24 s (43 ms at
    0.8.0), then 7–10 ms a mount; 137 sprites, 102 framed, about 875k characters.
  - **The test run** grew from 4.1 s to about 10 s: the frame check plays every step of every
    moving look of every set (5.2 s, given 30 s).
  - **N-04:** three working runs, a fourth arriving and the first ending: one invalidation per
    mock second.
  - `validate` unchanged: 11 hooks, 4 gating each with a `.catch`, 3 state keys, the same calls.
- **Checked by hand:**
  - **in a browser,** a scratch page of every set's moving looks for five roles, on dark and
    light: the slide, the hop, the cheer's hops and rising "z", the startle settling, the sign
    and the doze bobbing; the outline on light only;
  - **in the terminal,** `claude --plugin-dir mods/possum-squad` driven through `screen`:
    `/possums roles` drew the text gallery (its copy's stored set `horror`, left as found); an
    Explore agent's row read Scout, finished, with its numbers, as before;
  - not seen: the desktop (after the push; `docs/BACKLOG.md`).
- **Falsified,** each failing at its own test, 25 breaks: the spawn's, a step's and the
  fallback's moment dropped; the hook not passing the step's time; a step with no time given
  one; no grace; a dressing inside the arrival; a moment before its time; endings always fresh;
  an arrival keeping its pose; motion `off` keeping the moment; a dressing with no role;
  no freeze; the loop beginning at 0; the "z" rising otherwise; a shorter startle; a shorter
  rest; a slower sign; no settling idle; a slide from elsewhere; a failed run cheering; the
  gallery not repeating; the gallery still; the row playing no moment; moments asking for
  redraws.
  - **One check could not fail as first written:** with `motion` `off`, keeping the moment
    changed nothing an arrival asked in `starting` shows; the F-21 test now asks it in every
    live pose.
- **Numbers:**
  - 166 tests (+9) in 16 files: clock 13, command 11, compose 8, gallery 9 (+1), header 8, model
    29 (+1), pane-sprites 5 (+2), panel 9, pass-through 5, prefs 4, roles 9, row 8 (+1), runs
    17, sets 6, settle 12, sprites 13 (+4);
  - the tools' specs unchanged: 10 in 2 files;
  - `validate` unchanged; the gate green on CLI 2.1.330.
- **Review (`/code-review high`), 5 findings, all minor: 5 fixed and 0 skipped.** The user chose
  to fix all five.
  - **An arrival's alt changed with the row's state,** "starting" to "working" mid-slide, which
    could make the app draw the sprite afresh and restart the slide: it now names `starting`
    throughout the arrival.
  - **Under reduced motion an arriving needs-you or quiet row showed the standing copy:** an
    arrival now keeps the asked pose, whose still copy is its own; working stands as starting
    does, so the row that starts working inside its arrival still draws the same string.
  - **The docs said a stopped opossum stays startled under reduced motion;** it does with
    `motion` `off`, and under reduced motion stands once its startle is over. The changelog,
    the user guide, *Sprites and sets* and its Decision log line now say so.
  - **Endings play inside Finished, which is collapsed by default:** the changelog, the user
    guide and *Sprites and sets* say a cheer or a startle shows only while Finished is open.
  - **The README said the sign waves;** it is held up, bobbing.
  - **Falsified,** each failing at its own test: the alt following the state; the arrival's
    copy taken from starting.
  - **Numbers after the review:** 166 tests in 16 files, about 12 s; the tools' specs and
    `validate` unchanged.

---

## 8: Roles

Run before Session 6 (amended at Session 8's plan, with the owner): the repo-level round that
teaches the gate `tools/` was not committed, as Session 6's block foresaw.

**Read:** `SPEC.md` §2 decisions 2, 20; `PDD.md` Part 6 *Role detection*, Part 4 *Worked
examples*, Part 5 F-05, F-06, I-07, T-03, T-04; `research/roles/`; `ARCHITECTURE.md` *Roles*,
*The run model*, *Sprites and sets* (`starting`), *Testing strategy*.

- **The port:** `research/roles/role_engine_reference.py` to `hooks/roles/` with its behaviour
  unchanged; rule 1 ("stated") reserved with no source.
- **The corpus:** `research/roles/role-corpus.json` as `tests/fixtures/role-corpus.ts`, its items
  copied unchanged.
- **Detection on runs:** type, name and description at spawn; decisive and weak tool calls;
  Helper at T-04 from the one-second clock, not a timer of its own; a row arrives plain and
  dresses with one hop when its role settles. (Amended at Session 8's plan, with the owner:
  Helper also at a run's end with no rule fired, but not a teammate's; a subagent's step past
  T-04 settles Helper too, so a closed pane changes no role; with no sprites yet, a row
  arrives with no role name and gains it when its role settles, and the outfit and the hop go
  to Sessions 6 and 7a.)
- **Docs.**
  - `CHANGELOG.md`: 0.6.0 (amended at Session 8's plan).
  - `ARCHITECTURE.md`: Built for *Roles*; I-07's *Enforced by*.
  - `USER-GUIDE.md`: how roles are chosen.
- **Confirms:** *Roles* (the rule order, settled once).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - every `dev` item and at least 90% of `holdout` get their label (F-05);
  - "Take care of it" then an Edit is Builder; with no call past T-04, Helper (F-06);
  - a settled role never changes on later calls (I-07).
- After the push, the owner's week of use for H1 starts (amended at Session 8's plan, with the
  owner: after Session 9's push, whose picker counts each miss).

**Watch for:**
- **Labels are fixed, and `holdout` never tunes the table;** cases may be added to `dev`.
- **`subagentType` carries the engine's spelling** (`Explore`, `general-purpose`): match the
  reference's case handling, not a guess.


**Done (2026-11-22, 0.6.0).**
- **Decided with the user:**
  - **At the start:**
    - the repo-level round for `tools/` was not committed, so this session ran instead of
      Session 6, as its block foresaw;
    - 0.5.0 was installed, and with three agents the desktop pane matched the transcript: each
      row's tokens and time, the header's total, the times ticking. Session 5's desktop check
      is done; its backlog item is gone;
    - told: a subagent waiting on its own background shell reads "finished" (`docs/BACKLOG.md`).
  - **At the plan:**
    - a run that ends with no rule fired is Helper at its end, but not a teammate's;
    - the plan has an adversarial review before approval. Its 14 findings (none high) were
      folded in; the largest:
      - the Python reference's `\b` is Unicode-aware, so the port's runner and git patterns
        need Unicode word boundaries;
      - the beat alone, which runs only while the pane is open, would let one agent be Helper
        or Builder by the pane; the owner chose that a subagent's step reads the clock;
      - the end rule would trap a teammate in Helper; the owner chose the exception;
      - two checks could not fail as written, and the corpus test by events was
        under-specified.
- **Shipped:**
  - **The port.** `hooks/roles/words.ts` holds the reference's lists in its order;
    `hooks/roles/rules.ts` the tokenizer, the matching, `fromText`, `toolsSeen` (calls read on
    from a count of reads and searches), `fromTools`, `detect`, `atSpawn` and `HELPER`. T-03
    and T-04 are in `hooks/config.ts`.
  - **The model.** `Run` and `Pending` carry `role` and `weakCalls` (`runs-3`); `withEvidence`
    is the one guard of I-07; `fellBack` settles Helper; `callsOf` gives each call as a clue.
  - **The hooks.** A spawn's role is worked out inside its record's guard; a subagent's step
    takes the time (`recordAt`), settles Helper past T-04, then reads its calls; an end settles
    Helper on a run no rule settled; the clock's beat settles Helper with no event, writing only
    when one is due.
  - **The view.** `STRINGS.roles`, and the role's name first on the row's second line.
- **Amendments:**
  - **Run before Session 6, released 0.6.0;** Sessions 6, 7 and 7a release 0.7.0, 0.8.0 and
    0.9.0. The repo-level round was not committed. Logged in the table and in Sessions 6, 7, 7a
    and 8.
  - **The outfit and the dressing hop** go to Sessions 6 and 7a: no sprites exist yet. A row
    arrives with no role name and gains it when its role settles. Session 7a needs the moment a
    role settled, which every settle now has.
  - **Helper at a run's end, not a teammate's;** and **a step past T-04 settles Helper.** The
    owner's choices at the plan; `SPEC.md` §4 and *Roles* carry them.
  - **H1's week starts after Session 9's push,** whose picker counts each miss. `SPEC.md` §5
    carries it.
  - **Kit tests read each row's role from the drawn pane:** the host refuses a state read from
    a test's own hooks. Sources are checked by the pure tests.
- **Measured,** the kit on CLI 2.1.329:
  - the engine runs the `u`-flag patterns with lookbehind and `\p{}`;
  - a subagent's step whose call ran a 1 MB command took 2.0 to 2.6 ms, and the rules alone
    3.8 ms on that command (N-07);
  - the Python reference on its corpus: dev 102 of 102, holdout 39 of 42, its misses "Draft an
    implementation plan" (writer), "Add pagination to the list" (scout) and "Hook up analytics
    events" (analyst), all by keywords. Every expected value the tests name was checked against
    the reference.
- **Checked by hand,** in the terminal, `claude --plugin-dir mods/possum-squad`:
  - **typed by the user** (CLI 2.1.329, updated to 2.1.330 during it): four agents told to
    reply "ok", "Research competitor launches", "Design the launch graphics", "Build the landing
    page" and an Explore "Find where reports are built", read Researcher, Artist, Builder and
    Scout at once.
  - **Found:** a subagent may not `sleep 70` in the foreground; it started the sleep in the
    background and ended its turn, so its row read finished and, with no rule fired, Helper at
    that end. It kept Helper when it came back. Recorded with the backlog's background-wait item.
  - **driven by the session in GNU `screen`** (CLI 2.1.330), the pane docked at 160 columns: a
    general-purpose "Ping check" whose only call was `ping -c 70 127.0.0.1` in the foreground
    read working with no role at 0:51, and working as Helper at 1:05: the beat's write, with no
    event. It ended as Helper at 1:14.
  - Not seen: the desktop (after the push; `docs/BACKLOG.md`).
- **Falsified,** each failing at its own test, 21 breaks: a strong verb removed (F-05);
  `replace` for `replaceAll`; a split at a second colon; plain `\b`; the type not lowercased;
  the I-07 guard removed; the fallback ignoring a role; the claim dropping a pending role; the
  beat's settle removed; the step's fallback removed; no fallback at the end; the teammate
  exception removed; the beat writing every second; `toolsSeen` restarting its count; clues
  losing the command; the row dropping its role; a holdout miss moved; no role at the spawn;
  `opened` dropping the role; non-text read as is; a remembered role for a generic type.
  - **One check could not fail as first written:** the kit's I-07 test, past T-04, since the
    beat skips runs that have a role. It now raises a step and an end after T-04.
- **Numbers:**
  - 115 tests (+23) in 11 files (+2): clock 13, command 11, header 8, model 25 (+6), panel 8,
    pass-through 5, prefs 4, roles 9 (new), row 7, runs 17, settle 8 (new);
  - `validate`: 11 hooks, 4 gating, each with a `.catch`; 3 state keys; calls unchanged, with
    `settleHelpers` among the clock's helpers;
  - the gate green on CLI 2.1.330, its declarations laid by `npm run types` in this session.
- **Review (`/code-review high`), 5 findings: 5 fixed and 0 skipped.** The user chose to fix all
  five.
  - **A refused clock read lost a step's whole record,** since steps had moved to `recordAt`.
    A step now reads the time in its own guard and records with `record`; only the Helper check
    waits on the time.
  - **A teammate resting with no role never reached Helper** when nothing else ran: the clock
    stopped with the last live run. The owner's choice: the clock also runs while a run's role
    may still fall back (`keepsClock`), the pane open only. Logged in *The panel*.
  - **A turn that left work in the background was Helper at its end,** and stayed so when the
    run came back (the hand check's find). A step whose call has `run_in_background` marks the
    run (`hasBackgroundWork`), whose end then waits like a teammate's; its next turn clears the
    mark. The owner's choice, logged in *Roles* and `SPEC.md` §4.
  - **The beat's failure paths had no test:** a refused write of Helper now has one, which
    checks the clock keeps beating and redrawing.
  - **A comment said "yet":** it states the present now.
  - **Falsified,** each failing at its own test: the step's clock unguarded; the clock kept for
    live runs only; the end rule ignoring background work; the next turn keeping the mark; the
    claim dropping it; background calls never seen; a failed settle stopping the clock; a failed
    settle skipping the redraw.
  - **Numbers after the review:** 122 tests (+7) in 11 files: clock 13, command 11, header 8,
    model 28 (+3), panel 8, pass-through 5, prefs 4, roles 9, row 7, runs 17, settle 12 (+4).
    `validate` is unchanged.
---

## 9: Role picker, states and auto-open

**Read:** `SPEC.md` §2 decisions 6, 19; `PDD.md` Part 4 *Primary user flows*, Part 5 F-07, F-08,
F-10, Part 8 *Storage & sync*; `ARCHITECTURE.md` *The invariants* (I-03, I-07), *Values: `$.state`
and `$.store`* (`role:<agent type>`), *Roles*, *The run model*, *The panel*, *Attention*
(auto-open).

- **The role picker:** pressing a row's sprite offers the 17 roles; the choice applies to that
  run at once, and is stored under `role:<agent type>` for a custom type only.
- **States wired to runs:** each run's state draws its recipe.
- **Auto-open** per `prefs.autoOpen`; a pane the person closed stays closed for the session.
- **Docs.**
  - `CHANGELOG.md`: 0.10.0.
  - `ARCHITECTURE.md`: Built for *Roles* (the picker), *Attention* (auto-open), *Values*.
  - `USER-GUIDE.md`: changing a role; when the pane opens.
  - `CLAUDE.md`: the store key `role:<agent type>`.
- **Confirms:** *Values* (`role:<agent type>`, one key per type), *Attention* (auto-open).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - press, pick "tester": a new spawn of the same custom type is a Tester; the same on the
    generic type leaves the next spawn to detection (F-07);
  - for each state, the mounted row holds that state's frame (F-08);
  - a spawn opens the pane once; after a close by the person, a spawn opens nothing (F-10).
- After the push, the owner triggers each state by hand.

**Watch for:**
- **An `Svg` takes no press;** a press goes on an enclosing element.


**Done (2026-11-23, 0.10.0).**
- **Decided with the user:**
  - **At the start:** 0.7.0 to 0.9.0 were not looked at in the desktop app; the user asked the
    session to check everything itself. Computer use never grants control of, or a picture of,
    Claude's own window. After the commit, the user looked at this chat's pane while the session
    started agents and the user typed the commands (*Checked by hand*).
  - **After the commit:** the 7a session reported that `/possums roles` drew no gallery on the
    desktop, and the check here confirmed it. The fix goes to a new Session 9a, after 9's
    review and before 10, which also finds the limit. Session 9 ships as built. The user's
    choices.
  - **What opens the picker:** the row's role name, a `Button`, "Pick a role" while plain, on
    both surfaces. Nothing can press a sprite on 2.1.330.
  - **A pick hops:** `Role.at` is the pick's time, so a live row plays the dressing.
  - **Reopening resets the close:** `/possums`, `open` or `roles` opening or raising the pane
    clears `view.isClosedByPerson`. This settles what Session 1 left open.
  - **At the plan, approved:**
    - the picker offers sixteen roles, without Lead;
    - only a close with the close mark or key is the person's;
    - no stored miss counter for H1.
  - **Confirms:** *Values* (`role:<agent type>`, one key per type) and *Attention*
    (auto-open), confirmed as built.
- **Shipped:**
  - **The model and roles.**
    - `RoleSource` gains `manual`;
    - `reassigned` and `runOf` (`hooks/model/runs.ts`), and `isEmpty` for the first agent;
    - `PICKABLE`, `isPickable`, `rememberedOf` and `isCustomType` (`hooks/roles/rules.ts`), with
      `atSpawn` taking the remembered pick, which `detect` takes for a custom type only;
    - `runs` stays `runs-4`.
  - **The adapter** (`hooks/register.tsx`):
    - `writeStore` takes `role:<agent type>` with a role id;
    - the spawn reads the remembered pick (`rememberedFor`), and starts `autoOpen` unawaited,
      knowing from inside its write whether its row starts the list;
    - `forgetClose` runs on an open or a raise;
    - the picker's `toggleRole`, `closePicker` and `pickRole`;
    - `ui.close` drops the picker;
    - `view` is `view-3`, with `pickerFor`.
  - **The view:**
    - line 2 is the role's `Button` (`role-<row id>`), then the model and effort;
    - while the row's picker is open, a `Select` (`role-pick`) and `cancel` (`role-cancel`);
    - `RowData.order`, `RolePicker`, and `panel` binding each row's closures;
    - `STRINGS.picker`.
  - **Docs:**
    - `CHANGELOG.md` 0.10.0; `USER-GUIDE.md` (*Changing a role*, when the pane opens);
      `README.md`; the mod's `CLAUDE.md` (`view-3`, `role:<agent type>`);
    - `ARCHITECTURE.md`: Built for *Overview*, *The hooks*, *Values*, *Roles*, *The panel* and
      *Attention*; I-03's, I-07's and N-07's lines; four known-debt lines; the baseline; six
      Decision log lines;
    - `docs/BACKLOG.md`: forgetting a remembered role, and the desktop items for 0.10.0.
- **Amendments:**
  - **The role's name opens the picker, not the sprite:** an `Svg` takes no press, and a
    `Button` holds only text. Decided with the user at the start.
  - **Sixteen roles, not seventeen:** Lead is the main session's alone (*Roles*). Approved
    with the plan.
  - **F-10's "close by the person" runs over a stand-in `$`,** through the mod's own hooks: the
    kit's `$` has no `ui.close`. The session's finding, as `tests/panel.test.ts` already does
    for the close.
  - **F-08's needs-you and quiet are drawn through `panel` from fixture rows:** no event
    reaches them until Session 10. The other five states are driven by events.
- **Measured** (CLI 2.1.330, in the kit):
  - the unawaited open lands before the spawn's call returns; three agents spawned at once
    opened the pane once;
  - the kit's `$.ui` holds `focus`, `input`, `mount`, `press`, `render`, `scroll` and `select`,
    with no `close`;
  - the kit refuses a pick that is not among a `Select`'s options before the mod hears it.
    Another plugin's `ui.select` hook, matched to the mod's elements, does rewrite the value;
  - `validate` unchanged: 11 hooks, 4 gating each with a `.catch`, 3 state keys, the same
    calls (`$.store.get` now also via `autoOpen` and `rememberedFor`, `$.ui.open` and
    `$.ui.panes` via `autoOpen`).
- **Checked by hand:**
  - **In the terminal,** `claude --plugin-dir mods/possum-squad` driven through `screen` at
    120 columns, the `@inline` copy at `autoOpen` `first` and `theme` `horror`, left as found:
    - `/possums` opened and hid the pane;
    - the session's first agent, an Explore "Find the strings table", opened it by itself,
      docked;
    - the row read `[ Scout ] claude-opus-5-5 · medium`, finished;
    - hidden again with `/possums`, a second Explore agent opened nothing.
  - **The terminal's picker was not pressed:** ctrl+x, tab through `screen` did not visibly move
    the focus, as in Session 7. The kit presses it on both surfaces.
  - **In the desktop app,** installed 0.9.0, this chat's pane, the user looking, after the
    commit:
    - six agents working (5-minute `ping`s) drew six rows, each opossum moving in its role's
      outfit, the Lead still. Fourteen working drew fourteen, about 118k of tree by the kit's
      measure;
    - **`/possums roles` drew nothing:** the pane kept the list. With `motion` `off` it still
      drew nothing. The store held `motion: off`, so the command ran: the gallery, about 945k
      with `motion` `auto` and 389k with `off` (137 sprites), is refused, and the app keeps the
      last tree it drew;
    - while `view.isGalleryOpen` stays set, every drawing is the gallery, so the pane looked
      frozen until `/possums` closed it. Reopened, the list drew. Then `set motion off` and
      `set motion auto` stopped and restarted the opossums at once;
    - what refuses the gallery lies between 118k with 15 sprites and 389k with 137: size or
      sprite count, not the declared 100,000 characters at the size the rows reached. Session
      9a finds it;
    - not seen: 0.10.0 (not pushed), the light theme, reduced motion, an ending's cheer or
      startle, needs-you and quiet (`docs/BACKLOG.md`).
  - **Found:** a test agent's foreground `ping -c 300` moved to the background after about two
    minutes, so its row read finished: the backlog's background-work item.
- **Falsified,** each failing at its own test, 23 breaks:
  - the pick: a pick doing nothing; no remembered read; the remembered rule after the
    description; a generic type remembered; the guard on pickable values gone; no hop;
    Lead offered; a second press reopening; a refused store blocking the pick; agent text
    stored; the remembered read unguarded;
  - auto-open: `first` opening on every agent; the first decided outside the write; the first
    judged by spawn count; the person's close ignored; an open pane opened again; the open
    asking for the keys; no forgetting the close; a resume opening; `never` ignored;
  - the view: a close keeping the picker; a row drawing another state's frame (twice, by the
    panel and by the row data).
- **Numbers:**
  - 192 tests (+26) in 18 files (+2): auto-open 9 (new), clock 13, command 11, compose 8,
    gallery 9, header 8, model 31 (+2), pane-sprites 8 (+3), panel 10 (+1), pass-through 5,
    picker 10 (new), prefs 5 (+1), roles 9, row 8, runs 17, sets 6, settle 12, sprites 13;
    about 13 s;
  - the tools' specs unchanged: 10 in 2 files;
  - the gate green on CLI 2.1.330.
- **Review (`/code-review high`), 6 findings: 5 fixed and 1 skipped.** The user chose to fix all
  but the gallery's.
  - **An open left waiting undrawn armed the clock:** on a terminal under 144 columns, auto-open
    marked the pane open and started the one-second clock with nothing shown. Only a placed
    open does now; the pane's first drawing or the person's open brings the times.
  - **A refused spawn opened the pane** on an empty list: auto-open started at the spawn's
    input. It starts once the result names an agent and is not refused; whether the row starts
    the list is still learnt inside the opening's write.
  - **The docs said a close by hand lasts the session;** a `/clear` forgets it, the engine
    resetting `view`. The changelog, the user guide and *Attention* say so.
  - **The stand-in tests left a dead timer armed** in the module: each now closes its pane and
    checks every timer it armed was cancelled.
  - **Picking the role a row already wears replayed the hop:** it leaves the run as it is now,
    and for a custom type still remembers the pick, the user's choice.
  - **Skipped:** the gallery drawing nothing on the desktop, and the docs still promising it;
    Session 9a's, the user's choice.
  - **Measured:** with the open after the spawn's result, the kit's spawn returns before the open
    lands, so the kit tests let it settle (100 microtasks) before they look.
  - **Falsified,** each failing at its own test: an undrawn open arming the clock; a refused
    spawn opening; the same role hopping; the same role not remembered; a close leaving the
    clock running.
  - **Numbers after the review:** 197 tests (+5) in 18 files: auto-open 11 (+2), pane-sprites
    9 (+1), picker 12 (+2), the rest unchanged; about 13 s. `validate` unchanged.

---

## 9a: The gallery within what the desktop draws

Added after Session 9's commit, with the owner: on the desktop `/possums roles` drew nothing,
while fourteen working rows drew (Session 9's done-note).

**Read:** `SPEC.md` §2 decisions 5, 15, 17; `PDD.md` Part 5 F-26, N-02, N-05, Part 7 *Motion &
feedback*; `ARCHITECTURE.md` *The panel* (the gallery), *Sprites and sets*, *Testing strategy*,
*Known debt*; Session 9's done-note.

- **Find the limit** the desktop holds a pane's tree to: total size, sprite count or framed
  count. Measure it with the fewest pushes, each with the owner's approval. A probe build
  pushed for it is a version of its own.
- **The gallery within it:** drawn in parts the limit allows, such as one role or a few roles at
  a time, with the controls to move between them on both surfaces. A gallery that cannot draw
  never holds the pane: the list stays reachable without a close.
- **The rows within it:** if the limit binds the list too, a budget past which rows draw still or
  smaller sprites.
- **A size test in the kit:** the pane's serialized tree, the gallery's and a list of many working
  rows, stays under the limit found.
- **Docs.**
  - `CHANGELOG.md`: 0.10.1.
  - `ARCHITECTURE.md`: Built for *The panel* and *Sprites and sets*; the limit in *Context*; the
    known-debt line.
  - `USER-GUIDE.md`: the gallery.
  - `docs/BACKLOG.md`: the desktop items this covers.
- **Confirms:** *The panel* (the gallery as drawn).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - the gallery's tree, on each set and either motion, stays under the limit, and so does the
    pane with the most rows the budget allows;
  - the gallery's controls move between its parts on both surfaces.
- After the push, the owner opens the gallery on the desktop app and moves through it.

**Watch for:**
- **The desktop keeps the last tree it accepted** when it refuses one, and the kit refuses
  nothing; only the desktop can say what draws.

**Done (2026-11-23, 0.10.1).**
- **Decided with the user, at the plan:**
  - **The limit is taken from the desktop app's own render code,** with no probe build. The
    app's bundle (6.28899.6, running engine 2.1.330) holds the check: a hook's answer draws
    only with fewer than 2,000 nodes, 32 levels and 262,144 characters by its count. A refused
    one is dropped silently and the last tree stays. The declarations bound only a `Client`'s
    tree, and the app's logs held no refusal for the 0.9.0 gallery.
  - **The gallery in parts of three roles,** six parts.
  - **A cap on the rows drawn,** the rest counted under their section, at 80.
- **Shipped:**
  - **The gallery in parts:**
    - `GALLERY_ROLES_PER_PART` (3);
    - `partsOf`, `movedPart` and `shownPart` in `hooks/view/gallery.tsx`, which draws the part
      and, on both surfaces, the line `[ previous ] 2 of 6 [ next ]` (`gallery-previous`,
      `gallery-next`) under the heading;
    - `moveGallery` in `hooks/register.tsx`, wrapping at both ends;
    - `view` is `view-4`, with `galleryPart`, which the gallery's close and every pane close
      drop; `/possums roles` on an open gallery keeps it;
    - `STRINGS.gallery.previous`, `next` and `part`.
  - **The rows within the bound,** in `hooks/view/panel.tsx`:
    - `ROWS_DRAWN` (60) in drawing order, and a dim `and N more` (`STRINGS.more`) under a
      section that loses rows;
    - `SPRITE_BUDGET` (160,000) through `withinBudget`: a row's own sprite while all fit;
      past it a still, then the mark, then moving again in order while the total fits;
    - `DESCRIPTION_CHARS` (100) with `…` in `rowData`.
  - **Tests:**
    - `tests/size.ts` ports the desktop's count;
    - `tests/size.test.ts` holds it to Session 9's sight, every gallery part in every set and
      either motion under the bound, the fullest list, the budget's order, the ladder, and the
      cap;
    - the gallery's tests walk the parts and press its controls;
    - the close test drops the part;
    - a long description is cut.
  - **Docs:**
    - `CHANGELOG.md` 0.10.1; `USER-GUIDE.md` (the gallery, many agents); `README.md`; the mod's
      `CLAUDE.md` (`view-4`); `docs/BACKLOG.md`;
    - `ARCHITECTURE.md`: *Overview*, the bound in *Context*, *Values*, *The panel* (Decided
      and Built), *The command and settings*, *Sprites and sets*, *Testing strategy*, three
      known-debt lines, the baseline, three Decision log lines.
- **Amendments:**
  - **The limit was found with no push,** from the app's code rather than a probe on the
    desktop. The user's choice at the plan.
  - **The cap and the description cut** go beyond the block's "rows draw still or smaller".
    Sprites alone could not keep a long list under the node bound, nor one long description
    under the character bound. The cap was agreed at the plan; the cut is the plan's own.
  - **The cap is 60, not the 80 agreed.** The kit draws a row's `Progress` as about 8 nodes,
    so a row is 25 to 28 nodes, not the plan's 20, and 80 rows came to over 2,000. Decided in
    the session, to keep the agreed intent; the user is told.
  - **The terminal pages too,** as the block's gate says, under its States key.
- **Measured** (CLI 2.1.330, in the kit, by the desktop's count):
  - **The heaviest gallery part** is 186,618 characters, 145 nodes and 8 deep
    (prehistoric's first, `auto`); with `off` at most 77,267. Under Node, the sources alone
    of a part of three come to at most 180,186, a role's eight cells to 67,426.
  - **The fullest list,** 60 drawn of 90 with every extra, is 1,613 nodes and at most 198,479
    characters.
  - **Working rows:** fourteen come to 102,480 characters; forty draw 14 moving and 26 still,
    184,295.
  - **The 0.9.0 gallery as one tree** is past the bound with either motion.
  - `validate` is unchanged: 11 hooks, 4 gating each with a `.catch`, 3 state keys, the same
    calls.
- **Checked by hand,** in the terminal: `claude --plugin-dir mods/possum-squad` driven
  through `screen`, at 120 columns, with the `@inline` copy's `theme` `horror`, its settings
  unchanged.
  - `/possums roles` drew `Roles · Horror [ close ]`, `[ previous ] 1 of 6 [ next ]`, the
    States key and Lead, Scout and Planner with their costumes.
  - **The buttons could be pressed this time:** ctrl+x, then tab to the button, then Enter.
    `close` brought the list back; `next` went to `2 of 6` (Builder, Tester, Bug catcher),
    on to `6 of 6` (Pilot, Helper), then round to `1 of 6`. Reopened after the close, the
    gallery started on the first part.
  - No `claude --plugin-dir` was left running.
  - **In the desktop app,** after the push and `claude plugin update possum-squad` (0.10.0 to
    0.10.1), each with the user's OK, in a new chat, the user looking:
    - `/possums roles`, `next` through all six parts and round, `previous` round to the last;
    - `motion` `off` and back to `auto`;
    - `theme` `prehistoric`, the heaviest set, through every part;
    - `close` bringing the list back, and the gallery reopening on its first part.

    All as expected, the user said; nothing froze.
- **Falsified,** each failing at its own test:
  - the count not reading `Svg` sources;
  - overlapping parts of five that keep their `k of 6`: over the bound at classic `auto`;
  - parts of five;
  - no still tier;
  - a budget of 400k;
  - no cap;
  - no wrapping;
  - `next` doing nothing;
  - the description not cut;
  - a second `roles` resetting the part;
  - the close button keeping the part;
  - a pane close keeping the part.

  A reset on opening, kept besides the closes' drop, failed no test: it was redundant and was
  removed.
- **Numbers:**
  - 206 tests (+9) in 19 files (+1): gallery 11 (+2), runs 18 (+1), size 6 (new), the rest
    unchanged; about 13 s;
  - the tools' specs unchanged: 10 in 2 files;
  - the gate green on CLI 2.1.330.
- **Review (`/code-review high`), 5 findings: all fixed, the user's choice.**
  - **A stopped row past the budget showed startled:** its still was the pose with `motion`
    `off`, and with `auto` a stopped row settles standing. A still steady look is now its own
    still.
  - **A row at the budget's edge flipped between moving and still** whenever an earlier row's
    arrival or ending changed its size, restarting its loop. The fit now reads each row's
    steady look. Moments play after it, in what is left and `MOMENT_ROOM` (20,000) above it
    (`withMoments`), and only on a row drawn as its steady look.
  - **The gallery wrote every row's sprite** it does not draw: `panel` skips them while it is
    open.
  - **The description cut could split an emoji:** it counts whole characters.
  - **A new gallery test pressed on the desktop only:** it loops over both surfaces.
  - **Falsified,** each failing at its own test:
    - a still always the `off` pose;
    - the fit on the moments' looks;
    - a moment too large stopping the rest;
    - a stilled row playing its moment;
    - a cut by code units.

    The gallery's skip has no test: it changes no drawing.
  - **Measured:** the fullest list is now at most 218,861 characters, 83% of the bound, and
    1,613 nodes; twenty-five working rows draw 23 moving.
  - **Numbers after the review:** 209 tests (+3) in 19 files: runs 19 (+1), size 8 (+2), the
    rest unchanged; about 13 s. `validate` unchanged.

---

## 10: Attention

**Read:** `SPEC.md` §2 decision 16; `PDD.md` Part 4 *Primary user flows* (Respond), Part 5 F-12,
F-14, F-15, T-05, T-10, Part 7 *Voice, tone & microcopy*; `ARCHITECTURE.md` *Attention*, *The
hooks*, *The run model*, *The panel*.

- **Needs you** (amended at Session 3, with the owner: F-12 stays):
  - it begins on `classic.PermissionRequest`, for the run its `agent_id` names; a request
    without one is the main session's and moves no row;
  - it ends when that agent's asked call moves on: at that agent's next `turn.step` or its
    `turn.complete` (amended at Session 4, with the owner: a call's start comes from its step's
    `toolUses`, and no tool event is hooked).
- **Gone quiet** after T-05 with no tool call in flight.
- **Toasts** while the pane is closed.
- **Docs.**
  - `CHANGELOG.md`: 0.11.0.
  - `ARCHITECTURE.md`: Built for *Attention*.
  - `USER-GUIDE.md`: Needs you, quiet, toasts.
- **Confirms:** *Attention* (Needs you's signal, as decided at Session 3).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - a waiting call moves its row to Needs you and back when answered, allowed or refused
    (F-12);
  - with a mock clock, quiet after T-05, never while a call is in flight (F-15);
  - with the pane closed, one toast per case (F-14).
- After the push, the owner raises a permission prompt inside a subagent.

**Done (2026-11-23, 0.11.0).**
- **Decided with the user, at the plan:**
  - **A toast shows whenever the pane is out of view:** closed, behind another pane's tab, or
    waiting undrawn (`isShown` false), not only when closed.
  - **A toast names its run by its description,** cut to 100 characters as on the row; I-04
    allows agent text in the engine's plain toast line.
  - The plan's own choices, approved with it: Needs you ends at a step's record, with no new
    write in the stream; only an answer with no `decision` begins it; quiet is worked out where
    a row is drawn, never stored; a quiet row's third line reads "Quiet for 2 min"; every
    ending past T-10 toasts; one toast per move into Needs you.
- **Shipped:**
  - **Needs you:**
    - `classic.PermissionRequest` awaits `next(e)`. With `agent_id` and no `decision`, it
      records `asked`, which moves a starting or working row to `needs-you` (`askedAt`,
      `heardAt`), or marks a pending entry `isAsking` for the row that claims it;
    - `stepped` moves the row back at a step begun at or after the request (`movesOn`); the
      step that asked is recorded after the request;
    - a subagent's `turn.step` reads the time before its stream (`began`).
  - **Quiet:**
    - `Run.heardAt` is set by the opening, the spawn's result, each turn start and each step;
    - `quietMs` makes a starting or working run with no call in flight quiet from T-05
      (`QUIET_AFTER_MS`, 90 s);
    - `rowData` draws it as `quiet`, its third line `STRINGS.row.quietFor`.
  - **Toasts:**
    - `toastUnseen` in `hooks/register.tsx`, started unawaited, asks `$.ui.panes()` and calls
      `$.ui.toast` unless the pane is shown;
    - `hooks/view/toasts.ts`: `askedToast` and `endedToast` (T-10, `TOAST_AFTER_MS`, 60 s);
      `STRINGS.toasts`; `shortened` exported from `hooks/view/runs.ts`.
  - `runs` is `runs-5` (`heardAt`, `askedAt`; `Pending.isAsking`, `askedAt`).
  - **Tests:**
    - `tests/attention.test.ts` (11): F-12 through the kit's own request from `$.tool.call`,
      allowed and refused, the late record of the asking step, the cases that move nothing and
      the pending window; F-15's edges, a call in flight, a spawn with no event; F-14 closed,
      shown and behind a tab, every ending's text, the cut, and no timer (N-03);
    - `tests/model.test.ts` +5; `tests/pass-through.test.ts` +1 (a toast that cannot be shown)
      and a subagent request in two existing tests.
  - **Docs:**
    - `CHANGELOG.md` 0.11.0; `USER-GUIDE.md` (*When an agent needs you*, the sections, the
      row); `README.md`; the mod's `CLAUDE.md` (`runs-5`); `docs/BACKLOG.md`;
    - `ARCHITECTURE.md`: *Overview*, *Context* (what the terminal showed), I-04 and N-07,
      *The hooks*, *Values*, *The run model*, *The panel*, *Attention* (Built), *Reach*, four
      known-debt lines, the baseline, two Decision log lines.
- **Amendments:**
  - **Needs you ends at a step begun after the request, not at the next step recorded.** The
    terminal showed the engine checking a call while the step that asked it still streams, so
    that step's record came after the request and moved the row straight back. The block's
    "next `turn.step`" holds; a subagent's step now awaits one read of the clock's time before
    its stream, which N-07 allows. Found and decided in the session; the user is told.
- **Measured** (CLI 2.1.330):
  - **the terminal,** with a scratch probe plugin outside the repository, loaded beside the mod:
    the request carried the loop's `agentId` as `agent_id` and came back `{}` while the prompt
    waited; the asking step began, then the request came in and out, then the step ended with
    its call;
  - **the kit** raises the request from `$.tool.call` with `agentId` and a `tool.check`
    answering `ask`; with nobody to answer, it refuses the call;
  - `validate`: 11 hooks, 4 gating each with a `.catch`, 3 state keys; the calls line gains
    `$.ui.toast` (I-02, on the allow-list since the intake).
- **Checked by hand,** in the terminal: `claude --plugin-dir mods/possum-squad
  --permission-mode default` driven through `screen`, at 120 columns, its settings unchanged.
  - **Before the fix,** the row never left "working" while a prompt waited; the probe above
    found why.
  - **After it,** with the pane shown:
    - a Haiku subagent's `ping -c 5` moved its row under `Needs you · 1`, "needs you", its
      third line `Running ping -c 5 127.0.0.1`;
    - it held while the prompt waited and through the allowed call, then finished;
    - a refused call left Needs you, and the run finished.
  - **With the pane hidden,** the toasts drew over the transcript under "possum-squad":
    - "Ping for seventy seconds · needs you: waiting on a permission prompt";
    - "Ping once more · needs you: waiting on a permission prompt";
    - "Ping once more · finished after 1:11".
  - No `claude --plugin-dir` was left running; the probe stayed in the scratchpad.
  - **In the desktop app,** after the review, the push and `claude plugin update possum-squad`
    (0.10.1 to 0.11.0), each with the user's OK, in a new chat in manual permission mode, the
    user looking while that chat started Haiku subagents running `ping`:
    - with the pane shown, the row sat under Needs you with the "?" sign while the prompt
      waited, and finished after the answer;
    - with the pane hidden, the toast "Ping the loopback · needs you: waiting on a permission
      prompt" showed at the top right. Two runs before it asked nothing, so raised no toast:
      the first prompt's answer had allowed that command from then on;
    - the finished toast was not tried there, the user's choice.

    All as expected, the user said.
  - **Not checked by hand:** quiet; a toast with the pane behind another tab or over the
    gallery; the finished toast in the desktop app (`docs/BACKLOG.md`).
- **Falsified,** each failing at its own test:
  - a request another hook answered moving the row;
  - an ended row asking;
  - a step keeping Needs you;
  - any step moving the call on;
  - the step's start not read;
  - the claim ignoring `isAsking`, and a step keeping it;
  - quiet ignoring a call in flight, or only after T-05;
  - a step, a turn or the spawn's result not heard;
  - the quiet line's minutes rounded up;
  - a toast only when the pane is absent, or even when shown;
  - a toast arming the clock;
  - a toast's fault escaping (the kit fails the file);
  - a second request toasting again;
  - an end toasting at T-10 itself, or an ended run toasting again;
  - the toast's description not cut;
  - the request's answer changed.
- **Numbers:**
  - 226 tests (+17) in 20 files (+1): attention 11 (new), model 36 (+5), pass-through 6 (+1),
    the rest unchanged; about 14 s;
  - the tools' specs unchanged: 10 in 2 files;
  - the gate green on CLI 2.1.330.
- **Review (`/code-review high`), 5 findings: all fixed, the user's choice.**
  - **A second call asked while the next step still streamed read as moved on:** `asked` left
    a row already waiting alone, so that step's record, begun after the first request, moved
    the row back while the second prompt waited. A later request now replaces the earlier
    (`Run.ask` and `Pending.ask`, `{ at }`, in place of `askedAt` and `isAsking`); the toast
    still goes only with the move into Needs you.
  - **A teammate's or resumed agent's turn end toasted when the run, not the turn, was long:**
    `endedToast` timed from the first start. Runs keep their turn's start (`turnAt`: the
    opening, a resume's result, each turn start), and a toast times the turn.
  - **A request whose time could not be read let the asking step's late record end it:** such
    a request (`{}`) now waits out one record and takes its time.
  - **With the gallery open, an agent needing the person had no row and no toast:** the
    gallery counts as the list out of view.
  - **The failed toast said "ended without an answer" for an error or a refusal:** it reads
    `failed after 2:14`, like the other two.
  - **Falsified,** each failing at its own test:
    - a waiting row ignoring a later request;
    - a later request toasting again;
    - an untimed request moving on at once;
    - an end timed from the first start;
    - a turn's start, or a resume's, not kept;
    - the gallery counting as seen;
    - the failed toast's old text.
  - **Numbers after the review:** 232 tests (+6) in 20 files: attention 14 (+3), model 39
    (+3), the rest unchanged; about 14 s. `validate` unchanged.

---

## 11: Peek and the collapsed view

**Read:** `SPEC.md` §2 decision 18; `PDD.md` Part 4 *Information architecture*, Part 5 F-13,
F-16, T-07, T-09, T-14, Appendix C item 7; `ARCHITECTURE.md` *The invariants* (I-03, I-04), *The
panel* (Peek, the collapsed view, seats), *The run model*, *Values: `$.state` and `$.store`*
(`view`, `prefs.collapsed`).

- **Peek:** a row press toggles it (`view`); brief, last actions, files, the answer's start, all
  plain text.
- **The collapsed view:** the header button (`prefs.collapsed`), the Lead with joeys and a
  numeral, the needs-you mark; drawn in the `widget` seat too.
- **Docs.**
  - `CHANGELOG.md`: 0.12.0.
  - `ARCHITECTURE.md`: Built for *The panel*.
  - `USER-GUIDE.md`: Peek and the collapsed view.
- **Ask at the start of 11:** whether the owner has redrawn the joey; a new PNG goes into `art/`
  and through the converter.
- **Confirms:** *The panel* (the `widget` seat draws the collapsed view).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - after seven tool calls Peek lists the last five (F-13), as plain `Text` (I-04);
  - four running agents give three joeys and "4" (F-16);
  - a mount in the `widget` seat draws the collapsed view.

**Done (2026-11-25, 0.12.0).**
- **Asked at the start:** the joey was not redrawn; the user asked for it to be redrawn in the
  session.
- **Decided with the user, at the plan:**
  - **Peek opens from a dim `peek` button** at the end of a row's third line (`hide` while
    open), not from the task's line drawn as the app's button;
  - **Peek's files are the files a run changed** (Write, Edit, MultiEdit, NotebookEdit), the
    latest ten;
  - **the collapsed view counts the Running section,** an agent that needs the person said
    apart: left to the session, chosen to match the headings;
  - **the redrawn joey is kept,** after the user's look at a preview of the Lead carrying none
    to three in every set, dark and light, beside the first pass;
  - the plan's own choices, approved with it: the brief, the answer and Peek's description cut
    at 600 characters; one Peek at a time, dropped at any close; the collapse button at the
    session line's end, `expand` on the collapsed view but not in the `widget` seat; the
    gallery over a collapsed dock; the numeral always drawn; the collapsed view out of view
    for toasts; the joey's spots as constants beside the tongue's.
- **Shipped:**
  - **The joey:** redrawn 7 by 6 (dark ears with pink inside, a grey crown, pink paws), with
    three spots, (23, 9), (23, 17), (25, 23). Written to
    `art/extras/joey.png` with `tools/png.ts`'s encoder from a scratch script, then the
    converter. `JOEY_SPOTS` in `recipes.ts`; `drawLeadWith` and `leadWith` in `index.ts`.
  - **The model:** `runs-6`. `Run.brief` and `Run.answer` are `Excerpt`s (`cutTo`,
    `excerptOf`, `PEEK_CHARS`); `Run.actions` (`ACTIONS_KEPT`, T-07) and `Run.files`
    (`FILES_KEPT`), also on `Pending` and claimed with it. `callsOf` gives `actions` and
    `files`; the spawn carries its prompt and the end its answer.
  - **Peek:** `view-5` (`peekFor`, `togglePeek`, dropped at a close); `RowData.peek` from
    `peekData`; the activity line with its `peek-<row id>` button and `peekLines` under the
    row, on both surfaces.
  - **The collapsed view:** `hooks/view/collapsed.tsx` (`desktopCollapsed`,
    `terminalCollapsed`), `countsOf` and `collapsedPanel` in `panel.tsx`, the header's
    `collapse` button, `collapse` in `hooks/register.tsx` writing `prefs.collapsed`;
    `drawPane` reads `e.props.placement`. `toastUnseen` also toasts while collapsed
    (`prefsOrDefaults`, renamed from `prefsWhileDrawing`).
  - **Tests:** `tests/peek.test.ts` (8) and `tests/collapsed.test.ts` (12), new; model +5,
    attention +1, sprites +1; `row.test.ts` holds a fixture row with Peek open to I-04,
    `prefs.test.ts` presses Peek, `collapse` and `expand` (I-03), and `size.test.ts` holds the
    fullest list with Peek open. Three tests that took the first button now find it by key.
  - **Docs:** `CHANGELOG.md` 0.12.0; `USER-GUIDE.md` (Peek, *The collapsed view*, the toasts);
    `README.md`; the mod's `CLAUDE.md` (`view-5`, `runs-6`); `docs/BACKLOG.md`;
    `ARCHITECTURE.md`: *Overview*, *Layout and boundaries*, I-03 and I-04, *The hooks*,
    *Values*, *The run model*, *Sprites and sets*, *The panel* (Peek, the collapsed view, the
    worst list), *Attention*, five known-debt lines, the baseline, four Decision log lines.
- **Amendments:**
  - **"A row press toggles it" became a `peek` button on the row:** a `Button` is the only
    element a press reaches and holds only text. Decided with the user at the plan.
  - **The check that a refused store leaves the list was dropped** before the commit: no
    plausible break of the code made it fail. The session's own call.
- **Measured** (CLI 2.1.330):
  - **the kit** mounts a `Pane` with `placement: 'widget'` on both surfaces;
  - **the fullest list with a Peek at its longest:** 1,845 nodes, 8 deep, at most 225,783
    characters (horror), against 1,613 and 218,861 before; 92% and 86% of the desktop's bound;
  - **the collapsed Lead:** 2.6k to 4.4k characters (prehistoric's with three joeys);
  - `validate` unchanged: 11 hooks, 4 gating each with a `.catch`, 3 state keys, the same calls.
- **Checked by hand,** in the terminal: `claude --plugin-dir mods/possum-squad` driven through
  `screen` at 120 columns, auto mode, its settings unchanged but `collapsed`, left at false.
  - A Haiku subagent read three files and answered. Its row showed `[ peek ]` at the end of
    its activity line; pressed, it read `[ hide ]`, and under the row came the task, `Brief`
    wrapping over its lines, `Last actions` with the three reads, and `Answer`; no
    `Files changed`, since it only read. Each read's path, absolute, was cut at 80 characters
    from its start and lost its file name (known debt).
  - `[ collapse ]` at the session line's end folded the pane to `● 0 running [ expand ]`; two
    Haiku subagents running `ping -c 20` made it `● 2 running`; `[ expand ]` brought the list
    back with both finished.
  - A pane's focus stops on the pane itself before its first button.
  - No `claude --plugin-dir` was left running.
  - **Not checked by hand:** everything in the desktop app (`docs/BACKLOG.md`), the needs-you
    mark in the collapsed view, `Files changed`, and a toast while collapsed.
- **Falsified,** each failing at its own test:
  - a read counted as a change; seven actions kept; a file seen again not moved; twelve files
    kept; an excerpt never cut; an empty answer replacing the last; a resume taking the new
    prompt; a pending entry's actions not claimed;
  - Peek's actions folded into one `Text`; a close keeping Peek; a second press keeping it
    open; its press writing the store; Peek not drawn;
  - one joey short; needs-you counted as running; a spot moved; no cap at three; no joeys
    drawn as another look;
  - the widget drawn in full; the widget keeping `expand`; the collapse writing another flag;
    the collapsed view winning over the gallery; the collapsed view counting as seen for a
    toast.
- **Numbers:**
  - 259 tests (+27) in 22 files (+2): collapsed 12 and peek 8 (new), model 44 (+5),
    attention 15 (+1), sprites 14 (+1), the rest unchanged; about 14 s;
  - the tools' specs unchanged: 10 in 2 files;
  - the gate green on CLI 2.1.330.
- **Confirms** (*The panel*: the `widget` seat draws the collapsed view): waits for the user's
  look in the desktop app after a push and an update.
- **Review (`/code-review high`), 4 findings: all fixed, the user's choice.**
  - **Peek's files could merge different files into one:** a file was kept as its first 80
    characters and told apart by them, so files deep in one folder, as a subagent's absolute
    paths are, became one entry naming none. `callsOf` now gives each path whole, and the run
    keeps its last 80 characters (`pathEnd`, an `Excerpt` marked cut), drawn after `…`.
  - **Collapsing over the gallery showed nothing:** the gallery stayed, and only the button's
    label changed. The session line draws no `collapse` button while the gallery shows.
  - **The changelog said a mid-session update forgets only the list and a picker:** `view-5`
    also drops the gallery and the person's close, so the next agent may open the pane again.
    The entry now says so.
  - **Peek showed a resumed or teammate run's earlier answer as this turn's:** while the run is
    live again, it is headed `Last answer` (`isEarlierAnswer`).
  - **Falsified,** each failing at its own test: a file cut at its start; a file taken from the
    cut target; a cut file drawn with no `…`; an earlier answer never marked; the collapse
    button drawn over the gallery.
  - **Numbers after the review:** 266 tests (+7) in 22 files: model 45 (+1), peek 12 (+4),
    collapsed 14 (+2), the rest unchanged; about 14 s. The fullest list: 1,845 nodes, at most
    225,793 characters (+10, the `…` before each cut file). `validate` unchanged.

---

## 12: Limits, cost and nested helpers

**Read:** `SPEC.md` §2 decisions 1, 22; `PDD.md` Part 5 F-20, F-24, T-12; `ARCHITECTURE.md` *The
run model* (nesting, numbers), *The panel* (the header), *Values: `$.state` and `$.store`*
(`prefs.cost`), *Reach*.

- **Plan limits** in the header from `session.measure`.
- **The estimate:** `hooks/data/`'s dated price table (T-12); "est." on rows and header with
  `cost` at `estimate`; no currency sign with it `off`.
- **Nested helpers:** a spawn whose `parentAgentId` names a known run is drawn under it, and its
  totals roll up.
- **Docs.**
  - `CHANGELOG.md`: 0.13.0.
  - `ARCHITECTURE.md`: Built for *The run model*, *The panel*.
  - `USER-GUIDE.md`: limits, the estimate, nesting.
- **Confirms:** *The run model* (nesting and roll-up).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - stubbed usage at 40% shows "40%"; with `cost` off no currency sign appears anywhere (F-20);
  - a spawn carrying a parent's id is drawn under it, and the parent's totals include it (F-24).

**Done (2026-11-25, 0.13.0).**
- **Decided with the user, at the plan:**
  - **the estimate comes from the dated price table** (T-12), not the engine's own ledger
    (`session.measure`'s `cost`, `$.agent.list()`'s per agent), which the declarations offer:
    the header stays the Lead and every row, and moves with each step;
  - **a helper is drawn under its parent only while both sit in one section,** otherwise as any
    row in its own state's section, so Needs you still shows it and the headings are unchanged;
  - **tokens and the estimate roll up,** at every level; time and context stay each row's own;
  - **the session line shows every limit window** the engine reports, in its order;
  - the plan's own choices, approved with it: prices confirmed against the published pricing
    page; an unknown model at Opus 5.5's prices; at most four windows; the indent on the row's
    own `Box`, two cells a level up to three; a pruned helper's share kept by its nearest kept
    ancestor; the collapsed view counting every agent, a helper its own.
- **Shipped:**
  - **The model:** `runs-7` (`Run.usd`, `Run.prunedHelpers`, `Pending.usd`, `Past.usd`) and
    `lead-2` (`Lead.usd`, `Lead.limits`). `hooks/data/prices.ts` (`PRICES`, `costOf`), with
    `rowFor` shared with `windowOf`. `withStep` prices each step (its prompt picks Haiku's
    long-prompt rates; its hour writes from `ephemeral_1h_input_tokens`); `claimed` carries an
    entry's; `turnCounted` prices a main turn at its last model; `measured` takes `rateLimits`;
    `totals` sums `usd`. `parentsOf` and `pruned`'s walk to the nearest kept ancestor in
    `runs.ts`; `rolledUp` in `hooks/model/nesting.ts`.
  - **The view:** the session line with the limits and `est. $…`; `est.` at the end of each
    row's figures, with `cost` at `estimate` only (`dollars`, `estimate` in `format.ts`);
    `nested` in `panel.tsx` ordering each section; `RowData.parent` and `RowData.usd`;
    `indentOf` in `row.tsx`. Config: `NEST_INDENT`, `NEST_LEVELS_DRAWN`, `LIMITS_KEPT`.
  - **Tests:** `tests/estimate.test.ts` (5) and `tests/nesting.test.ts` (5), new; model +3,
    header +1; `size.test.ts` holds the fullest list nested at its deepest, with four limits
    and the estimate, and checks nesting adds no node or level. Existing literals gained `usd`.
  - **Docs:** `CHANGELOG.md` 0.13.0; `USER-GUIDE.md` (*The pane*, *What a row shows*'s Helpers,
    *Limits and the estimate*, the settings table, now all working); `README.md`; the mod's
    `CLAUDE.md` (`runs-7`, `lead-2`); `docs/BACKLOG.md`; `ARCHITECTURE.md`: *Overview*,
    *Layout and boundaries*, *The hooks*, *Values*, *The run model* (Decided refined with the
    user, Built), *The panel* (Decided refined, Built, the worst list, Helpers), *Reach* (and
    `prefsOrDefaults`, renamed at Session 11), four known-debt lines, the baseline, four
    Decision log lines.
- **Amendments:** none to the block's letter. Its "drawn under it" holds within a section, the
  user's choice at the plan.
- **Measured** (CLI 2.1.330):
  - **the pricing page,** read on 2026-11-25: Fable 5.2 $8/$40, reads $0.20, writes $10/$16;
    Opus 5.5 $4/$20, $0.20, $5/$8; Sonnet 5.5 $2/$10, $0.10, $2.50/$4; Haiku 5.5 $0.10/$0.50,
    $0.01, $0.125/$0.20, and five times each past a 100,000-token prompt;
  - **the fullest list,** nested at its deepest with four limits and the estimate: 1,845 nodes,
    8 deep, at most 227,422 characters (horror), 92% and 87% of the desktop's bound, against
    225,793 at 0.12.0; the same rows unnested draw the same nodes and levels;
  - `validate` unchanged: 11 hooks, 4 gating each with a `.catch`, 3 state keys, the same calls.
- **Checked by hand,** in the terminal: `claude --plugin-dir mods/possum-squad` driven through
  `screen`, auto mode, `cost` set to `estimate` for the check and put back to `off`.
  - The session line read `5h 71% · 7d 52% · 0 tokens · 0:00 · est. $0.00` as soon as the pane
    opened, before any reply: the first measure came at the session's start. At 46 columns it
    wraps beside `[ collapse ]`.
  - Rows ended `est. $0.01` and `est. <$0.01`; `/possums set cost off` took every dollar figure
    away at once.
  - **A subagent's helper ran in the background,** though its prompt asked for the
    foreground: the parent's turn ended and its row read finished while the helper worked as
    its own row in Running; the helper's report brought the parent back to working. Once both
    had ended, `Water the seedlings` was drawn indented under `Plant the north bed` in
    Finished. So a helper is seen under a live parent only when both work at once; added to
    the deferred item on background work (`docs/BACKLOG.md`).
  - At one level's indent a helper's figure line wraps its `est.` in the 46-column dock.
  - A first Haiku parent ran the helper's commands itself rather than starting one; asked to
    list its tools, a subagent named `Agent` among them.
  - No `claude --plugin-dir` was left running.
  - **Not checked by hand:** everything in the desktop app (`docs/BACKLOG.md`); a helper under
    a parent that works at the same time; a pruned helper's share.
- **Falsified,** each failing at its own test (24):
  - an Opus price wrong; hour writes at five minutes' rate; Haiku's long prompts at the base;
    an unknown model at Haiku's prices; a NaN count priced; under a cent shown as cents;
  - the estimate drawn with `cost` off; none on rows; the header's without the Lead; a step's
    prompt size not passed; a claimed entry's estimate lost; a main turn's not counted; the
    step's hour writes not passed on by the hook;
  - the limits not read from the measure; every window kept; an empty list keeping them; a
    window with no percent kept; a window named as the engine names it;
  - no nesting in the drawing order; a parent in another section taken for one here; no
    indent; a parent's tokens not rolled up; a helper's estimate not rolled up; a pruned
    helper's share lost; nesting adding an element.
- **Numbers:**
  - 280 tests (+14) in 24 files (+2): estimate 5 and nesting 5 (new), model 48 (+3), header 9
    (+1), the rest unchanged; about 15 s;
  - the tools' specs unchanged: 10 in 2 files;
  - the gate green on CLI 2.1.330.
- **Confirms** (*The run model*: nesting and roll-up): confirmed with the user at the plan, as
  refined there; the desktop look waits for a push and an update.
- **Review (`/code-review high`), 5 findings: all fixed, the user's choice.**
  - **Pruning a middle agent cut its kept helper out of the roll-up:** the helper's
    `parentId` still named the dropped agent, so nothing linked it to the agent above. A kept
    helper of a dropped run now takes its nearest kept ancestor's agent id, or none.
  - **A `/clear` dropped the plan limits** until the next measure, and none follows a clear
    (seen by hand, CLI 2.1.330: the line read `0 tokens · 0:00` after it). The Lead now starts
    over with the last limits measured (`startedOver`, `knownLimits` in module memory, set by
    each measure and each drawing).
  - **`cleared` and `isEmpty` ignored `past.usd`:** a `past` of dollars alone now counts.
  - **A window or tool named as an Object's own key** (`constructor`) read the prototype: both
    lookups use `Object.hasOwn`.
  - **Older models still served were priced as Opus 5.5:** `PRICES` holds every served model on
    the pricing page, and `rowFor` takes the longest model leading an id, so a dated
    `claude-opus-5-5-…` is never Opus 5's.
  - **Falsified,** each failing at its own test: a kept helper left pointing at a dropped
    agent; one with no kept ancestor keeping its old parent; a clear dropping the limits; a past
    of dollars taken for empty; a window's name and a tool's verb looked up on the prototype;
    a shorter model taken first; an older model's price wrong.
  - **Numbers after the review:** 285 tests (+5) in 24 files: estimate 6 (+1), header 10 (+1),
    model 50 (+2), nesting 6 (+1), the rest unchanged; about 15 s. `validate` unchanged. The
    fullest list unchanged: the fixes draw nothing new.

---

## 12a: Waiting, not finished

Inserted at Session 13's plan (2026-11-25, with the owner), from the review of that plan. An
agent held by its own background work, a shell or a helper, reads finished: its turn ended,
which is how a run ends here (`docs/BACKLOG.md`'s deferred item, seen at Sessions 5, 8 and 12).
The owner chose that such a run stays in Running, dozing, with the word `waiting`.

**Read:** `SPEC.md` §2 decisions 13, with its amendment, and 14; `ARCHITECTURE.md` *The
hooks*, *Values* (the state ids, `runs`), *The run model* (its `waiting` lines), *Roles* (Helper
at a run's end), *Sprites and sets* (the poses), *The panel* (the clock, the sections, the
collapsed view), *Attention* (the toasts), *Reach*, *Known debt*; the declarations' `$.agent.list`,
`AgentInfo` and `AgentStatus`.

- **A turn's end that leaves the agent waiting** (*The run model*, amended).
  - `turn.complete` (`hooks/register.tsx:613-627`) ends a run in one `recordAt`, through
    `turnEnded` (`hooks/model/runs.ts:353-360`) by `endingOf` (`runs.ts:65-71`), then
    `fellBack`, with `endedToast` worked out against the state before the write. The hook
    reads `$.agent.list()` (async, no argument) unawaited (N-07), so that read cannot come
    before that write.
  - So the end is not written as an end at the turn's close any more. The run is kept live
    with its turn's ending and answer held, no toast, no ending's moment and no Helper; the
    list read then makes it `waiting`, or applies the held ending, its toast and its moment.
    A run whose read never settles must not stay live for good: the session decides how (Ask
    at the start).
  - When the engine lists that agent's `status` as `waiting`, the run goes to `waiting`.
  - The declarations say `waiting` covers background work the agent owns, a plan's approval,
    and a background subagent waiting on an Agent call alone. `taskStatus` reads `completed`
    for a subagent whose turn ended, whatever holds it, so the run reads `status`.
  - A waiting run's next turn puts it back to `working` (`turnStarted`). A later read that
    lists it `completed`, `failed` or `killed`, or no longer lists it, ends it with its kept
    ending. A read that is refused or throws ends it as today, so no run waits for good.
- **The beat reads the list while a run waits.** A waiting run is live, so it keeps the clock
  (`keepsClock`, `runs.ts:63`). `tick` (`register.tsx:107-121`) reads the list once a beat
  while any run waits, and nothing else changes in what the beat reads.
- **How it looks.**
  - `waiting` sits in Running (`hooks/view/panel.tsx:53-57`), with its own word and quiet's
    pose (`STILL.quiet`, `BOB_PACE.quiet`, `LIVE` in `hooks/sprites/recipes.ts`).
  - Its time keeps counting, and `quiet` never applies to it (`quietMs`, `runs.ts:404-408`).
  - Helper at the end does not settle it (`fellBack`, `runs.ts:364-376`). Today only
    `hasBackgroundWork` keeps Helper off such an end, and it is set only by a call whose input
    asks `run_in_background` (`hooks/model/tools.ts:52`); an Agent call the engine moved to the
    background without that (Session 12's hand check) sets nothing. So the guard is the list's
    `waiting`, not that flag.
  - The collapsed view counts it among the running.
  - A waiting parent and its working helper both sit in Running, so the helper is drawn under
    it, the case nesting was built for.
- **The toasts wait for the real end.** `endedToast` (`hooks/view/toasts.ts:25-37`) fires when
  the waiting run ends, timed from its turn's start as today, and not at the turn's end that
  left it waiting.
- **Machine identifiers:** the state id `waiting`. `runs-8` if `Run`'s fields change. The call
  `$.agent.list` joins `validate`'s calls line; it is already on the allow-list.
- **Docs.**
  - `CHANGELOG.md`: 0.14.0.
  - `ARCHITECTURE.md`: Built for *The run model*, *The panel*, *Attention*, *Reach*; the
    known-debt line on a subagent waiting on its background shell removed; the baseline.
  - `USER-GUIDE.md`: the states and Running.
  - `README.md`; the mod's `CLAUDE.md` if `runs` changes its tag.
- **Confirms:** *The run model* (`waiting`).
- **Ask at the start of 12a:**
  - How the turn's end is held until the list read settles, and what ends a run whose read
    never comes back.
  - What 2.1.330 lists for a subagent waiting on a background shell, and for one waiting on a
    background helper; and how long an ended subagent stays listed. Measure before building.
  - How a waiting run ends while the pane is closed and the clock stopped (N-03). Proposed at
    Session 13's plan, not yet confirmed: any subagent's event reads the list, unawaited, while
    a run waits, and so does the pane's next open; a toast for such an end comes then.

**Gates:**
- `npm run verify -- possum-squad`, with these tests on both surfaces, the clock pinned:
  - a subagent's turn ending while the list says `waiting` leaves its row in Running as
    `waiting`, with no ending toast, no ending's moment and no Helper, for a run that ran past
    T-10 and for one with no `hasBackgroundWork`;
  - its next turn puts it back to `working`;
  - the list's later `completed`, or the agent's absence from it, ends it with its kept ending,
    and a long one toasts then;
  - a refused or throwing read ends the run as before;
  - a waiting parent draws its working helper under it;
  - the hook passes the event on unchanged and never awaits the list.
- A hand check in the terminal (`screen`): a subagent starts `ping -c 40 127.0.0.1` in the
  background and ends its turn; its row reads `waiting` until the shell ends. Never seen yet,
  and the check must show it: whether the shell's end brings the agent a new turn, putting the
  row back to `working`. Seen at Session 12 for a helper: the parent went back to working when
  the helper's report came, and the two were drawn nested once both had ended.

**Watch for:**
- **The kit stands in for the engine's list** through a hook on `agent.list`, which the
  declarations make hookable; check what the kit answers unhooked before relying on it.
- **A late read may see the next turn already running** (`running`): that is not an end either.

**Done (2026-11-25, 0.14.0).**
- **Decided with the user, at the plan** (the block's three asks, and two it left open):
  - **the hold:** a turn's end keeps the row as it was (a needs-you one working), with its
    ending kept, no toast, no ending's moment, no Helper; the list then makes it `waiting`, ends
    it as kept (an end, `idle` or no entry), or leaves it held (`running`, `pending`); a list
    that cannot be read ends it at once; a held end no list answers is ended by the clock's
    beat 5 s after the turn's end, or at the pane's next open;
  - **the pane closed:** any subagent's event reads the list while a turn's end is held or a run
    waits, and so does the pane's next open, through its first beat (Session 13's proposal,
    confirmed);
  - **the colour:** `waiting` is `inactive`, as starting;
  - **the gallery:** unchanged, since `waiting` is quiet's pose.
- **Measured first** (CLI 2.1.330), with a throwaway probe plugin in the scratchpad, never in the
  repository, driven through `screen`:
  - a read inside `turn.complete`, before or after `next`, already listed a plain subagent
    `completed`;
  - a subagent that started a background `ping` listed `waiting` at its turn's end; at the
    shell's end the engine resumed it (a spawn under the same id, then a turn), and its next
    end listed `completed`;
  - a subagent that started a background helper listed `waiting`; the helper's end resumed it
    the same way;
  - an ended subagent stayed listed about 30 s; `taskStatus` read `completed` throughout;
  - the kit answers an unhooked `$.agent.list()` with a rejection ("no implementation"), which
    reads as a list that cannot be read; a hook on `agent.list` stands in, and a deny rejects.
- **Shipped:**
  - **The model:** `runs-8` (`Run.keptEnding`, `KeptEnding`), `StateId` `waiting`;
    `turnEnded` holds a live row, `listed`, `heldOut`, `hasKept` and `endedWith` in
    `hooks/model/runs.ts`; `turnStarted` drops the kept ending; `quietMs` none while one is
    kept; `LIST_ANSWER_MS` (5 s) in `hooks/config.ts`.
  - **The hooks:** `readList`, the one caller of `$.agent.list`, started unawaited by `record`
    and `recordAt` after a write that keeps a turn's end, so `turn.complete` and every subagent
    event read it; the beat's `settleHeld` (the bound, then a read); `turn.complete` toasts
    nothing itself; `endedToasts` in `hooks/view/toasts.ts`.
  - **The view:** Running holds `waiting`; `STRINGS.states.waiting`; `COLOURS.waiting`
    `inactive`; quiet's pose (`STILL`, `BOB_PACE`, `LIVE`).
  - **Tests:** `tests/waiting.test.ts` (11), new, its world standing in for `agent.list`; model
    +4, pass-through +1 (a list that never answers, and one that refuses), row +1 (the
    colours), sprites +1 (waiting is quiet's source); a waiting fixture row; Running's counts
    in header and pane-sprites; the N-02 count's arrivals and dressings. `tests/engine.ts` gains
    `settled` and `turnEnds`, which the tests that end a run now use, since the end lands with
    the unawaited read; the model tests end a run through `listed` with an empty list.
  - **Docs:** `CHANGELOG.md` 0.14.0; `README.md`; `USER-GUIDE.md` (Running, the poses, the
    row's states, *Waiting*, the toasts, Helpers, roles, the collapsed view, the gallery);
    the mod's `CLAUDE.md` (`runs-8`); `docs/BACKLOG.md`; `ARCHITECTURE.md`: *Overview*, I-05,
    N-07, *The hooks*, *Values*, *The run model* (the measurement among it), *Roles*,
    *Sprites and sets*, *The panel* (the gallery's Decided line, the sections, the colours, the
    beat, the counts), *Attention*, *Reach*, three known-debt lines for the one removed, the
    baseline, four Decision log lines.
- **Amendments:**
  - `endedToast` became `endedToasts`, one per run a record ended: a list's answer may end
    several at once.
  - `hasBackgroundWork` stays: the list's `waiting` is the guard at a turn's end, and the flag
    still keeps Helper off a run a failed read ends, as before (Decision log, 2026-11-22).
  - The tests that end a run let the unawaited read land (`turnEnds`); their expectations are
    unchanged.
  - Decided by the session: the bound's constant, `LIST_ANSWER_MS`; a list entry without a text
    `id` and `status` left out; a read that changes nothing writes nothing.
- **Checked by hand,** in the terminal: `claude --plugin-dir mods/possum-squad` driven through
  `screen`, auto mode, the `@inline` store's settings left as they were.
  - A subagent asked to start `ping -c 40 127.0.0.1` in the background and hand back read
    `working`, then `waiting` in Running with no role, its time counting (0:08, 0:11, 0:15).
  - At the shell's end the agent took another turn (its tokens rose from 41k to 63k), then read
    finished at 0:44, the engine's own "finished · 44s", as Helper. The working moment between
    was not caught on screen.
  - No `claude --plugin-dir` was left running.
  - **Not checked by hand:** everything in the desktop app; a waiting parent with its helper
    drawn under it; a toast at a waiting agent's real end; an end shown at another agent's
    event with the pane closed (`docs/BACKLOG.md`).
- **Falsified,** each failing at its own test (17): the list's `waiting` misread; `waiting` out
  of Running; the next turn keeping the ending; no read at events; no read at the beat; a
  waiting run ended at its turn's time; a refused list keeping the hold; `running` read as an
  end; no bound at the beat; the bound one past its edge; `idle` not an end; a needs-you row
  kept so; a held run going quiet; waiting dozing faster than quiet; the beat reading with
  nothing kept; the turn's end awaiting the list (the pass-through test times out); waiting's
  colour `warning`.
- **Numbers:**
  - 303 tests (+18) in 25 files (+1): model 54 (+4), pass-through 7 (+1), row 9 (+1), sprites
    15 (+1), waiting 11 (new), the rest unchanged; about 17 s;
  - the tools' specs unchanged: 10 in 2 files;
  - `validate`: 11 hooks, 4 gating each with a `.catch`, 3 state keys; the calls line gains
    `$.agent.list`;
  - the gate green on CLI 2.1.330.
- **Confirms** (*The run model*: `waiting`): confirmed with the user at the plan, the hold and
  its ends as above; the desktop look waits for a push and an update.
- **Review (`/code-review high`), 6 findings: all fixed, the user's choice.**
  - **A foreground subagent's end was unmeasured:** every probed agent ran in the background.
    Measured again (CLI 2.1.330): asked for the foreground, the engine still ran it in the
    background, and the read at its turn's end listed it `completed`. No foreground agent can be
    made here, so the case is a known-debt line, not code.
  - **A pane auto-open left waiting undrawn started no clock,** and a drawing arms none, so
    once drawn a waiting run was read again only at another subagent's event. Such an open now
    arms the clock as any open does; its beat finds the pane not shown and redraws nothing.
  - **`hasBackgroundWork` kept Helper off a run the list said had ended:** a confirmed end
    (`listed` with a list) now drops the flag, so Helper settles then; an end an unread list
    gives keeps it, as before.
  - **The changelog and the guide said "any agent"** where only another subagent's event reads
    the list.
  - **Comments ran to paragraphs** (root `CLAUDE.md`, rule 5): each cut to its one-line why.
  - **Two tests kept their own microtask settle** beside the new shared one: attention,
    auto-open and pass-through now use `settled` from `tests/engine.ts`.
  - **Falsified,** each failing at its own test: an undrawn auto-open arming nothing; a
    confirmed end keeping the flag; an unread list dropping it.
  - **Numbers after the review:** 304 tests (+1) in 25 files: model 55 (+1), the auto-open test
    changed in place, the rest unchanged; about 17 s. `validate` unchanged.

---

## 12b: The activity line

Inserted at Session 13's plan (2026-11-25, with the owner): a path's end and the engine's
progress summary from the review of that plan; `peek` pushed out of reach, and a finished row
reading "Running …", from the owner's desktop look at 0.13.0 at the same plan.

**Read:** `ARCHITECTURE.md` I-03, I-04, *The run model* (the activity, the actions, the files),
*Values* (`runs`), *The panel* (the row's lines, Peek, the fullest list and the desktop's
bound), *Known debt*; 12a's done-note; the declarations' `AgentInfo.label`.

- **A path keeps its end** (`docs/BACKLOG.md`'s deferred item, picked up here).
  - `targetOf` (`hooks/model/tools.ts:39-42`) keeps a line's first `TARGET_CHARS` (80), so a
    subagent's absolute path loses its file name.
  - A path-like target keeps its end instead, on the activity line and in Peek's last actions,
    as Peek's files already do through `pathEnd` (`hooks/model/runs.ts:94-97`). A shell command
    keeps its start.
  - `runs` changes its tag if `Activity`'s fields change.
- **`peek` stays in reach on the desktop.**
  - Seen at Session 13's plan, in the desktop app on the installed 0.13.0: a long activity
    (`Running cd` into an absolute path) took the row's width and pushed the `peek` button out
    of the pane. Peek could not be opened from those rows.
  - `activityLine` (`hooks/view/row.tsx:137-150`) draws a `Text wrap="end"` in a growing,
    shrinking `Box`, then the `Button`. The button must keep its room at any activity's length.
  - The kit cannot see the desktop's layout, so the owner's look confirms the fix.
- **An ended row's activity reads as past.**
  - A finished, failed or stopped row shows its last call with the live verb (`Running cd …`;
    `activityText`, `hooks/view/runs.ts:9-13`; `STRINGS.activity`).
  - Proposed at Session 13's plan, not yet confirmed: an ended row's line reads its last call in
    the past tense.
- **The engine's progress summary.**
  - `AgentInfo.label` is the agent's latest progress summary as the engine stores it, else its
    description. It is a model's text.
  - 12a reads the engine's list on a beat only while a run waits. 12b widens that: a beat reads
    the list once while any live run shows, and takes each one's summary. The read is the
    beat's, never an event hook's, and costs one call a second while the pane is open: measure
    it, and keep the beat light.
  - The summary is drawn as plain `Text` (I-04), kept in `runs` only (I-03) and cut like a
    brief.
  - It adds no node, so the fullest list stays within the desktop's bound
    (`tests/size.test.ts`).
- **Docs.**
  - `CHANGELOG.md`: 0.15.0.
  - `ARCHITECTURE.md`: Built for *The run model* and *The panel*; the known-debt line on the 80
    characters removed; the baseline.
  - `USER-GUIDE.md`: *What a row shows*, Peek.
  - `README.md`.
- **Ask at the start of 12b:**
  - How often 2.1.330 fills a subagent's progress summary. Measure first; if it never does,
    drop it with the owner.
  - Where the summary goes. Proposed at Session 13's plan: the activity line, with the last call
    when there is none.
  - An ended row's line, as proposed above.

**Gates:**
- `npm run verify -- possum-squad`, with these tests on both surfaces:
  - a long path keeps its file name on the activity line and in Peek's last actions; a long
    command keeps its start;
  - the `peek` button is in every row's tree at any activity's length;
  - an ended row's activity reads as past;
  - a listed summary shows as plain text, and one that equals the description does not;
  - the fullest list stays within the desktop's bound.
- The owner's look in the desktop app after the push: `peek` in reach on a row with a long
  path.

**Watch for:**
- **The desktop's layout is not the kit's:** the kit drew the `peek` button the desktop pushed
  out. Only a look shows it.

---

## 12c: The Lead's time during a main turn

Inserted at Session 13's plan (2026-11-25, with the owner), from the review of that plan. The
session line's time grows only when a main turn ends (*Known debt*), so it stands still through
a long main turn.

**Read:** `ARCHITECTURE.md` N-07, *The hooks* (the main loop's hooks, amended), *Values*
(`lead`), *The run model* (numbers), *The panel* (the session line, the clock, amended), *Known
debt*.

- **The main turn's start is kept** (*The hooks*, amended).
  - The main loop's `turn.start` (`hooks/register.tsx:601-610`) reads the clock's time and
    keeps it. Its `turn.step` still makes no `$` call.
  - `turn.complete` (`register.tsx:613-628`) counts the turn as today (`turnCounted`,
    `hooks/model/lead.ts:71-83`) and drops the start.
- **The clock beats during a main turn** while the pane is open (*The panel*, amended).
  - Today a run keeps the clock (`keepsClock`, `hooks/model/runs.ts:63`) and the Lead never
    does. The running main turn joins the condition in `tick`, `armIfLive` and the drawing
    (`register.tsx:107-121`, `149-154`, `459-461`).
  - With the pane closed no timer runs (N-03).
- **The session line** (`hooks/view/lead.tsx:52-62`; `totals`, `lead.ts:99-107`) adds the
  running turn's time. At the turn's end the counted time replaces it.
- **Docs.**
  - `CHANGELOG.md`: 0.16.0.
  - `ARCHITECTURE.md`: Built for *The hooks*, *The panel*, *Values* if `lead` changes; the
    known-debt line on the Lead's time removed; the baseline.
  - `USER-GUIDE.md`: the session line.
  - `README.md`; the mod's `CLAUDE.md` if `lead` changes its tag.
- **Confirms:** *The hooks* (the main loop's `turn.start`).
- **Ask at the start of 12c:** where the start lives. In `lead` (`lead-3`) it survives a reload
  of the mod, at one write per main turn. In module memory it costs no write, and a reload
  loses the running turn's start until the next. Proposed at Session 13's plan, not yet
  confirmed: module memory, as `knownLimits` is.

**Gates:**
- `npm run verify -- possum-squad`, with these tests on both surfaces, the clock pinned:
  - with the pane open and only a main turn running, the session line's time moves once a
    second with no event, and stops at the turn's end on the counted time;
  - with the pane closed no timer runs;
  - the main loop's `turn.step` makes no `$` call;
  - a clear mid-turn starts the time over.

**Watch for:**
- **The engine's `durationMs` and the clock's time differ,** so the line can step back a little
  at the turn's end. Decide which way it rounds, and test it.
- **The clock now runs through most of a session** while the pane is open: each beat redraws
  the pane. Keep the beat's work within N-07.

---

## 12d: Toasts, the tab title and `detect`

Inserted at Session 13's plan (2026-11-25, with the owner), from the review of that plan. The
owner chose `detect` in the role picker over a command for forgetting a remembered role.

**Read:** `ARCHITECTURE.md` I-07, *Attention*, *The command and settings*, *Values* (`prefs`,
`role:<agent type>`), *Roles* (the picker and the remembered pick), *The panel* (the picker),
*Reach*, *Known debt*; the declarations' `ui.open` (`title`; an open id retitles).

- **The failed toast says why.**
  - `endedToast` (`hooks/view/toasts.ts:25-37`) reads any ending that is not finished or
    stopped as failed, and `STRINGS.toasts.failed` (`hooks/strings.ts:143-145`) names no
    reason (*Known debt*).
  - It names an error, a refusal or an empty answer, from the turn's reason and text
    (`endingOf`, `hooks/model/runs.ts:65-71`). The run keeps which, so `runs` changes its tag.
- **A `toasts` setting:** `all` (the default), `needs` (Needs you only) or `off`.
  - It goes in `hooks/settings.ts:4-9` and `readPrefs` (`:24-34`), and `toastUnseen`
    (`hooks/register.tsx:215-223`) reads it through `prefsOrDefaults`.
  - The tests' `DEFAULTS` gain it (`tests/prefs.test.ts:20`, `tests/command.test.ts:15`).
- **The tab title carries attention.**
  - While an agent needs you, the pane's tab reads `Possum Squad · 1 needs you`, and its plain
    name after. A title shows only while more than one pane is open.
  - `$.ui.open` on an open id retitles it in place, and on a closed one opens it. So a retitle
    reads `$.ui.panes()` first, as `autoOpen` does (`register.tsx:202-203`).
- **`detect` in the picker.**
  - The picker (`pickerLine`, `hooks/view/row.tsx:122-131`; `pickRole`,
    `register.tsx:257-280`) gets a first entry, `detect`.
  - It puts the row back on detection. Nothing re-detects a role today: `withEvidence` only
    fills an unset one (`runs.ts:149-155`), and `reassigned` is the only path that changes a
    settled one (I-07), so `detect` is a pick, like any other.
  - For a custom type it also deletes `role:<agent type>` (`$.store.delete`, allowed, not yet
    called).
- **Machine identifiers:** the setting `toasts`, its values, and the picker's `detect`.
- **Docs.**
  - `CHANGELOG.md`: 0.17.0.
  - `ARCHITECTURE.md`: Built for *Attention*, *The command and settings*, *Values*, *Roles*,
    *Reach*; the known-debt lines on the failed toast and on a remembered pick never deleted,
    removed; the baseline.
  - `USER-GUIDE.md`: the toasts, the settings table, the picker.
  - `README.md`: the settings; the mod's `CLAUDE.md`: the machine identifiers.
- **Ask at the start of 12d:**
  - The retitle's race: a close between the read of the panes and the open would reopen the
    pane. Read the declarations for an unasked open of a pane the person closed; if a retitle
    can reopen one, drop the title, with the owner.
  - What `detect` does to the row at once. Proposed at Session 13's plan, not yet confirmed:
    the rules run again on the run's type, description and calls seen, and the row redresses
    with one hop.

**Gates:**
- `npm run verify -- possum-squad`, with these tests on both surfaces:
  - the failed toast names each reason;
  - `toasts` at `needs` keeps the Needs you toast and drops the ended ones, `off` drops both,
    `all` is as today, and a value it does not know reads `all`;
  - the title shows the count while an agent needs you, and the plain name after;
  - a retitle never opens a closed pane;
  - `detect` deletes the stored pick for a custom type and none for a built-in one, and settles
    the row's role again;
  - `/possums settings` lists `toasts`.

**Watch for:**
- **The title shows only beside another pane:** check it with a second plugin's pane open.

---

## 13: Documentation pass, and the close

**Read:** everything: `SPEC.md`, `PDD.md`, `ARCHITECTURE.md` whole, `docs/BACKLOG.md`, every
done-note in this file.

- **`ARCHITECTURE.md` read cold against the code:** every Built part true, the baseline current.
- **`USER-GUIDE.md`,** the README (what the mod does, install, commands, `validate`'s calls line
  and the tested Claude Code versions, N-08), and `CLAUDE.md` pointing at both.
- **A name check:** no other mod named Possum Squad or using `/possums`, by the owner.
- **Anything open** moves to `docs/BACKLOG.md`: unchecked by-hand items, H1's outcome, cuts.
- **Docs.** `CHANGELOG.md`: 1.0.0. The handoff is the between-rounds one.
- **After the review:** the `review(possum-squad):` commit, then the separate
  `docs(possum-squad): close round 1` commit, which deletes `docs/spec/`'s files and puts the
  review commit's sha in the handoff. The tag `possum-squad-v1.0.0` only on the owner's yes, as
  the chat's last act.

**Gates:**
- The full `npm run verify` before any push.
- The owner's check by hand from the installed 1.0.0, in the desktop app and the terminal.

**Watch for:**
- **`docs/spec/research/` goes with the close:** before it does, check that `art/`,
  `hooks/roles/` and the corpus fixture hold everything a later round needs.

**Amended at plan time, with the user (2026-11-25).** The session's first chat planned it, had
the plan reviewed adversarially, and on the owner's word held 1.0.0 for what the review
proposed: Sessions 12a to 12d, inserted before this one. So this session runs after 12d. That
chat also had the owner look at the installed 0.13.0 in the desktop app (`docs/BACKLOG.md`).
The amendments below are from the review, and the owner chose the order of the last look.
- **The look from the installed 1.0.0 comes before the close,** so what it finds can still be
  recorded and fixed:
  1. the release commit and its `review:` commit, then the first push, with the owner's yes;
  2. the owner updates to 1.0.0 (their setup: ask first) and looks in the desktop app; the
     session looks in the terminal from the installed release, a plain `claude` in `screen`;
  3. a docs commit records both looks in this done-note;
  4. the close, then the second push and the tag, each on the owner's yes.

  The handoff names the last commit that holds this file in full, which is then that docs
  commit rather than the review commit.
- **The ids outlive `PDD.md`.** `F-`, `N-02` to `N-08` and `H` ids are named in
  `ARCHITECTURE.md`, test names and code comments, and only `PDD.md` defines them (`T-` ids are
  defined in `hooks/config.ts`; `I-`, `N-01` and `N-07` in *The invariants*). The release
  commit adds a short table to `ARCHITECTURE.md`: each id and one line.
- **Before the release commit,** grep the mod for `docs/spec`, `PDD`, `SPEC`, `research/` and
  requirement ids, and settle every hit. Two lines turn false at the close: the mod's
  `CLAUDE.md` *Watch for* line on `docs/spec/research/`, and *Packaging*'s "until round 1
  closes".
- **The doc checks no test makes,** run once and not committed, since no test reads docs:
  - every path in backticks in the README, the user guide and the architecture exists;
  - the README's calls line equals `validate`'s output;
  - every quoted string of the pane is in `hooks/strings.ts`;
  - `hooks/` and `types/` have no diff since 12d's last commit, so the look at 1.0.0 is a look
    at the code 12d's review left.
- **Every hypothesis is recorded,** H1 to H6: H1 and H3 as not yet measured if their weeks of
  use have not run, each with how to measure it, in `docs/BACKLOG.md`.
- **`CHANGELOG.md` gets a link reference for every version,** as the workflow's *Versions and
  the changelog* asks; 1.0.0's points at its tag only once the tag is pushed.
- **Ask before the `@inline` copy's stored values change** for a check, and show them.

**Review of the insert (`/code-review high`), 8 findings: all fixed, the owner's choice.**
- **12a's order would toast before `waiting` was known:** the end, its toast and its moment
  are written in the turn's own `recordAt`, before any unawaited read. 12a's block now holds
  the end until the list read settles, and asks how.
- **The handoff said `hasBackgroundWork` keeps Helper off a waiting run:** it is set only by
  an asked `run_in_background`, so a parent waiting on its helper is not covered. Corrected
  there and in 12a's block, whose guard is the list's `waiting`.
- **The hooks table's `turn.start` and `turn.complete` rows** still told the old contract;
  amended for 12a and 12c.
- **12b leaned on a list read 12a does not build:** 12b now widens the beat's read itself.
- **The desktop engine's version at the look was not read:** the handoff no longer claims it.
- Smaller: the not-yet notes moved from Decided into each section's Built part; two facts of
  the backlog item 12a picked up carried into its hand check; 12a's Read line named an
  amendment decision 14 does not have.

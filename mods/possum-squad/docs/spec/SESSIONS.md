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
| 10 | Attention: Needs you, gone quiet, toasts | 16 | **0.11.0** |
| 11 | Peek and the collapsed view; the `widget` seat | 18 | **0.12.0** |
| 12 | Plan limits, the cost estimate, nested helpers | 1, 22 | **0.13.0** |
| 13 | Docs, changelog, manual runs; `ARCHITECTURE.md` read cold; close the round | all | **1.0.0**, tagged `possum-squad-v1.0.0` |

Session 8 ran before Session 6 (amended at Session 8's plan, with the owner: the repo-level round
that teaches the gate `tools/` was not committed, as Session 6's block foresaw). It released
0.6.0, so Sessions 6, 7 and 7a release 0.7.0, 0.8.0 and 0.9.0.

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
  draws the plain opossum while the role is unsettled).
- **Docs.**
  - `CHANGELOG.md`: 0.7.0 (amended at Session 8's plan).
  - `ARCHITECTURE.md`: Built for *Sprites and sets*, *Layout and boundaries* (`art/`, `tools/`),
    the converter's row of *Testing strategy*.
  - `CLAUDE.md`: how to run the converter.
- **Confirms:** *Sprites and sets* (layers, recipes, SVG, the cache), *Layout and boundaries*
  (`tools/` imports nothing from `hooks/`).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - every role and state of `classic` is under 16,000 characters (N-02);
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

---

## 7: Sets and gallery

**Read:** `SPEC.md` §2 decisions 5, 15; `PDD.md` Part 6 *Roles and outfits*, *The other sets*,
*Sprites*, Part 5 F-26, F-27, N-02, N-05; `ARCHITECTURE.md` *Sprites and sets*, *The panel* (the
gallery), *The command and settings*, *Testing strategy*.

- **The other three sets** in `data.ts`; `/possums set theme` redraws at once; a role a set lacks
  falls back to `classic`; costume names per set.
- **`/possums roles`:** the gallery of 17 roles in 8 states, with role and costume names, on both
  surfaces (text on the terminal), in Session 6's still poses; Session 7a animates it, framed,
  as decided at Session 3 (amended at Session 3, with the owner).
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

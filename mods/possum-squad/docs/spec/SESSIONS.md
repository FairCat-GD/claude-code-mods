# The session plan: round 1, the agents panel

One block per session, in order, each run by *The session cycle* in the root
`docs/DEVELOPMENT-WORKFLOW.md`. The request and its resolved decisions are in `SPEC.md` beside
this file, with the frozen design draft `PDD.md` and its inputs in `research/`; all are
read-only; do not re-litigate them. A session that finds its block wrong amends it and records
the reason in the block and in `docs/next-session-prompt.md`. Session 13 closes the round: it
deletes this file, `SPEC.md`, `PDD.md` and `research/`, and anything left open moves to
`docs/BACKLOG.md`.

In every Read line, `SPEC` decisions are by number, `PDD` places by part and ID, and
`ARCHITECTURE` sections by name. Standing gates from Session 1 on, in every session that touches
what they guard: N-01, N-07 and I-01 to I-06, each with its test.

| Session | Scope | Decisions | Version |
|---|---|---|---|
| 1 | Skeleton: `/possums` toggles the pane on both surfaces; the state file; the hooks the spikes read, passing every event through | 10, 12, 19, 21; *The hooks*, *Values*, *The panel*, *Reach* | **0.1.0** |
| 2 | Spike build: fixture sprites in the pane, the event shapes as text, usage; the spike notes | 12, 15, 16, 17 | **0.2.0** |
| 3 | Panel shell: the spike results decided; `/possums open`, `set`, `settings`; `prefs`; the row on both surfaces | 5, 6, 15, 16, 19 | **0.3.0** |
| 4 | Runs: subagents as live rows with tokens, context and endings; reload and clear | 12, 13, 14 | **0.4.0** |
| 5 | The Lead, header totals, sections, Finished, the one-second clock; the terminal complete | 17, 18 | **0.5.0** |
| 6 | Sprites: `art/` seeded, the converter, compositor and SVG writer; `classic` in every state's still pose and the work loop; motion off | 5, 9, 15, 17 | **0.6.0** |
| 7 | Sets and gallery: `theme`, the other three sets, every state's animation, `/possums roles` | 5, 15 | **0.7.0** |
| 8 | Roles: the reference ported, the corpus, arrival and dressing | 2, 20 | **0.8.0** |
| 9 | Role picker and memory, states wired to runs, auto-open | 6, 19 | **0.9.0** |
| 10 | Attention: Needs you, gone quiet, toasts | 16 | **0.10.0** |
| 11 | Peek and the collapsed view; the `widget` seat | 18 | **0.11.0** |
| 12 | Plan limits, the cost estimate, nested helpers | 1, 22 | **0.12.0** |
| 13 | Docs, changelog, manual runs; `ARCHITECTURE.md` read cold; close the round | all | **1.0.0**, tagged `possum-squad-v1.0.0` |

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
- **The spike view goes:** the fixture sprites, the shape view, and every spike hook no later
  session needs.
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

---

## 4: Runs

**Read:** `SPEC.md` §2 decisions 12, 13, 14; `PDD.md` Part 4 *Worked examples*, *States & edge
cases*, Part 5 F-01, F-02, F-11, F-23, I-06, Part 6 *Domain model*, *Data lifecycle*, Part 5
*Tunables* (T-06, T-07, T-11); `ARCHITECTURE.md` *The invariants* (I-01, I-03, I-05, I-06), *The
hooks*, *Values: `$.state` and `$.store`*, *The run model*, *The panel*.

- **`hooks/model/`,** pure: event records in, runs out, per *The run model*: open, re-key,
  ignore unknown loops, resume, teammates, round 2, endings, fresh and cache tokens, context
  percent from `hooks/data/`'s dated window table (T-11).
- **`register.tsx`** turns `agent.spawn`, `turn.start`, `turn.step`, `turn.complete` and
  `tool.call` into records and writes `runs` through `update`; `types/index.d.ts` declares
  `runs`.
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
  - a turn event that arrives before the spawn's result joins the right row; an unknown loop
    opens none;
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

---

## 6: Sprites

**Read:** `SPEC.md` §2 decisions 5, 9, 15, 17; `PDD.md` Part 6 *Sprites*, Part 7 *Visual
direction*, *Motion & feedback*, Part 8 *Stack & architecture* (Drawing, Art source, Art tool),
Part 5 F-21, N-02, N-06, T-01, T-02; `research/art/manifest.json` and `research/sprites/` (the
recipes' reference); `ARCHITECTURE.md` *Layout and boundaries*, *Sprites and sets*, *The panel*,
*Testing strategy*.

- **Before anything:** the repo-level round that teaches the gate `tools/` is committed. If it
  is not, this session swaps with Session 8, logged as an amendment in both blocks.
- **`art/`,** seeded from `research/art/` by copying, unchanged.
- **The converter** in `tools/`: reads `art/`, writes `hooks/sprites/data.ts` (palette indices
  and layers for every set, recipes, costume names), Biome-clean; run by the session, its output
  committed.
- **The compositor, the SVG writer and the cache** in `hooks/sprites/`; `classic` drawn in
  every state's still pose and in the work loop; `motion` `off` writes no animation element; the
  light-theme approach decided at Session 3.
- **Rows draw their sprite** on surfaces where `Svg` resolves (decision 17).
- **Docs.**
  - `CHANGELOG.md`: 0.6.0.
  - `ARCHITECTURE.md`: Built for *Sprites and sets*, *Layout and boundaries* (`art/`, `tools/`),
    the converter's row of *Testing strategy*.
  - `CLAUDE.md`: how to run the converter.
- **Confirms:** *Sprites and sets* (layers, recipes, SVG, the cache), *Layout and boundaries*
  (`tools/` imports nothing from `hooks/`).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - every role and state of `classic` is under 16,000 characters (N-02);
  - with `motion` off no `Svg` source holds an animation element (F-21);
  - every palette colour on a sprite edge meets 3:1 on both themes or has the outline (N-06);
  - `data.ts` holds every layer `manifest.json` names (the converter's own checks are what the
    repo-level round decides).

**Watch for:**
- **`research/` is input:** copy from it, never edit it.
- **The generated file must come out Biome-clean,** or `format` fails on a file no one wrote by
  hand.
- **One `Svg` source holds at most 131,072 characters,** and every sprite needs `alt`.

---

## 7: Sets and gallery

**Read:** `SPEC.md` §2 decisions 5, 15; `PDD.md` Part 6 *Roles and outfits*, *The other sets*,
*Sprites*, Part 7 *Motion & feedback*, Part 5 F-08, F-26, F-27, N-04, N-05; `ARCHITECTURE.md`
*Sprites and sets*, *The panel* (the gallery), *The command and settings*, *Testing strategy*.

- **The other three sets** in `data.ts`; `/possums set theme` redraws at once; a role a set lacks
  falls back to `classic`; costume names per set.
- **Every state's animation** as its recipe: arrival and the dressing hop, the work loop, the
  sign, the doze, the cheer then sleep, playing dead, the startle.
- **`/possums roles`:** the gallery of 17 roles in 8 states, with role and costume names, on both
  surfaces (text on the terminal), animated or still as decided at Session 3.
- **Docs.**
  - `CHANGELOG.md`: 0.7.0.
  - `ARCHITECTURE.md`: Built for *Sprites and sets*, *The panel* (the gallery), *The command and
    settings* (`roles`).
  - `USER-GUIDE.md`: themes and the gallery.

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - every set has 17 outfits, 17 props and 17 costume names; switching `theme` changes every
    sprite and no role name; a fictional two-role set falls back to `classic` for the other 15
    (F-27);
  - every role and state of every set is under 16,000 characters (N-02);
  - the gallery holds 17 roles and 8 states on both surfaces (F-26);
  - with three agents working, at most one invalidation per mock second (N-04).
- N-05 timed by hand: building the tree for 20 rows, recorded in the done-note.
- After the push, the owner reviews each set in the gallery on the desktop app (H6); a set not
  ready is cut whole (decision 5); what goes to polish is listed in `docs/BACKLOG.md`.

**Watch for:**
- **One-shot recipes** (finished, stopped) settle on their own; Session 2 measured whether a
  redraw restarts them.

---

## 8: Roles

**Read:** `SPEC.md` §2 decisions 2, 20; `PDD.md` Part 6 *Role detection*, Part 4 *Worked
examples*, Part 5 F-05, F-06, I-07, T-03, T-04; `research/roles/`; `ARCHITECTURE.md` *Roles*,
*The run model*, *Sprites and sets* (`starting`), *Testing strategy*.

- **The port:** `research/roles/role_engine_reference.py` to `hooks/roles/` with its behaviour
  unchanged; rule 1 ("stated") reserved with no source.
- **The corpus:** `research/roles/role-corpus.json` as `tests/fixtures/role-corpus.ts`, its items
  copied unchanged.
- **Detection on runs:** type, name and description at spawn; decisive and weak tool calls;
  Helper at T-04 from the one-second clock, not a timer of its own; a row arrives plain and
  dresses with one hop when its role settles.
- **Docs.**
  - `CHANGELOG.md`: 0.8.0.
  - `ARCHITECTURE.md`: Built for *Roles*; I-07's *Enforced by*.
  - `USER-GUIDE.md`: how roles are chosen.
- **Confirms:** *Roles* (the rule order, settled once).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - every `dev` item and at least 90% of `holdout` get their label (F-05);
  - "Take care of it" then an Edit is Builder; with no call past T-04, Helper (F-06);
  - a settled role never changes on later calls (I-07).
- After the push, the owner's week of use for H1 starts.

**Watch for:**
- **Labels are fixed, and `holdout` never tunes the table;** cases may be added to `dev`.
- **`subagentType` carries the engine's spelling** (`Explore`, `general-purpose`): match the
  reference's case handling, not a guess.

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
  - `CHANGELOG.md`: 0.9.0.
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

- **Needs you** on the signal decided at Session 3, or F-12 left out (as recorded then).
- **Gone quiet** after T-05 with no tool call in flight.
- **Toasts** while the pane is closed.
- **Docs.**
  - `CHANGELOG.md`: 0.10.0.
  - `ARCHITECTURE.md`: Built for *Attention*.
  - `USER-GUIDE.md`: Needs you, quiet, toasts.
- **Confirms:** *Attention* (Needs you's signal, as decided at Session 3).

**Gates:**
- `npm run verify -- possum-squad`, with these tests:
  - a waiting call moves its row to Needs you and back when answered (F-12, if kept);
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
  - `CHANGELOG.md`: 0.11.0.
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
  - `CHANGELOG.md`: 0.12.0.
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

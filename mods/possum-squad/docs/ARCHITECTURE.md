# possum-squad — architecture

How the mod is built. **Decided** is the owner's: what the intake answered or the owner settled
with a session. It changes only with the owner, and each change after Session 0 is logged in the
*Decision log*. **Built** is what exists and how, with the decisions a session made on its own
within its scope, each with its why; every session keeps it true. Until something is built, its
Built part says "Not yet: Session <id>". In the invariants, each rule and its why are decided and
*Enforced by* is built; the debt and the baseline are built only.

## Overview

**Decided.**

```
  Claude Code's engine                     possum-squad
  ┌──────────────────────┐   events    ┌──────────────────────────────────────────────┐
  │ agent.spawn, turn.*, │────────────▶│ hooks/register.tsx  the only file using $   │
  │ tool.call, …         │◀────────────│   passes every event on unchanged            │
  │                      │  unchanged  │      │ plain records                          │
  │ $.state  $.store     │◀───────────▶│      ▼                                        │
  │ $.ui (the pane)      │◀── trees ───│ model/ (runs)   roles/   sprites/   view/    │
  └──────────────────────┘             └──────────────────────────────────────────────┘
                                          art/ ──tools/ (Node, offline)──▶ hooks/sprites/data.ts
```

The mod watches the main session and every subagent, and draws one side pane, `possum-squad`,
listing them with live numbers and state. `hooks/register.tsx` is the adapter: it hooks the
engine's events, passes each on unchanged, turns it into a plain record, and calls pure modules.
`hooks/model/` turns records into runs and totals; `hooks/roles/` picks each run's role;
`hooks/sprites/` writes each sprite as an SVG string from the generated art data; `hooks/view/`
builds the pane's element trees, one builder for the desktop app and one for the terminal. The
art's source is the PNG layers in `art/`, which a Node script in `tools/` turns into
`hooks/sprites/data.ts`, outside the engine.

**Built** (0.10.0). The Lead, header, sections, roles with the person's picker, sprites in every
set with every state's animation, the gallery, and auto-open.
`hooks/register.tsx`, named by `hooks/hooks.json`, does the following:
- registers `/possums` with its words `open`, `roles`, `set` and `settings`;
- toggles and draws the pane: the Lead row and the session line, then the sections of subagent
  runs, the empty panel's line, or the gallery; on every surface but the terminal, each with
  its sprite, in the set `prefs.theme` names;
- turns subagents' spawns, turns and steps into records, and keeps the runs in `runs`;
- settles each run's role from the person's pick remembered for its custom type, its type, its
  description and its first calls, and Helper at T-04 or at its end; a row's role button opens
  a picker whose choice reassigns that run, and is remembered for a custom type;
- opens the pane by itself when an agent starts, as `prefs.autoOpen` says, unless the person
  closed it;
- keeps the main session's context, tokens and time in `lead`;
- runs the one-second clock while the pane is open and a run is live, or a run's role may still
  fall back to Helper;
- empties `runs` and `lead` when the session is cleared, resumed or forked;
- keeps the settings and Finished's flag in the store under `prefs`, and each custom type's
  picked role under `role:<agent type>`; in `view`, a close by the person, whether the gallery
  is open, and which row's picker is;
- passes every event on unchanged.

Of the pure modules:
- `hooks/model/` turns records into runs (`runs.ts`), the Lead and the header's totals
  (`lead.ts`), and a step's calls into an activity (`tools.ts`);
- `hooks/roles/` holds the role rules and their word lists (`rules.ts`, `words.ts`);
- `hooks/data/models.ts` holds the dated window table;
- `hooks/view/` holds the panel and its sections (`panel.tsx`), the gallery (`gallery.tsx`), the
  Lead row and the session line (`lead.tsx`), a run's row data (`runs.ts`), the row builders for both surfaces (`row.tsx`) and
  the empty panel's line (`empty.tsx`);
- `hooks/sprites/` writes each sprite from the generated art data (`data.ts`), by its recipe
  (`recipes.ts`), composed (`compose.ts`), written as SVG (`svg.ts`) and cached (`index.ts`);
- `hooks/settings.ts` holds the settings and the command's words;
- these sit beside `hooks/strings.ts` and `hooks/config.ts`.

The art's source is in `art/`, and `tools/art.ts` turns it into `hooks/sprites/data.ts`.

## Context

**Decided.** The mod runs inside Claude Code's engine, as a plugin of function hooks.
- **What crosses.** The engine calls the hooks the module registers with `register(on, options)`.
  The module reaches everything outside itself through `$`: the session, the UI, the store. It has
  no DOM, no Node and no `import()`, and its JSX compiles against the global `h`.
- **Who owns it.** The engine and its API are Anthropic's, early access, and they change between
  releases. The declarations of the running build are the authority, never memory.
- **Two builds.** The CLI on PATH runs `claude plugin validate` and `claude plugin test`; the
  desktop app runs its own engine, which can be another version. The desktop app runs only the
  installed release, so what it draws is seen only after a push.
- **How it fails.** A hook that throws is the engine's to contain. A gating hook carries a
  `.catch` that lets the event go on unchanged, so the mod's fault never costs the owner a call.
- **What the engine gives, as read from the declarations (2.1.325 and 2.1.326):**
  - `agent.spawn`'s input carries `tool_use_id`, `prompt` (the brief), `description`,
    `subagentType`, `parentAgentId` (absent when the main session spawns), `resume.agentId` when
    an agent resumes, and `model` only as the caller gave it. Its result carries the agent id and
    the resolved model.
  - `turn.start`, `turn.step` and `turn.complete` carry `agentId` for a subagent's loop and none
    for the main session. `turn.step` gives the model and the effort, and its result the
    request's usage (`input_tokens`, `output_tokens`, `cache_read_input_tokens`,
    `cache_creation_input_tokens`). `turn.complete` gives `reason` (`answer`, `aborted`,
    `error`, `refusal`), `answer` ("" when there is none), `durationMs` and `usage`.
  - `tool.call` carries `tool`, `tool_use_id`, the tool's arguments as fields, and `agentId` for
    a subagent's call. `tool.check` carries the same ids and is answered with a `decision`
    (`allow`, `ask`, `deny`).
  - `session.measure` fires after each main-session turn and when a plan limit moves a point,
    with `context`, `rateLimits` (`kind`, `percentUsed`, `resetsAt`) and `cost`.
  - `classic.PermissionRequest` fires as a permission prompt is about to show; no event says
    the person answered it. The API reads neither the user's reduced-motion preference nor the
    app's light or dark theme; a sprite's own CSS media queries do (*Sprites and sets*).
  - A `tool.call` or `tool.run` hook that may match a tool, even one that only passes `next(e)`
    on, turns off for that tool its move to the background, a served call's live output, and
    Code Mode's wait for a stopped result. `tool.run` fires when a call has been allowed and is
    about to run, after whoever settled an ask; never for a refusal.
  - `turn.step`'s result lists `toolUses`, the calls the response asks the engine to run, by
    name and input, with no call id. `classic.PreToolUse`'s `e` is `tool.call`'s envelope
    without `agentId`; `classic.PostToolUse` and `PostToolUseFailure` carry `agent_id` from a
    subagent. From 2.1.329, `agent.report` fires as a subagent's report reaches its parent,
    with `status` `completed`, `failed` or `stopped`; not for a teammate or a workflow's agent.
- **What the mod never assumes:** the order in which hooks of different events arrive (a
  subagent's turn may begin before its spawn's result); that a field the declarations mark
  optional is present; the shape of an event it does not recognise; that a surface exists; that
  a pane is placed or shown.

**Built.** What the engine's test kit did on CLI 2.1.326, then what the spike build showed in a
terminal and in the desktop app.
- **A malformed event.** The engine refuses a `next(e)` whose argument lacks a field it needs
  (`turnId` on `turn.start`, `answer` on `turn.complete`); the hook is reported skipped and the
  event goes on with what the hooks beneath give. A `turn.step` with no `turnId`, `index` or
  `model` fails in the engine's own chain before any plugin's hook, and a step's result must
  name the step it answers.
- **A stream's result.** Inside a hook, `next(e)` on `turn.step` is a stream with `.result`, and
  `yield* next(e)` returns the same result. The stream the kit's own `$.turn.step` hands a test
  has no `.result`, so tests read the result from the stream's end.
- **A pane's close.** Only the engine sets `ui.close`'s `origin`: a plugin's `$.ui.close` is
  `plugin`, and the kit's `$` cannot close a pane as the person. The test of the person's close
  runs the module's `ui.close` hook by itself, with a `$` holding only state.
- **A tool call asks inside itself.** A `tool.call` whose check answers `ask` raises its own
  `tool.check`, then `classic.PermissionRequest`, before its own result comes back. From a
  subagent, the request carries `agent_id`.
- **The kit's terminal table answers `Svg`,** with an element that draws an empty `Box`, though
  the declarations give the terminal none. Whether a surface draws sprites is read from
  `e.surface`, never from the table.
- **`$` goes only to top-level functions.** The engine refuses to load a module that passes `$`
  to a function declared inside `register`.
- **A test plugin closes over nothing of its test file.** A drawing that needs the module's
  builders is the test's own `ui.render` hook, matched with `{ plugin: '*' }`.
- **`Progress` is drawn as `Box` and `Text`** on every surface but mobile: a column the full
  width of its row, its label and value text above a thin fill.
- **`$.store` is not reactive:** reading it while drawing subscribes nothing, so a change to it
  redraws a pane only through `$.ui.invalidate`.
- **A command's text answer goes in no request** when it carries `isTextDisplayOnly`, on the
  queued lanes, as the declarations say; not checked by hand. An `immediate` command answered
  mid-turn keeps its text in requests: the engine's rule.
- **The engine prefixes a plugin's command answer** with the plugin's name, on the answer's
  first line (`possum-squad: …`), seen in the terminal.

What the terminal showed: CLI 2.1.326, `claude --plugin-dir mods/possum-squad`, run by the owner
with a prompt starting three subagents and one starting a subagent that ran a shell command
needing permission.
- **`agent.spawn`'s fields:**
  - its input has `tool_use_id`, `prompt`, `description`, `subagentType`, `provider`,
    `parentModel`, `permissionMode`, `background` and `fork`, with `model`, `name` and `cwd`
    present as `undefined`, and no `parentAgentId` from the main session;
  - its result has `model` and `agentId`;
  - a spawn's result came back before the spawned agent's first `turn.start`, with the
    agents running in the background.
- **`turn.start` and `turn.step`** carry `agentId` from a subagent and none from the main
  session. `turn.step`'s `usage` also carries `ephemeral_5m_input_tokens` and
  `ephemeral_1h_input_tokens`.
- **Plan limits arrive on a subscription.** `$.session.usage()` and `session.measure` gave the
  same `five_hour` and `seven_day` percents.
- **A `userConfig` field shows in the terminal's `/config`.** Changing it reloads the mod: what
  the module keeps in memory starts over, and a `$.clock.every` timer stops while the pane
  stays open.
- **A pane taller than its seat is cut off.** Inline above the prompt it showed about fifteen
  rows. Docked at full height it showed the first half of the list, and scrolling with the mouse
  over it moved nothing. So the entries for `turn.complete`, `tool.call`, `tool.check` and
  `session.measure`, and the redraw count, were not read. The owner saw the
  `classic.PermissionRequest` entry while the permission prompt waited.

What the desktop app showed: engine 2.1.325, the installed 0.2.0, run by the owner with the same
two prompts and the permission mode off auto.
- **The clock ran:** the redraw count rose once a second. A `$.clock.every` tick armed in a
  `/possums` dispatch that has ended may call `$`.
- **SMIL runs in a pane.** Twenty framed sprites bobbed with the app smooth, scrolled and typed
  in; the once-a-second redraw neither restarted nor stuttered a bob. A sprite drawn as an
  image bobbed too.
- **Media queries inside a sprite:** `prefers-color-scheme: light` followed the app's theme,
  framed and as an image. `prefers-reduced-motion: reduce` stopped the framed sprite; the image
  kept moving.
- **A permission wait:** for each of two asked Bash calls from subagents, `tool.check` answering
  `ask`, then `classic.PermissionRequest`, came back while the prompt still waited. The
  request's result is empty. It carries `agent_id` and `agent_type`, and no `tool_use_id`.
- **Field names, beyond the terminal's:**
  - `agent.spawn`'s `model` is a string when the caller gives one;
  - `turn.step`'s usage holds the four token counts and `model`, and no `ephemeral_*` fields;
  - `turn.complete` has `answer`, `durationMs`, `isAborted`, `turnId`, `reason` and `usage`;
  - `tool.call` has the tool's arguments, `tool` and `tool_use_id`, plus `agentId` from a
    subagent, and answers `ref`, `result`, `text` and `isReadOnly`;
  - `tool.check` has `tool`, `input`, `tool_use_id`, `approver` and `isReadOnly` (absent on an
    ask), plus `agentId`, and answers `decision`, plus `reason` on an ask;
  - `classic.PermissionRequest` has the classic hooks' common fields: `session_id`,
    `transcript_path`, `cwd`, `scratchpad_dir`, `prompt_id`, `permission_mode`, `agent_id`,
    `agent_type`, `effort` and `hook_event_name`. It also has `tool_name`, `tool_input` and
    `permission_suggestions`;
  - `session.measure` has `context`, `rateLimits`, `cost {usd}` and `changed`.
- **No `turn.complete` from a subagent** was listed, though two of the three agents had
  answered: the main session's three turns completed, the subagents' none. How a subagent's end
  arrives is Session 4's to measure.
- **The desktop's plugin manager lists a `userConfig` field** and changes it.

What Session 4's probe showed: a scratch plugin outside the repository, CLI 2.1.329, in a
terminal session that loaded no other plugin; the owner typed the prompts.
- **The background move.** With a pass-through hook on `tool.call` loaded and firing for the
  call, a foreground Bash command still moved to the background with ctrl+b, and one asked to
  run in the background still returned at once; so did each with `classic.PreToolUse` or
  `classic.PostToolUse` hooked. The cost the declarations name was not seen for Bash; a served
  call's live output and Code Mode's wait were not tried.
- **What the tool events carry.** `classic.PreToolUse` had `tool`, `tool_use_id` and the
  arguments, from a subagent's call too, as the kit showed. `classic.PostToolUse` had
  `agent_id` from a subagent's call and none from the main session's, beside `tool_name`,
  `tool_input`, `tool_use_id`, `tool_response` and `duration_ms`; for an Agent call it fired as
  the background agent launched.
- **A spawn's order,** in all eight spawns: the spawn's input, the agent's `turn.start` (with
  `agentId`), `classic.SubagentStart`, then the spawn's result. The result came after the
  agent's first turn began, the reverse of what the 0.2.0 terminal run showed.
- **A subagent's end,** in all eight: `agent.report` (`completed`), the step that hands the
  report back (`toolUses` naming `SubagentHandback`), `classic.SubagentStop`, then one
  `turn.complete` with `agentId`, `reason` and `usage`. `classic.SubagentStop` also fired for
  the engine's own helpers, with an empty `agent_type` and ids no spawn named, and twice for one
  agent.
- **A clear.** `classic.SessionStart` came with `source: clear`, and a `$.state` value written
  before it read as unset after it.
- **Context windows.** `session.measure` gave the main session (Opus 5.5) 1,000,000 tokens;
  `$.agent.list()` gave the same for subagents on Haiku 5.5 and Sonnet 5.5.
- **The desktop app** (engine 2.1.326) did not load a plugin folder named by
  `CLAUDE_CODE_PLUGIN_DIRS`, so how a subagent ends there was not measured. With 0.4.0
  installed, the owner saw the desktop's rows show and end.

What the kit did in Session 5, CLI 2.1.329:
- **Each test loads the module afresh,** so module memory (the clock's timer and flags) never
  leaks from one test to the next.
- **A timer armed in an event hook** goes on beating after the hook has returned, as one armed
  in a command does.
- **A refused period ends a `$.clock.every` interval** without a word to the module that armed
  it; the engine reports the refusal. A plugin hooking `clock.every` sees one period more than
  the beats that ran: each beat asks for the next.
- **A state write's redraw lands at the redraw rate,** on the mocked clock: a test moves the
  clock a little before it reads or unmounts a drawing a write changed. An invalidation's
  redraw lands within the act that made it.
- **A state value's version is numbered across the test file:** a value never written reads
  0, and a written one some later number, not 1.
- **What a plugin's module logs is not shown** under `claude plugin test`.

## Stack and pins

**Decided.** TypeScript, typed against the declarations the engine lays in
`.claude-plugin/types/` for the CLI's build (`npm run types`, from the repository's root), never
committed. Tests run under `claude plugin test`, against the engine's kit (`claude-code/testing`),
not Node. The sprite converter in `tools/` is TypeScript run by the repository's Node, with no
dependency (PNG read with `node:zlib`); how the gate checks it is set by the repo-level round
that teaches it `tools/`. The tooling's own pins are the repository's.

**Built.** Declarations read at intake: CLI 2.1.325, then 2.1.326 (it updated itself during
`npm run types`). 0.1.0 to 0.3.0 were built and checked on CLI 2.1.326, 0.4.0 and 0.5.0 on
2.1.329 (the CLI updated itself twice during Session 4's `npm run types`). The desktop app ran
engine 2.1.325 for the 0.2.0 run, and 2.1.326 on 2026-11-20. 0.6.0 and 0.7.0 were built and
checked on CLI 2.1.330, with Node 26.7.0 for `tools/`.

## Layout and boundaries

**Decided.**
- **Layout:**
  - `.claude-plugin/plugin.json`: the manifest; its `version` is the mod's one version; it names
    `types/index.d.ts` under `types`;
  - `hooks/hooks.json`: names the one hooks module, `hooks/register.tsx`;
  - `hooks/model/`: pure; event records in, runs and totals out;
  - `hooks/roles/`: pure and table-driven; the role rules and their word lists;
  - `hooks/sprites/`: the recipes, the compositor, the SVG writer, the cache, and `data.ts`, the
    art data the converter generates (committed, Biome-clean, never edited by hand);
  - `hooks/view/`: functions from data, resolved elements and callbacks to trees, one set for
    the desktop app and one for the terminal;
  - `hooks/strings.ts`: every string the pane draws, in one English table;
  - `hooks/config.ts`: the tunables T-01 to T-14 (*The panel*, *Roles*, *Sprites and sets*,
    *Attention*);
  - `hooks/data/`: dated tables: each model's context window, each model's price;
  - `types/index.d.ts`: the `$.state` contract;
  - `art/`: the art's source (PNG layers, `manifest.json`, `palette.json`), seeded from the
    round's frozen inputs;
  - `tools/`: the converter, run by hand when `art/` changes;
  - `tests/`: the tests; `tests/fixtures/`: fictional data and the role corpus;
  - `CLAUDE.md`, `CHANGELOG.md`, `README.md`, and `docs/` for this mod's workflow files.
- **Boundaries:**
  - every file the module imports is inside this folder, and every bare import names a module
    the engine declares;
  - `hooks/register.tsx` is the only file that uses `$`; the others take plain data and return
    plain data or trees, so a change in an event's shape lands in one file;
  - dependencies point one way: `register.tsx` uses `model/`, `roles/`, `sprites/`, `view/`;
    `view/` uses `sprites/` and `strings.ts`; `model/`, `roles/` and `sprites/` use nothing of
    each other but `config.ts` and `data/`;
  - nothing in `hooks/` or `tests/` imports from `tools/`, and `tools/` imports nothing from
    `hooks/`: it reads `art/` and writes `hooks/sprites/data.ts`.

**Built** (0.8.0). In place:
- the manifest, `.claude-plugin/plugin.json`, naming `types/index.d.ts`;
- the hooks: `hooks/hooks.json`, `hooks/register.tsx`, `hooks/config.ts` (T-03, T-04, T-06 and
  T-13) and `hooks/strings.ts`;
- `hooks/model/`, pure: `runs.ts` (runs from records, and their figures), `lead.ts` (the Lead
  from measures and main turns, and the header's totals) and `tools.ts` (a step's calls as an
  activity). It uses `config.ts`, `data/` and the types alone;
- `hooks/roles/`, pure: `words.ts` (the word lists) and `rules.ts` (the rules in their order,
  the calls read a step at a time, and the fallback). It uses `config.ts` and the types alone;
- `hooks/data/models.ts`: the dated window table (T-11);
- `hooks/sprites/`, pure: `types.ts` (the art's shape), `data.ts` (generated), `compose.ts`
  (grids of palette keys, and a recipe's frame on them), `recipes.ts` (each pose's frame, the
  tongue and the work loop), `svg.ts` (the writer and the light-theme outline) and `index.ts`
  (a look's sprite, cached, and the empty panel's squad). It uses `config.ts` and the types
  alone; `hooks/config.ts` holds T-01 and T-02 for it;
- `art/`: the round's frozen `research/art/`, copied, its JSON formatted, then `failed`'s flip
  widened (*Sprites and sets*);
- `tools/`: `png.ts` (reads and writes 8-bit RGBA PNG), `art.ts` (the converter), their specs
  and `tools/fixtures/art.ts`, a fictional art folder as data;
- `hooks/settings.ts`, pure: the settings with their values and defaults, reading and merging
  `prefs`, the command's words, and the settings list's text. It is not in the Decided layout:
  the settings are neither runs, roles, sprites nor views, and the command and the pane both
  need them. It uses only `strings.ts`;
- `hooks/view/`: `panel.tsx` (the header and the sections), `gallery.tsx` (the gallery, one
  builder per surface), `lead.tsx` (the Lead row, one
  builder per surface, and the session line), `empty.tsx` (the empty panel's line), `runs.ts`
  (a run's row data and its activity line), `row.tsx` (the row, one builder per surface),
  `sprite.tsx` (a sprite as an `Svg`) and `format.ts` (tokens, time, percent and the block
  bar);
- the contract, `types/index.d.ts`: `View`; `StateId`; `RoleId`, `RoleSource` and `Role`;
  `Runs`, `Run`, `Pending`, `Past`, `Tokens` and `Activity`; `Lead` and `LeadContext`;
- the tests, in `tests/`:
  - `tests/engine.ts`: the engine's stand-in, the store's stand-in, the shared test values, and
    `hooksOf`, which hands a test the module's hooks from one registration;
  - `tests/fixtures/events.ts`, `tests/fixtures/rows.ts`, and `tests/fixtures/role-corpus.ts`,
    the round's role corpus copied unchanged;
  - `tests/model.test.ts` runs the model's functions on records alone; `tests/runs.test.ts`
    raises events in the kit and mounts the pane;
  - `tests/header.test.ts` draws fixture panels with the view's builder, and raises the events
    that feed the Lead and the header; `tests/clock.test.ts` moves a pinned clock and counts
    what the mod's timer asks of the engine, through a plugin beside it;
  - `tests/roles.test.ts` runs the rules on the corpus and the PDD's worked examples;
    `tests/settle.test.ts` raises spawns, steps and ends, and reads each row's role from the
    drawn pane;
  - `tests/compose.test.ts` composes `tests/fixtures/art.ts`, a fictional art;
    `tests/sprites.test.ts` reads every sprite of every set with its own SVG reader, playing the
    loop's SMIL a step at a time; `tests/pane-sprites.test.ts` raises events and reads the
    pane's `Svg` elements;
  - `tests/sets.test.ts` checks the four sets, the switching, and a fictional two-role set's
    fallback; `tests/gallery.test.ts` runs `/possums roles` and reads the drawn gallery.

How it is held:
- *Enforced by* the gate's `imports` stage (the import scan) and `validate`
  (`claude plugin validate`) for the first boundary. The scan accepts a type import from
  `types/index.d.ts`.
- The one-file rule is enforced by review: no test reads source files, and `validate`
  already lists every `$` call the module makes, with the helper it goes through. The view and
  the tables import only types from `claude-code`.
- `emptyPanel` serves both surfaces with `Box` and `Text`, and `panel` with `Button` too. The
  row and the Lead each have a builder per surface: the terminal's take `Box` and `Text`, the
  desktop's also `Progress`. `panel` reads `Svg` only off the terminal.
- `tools/` is walled off by the import scan: it imports only `node:` modules and its own
  files, and nothing in `hooks/` or `tests/` imports it. The converter writes
  `hooks/sprites/data.ts` as text and imports nothing of `hooks/`; `data.ts` imports only the
  types in `hooks/sprites/types.ts`.
- The tests import from `hooks/` (the module's `register`, `PANE` and `view`, the settings,
  the strings, the view builders and the config), so a test never repeats a value the module
  owns.

## The invariants

1. **The mod is self-contained.** *Why:* the installed copy holds only its folder. *Enforced by*
   the `imports` and `validate` stages.
2. **The mod's version lives in `plugin.json` alone, and its changelog's newest entry names it.**
   *Why:* one home per version. *Enforced by* the repository's `marketplace` stage.
3. **The mod keeps nothing in its folder it would not publish.** *Why:* the installed copy holds
   every tracked file of it, docs and tests included. *Enforced by* the hygiene stage, for what it
   can see.
4. **I-01: the mod never changes, denies or answers an engine event,** except its own command.
   *Why:* watching must change nothing Claude does. *Enforced by* `tests/pass-through.test.ts`:
   for each hooked event the result equals what the engine's stand-in gave, and `turn.step`'s
   chunks arrive unchanged and in order. It also checks that the mod hooks neither `tool.call`
   nor `tool.run`, since a hook there changes how a tool runs.
5. **I-02: the mod calls nothing outside the allow-list in *Reach*.** *Why:* "what can this do?"
   must have a short, provable answer. *Enforced by* the baseline, which records `validate`'s
   calls line; a change to it is the owner's, recorded in the done-note.
6. **I-03: no text from a brief, an answer, a file path or a tool argument is written to the
   store or to a log.** *Why:* that text is the owner's work, and the panel has no need to keep
   it. *Enforced by* `writeStore` in `hooks/register.tsx`, the one function that writes the
   store: its payload type holds only setting values and panel flags, or an agent type's name
   in the key `role:<agent type>` and a role id as its value. And by `tests/prefs.test.ts`:
   after fixture agent events, a press of Finished's show button on each surface and a change
   of every setting, every write holds only those fields, and no fixture brief, description,
   answer or path; a pick on each surface for a custom type writes only its key and the role
   id, and neither the agent's brief nor its description.
7. **I-04: agent-supplied text is drawn only as plain `Text`,** never inside an `Svg`, never as
   `Markdown`. *Why:* it may carry markup or links. *Enforced by* `tests/row.test.ts`, on both
   surfaces. Every fixture row's description and activity is drawn whole, in a `Text` of its
   own; no other element's props hold agent text; and a description with markdown, a link and a
   tag draws as that plain text, with no `Markdown` or `Link`. The desktop's one `Svg` is the
   row's sprite: its source is what the sprite module writes from the mod's own art, and its
   other props hold no agent text.
8. **I-05: a fault in the mod never blocks or alters a turn.** *Why:* the mod runs in every
   session the owner starts. *Enforced by* every event hook returning what `next` gave; a
   `.catch` passing the event on, on every hook but the command's and the pane's drawing; a
   test raising each hooked event with a shape the mod does not know; and the reading guards in
   `hooks/register.tsx`, `record` and `recordLead`, which read the time and write `runs` or
   `lead` inside `try`, apart from the event's result. The clock is armed inside a guard too.
   `tests/pass-through.test.ts` runs each recording hook, `session.start`, `session.measure`
   and the main session's `turn.complete` among them, with a `$` whose state and clock refuse
   every call, and gets back what `next` gave. The role rules read anything that is not text as
   empty, so a malformed event never throws there, and they run inside the reading guard. The
   clock's beat settles Helper inside a guard of its own, which leaves the clock running.
9. **I-06: a state is never shown by colour or sprite alone;** each row carries its state word.
   *Why:* accessibility, and the terminal has no sprites. *Enforced by* `tests/row.test.ts`
   (every fixture row, in each state, on both surfaces) and `tests/runs.test.ts` (rows drawn
   from runs, and the five endings, on both surfaces).
10. **I-07: a run's outfit never changes once its role is settled,** except by the person's own
    reassignment. *Why:* a changing outfit misleads. *Enforced by* the model: evidence reaches a
    run only through `withEvidence` in `hooks/model/runs.ts`, which leaves a run with a role as
    it is, and `fellBack` settles only a run with none. The person's pick reaches it only
    through `reassigned`, called from the picker alone. `tests/model.test.ts` checks a role
    settled by words, by calls and by the fallback, and one the person picked, against a later
    decisive call and the fallback; `tests/settle.test.ts` checks it by events, past T-04 and at
    the run's end; `tests/picker.test.ts` checks a pick on each surface.
11. **I-08: no art or code from another mod, and no likeness of another party's mascot or of a
    film, game or cartoon character.** *Why:* the mod and its art are published under MIT.
    *Enforced by* review; every sprite originates from `art/`.
12. **N-01: zero tokens added to any request.** *Why:* watching is free. *Enforced by* a test
    that session start registers `/possums` and no tool, and `validate`'s calls line, which
    holds no `$.tool.register`. `/possums`'s answers in words carry `isTextDisplayOnly`, which a
    test checks. The declarations say it is read on the queued lanes; whether a `/possums`
    typed between turns is on one is not checked (`docs/BACKLOG.md`), and mid-turn the engine
    keeps such an answer in requests all the same.
13. **N-07: the mod's own work per event stays under 5 ms, and it awaits nothing but `next`, state,
    store and the clock's time in event hooks.** *Why:* every event of every session passes through it. *Enforced
    by* review. Arming the clock calls `$.clock.every`, which is synchronous: nothing waits on it.
    Auto-open asks for the panes and opens one, which N-07 does not allow a hook to await, so
    the spawn's hook starts it unawaited (`void autoOpen`), its every fault caught inside.
    The role rules read a shell command whole: a subagent's step whose call ran a 1 MB command
    took 2.0 to 2.6 ms in the kit, and the rules alone 3.8 ms on it (CLI 2.1.329).
14. **Nothing private enters the repository.** *Why:* the repository's whole history will be
    published. *Enforced by* the hygiene stage: the owner's term list against every file, path and
    commit message, attribution against every commit message, and secrets by their exact shapes.

## The hooks

**Decided.** Each event the mod hooks, and what it does there. No hook changes, denies or answers
an event but the command's (I-01); each awaits `next(e)`, reads what it needs, and returns what
`next` gave. Every body is wrapped so its failure passes the event on (I-05); every hook
`validate` lists as gating has a `.catch` that does the same.

| Event | What the mod does | From |
|---|---|---|
| `session.start` | Registers `/possums` (`immediate`); after a reload, re-arms the clock if a run is working | 1 |
| `command.run` `{ command: 'possums' }` | Answers the command (*The command and settings*) | 1 |
| `ui.render` `{ component: 'Pane' }`, its `requestId` `possum-squad` | Draws the pane from state; never writes state | 1 |
| `ui.close` | Stops the clock; when `origin.kind` is `person`, records it in `view` | 1, 5 |
| `agent.spawn` | Opens a row from the input; re-keys it from the result | 2, 4 |
| `turn.start` | Marks the loop's row working | 4 |
| `turn.step` (streaming) | Yields every chunk through untouched; from the input, the model and effort; from the result, the usage and the calls it asks for (`toolUses`): the activity line, the last actions, files touched, calls in flight, the role's tool evidence | 2, 4, 8, 10, 11 |
| `turn.complete` | Ends the row (*The run model*); the main session's adds its tokens and time to the Lead | 4, 5 |
| `session.measure` | The Lead's context and the plan limits | 2, 5, 12 |
| `classic.SessionStart` | On `clear`, `resume` or `fork`, cancels the clock and redraws from the reset state | 4 |
| `classic.PermissionRequest` | Needs you begins for the run its `agent_id` names (*Attention*) | 2, 10 |

- `turn.step` is the costliest: it sits on every model request of the session. It is kept
  because it is the only source of per-request tokens, model and effort. Its body is
  `return yield* next(e)` around reads that cannot throw into the stream.
- **A tool call's start comes from its step,** `turn.step`'s `toolUses`, by the step's
  `agentId`; the mod hooks neither `tool.call` nor `tool.run`, nor the classic tool-use events.
  A step's calls are in flight until that loop's next step or its end. The declarations say a
  `tool.call` or `tool.run` hook turns off a tool's move to the background; the probe did not
  see that for Bash, and the cases it names beside it were not tried (*Context*).
- **A subagent ends on its `turn.complete`,** which carries the reason the endings need.
  `classic.SubagentStop` also fires for the engine's own helpers and can fire twice, and
  `agent.report` misses teammates and workflow agents; neither is hooked.
- **The main loop's `turn.start` and `turn.step` make no `$` call;** its `turn.complete` makes
  one write to `lead`, once per main turn, beside the one `session.measure` makes then.
- Session 1 hooks every event marked 2 as a pass-through, so Session 2 only reads.
- The spike's hooks that no later session needs are gone: `tool.check` and `tool.call`.

**Built** (0.5.0). Eleven hooks, in `hooks/register.tsx`:
- `session.start` registers `/possums` with `immediate` and its argument hint, awaits
  `next(e)`, then, inside a guard, arms the clock if `runs` holds a live run (*The panel*). It
  awaits only the state's read for that; the Lead is not seeded from `$.session.usage()`.
- `command.run` `{ command: 'possums' }` and `ui.render` `{ component: 'Pane', requestId:
  'possum-squad' }`: *The panel*, *The command and settings*.
- `ui.close` `{ id: 'possum-squad' }` awaits `next(e)`. Unless the close was refused, it marks
  the pane closed and stops the clock, whatever the origin. Then, inside a guard, so a failed
  write loses only the flags, it writes `view` through `update` when the close changes it: it
  ends the gallery whatever the origin, and when `origin.kind` is `person` it also sets
  `isClosedByPerson`. A close that changes neither writes nothing. It returns what `next` gave.
- **The recording hooks** each return what `next` gave, and write through the reading guard
  (I-05): `record` makes the change through `update` inside `try`, and `recordAt` reads
  `$.clock.now()` first, inside the same `try`. A spawn and an end need the time, so they use
  `recordAt`; `turn.start` uses `record`. A subagent's step reads the time apart, so a clock
  that cannot be read loses only its Helper check, and records it with `record`.
  - `agent.spawn` first reads, for a custom type only, the role the person picked for it
    (`rememberedFor`, `role:<agent type>`, guarded). It records its row's opening before `next`,
    then its settling after, each with the role that pick, its type and its description settle
    (`atSpawn`), worked out inside the guard. If `next` rejects, it records a settling with no
    agent, which removes the row, and throws on. Once its result names an agent and is not
    refused, a new agent (no resume) starts `autoOpen` unawaited (*Attention*), so a refused
    spawn opens nothing. Whether its row starts the list is set inside the change of the write
    that opens the row (the opening, or the settling for a fork no tool call starts), so the
    try the engine keeps decides it, and agents spawned together open the pane once.
  - `turn.start` and `turn.step` record only an event that carries `agentId`: the main loop's
    make no `$` call.
  - `turn.step` delegates every chunk (`const result = yield* next(e)`), then records the
    step's model (the usage's, else the input's), its effort, its usage and its calls, and
    returns `result`. In the same change it first settles Helper on any run past T-04
    (`fellBack`), then reads the step's calls as role evidence (`toolsSeen`, from the run's
    reads and searches so far).
  - A subagent's `agent.spawn` opening, `turn.start` and `turn.step` each arm the clock when
    the pane is open (*The panel*): `$.clock.every` is synchronous, and a no-op while a timer
    is armed.
  - `turn.complete` with `agentId` ends its row, and settles Helper on it if no rule has, unless
    it is a teammate's or its turn left work in the background (`fellBack`); without, it is the main session's, and
    `recordLead` adds its `usage` and `durationMs` to the Lead (`turnCounted`). A malformed
    one never gets that far: the engine refuses its `next(e)` first (*Context*).
  - `session.measure` awaits `next(e)`, then records the Lead's context through `recordLead`
    (`measured`).
  - `classic.SessionStart` with `source` `clear`, `resume` or `fork` stops the clock, empties
    `runs` and resets `lead`. The engine resets `$.state` on a clear already (*Context*); the
    mod's own reset keeps the list right wherever it does not.
- `classic.PermissionRequest` is a plain pass-through, `next(e)`, for Session 10.
- Every hook but `command.run` and `ui.render` carries `.catch((_$, e, next) => next(e))`
  (`turn.step`'s a generator doing `return yield* next(e)`), gating or not, so the rule is one
  line to check. The engine's `next` there replays what the hook's own call settled to, so
  nothing beneath runs twice. `validate` lists four as gating: `ui.close`, `agent.spawn`,
  `classic.SessionStart` and `classic.PermissionRequest`. `command.run` reads no `next`, so it
  is not gating; its body catches its own faults (*The command and settings*).

## Values: `$.state` and `$.store`

**Decided.**
- **Entities and storage.**
  - `$.state` (live for a session; survives a reload of the mod; reset by the engine on clear,
    resume and fork), declared in `types/index.d.ts` under `PluginState['possum-squad']`:
    - `runs`: the session's runs, by run id (*The run model*). Written only through the `update`
      helper, never as a read and a later `set`, since several hooks write it at once.
    - `lead`: the main session's record: context tokens, window and percent; tokens; its
      turns' time; plan limits.
    - `view`: the session's flags: whether the person closed the pane, which run's Peek is open,
      whether the gallery is open.
  - Any plugin can read any `$.state` value. `runs` holds briefs, answers and file paths, so
    nothing more than a row needs is kept there, and none of it leaves state (I-03).
  - `$.store` (the owner's data across sessions, shared by every session on the machine; a read
    then a write is not atomic):
    - `prefs`: one object: `autoOpen` (`never`, `first`, `always`; default `first`), `cost`
      (`off`, `estimate`; `off`), `motion` (`auto`, `off`; `auto`), `theme` (`classic`,
      `steampunk`, `horror`, `prehistoric`; `classic`), `collapsed` (default false),
      `finishedOpen` (default false). Two sessions changing settings at the same moment may lose
      one change; accepted, since settings change rarely.
    - `role:<agent type>`: the role id the person picked for a custom agent type. Never written
      for the generic types (`general-purpose`, `claude`, `fork`) or the built-in ones. One key
      per type, so no value is built from a stale copy.
- **Evolution:** a stored value's shape changes forward-only: a new version still reads the old
  shape, because stored values are the owner's data. A key or value `prefs` does not know reads
  as the default and is kept on the next write.
- **Machine identifiers, never renamed:** the mod's name, `possum-squad`, and its install id,
  `possum-squad@claude-code-mods`, under which the engine keeps its `$.store`; the command
  `possums` and its words `open`, `set`, `settings`, `roles`; the pane id `possum-squad`; the
  setting names and values above; the set ids; the role ids (*Roles*); the state ids (*The run
  model*); the state keys `runs`, `lead`, `view`; the store keys `prefs` and `role:<agent type>`.
  Reserved for step reports, a later round: the tools `step` and `plan`, the setting
  `stepReports` (`off`, `tool`, `nudge`), the state key `planned`.

**Built** (0.1.0, `prefs` 0.3.0, `runs` 0.4.0, `lead` 0.5.0). `types/index.d.ts` declares
`PluginState['possum-squad']` with `view` as `Shaped<View>`, `runs` as `Shaped<Runs>` and `lead`
as `Shaped<Lead>`, and exports their types; `plugin.json` names the file under `types`, and
`validate` holds the module's state keys to it.
- `view` (gallery 0.8.0; the picker 0.10.0) is `{ isClosedByPerson, isGalleryOpen,
  pickerFor? }`: two booleans, default false (`NO_FLAGS`), and the spawn order of the run whose
  role picker is open, absent while none is. It is the atom in `hooks/register.tsx` with the
  shape tag `view-3`. A reload of the mod's code that names another tag reads the value as
  absent, so the tag changes whenever `View`'s fields do. Peek's run joins it in Session 11.
- Its writers, each through `update`:
  - the `ui.close` hook (*The hooks*), which also drops `pickerFor`;
  - `/possums roles`, which sets `isGalleryOpen`, and the gallery's close button, which clears
    it;
  - an open or a raise by `/possums`, `open` or `roles`, which clears `isClosedByPerson` when it
    is set (`forgetClose`);
  - a row's role button, which sets `pickerFor` to its run or, pressed again, drops it; and the
    picker's pick and `cancel`, which drop it.

  The pane reads it while drawing, so each write redraws it; a refused read draws the list.
  `autoOpen` reads `isClosedByPerson`.
- `runs` (0.4.0; `past` 0.5.0; roles 0.6.0; a role's moment 0.9.0) is `Runs`,
  `{ rows, pending, next, past }`, the atom `runs` with the shape tag `runs-4`, starting as
  `NO_RUNS`. *The run model*'s Built part
  has its fields and rules. The recording hooks write it, and the clock's beat when it settles
  Helper, each through `update`, so concurrent writes retry rather than lose one another; the
  pane reads it while drawing, which redraws it on every write. The beat reads it too, outside
  any drawing.
- `lead` (0.5.0) is `Lead`, `{ context?, tokens, workedMs }`, the atom `lead` with the shape tag
  `lead-1`, starting as `NO_LEAD`:
  - `context` is `session.measure`'s `{ tokens?, window, percent? }`, absent until the first
    measure. A fresh window's has no `tokens` or `percent` until the session's first reply;
  - `tokens` and `workedMs` sum the main session's turns, from each `turn.complete`'s `usage`
    and `durationMs`;
  - the plan limits join it in Session 12, with a new tag.

  Only `session.measure`, the main session's `turn.complete` and a clear-type
  `classic.SessionStart` write it, through `recordLead`; the pane reads it while drawing.

`prefs` (0.3.0), in `$.store`:
- **Its shape** is one flat object, as Decided. `hooks/settings.ts` holds each setting's values,
  in the order they are listed, and its default.
- **Reading** is `readPrefs`. A setting's value that is not one of its values reads as the
  default, a flag that is not `true` reads as false, and a stored value that is not an object
  reads as all defaults.
- **Writing** goes through `writeStore` alone (I-03). It reads `prefs` just before it writes,
  then sets the change over that value (`mergePrefs`), so a key or value this version does not
  know is kept. A stored value that is not an object is replaced: no version writes one.
  `autoOpen` reads `prefs` at each new agent.
- **Changes** come from `/possums set` and from Finished's show button, which writes
  `finishedOpen`; `collapsed` has no writer until its button (Session 11).
- **The pane reads `prefs` while drawing** (`finishedOpen`), so each change calls
  `$.ui.invalidate('ui.render')` after its write, since the store is not reactive. A change
  another session makes shows at this pane's next redraw. A store that refuses a read while
  drawing draws the defaults.

`role:<agent type>` (0.10.0), in `$.store`: the role id the person picked for a custom type
(`isCustomType` in `hooks/roles/rules.ts`: neither a generic type nor a built-in one, compared
lowercased), keyed by the type as the engine spells it, the value the bare id. The picker
writes it through `writeStore`; a spawn of that type reads it (`rememberedOf`), and a value
that is not a pickable role id reads as none. Nothing deletes one.

## The run model

**Decided.**
- **A run** is one start-to-end life of an agent, one row: its id; its parent's id when known;
  its agent type; its description; its brief; its round; its role and the rule that settled it;
  its state; its model and effort; its start and end time; its tokens (in, out, cache read,
  cache write) and the size of its last request; its activity (tool, a one-line summary, time);
  its last T-07 actions; the files it touched; its answer's first T-09 characters; its tool calls
  in flight. The Lead is the main session's record, in `lead`, not a run.
- **States,** and their ids: `starting`, `working`, `needs-you`, `quiet`, `finished`, `failed`,
  `stopped`; `planned` is reserved. A run moves starting → working, back and forth through
  needs-you and quiet, and ends in finished, failed or stopped.
- **How events join to rows:**
  - a spawn opens its row under its `tool_use_id`, and re-keys it to the agent id when the
    spawn's result gives one;
  - a turn or tool event for an agent id no row has yet is kept in `runs` as a pending entry
    under that id, drawn nowhere; the re-key merges it into the row. No hook waits for the
    other;
  - a pending entry no spawn claims by its loop's `turn.complete` is dropped: that loop is one
    of the engine's own forks (compaction, memory), which the panel does not show;
  - a resumed agent (`resume.agentId`) returns to its row;
  - a teammate's row goes back to working on its next turn;
  - a workflow's agents are ordinary rows;
  - a spawn whose description equals a finished run's opens a new row marked "round 2".
- **How a run ends:** an answer with text is Finished; `aborted` is Stopped; `error`, `refusal`,
  and `answer` with empty text are Failed, but a teammate's `answer` with empty text (it
  answered with a message) is Finished until its next turn. A failed run keeps its last T-07
  actions.
- **Numbers.** Fresh tokens (in and out) are counted apart from cache reads. A row's context
  percent is its last request's size over its model's window (`hooks/data/`, T-11, with a
  default for an unknown model). The header totals the Lead and every run. A run nested under
  its parent (F-24) is drawn under it, and its totals roll up into the parent's.
- **Lifetime.** Runs live in `runs` for the session only, and are never written anywhere else.
  Finished keeps the latest T-06 (30) runs.

**Built** (0.4.0; the Lead and the totals 0.5.0; roles 0.6.0), in `hooks/model/runs.ts` and
`hooks/model/lead.ts`: pure functions from `runs` or the Lead, and a record, to its next value,
each returning the same object when the record changes nothing.
- **A run** (`Run`, in `types/index.d.ts`) holds what its row needs: its agent id once known,
  its parent's id, its type, description and round, whether it is a teammate, its state, its
  role once settled and its reads and searches until then, its model and effort, its start
  and end times, its four token counts, its last request's size (input, cache reads and cache
  writes), its activity (tool and target) and its calls in flight. A pending entry holds the
  same numbers and role evidence; its loop's turn has begun, so a claimed row is Working. The brief, the answer, past actions and files touched wait for Peek (Session 11).
- **Joining:**
  - `spawnOpened` opens a starting row at the spawn's input, keyed by its `tool_use_id`, plus
    `#<agentIndex>` for a workflow's agent, since all of a workflow run's agents share the
    Workflow call's id. A fork no tool call starts (empty `tool_use_id`) opens at its result;
    a resume opens nothing.
  - `spawnSettled` re-keys the row to the agent id and claims that id's pending entry; the
    spawn's model stands until a step names one. A result with no agent id (a refusal, a
    remote agent) removes the row, as does a spawn whose `next` rejects. A resume, unless
    refused, returns the row with that id to Starting with its end cleared, or opens one in
    round 1: the same agent come back starts no round of its own.
  - `turnStarted` and `stepped` for an id no row has keep a pending entry, at most 50. An entry
    keeps its place as it changes, so the one dropped first is the loop that began longest
    ago. `turnEnded` drops it: that loop was the engine's own.
  - `turnStarted` puts a known row back to Working, its end cleared, so a teammate's next turn
    or a resumed agent's continues its row, its time counted from its first start.
  - A spawn whose description equals a Finished run's gets that run's round plus one.
- **Ending:** `turnEnded` applies `endingOf` (Decided above) and clears the calls in flight.
- **Roles** (*Roles*): `opened` takes the role the spawn's words settled. `stepped` applies a
  step's evidence, and `claimed` a pending entry's, both through `withEvidence`, which leaves a
  run with a role as it is (I-07). `weakOf` gives the reads and searches a run or entry has
  seen. `fellBack` settles Helper on every run with no role that is T-04 past its start, or
  has ended and is neither a teammate's nor one whose turn left work in the background
  (`hasBackgroundWork`, set by a step with a call whose input has `run_in_background`, and
  cleared when its next turn starts). `keepsClock` is true for a live run, or one with no
  role.
- **Numbers:** `figures` gives fresh tokens (input, cache writes and output), the elapsed time
  (to the end, or now) and the context percent, the last request over `windowOf` its model.
  `hooks/data/models.ts` holds the windows measured on 2026-11-20 (Haiku, Opus and Sonnet 5.5,
  1,000,000 each), and the same as the default; an id with a suffix finds its model.
- **The header's totals** (`totals`, in `hooks/model/lead.ts`): the Lead's fresh tokens and
  `workedMs`, plus every kept run's `figures`, plus `past`. A run is live (`isLive`) until it
  ends.
- **The Lead** (`hooks/model/lead.ts`): `measured` takes a measure's context, and `turnCounted`
  adds a main turn's tokens and duration. A count, window or duration that is not a finite
  number of 0 or more is not counted, so a malformed or interrupted turn, whose `usage` is
  absent, never makes a figure NaN. Its context percent is the engine's `percent`, else its
  tokens over its window. Each returns the same object when nothing changes.
- **The activity** is the last call a step asked for, in `hooks/model/tools.ts`: its tool and
  the argument that names what it works on (a path, the command's first line, a pattern, a URL,
  a query, a description), cut to 80 characters. The engine's `SubagentHandback` is not shown.
- **Lifetime:** `cleared` empties `runs`, `past` included; past 30 ended runs (T-06) the oldest
  by end goes, but never a teammate's. What a dropped run counted, its fresh tokens and its time
  to its end, is added to `past`, so the header's totals never drop.

Not yet: Session 12 (nesting).

## Roles

**Decided.**
- **Seventeen roles,** by id: `lead` (the main session only), `scout`, `planner`, `builder`,
  `tester`, `bugcatcher`, `reviewer`, `researcher`, `operator`, `courier`, `writer`, `artist`,
  `analyst`, `guard`, `janitor`, `pilot`, `helper` (anything unrecognised). Role names never
  change with the set.
- **Rules,** in this order, stopping at the first hit:
  1. *stated*: reserved for step reports; no source in v1;
  2. *remembered*: the person's pick for this custom agent type (`role:<agent type>`);
  3. *built-in type*: the explore type is `scout`, the plan type is `planner`;
  4. *custom agent name*: a custom type's name, split into words and read by rule 5; the generic
     types are skipped;
  5. *description*: security words anywhere settle `guard`; then a strong leading verb settles
     its role ("design" is an artist's unless its object is a system, then a planner's); then
     keywords anywhere, in a fixed order from the specific to the general;
  6. *first tool calls*: an edit or write is `builder`, a web search or fetch `researcher`, a
     browser or computer tool `pilot`, a shell command running a known test runner `tester`, one
     that commits, pushes, tags or opens a pull request `courier`; reads and searches are weak,
     and T-03 (6) of them with nothing decisive settle `scout`; any other shell command is no
     evidence;
  7. *`helper`*, at T-04 (60 s) with no rule fired, or at the run's end with none fired; the
     end of a teammate's turn, or of a turn that left work in the background, may not be the
     run's last, so it waits for T-04 or its next turn's calls. T-04
     holds whether or not the pane is open: a subagent's step past it settles Helper before
     its calls count.
- **Settled once.** A run whose role is not settled at spawn draws plain in `starting`, and gets
  its outfit when a rule fires; after that only the person's reassignment changes it (I-07). A
  reassignment applies to that run at once, and is remembered only for a custom type.
- **One home for the word lists.** The rules are a port of the round's Python reference, with
  its behaviour unchanged; once ported, the word lists, their order and the matching rules
  (whole words, stems, phrases, case ignored) live only in `hooks/roles/`.
- **The corpus** of labelled descriptions is a `.ts` fixture: every `dev` item and at least 90%
  of the `holdout` items get their label. Labels are never changed; the table is never tuned on
  `holdout`; cases may be added to `dev`.

**Built** (0.6.0; the picker and memory 0.10.0). Detection, the person's picks, and their memory
for custom types.
- **The port,** `hooks/roles/`: `words.ts` holds the reference's lists in its order; `rules.ts`
  holds `words` (the tokenizer), `hit` (whole words, stems, phrases), `fromText`, `toolsSeen`,
  `fromTools` and `detect`, which returns the role and its rule, or nothing while unsettled.
  `stated` is taken and has no caller; `remembered` comes from the store at the spawn
  (`atSpawn`'s third argument), and `detect` takes it only for a custom type (`isCustomType`).
- **Where it matches the reference exactly:** a custom type's every hyphen is a space; a call is
  split at its first colon; the test-runner and git patterns use Unicode word boundaries, as
  Python's `\b` does. Letters Unicode added after the reference's Python (Unicode 13) may read
  differently there; nothing else is known to.
- **Calls a step at a time:** `toolsSeen` reads on from a count of reads and searches, so a run
  keeps only that count (`weakCalls`) between steps, and `fromTools` is `toolsSeen` from 0.
  Each call reaches it as `callsOf` gives it: the tool's name, or `Bash:` and the whole command.
  It is read, never stored.
- **Settling:** at the spawn, the type and description (`atSpawn`); at each step, the calls;
  Helper (`HELPER`, source `fallback`) from `fellBack` at a subagent's step, at its end and at
  the clock's beat. Words outrank calls: a role settled at the spawn stands over any evidence
  its pending entry carried.
- **The moment it settled** (0.9.0): `Role.at`, the clock's time, which cues the hop into the
  outfit (*Sprites and sets*). The spawn stamps its own time, a step its time (`Step.at`), the
  fallback its `now`; a pending entry's role keeps its step's time when the row claims it. A step
  whose clock was refused settles with no `at`, and its role plays no hop.
- **The corpus,** `tests/fixtures/role-corpus.ts`: all 102 `dev` cases right, and 39 of 42
  `holdout`, whose three misses are the reference's own, with its answers.
- **The names** are `STRINGS.roles`, the art manifest's; `rowData` puts the role's name first on
  the row's second line.
- **The picker** (0.10.0). Nothing can press a sprite (an `Svg` takes no press, and a `Button`
  holds only text), so the row's role name, or "Pick a role" while it is plain, is the
  `Button` that opens it, on both surfaces (*The panel*). It offers `PICKABLE`, the sixteen
  roles in the art's order without Lead, which is the main session's alone. A pick
  (`pickRole` in `hooks/register.tsx`):
  - checks the value is pickable, since another plugin's `ui.select` hook may rewrite it;
  - reads the clock, and writes `reassigned` (`hooks/model/runs.ts`), which sets `{ id,
    source: 'manual', at }` on the run with that spawn order and drops its weak calls. `at`
    cues the hop: a live row plays the dressing, an ended one changes still. The role the run
    already wears leaves it as it is, with no hop;
  - for a custom type, taken from the run inside that write, stores `role:<agent type>`; a
    refused store loses only the memory;
  - closes the picker.

  The same run's later evidence and the fallback leave the pick alone (I-07). A pick applies
  to that run only: other live rows of the type keep theirs.

## Sprites and sets

**Decided.**
- **Canvas.** 32 by 32 pixels, drawn at T-02 (2, so 64 px on the desktop app). The body sits in a
  24 by 24 region at (4, 7).
- **Layers.** One body for every set. Each role adds two layers from the current set: the outfit,
  which moves with the body, and the prop, which has its own per-frame offset. State marks (the
  sign, the "z", the "!") and the joey are shared extras. One palette of at most 40 colours.
- **Sets.** A set is a folder of 34 layers (17 outfits, 17 props) and one manifest entry with its
  title and a costume name per role; the body, the extras, the recipes, the role ids and names
  belong to no set. Four sets: `classic` (the default), `steampunk`, `horror`, `prehistoric`. A
  role a set lacks falls back to `classic`. Adding a set is art only, no code.
- **The source** is `art/`: PNG layers, `manifest.json` (canvas, offsets, sets and layers,
  per-role prop movement, a recipe per state) and `palette.json`. The converter in `tools/`
  reads it and writes `hooks/sprites/data.ts`. The engine never reads a PNG.
- **Frames by recipe.** A recipe names a body transform, an eye variant, the prop's offset and a
  state mark. Every state has one: `planned` (sitting, greyed), `starting` (slides in plain, then
  one hop and lands dressed), `working` (two-frame bob, prop moving against the body, a blink
  now and then), `needs-you` (holds up a "?" sign), `quiet` (dozing on its feet), `finished`
  (two hops, then asleep with a rising "z"; still after 3 s), `failed` (on its back, tongue out,
  hat on and nothing in hand; still), `stopped` (startled with "!" for 1 s, then idle; still).
  `failed` turns rows 3..29 over, then down 2, so a hat above the head stays on.
- **SVG.** One rectangle per run of same-coloured pixels in a row, written as a subpath of one
  `<path>` per colour (`M11 17h3v1h-3`): as `<rect>` elements, an animated sprite with its
  still copy and outline did not fit N-02. Animation is SMIL inside the
  SVG, in steps of T-01 (200 ms), so it needs no timer and no redraw. With `motion` at `off` the
  same SVG is written with no animation element. Each sprite is drawn as an `Svg` with an `alt`
  naming its role and state, `width` and `height` of its scaled size, and `isInteractive` only
  when it animates. One sprite is under 16,000 characters (N-02). Strings are cached per set,
  role, state and motion.
- **Framed when it moves.** A sprite that animates is drawn with `isInteractive`, in its own
  frame; a still one is drawn as an image. The desktop run showed SMIL running smoothly framed,
  and only the framed form follows reduced motion.
- **The light theme.** Each sprite carries its own `<style>` with
  `@media (prefers-color-scheme: light)`, which draws the one-pixel dark outline for every
  colour on its edge whose contrast against the light background is under 3:1 (N-06). On the
  dark theme no outline is drawn. The query follows the app's theme, framed and as an image.
- **Reduced motion.** With `motion` at `auto`, an animated sprite also carries
  `@media (prefers-reduced-motion: reduce)`, under which its animation is hidden and its still
  pose shown. With `motion` at `off`, no animation element is written at all (F-21).

- **Moments** (decided with the owner at Session 7a): `stopped`'s still form, with `motion`
  `off`, is the startled frame, though its animation settles idle; a
  row's arrival plays in its first moments whatever its state, since `starting` lasts
  milliseconds; the gallery plays each one-off again after a rest. Confirmed as built with the
  owner at Session 7a.

**Built** (0.7.0; every set and `planned` 0.8.0; every state's animation 0.9.0): every set in
every state's recipe, in the set `prefs.theme` names.
- **The converter,** `tools/art.ts`, run by hand (`node mods/possum-squad/tools/art.ts`). It
  reads `art/`'s palette, manifest and PNGs (through `tools/png.ts`, which takes 8-bit RGBA,
  non-interlaced only) and writes `hooks/sprites/data.ts`, `ART`: the canvas, the palette, the
  pupils and their closed colour, the bob's rows, the base, every PNG in `extras/` (the joey
  included), the recipes and the sets. It refuses, naming the place: a palette over 40 colours
  or with a key that is not one letter or a colour twice; a layer not 32×32 (an extra may be
  smaller, never larger), outside `art/`, partly transparent, or with a colour outside the
  palette; a default set lacking a role, a role outside `roleNames` or twice; a title or costume
  with a line break or control character; a recipe field or body it does not know, or a flip
  that moves a row off the canvas. Another set may lack a role. A field the manifest gives in words is carried as its first word
  (`tongue`, `greyed`), so none of the kit's prose ships.
  - **Its output** is in Biome's own shape with nothing the line width decides: every object
    expanded, a layer's rows a template literal of palette keys (`.` for none), one row a line,
    from its first drawn row (`top`). About 87k characters for the four sets.
- **The compositor** (`compose.ts`) lays grids of palette keys in the manifest's order: the
  base (pupils' top row repainted when the eyes close, under the outfit), the outfit, the
  body's move (the bob: rows 0..26 down one, row 27 covered, rows 28 on still; the flip), marks,
  then the prop at its offset, or an extra in its place. Marks and extras land after the move,
  so the "z" does not bob.
- **The recipes** (`recipes.ts`): each pose's still frame from `ART.recipes`, `starting` and
  the Lead's `idle` being the idle frame and `quiet` the blink. No prop on its back. The tongue
  is drawn here, beside the nose's row (21) as the flip moves it. The work loop is 20 steps of
  T-01: even steps the still frame, odd the bob with the prop at its `propWorkDy`, step 18 the
  blink. It is drawn as parts placed per step: the body above the seam row, the seam row, the
  rows below the bob, the eyelids (the pupils the outfit leaves bare) and the prop.
- **The recipes as they move** (0.9.0, `recipes.ts`), each in steps of T-01; a hop is up 2 for
  one step:
  - *arrival* (a live run): the plain opossum at x −24, −16, −8, then in place; with a role it
    rests a step, hops plain and lands dressed; then it stands (5 steps, 3 plain);
  - *dressing* (a live run whose role came after its arrival): the plain opossum hops, then the
    dressed pose's own loop or still begins;
  - *working*: the work loop above;
  - *needs-you*: the whole still, sign included, bobs (`bobLoop`): 2 steps in place, 2 down;
  - *quiet*: the doze, eyes closed and prop held, bobs slowly: 4 and 4;
  - *finished*, its ending (`cheer`): standing, hop, land, hop, land; then asleep with the "z"
    2 px low for 6 steps and 1 px for 5, in place from 3.0 s, where it holds;
  - *stopped*, its ending (`startle`): startled for 5 steps (1 s), then standing (`SETTLED`);
  - *failed*, *planned*, the Lead and the empty squad: still.

  A one-off is a `Loop` whose first `once` steps play once before a tail that loops, or holds
  when it is one step (`then`); a held tail drawn like an intro part is that part. `repeated`
  (the gallery's) turns one into a loop: the one-off, then its last frame for 10 steps.
  `animationOf` picks the moment's one-off or the pose's own loop; `playable` says which moment
  a pose can play (arrival and dressing while live, ending when finished or stopped).
- **Which moment a row plays** (`momentOf`, `hooks/view/runs.ts`): a moment is fresh while the
  drawing's time is past it by less than its one-off's length and one beat (`MOMENT_GRACE_MS`,
  1 s), so the first drawing after it catches it whole, and the next drawing past it draws the
  still it ends on. An ending while `endedAt` is fresh; a dressing while `role.at` is fresh and
  came at least the arrival's length after the start; else an arrival while `startedAt` is
  fresh; a failed run none; a time that cannot be read none. A one-off never plays on a
  remount: Finished's `show` draws its rows still, so an ending shows only while Finished is
  already open. The ending carries the outfit when the role settles at the end (Helper there),
  so no hop precedes a cheer.
- **Under reduced motion** a moving sprite shows its still copy, the pose's motion-off form,
  while it is drawn framed; once its moment is over the row is drawn as its settled image, so a
  stopped row shows startled, then stands.
- **`planned`** is the idle frame, with the recipe's `colour` word, `greyed`, drawn from
  `COLOURINGS` in `recipes.ts` (decided with the owner at Session 7): each fill is greyed, 70%
  luma (`0.3r + 0.59g + 0.11b`, as the art's reference computes it) and 30% the colour, and the
  fills sit in one `<g opacity="0.55">`, so they fade 45% toward whatever background is behind
  them. The outline is drawn outside that group, at full strength, around every colour whose
  faded look over `#f8f6f0` is under 3:1: 29 of the 32 colours, so on the light theme nearly
  the whole silhouette is outlined. It is always still. The 32 greyed colours stay distinct.
- **The writer** (`svg.ts`): fills by colour in the order they first appear; the outline, in
  `#464650`, on every empty pixel beside a colour under 3:1 against `#f8f6f0` (the reference's
  light panel; the same colours fall under 3:1 against `#faf9f5` and `#ffffff`), in a
  `<g class="o">` drawn first and shown only by the light query. A loop's parts each get a
  discrete `animateTransform` and/or `animate opacity` over its shortest period, with step 0 in
  its attributes; its outline is each step's own, one path per distinct outline with its
  opacity schedule, so it is exact at every step. The still pose follows in `<g class="s">`.
  With `once` steps played first (0.9.0, `animated`): a one-off before a held tail is one
  animation with `fill="freeze"`; before a loop, it is one played once, then the loop with
  `begin` at its end and `repeatCount="indefinite"`; an intro equal to step 0's attributes
  writes none. With `once` 0 the output is byte for byte what 0.8.0 wrote.
- **The cache** (`index.ts`): one string per set, role, pose, motion, moment and repeat, in
  module memory, so a redraw hands the app the same string and a running loop is never
  restarted. A look is normalised first: with `motion` `off` no moment; a moment its pose cannot
  play, or a dressing with no role, none. An arrival moves alike in every live pose, its still
  copy the pose's own; working stands still as starting does, so a row that starts working
  inside its arrival draws the same string, and the row's alt names `starting` throughout the
  arrival. With `motion` `auto` a
  still pose is drawn where its one-off settles: `stopped` standing. An unknown set
  draws `classic`, a role a set lacks the default set's, an unknown role plain, an unknown pose
  idle; a name every object inherits (`constructor`) is unknown too, since sets, roles and poses
  are looked up by their own keys. `costumeOf` falls back with the outfit, and `galleryOf` gives a
  set's title and the default set's 17 roles in order, each with its costume there; an unknown
  set's is the default set's. The empty panel's squad is three plain asleep opossums, 24 px apart, cached once.
- **Sizes** (all four sets): a still pose 1.6k–3.4k characters, `planned` 4.0k, the work loop at
  most 8.7k, needs-you 8.1k, quiet 8.3k, an arrival 10.6k, a dressing 10.8k, a startle 10.4k, a
  cheer 13.6k and the gallery's repeating cheer 14.0k; the squad 5.0k. `tests/sprites.test.ts`
  holds every look of every set, moments included, under 16,000. Composing all 288 classic looks
  from a cold cache took 167 ms in the kit, one work loop 3.5 ms (CLI 2.1.330); every look of
  every set with its moments, 5,184 asked, 2.3 s under Node.
- **Seen:** every classic pose, still and animated, on dark and light, drawn by Quick Look from
  a scratch page; at 0.8.0 every set's gallery poses, `planned` included, the same way; at 0.9.0
  every set's moving looks for five roles, played in a browser on dark and light. In the desktop
  app at Session 9, installed 0.9.0 on the dark theme: fourteen working rows' opossums moving in
  their outfits and the Lead's; the gallery drew nothing (*Known debt*). The rest is unseen
  (`docs/BACKLOG.md`).

## The panel

**Decided.**
- **The pane.** Id `possum-squad`, title "Possum Squad", T-13 (46) columns asked. `/possums`
  toggles it; it opens by itself per *Attention*. It redraws when a state value it read changes,
  and once a second while a run is live and it is shown, for elapsed time.
- **Sections,** in this order: the Lead, then Needs you, Running, Finished (collapsed by
  default), each with its count. A section other than Running with no row is not drawn.
- **The header:** the Lead row, then one line of the session's numbers: plan-limit percent,
  tokens, time, and, with `cost` at `estimate`, a dollar figure labelled "est.". Its tokens and
  time total the Lead and every run; the time is work time, the Lead's turns summed plus every
  run's time, so it moves only while something works.
- **A row:** the sprite (desktop) or a coloured state mark (terminal); line 1 the description;
  line 2 role, model, effort; line 3 the activity; line 4 a bar of context fill, then context
  percent, tokens and time; the state word on every row (I-06). A long text is cut to one line
  with an ellipsis; Peek shows it whole. All agent text is plain `Text` (I-04).
- **Seats.** In the `dock` and `inline` seats the pane draws in full. In the desktop's `widget`
  seat (a minimized pane, where clicks may not reach) it draws the collapsed view.
- **The collapsed view:** the Lead's sprite with one joey per running agent up to T-14 (3), then
  a numeral, and a mark when anyone needs the person. The header's collapse button toggles it
  (`prefs.collapsed`).
- **Peek:** clicking a row opens, under it, the brief, the last T-07 (5) actions, the files
  touched and the answer's first T-09 (600) characters; clicking again closes it.
- **The gallery** (`/possums roles`) replaces the list while open: every role of the current set
  in every state, each with its role name and costume name. Its sprites animate, framed like
  the rows', so they follow reduced motion. Only twenty frames were measured at once; if the
  owner's look after Session 7a finds 136 not smooth, the choice returns to the owner.
- **The terminal** draws the same sections and numbers as text rows, a coloured mark per state
  and block-character bars, with no element the terminal lacks.
- **The clock.** The only timer is `$.clock.every(1000)`, armed while the pane is open and a
  run is live or its role may still fall back to Helper, cancelled otherwise (N-03); it redraws the pane only while it is shown, so a
  pane behind another's tab keeps its times. A reload cancels it, so `session.start` re-arms
  it.
- **The empty panel:** the squad asleep and "No agents yet. They show up here when Claude starts
  one."
- **Words** are plain and short, with no exclamation marks and no jokes in error text.

**Built** (0.1.0; the row 0.3.0): the pane, the toggle and the empty panel.
- `/possums` opens `possum-squad` with `{ id, title: 'Possum Squad', columns: PANE_COLUMNS }`
  (T-13, 46, in `hooks/config.ts`). It sets no `placement`, so the surface seats it: docked in
  a fullscreen terminal from 110 columns, inline above the prompt otherwise.
- With no run, the pane draws the header, then `emptyPanel` from `hooks/view/empty.tsx`: a
  column `Box` holding one dim `Text` with the empty panel's line from `hooks/strings.ts`. Off
  the terminal, the squad asleep sits above it: one `Svg` 160 px wide, its alt "The squad,
  asleep".
- An open from `/possums` is the person's, so the declarations place it at any width (144 and
  110 columns hold only for an open the plugin makes unasked).

The drawing (0.5.0), `drawPane`: the pane reads `runs`, `lead`, `prefs` and the clock's time,
and draws `panel` (`hooks/view/panel.tsx`). The terminal gets the text builders, every other
surface the desktop's. A value that cannot be read draws as it starts: no runs, the Lead
unmeasured, the default `prefs`. A clock that cannot be read draws the times as `–`, so a
refusal never puts the engine's error in the pane's place. The drawing writes no state.
- **The header:** the Lead row, then the session line, `254k tokens · 4:12` (dim), from
  `totals`.
  - **`terminalLead`:** a `●` in the theme's `claude` colour and "Main session", then, indented,
    the block bar and `ctx 31% · 120k`.
  - **`desktopLead`:** its sprite ("Lead": the `lead` outfit, idle and still), or the mark where
    the surface draws no `Svg`, beside "Main session" in semibold, then the app's `Progress`,
    labelled "Context", valued `31% · 120k`.

  The Lead is no run, so it has no state word; until a measure it reads `–`.
- **The sections** come from each row's state (`SECTIONS`):
  - Needs you: `needs-you`;
  - Running: `starting`, `working`, `quiet`;
  - Finished: `finished`, `failed`, `stopped`.

  Each is headed `Running · 2` in bold. Running is drawn whenever any run exists, the others
  only when they hold one, and rows keep spawn order. With no run at all, the empty panel's
  line takes the sections' place.
- **Finished's heading** carries a `Button` keyed `finished`, dim, labelled `show` or `hide`.
  The terminal draws it `[ show ]`. Its rows are drawn only while `prefs.finishedOpen` is set;
  a press writes the flag through `writeStore`, then invalidates the drawing.
- `rowData` (`hooks/view/runs.ts`) makes a run's `RowData` from it and the model's figures, its
  role's name from `STRINGS.roles`, and the activity line from `STRINGS.activity`. The line reads "Reading notes.md", or "Using
  <tool>" for a tool it has no verb for (an MCP tool by its own last name).

The clock (0.5.0; roles 0.6.0), in module memory in `hooks/register.tsx`: a reload drops it, and the engine
cancels its timer.
- **Arming:** `armClock` creates the timer only when none is set, so arming is idempotent. It is
  armed only from dispatches that are not drawings, since a drawing's `$` may not serve a later
  beat. "A run is live" below means `keepsClock`: live, or with no role yet.
  - `/possums` or `/possums open`, when a run is live, whether it opened, raised or left the
    pane: it stops any timer first, so the person can always start a fresh one;
  - a subagent's spawn, turn start or step, when the pane is open (`keepTime`);
  - `session.start`, when a run is live. The pane is not known there, so the first beat looks:
    after a reload with the pane closed, one beat runs.
- **The beat** asks `$.ui.panes()`, and marks the pane open or closed by what it finds. With no
  pane it stops. With no live run in `runs` it stops. While a run has no role, it reads the
  clock and settles Helper on any run past T-04 (`settleHelpers`), writing `runs` through
  `update` only when one is due; that write redraws the pane, so it skips its own
  invalidation, and a fault there leaves the clock running. While `view.isGalleryOpen` is
  set it skips the invalidation too: the gallery's sprites move inside themselves, and a redraw would send its 136
  sprite sources again for the header's time alone, so the header's time moves only on
  events until the gallery closes. A real session showed it: a
  subagent whose only call was a foreground `ping` of 70 s read Helper at about 1:00 while
  still working (CLI 2.1.330). Otherwise it invalidates the
  drawing, but only if the pane is shown. Any other fault stops it. Each arming has its own generation, so a beat in flight from a
  replaced timer stops nothing.
- **Stopping:** at a close, whatever its origin; at a clear-type session start; and when a
  drawing finds no live run, so the last run's end stops it at once. A drawing whose read of
  `runs` is refused leaves it alone.
- **A timer the engine ends:** a refused period ends an interval silently (*Context*). A drawing
  that finds no beat for 2.5 s of the clock's time with a live run clears the timer, and the
  next arming starts another.
- **Whether the pane is open** is the module's own flag: set by `/possums`, by any drawing and
  by a beat that finds the pane; cleared by a close and by a beat that finds none.

The row (0.3.0; the round 0.4.0), in `hooks/view/row.tsx`:
- **Its input** is `RowData`, plain data:
  - always: `id`, `state` (a `StateId`), `description`, fresh `tokens` and `elapsedMs`;
  - when known: `role` (its name), `model`, `effort`, `activity`, `contextPercent` and
    `round`, drawn from 2 as its own dim `Text` ("round 2") between the description and the
    state word.
- **`terminalRow`** draws four lines:
  - a coloured `●`, the description and the state word;
  - then, indented, the role's button (`[ Builder ]`, dim; "Pick a role" while plain), then the
    model and effort that are known, joined by " · " and dim;
  - the activity, or "No tool calls yet";
  - a 10-cell block bar of context fill, then `ctx 9% · 18k · 0:42`. An unknown context draws
    an empty bar and `–`.
- **`desktopRow`** draws the sprite it is given in the leading slot, or the coloured mark where
  the surface draws no `Svg`. `panel` gives it the sprite of the row's role (`RowData.roleId`,
  plain while unsettled) in its state's pose, in `prefs.theme`'s set, with `prefs.motion`; its alt is
  "Builder, working", or "Opossum, starting" while plain. With its moment (`RowData.moment`,
  0.9.0), a moving sprite with `motion` `auto` is framed (`isInteractive`): a working,
  needs-you or quiet one, and any row inside its arrival, hop or ending; every other one is an
  image. The terminal's table answers `Svg`
  in the kit too, so `panel` asks for it only off the terminal. Beside it are the same lines,
  the second and third in footnote
  size. The fourth is the app's own `Progress`, labelled "Context", its value text the
  percent, tokens and time. The engine draws a `Progress` as its label and figure above a thin
  fill the width of the row (*Context*), so nothing goes beside it.
- **The role's button and the picker** (0.10.0): line 2 on both surfaces is a row `Box`: a dim
  `Button` keyed `role-<row id>`, labelled with the role's name, then the model and effort as
  dim `Text` (footnote size on the desktop). While `view.pickerFor` is the row's spawn order
  (`RowData.order`), a line below it holds a `Select` keyed `role-pick`, labelled "Role", over
  `PICKABLE`, valued the row's role when it is one, and a dim `Button` keyed `role-cancel`,
  "cancel". The builders take a `RolePicker` of closures from `panel`, which binds each to the
  row's order; one picker is open at a time.
- **Lines cut to one:** the description, the model and effort, and the activity carry
  `wrap="end"`, so a long one ends in an ellipsis.
- **Colours** are theme keys, the same for the mark and the word: working `success`, needs-you
  `permission`, quiet `warning`, failed `error`, finished `subtle`, starting and stopped
  `inactive`.
- **Numbers** come from `hooks/view/format.ts`:
  - tokens: `640`, `9.5k`, `38k`, `1.2M`;
  - time: `0:42`, then `1:02:05` from an hour;
  - the percent, rounded;
  - a number that is missing or not finite reads `–`, and the desktop bar's fill is empty
    rather than the bar that only spins.
- **The desktop row** was seen by the owner with 0.4.0 installed; the terminal's in Session 4's
  check.

The gallery (0.8.0), in `hooks/view/gallery.tsx`: while `view.isGalleryOpen` is set,
`drawPane` passes `galleryOf(ART, prefs.theme)` and `panel` draws it below the header, in the
sections' or the empty panel's place.
- **Its heading** is `Roles · Steampunk` in bold, beside a dim `Button` keyed `gallery`, labelled
  "close" (`[ close ]` on the terminal), whose press clears the flag.
- **`desktopGallery`:** each of the 17 roles in the default set's order, its role name
  (semibold) beside its costume name (dim), over a wrapping row of eight cells in
  `GALLERY_STATES`' order: planned, starting, working, needs-you, quiet, finished, failed,
  stopped. Each cell is the role's sprite in that pose with `prefs.motion` (0.9.0), alt
  "Builder, planned", over its state word in footnote size; where the surface draws no `Svg`,
  the state's mark. `GALLERY_MOMENTS` gives starting its arrival and finished and stopped their
  ending, each repeated: with `motion` `auto`, 102 cells are framed and move, `planned` and
  `failed` are images; with `off`, all 136 are images.
- **`terminalGallery`:** "States", then each state's coloured mark and word (`planned` in
  `inactive`); then "Roles", each role's name, a dim `·`, then its costume name (dim), so the
  two never run together where dimming does not show.
- **Timing** (N-05, in the kit, CLI 2.1.330): building the pane's tree for 20 rows took
  0.21 ms (median of 200, max 1.0 ms) with the sprites cached; the first build, writing its
  20 sprites, about 32 ms. The gallery's first draw of a set, writing 136 sprites, about
  43 ms; then 0.33 ms. At 0.9.0, with its 102 moving sprites, the first draw of a set took
  0.19–0.24 s in the kit, then 7–10 ms a mount; its sources are about 875k characters.

Not yet: Session 11 (Peek, the collapsed view, the
`widget` seat).

## Attention

**Decided.**
- **Needs you** (F-12): a run whose tool call waits on a permission prompt moves to Needs you
  until the prompt is answered.
  - **It begins** on `classic.PermissionRequest`, which fires only when a person is asked, for
    the run whose agent id its `agent_id` names. A request without `agent_id` is the main
    session's, which the person already sees; it moves no row.
  - **It ends** when that agent's asked call moves on, allowed or refused: at that agent's next
    `turn.step` or its `turn.complete`, since a call's start comes from its step (*The
    hooks*). A long call that was allowed keeps the row in Needs you until its step's calls
    are done.
  - `tool.check` answering `ask` was the other candidate. It names the call, but it also fires
    where auto mode's classifier or a hook settles the ask with no prompt shown.
- **Gone quiet:** a run with no event for T-05 (90 s) and no tool call in flight shows as quiet.
- **Toasts,** only while the pane is closed: when a run needs the person, and when a run that
  ran longer than T-10 (60 s) ends.
- **Auto-open** (`prefs.autoOpen`): `first` opens the pane when a session's first agent starts;
  `always` on every new agent; `never` leaves it to `/possums`. A pane the person closed stays
  closed for the rest of the session (`view`).

**Built** (auto-open 0.10.0). `autoOpen` in `hooks/register.tsx`, started unawaited by a new
agent's spawn (*The hooks*):
- reads `prefs.autoOpen`: `never` opens nothing, and `first` only for the agent whose row starts
  the list (`isEmpty` before its opening: no row, nothing in `past`), so after a clear the next
  agent opens it again. `always` is every new agent; a resume is never new;
- reads `view`: a person's close (`origin.kind` `person`, the close mark or key) opens nothing
  until the person opens the pane again with `/possums`, `open` or `roles`, which clears it
  (`forgetClose`). A `/possums` close is the plugin's, so with `always` the next agent opens a
  pane hidden that way;
- asks `$.ui.panes()`, and opens nothing while the pane is there, shown or behind another tab;
- opens `{ id, title, columns }` with no `focus`. Made unasked, the open is placed from 144
  terminal columns (110 for an id the person has opened), and waits undrawn below that
  (*Context*). A placed open marks the pane open and arms the clock; one left waiting starts no
  clock, so its first drawing or the person's open brings the times.

A clear forgets the person's close: the engine resets `view` with the rest of `$.state`, and
the list starts over.

Every fault ends it quietly; the spawn has already returned. Not yet: Session 10 (Needs you,
quiet, toasts).

## The command and settings

**Decided.**
- `/possums` toggles the pane; `/possums open` opens it or brings it forward, never closes it;
  `/possums set <name> <value>` changes a setting and answers with its new value, or with the
  names or values allowed; `/possums settings` lists every setting and its value;
  `/possums roles` opens the gallery. It is registered with `immediate`, so it runs mid-turn.
- Settings are those of `prefs` (*Values*); a change applies at once and redraws the pane.

**Built** (0.1.0; the words 0.3.0). `/possums` is registered at `session.start` with
`immediate`, the description from `hooks/strings.ts`, and the argument hint
`[open | roles | settings | set <name> <value>]`. Its `command.run` hook reads the words after it
(`parseWords` in `hooks/settings.ts`, split on whitespace, case ignored) and hands each case to
a top-level function:
- **No words** (or spaces alone) toggles. It finds `possum-squad` in `$.ui.panes()`:
  - a pane that `isShown` is closed with `$.ui.close`;
  - a pane that is open but not in view (a tab behind another pane, or waiting undrawn) is
    opened again with `focus: true`, which the declarations say raises it, so `/possums` never
    hides what the person is asking to see;
  - with no pane, it opens one.

  An unplaced pane is never shown, so `isShown` alone decides. The answer is `{}`, which
  prints nothing.
- **`open`** does the same, but leaves a shown pane as it is: it never closes.
- **`roles`** sets `view.isGalleryOpen` through `update`, then does what `open` does, so it never
  closes the pane; the flag comes first, so the pane's first drawing is the gallery. A refused
  write answers the plain line a refused open does, and opens nothing; a refused open clears
  the flag again, so a later `/possums` opens on the list.
- **An open or a raise** marks the pane open and arms the clock when a run is live (*The
  panel*).
- **`settings`** reads `prefs` and answers a heading, so the engine's `possum-squad:` prefix
  stands apart from the list. Then one line per setting, `theme: classic (classic, steampunk,
  horror, prehistoric)`, then how to change one.
- **`set <name> <value>`** matches the name and the value, ignoring case, and keeps their own
  spelling. A good pair is written through `writeStore`, the pane is redrawn (the store is not
  reactive), and it is answered "theme is now horror.".
  - No name answers "Name a setting: …"; a name it does not know answers the setting names,
    never repeating the word.
  - A value the setting does not take, or none, answers the setting's values.
  - Neither writes anything.
- **Any other words**, or a word after `open`, `roles` or `settings`, answer the usage line.
- **Every answer in words** carries `isTextDisplayOnly` (N-01).
- **When something refuses:**
  - if `$.ui.panes`, the open or the close rejects (another plugin holds the id), it answers
    one plain line;
  - if the store refuses a read or a write, it answers another.
- It reads no `next`, so it is not gating and carries no `.catch`.

## Reach

**Decided.** No network, no process, no file access, no model call, no tool registration. The
mods API calls allowed (I-02): `$.ui.resolve`, `$.ui.invalidate`, `$.ui.open`, `$.ui.close`,
`$.ui.panes`, `$.ui.toast`, `$.command.register`, `$.state` through its helpers, `$.store.get`,
`$.store.set`, `$.store.delete`, `$.clock.every`, `$.clock.now`, `$.session.usage`,
`$.agent.list`. A change to this list is the owner's. The converter in `tools/` reads `art/` and writes one file, by hand,
outside the engine; it is never part of the mod's running code.

**Built** (0.8.0). `validate` lists `$.clock.every`, `$.clock.now`, `$.command.register`,
`$.state.get`, `$.state.set`, `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.invalidate`,
`$.ui.open`, `$.ui.panes`, `$.ui.resolve`; the sprites, being pure, added none. The state calls come through `update` and `read`;
the clock through `armClock`, `recordAt`, `settleHelpers` and `drawPane`; the store calls through `writeStore`,
`listSettings` and `prefsWhileDrawing`; the pane calls through `showPane`, `tick` and `redraw`.
Each is on the allow-list; `$.session.usage` is not called. No network, process or file access,
no model call, no tool registration. `tools/art.ts`, run by hand on Node, reads `art/` (its
JSON and PNGs) and writes `hooks/sprites/data.ts`, nothing else; its specs write fictional art
into a temporary folder, and read `art/` and the committed `data.ts`.

## Testing strategy — the layers, and what each cannot see

**Decided.** `npm run verify -- possum-squad`, from the repository's root, runs the repository's
stages, then this mod's: `validate`, `types`, `tests` and `imports`, each failing on its own, then
a summary. It is green before every commit, or the docs-only command for a commit that changes
only docs. The commands are in the root `CLAUDE.md`. Every UI test runs on both surfaces; a test
that depends on time pins the clock; fixtures are fictional.

**Built.**

| Layer | Runs | Covers | Cannot see |
|---|---|---|---|
| `validate` | `verify` | The manifest, the hooks the module registers, which gate, and the API calls it makes | Behaviour |
| `types` | `verify` | The module and tests against the CLI build's declarations | Another build's API, the desktop's included |
| `tests` | `verify` | The hooks against the engine's kit, with the clock and `$` stood in; the pure modules: the run model on fixture event sequences, the role corpus, the compositor on a fictional art, every sprite's size, outline and frames as its SMIL plays, in every set; the sets' switching and fallback; the gallery | What the app actually draws; whether SMIL runs; real timing and order of events |
| `imports` | `verify` | Every import resolves inside the folder or to a declared module | Anything at run time |
| Hygiene | `verify`, with the drafted commit message; in full when the term list or the stage changes | Private terms in files, paths and messages; attribution in messages; secrets by their exact shapes; conflict markers | Images and binaries; a term joined inside one lowercase run; attribution in files; a home-directory path; a secret of any other shape |
| The converter | `verify`: `types` and `tests` take `tools/` | The PNG reader (every filter, an independent Paeth check, each refusal); the converter on a fictional art folder, kept as data in `tools/fixtures/art.ts` and written to a temporary folder as PNG and JSON, since a PNG made by hand could not be read for review; each broken input refused at its place; the committed `data.ts` equal to what `art/` converts to, and holding every layer the manifest names | Whether the art looks right: by eye, in the desktop app |
| By hand | Recorded in done-notes | The mod in the app: the desktop from the installed release, the terminal from a `--plugin-dir` session; every animation, both themes, three real agents against the transcript | Anything not written down; what nobody checked goes to `docs/BACKLOG.md` |

## Packaging

**Decided.** The owner installs the release from the repository's marketplace as
`possum-squad@claude-code-mods`, at user scope. `claude plugin update possum-squad` installs a
pushed version only when `plugin.json`'s differs from the installed one, so every change meant
for the owner cuts a version. A `claude --plugin-dir mods/possum-squad` terminal session tries an
unpushed build: it replaces the installed copy for that session and runs as
`possum-squad@inline`, with its own `$.store`. Installed, the mod runs in every session the owner
starts; disabling the plugin is its kill switch. Every tracked file ships, so `art/`, `tools/`
and, until round 1 closes, `docs/spec/research/` are in each installed copy.

**Built.** 0.1.0 to 0.3.0 were pushed on 2026-11-17, 0.4.0 and 0.5.0 on 2026-11-20; the owner
installed each. 0.6.0 was pushed on 2026-11-22. The manifest declares no settings: 0.2.0's throwaway `userConfig` field
was removed in 0.3.0, and a value the owner set for it stays in their Claude Code settings,
unread.

## Deliberate decisions

**Decided.**
- **One file touches the API.** Static analysis requires it, and when an event's shape changes,
  one file changes.
- **Animation is SMIL inside each sprite,** not frames redrawn from a timer: no timer, no
  redraws, and SMIL in a desktop `Svg` already plays in another mod of this repository.
- **Roles come from ordered rules, never a model call:** a wrong outfit costs nothing; a model
  call costs the owner's plan and adds delay.
- **Nothing from a session is stored.** Briefs and answers are the owner's work; only settings
  and role picks persist.
- **The mod registers no tool in v1,** so watching adds nothing to any request.

## Known debt, deliberately deferred

- **A run whose `turn.complete` is recorded before its spawn settles stays Starting.** It would
  need a whole turn inside the spawn's own settling; in every spawn measured, the result came
  milliseconds after the agent's first turn began.
- **After a reload with the pane closed and a run live,** the clock beats once before it finds
  the pane closed: `session.start` would have to await `$.ui.panes()` to know, which N-07 does
  not allow.
- **A timer the engine ends comes back only at a later subagent event,** or at `/possums open`:
  a drawing notices it (2.5 s without a beat), and the next spawn, turn start or step arms
  another. In between, times move only on events.
- **A drawing whose read of `runs` is refused leaves the clock alone, untested:** in the kit,
  the clock beat on after such a drawing with the old code too, for a reason not found.
- **The Lead's time grows when each main turn ends,** not during it: the main loop's turn start
  and steps make no `$` call.
- **A subagent waiting on its own background shell reads finished:** its turn ended, which is
  how a run ends here. Seen by hand in Session 5; the owner decides (`docs/BACKLOG.md`).
- **A teammate's or resumed agent's time counts from its first start,** its rests included, in
  its row and in the header's work time.
- **A remote workflow agent's row** (internal builds only) has no local loop; its spawn names
  no agent here, so it gets no row.
- **A pending entry dropped at the cap of 50** loses its calls' evidence: the row that later
  claims that agent reads its role from its later calls alone.
- **With the pane closed and an agent silent past T-04,** Helper waits for its next step, its
  end or the first beat after the pane opens; the role is the same, only when it shows differs.
- **The sprites are unseen in the desktop app** until 0.7.0 or later is installed and looked at
  (`docs/BACKLOG.md`); the gallery's 102 framed sprites, the one-offs' `fill="freeze"` and
  `begin`, and `planned`'s group `opacity` too; `<path>` and a discrete `opacity` animation are drawn there by another
  mod of this repository, not yet by this one.
- **`data.ts` is about 87k characters,** loaded on every start; the kit loads it, and whether
  the engine caps a module's size is not in the declarations.
- **The tongue's place is the classic base's:** the nose's row (21) and columns (15, 16) are
  constants in `recipes.ts`, so a base drawn anew must move them too.
- **A pane's first draw writes its sprites:** about 32 ms for 20 new looks, against N-05's
  10 ms for the tree, which the cached builds meet at 0.21 ms. Each look is written once per
  session; a new row's costs about 1–3.5 ms.
- **A moment's string changes if its look does inside it:** a role settled during the arrival
  (not at the spawn) starts the slide again, dressed; a pose that changes inside a hop starts
  the hop again. Decisive calls in a run's first second were not seen.
- **A moment whose first drawing comes late is cut:** a pane shown again just before a moment's
  window ends plays it from the start, and the next beat draws the still it ends on.
- **The swap from a one-off to its still image** changes the element from framed to an image;
  whether the desktop flashes there is unseen (`docs/BACKLOG.md`).
- **While the gallery is open, each event's redraw sends its sources again,** about 875k
  characters at 0.9.0 (400k at 0.8.0); the beat leaves it undrawn.
- **After the last live run, the clock may beat up to T-04 more** for a run whose role may still
  fall back (a teammate's, or one waiting on background work), redrawing a pane whose times no
  longer move.
- **The gallery draws nothing on the desktop** (seen at Session 9, installed 0.9.0): its tree,
  about 945k characters with `motion` `auto` and 389k with `off`, 137 sprites, is refused, and
  the app keeps the last tree it drew. While `view.isGalleryOpen` stays set every drawing is
  the gallery, so the pane looks frozen until it is closed. Fourteen working rows, about 118k,
  drew. The limit lies between: Session 9a.
- **The picker and auto-open are unseen on the desktop:** the role's native `Button` in the
  second line's footnote type, the `Select` under the row, and an unasked open there. A
  session cannot look for the owner: computer use refuses Claude's own window (`docs/BACKLOG.md`).
- **The kit's `$` cannot close a pane as the person:** it has no `ui.close`. So the person's
  close and auto-open after it run the mod's own hooks over a stand-in `$`
  (`tests/auto-open.test.ts`), as the close's own tests do in `tests/panel.test.ts`.
- **Auto-open is not awaited,** so whether its open lands before or after the spawn's result is
  the engine's affair; in the kit it lands before the spawn's call returns.
- **A remembered pick is never deleted:** a type goes back to detection only through another
  pick (`docs/BACKLOG.md`).

## Baseline (v0.10.0)

| Check | Expected |
|---|---|
| `npm run verify -- possum-squad` | green: the 6 repo stages, then `validate`, `types`, `tests` and `imports` for possum-squad, `types` and `tests` taking `tools/` |
| `claude plugin test mods/possum-squad` | 197 pass, in 18 files: auto-open 11, clock 13, command 11, compose 8, gallery 9, header 8, model 31, pane-sprites 9, panel 10, pass-through 5, picker 12, prefs 5, roles 9, row 8, runs 17, sets 6, settle 12, sprites 13; about 13 s |
| `node scripts/tools.ts specs mods/possum-squad` | 10 pass, in 2 files: art 6, png 4 |
| `validate`: hooks / gating / state keys | 11 / 4 (each with a `.catch`) / 3 (`lead`, `runs`, `view`) |
| `validate`: calls | `$.clock.every`, `$.clock.now`, `$.command.register`, `$.state.get`, `$.state.set`, `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.invalidate`, `$.ui.open`, `$.ui.panes`, `$.ui.resolve` |
| `validate` warnings | none but the allowed "CLAUDE.md at the plugin root is not loaded as project context" |
| `tsc` and the import scan | clean |

Measured on CLI 2.1.330. A documentation or refactoring change should not move any of these; if
one moves, that is the finding.

## Decision log

- 2026-11-17, *Reach*: `$.ui.panes` joins the allow-list, the owner's choice at Session 1's
  plan. `/possums` toggles the pane, and only the engine's own list of the plugin's panes says
  whether it is open: it is right after a reload, and after a close no hook of the mod hears,
  which a flag in `view` would miss.
- 2026-11-17, *Sprites and sets*: SMIL goes ahead; a sprite that animates is framed, a still
  one an image. The owner's choice at Session 3's start, from the desktop run: framed sprites
  bobbed smoothly, and only the framed form follows reduced motion.
- 2026-11-17, *Sprites and sets*: on the light theme each sprite's own media query draws the
  one-pixel outline where an edge colour is under 3:1; none on the dark theme. The owner's
  choice at Session 3's start; the query followed the app's theme in both forms.
- 2026-11-17, *Sprites and sets*: `motion` `auto` follows the system's reduced motion, through
  each animated sprite's own media query; `off` writes no animation. The owner's choice at
  Session 3's start.
- 2026-11-17, *Attention* and *The hooks*: Needs you stays in v1. It begins on
  `classic.PermissionRequest`, by `agent_id`, and ends when the asked call moves on, by the
  signal Session 4's tool-call source allows. The `tool.check` hook was removed. The owner's
  choice at Session 3's start: both candidates came back while the prompt waited, and only the
  request fires just when a person is asked.
- 2026-11-17, *The panel*: the gallery animates, framed; if 136 frames are not smooth after
  Session 7a, the choice returns to the owner. The owner's choice at Session 3's start.
- 2026-11-17, *The hooks*: a hook on `tool.call` or `tool.run` turns off a tool's move to the
  background and its live output, even as a pass-through (from the declarations). So 0.3.0
  hooks neither, and Session 4 measures the classic tool-use hooks before the owner picks a
  tool call's source. The owner's choice at Session 3's plan.
- 2026-11-20, *The invariants* (N-07): event hooks may also await the clock's time, so a run's
  start and end are read with `$.clock.now()`, which tests pin with `mock.clock`. The owner's
  choice at Session 4's plan.
- 2026-11-20, *The hooks*: a tool call's start comes from `turn.step`'s `toolUses`, adding no
  hook; the classic tool-use events are not hooked, `classic.PreToolUse` carrying no agent id.
  The owner's choice at Session 4, after the probe showed neither hook's cost for Bash.
- 2026-11-20, *Attention*: Needs you ends at the asking agent's next step or its end, which
  follows from a call's start coming from its step. The owner's choice at Session 4, with the
  tool-call source.
- 2026-11-20, *The hooks*: a subagent ends on its `turn.complete`, not `classic.SubagentStop`
  or `agent.report`. The owner's choice at Session 4, after the terminal showed one
  `turn.complete` per subagent.
- 2026-11-22, *Roles*: a run that ends with no rule fired is Helper at its end, but a
  teammate's end is not: its next turn's calls may still settle it. The owner's choice at
  Session 8's plan; no rule can fire after a run's end, and a teammate has more turns.
- 2026-11-22, *Roles* and *The hooks*: a subagent's step reads the clock, so T-04 settles
  Helper whether or not the pane is open, before the step's calls count. The owner's choice at
  Session 8's plan, after its review showed the clock's beat alone, which runs only while the
  pane is open, would let the same agent be Helper or Builder by the pane.
- 2026-11-20, *The run model*: a teammate's turn that ends with an empty answer is Finished,
  not Failed, until its next turn. The owner's choice at Session 4.
- 2026-11-20, *The hooks* and *Values*: the Lead's tokens and time come from the main session's
  `turn.complete` (`usage`, `durationMs`), one write to `lead` per main turn; the main loop's
  turn start and steps still make no `$` call. `lead` gains its turns' time. The owner's choice
  at Session 5's plan: `session.measure` carries no running token count.
- 2026-11-20, *The panel*: the header's time is total work time, the Lead's turns summed plus
  every run's time, pruned runs included. The owner's choice at Session 5's plan: it is F-03's
  total, and it never reads stale while nothing runs.
- 2026-11-20, *The invariants* (N-07): `session.start` awaits nothing new. The Lead is not
  seeded from `$.session.usage()`: its context comes from `session.measure` alone, and reads
  "–" until the session's first reply. The owner's choice at Session 5's plan, after its review.
- 2026-11-20, *The panel*: the clock runs while the pane is open, and redraws only while it is
  shown. No event says a hidden pane is shown again, so a clock stopped while hidden would leave
  its times frozen. The owner's choice at Session 5's plan, after its review.
- 2026-11-22, *Roles*: the end of a turn that left work in the background is not Helper either,
  like a teammate's: the run may come back. The owner's choice at Session 8's review, after the
  hand check saw such a run kept as Helper.
- 2026-11-22, *The panel*: the clock also runs while a run's role may still fall back to Helper,
  so a teammate resting with no role gets it at T-04. The owner's choice at Session 8's review.
- 2026-11-22, *Sprites and sets*: each run of a row is a rectangle written as a subpath of one
  `<path>` per colour, not a `<rect>`. As `<rect>` elements the largest animated sprites
  measured about 17–18k characters, over N-02; as paths at most 8.7k. A second opinion agreed,
  and set aside `<use>` (never seen on the desktop) and CSS over SMIL (unverified). The owner's
  choice at Session 6's plan.
- 2026-11-22, *Sprites and sets*: `failed` turns rows 3..29 over, not 7..29, so the 11 of 68
  outfits that reach above row 7 keep their hats; it holds no prop, as the reference drew it.
  The owner's choices at Session 6's plan; `art/manifest.json`'s recipe says so.
- 2026-11-22, *The panel*: the Lead's sprite and the empty panel's sleeping squad came with
  Session 6, beside the rows'. The owner's choice at Session 6's plan.
- 2026-11-22, *Sprites and sets* and *Layout and boundaries*: confirmed as built, with the owner,
  at Session 6.
- 2026-11-23, *Sprites and sets*: `stopped`'s still form, with `motion` `off`, stays the
  startled frame, the art's own pose; its animation settles idle, as the design's recipe says.
  The owner's choice at Session 7a's start.
- 2026-11-23, *Sprites and sets*: a row's arrival plays in its first moments whatever its state,
  cued by its start time: `starting` lasts milliseconds in practice. The owner's choice at
  Session 7a's start.
- 2026-11-23, *The panel*: in the gallery each one-off plays, rests about 2 s and plays again,
  so any role can be looked at after scrolling to it. The owner's choice at Session 7a's start.
- 2026-11-23, *Sprites and sets*: confirmed as built, with the owner, at Session 7a.
- 2026-11-23, *Roles* and *The panel*: the row's role name, a `Button` on both surfaces,
  opens the picker, not its sprite: the 2.1.330 declarations give an `Svg` no press, and a
  `Button` holds only text. The owner's choice at Session 9's start.
- 2026-11-23, *Roles*: the picker offers sixteen roles, every one but Lead, which is the main
  session's alone. The owner's approval of Session 9's plan.
- 2026-11-23, *Roles* and *Sprites and sets*: a pick sets `Role.at` to its time, so a live row
  hops into the new outfit; an ended row changes still. The owner's choice at Session 9's
  start.
- 2026-11-23, *Attention*: the person opening the pane with `/possums`, `open` or `roles` takes
  back their own close, so auto-open follows the setting again. The owner's choice at Session
  9's start, settling what Session 1 left open.
- 2026-11-23, *Attention*: only a close with the pane's close mark or key is the person's; a
  `/possums` close is the plugin's, so with `always` the next agent opens it again. The owner's
  approval of Session 9's plan.
- 2026-11-23, *The panel*: the gallery's failure on the desktop goes to a new Session 9a, after
  Session 9's review and before Session 10, which finds the limit there. The owner's choice
  after Session 9's commit.
- 2026-11-23, *Values* (`role:<agent type>`, one key per type) and *Attention* (auto-open):
  confirmed as built, with the owner, at Session 9.
- 2026-11-23, *Sprites and sets*: `planned` is greyed and faded by an `opacity` on its fills
  alone; its light-theme outline is drawn outside them, at full strength, around the colours
  faint as they are seen faded. The owner's choice at Session 7's start: it keeps the
  manifest's recipe on either theme, where an outline inside the fade fell to 2.76:1.

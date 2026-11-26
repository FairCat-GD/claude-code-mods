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

**Built** (0.17.0). The Lead, header, sections, roles with the person's picker and its `detect`, sprites in every
set with every state's animation, the gallery in parts the desktop draws, auto-open, Needs you,
quiet and toasts, Peek, the collapsed view, which a minimized pane draws too, the plan's limits,
the estimate, helpers drawn under their parents, agents waiting on their own work, the
activity line with a file named first, the engine's progress summary and the past tense, the
session line's time moving through a main turn, the failed toast's reason, the `toasts`
setting, and the tab title counting the runs that need the person.
`hooks/register.tsx`, named by `hooks/hooks.json`, does the following:
- registers `/possums` with its words `open`, `roles`, `set` and `settings`;
- toggles and draws the pane: the Lead row and the session line (the plan's limits, the totals,
  and the estimate while `prefs.cost` is `estimate`), then the sections of subagent runs, each
  helper under its parent while both sit in one section, the empty panel's line, or a part of
  the gallery; on every surface but the terminal,
  each with its sprite, in the set `prefs.theme` names, within what the desktop app draws. A
  row's Peek opens under it; the collapsed view, the Lead carrying its joeys with the counts,
  takes the whole pane's place while `prefs.collapsed` is set or the pane sits in the desktop's
  `widget` seat;
- turns subagents' spawns, turns and steps into records, and keeps the runs in `runs`; holds a
  subagent's turn's end until the engine's agent list (`$.agent.list()`, read unawaited) says
  whether it waits on its own work or has ended;
- settles each run's role from the person's pick remembered for its custom type, its type, its
  description and its first calls, and Helper at T-04 or at its end; a row's role button opens
  a picker whose choice reassigns that run, and is remembered for a custom type, and whose
  first entry, `detect`, puts the run back on the rules and forgets the type's pick;
- opens the pane by itself when an agent starts, as `prefs.autoOpen` says, unless the person
  closed it;
- moves a subagent's row to Needs you while its call waits on a permission prompt, shows a run
  quiet past T-05 with no call in flight, and, while the pane is out of view, toasts a run that
  needs the person and a long run's end, a failed one with its reason, as `prefs.toasts` allows;
  retitles the open pane's tab with the count of runs that need the person;
- keeps the main session's context, tokens, time and estimate, and the plan's limits, in `lead`,
  and its running turn's start in module memory;
- runs the one-second clock while the pane is open and a main turn runs, a run is live, or a
  run's role may still fall back to Helper; each beat reads the list while a turn's end is held
  or a run waits, or, for the progress summaries, while a live run shows in the shown pane;
- empties `runs` and `lead` when the session is cleared, resumed or forked;
- keeps the settings, Finished's flag and the collapsed view's in the store under `prefs`, and
  each custom type's picked role under `role:<agent type>`, which `detect` deletes; in `view`, a close by the person,
  whether the gallery is open and on which part, and which row's picker and Peek are;
- passes every event on unchanged.

Of the pure modules:
- `hooks/model/` turns records into runs (`runs.ts`), the Lead and the header's totals
  (`lead.ts`), a step's calls into an activity (`tools.ts`), and each run's helpers' tokens and
  estimate into its own (`nesting.ts`);
- `hooks/roles/` holds the role rules and their word lists (`rules.ts`, `words.ts`);
- `hooks/data/` holds the dated window table (`models.ts`) and price table (`prices.ts`);
- `hooks/view/` holds the panel and its sections (`panel.tsx`), the gallery (`gallery.tsx`), the
  Lead row and the session line (`lead.tsx`), a run's row data and Peek's (`runs.ts`), the row
  builders for both surfaces, Peek's lines among them (`row.tsx`), the collapsed view
  (`collapsed.tsx`), the empty panel's line (`empty.tsx`), and the toasts' texts (`toasts.ts`);
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

What the terminal showed in Session 10: CLI 2.1.330, `claude --plugin-dir mods/possum-squad
--permission-mode default`, driven through `screen`, with a scratch probe plugin outside the
repository toasting each event.
- **A subagent's asked Bash call** raised `classic.PermissionRequest` with the agent's id as
  `agent_id`, the same as its loop's `agentId`, while the prompt waited; `next(e)` came back
  `{}` before the person answered.
- **The step that asked the call ended after the request:** the step began, the request came
  in and went out, then that step's stream ended with its one call. The engine checks a call
  while its step still streams.

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

What the desktop app holds a pane's tree to: read from the app's own render code (app
6.28899.6, running engine 2.1.330), in Session 9a. The declarations bound only a `Client`'s tree.
- **The bound.** The app draws a hook's answer only when its count has fewer than **2,000
  nodes**, **32 levels** and **262,144 characters**:
  - a string child is one node, and its length;
  - an `Svg` counts its `source` and `alt`;
  - a `Button` its `key`, `label`, `hotkey`, `action` and plugin's name;
  - a `Select` its `key`, `label`, `value`, plugin's name and every option's value and label,
    and one node more per option;
  - any other element its props' names and string values.
- **A refused answer is dropped,** with nothing logged and nothing sent back to the mod. The
  app keeps the last tree it drew, and draws the next answer that fits.
- **What Session 9 saw fits it.** Fourteen working rows drew, about 102k by this count. The
  0.9.0 gallery did not: about 875k of sprite sources with `motion` `auto`, and 335k to 355k
  with `off`.
- **The kit draws a `Progress` as boxes and text** (*Built* above), about 8 nodes. Whether the
  app gets the element itself depends on what it names on attaching, which a hook cannot tell,
  so the mod counts the boxes.

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

**Built** (0.8.0; `nesting.ts` and `prices.ts` 0.13.0). In place:
- the manifest, `.claude-plugin/plugin.json`, naming `types/index.d.ts`;
- the hooks: `hooks/hooks.json`, `hooks/register.tsx`, `hooks/config.ts` (T-03 to T-07, T-09,
  T-10, T-13 and T-14, the helpers' indent and the limits kept) and `hooks/strings.ts`;
- `hooks/model/`, pure: `runs.ts` (runs from records, their figures and their parents),
  `lead.ts` (the Lead from measures and main turns, and the header's totals), `tools.ts` (a
  step's calls as an activity) and `nesting.ts` (each run's tokens and estimate with its
  helpers'). It uses `config.ts`, `data/` and the types alone;
- `hooks/roles/`, pure: `words.ts` (the word lists) and `rules.ts` (the rules in their order,
  the calls read a step at a time, and the fallback). It uses `config.ts` and the types alone;
- `hooks/data/`: `models.ts`, the dated window table (T-11) and the lookup by model both tables
  use; `prices.ts`, the dated price table (T-12) and `costOf`;
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
  (a run's row data, its activity line and its Peek), `row.tsx` (the row and its Peek, one
  builder per surface), `collapsed.tsx` (the collapsed view, one builder per surface),
  `sprite.tsx` (a sprite as an `Svg`) and `format.ts` (tokens, time, percent, dollars and the
  block bar);
- the contract, `types/index.d.ts`: `View`; `StateId`; `RoleId`, `RoleSource` and `Role`;
  `Runs`, `Run`, `Pending`, `Past`, `Tally`, `Tokens` and `Activity`; `Lead`, `LeadContext`
  and `Limit`;
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
    fallback; `tests/gallery.test.ts` runs `/possums roles` and reads the drawn gallery;
  - `tests/peek.test.ts` raises spawns, steps and ends and presses a row's Peek;
    `tests/collapsed.test.ts` draws the collapsed view, collapsed by the person and in the
    `widget` seat, and reads the Lead's joeys from its SVG;
  - `tests/estimate.test.ts` prices tokens by the table, then raises steps and a main turn and
    reads every string of the drawn pane with `cost` off and at `estimate`;
    `tests/nesting.test.ts` raises spawns naming a parent and reads where each row is drawn,
    its indent and its tokens.

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
   in the key `role:<agent type>` and a role id as its value; its one deletion is such a key. And by `tests/prefs.test.ts`:
   after fixture agent events, a press of Finished's show button on each surface and a change
   of every setting, every write holds only those fields, and no fixture brief, description,
   answer or path; so do a press of a row's Peek, which writes nothing there, and of the
   collapse button and `expand`; a pick on each surface for a custom type writes only its key and the role
   id, and neither the agent's brief nor its description. `tests/picker.test.ts` checks that a
   `detect` deletes only that key and writes nothing.
7. **I-04: agent-supplied text is drawn only as plain `Text`,** or in the engine's plain toast
   line, never inside an `Svg`, never as `Markdown`. *Why:* it may carry markup or links.
   *Enforced by* `tests/row.test.ts`, on both surfaces. Every fixture row's description and activity is drawn whole, in a `Text` of its
   own; no other element's props hold agent text; and a description with markdown, a link and a
   tag draws as that plain text, with no `Markdown` or `Link`. A fixture row with its Peek open
   draws each of Peek's texts the same way, and `tests/peek.test.ts` raises a description and
   a brief with markup through the events and reads them back as plain text. The desktop's one
   `Svg` is the
   row's sprite: its source is what the sprite module writes from the mod's own art, and its
   other props hold no agent text. A toast carries a run's description, cut as its row's, in
   `$.ui.toast`'s one line of text (`tests/attention.test.ts`).
8. **I-05: a fault in the mod never blocks or alters a turn.** *Why:* the mod runs in every
   session the owner starts. *Enforced by* every event hook returning what `next` gave; a
   `.catch` passing the event on, on every hook but the command's and the pane's drawing; a
   test raising each hooked event with a shape the mod does not know; and the reading guards in
   `hooks/register.tsx`, `record` and `recordLead`, which read the time and write `runs` or
   `lead` inside `try`, apart from the event's result. The clock is armed inside a guard too.
   `tests/pass-through.test.ts` runs each recording hook, `session.start`, `session.measure`
   and the main session's `turn.start` and `turn.complete` among them, with a `$` whose state
   and clock refuse every call, and gets back what `next` gave. The role rules read anything that is not text as
   empty, so a malformed event never throws there, and they run inside the reading guard. The
   clock's beat settles Helper inside a guard of its own, which leaves the clock running. The
  list's read (`readList`) catches every fault inside, and a list it cannot read ends the held
  and waiting runs as their turns did; `tests/pass-through.test.ts` raises a subagent's turn end
  with a list that never answers and one that refuses, and gets back what `next` gave.
9. **I-06: a state is never shown by colour or sprite alone;** each row carries its state word.
   *Why:* accessibility, and the terminal has no sprites. *Enforced by* `tests/row.test.ts`
   (every fixture row, in each state, on both surfaces) and `tests/runs.test.ts` (rows drawn
   from runs, and the five endings, on both surfaces).
10. **I-07: a run's outfit never changes once its role is settled,** except by the person's own
    reassignment. *Why:* a changing outfit misleads. *Enforced by* the model: evidence reaches a
    run only through `withEvidence` in `hooks/model/runs.ts`, which leaves a run with a role as
    it is, and `fellBack` settles only a run with none. The person's pick reaches it only
    through `reassigned` and, for `detect`, `detected`, each called from the picker alone. `tests/model.test.ts` checks a role
    settled by words, by calls and by the fallback, and one the person picked, against a later
    decisive call and the fallback, and `detected` on each of its cases; `tests/settle.test.ts`
    checks it by events, past T-04 and at the run's end; `tests/picker.test.ts` checks a pick
    and a `detect` on each surface.
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
    the spawn's hook starts it unawaited (`void autoOpen`), its every fault caught inside; a
    toast does the same (`void toastUnseen`), and so do the tab's retitle after a write that
    changes the count needing the person (`void retitle`) and the engine's agent list, read after a
    record that leaves a turn's end held or a run waiting (`void readList`). A subagent's
    `turn.step` awaits the clock's time once before its stream.
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
| `ui.close` | Stops the clock; when `origin.kind` is `person`, records it in `view`; counts the close at its start and, unless refused, its end, so a retitle under way skips or undoes an open over a close (*Attention*) | 1, 5, 12d |
| `agent.spawn` | Opens a row from the input, its brief from the prompt; re-keys it from the result | 2, 4, 11 |
| `turn.start` | Marks the loop's row working, heard at its time; the main loop's keeps its turn's start and arms the clock while the pane is open | 4, 10, 12c |
| `turn.step` (streaming) | Yields every chunk through untouched; from the input, the model and effort; from the result, the usage and its estimate and the calls it asks for (`toolUses`): the activity line, the last actions, files touched, calls in flight, the role's tool evidence | 2, 4, 8, 10, 11, 12 |
| `turn.complete` | Ends the row (*The run model*), keeping its answer for Peek, and toasts a long run's end (*Attention*), unless `$.agent.list()` lists the agent `waiting`, which leaves the row waiting (12a); the main session's adds its tokens and time to the Lead | 4, 5, 10, 11, 12a |
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
- **The main loop's `turn.step` makes no `$` call, and its `turn.start` reads the clock's time**
  to keep the turn's start and, while the pane is open, arms the clock, so the session line's
  time moves during a main turn (Decision log, 2026-11-25 and 2026-11-26); its `turn.complete`
  reads the clock's time when a start is kept and makes one write to `lead`, once per main
  turn, beside the one `session.measure` makes then.
- **A subagent's `turn.complete` reads `$.agent.list()`, unawaited,** to tell a turn that left
  the agent waiting from its end (*The run model*; Decision log, 2026-11-25).
- Session 1 hooks every event marked 2 as a pass-through, so Session 2 only reads.
- The spike's hooks that no later session needs are gone: `tool.check` and `tool.call`.

**Built** (0.5.0; the main turn's start 0.16.0). Eleven hooks, in `hooks/register.tsx`:
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
  - `turn.start` and `turn.step` record only an event that carries `agentId`. Each reads the
    time apart (`timeOrNone`), so a clock that cannot be read loses only when the run was last
    heard. The main loop's `turn.step` makes no `$` call. Its `turn.start` keeps the turn's id
    and the clock's time in module memory (`mainTurn`, 0.16.0), not in `lead`, so a turn costs
    no write, and arms the clock where the pane is open (`keepTime`). A clock that cannot be
    read leaves the turn untimed, counted at its end as before, and a start whose turn's end was
    already heard (`endedTurnId`: a start held past its bound) is not kept.
  - `turn.step`, for a subagent, first reads the time (`began`, guarded), then delegates every
    chunk (`const result = yield* next(e)`), then records the
    step's model (the usage's, else the input's), its effort, its usage with the part of its
    cache writes kept an hour (`ephemeral_1h_input_tokens`), and its calls (the activity, each
    call as an action, and the files the changing tools name), and returns
    `result`. In the same change it first settles Helper on any run past T-04
    (`fellBack`), then reads the step's calls as role evidence (`toolsSeen`, from the run's
    reads and searches so far).
  - A subagent's `agent.spawn` opening, `turn.start` and `turn.step`, and the main loop's
    `turn.start`, each arm the clock when the pane is open (*The panel*): `$.clock.every` is
    synchronous, and a no-op while a timer is armed.
  - `agent.spawn`'s opening carries the input's `prompt`, when it is text, as the run's brief.
  - `turn.complete` with `agentId` holds its row's end (`turnEnded`, *The run model*), keeping its
    `answer` when it has text, and settles Helper only on runs past T-04 (`fellBack`): Helper at
    the end, and the toast of a run whose turn ran past T-10 (*Attention*), come with the end the
    engine's list gives. Without `agentId`, it is the main session's, and
    `recordLead` adds its `usage` and `durationMs` to the Lead (`turnCounted`), or, when that
    turn's start is kept and the clock's span since it is longer, that span (0.16.0). It notes
    the turn's id as ended before `next`, and drops the start it found, whatever `next` does,
    unless a later turn's start has replaced it; a start from a turn whose end went unheard is
    dropped and times nothing. A malformed one never gets that far: the engine refuses its
    `next(e)` first (*Context*).
  - `session.measure` awaits `next(e)`, then records the Lead's context and the plan's limits
    (`rateLimits`) through `recordLead` (`measured`).
  - `classic.SessionStart` with `source` `clear`, `resume` or `fork` drops the main turn's kept
    start, stops the clock, empties `runs` and resets `lead`, keeping the plan's limits
    (*Values*). The engine resets `$.state` on a clear already (*Context*); the
    mod's own reset keeps the list right wherever it does not.
- `classic.PermissionRequest` awaits `next(e)`. With `agent_id`, and an answer that carries no
  `decision`, it reads the time and records `asked` through `record`; the change learns whether
  the run moved, and a move starts its toast, unawaited (*Attention*). It returns what `next`
  gave.
- **The engine's agent list** (0.14.0): `record` and `recordAt` start `readList`, unawaited,
  after any write whose runs hold a turn's end (`hasKept`), so every subagent event reads the
  list while a run is held or waits, and the pane closed needs no beat for it. `readList` reads
  `$.agent.list()` (a refusal, a throw or an answer that is no list reads as unread; an entry
  without a text `id` and `status` is left out), each entry's `label` when it is text (0.15.0;
  one equal to the entry's own `description`, the engine's fallback, reads as blank, since the
  row's description may differ: a resume's, or one another plugin's spawn hook rewrote), the
  time, then `runs`, and writes only when `listed` or `summarized` changes a run, through
  `update`, with `fellBack` at that time when `listed` changed one; then one `toastUnseen` per
  run it ended (`endedToasts`). An unread list leaves the summaries as they were. Each read is
  numbered as it starts (`readsStarted`), and one answered after a later-started read has
  applied (`readApplied`) writes nothing, so a slow answer never puts back an older summary or
  status. It is the only
  caller of `$.agent.list`; the clock's beat starts it too (*The panel*).
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
      turns' time and estimate; plan limits.
    - `view`: the session's flags: whether the person closed the pane, which run's Peek is open,
      whether the gallery is open.
  - Any plugin can read any `$.state` value. `runs` holds briefs, answers and file paths, so
    nothing more than a row needs is kept there, and none of it leaves state (I-03).
  - `$.store` (the owner's data across sessions, shared by every session on the machine; a read
    then a write is not atomic):
    - `prefs`: one object: `autoOpen` (`never`, `first`, `always`; default `first`), `cost`
      (`off`, `estimate`; `off`), `motion` (`auto`, `off`; `auto`), `theme` (`classic`,
      `steampunk`, `horror`, `prehistoric`; `classic`), `toasts` (`all`, `needs`, `off`;
      `all`), `collapsed` (default false),
      `finishedOpen` (default false). Two sessions changing settings at the same moment may lose
      one change; accepted, since settings change rarely.
    - `role:<agent type>`: the role id the person picked for a custom agent type. Never written
      for the generic types (`general-purpose`, `claude`, `fork`) or the built-in ones. One key
      per type, so no value is built from a stale copy. The picker's `detect` deletes it.
- **Evolution:** a stored value's shape changes forward-only: a new version still reads the old
  shape, because stored values are the owner's data. A key or value `prefs` does not know reads
  as the default and is kept on the next write.
- **Machine identifiers, never renamed:** the mod's name, `possum-squad`, and its install id,
  `possum-squad@claude-code-mods`, under which the engine keeps its `$.store`; the command
  `possums` and its words `open`, `set`, `settings`, `roles`; the picker's entry `detect`; the
  pane id `possum-squad`; the
  setting names and values above; the set ids; the role ids (*Roles*); the state ids (*The run
  model*); the state keys `runs`, `lead`, `view`; the store keys `prefs` and `role:<agent type>`.
  Reserved for step reports, a later round: the tools `step` and `plan`, the setting
  `stepReports` (`off`, `tool`, `nudge`), the state key `planned`.

**Built** (0.1.0, `prefs` 0.3.0, `runs` 0.4.0, `lead` 0.5.0). `types/index.d.ts` declares
`PluginState['possum-squad']` with `view` as `Shaped<View>`, `runs` as `Shaped<Runs>` and `lead`
as `Shaped<Lead>`, and exports their types; `plugin.json` names the file under `types`, and
`validate` holds the module's state keys to it.
- `view` (gallery 0.8.0; the picker 0.10.0; the gallery's part 0.10.1; Peek 0.12.0) is
  `{ isClosedByPerson, isGalleryOpen, galleryPart?, pickerFor?, peekFor? }`: two booleans,
  default false (`NO_FLAGS`); the gallery's part from 0, absent for the first; and the spawn
  order of the run whose role picker is open, and of the run whose Peek is, each absent while
  none is. It is the atom in `hooks/register.tsx` with the shape tag `view-5`. A reload of the
  mod's code that names another tag reads the value as absent, so the tag changes whenever
  `View`'s fields do.
- Its writers, each through `update`:
  - the `ui.close` hook (*The hooks*), which also drops `pickerFor`, `peekFor` and `galleryPart`,
    writing only when one of them, or the gallery, is set;
  - `/possums roles`, which sets `isGalleryOpen`, and the gallery's close button, which clears
    it and drops `galleryPart`;
  - the gallery's `previous` and `next`, which set `galleryPart` (`moveGallery`);
  - an open or a raise by `/possums`, `open` or `roles`, which clears `isClosedByPerson` when it
    is set (`forgetClose`);
  - a row's role button, which sets `pickerFor` to its run or, pressed again, drops it; and the
    picker's pick and `cancel`, which drop it;
  - a row's Peek button (`togglePeek`), which sets `peekFor` to its run or, pressed again,
    drops it; one Peek is open at a time.

  The pane reads it while drawing, so each write redraws it; a refused read draws the list.
  `autoOpen` reads `isClosedByPerson`.
- `runs` (0.4.0; `past` 0.5.0; roles 0.6.0; a role's moment 0.9.0; attention 0.11.0; Peek
  0.12.0; the estimate and pruned helpers 0.13.0; the kept ending 0.14.0; the activity's cut and
  the summary 0.15.0; a failed run's reason 0.17.0) is `Runs`,
  `{ rows, pending, next, past }`, the atom `runs` with the shape tag `runs-10`, starting as
  `NO_RUNS`. *The run model*'s Built part
  has its fields and rules; `quiet` is never kept there, only worked out where a row is drawn;
  `waiting` is. The recording hooks write it, `classic.PermissionRequest` among them, the
  clock's beat when it settles Helper or ends a held turn past its bound, and the list's read,
  each through `update`, so concurrent writes retry rather than lose one another; the
  pane reads it while drawing, which redraws it on every write. The beat reads it too, outside
  any drawing, and so do an open and a retitle, for the tab's count (*Attention*).
- `lead` (0.5.0; the estimate and the limits 0.13.0) is `Lead`, `{ context?, tokens, workedMs,
  usd, limits? }`, the atom `lead` with the shape tag `lead-2`, starting as `NO_LEAD`:
  - `context` is `session.measure`'s `{ tokens?, window, percent? }`, absent until the first
    measure. A fresh window's has no `tokens` or `percent` until the session's first reply;
  - `tokens`, `workedMs` and `usd` sum the main session's turns, from each `turn.complete`'s
    `usage` and `durationMs` (*The run model*, the estimate);
  - `limits` is `session.measure`'s `rateLimits` as `{ kind, percent }`: each window with a
    `kind` that is not blank and a `percentUsed` of 0 or more, in the engine's order, at most
    `LIMITS_KEPT` (4). It is absent until a measure gives one, and again after one gives an
    empty list; a measure whose `rateLimits` is no list leaves it as it was.

  Only `session.measure`, the main session's `turn.complete` and a clear-type
  `classic.SessionStart` write it, through `recordLead`; the pane reads it while drawing. A
  clear starts the Lead over with the last limits measured (`startedOver`): they are the
  account's, the engine empties `$.state` at a clear, and no measure follows it (seen at
  Session 12's review, CLI 2.1.330). `hooks/register.tsx` keeps them in module memory
  (`knownLimits`), set by each measure's `rateLimits` and by each drawing's `lead`, so a reload
  forgets them only until the pane draws.

  The running main turn's start is not in `lead` (0.16.0): `hooks/register.tsx` keeps it in
  module memory (`mainTurn`, with the turn's id), set by the main loop's `turn.start` and dropped at its
  `turn.complete` and at a clear-type `classic.SessionStart`, so a turn costs no write and `lead`
  keeps `lead-2`; a reload mid-turn loses only that turn's running time (Decision log,
  2026-11-26).

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
- **Changes** come from `/possums set`, from Finished's show button, which writes
  `finishedOpen`, and from the header's collapse button and the collapsed view's `expand`
  (`collapse`, 0.12.0), which write `collapsed`. `toasts` (0.17.0) is the fifth setting, after
  `theme`; a toast reads it (*Attention*).
- **The pane reads `prefs` while drawing** (`finishedOpen`, `collapsed`), and a toast reads
  `collapsed` (*Attention*), so each change calls
  `$.ui.invalidate('ui.render')` after its write, since the store is not reactive. A change
  another session makes shows at this pane's next redraw. A store that refuses a read while
  drawing draws the defaults.

`role:<agent type>` (0.10.0), in `$.store`: the role id the person picked for a custom type
(`isCustomType` in `hooks/roles/rules.ts`: neither a generic type nor a built-in one, compared
lowercased), keyed by the type as the engine spells it, the value the bare id. The picker
writes it through `writeStore`; a spawn of that type reads it (`rememberedOf`), and a value
that is not a pickable role id reads as none. The picker's `detect` (0.17.0) deletes it, through
`writeStore` too (`{ key, forget: true }`, `$.store.delete`); a store that refuses keeps it.

## The run model

**Decided.**
- **A run** is one start-to-end life of an agent, one row: its id; its parent's id when known;
  its agent type; its description; its brief; its round; its role and the rule that settled it;
  its state; its model and effort; its start and end time; its tokens (in, out, cache read,
  cache write) and the size of its last request; its activity (tool, a one-line summary, time);
  its last T-07 actions; the files it touched; its answer's first T-09 characters; its tool calls
  in flight. The Lead is the main session's record, in `lead`, not a run.
- **States,** and their ids: `starting`, `working`, `needs-you`, `quiet`, `waiting`,
  `finished`, `failed`, `stopped`; `planned` is reserved. A run moves starting → working, back
  and forth through needs-you, quiet and waiting, and ends in finished, failed or stopped.
- **Waiting** (Decision log, 2026-11-25): a turn's end while the engine lists the agent's
  status as `waiting` (on background work it owns, a plan's approval, or a helper it waits on)
  is not the run's end. The run reads `waiting` and keeps that turn's ending; its next turn
  makes it working, and the engine listing it ended, or no longer listing it, ends it with the
  kept ending. A read that fails ends it at once. Helper does not settle it at that turn's end.
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
- **How a run ends:** unless it is left waiting, an answer with text is Finished; `aborted` is
  Stopped; `error`, `refusal`, and `answer` with empty text are Failed, but a teammate's
  `answer` with empty text (it answered with a message) is Finished until its next turn. A failed run keeps its last T-07
  actions.
- **Numbers.** Fresh tokens (in and out) are counted apart from cache reads. A row's context
  percent is its last request's size over its model's window (`hooks/data/`, T-11, with a
  default for an unknown model). The header totals the Lead and every run. A run whose spawn
  names its parent (F-24) is drawn under it while both sit in one section, and otherwise as any
  row in its own; its tokens and estimate roll up into the parent's, at every level, and its
  time and context stay its own (Decision log, 2026-11-25). The estimate prices each request's
  tokens at its model's list prices from the dated table (T-12), not from the engine's own
  ledger (Decision log, 2026-11-25).
- **Lifetime.** Runs live in `runs` for the session only, and are never written anywhere else.
  Finished keeps the latest T-06 (30) runs.

**Built** (0.4.0; the Lead and the totals 0.5.0; roles 0.6.0; the estimate and nesting 0.13.0),
in `hooks/model/runs.ts`, `hooks/model/lead.ts` and `hooks/model/nesting.ts`: pure functions from `runs` or the Lead, and a record, to its next value,
each returning the same object when the record changes nothing.
- **A run** (`Run`, in `types/index.d.ts`) holds what its row needs: its agent id once known,
  its parent's id, its type, description and round, whether it is a teammate, its state, its
  role once settled and its reads and searches until then, its model and effort, its start
  and end times, its current turn's start (`turnAt`), the time it was last heard (`heardAt`),
  its four token counts, its last request's size (input, cache reads and cache writes), its
  activity (tool and target) and its calls in flight, once its turn has ended and until the
  engine's list ends it, its kept ending (`keptEnding`, `KeptEnding`: `{ state, failure?, at }`,
  the state it ends in, why it failed, and its turn's end, 0.14.0), once it has failed and its
  turn said why, that reason (`failure`, `Failure`: `error`, `refusal` or `empty`, 0.17.0), and,
  while it needs the person, its
  call's request (`ask`, `Ask`: `{ at }`, or `{}` when the clock could not be read). For Peek
  (0.12.0) it holds its brief, its last T-07 actions, the files it changed and its answer. It
  holds its estimate in dollars (`usd`, 0.13.0) and, once Finished drops a helper of its, what
  that helper had counted (`prunedHelpers`, a `Tally`). A pending entry holds the same numbers,
  the estimate among them, actions, files and role evidence, and `ask` when a
  call of its waits on the person; its loop's turn has begun, so a claimed row is
  Working, or Needs you when it was asking.
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
  - `turnStarted` puts a known row back to Working, its end, any kept ending and any failure
    cleared, as a resume's return does, so a teammate's next turn
    or a resumed agent's continues its row, its time counted from its first start; `turnAt`
    is that turn's start (a resume's, its result), which a toast times the turn by.
  - A spawn whose description equals a Finished run's gets that run's round plus one.
- **Ending** (the hold and `waiting`, 0.14.0):
  - `turnEnded` keeps `endingOf`'s state (Decided above), `failureOf`'s reason when it failed
    (`refusal`, `error`, or `empty` for an `answer` with no text that is not a teammate's; an
    unknown reason names none), and the turn's end on a live row as `keptEnding`, drops `ask`, clears the calls in flight and keeps the answer, and leaves the
    row as it was, a `needs-you` one `working`: no `endedAt`, no prune, so no ending's moment.
    A row already ended ends again at once, and a pending entry is dropped, as before.
  - `listed(runs, statuses, now)` applies the engine's list, `id` to `status`, to each row with
    `keptEnding`: `waiting` makes it `waiting`, its ending still kept; `running` and `pending`
    leave it as it is, since its next turn's own events tell; `completed`, `failed`, `killed`,
    `idle` (a teammate between turns) or no entry end it with the kept state (`endedWith`), at
    its turn's end, or, for a `waiting` row, at `now` (else the turn's end), so its time counts
    the wait. A list that could not be read (`undefined`) ends every one. Then `pruned`. A row
    with nothing kept is left alone, and with nothing to change it returns the same object.
  - `endedWith` gives an ended row its kept state and, for `failed`, its kept reason, dropping
    any older one; so `turnEnded`, `listed` and `heldOut` all carry the reason to the toast.
  - `heldOut(runs, now)` ends with its kept ending, at its turn's end, every row held (kept and
    not `waiting`) for `LIST_ANSWER_MS` (5 s) or more since its turn's end: the bound for a list
    that never answers. A `waiting` row is the list's to end. `hasKept` says whether any row
    holds a kept ending.
  - Measured before building (CLI 2.1.330, a probe plugin): a read made inside `turn.complete`,
    before or after `next`, already lists a plain subagent `completed`, and one that started a
    background shell, or a background helper, `waiting`; when that work ends the engine resumes
    the agent (a spawn under the same id, then a turn), and its next end lists `completed`. An
    ended subagent stays listed about 30 s; `taskStatus` reads `completed` throughout.
- **Needs you** (0.11.0): `asked` moves a starting or working row to `needs-you`, heard then,
  with its `ask`; on a row that needs the person already, the later request replaces the
  earlier, since a call asked while the next step still streams must outlast that step's
  record. It leaves an ended row and an agent nothing holds, and gives a pending entry its
  `ask`. `stepped` brings a `needs-you` row back to `working`, and drops an entry's `ask`, at
  a step begun at or after the request's time, or one whose start is unknown (`waitAfter`): a
  later step is the asked call moved on, allowed or refused; the step that asked it may be
  recorded after the request. A request whose time is unknown waits out the next record, as
  the asking step's, and then takes that record's time. `turnStarted` and `turnEnded` drop
  `ask`.
- **Peek's record** (0.12.0), kept no fuller than Peek draws it, since any plugin can read
  `runs`:
  - **the brief** is the spawn's prompt, trimmed, as an `Excerpt` (`{ text, isCut? }`, its
    first `PEEK_CHARS`, 600, characters counted whole: `cutTo`, `excerptOf`). A resume that
    returns to its row keeps that row's brief; one that opens a row takes its own prompt;
  - **the actions** are each shown call of each step, as the activity reads it (`callsOf`'s
    `actions`), the last `ACTIONS_KEPT` (T-07, 5), oldest first; a pending entry's go before
    the row's own when it is claimed;
  - **the files** are what Write, Edit, MultiEdit and NotebookEdit name (`callsOf`'s `files`,
    each path's first line whole), each kept as its last `TARGET_CHARS` characters
    (`pathEnd`, an `Excerpt` marked cut), where its name is, once at the place it was last
    changed, the latest `FILES_KEPT` (10). Two files are told apart by their whole ends, never
    by a start they share. Reads are no file changed: the owner's choice at the plan;
  - **the answer** is a turn's `answer` with text, as an `Excerpt`; an end without text keeps
    the last that had it, a teammate's earlier turn's.
- **Heard** (0.11.0): `heardAt` is the opening's time, then the spawn's result's, each turn
  start's and each step's, when the clock could be read.
- **Quiet** (0.11.0): `quietMs` is how long a starting or working run with no call in flight
  and no kept ending has heard nothing, once that is T-05 (`QUIET_AFTER_MS`, 90 s) or more. `rowData` draws such
  a run as `quiet`, so its section, colour, word and pose follow; nothing stores it. A step's
  calls are in flight until the next step's record, so a run is never quiet during a call or
  the reply after it.
- **Roles** (*Roles*): `opened` takes the role the spawn's words settled. `stepped` applies a
  step's evidence, and `claimed` a pending entry's, both through `withEvidence`, which leaves a
  run with a role as it is (I-07). `weakOf` gives the reads and searches a run or entry has
  seen. `fellBack` settles Helper on every run with no role that is T-04 past its start, or
  has ended and is neither a teammate's nor one whose turn left work in the background
  (`hasBackgroundWork`, set by a step with a call whose input has `run_in_background`, and
  cleared when its next turn starts, or when the engine's list says the run ended, since its
  background work is then done; an end an unread list gives keeps it). A held or `waiting` run has not ended, so the end's rule
  waits for the end the list gives. `keepsClock` is true for a live run, a held or `waiting` one
  included, or one with no role.
- **Numbers:** `figures` gives fresh tokens (input, cache writes and output), the elapsed time
  (to the end, or now) and the context percent, the last request over `windowOf` its model.
  `hooks/data/models.ts` holds the windows measured on 2026-11-20 (Haiku, Opus and Sonnet 5.5,
  1,000,000 each), and the same as the default; an id with a suffix finds its model (`rowFor`,
  which the price table shares), by the longest model that leads it, so a dated
  `claude-opus-5-5-…` is never taken for `claude-opus-5`.
- **The estimate** (0.13.0): `costOf` (`hooks/data/prices.ts`) prices tokens at a model's list
  prices: uncached input, output, cache reads, and cache writes, those kept an hour at their own
  rate. `PRICES` holds every model the page lists as served, read from the published pricing
  page on 2026-11-25: Fable and Mythos 5.2, 5.1 and 5; Opus 5.5, 5 and 4.8 to 4.5; Sonnet 5.5,
  5, 4.6 and 4.5; Haiku 5.5 and 4.5; Haiku 5.5's long-prompt rates apply past a 100,000-token prompt.
  An unknown model costs Opus 5.5's prices, the default, and a count that is not a finite number
  above 0 costs nothing, so the estimate is never NaN.
  - `withStep` adds each step's estimate at the step's model. A step is one request: its prompt,
    the last request's size, picks the rates, and its hour writes are
    `ephemeral_1h_input_tokens`. A pending entry's estimate is claimed with it.
  - `turnCounted` adds a main turn's at its usage's model, the one that answered last. A turn's
    tokens are summed over its requests, so it never takes the long-prompt rates.
  - The engine's own ledger (`session.measure`'s `cost`, `$.agent.list()`'s per agent) is not
    read: the owner's choice at the plan, so the header is the Lead and every row, and moves
    with each step.
- **Nesting** (0.13.0): `parentsOf` (`runs.ts`) maps each run, by spawn order, to the run whose
  agent id its spawn's `parentAgentId` names, when a row here has it; a run naming itself or an
  agent no row has has none. `rolledUp` (`nesting.ts`) gives each run its fresh tokens and
  estimate with every helper's under it, at any depth, and its `prunedHelpers`, memoised; a
  loop of parents counts each run once.
- **The header's totals** (`totals`, in `hooks/model/lead.ts`): the Lead's fresh tokens,
  `workedMs` and `usd`, plus the running main turn's time since its start (`turnAt`, 0.16.0;
  none for a clock read before it, unknown for a clock that cannot be read), plus every kept
  run's own `figures` and `usd`, so a helper counts once, plus `past`. A run is live (`isLive`)
  until it ends.
- **The Lead** (`hooks/model/lead.ts`): `measured` takes a measure's context, and `turnCounted`
  adds a main turn's tokens and duration: the engine's `durationMs`, or the clock's span since
  the turn's kept start when that is longer (0.16.0), so the counted time never falls short of
  the running time the line showed. A count, window, duration or span that is not a finite
  number of 0 or more is not counted, so a malformed or interrupted turn, whose `usage` is
  absent, never makes a figure NaN. Its context percent is the engine's `percent`, else its
  tokens over its window. Each returns the same object when nothing changes.
  - Measured before building (CLI 2.1.330, a probe plugin timing three main turns: a one-word
    answer, a 10-second ping, and one interrupted): the engine's `durationMs` ran 11 to 35 ms
    past the clock's span from just after `turn.start`'s `next`, and 3 to 12 ms past it from
    just before; that `next` took 7 to 23 ms. So a turn's end steps the line forward a little,
    and the span is kept only where the engine's figure is shorter.
- **The activity** is the last call a step asked for, in `hooks/model/tools.ts`: its tool and
  the argument that names what it works on (a path, the command's first line, a pattern, a URL,
  a query, a description), cut to `TARGET_CHARS` (80) and marked `isCut` (0.15.0). A path of
  `PATH_TOOLS` (Read, Write, Edit, MultiEdit, NotebookEdit) keeps its last 80 characters
  (`pathEnd`), where its file's name is; any other target its first 80, whole characters
  (`cutTo`). Glob's pattern keeps its start: it is short, and a pattern's end is no file. The
  engine's `SubagentHandback` is not shown. `cutTo` and `pathEnd` live in `tools.ts`, which
  `runs.ts` imports, so neither imports the other back.
- **The summary** (0.15.0): `summarized(runs, labels)` gives each live row the engine lists,
  by agent id, its `AgentInfo.label`: its whitespace folded to single spaces and trimmed, cut
  at `DESCRIPTION_CHARS` (100) as an `Excerpt` (`Run.summary`), so `runs` holds no more than
  the row draws. A blank label, or one equal to the description folded alike (the engine's
  stand-in for none), removes it. Pending entries and ended rows are left alone, and
  `endedWith` drops it, so an ended row keeps none. It returns the same object when nothing
  changes.
  - Measured before building (CLI 2.1.330, a probe plugin reading the list each second): a
    background subagent of 57 s, three 15-second pings with a read and a listing between them,
    had its label equal to its description for 31.5 s, then a one-line summary of 29
    characters, kept unchanged through its end and after it; the engine's own agent row in the
    terminal showed the same words. 144 reads took 1.9 ms each on average, 4 ms at most, with
    one agent listed.
- **Lifetime:** `cleared` empties `runs`, `past` included; past 30 ended runs (T-06) the oldest
  by end goes, but never a teammate's. What a dropped run counted, its fresh tokens, its time
  to its end and its estimate, is added to `past`, so the header's totals never drop. Its tokens
  and estimate, with its own `prunedHelpers`, also go to its nearest kept ancestor's
  `prunedHelpers` (`pruned`), past any ancestor dropped with it; and a kept helper of a dropped
  run takes that ancestor's agent id as its `parentId`, or none when no ancestor is kept, so its
  own share stays in the ancestor's roll-up and it is drawn under it. So a parent's roll-up
  never drops either; a teammate's helpers among them. `cleared` and `isEmpty` read a `past`
  holding anything, dollars alone included, as not empty.
- **The count that needs the person** (0.17.0): `needingYou` counts the rows in `needs-you`, as
  the Needs you section does; a pending entry's `ask` is not counted until its row claims it.
- **`detect`** (0.17.0): `detected(runs, order, found, fallback, at?)` drops the run's role and
  weak calls, then asks `found` (the role rules, *Roles*). A role they give is set with `at`, or
  with the run's old `at` when it is the id the run wore, so no hop plays. With none and the time
  known, an ended run, a resting teammate's and one with background work included, or one past
  T-04, takes the fallback (Helper) at once: nothing else would settle it, and a drawing's `$`
  may not arm the clock. A live run younger than T-04 draws plain, its weak calls seeded from
  those `found` counted. A clock that cannot be read leaves it plain for the beat or a step.

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
  reassignment applies to that run at once, and is remembered only for a custom type. The
  picker's first entry, `detect`, is a pick too: it puts the run back on the rules and, for a
  custom type, deletes the remembered pick (Decision log, 2026-11-25).
- **One home for the word lists.** The rules are a port of the round's Python reference, with
  its behaviour unchanged; once ported, the word lists, their order and the matching rules
  (whole words, stems, phrases, case ignored) live only in `hooks/roles/`.
- **The corpus** of labelled descriptions is a `.ts` fixture: every `dev` item and at least 90%
  of the `holdout` items get their label. Labels are never changed; the table is never tuned on
  `holdout`; cases may be added to `dev`.

**Built** (0.6.0; the picker and memory 0.10.0; `detect` 0.17.0). Detection, the person's picks,
their memory for custom types, and `detect`.
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
  the clock's beat. Its end is the one the engine's list gives (0.14.0): a turn's end that the
  list says leaves the agent waiting settles nothing, and the list's read, or the beat ending a
  held turn past its bound, settles Helper on the run it ends. Words outrank calls: a role settled at the spawn stands over any evidence
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
- **`detect`** (0.17.0), the picker's first entry (`DETECT` in `hooks/roles/rules.ts`), is
  `detectRole` in `hooks/register.tsx`:
  - it reads the clock, and inside one write of `runs` runs `detected` (*The run model*) with
    `redetected(type, description, actions)`: `detect` with no remembered pick, its calls the
    run's kept last actions (T-07, five) read as clues, `Bash:` and the command's first line as
    kept (80 characters) for a shell call, the tool's name otherwise; with no role, the reads
    and searches among them;
  - for a custom type, taken from the run inside that write, it deletes `role:<agent type>`
    through `writeStore`; a refused store keeps the memory, and the run is detected all the
    same;
  - it closes the picker.

  A run keeps no calls but those (a call is read, never stored), so `detect` cannot reach what
  the first calls settled: six reads for Scout never fit in five, and a test runner past a
  shell call's first line, or its 80th character, is not seen (*Known debt*). Another plugin's
  `ui.select` hook may rewrite a pick into `detect`, which is pickable as any role is.

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
  now and then), `needs-you` (holds up a "?" sign), `quiet` (dozing on its feet; `waiting` draws
  the same, Decision log 2026-11-25), `finished`
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
- **The collapsed Lead** (0.12.0, `leadWith` in `index.ts`): the Lead's idle still in the set,
  with the joey from `art/extras/` laid over it at the first one to three of `JOEY_SPOTS`
  (`recipes.ts`: (23, 9) on its right ear, (23, 17) beside its cheek, (25, 23) on its tail),
  always still, cached per set and count. With none it is the header's own Lead, the same
  string. The joey was redrawn at Session 11 on the owner's word, 7 by 6, with
  dark ears, a grey crown and pink paws, and kept after the owner's look at it in every set
  on both themes; its spots came with it. 2.6k to 4.4k characters (prehistoric's with three).
- **Sizes** (all four sets): a still pose 1.6k–3.4k characters, `planned` 4.0k, the work loop at
  most 8.7k, needs-you 8.1k, quiet 8.3k, an arrival 10.6k, a dressing 10.8k, a startle 10.4k, a
  cheer 13.6k and the gallery's repeating cheer 14.0k; the squad 5.0k. A role's eight gallery
  cells with `motion` `auto` come to at most 67.4k (prehistoric's Lead), a part of three to
  180,186 characters of sources, measured under Node; with `off`, 27.0k and 70,835. `tests/sprites.test.ts`
  holds every look of every set, moments included, under 16,000. Composing all 288 classic looks
  from a cold cache took 167 ms in the kit, one work loop 3.5 ms (CLI 2.1.330); every look of
  every set with its moments, 5,184 asked, 2.3 s under Node.
- **Seen:** every classic pose, still and animated, on dark and light, drawn by Quick Look from
  a scratch page; at 0.8.0 every set's gallery poses, `planned` included, the same way; at 0.9.0
  every set's moving looks for five roles, played in a browser on dark and light. In the desktop
  app at Session 9, installed 0.9.0 on the dark theme: fourteen working rows' opossums moving in
  their outfits and the Lead's; the 0.9.0 gallery drew nothing, past the desktop's bound
  (*Context*). At Session 9a, installed 0.10.1: the gallery's six parts in turn and round, in
  either motion and in `prehistoric`, and its close. The rest is unseen (`docs/BACKLOG.md`).

`waiting` (0.14.0) is quiet's pose: `STILL.waiting` is the blink, `BOB_PACE.waiting` 4, and it is
among `LIVE`, so it arrives and is dressed as quiet does. Its sprites are written apart in the
cache, the same sources as quiet's (`tests/sprites.test.ts`). The gallery does not draw it: the
owner's choice at Session 12a's plan, since it would repeat quiet's cell for every role.

## The panel

**Decided.**
- **The pane.** Id `possum-squad`, title "Possum Squad", T-13 (46) columns asked. `/possums`
  toggles it; it opens by itself per *Attention*. It redraws when a state value it read changes,
  and once a second while a run is live or a main turn runs, and it is shown, for elapsed time.
- **Sections,** in this order: the Lead, then Needs you, Running, Finished (collapsed by
  default), each with its count. A section other than Running with no row is not drawn.
- **The header:** the Lead row, then one line of the session's numbers: plan-limit percent,
  tokens, time, and, with `cost` at `estimate`, a dollar figure labelled "est.". The plan-limit
  percent is each window the engine reports, in its order (Decision log, 2026-11-25). Its tokens
  and time total the Lead and every run; the time is work time, the Lead's turns summed plus every
  run's time, so it moves only while something works, a main turn included (Decision log,
  2026-11-25).
- **A row:** the sprite (desktop) or a coloured state mark (terminal); line 1 the description;
  line 2 role, model, effort; line 3 the activity, then the `peek` button, which keeps its room
  at any activity's length; line 4 a bar of context fill, then context
  percent, tokens and time, and with `cost` at `estimate` its estimate labelled "est."; the
  state word on every row (I-06). A helper is drawn under its parent (*The run model*). A long text is cut to one line
  with an ellipsis; Peek shows it whole. All agent text is plain `Text` (I-04).
- **Seats.** In the `dock` and `inline` seats the pane draws in full. In the desktop's `widget`
  seat (a minimized pane, where clicks may not reach) it draws the collapsed view.
- **The collapsed view:** the Lead's sprite with one joey per running agent up to T-14 (3), then
  a numeral, and a mark when anyone needs the person. The header's collapse button toggles it
  (`prefs.collapsed`).
- **Peek:** a row's `peek` button opens, under it, the brief, the last T-07 (5) actions, the
  files it changed and the answer's first T-09 (600) characters; pressing it again closes it
  (Decision log, 2026-11-25).
- **The gallery** (`/possums roles`) replaces the list while open: every role of the current set
  in every state but `waiting`, which is quiet's pose (Decision log, 2026-11-25), each with its role name and costume name, three roles at a time, with
  `previous` and `next` between the parts on every surface. Its sprites animate, framed like the
  rows', so they follow reduced motion. A part frames at most 18; if the owner's look finds them
  not smooth, the choice returns to the owner.
- **Within what the desktop draws** (*Context*): every tree the pane answers fits the app's
  bound. The gallery's parts are sized for it. Past a budget, the rows' sprites stand still,
  then give way to the state's mark. At most 60 rows are drawn, the rest counted under their
  section.
- **The terminal** draws the same sections and numbers as text rows, a coloured mark per state
  and block-character bars, with no element the terminal lacks.
- **The activity** (Decision log, 2026-11-25): a call's target that is a path keeps its end, and
  the line names the file first, then its folder, so its file name shows at any width; a
  command keeps its start. The engine's progress summary for an agent, where it has one, shows
  as plain text in the last call's place on a starting, working or waiting row, but not on one
  that needs the person, is quiet or has ended. A finished, failed or stopped row reads its last
  call in the past; a waiting row keeps the live verb.
- **The clock.** The only timer is `$.clock.every(1000)`, armed while the pane is open and a
  run is live or its role may still fall back to Helper, or a main turn runs, cancelled
  otherwise (N-03); it redraws the pane only while it is shown, so a
  pane behind another's tab keeps its times. A reload cancels it, so `session.start` re-arms
  it.
- **The empty panel:** the squad asleep and "No agents yet. They show up here when Claude starts
  one."
- **Words** are plain and short, with no exclamation marks and no jokes in error text.

**Built** (0.1.0; the row 0.3.0): the pane, the toggle and the empty panel.
- `/possums` opens `possum-squad` with `{ id, title, columns: PANE_COLUMNS }` (T-13, 46, in
  `hooks/config.ts`), the title "Possum Squad" while no run needs the person, counted otherwise
  (`STRINGS.paneTitle`, 0.17.0, *Attention*). It sets no `placement`, so the surface seats it: docked in
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
- **The header:** the Lead row, then the session line (dim), one `Text` joined by ` · `: each
  of `lead.limits` as `5h 40%` (0.13.0; `STRINGS.limits` names `five_hour` 5h, `seven_day` 7d
  and `spend_limit` spend, and another kind reads as given), then `254k tokens · 4:12` from
  `totals`, the running main turn's time included (0.16.0), then, with `prefs.cost` at
  `estimate`, `est. $1.20` (0.13.0). `drawPane` gives the
  session and each row `usd` only then, so with `off` no dollar figure is in the tree.
  - **`terminalLead`:** a `●` in the theme's `claude` colour and "Main session", then, indented,
    the block bar and `ctx 31% · 120k`.
  - **`desktopLead`:** its sprite ("Lead": the `lead` outfit, idle and still), or the mark where
    the surface draws no `Svg`, beside "Main session" in semibold, then the app's `Progress`,
    labelled "Context", valued `31% · 120k`.

  The Lead is no run, so it has no state word; until a measure it reads `–`.
- **The sections** come from each row's state (`SECTIONS`):
  - Needs you: `needs-you`;
  - Running: `starting`, `working`, `quiet`, `waiting`;
  - Finished: `finished`, `failed`, `stopped`.

  Each is headed `Running · 2` in bold. Running is drawn whenever any run exists, the others
  only when they hold one, and rows keep spawn order. With no run at all, the empty panel's
  line takes the sections' place.
- **Finished's heading** carries a `Button` keyed `finished`, dim, labelled `show` or `hide`.
  The terminal draws it `[ show ]`. Its rows are drawn only while `prefs.finishedOpen` is set;
  a press writes the flag through `writeStore`, then invalidates the drawing.
- `rowData` (`hooks/view/runs.ts`) makes a run's `RowData` from it and the model's figures, its
  role's name from `STRINGS.roles`, and the activity line through `activityText` (0.15.0):
  - a path tool's call names its file first, split at its last `/` or `\` (a Windows path),
    then its folder after `STRINGS.inFolder`'s ` in `: "Reading rack.txt in north/shed"; a cut path's folder starts at its next whole
    name after `…` ("in …/north/shed"), one with no folder reads "Reading rack.txt", and a cut
    one with no `/` "Reading …k.txt". The desktop always cuts a line's end, and a docked
    terminal row leaves about 35 columns for it, so the name leads: the owner's choice at the
    plan;
  - any other call reads its verb and target, `…` after a cut one: "Running ./plant …";
  - a tool with no verb reads "Using <tool>" (an MCP tool by its own last name).

  Line 3 by the row: quiet reads "Quiet for 2 min"; an ended row (finished, failed, stopped)
  its last call in the past, from `STRINGS.activityPast` ("Ran npm test", "Read rack.txt in
  shed", "Used water"), or `STRINGS.row.noCalls` ("No tool calls"); a live row with a summary
  that does not need the person, the summary, `…` after a cut one; otherwise its last call with
  the live verb. A waiting row is live, so it keeps "Running …": what it waits on still runs.
  Peek's last actions read as the live line does.

The clock (0.5.0; roles 0.6.0; the main turn 0.16.0), in module memory in `hooks/register.tsx`: a reload drops it, and the engine
cancels its timer.
- **Arming:** `armClock` creates the timer only when none is set, so arming is idempotent. It is
  armed only from dispatches that are not drawings, since a drawing's `$` may not serve a later
  beat. "A run is live" below means `keepsTime`: a main turn's start is kept, or a run
  `keepsClock`, live or with no role yet.
  - `/possums` or `/possums open`, when a run is live, whether it opened, raised or left the
    pane: it stops any timer first, so the person can always start a fresh one;
  - a subagent's spawn, turn start or step, and the main loop's turn start, when the pane is
    open (`keepTime`);
  - `session.start`, when a run is live. The pane is not known there, so the first beat looks:
    after a reload with the pane closed, one beat runs.
- **The beat** asks `$.ui.panes()`, and marks the pane open or closed by what it finds. With no
  pane it stops. With no main turn and no live run in `runs` it stops; a refused read of `runs`
  stops it too, but not while a main turn runs, which a drawing likewise reads as no runs. While a run has no role, it reads the
  clock and settles Helper on any run past T-04 (`settleHelpers`), writing `runs` through
  `update` only when one is due; that write redraws the pane, so it skips its own
  invalidation, and a fault there leaves the clock running. While `view.isGalleryOpen` is
  set it skips the invalidation too: the gallery's sprites move inside themselves, and a redraw would send a part's
  24 sprite sources again for the header's time alone, so the header's time moves only on
  events until the gallery closes. A real session showed it: a
  subagent whose only call was a foreground `ping` of 70 s read Helper at about 1:00 while
  still working (CLI 2.1.330). While a run holds a kept ending (`hasKept`), it ends any held
  past `LIST_ANSWER_MS` (`settleHeld`, through `update`, with Helper and the toasts of what it
  ends), then starts `readList`, unawaited. Otherwise, while the pane is shown, the gallery
  closed and a run live (0.15.0), it starts `readList` for the summaries; a main turn alone reads
  none. So the list is read
  once a beat at most, and not while the pane hides behind another tab, shows the gallery, or
  shows only ended runs, whose last beat stops the clock. It reads `view` first. Otherwise it
  invalidates the
  drawing, but only if the pane is shown. Any other fault stops it. Each arming has its own generation, so a beat in flight from a
  replaced timer stops nothing.
- **Stopping:** at a close, whatever its origin; at a clear-type session start; and when a
  drawing finds no live run, so the last run's end, or the main turn's when no run is live,
  stops it at once. A drawing whose read of
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
  - the activity, or "No tool calls yet"; while quiet, "Quiet for 2 min" (`STRINGS.row.quietFor`,
    whole minutes since it was last heard);
  - a 10-cell block bar of context fill, then `ctx 9% · 18k · 0:42`. An unknown context draws
    an empty bar and `–`.
- **`desktopRow`** draws the sprite it is given in the leading slot, or the coloured mark where
  the surface draws no `Svg`. `panel` gives it the sprite of the row's role (`RowData.roleId`,
  plain while unsettled) in its state's pose, in `prefs.theme`'s set, with `prefs.motion`; its alt is
  "Builder, working", or "Opossum, starting" while plain. With its moment (`RowData.moment`,
  0.9.0), a moving sprite with `motion` `auto` is framed (`isInteractive`): a working,
  needs-you, quiet or waiting one, and any row inside its arrival, hop or ending; every other one is an
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
  "Detect" (`detect`, 0.17.0) then `PICKABLE`, valued the row's role when it is one (never
  `detect`), and a dim `Button` keyed `role-cancel`,
  "cancel". The builders take a `RolePicker` of closures from `panel`, which binds each to the
  row's order; one picker is open at a time.
- **Lines cut to one:** the description, the model and effort, and the activity carry
  `wrap="end"`, so a long one ends in an ellipsis.
- **What keeps `peek` in reach** (0.15.0): each of those three Texts sits in a `Box` of
  `SHRINKS`, `flexGrow` and `flexShrink` 1 with `minWidth` 0 and `overflow` `hidden`, and
  `desktopRow`'s column beside the sprite has `minWidth` 0 alone, since hiding its overflow
  could clip the role picker. Laid out as CSS flex, a one-line Text keeps its Box from
  shrinking below the text's width unless its minimum is 0, which at 0.13.0 pushed the `peek`
  button out of the desktop pane, and could push line 1's state word. In the terminal's layout
  both props are the defaults. They are props only: no node.
- **Colours** are theme keys, the same for the mark and the word: working `success`, needs-you
  `permission`, quiet `warning`, failed `error`, finished `subtle`, starting, waiting and stopped
  `inactive` (waiting's the owner's choice at Session 12a's plan).
- **Numbers** come from `hooks/view/format.ts`:
  - tokens: `640`, `9.5k`, `38k`, `1.2M`;
  - time: `0:42`, then `1:02:05` from an hour;
  - the percent, rounded;
  - dollars (0.13.0): `$0.25`, `$12.40`, `$123` from 100, `<$0.01` above 0 and under a cent,
    after `est. ` at the end of line 4 on both surfaces, with `cost` at `estimate`;
  - a number that is missing or not finite reads `–`, and the desktop bar's fill is empty
    rather than the bar that only spins.
- **The desktop row** was seen by the owner with 0.4.0 installed; the terminal's in Session 4's
  check.

The gallery (0.8.0; in parts 0.10.1), in `hooks/view/gallery.tsx`: while `view.isGalleryOpen`
is set, `drawPane` passes `galleryOf(ART, prefs.theme)` and `view.galleryPart`, and `panel`
draws that part below the header, in the sections' or the empty panel's place.
- **Its parts:** `GALLERY_ROLES_PER_PART` (3, `hooks/config.ts`) roles each, in the default
  set's order, so six for 17 roles: Lead, Scout, Planner first; Pilot, Helper last
  (`partsOf`). A part that is not one of them draws the first (`shownPart`).
- **Its heading** is `Roles · Steampunk` in bold, beside a dim `Button` keyed `gallery`, labelled
  "close" (`[ close ]` on the terminal), whose press clears the flag and drops the part. Under
  it, one line: a dim `Button` keyed `gallery-previous` ("previous"), the part as `2 of 6`,
  and a dim `Button` keyed `gallery-next` ("next").
- **Moving** (`moveGallery` in `hooks/register.tsx`) writes `view.galleryPart` one part along,
  going round from the last to the first and back (`movedPart`). Wrapping keeps both buttons in
  place on every part, so a press never lands on a button that moved.
  - `/possums roles` while the gallery is open leaves the part as it is.
  - A change of set keeps the part, since every set has the same roles in the same order.
  - Every close drops the part, so an opening starts on the first.
- **`desktopGallery`:** each of the part's roles in the default set's order, its role name
  (semibold) beside its costume name (dim), over a wrapping row of eight cells in
  `GALLERY_STATES`' order: planned, starting, working, needs-you, quiet, finished, failed,
  stopped. Each cell is the role's sprite in that pose with `prefs.motion` (0.9.0), alt
  "Builder, planned", over its state word in footnote size; where the surface draws no `Svg`,
  the state's mark. `GALLERY_MOMENTS` gives starting its arrival and finished and stopped their
  ending, each repeated: with `motion` `auto`, 18 cells of a part are framed and move, and
  `planned` and `failed` are images; with `off`, all are images.
- **`terminalGallery`:** the same heading and line, then "States", each state's coloured mark
  and word (`planned` in `inactive`); then "Roles", the part's roles, each name, a dim `·`, then
  its costume name (dim), so the two never run together where dimming does not show.
- **Its size** (by the desktop's count, in the kit, CLI 2.1.330): the heaviest part is 186,618
  characters and 145 nodes, 8 deep (prehistoric's first, `auto`); with `off` at most 77,267.
  The other sets' heaviest parts with `auto` are 164k to 166k.
- **Timing** (N-05, in the kit, CLI 2.1.330): building the pane's tree for 20 rows took
  0.21 ms (median of 200, max 1.0 ms) with the sprites cached; the first build, writing its
  20 sprites, about 32 ms. The gallery's first draw of a set, writing 136 sprites, about
  43 ms; then 0.33 ms. At 0.9.0, with its 102 moving sprites, the first draw of a set took
  0.19–0.24 s in the kit, then 7–10 ms a mount; its sources are about 875k characters.

Within what the desktop draws (0.10.1), in `panel` (`hooks/view/panel.tsx`) and `rowData`:
- **The row cap:** rows are drawn in order (Needs you, Running, then Finished while open) up
  to `ROWS_DRAWN` (60). A section that loses rows ends with a dim `Text` keyed `more`, `and 12
  more` (`STRINGS.more`), and its heading still counts every row. Finished closed loses none:
  its rows are not drawn anyway. A desktop row is 28 to 31 nodes as the kit draws it (its bar
  about 8, its activity line with Peek's button 5), so 60 rows with every extra and one Peek
  at its fullest came to 1,845 nodes.
- **The sprite budget,** `SPRITE_BUDGET` (160,000 characters of sources, the Lead's counted
  first), fitted on each drawn row's steady look (its pose's own, without a moment), in that
  order (`withinBudget`):
  - while every row's steady look fits, each gets it, and no other look is written;
  - past it, rows take their still while it fits, and the rest none, so they draw the state's
    mark. A still steady look is its own still, so a stopped row stands as it does with fewer
    rows; a moving one's still is the pose with `motion` `off`;
  - then rows move up to their steady look, in order, while the total still fits. A row never
    moves while an earlier one cannot.

  Then each row drawn as its steady look plays its moment, in order, where it fits in what the
  rows left of the budget and `MOMENT_ROOM` (20,000) above it (`withMoments`); one that does not
  fit leaves the next to try. Since the fit never sees a moment, a row's arrival, hop or ending
  never moves another row between moving and still.

  A row the budget stills, or whose moment does not fit, names its own state in its alt; only a
  row drawn with its moment keeps an arrival's `starting`. Twenty-five working rows with every
  extra drew 23 moving; forty drew 14 moving and 26 still, 184k characters.
- **The gallery draws no row,** so while it is open `panel` writes no row's sprite.
- **The description cut:** `rowData` cuts a description past `DESCRIPTION_CHARS` (100)
  characters, counted whole so an emoji is never split, and adds `…`. `runs` keeps it whole, for the round's match. An activity's target is already cut at
  `TARGET_CHARS` (80) in the model, and a summary at `DESCRIPTION_CHARS`.
- **The worst list:** 60 drawn of 90, every text at its longest, round 2, a moment each,
  Finished open, a picker open, a Peek at its fullest (0.12.0), and every row under the one
  before it in its section, with four limits and the estimate (0.13.0). Its third lines and
  Peek's actions are the longest a row draws at 0.15.0, a web search's query cut, 103
  characters, past a summary cut at 100 and a path named file first. In any set it came to
  1,845 nodes, 8 deep and at most 232,837 characters (horror; `tests/size.test.ts`), 92% and 89%
  of the bound; the same rows unnested draw the same nodes and levels. At 0.14.0, with an
  activity of 88 characters, it was 227,422. At 0.12.0, without
  nesting, limits or the estimate, it was 225,793; without Peek and its button, 1,613 and
  218,861.

Helpers (0.13.0), in `panel` and the row builders:
- **Their data:** `drawPane` gives each row its parent's spawn order (`RowData.parent`, from
  `parentsOf`) and its rolled-up tokens and estimate (`rolledUp`); its time and context stay its
  own.
- **Their order:** `nested` orders each section's rows. A row whose parent is not in that
  section starts a branch, in spawn order, and its helpers there follow it, depth first, in
  spawn order; a loop of parents is drawn from its first, each row once. The row cap and the
  sprite budget follow this order. The headings, `countsOf` (a helper is an agent of its own)
  and the toasts are unchanged.
- **Their indent:** a row's depth is `paddingLeft` on its own outer `Box`, `NEST_INDENT` (2)
  cells a level, up to `NEST_LEVELS_DRAWN` (3) levels, so nesting adds no element and no level.
  A depth past three keeps its place under its parent at three's indent.

A quiet row's third line, on both surfaces, is "Quiet for 2 min" in place of its activity
(`rowData`); a Needs you row keeps its activity, the call it asks about.

Peek (0.12.0), in `hooks/view/row.tsx` and `hooks/view/runs.ts`:
- **Its button:** each row's third line is a row `Box`, the activity cut to one line, then a
  dim `Button` keyed `peek-<row id>`, `peek`, or `hide` while open. A `Button` holds only text
  and is the only element a press reaches, so the row itself cannot be the press: the owner's
  choice at the plan, over drawing the task's line as the app's button. `panel` binds its
  press to the row's spawn order, and `togglePeek` writes `view.peekFor`.
- **Its data:** `rowData` gives `RowData.peek` for the open row alone (`peekData`): the
  description cut at `PEEK_CHARS` rather than 100, the brief and the answer with `…` where the
  model cut them, the actions through `activityText` (a file named first, the live verb, 0.15.0), and the files, `…` before a cut one's
  end. While the run is live again, an answer kept from an earlier turn is marked
  (`isEarlierAnswer`) and headed `Last answer`, not `Answer`.
- **Its lines,** under the row (on the desktop after the bar, in footnote size; on the terminal
  after the bar line): the description, wrapping, then `Brief`, `Last actions`, `Files changed`
  and `Answer`, each a dim heading over one `Text` per line. A part with nothing is left out.
- **Its size:** the button adds three nodes a row. The fullest list with a Peek at its longest
  (`tests/size.test.ts`): 1,845 nodes, 8 deep and at most 225,793 characters in any set at
  0.12.0, against 1,613 and 218,861 before; the worst list above has the numbers today.

The collapsed view (0.12.0), in `hooks/view/collapsed.tsx`, chosen by `panel`:
- **When:** in the `widget` seat (`e.props.placement`, read by `drawPane`; any other value is
  the full pane, as the declarations say) always; otherwise while `prefs.collapsed` is set and
  the gallery is closed. The gallery the person asks for draws over a collapsed pane in the
  dock or inline; the widget draws only the glance.
- **The header's button:** the session line is a row `Box` with a dim `Button` keyed
  `collapse` at its end, drawn only while the list is: over the gallery a collapse would show
  nothing until the gallery closed. Its press,
  and the collapsed view's own `expand`, write `prefs.collapsed` through `writeStore`, then
  invalidate the drawing (`collapse` in `hooks/register.tsx`).
- **The counts** (`countsOf`): the rows in Running's states (starting, working, quiet, waiting) and in
  Needs you's, every row drawn or not. An agent that needs the person counts there alone, as
  the headings count: the owner left the choice to the session.
- **`desktopCollapsed`:** the Lead carrying `min(running, T-14)` joeys (`leadWith`, *Sprites and
  sets*), alt "Lead, carrying 3 joeys", or the Lead's mark where the surface draws no `Svg`;
  beside it the numeral in bold and `running` dim, `1 needs you` in `permission` while any
  agent needs the person, and a dim `Button` keyed `expand`. The numeral is always drawn, so
  the count is in words (I-06).
- **`terminalCollapsed`:** one line: the Lead's `●` in `claude`, the numeral, `running`, then
  `· 1 needs you` and `[ expand ]`.
- **In the `widget` seat** neither draws `expand`: a click may not reach it there. The kit
  mounts the seat on both surfaces, and both draw the glance.
- **Its size** is the Lead's sprite and a few nodes; it draws no row's sprite.

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
  ran longer than T-10 (60 s) ends, a waiting run at its real end. `prefs.toasts` says which:
  `all`, `needs` (Needs you only) or `off`. A failed run's toast names its reason: an error, a
  refusal or an empty answer (Decision log, 2026-11-25).
- **The tab title:** while a run needs the person, the pane's title counts them
  (`Possum Squad · 1 needs you`), retitled only while the pane is open, never opening a closed
  one (Decision log, 2026-11-25). The collapsed view counts as the list out of view, as the
  gallery does (0.12.0, the plan's choice with the owner's approval).
- **Auto-open** (`prefs.autoOpen`): `first` opens the pane when a session's first agent starts;
  `always` on every new agent; `never` leaves it to `/possums`. A pane the person closed stays
  closed for the rest of the session (`view`).

**Built** (auto-open 0.10.0; Needs you, quiet and toasts 0.11.0). `autoOpen` in `hooks/register.tsx`, started unawaited by a new
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
  (*Context*). The open marks the pane open and arms the clock when a run is live, placed or
  left waiting undrawn (0.14.0): the beat finds an undrawn pane open and not shown, so it reads
  the list for a waiting run and redraws nothing, and a drawing arms no clock.

A clear forgets the person's close: the engine resets `view` with the rest of `$.state`, and
the list starts over.

Every fault ends it quietly; the spawn has already returned.

Needs you and quiet (0.11.0) are *The run model*'s: `asked` from `classic.PermissionRequest`
(*The hooks*), ended by `stepped` or `turnEnded`, and `quietMs` where a row is drawn.
- **The asking step's record comes after the request:** the engine checks a call while the
  step that asked it still streams (*Context*), so only a step begun after the request moves
  the call on. A subagent's step reads the time before its stream (`began`), the run keeps the
  latest request's (`ask`), and `stepped` ends Needs you at a step with `began` at or after it,
  or with `began` unknown; a request with no time waits out one record first.
- **Needs you begins only where nobody else answered:** the request's `next(e)` comes back
  while the person's prompt waits, empty (*Context*); one carrying a `decision` was settled by
  a hook and showed no prompt, so it moves nothing.
- **It ends at that later step's record,** after its stream: the row comes back once the call is
  done and the model's next reply is in. Ending at the step's start would need a write before
  each asking agent's stream.
- **The kit raises the request from a subagent's asked call** with its `agent_id`
  (`$.tool.call` with `agentId`, a `tool.check` answering `ask`); with nobody to answer it, the
  kit refuses the call.

Toasts (0.11.0; the setting and the reason 0.17.0), `toastUnseen` in `hooks/register.tsx`,
started unawaited (N-07) by the hook that decided one, its every fault caught inside:
- it reads `prefs` first (`prefsOrDefaults`, a refused read giving the defaults): at `off` it
  shows nothing, and at `needs` only the request's toast, which its caller marks; a value it
  does not know reads `all`;
- it then asks `$.ui.panes()`, and calls `$.ui.toast(text)` unless `possum-squad` is there and
  `isShown` with the list in it: a pane closed, behind another's tab or waiting undrawn is out
  of view (the owner's reading of "closed", Decision log), and so is the list while the gallery
  takes its place (`view.isGalleryOpen`, a refused read counting as none) or the collapsed view
  does (`prefs.collapsed`, from the same read, a refused read counting as not collapsed,
  0.12.0). The `widget` seat is known only to a drawing, so a minimized pane toasts
  as `isShown` says;
- the texts are `hooks/view/toasts.ts`'s, each from `runs` before and after the record:
  `askedToast` when a request moved a run into needing the person, `<description> · needs
  you: waiting on a permission prompt`, or `An agent` for an entry no row has claimed;
  `endedToast` when a run that was live ended a turn longer than T-10 (`TOAST_AFTER_MS`,
  60 s), timed from `turnAt`, so a teammate's or a resumed agent's turn is timed alone:
  `· finished after 2:14`, `· failed after 2:14` or `· stopped after 1:05`. A failed run's
  names its kept reason (`STRINGS.toasts.failures`): `· failed after 2:14: an error`, `: a
  refusal` or `: an empty answer`, and none when its turn's reason was one the mod does not know. Since 0.14.0 a
  run ends where the engine's list says so, so `endedToasts` gives one for each run that a
  record of the list's read, or the beat's bound, ended, in spawn order; a waiting run's is
  timed to the read that ended it, its wait included;
- the description is cut as the row's (`shortened`, 100 characters), I-04's toast line;
- a later request while the run waits keeps it waiting, so it toasts nothing; the toast's own
  timeout is the engine's default. No toast arms a timer (N-03).

The tab title (0.17.0), `retitle` in `hooks/register.tsx`:
- **When:** after every write of `runs` (`record` and `recordAt` through `listAfter`, the beat's
  `settleHeld`, the list's `readList`), `titleAfter` compares `needingYou` with the count a
  retitle was last started for (`wanted`, module memory, unknown after a load, a fault, or a
  stale title the retitle could not mend), and starts `void retitle` on a change. `listed` and `heldOut` can end a row asked while its end
  was held, so their writes count too.
- **What:** it reads `$.ui.panes()` and leaves alone a pane that is not listed. It reads `runs`
  and stops when the pane's title is `STRINGS.paneTitle`'s (`Possum Squad`, or `Possum Squad · 2
  needs you`). A pane not placed (an open of an undrawn one may place it), or one a close was
  heard for, it leaves stale with `wanted` unknown, so the next write of `runs` tries again;
  once the engine places it, or the refused close passes, that write mends it. Otherwise it
  opens `{ id, title, columns }` with no `focus`, up to three times while the count moves during
  its own open, and never sends one title twice: another plugin's `ui.open` hook may rewrite it.
- **The race with a close:** the `ui.close` hook counts each close at its start and, unless
  refused, after its `next` (`closesHeard`); `showPane` and `autoOpen` count their opens
  (`opensMade`). A retitle that hears a close before its open does not open; one that hears a
  close while its open is under way closes the pane again, unless the person or auto-open
  opened it since. What is left is the engine's own ordering (*Known debt*).
- **Opens:** `/possums`, `open`, `roles` and auto-open open with the counted title, then start a
  retitle for a count that moved meanwhile.
- Measured first (CLI 2.1.330, a probe plugin in the scratchpad, two panes in a terminal): an
  unasked open of an open id behind another's tab kept it behind and unfocused, drew nothing,
  and showed the new title on its tab; of a shown one, it stayed shown and unfocused, drawn
  once; `columns` stayed as sent; `$.ui.panes()` gave the new title at once.
- Seen in the terminal (CLI 2.1.330, the probe's pane in front): while a subagent's Bash call
  waited on its prompt, the tab read "Possum Squad · 1 needs yo…", cut by the tab's width; after
  the prompt was refused it read "Possum Squad"; the probe's pane stayed in front throughout.

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
  closes the pane; the flag comes first, so the pane's first drawing is the gallery. A gallery
  already open keeps its part. A refused
  write answers the plain line a refused open does, and opens nothing; a refused open clears
  the flag again, so a later `/possums` opens on the list.
- **An open or a raise** marks the pane open and arms the clock when a run is live (*The
  panel*).
- **`settings`** reads `prefs` and answers a heading, so the engine's `possum-squad:` prefix
  stands apart from the list. Then one line per setting, `theme: classic (classic, steampunk,
  horror, prehistoric)`, `toasts: all (all, needs, off)` last (0.17.0), then how to change one.
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

**Built** (0.8.0; the toast 0.11.0; unchanged by 0.13.0's limits, estimate and nesting, which read events and price from a table in the code; the agent list 0.14.0, read for summaries too 0.15.0, no new call; the store's delete 0.17.0). `validate` lists `$.agent.list`, `$.clock.every`, `$.clock.now`, `$.command.register`,
`$.state.get`, `$.state.set`, `$.store.delete`, `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.invalidate`,
`$.ui.open`, `$.ui.panes`, `$.ui.resolve`, `$.ui.toast`; the sprites, being pure, added none. The state calls come through `update` and `read`;
the agent list through `readList`, from records and the beat; the clock through `armClock`, `recordAt`, `settleHeld`, `settleHelpers`, `drawPane` and `timeOrNone`; the store calls through `writeStore` (its one deletion, `detect`'s),
`listSettings` and `prefsOrDefaults`; the pane calls through `showPane`, `autoOpen`, `retitle`, `tick` and `redraw`; the toast through `toastUnseen`.
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
| `tests` | `verify` | The hooks against the engine's kit, with the clock and `$` stood in; the pure modules: the run model on fixture event sequences, the role corpus, the compositor on a fictional art, every sprite's size, outline and frames as its SMIL plays, in every set; the sets' switching and fallback; the gallery; every gallery part and the fullest list against the desktop's bound, by a port of its count (`tests/size.ts`) | What the app actually draws; whether SMIL runs; real timing and order of events; whether the app still counts as ported |
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
- **A timer the engine ends comes back only at a later subagent event,** the next main turn's
  start, or `/possums open`: a drawing notices it (2.5 s without a beat), and the next spawn,
  turn start or step arms another. In between, times move only on events, and a main turn's
  time not at all until its end.
- **A drawing whose read of `runs` is refused leaves the clock alone, untested:** in the kit,
  the clock beat on after such a drawing with the old code too, for a reason not found.
- **A reload of the mod during a main turn loses that turn's running time:** its start lived in
  module memory, so the session line stands until the turn's end counts it.
- **A main turn that spans a clear counts whole at its end:** the clear drops its running time,
  but its end adds the engine's length and tokens, as it did before the time moved. A clear is
  queued between turns in practice.
- **At a main turn's end, a drawing already in flight may count the turn twice, or leave it out,
  for one frame:** the counted turn is in `lead` and the running start in module memory, read
  at different moments; the write's own redraw follows at the redraw rate.
- **A waiting run's end, with the pane closed, shows at the next subagent event or the pane's
  next open:** no beat runs then (N-03), and the main session's events read no list. Its time
  and its toast run to that read, so they are long by the gap.
- **A foreground subagent's end is unmeasured:** at 2.1.330 the engine ran every Agent call in
  the background, even one asked for in the foreground (Session 12a's review), and each read at
  a turn's end listed the agent ended. Were a foreground agent listed `running` then, its end
  would wait, with the pane closed, for another subagent's event or the pane's open.
- **A waiting run's end is timed at the read that saw it,** up to a beat late with the pane
  open.
- **A turn's end the list never answers is held, drawn as it was,** until a beat finds it past
  `LIST_ANSWER_MS`: with the pane closed, until it opens. Every read measured answered at once
  (CLI 2.1.330).
- **A teammate's or resumed agent's time counts from its first start,** its rests included, in
  its row and in the header's work time.
- **A remote workflow agent's row** (internal builds only) has no local loop; its spawn names
  no agent here, so it gets no row.
- **A pending entry dropped at the cap of 50** loses its calls' evidence: the row that later
  claims that agent reads its role from its later calls alone.
- **With the pane closed and an agent silent past T-04,** Helper waits for its next step, its
  end or the first beat after the pane opens; the role is the same, only when it shows differs.
- **The sprites are unseen in the desktop app** until 0.7.0 or later is installed and looked at
  (`docs/BACKLOG.md`); a gallery part's 18 framed sprites, the one-offs' `fill="freeze"` and
  `begin`, and `planned`'s group `opacity` too; `<path>` and a discrete `opacity` animation are drawn there by another
  mod of this repository, not yet by this one.
- **`data.ts` is about 87k characters,** loaded on every start; the kit loads it, and whether
  the engine caps a module's size is not in the declarations.
- **The tongue's place is the classic base's:** the nose's row (21) and columns (15, 16) are
  constants in `recipes.ts`, so a base drawn anew must move them too.
- **The joeys' spots are the 7-by-6 joey's:** `JOEY_SPOTS` in `recipes.ts`, so a joey or a Lead
  drawn anew must move them too, in code.
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
- **While the gallery is open, each event's redraw sends its part's sources again,** at most
  about 187k characters; the beat leaves it undrawn.
- **After the last live run, the clock may beat up to T-04 more** for a run whose role may still
  fall back (a teammate's, or one waiting on background work), redrawing a pane whose times no
  longer move.
- **The desktop's bound is read from its code, not seen at its edge:** the gallery's parts and
  the fullest list stay under it by the kit's port of its count, a part at 71% of its
  characters and the fullest list, with a Peek open, at 92% of its nodes and 89% of its
  characters, and a later
  app may count otherwise. A tree past it would freeze the pane, as the 0.9.0 gallery did, with
  nothing for the mod to hear. The owner's look at 0.10.1 saw every part draw.
- **A pane past the budget writes each moving row's still look** besides its own: about 1 to
  3.5 ms each, once a session.
- **A moment that does not fit is not played,** and one whose room frees later starts late,
  cut as a late first drawing is. Only a long list near the budget meets it.
- **Rows past 60 are not drawn,** so a session with that many agents shows only their count.
  The node bound would allow about 70.
- **The picker and auto-open are unseen on the desktop:** the role's native `Button` in the
  second line's footnote type, the `Select` under the row, and an unasked open there. A
  session cannot look for the owner: computer use refuses Claude's own window (`docs/BACKLOG.md`).
- **The kit's `$` cannot close a pane as the person:** it has no `ui.close`. So the person's
  close and auto-open after it run the mod's own hooks over a stand-in `$`
  (`tests/auto-open.test.ts`), as the close's own tests do in `tests/panel.test.ts`.
- **Auto-open is not awaited,** so whether its open lands before or after the spawn's result is
  the engine's affair; in the kit it lands before the spawn's call returns.
- **`detect` reads only a run's kept calls:** its last five, a shell call by its first line cut
  at 80 characters. A run that was a Scout by six reads, or a Tester by a test runner past that
  line, comes back as Helper, or plain while young and live.
- **Another plugin's `ui.select` hook can turn a pick into `detect`,** which then deletes a
  custom type's remembered pick; the check that a pick is a role does not stop it.
- **Needs you lasts through the reply after its call:** the step that ends it is recorded at
  its end, so the row comes back a reply's time after the call is done, and a long allowed call
  keeps it for the whole call.
- **A call in flight is counted until the next step's record,** so a run is not quiet during
  the reply after a call either: quiet shows mostly for a spawn with no event, or a first
  request that hangs.
- **Quiet is seen in the kit only:** no hand check can hold an agent silent for 90 s with no
  call in flight (`docs/BACKLOG.md`).
- **A toast reads the panes after its event,** unawaited, so a pane opened or closed in between
  decides it.
- **A request whose time could not be read holds Needs you through one step record more:** it
  takes that record for the asking step's, so if the asking step was recorded first, the row
  comes back one step late.
- **A retitle can still reopen a pane the person closes in its last moments:** the mod hears a
  close at its hook's start and after its `next`, and checks before and after its own open; a
  close whose engine-side handling falls wholly between the open's start and its answer, with
  neither of the mod's two counts heard in time, would leave the pane open. It takes a
  deliberate close within milliseconds of a change in the Needs you count.
- **A refused close still counts once:** the `ui.close` hook counts a close at its start,
  before it knows another hook refused it, so a retitle under way then may close the pane
  itself; another plugin that refuses closes would refuse that one too.
- **The tab title is unseen in the desktop app;** the terminal showed it (`docs/BACKLOG.md`).
  A docked terminal tab cuts it ("Possum Squad · 1 needs yo…" beside one other tab).
- **A stale title in a pane waiting undrawn is tried at every write of `runs`:** one panes read
  and one state read each, unawaited, until the pane is placed or the count comes back to its
  title; only on a terminal narrower than an unasked pane needs.
- **A title another plugin's `ui.open` hook rewrites stays rewritten:** the mod sends its title
  once per change of the count, and leaves the result to that hook.
- **A minimized pane toasts by `isShown` alone:** `$.ui.panes()` does not say a pane's seat, and
  only a drawing sees `placement`, so whether a `widget` counts as shown is the app's.
- **The collapsed view is redrawn by the clock's beat** while a run is live or a main turn runs,
  so through most of a session, though nothing in it moves with time; it is a few nodes and its
  sprite string is cached.
- **`peek` keeping its room on the desktop is unseen** until the owner's look after a push:
  the kit lays the row out its own way, and drew the button the desktop pushed out at 0.13.0.
  The fix is `minWidth` 0 on the shrinking Boxes, which assumes the desktop lays them out as
  CSS flex (`docs/BACKLOG.md`).
- **The summaries are the CLI's, measured once:** whether the desktop app's engine fills
  `AgentInfo.label` the same way, and how often a longer agent's summary changes, are not
  measured. The one probed agent's first came 31.5 s into its work.
- **The beat reads the list once a second while a live run shows,** in the collapsed view too,
  where no row is drawn: the beat reads no store, so it does not know the pane is collapsed. A
  read took 1.9 ms on average with one agent listed (CLI 2.1.330).
- **A summary is up to a beat late,** and while the pane is closed it is not read at all: the
  row shows the last one read, or the last call, until the pane's first beat.
- **A changed summary redraws the pane twice in its beat:** the beat invalidates it, and the
  unawaited read's write redraws it again.
- **A cut path's folder reads from its far end:** the line keeps the path's last 80
  characters, so on a docked terminal row the file's own folder is what the line's end cuts
  (at Session 12b's hand check, a folder near the path's start followed "Read tools.ts in …/").
  Peek's actions wrap whole.
- **A path's folder is told from its file by its last `/` or `\`,** so a path that is not one
  (a tool given markup or a URL as its path) splits where its last slash falls; it still draws
  as plain `Text`.
- **Peek's records add to every write of `runs`:** a run keeps at most about 2.5k characters
  more (a brief and an answer of 600, five actions and ten files of 80), and every step
  rewrites the whole value.
- **The estimate is list prices from a dated table:** it does not see fast mode, the US-only
  surcharge, web search or classifier fees, or a gateway's own rates; it goes stale when prices
  change; and a model the table lacks, a retired one or one released after the table, costs
  Opus 5.5's prices.
- **A main turn is priced at the model that answered last,** its tokens summed over its
  requests, so never at Haiku 5.5's long-prompt rates.
- **A helper drawn in another section than its parent's shows no link to it:** only the
  parent's tokens and estimate count it.
- **The session line wraps at 46 columns** in the terminal's dock with two limits and the
  estimate on, since it is one `Text` beside the `collapse` button.

## Baseline (v0.17.0)

| Check | Expected |
|---|---|
| `npm run verify -- possum-squad` | green: the 6 repo stages, then `validate`, `types`, `tests` and `imports` for possum-squad, `types` and `tests` taking `tools/` |
| `claude plugin test mods/possum-squad` | 361 pass, in 27 files: activity 8, attention 20, auto-open 11, clock 23, collapsed 14, command 12, compose 8, estimate 6, gallery 11, header 10, model 65, nesting 6, pane-sprites 9, panel 10, pass-through 10, peek 12, picker 18, prefs 5, roles 9, row 9, runs 19, sets 6, settle 12, size 8, sprites 15, title 14, waiting 11; about 19 s |
| `node scripts/tools.ts specs mods/possum-squad` | 10 pass, in 2 files: art 6, png 4 |
| `validate`: hooks / gating / state keys | 11 / 4 (each with a `.catch`) / 3 (`lead`, `runs`, `view`) |
| `validate`: calls | `$.agent.list`, `$.clock.every`, `$.clock.now`, `$.command.register`, `$.state.get`, `$.state.set`, `$.store.delete`, `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.invalidate`, `$.ui.open`, `$.ui.panes`, `$.ui.resolve`, `$.ui.toast` |
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
- 2026-11-23, *Context* and *The panel*: the desktop's bound is taken from the app's own render
  code (2,000 nodes, 32 levels, 262,144 characters by its count), with no probe build pushed to
  measure it. The owner's choice at Session 9a's plan.
- 2026-11-23, *The panel*: the gallery is drawn three roles at a time, six parts, with
  `previous` and `next`. The owner's choice at Session 9a's plan.
- 2026-11-23, *The panel*: the pane draws a bounded number of rows and counts the rest under
  their section. The owner chose the cap at Session 9a's plan, at 80. It became 60 when the kit
  showed a row is about 27 nodes, not 20 (its bar is drawn as boxes), and 80 rows passed 2,000.
- 2026-11-23, *Attention*: a toast shows whenever the pane is out of view, not only closed:
  absent from `$.ui.panes()`, or there and not shown (behind another's tab, or waiting
  undrawn). The owner's choice at Session 10's plan.
- 2026-11-23, *The invariants* (I-04) and *Attention*: a toast names its run by its
  description, cut to 100 characters as on its row; I-04 allows agent text in the engine's
  plain toast line. The owner's choice at Session 10's plan.
- 2026-11-25, *The panel*: Peek opens from a dim `peek` button at the end of a row's third
  line, reading `hide` while open: a `Button` is the only element a press reaches and holds
  only text, so the row itself cannot be pressed. The owner's choice at Session 11's plan, over
  drawing the task's line as the app's button.
- 2026-11-25, *The run model*: Peek's files are the files a run wrote or edited, the latest
  ten; reads show among its last actions. The owner's choice at Session 11's plan.
- 2026-11-25, *The panel*: the collapsed view's joeys and numeral count the Running section; an
  agent that needs the person is said apart, as the headings count. Left to the session by the
  owner at Session 11's plan.
- 2026-11-25, *Sprites and sets*: the joey is redrawn, and kept after the owner's
  look at the Lead carrying one to three in every set on both themes. The owner's choices at
  Session 11's start.
- 2026-11-25, *The run model*: the estimate prices each request's tokens at its model's list
  prices from the dated table (T-12), not from the engine's own ledger (`session.measure`'s
  `cost`). The owner's choice at Session 12's plan: the header stays the Lead and every row,
  and moves with each step rather than only after a main turn.
- 2026-11-25, *The run model* and *The panel*: a helper is drawn under its parent only while
  both sit in one section, and otherwise as any row in its own state's section, so Needs you
  still shows it and the headings count as before. The owner's choice at Session 12's plan.
- 2026-11-25, *The run model*: a helper's tokens and estimate roll up into its parent's, at
  every level; its time and context stay its own, since a helper's minutes pass inside its
  parent's. The owner's choice at Session 12's plan.
- 2026-11-25, *The panel*: the session line shows every plan-limit window the engine reports,
  in its order, not only the most used. The owner's choice at Session 12's plan.
- 2026-11-25, *The run model*, *Sprites and sets* and *The panel*: a turn's end while the engine
  lists the agent as `waiting` leaves the run `waiting`, in Running, in quiet's pose, its time
  counting and its ending's toast at its real end. The owner's choice at Session 13's plan,
  from that plan's review: such a run read finished (seen at Sessions 5, 8 and 12). It amends
  the round's decision 13.
- 2026-11-25, *The panel*: the activity keeps a path's end, shows the engine's progress summary
  where it has one, and reads an ended row's last call as past; the `peek` button keeps its
  room. The owner's choice at Session 13's plan, the last two from their desktop look at 0.13.0,
  where a long activity pushed `peek` out of the pane.
- 2026-11-25, *The hooks* and *The panel*: the main loop's `turn.start` reads the clock's time
  to keep the turn's start, and the clock beats during a main turn while the pane is open, so
  the session line's time moves through it. The owner's choice at Session 13's plan; it
  revises the line of 2026-11-20 by which the main loop's turn start made no `$` call.
- 2026-11-25, *Attention* and *Values*: a failed run's toast names its reason; `prefs.toasts`
  (`all`, `needs`, `off`; `all`) says which toasts show; the pane's tab title counts the runs
  that need the person while the pane is open. The owner's choice at Session 13's plan.
- 2026-11-25, *Roles* and *Values*: the picker's first entry, `detect`, puts a run back on the
  rules and, for a custom type, deletes its `role:<agent type>`. The owner's choice at
  Session 13's plan, over a `/possums forget` command.
- 2026-11-25, *The run model* and *The hooks*: a subagent's turn end is held, its row as it was
  with the turn's ending kept, no toast, no ending's moment and no Helper, until the engine's
  list answers: `waiting` makes it wait; an end, `idle` or no entry ends it as kept; `running`
  reads again; a list that cannot be read ends it at once; a held end the list never answers is
  ended by the clock's beat 5 s after the turn's end, or at the pane's next open. The owner's
  choice at Session 12a's plan.
- 2026-11-25, *The hooks* and *Attention*: with the pane closed, any subagent's event reads the
  list while a turn's end is held or a run waits, and so does the pane's next open, through its
  first beat; a waiting run's toast comes then. The owner's choice at Session 12a's plan,
  confirming the proposal of Session 13's.
- 2026-11-25, *The panel*: a waiting row's mark and word are `inactive`, as a starting one's.
  The owner's choice at Session 12a's plan.
- 2026-11-25, *The panel*: a file's path on the activity line, and in Peek's last actions, names
  the file first, then its folder: "Reading package.json in …/mods/possum-squad". The owner's
  choice at Session 12b's plan, over the path's end in order: the desktop always cuts a line's
  end, and a docked terminal row leaves about 35 columns, so a path's last 80 characters alone
  still hid the name. It amends the line above by which the activity keeps a path's end.
- 2026-11-25, *The panel* and *The run model*: the engine's progress summary takes the last
  call's place on a starting, working or waiting row; a row that needs the person keeps its
  call, a quiet one its quiet time, an ended one its last call. It is kept cut at 100
  characters, and Peek does not show it. The owner's choice at Session 12b's plan.
- 2026-11-25, *The panel*: a finished, failed or stopped row reads its last call in the past,
  and "No tool calls" with none; a waiting row keeps the live verb, and Peek's last actions keep
  theirs. The owner's choice at Session 12b's plan.
- 2026-11-25, *The panel* and *Sprites and sets*: the gallery does not draw `waiting`, which is
  quiet's pose. The owner's choice at Session 12a's plan.
- 2026-11-26, *The hooks* and *Values*: the running main turn's start is kept in module memory,
  not in `lead`: a turn costs no write, and a reload mid-turn loses only that turn's running
  time. The owner's choice at Session 12c's plan, as Session 13's plan proposed.
- 2026-11-26, *The run model*: a main turn's end counts the engine's `durationMs`, or the clock's
  span since the turn's start when that is longer, so the session line never steps back. The
  owner's choice at Session 12c's plan.
- 2026-11-26, *The hooks*: the main loop's turn start also arms the clock while the pane is
  open (one synchronous `$.clock.every`, a no-op while armed), so a pane open with no run live
  starts beating. Confirmed by the owner at Session 12c's plan; it revises the line of
  2026-11-25 by which that hook only read the clock's time.
- 2026-11-26, *Attention*: the tab title stays, guarded: a retitle opens only a listed, placed
  pane, skips its open when a close was heard after its read, and closes the pane again when a
  close was heard during its open, unless the person or auto-open opened it since. What the
  mod cannot hear is known debt. The owner's choice at Session 12d's plan, over dropping the
  title, after the declarations showed an open of a closed id opens it.
- 2026-11-26, *Roles*: `detect` runs the rules on the run's type and description, then its kept
  last calls (Peek's five, the only calls a run keeps); with none, an ended run or one past
  T-04 is Helper at once, and a young live one plain until its calls or T-04; one hop when the
  role changes. The owner's choice at Session 12d's plan.

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

**Built** (0.3.0). The panel shell. `hooks/register.tsx`, named by `hooks/hooks.json`, does
the following:
- registers `/possums` with its words `open`, `set` and `settings`;
- toggles and draws the pane, which shows the empty panel;
- keeps the settings in the store under `prefs`;
- records a close by the person in `view`;
- hooks the events later versions read, passing each on unchanged.

Of the pure modules:
- `hooks/view/` holds the empty panel and the row builders for both surfaces, which nothing
  draws until Session 4;
- `hooks/settings.ts` holds the settings and the command's words;
- these sit beside `hooks/strings.ts` and `hooks/config.ts`.

`model/`, `roles/`, `sprites/`, `data/`, `art/` and `tools/` are not yet built.

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

## Stack and pins

**Decided.** TypeScript, typed against the declarations the engine lays in
`.claude-plugin/types/` for the CLI's build (`npm run types`, from the repository's root), never
committed. Tests run under `claude plugin test`, against the engine's kit (`claude-code/testing`),
not Node. The sprite converter in `tools/` is TypeScript run by the repository's Node, with no
dependency (PNG read with `node:zlib`); how the gate checks it is set by the repo-level round
that teaches it `tools/`. The tooling's own pins are the repository's.

**Built.** Declarations read at intake: CLI 2.1.325, then 2.1.326 (it updated itself during
`npm run types`). 0.1.0 to 0.3.0 were built and checked on CLI 2.1.326. The desktop app ran
engine 2.1.325 for the 0.2.0 run.

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

**Built** (0.3.0). In place:
- the manifest, `.claude-plugin/plugin.json`, naming `types/index.d.ts`;
- the hooks: `hooks/hooks.json`, `hooks/register.tsx`, `hooks/config.ts` (T-13 only) and
  `hooks/strings.ts`;
- `hooks/settings.ts`, pure: the settings with their values and defaults, reading and merging
  `prefs`, the command's words, and the settings list's text. It is not in the Decided layout:
  the settings are neither runs, roles, sprites nor views, and the command and the pane both
  need them. It uses only `strings.ts`;
- `hooks/view/`: `empty.tsx` (the empty panel), `row.tsx` (the row, one builder per surface)
  and `format.ts` (tokens, time, percent and the block bar);
- the contract, `types/index.d.ts`: `View`, and `StateId`, the state ids a row and (from
  Session 4) a run carry;
- the tests, in `tests/`:
  - `tests/engine.ts`: the engine's stand-in, the store's stand-in, the shared test values, and
    `hooksOf`, which hands a test the module's hooks from one registration;
  - `tests/fixtures/events.ts` and `tests/fixtures/rows.ts`.

How it is held:
- *Enforced by* the gate's `imports` stage (the import scan) and `validate`
  (`claude plugin validate`) for the first boundary. The scan accepts a type import from
  `types/index.d.ts`.
- The one-file rule is enforced by review: no test reads source files, and `validate`
  already lists every `$` call the module makes, with the helper it goes through. The view and
  the tables import only types from `claude-code`.
- `emptyPanel` serves both surfaces with `Box` and `Text`. The row has a builder per surface:
  `terminalRow` takes `Box` and `Text`, `desktopRow` also `Progress`.
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
   store: its payload type holds only setting values and panel flags (role ids and agent type
   names join it at Session 9). And by `tests/prefs.test.ts`: after fixture agent events and a
   change of every setting, every write holds only those fields, and no fixture brief,
   description, answer or path.
7. **I-04: agent-supplied text is drawn only as plain `Text`,** never inside an `Svg`, never as
   `Markdown`. *Why:* it may carry markup or links. *Enforced by* `tests/row.test.ts`, on both
   surfaces. Every fixture row's description and activity is drawn whole, in a `Text` of its
   own; no other element's props hold agent text; and a description with markdown, a link and a
   tag draws as that plain text, with no `Markdown`, `Link` or `Svg`. Sprites are built from the
   mod's own data only.
8. **I-05: a fault in the mod never blocks or alters a turn.** *Why:* the mod runs in every
   session the owner starts. *Enforced by* every event hook returning what `next` gave; a
   `.catch` passing the event on, on every hook but the command's and the pane's drawing; and
   a test raising each hooked event with a shape the mod does not know. The guard that runs a
   hook's reading apart from its result returns with Session 4's readers.
9. **I-06: a state is never shown by colour or sprite alone;** each row carries its state word.
   *Why:* accessibility, and the terminal has no sprites. *Enforced by* not yet: Session 4.
10. **I-07: a run's outfit never changes once its role is settled,** except by the person's own
    reassignment. *Why:* a changing outfit misleads. *Enforced by* not yet: Session 8.
11. **I-08: no art or code from another mod, and no likeness of another party's mascot or of a
    film, game or cartoon character.** *Why:* the mod and its art are published under MIT.
    *Enforced by* review; every sprite originates from `art/`.
12. **N-01: zero tokens added to any request.** *Why:* watching is free. *Enforced by* a test
    that session start registers `/possums` and no tool, and `validate`'s calls line, which
    holds no `$.tool.register`. `/possums`'s answers in words carry `isTextDisplayOnly`, which a
    test checks. The declarations say it is read on the queued lanes; whether a `/possums`
    typed between turns is on one is not checked (`docs/BACKLOG.md`), and mid-turn the engine
    keeps such an answer in requests all the same.
13. **N-07: the mod's own work per event stays under 5 ms, and it awaits nothing but `next`, state
    and store in event hooks.** *Why:* every event of every session passes through it. *Enforced
    by* review.
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
| `ui.close` | When `origin.kind` is `person`, records it in `view` | 1 |
| `agent.spawn` | Opens a row from the input; re-keys it from the result | 2, 4 |
| `turn.start` | Marks the loop's row working | 4 |
| `turn.step` (streaming) | Yields every chunk through untouched; from the input, the model and effort; from the result, the usage | 2, 4 |
| `turn.complete` | Ends the row (*The run model*) | 4 |
| A tool call's start and end: `tool.call`, or the classic `PreToolUse` and `PostToolUse` | The activity line, the last actions, files touched, tools in flight, the role's tool evidence | 4, 8, 10, 11 |
| `session.measure` | The Lead's context and the plan limits | 2, 5, 12 |
| `classic.SessionStart` | On `clear`, `resume` or `fork`, cancels the clock and redraws from the reset state | 4 |
| `classic.PermissionRequest` | Needs you begins for the run its `agent_id` names (*Attention*) | 2, 10 |

- `turn.step` is the costliest: it sits on every model request of the session. It is kept
  because it is the only source of per-request tokens, model and effort. Its body is
  `return yield* next(e)` around reads that cannot throw into the stream.
- **A tool call's source is Session 4's to settle, with the owner.** A `tool.call` or `tool.run`
  hook turns off a tool's move to the background and its live output (*Context*). So Session 4
  first measures whether the classic tool-use hooks avoid that, then brings the choice to the
  owner. Until then the mod hooks neither.
- Session 1 hooks every event marked 2 as a pass-through, so Session 2 only reads.
- The spike's hooks that no later session needs are gone: `tool.check`, and
  `tool.call` until Session 4 decides.

**Built** (0.3.0). Ten hooks, in `hooks/register.tsx`:
- `session.start` registers `/possums` with `immediate` and its argument hint, then returns
  `next(e)`.
- `command.run` `{ command: 'possums' }` and `ui.render` `{ component: 'Pane', requestId:
  'possum-squad' }`: *The panel*, *The command and settings*.
- `ui.close` `{ id: 'possum-squad' }` awaits `next(e)`; when `origin.kind` is `person` and the
  close was not refused, it sets `view.isClosedByPerson` through `update`, inside a guard, so a
  failed write loses only the flag. It returns what `next` gave.
- `agent.spawn`, `turn.start`, `turn.complete`, `session.measure` and
  `classic.PermissionRequest` are plain pass-throughs, `next(e)`, hooked for the sessions that
  read them. `turn.step` is `return yield* next(e)`, every chunk delegated untouched.
- Every hook but `command.run` and `ui.render` carries `.catch((_$, e, next) => next(e))`
  (`turn.step`'s a generator doing `return yield* next(e)`), gating or not, so the rule is one
  line to check. `validate` lists three as gating: `ui.close`, `agent.spawn` and
  `classic.PermissionRequest`. `command.run` reads no `next`, so it is not gating; its body
  catches its own faults (*The command and settings*).

## Values: `$.state` and `$.store`

**Decided.**
- **Entities and storage.**
  - `$.state` (live for a session; survives a reload of the mod; reset by the engine on clear,
    resume and fork), declared in `types/index.d.ts` under `PluginState['possum-squad']`:
    - `runs`: the session's runs, by run id (*The run model*). Written only through the `update`
      helper, never as a read and a later `set`, since several hooks write it at once.
    - `lead`: the main session's record: context tokens, window and percent; tokens; plan
      limits.
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

**Built** (0.1.0, `prefs` 0.3.0). `types/index.d.ts` declares `PluginState['possum-squad']` with `view` alone,
as `Shaped<View>`, and exports `View`; `plugin.json` names the file under `types`, and
`validate` holds the module's state keys to it.
- `view` is `{ isClosedByPerson: boolean }` (default false), the atom in `hooks/register.tsx`
  with the shape tag `view-1`. A reload of the mod's code that names another tag reads the
  value as absent, so the tag changes whenever `View`'s fields do. Peek's run and the gallery's
  flag join it in Sessions 11 and 7.
- Only the `ui.close` hook writes it, through `update`; nothing reads it yet (auto-open,
  Session 9).
- `runs` and `lead` are not yet used.

`prefs` (0.3.0), in `$.store`:
- **Its shape** is one flat object, as Decided. `hooks/settings.ts` holds each setting's values,
  in the order they are listed, and its default.
- **Reading** is `readPrefs`. A setting's value that is not one of its values reads as the
  default, a flag that is not `true` reads as false, and a stored value that is not an object
  reads as all defaults.
- **Writing** goes through `writeStore` alone (I-03). It reads `prefs` just before it writes,
  then sets the change over that value (`mergePrefs`), so a key or value this version does not
  know is kept. A stored value that is not an object is replaced: no version writes one.
- **Changes** come only from `/possums set` so far; the panel flags have no writer until their
  buttons (Sessions 5 and 11).
- **The pane doesn't redraw on a change yet:** nothing it draws reads `prefs`. The session that
  first draws from it also redraws on `set`, since the store is not reactive.

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
  and `answer` with empty text are Failed. A failed run keeps its last T-07 actions.
- **Numbers.** Fresh tokens (in and out) are counted apart from cache reads. A row's context
  percent is its last request's size over its model's window (`hooks/data/`, T-11, with a
  default for an unknown model). The header totals the Lead and every run. A run nested under
  its parent (F-24) is drawn under it, and its totals roll up into the parent's.
- **Lifetime.** Runs live in `runs` for the session only, and are never written anywhere else.
  Finished keeps the latest T-06 (30) runs.

**Built.** Not yet: Session 4 (rows, numbers, endings, reload and clear), Session 12 (nesting).

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
  7. *`helper`*, at T-04 (60 s) with no rule fired.
- **Settled once.** A run whose role is not settled at spawn draws plain in `starting`, and gets
  its outfit when a rule fires; after that only the person's reassignment changes it (I-07). A
  reassignment applies to that run at once, and is remembered only for a custom type.
- **One home for the word lists.** The rules are a port of the round's Python reference, with
  its behaviour unchanged; once ported, the word lists, their order and the matching rules
  (whole words, stems, phrases, case ignored) live only in `hooks/roles/`.
- **The corpus** of labelled descriptions is a `.ts` fixture: every `dev` item and at least 90%
  of the `holdout` items get their label. Labels are never changed; the table is never tuned on
  `holdout`; cases may be added to `dev`.

**Built.** Not yet: Session 8 (detection), Session 9 (the picker and memory).

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
  (two hops, then asleep with a rising "z"; still after 3 s), `failed` (on its back, tongue out;
  still), `stopped` (startled with "!" for 1 s, then idle; still).
- **SVG.** One rectangle per run of same-coloured pixels in a row. Animation is SMIL inside the
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

**Built.** Not yet: Session 6 (the converter, the compositor, the SVG writer, `classic`),
Session 7 (the other sets), Session 7a (every state's animation). The spike's hand-drawn test
sprite was removed in 0.3.0; what the desktop showed of it is in *Context*.

## The panel

**Decided.**
- **The pane.** Id `possum-squad`, title "Possum Squad", T-13 (46) columns asked. `/possums`
  toggles it; it opens by itself per *Attention*. It redraws when a state value it read changes,
  and once a second while a run is working, for elapsed time.
- **Sections,** in this order: the Lead, then Needs you, Running, Finished (collapsed by
  default), each with its count. A section other than Running with no row is not drawn.
- **The header:** the Lead row, then one line of the session's numbers: plan-limit percent,
  tokens, time, and, with `cost` at `estimate`, a dollar figure labelled "est.".
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
- **The clock.** The only timer is `$.clock.every(1000)`, armed while a run is working and the
  pane is shown, cancelled otherwise (N-03); a reload cancels it, so `session.start` re-arms it.
- **The empty panel:** the squad asleep and "No agents yet. They show up here when Claude starts
  one."
- **Words** are plain and short, with no exclamation marks and no jokes in error text.

**Built** (0.1.0; the row 0.3.0): the pane, the toggle and the empty panel.
- `/possums` opens `possum-squad` with `{ id, title: 'Possum Squad', columns: PANE_COLUMNS }`
  (T-13, 46, in `hooks/config.ts`). It sets no `placement`, so the surface seats it: docked in
  a fullscreen terminal from 110 columns, inline above the prompt otherwise.
- The pane draws `emptyPanel` from `hooks/view/empty.tsx`: a column `Box` holding one dim
  `Text` with the empty panel's line from `hooks/strings.ts`. It is the same on both surfaces;
  the squad asleep comes with the sprites (Session 6). The drawing reads and writes no state.
- An open from `/possums` is the person's, so the declarations place it at any width (144 and
  110 columns hold only for an open the plugin makes unasked).

The row (0.3.0), in `hooks/view/row.tsx`, drawn by nothing yet: the pane shows the empty
panel until Session 4 gives it runs.
- **Its input** is `RowData`, plain data:
  - always: `id`, `state` (a `StateId`), `description`, fresh `tokens` and `elapsedMs`;
  - when known: `role` (its name), `model`, `effort`, `activity` and `contextPercent`.
- **`terminalRow`** draws four lines:
  - a coloured `●`, the description and the state word;
  - then, indented, the role, model and effort that are known, joined by " · " and dim;
  - the activity, or "No tool calls yet";
  - a 10-cell block bar of context fill, then `ctx 9% · 18k · 0:42`. An unknown context draws
    an empty bar and `–`.
- **`desktopRow`** draws the sprite it is given in the leading slot; until Session 6 that slot
  holds the coloured mark. Beside it are the same lines, the second and third in footnote
  size. The fourth is the app's own `Progress`, labelled "Context", its value text the
  percent, tokens and time. The engine draws a `Progress` as its label and figure above a thin
  fill the width of the row (*Context*), so nothing goes beside it.
- **Lines cut to one:** the description, the details and the activity carry `wrap="end"`, so a
  long one ends in an ellipsis.
- **Colours** are theme keys, the same for the mark and the word: working `success`, needs-you
  `permission`, quiet `warning`, failed `error`, finished `subtle`, starting and stopped
  `inactive`.
- **Numbers** come from `hooks/view/format.ts`:
  - tokens: `640`, `9.5k`, `38k`, `1.2M`;
  - time: `0:42`, then `1:02:05` from an hour;
  - the percent, rounded;
  - a number that is missing or not finite reads `–`, and the desktop bar's fill is empty
    rather than the bar that only spins.
- **What the desktop row looks like has not been seen;** Session 4's hand check is the first.

The spike's test view and its redraw clock were removed in 0.3.0. The clock's tick, armed from
a finished `/possums` dispatch, ran in the desktop (*Context*), so Session 5's clock can be armed
the same way.

Not yet: Session 4 (rows from runs), Session 5 (sections, header, Lead, Finished, the clock,
the terminal complete), Session 7 (the gallery), Session 11 (Peek, the collapsed view, the
`widget` seat).

## Attention

**Decided.**
- **Needs you** (F-12): a run whose tool call waits on a permission prompt moves to Needs you
  until the prompt is answered.
  - **It begins** on `classic.PermissionRequest`, which fires only when a person is asked, for
    the run whose agent id its `agent_id` names. A request without `agent_id` is the main
    session's, which the person already sees; it moves no row.
  - **It ends** when that agent's asked call moves on, allowed or refused. The exact signal
    comes with Session 4's choice of a tool call's source (*The hooks*): `tool.run` marks an
    allowed call about to run but carries `tool.call`'s cost, and a refused call ends at once.
  - `tool.check` answering `ask` was the other candidate. It names the call, but it also fires
    where auto mode's classifier or a hook settles the ask with no prompt shown.
- **Gone quiet:** a run with no event for T-05 (90 s) and no tool call in flight shows as quiet.
- **Toasts,** only while the pane is closed: when a run needs the person, and when a run that
  ran longer than T-10 (60 s) ends.
- **Auto-open** (`prefs.autoOpen`): `first` opens the pane when a session's first agent starts;
  `always` on every new agent; `never` leaves it to `/possums`. A pane the person closed stays
  closed for the rest of the session (`view`).

**Built.** Not yet: Session 9 (auto-open), Session 10 (Needs you, quiet, toasts).

## The command and settings

**Decided.**
- `/possums` toggles the pane; `/possums open` opens it or brings it forward, never closes it;
  `/possums set <name> <value>` changes a setting and answers with its new value, or with the
  names or values allowed; `/possums settings` lists every setting and its value;
  `/possums roles` opens the gallery. It is registered with `immediate`, so it runs mid-turn.
- Settings are those of `prefs` (*Values*); a change applies at once and redraws the pane.

**Built** (0.1.0; the words 0.3.0). `/possums` is registered at `session.start` with
`immediate`, the description from `hooks/strings.ts`, and the argument hint
`[open | settings | set <name> <value>]`. Its `command.run` hook reads the words after it
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
- **`settings`** reads `prefs` and answers a heading, so the engine's `possum-squad:` prefix
  stands apart from the list. Then one line per setting, `theme: classic (classic, steampunk,
  horror, prehistoric)`, then how to change one.
- **`set <name> <value>`** matches the name and the value, ignoring case, and keeps their own
  spelling. A good pair is written through `writeStore` and answered "theme is now horror.".
  - No name answers "Name a setting: …"; a name it does not know answers the setting names,
    never repeating the word.
  - A value the setting does not take, or none, answers the setting's values.
  - Neither writes anything.
- **Any other words**, `roles` included until Session 7, answer the usage line.
- **Every answer in words** carries `isTextDisplayOnly` (N-01).
- **When something refuses:**
  - if `$.ui.panes`, the open or the close rejects (another plugin holds the id), it answers
    one plain line;
  - if the store refuses a read or a write, it answers another.
- It reads no `next`, so it is not gating and carries no `.catch`.

Not yet: Session 7 (`roles`).

## Reach

**Decided.** No network, no process, no file access, no model call, no tool registration. The
mods API calls allowed (I-02): `$.ui.resolve`, `$.ui.invalidate`, `$.ui.open`, `$.ui.close`,
`$.ui.panes`, `$.ui.toast`, `$.command.register`, `$.state` through its helpers, `$.store.get`,
`$.store.set`, `$.store.delete`, `$.clock.every`, `$.clock.now`, `$.session.usage`,
`$.agent.list`. A change to this list is the owner's. The converter in `tools/` reads `art/` and writes one file, by hand,
outside the engine; it is never part of the mod's running code.

**Built** (0.3.0). `validate` lists `$.command.register`, `$.state.get`, `$.state.set`,
`$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.open`, `$.ui.panes`, `$.ui.resolve`; the
state calls come through `update`, the store calls through `writeStore` and `listSettings`,
and the pane calls through `showPane`. Each is on the allow-list. No network, process or file
access, no model call, no tool registration.

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
| `tests` | `verify` | The hooks against the engine's kit, with the clock and `$` stood in; the pure modules: the run model on fixture event sequences, the role corpus, the compositor and SVG size, palette contrast | What the app actually draws; whether SMIL runs; real timing and order of events |
| `imports` | `verify` | Every import resolves inside the folder or to a declared module | Anything at run time |
| Hygiene | `verify`, with the drafted commit message; in full when the term list or the stage changes | Private terms in files, paths and messages; attribution in messages; secrets by their exact shapes; conflict markers | Images and binaries; a term joined inside one lowercase run; attribution in files; a home-directory path; a secret of any other shape |
| The converter | Not yet: the repo-level round that teaches the gate `tools/` | — | — |
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

**Built.** 0.1.0 and 0.2.0 were pushed on 2026-11-17, and the owner installed each. 0.3.0
waits for its push. The manifest declares no settings: 0.2.0's throwaway `userConfig` field
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

None yet.

## Baseline (v0.3.0)

| Check | Expected |
|---|---|
| `npm run verify -- possum-squad` | green: the 6 repo stages, then `validate`, `types`, `tests` and `imports` for possum-squad |
| `claude plugin test mods/possum-squad` | 34 pass, in 5 files: command 11, panel 8, pass-through 4, prefs 4, row 7 |
| `validate`: hooks / gating / state keys | 10 / 3 (each with a `.catch`) / 1 (`view`) |
| `validate`: calls | `$.command.register`, `$.state.get`, `$.state.set`, `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.open`, `$.ui.panes`, `$.ui.resolve` |
| `validate` warnings | none but the allowed "CLAUDE.md at the plugin root is not loaded as project context" |
| `tsc` and the import scan | clean |

Measured on CLI 2.1.326. A documentation or refactoring change should not move any of these; if
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

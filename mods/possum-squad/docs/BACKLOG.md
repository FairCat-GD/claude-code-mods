# Backlog

Work that has been named but belongs to no session. Each item needs its own intake before it runs
(a `docs/spec/FEATURE-*.md` with the request verbatim and the decisions resolved, then a block
in `docs/spec/SESSIONS.md`; see the root `docs/DEVELOPMENT-WORKFLOW.md`). When an item is picked
up, it moves out of this file.

## Deferred

- **Step reports.** A `step` tool an agent calls to report done and total, so its row shows a
  real progress bar; the nudge, one fixed sentence added to each brief asking agents to report;
  and a `plan` tool with which the main session lists tasks ahead, shown under Planned. Off by
  default, behind the setting `stepReports` (`off`, `tool`, `nudge`). Their names are reserved.
  Left out at the round 1 intake: they add tokens when on, and the panel works without them.
- **Submitting to Anthropic's plugin directory,** after 1.0.0 has a week of use. Left out at the
  round 1 intake.
- **A preview GIF for the README.** Left out at the round 1 intake.
- **A finish sound.** Left out at the round 1 intake.
- **The `modern` set,** drawn in full before the build and not chosen as the first set; its
  layers are outside the repository. Left out at the round 1 intake.

## Not yet checked by hand

Checks that need a person at the machine. Each has an automated check covering most of it;
these are the parts only a person can see.

- **`/possums` closing the pane, and `open`, `set` and `settings`, in the desktop app.** The
  desktop run (0.2.0) opened the pane with `/possums`; closing it there was not looked at, and
  0.3.0's words wait for its push and the owner's install.
- **Whether `/possums`'s answers stay out of requests.** They carry `isTextDisplayOnly`, which
  the declarations say is read "on the queued lanes"; whether an `immediate` command typed
  between turns is on one was not checked. To check: type `/possums settings` between turns,
  then ask Claude what the last command printed.
- **The rows in the desktop app.** `desktopRow` and the app's `Progress` were seen only in the
  kit's tree; the terminal's rows were seen in Session 4. To check, once 0.4.0 is installed:
  start three subagents in the desktop app and look at the pane.
- **Rows ending in the desktop app.** The endings rest on `turn.complete`, measured in the
  terminal (CLI 2.1.329); the desktop app (engine 2.1.326) could not load a probe, and its
  0.2.0 run listed no subagent `turn.complete`. To check, in the same run: every row ends
  finished, and an interrupted agent reads stopped. If a row stays working, the end signal
  returns to the owner.
- **Rows surviving a reload of the mod (F-23).** The kit cannot reload a module, and the hand
  check did not reload one. The declarations say `$.state` survives a hot reload. To check: in
  a `claude --plugin-dir mods/possum-squad` session with agents in the list, change and save a
  file of the mod (then undo it), and see the rows stay.
- **`/possums` bringing a hidden pane forward.** With another plugin's pane open and Possum
  Squad as the tab behind it, `/possums` reopens the pane with `focus`, which the declarations
  say raises it; the tests stand in for the engine, so whether the surfaces do is unchecked.

## Directions

- **Sets made by other people.** A set is already a folder of layers and one manifest entry; a
  documented format would let others add one.
- **Sprites in the terminal.** The terminal draws text rows; its `Raster` element could carry the
  same art.

## Decided against

- A Ukrainian translation: English only, at the round 1 intake.
- Naming or crediting another mod, in the docs, the README or the code: the owner's word at the
  round 1 intake.
- Roles picked by a model call: a wrong outfit costs nothing, a model call costs the owner's plan.
- A history log across sessions: briefs and answers are the owner's work, and nothing reads it.
- A button that stops one agent: a misclick destroys work.
- A band above the prompt: the collapsed view does its job inside the pane.
- Rare or seasonal variants: charm that carries no information.

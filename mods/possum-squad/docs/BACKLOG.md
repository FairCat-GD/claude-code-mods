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

- **An agent waiting on its own background work reads "finished".** A subagent that starts a
  shell in the background, then ends its turn to wait on it, has its `turn.complete`, which is
  how a run ends (Session 4). Claude Code still lists it as waiting on a shell. Seen in
  Session 5's hand check (CLI 2.1.329). Needs the owner's decision: whether such a run reads
  something other than finished, and from which signal. Not seen: whether a new turn puts the
  row back to working when the shell ends, as `turnStarted` would.

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
- **The header, sections and clock in the desktop app.** The terminal's were seen in Session 5;
  the desktop draws the Lead with the app's `Progress` and Finished's `Button` natively, seen
  only in the kit's tree. To check, once 0.5.0 is installed: start three subagents in the
  desktop app, then compare the pane with the transcript: each row's tokens and time, the
  header's total, and the times ticking. Recorded at Session 6's start.
- **Rows and the clock surviving a reload of the mod (F-23).** The kit cannot reload a module,
  and no hand check has reloaded one. The declarations say `$.state` survives a hot reload and
  the reload stops the mod's timer; `session.start` arms it again for a live run. To check: in a
  `claude --plugin-dir mods/possum-squad` session with an agent running, change and save a
  file of the mod (then undo it), and see the rows stay and the time keep ticking.
- **A pane behind another's tab, brought back mid-run.** The clock keeps beating while the pane
  is hidden and redraws it at the first beat that finds it shown, which the kit shows; whether
  the surfaces report a tab behind another as not shown was not seen. To check: with an agent
  running, put another pane's tab in front, wait, bring Possum Squad back, and see the times
  right within a second.
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

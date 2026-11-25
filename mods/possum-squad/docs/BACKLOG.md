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

- **The opossums in the desktop app (0.7.0 to 0.10.1).** The kit checks each sprite's SVG, its
  size, its outline and its animation's frames, but not how the app paints them, and a
  terminal shows none. A session cannot look for the owner: computer use never grants control
  of, or a picture of, Claude's own window. **Seen at Session 9, installed 0.9.0, dark theme:**
  working rows' opossums, six and then fourteen at once, each moving in its role's outfit,
  plain before; the Lead's crown, still; `set motion off` and `auto` stopping and restarting
  them at once. **The 0.9.0 gallery drew nothing there,** past the bound the app holds a pane's
  tree to; 0.10.1 draws it in parts, seen at Session 9a. **Seen at Session 13's plan, installed 0.13.0, dark theme:** finished
  opossums each in its role's outfit, dozing with the "z" above them; the Lead's crown. The rest
  below is unseen. To check after the push, with three
  agents running: each row's opossum in its role's outfit, plain before; a working one bobbing
  and blinking smoothly, and not restarting each second; the Lead's crown; the empty pane's
  sleeping three; on the light theme the dark outline round pale edges, and none on the dark;
  with reduced motion on in the system, and with `/possums set motion off`, every opossum
  still. These sprites use `<path>` and an `opacity` animation, which the other mod in this
  repository draws on the desktop but this one has not yet.
  - **From 0.9.0:** a new row's opossum sliding in, then hopping into its outfit; a role
    worked out later hopping once; a finished one's cheer, its "z" rising, then still; a
    stopped one startled, then standing; the needs-you sign and the quiet doze bobbing; each
    one-off drawn still once it is over, with no flash when it turns into a still image; the
    gallery's 102 moving sprites smooth or not while scrolling (if not, the choice returns to
    the owner, *The panel*); its one-offs playing again after their rest. These use
    `fill="freeze"` and a `begin` time, which the app has not drawn for this mod yet. A gallery
    part's 18 moving sprites replace the 102 this item first named.
  - **From 0.10.0:** each row's role name as a button beside the model and effort, in the
    second line's small type (seen at Session 13's plan); pressing it opens a list of sixteen roles under the row, the
    current one selected; a pick dressing a working opossum with one hop; `cancel` and a second
    press closing the list. The pane opening by itself when a session's first agent starts,
    without taking the keyboard; after a close with its close mark, a new agent opening
    nothing; `/possums` then taking that back.
  - **From 0.10.1:** the gallery's parts were seen at Session 9a (the owner's look: all as
    expected). Rows past the sprite budget (about twenty working agents) standing still,
    then showing their mark, and rows past sixty counted as `and N more`: the kit checks these,
    and the desktop would need twenty or more agents running, so they are left to a session
    that has them anyway.
  - **From 0.8.0:** `/possums set theme horror` (and the other two) redressing every opossum
    at once; the gallery's poses wrapped to the pane's width, each with its state word; `planned`'s first column greyed
    and faded on both themes, its outline only on the light one (a group `opacity`, which the
    app has not drawn for this mod yet); the gallery's `close` button bringing the list back.
- **Needs you, quiet and toasts (0.11.0).** Seen in the terminal at Session 10 (CLI 2.1.330):
  a subagent's asked Bash call moved its row to Needs you while the prompt waited; it stayed
  there through the allowed call, and left it at the agent's next reply; a refused call left it
  too. With the pane hidden, both toasts drew over the transcript. **Seen in the desktop app**
  (installed 0.11.0, Session 10): the row under Needs you with the "?" sign, then finished; with
  the pane hidden, the Needs you toast. Unseen: the finished toast in the desktop app; a toast
  while the pane is open behind another pane's tab, or over the gallery; quiet, which no hand
  check can bring about (an agent silent for 90 s with no call running), so only the kit
  checks it.
- **Peek and the collapsed view (0.12.0).** Seen in the terminal at Session 11 (see its
  done-note). **Seen in the desktop app at Session 13's plan** (installed 0.13.0): the header's
  `collapse` at the end of the session line; and a defect: a long activity, a `cd` into an
  absolute path, pushed each row's `peek` button out of the pane, which 0.15.0 fixes with
  `minWidth` 0 on the row's shrinking Boxes. Unseen: `peek` and `hide` in reach on a row reading
  a file under a long path, or running a long command; Peek's lines under the row, wrapping, in the small type; the
  collapsed view, the Lead carrying one to three joeys at panel size on both themes (the
  redrawn joey's light-theme outline), the count and `1 needs you` beside it, and `expand`; a
  pane minimized in the app showing the collapsed view with no button, and a toast while it
  is minimized (`$.ui.panes()` does not say the seat, so a minimized pane toasts only if the
  app reports it not shown).
- **Limits, the estimate and helpers (0.13.0).** Seen in the terminal at Session 12 (see its
  done-note). **Seen in the desktop app at Session 13's plan** (installed 0.13.0, `cost` at
  `off`): the session line with the limits in its dim type (`5h 76% · 7d 64% · 665k tokens ·
  20:16`), wrapping beside `collapse`; a helper's row indented under its parent in Finished, its
  opossum beside it. Unseen: `est.` on the session line and on a row; a helper two levels deep;
  a helper under a parent that still works.
- **Waiting (0.14.0).** Seen in the terminal at Session 12a (CLI 2.1.330): a subagent that
  started a 40-second `ping` in the background and handed back read `waiting` in Running, its
  time counting, with no role; when the ping ended it took another turn, then read finished at
  0:44 as Helper. Unseen: in the desktop app, the waiting row's doze and its dim word; a parent
  waiting on its background helper with the helper drawn under it (the engine listed such a
  parent `waiting` in Session 12a's probe); the toast at a waiting agent's real end with the
  pane closed, and that end shown at another agent's event.
- **The activity line (0.15.0).** Unseen in the desktop app: a file named first ("Reading
  package.json in …/mods/possum-squad") on a row and in Peek; Claude Code's progress summary in
  a working row's third line, about half a minute into an agent's work, and whether the desktop
  app's engine gives one at all; an ended row's last call in the past.
- **`/possums` closing the pane, and `open`, `set` and `settings`, in the desktop app.** The
  desktop run (0.2.0) opened the pane with `/possums`; closing it there was not looked at, and
  0.3.0's words wait for its push and the owner's install.
- **Whether `/possums`'s answers stay out of requests.** They carry `isTextDisplayOnly`, which
  the declarations say is read "on the queued lanes"; whether an `immediate` command typed
  between turns is on one was not checked. To check: type `/possums settings` between turns,
  then ask Claude what the last command printed.
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

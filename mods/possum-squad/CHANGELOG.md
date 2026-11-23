# Changelog

All notable changes to possum-squad are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
`major.minor.fix`.

## [Unreleased]

## [0.9.0] — 2026-11-23

Every state moves.

### Added

- **A new agent's opossum slides in** from the left, plain, when its row appears; if its role is
  already known it hops and lands in its outfit, then stands for a moment before it starts work.
- **The hop into the outfit:** when an agent's role is worked out later, its plain opossum
  hops once and lands dressed.
- **Each state's animation:** an opossum that needs you bobs with its "?" sign held up; a quiet
  one dozes, bobbing slowly with its eyes closed; a finished one hops twice in a cheer, then
  falls asleep as its "z" rises, and is still after 3 seconds; a stopped one is startled with
  a "!" for a second, then stands. A failed one lies still on its back, as before.
- **The gallery moves:** `/possums roles` shows each state's animation, and plays the arrival,
  the cheer and the startle again every few seconds, so each can be watched after scrolling to
  it.

### Changed

- **A cheer, a startle or a hop plays only when it happens,** not each time a row is drawn
  again: showing Finished's rows, or opening the pane later, draws them still.
- **With `motion` at `off`,** every opossum holds its state's pose, the gallery's included; a
  stopped one stays startled. With your system asking for reduced motion, each holds its pose
  too, and a stopped one stands once its startle would be over.
- **A cheer or a startle shows only while Finished is open,** since that is where a finished or
  stopped row goes; Finished is collapsed until you press `show`.
- The pane forgets its rows once when this version is installed mid-session; they come back as
  agents do something.

## [0.8.0] — 2026-11-23

The four sets, and a gallery of every role.

### Added

- **The `theme` setting works:** `/possums set theme steampunk`, `horror` or `prehistoric`
  dresses every opossum in that set at once, the main session's included; `classic` is the
  default. Role names stay the same in every set; only the costumes change.
- **`/possums roles`** shows the gallery in the pane, in place of the list: every role of the
  current set in each of its eight states, with its role name and its costume's name (a
  Builder is a Boilermaker in `steampunk`). In a terminal it lists the states and the roles as
  text. Its `close` button, or closing the pane, brings the list back.
- **A planned pose,** standing greyed and faded, shown in the gallery. Nothing is planned yet,
  so no row uses it.

## [0.7.0] — 2026-11-22

The opossums arrive: in the desktop app each agent is a small pixel opossum, dressed for its
role.

### Added

- **An opossum per row,** beside the row's text, in the desktop app and every other app that
  draws pictures; the terminal keeps its text rows. It wears its agent's role from the
  `classic` set (a hard hat and hammer for a Builder, a pith helmet and flashlight for a Scout,
  and so on), and is a plain opossum until the role is settled.
- **A pose for each state:** standing while starting; dozing with its eyes closed when quiet;
  holding up a "?" sign when it needs you; asleep with a "z" when finished; startled with a "!"
  when stopped; on its back when failed.
- **A working opossum moves:** it bobs, its tool moves against it, and it blinks now and then.
  The other poses are still for now; their animations come in a later version.
- **The main session** wears the Lead's crown and robe at the top of the pane, and an empty pane
  shows three opossums asleep above its line.
- **The `motion` setting** works: `auto` animates, and keeps still for anyone whose system asks
  for reduced motion; `off` keeps every opossum still.
- **On the app's light theme** each opossum's pale edges get a thin dark outline, so it stays
  readable; on the dark theme it has none.

### Notes

- The `theme` setting is still only kept: every opossum wears `classic` until 0.8.0 brings the
  other three sets.
- A hat stays on an opossum on its back, so it lies a little higher than the first drawings
  showed.

## [0.6.0] — 2026-11-22

Every agent gets a role, worked out from what it is doing; the outfits that show it arrive with
the opossums.

### Added

- **Roles.** Each agent's row names its role, such as Builder, Scout or Bug catcher, at the start
  of its second line, before the model and effort. There are seventeen; the main session is the
  Lead.
- **How a role is chosen:** from the agent's type (an Explore agent is a Scout), then the words
  of its task (its first word first: "Review the migration plan" is a Reviewer's), then its
  first tool calls (an edit makes a Builder; six reads and searches with nothing else, a
  Scout). The details are in the user guide.
- **Helper** is the role of an agent nothing has settled a minute after it started, or when it
  ends first. A teammate whose turn ends, or an agent whose turn left work running in the
  background, keeps its role open for its next turn, or the minute. The minute counts whether
  or not the pane is open.
- **A role never changes** once it is settled, whatever the agent does afterwards. Until then
  the row names none.

### Changed

- **A session that loads 0.6.0 while it runs** (a reload of the mod mid-session) starts its list
  of agents over: the list's stored shape changed.

## [0.5.0] — 2026-11-20

The pane gets its shape: the main session on top, the session's totals, and the agents sorted
into sections, with times that tick.

### Added

- **The main session** heads the pane as "Main session", with a bar of how full its context
  is, the percent and its own tokens. The context shows "–" until Claude's first reply in the
  session, and after a `/clear`.
- **The session line** under it: tokens and time over the main session and every agent. The
  time is work time: the main session's turns added up, plus each agent's time. It grows when
  each of Claude's turns ends, and while agents run. An agent that ran and dropped out of the
  list still counts.
- **Sections:** Needs you, Running and Finished, in that order, each with its count. Running is
  always there once an agent has started; the others show only when they hold someone. Failed
  and stopped agents sit under Finished.
- **Finished starts folded,** with a `show` button beside its heading; `hide` folds it again.
  Your choice is kept between sessions.
- **Times tick every second** while an agent runs and the pane is open, with nothing else
  happening. With nothing running, or the pane closed, nothing ticks. A pane open behind
  another pane's tab keeps time without redrawing, so its next tick after you bring it back
  draws it right. `/possums` or `/possums open` while an agent runs starts the ticking afresh.

### Changed

- **`/possums set`** redraws the pane at once.
- **The terminal** draws the whole pane as text: the main session's bar and every section in
  block characters and coloured marks.

## [0.4.0] — 2026-11-20

Agents show up. Every subagent Claude starts gets a row in the pane, live, until it ends.

### Added

- **A row for each subagent,** shown the moment Claude starts it, in the order they started.
  It reads:
  - its task, in a few words, and its state: starting, working, finished, failed or stopped;
  - the model it runs on and its effort, once its first request names them;
  - what it is doing: the last tool it asked for and what that names, such as "Reading
    notes.md" or "Running npm test", or "No tool calls yet";
  - a bar of how full its context is, the percent, its tokens and its time. The tokens are
    what it read and wrote fresh; what it read back from the cache is left out. The time
    moves on as the agent's requests come in; a clock that ticks every second comes later.
- **How a run ends:** an answer with text is finished; one you interrupt is stopped; an error,
  a refusal or an answer with no text is failed. A teammate that answers with a message rests
  as finished, and goes back to working on its next turn. A resumed agent picks up its own
  row again.
- **"round 2"** marks an agent started with the same task as one that already finished.
- **The list empties** when you `/clear`, resume another conversation or fork it. It keeps the
  latest 30 ended runs.

### Changed

- **The note in 0.3.0 that earlier versions stopped tools moving to the background** was
  measured since: with a version watching every tool call loaded, a shell command still moved
  to the background with ctrl+b, and one asked to run there still did. Claude Code's
  documentation warns of it for other cases, so the mod still doesn't watch tool calls; it
  reads what each agent asked for from its own requests instead.

## [0.3.0] — 2026-11-17

The test build is over: the pane is back to saying no agents have shown up yet, and its
settings arrive. Agents start showing up in the next version.

### Added

- **`/possums open`** shows the pane, or brings it forward when it is behind another pane's
  tab. Unlike `/possums`, it never hides it.
- **`/possums settings`** lists the settings under a heading, each with its value and the
  values it takes.
- **`/possums set <name> <value>`** changes one, and answers with its new value, or with the
  names or values it takes. The settings are:
  - `autoOpen` (`never`, `first`, `always`);
  - `cost` (`off`, `estimate`);
  - `motion` (`auto`, `off`);
  - `theme` (`classic`, `steampunk`, `horror`, `prehistoric`).

  They are kept between sessions, and each takes effect when the part of the pane it controls
  arrives. Names and values can be typed in any case. `/possums set` alone names the
  settings.
- These answers are marked for you alone, which Claude Code honours for a command that waits
  its turn. Whether it keeps them out of what Claude is sent when typed between turns has not
  been checked yet.

### Removed

- **The test view:** the test drawings, the plan limits and the list of events the mod heard.
- **The test setting** "Test setting (does nothing)". If you changed it, the value stays in
  your Claude Code settings, where nothing reads it; you can remove it there.

### Fixed

- **Words after `/possums` are no longer ignored,** so `/possums open` can't hide the pane.
- **Tools can be moved to the background again** while the mod is installed, and a tool served
  by another program shows its output as it arrives. Earlier versions turned both off by
  watching every tool call.

## [0.2.0] — 2026-11-17

A test build. For now the pane shows test drawings and what the mod hears, so the next version
can be built on what they show; it takes them out again.

### Added

- **The pane shows a test view.** Below the empty line, the desktop app draws twenty small
  animated test critters, one drawn as a still picture, and two that should change with a
  light theme and with reduced motion; a terminal says they show in the desktop app. Under
  them are your plan-limit percents, and a list of the events the mod has heard: how many of
  each, in what order, and their field names and types. It never shows what an agent was asked,
  answered or worked on, nor the names inside a tool's arguments. While it is open, the pane
  redraws once a second.
- **A test setting,** "Test setting (does nothing)", among the plugin's settings. It changes
  nothing: it checks whether a plugin's settings can be changed there, and goes in the next
  version. Changing it reloads the mod, which starts the test view's event list over.

## [0.1.0] — 2026-11-17

The first release: the pane and its command, with nothing in it yet. Agents start showing up in
later versions.

### Added

- **`/possums` shows or hides the Possum Squad pane.** It works mid-turn too, and prints
  nothing in the conversation. When the pane is open but out of sight, behind another pane's
  tab, `/possums` brings it forward instead of hiding it. For now the pane says only that no
  agents have shown up yet.
- **The mod watches without changing anything.** It sees agents start, turns run and tools get
  called, and passes every one of them on exactly as it came; watching adds nothing to what
  Claude is sent.

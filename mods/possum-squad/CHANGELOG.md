# Changelog

All notable changes to possum-squad are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
`major.minor.fix`.

## [Unreleased]

## [1.0.0] — 2026-11-27

The first full release: the pane lists the main session and every agent with live numbers and
state, each drawn as an opossum dressed for its role, as the versions below built it.

### Changed

- **Nothing in the pane changes from 0.17.0.** The README now says what the plugin can call in
  Claude Code and which Claude Code version it was tested with, and the user guide has been
  checked against the plugin as it is.

## [0.17.0] — 2026-11-26

Toasts say why an agent failed and can be quieted, the pane's tab says when agents need you,
and a row's role can go back to being worked out by itself.

### Added

- **The `toasts` setting:** `all` (the default) shows every toast, `needs` only the one for an
  agent that needs you, and `off` none. `/possums set toasts needs` changes it.
- **The pane's tab counts the agents that need you,** "Possum Squad · 1 needs you", while
  another pane sits beside it (Claude Code draws tab titles only then), and reads "Possum
  Squad" again once none does. Retitling never brings the pane forward, and is skipped while the
  pane is closed.
- **Detect in the role picker:** the first entry works the row's role out again from its type,
  its task and its latest calls, so the opossum hops into what it finds, or takes Helper once
  the agent has ended or worked over a minute. For an agent type of your own, it also forgets
  the role you picked for the type, so its next agents are worked out as usual.

### Changed

- **A failed agent's toast says why:** "… · failed after 2:14: an error", ": a refusal" or ": an
  empty answer".

## [0.16.0] — 2026-11-26

The session line's time moves while Claude works on a turn, not only when the turn ends.

### Changed

- **The session line's time ticks through Claude's own turns,** once a second while the pane is
  open, as it already did while an agent works. When the turn ends, the time Claude Code counted
  for it takes the running time's place, and the line does not step back when it does. With the
  pane closed nothing ticks.

## [0.15.0] — 2026-11-25

A row's third line says what its agent is doing in Claude Code's own words, names the file it
works on, and reads in the past once the agent is done; its `peek` button stays in reach.

### Added

- **Claude Code's own progress summary** of an agent, such as "Running second localhost ping",
  takes the place of its last tool call on a working, starting or waiting row once Claude Code
  has one (about half a minute into the agent's work), while the pane is open. A row that needs
  you still names the call it asks about, and a quiet one how long it has been quiet. A long
  summary is cut to one line.

### Changed

- **A file names itself first:** "Reading package.json in …/mods/possum-squad" instead of a long
  path whose file name the line cut off, Windows paths included. Peek's last actions read the
  same way. A long shell
  command still shows its start, now with `…` where it was cut.
- **A finished, failed or stopped row reads its last call in the past:** "Ran npm test", "Read
  package.json in …", or "No tool calls". A waiting row keeps "Running …", since what it waits
  on still runs.
- **A session that loads 0.15.0 while it runs** starts its list of agents over: its stored shape
  changed.

### Fixed

- **The `peek` button stays in the pane** on the desktop app: a long activity, such as a `cd`
  into a long path, pushed it out of reach. A long task description can no longer push the
  state word out either.

## [0.14.0] — 2026-11-25

An agent that hands back while its own background work still runs waits in Running instead of
reading finished.

### Added

- **Waiting:** an agent whose turn ends while a shell it started in the background, or a helper
  it started, still runs stays in Running with the state `waiting`, dozing as a quiet one does,
  its time still counting. It is counted among the running in the collapsed view, and a helper
  working under it is drawn beneath it. When that work is done the agent usually picks up again
  and its row works; it ends when Claude Code says it has. `/possums roles` does not show it
  apart: it looks like quiet.

### Changed

- **The toast for a long agent's end** comes when it really ends, timed through its wait, not
  when it hands back to wait on its own work. Helper, for an agent no rule dressed, also waits
  for its real end, and comes then even if a step of its turn started work in the background.
- **A pane that opened by itself but waits for room to be drawn** keeps time like an open pane,
  so a waiting agent's end is noticed there too.
- **With the pane closed,** a waiting agent's end shows at the next event of another subagent, or when
  you open the pane.
- **A session that loads 0.14.0 while it runs** starts its list of agents over: its stored
  shape changed.

## [0.13.0] — 2026-11-25

The session line shows your plan's limits and, if you ask, what the session would cost; an
agent's helpers sit under it.

### Added

- **Plan limits:** the session line starts with each usage window Claude Code reports, such as
  `5h 40% · 7d 12%`, as soon as Claude Code reports them, and kept through a `/clear`. Off a
  subscription there are none.
- **The estimate:** with `/possums set cost estimate`, the session line and every row end with
  what the requests would cost at each model's list price, such as `est. $0.25`. It is an
  estimate, never a bill, from a price table dated 2026-11-25 that lists every model still
  served; it does not see fast mode, the US-only surcharge or web search fees. With `cost` at `off`, the default, no dollar figure
  appears anywhere.
- **Helpers:** an agent started by another agent is drawn right under it, indented, while both
  sit in the same section; one that needs you, or ends first, shows in its own section. A
  parent's tokens and estimate include its helpers', theirs too, even after they drop out of
  the list; its time and context stay its own.

### Changed

- **A session that loads 0.13.0 while it runs** starts its list of agents over, and the main
  session's tokens and time from zero; its context shows again after Claude's next reply, and
  the limits at the next measure. Their stored shapes changed.

## [0.12.0] — 2026-11-25

A row opens to show what its agent was asked, did and answered, and the pane folds down to a
glance.

### Added

- **Peek:** each row has a `peek` button at the end of its third line. It opens, under the
  row, the agent's task in full, the brief it was given, its last five tool calls, the files it
  wrote or edited (the latest ten, a long path shown by its end so its name stays) and the start
  of its answer once it has one, headed `Last answer` while the agent works on a later turn.
  The brief and the answer are cut at 600 characters. `hide` closes it. One row's Peek is open at a time, and
  closing the pane closes it. All of it is plain text: markdown or a link in what an agent
  wrote shows as written.
- **The collapsed view:** a `collapse` button at the end of the session line folds the pane to
  the main session's opossum carrying a joey for each running agent, up to three, beside how
  many run (`4 running`) and, when any agent waits on you, `1 needs you`. `expand` brings the
  list back. Your choice is kept between sessions. `/possums roles` still shows the gallery
  over it, with no `collapse` button while it does.
- **A minimized pane** in the desktop app always shows the collapsed view, without the button.
- **Toasts while collapsed:** with the pane folded, an agent that needs you, or a long turn's
  end, toasts as it does while the pane is closed.

### Changed

- **The joey is redrawn:** a baby opossum with dark ears, a grey crown and pink paws, clinging
  to the main session's opossum.
- **A session that loads 0.12.0 while it runs** starts its list of agents over, and forgets
  the pane's flags for the session: the gallery, a picker, and a close you made with the pane's
  close mark, so the next agent may open the pane again unless `autoOpen` is `never`. Their
  stored shapes changed.

## [0.11.0] — 2026-11-23

The pane says when an agent needs you, or has gone quiet, and tells you while it is out of sight.

### Added

- **Needs you:** when an agent's tool call waits on a permission prompt, its row moves up to
  Needs you and its opossum holds up a "?" sign, its third line still naming the call. Once the
  call has run or been refused and the agent's next reply is in, it goes back to Running. A
  prompt for the main session, or one another plugin or hook answers, moves no row.
- **Quiet:** an agent starting or working with no call running and nothing heard from it for a
  minute and a half shows as quiet: its opossum dozes on its feet, and its third line reads
  "Quiet for 2 min". The next thing it does wakes it.
- **Toasts while the list is out of sight** (the pane closed, behind another pane's tab,
  waiting to be drawn, or showing the gallery): one when an agent comes to need you, and one
  when an agent ends a turn of more than a minute, finished, failed or stopped. Each names the
  agent by its task, cut at 100 characters; a teammate's or resumed agent's turn is timed on
  its own.

### Changed

- **A session that loads 0.11.0 while it runs** starts its list of agents over: the list's
  stored shape changed.

## [0.10.1] — 2026-11-23

The gallery draws in the desktop app.

### Fixed

- **`/possums roles` shows the gallery in the desktop app,** three roles at a time: each in its
  eight poses, with `previous` and `next` to move through the six parts (`2 of 6`), going round
  from the last to the first. Before, the desktop app drew nothing for it, and the pane looked
  frozen until you closed it. A terminal pages the same way, under the states' marks and words.
  The gallery opens on its first part, keeps its part while you change the set, and closing it
  forgets the part.

### Changed

- **With many agents, the pane keeps drawing:** past what one pane can hold, the later rows'
  opossums stand still, and after those, each row shows its state's coloured mark instead.
  Rows past sixty are not drawn: their section ends with a line such as `and 12 more`, and its
  heading still counts every row.
- **A task description longer than 100 characters** is cut there, with `…`; a row showed only
  one line of it anyway.
- A close you made this session is forgotten once when this version is installed mid-session.

## [0.10.0] — 2026-11-23

Pick a role, and the pane opens by itself.

### Added

- **Pick an agent's role:** each row's role name, or "Pick a role" while it has none, is a
  button. Press it and choose from the sixteen roles; the row takes the role at once, and a
  working opossum hops into its new outfit. Choosing the role it already has leaves the row as
  it is. `cancel` or a second press closes the list without a change. A role you pick is never changed by what the agent does next.
- **Picks are remembered for your own agent types:** pick a role for an agent of a custom type
  and every later agent of that type starts in it. Picks for the built-in and general-purpose
  agents apply to that one run only, since every such agent shares the type.
- **The pane opens by itself** as `autoOpen` says: with `first`, the default, when the
  session's first agent starts, and again after `/clear`; with `always`, whenever a new agent
  starts and the pane is closed; with `never`, only through `/possums`. It never takes the
  keyboard, and never brings forward a pane that is already open behind another.

### Changed

- **A pane you close with its close mark stays closed:** no agent opens it again until you open
  it yourself with `/possums`, or `/clear` starts the conversation over.
- **On a terminal, a row's role is drawn as a button,** `[ Builder ]`, before the model and
  effort.
- A close you made this session is forgotten once when this version is installed mid-session.

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

[0.17.0]: https://github.com/FairCat-GD/claude-code-mods/commit/3b0774b739c33be8109d75f10d12e0c915f3a468
[0.16.0]: https://github.com/FairCat-GD/claude-code-mods/commit/63d7d98a0ab8b57676d9846fde4ad72b81074bfc
[0.15.0]: https://github.com/FairCat-GD/claude-code-mods/commit/af4109a1b6f924b404985fcb34b4c2fdf3ef7018
[0.14.0]: https://github.com/FairCat-GD/claude-code-mods/commit/8e74372d749b65ff5cd83c79533a7823ca7dffc1
[0.13.0]: https://github.com/FairCat-GD/claude-code-mods/commit/cecaf58d6ed854cc462640990c0dc449eb263477
[0.12.0]: https://github.com/FairCat-GD/claude-code-mods/commit/3ff38f296012c83b0e33424c9a0816009d784dfa
[0.11.0]: https://github.com/FairCat-GD/claude-code-mods/commit/630a295d64b517a165c78b13f98a1e0cdd411939
[0.10.1]: https://github.com/FairCat-GD/claude-code-mods/commit/a9609ce68bd1f8738bfb1e95600d122c4c039636
[0.10.0]: https://github.com/FairCat-GD/claude-code-mods/commit/38897cf2a5d54192b883b806366739388203d5ba
[0.9.0]: https://github.com/FairCat-GD/claude-code-mods/commit/86e5d008d51361aa9278bdf176631d36fb683dad
[0.8.0]: https://github.com/FairCat-GD/claude-code-mods/commit/b0df5416d857ec7db21adeb2d9ad882ebae42a99
[0.7.0]: https://github.com/FairCat-GD/claude-code-mods/commit/59fabdc2245e997a3e2bc87f2f8e709c72d7c0bb
[0.6.0]: https://github.com/FairCat-GD/claude-code-mods/commit/378056e22fa2eab01711e21d725c35977e6355ba
[0.5.0]: https://github.com/FairCat-GD/claude-code-mods/commit/4475de3ff48a63dd417ec18661d5dba9c846f249
[0.4.0]: https://github.com/FairCat-GD/claude-code-mods/commit/856fcc99e60ce472932b5848e0a60b711cfacc20
[0.3.0]: https://github.com/FairCat-GD/claude-code-mods/commit/0512707dd8dc905076619c9ec6175270d26505c7
[0.2.0]: https://github.com/FairCat-GD/claude-code-mods/commit/f47801dd5f2b77436ce2c7715fd530ca3bfca774
[0.1.0]: https://github.com/FairCat-GD/claude-code-mods/commit/64828e916fba4183e6f7b919f10d8c6afb51e4b4

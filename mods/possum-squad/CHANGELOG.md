# Changelog

All notable changes to possum-squad are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
`major.minor.fix`.

## [Unreleased]

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

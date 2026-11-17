# Changelog

All notable changes to possum-squad are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
`major.minor.fix`.

## [Unreleased]

## [0.3.0] — 2026-11-17

The test build is over: the pane is back to saying no agents have shown up yet, and its
settings arrive. Agents start showing up in the next version.

### Added

- **`/possums open`** shows the pane, or brings it forward when it is behind another pane's
  tab. Unlike `/possums`, it never hides it.
- **`/possums settings`** lists the settings, each with its value and the values it takes.
- **`/possums set <name> <value>`** changes one, and answers with its new value, or with the
  names or values it takes. The settings are:
  - `autoOpen` (`never`, `first`, `always`);
  - `cost` (`off`, `estimate`);
  - `motion` (`auto`, `off`);
  - `theme` (`classic`, `steampunk`, `horror`, `prehistoric`).

  They are kept between sessions, and each takes effect when the part of the pane it controls
  arrives. Names and values can be typed in any case.
- These answers show only to you: typed between turns, they are not sent to Claude.

### Removed

- **The test view:** the test drawings, the plan limits and the list of events the mod heard.
- **The test setting** "Test setting (does nothing)". If you changed it, the value stays in
  your Claude Code settings, where nothing reads it; you can remove it there.

### Fixed

- **Words after `/possums` are no longer ignored,** so `/possums open` can't hide the pane.
- **Tools can be moved to the background again,** and a tool's live output shows again, while
  the mod is installed. Earlier versions turned both off by watching every tool call.

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

# Changelog

All notable changes to possum-squad are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
`major.minor.fix`.

## [Unreleased]

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

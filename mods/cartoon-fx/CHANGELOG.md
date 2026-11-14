# Changelog

All notable changes to cartoon-fx are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
`major.minor.fix`.

## [Unreleased]

## [0.12.0] — 2026-11-15

### Changed

- **Effects take turns.** One that comes while another plays waits for it to finish, then plays
  whole. Up to three wait; more are skipped, and so is one whose turn comes more than 12 seconds
  after it happened.
- **One command plays everything it did, in order.** `npm test && git commit && git push` plays
  the checkmark, the stamp, then the confetti, where it used to play the confetti alone.
- **`/fx all` takes its turns too.** Something real that happens during a replay plays right
  after the sample on show, then the replay goes on. A new `/fx` replaces what an earlier one
  still had to play, once its current sample finishes.

### Fixed

- **A push that fills the context past 75% keeps its confetti.** The yellow zone plays after it,
  instead of replacing it at once.
- **Two effects in the same millisecond both play,** each with its own drawing.
- **A collapsed strip above the prompt no longer swallows effects.** What would play there while
  it is collapsed is skipped, and an effect that moves there from a row nobody saw is skipped
  too, rather than counted as seen.
- **An effect moves to the strip whenever its own row doesn't show it,** even when that row
  showed the effect before it.

## [0.11.1] — 2026-11-14

### Fixed

- **Confetti only for a push that happened.** A rejected push plays nothing, even behind
  `; echo done` or after a `git pull`, and so does a git command that only mentions a push,
  such as `git log --grep=push` or a `# … push` comment. A push of a tag still plays, with the tag's
  name.
- **A commit on a detached HEAD stamps,** and a cherry-pick is no longer read as a commit.
- **More test runners check off:** `node --test`, `rspec`, `dotnet test`, `gradle` and
  `./gradlew test`, `mvn test`, `xcodebuild test`, `phpunit` and `mix test`.
- **A test named "shows FAIL badge" no longer spoils a pass.** A runner's FAIL mark counts only at
  the start of a line, where runners print it.
- **Quoted text and heredocs are read whole.** A commit message or a note that says
  "npm test; …" is not taken for a test run, and `bash -c "cd app && npm test"` still counts.

## [0.11.0] — 2026-11-14

### Changed

- **Subagents start with a bang.** A smoke bomb drops and bursts, and bigger ninja helpers leap
  out in front of the smoke, land with a squash and a hop, and hold a victory pose until the
  words go: arms up, eyes `^ ^`.
- **Smoke goes poof.** Every puff swells, drifts out and shrinks to nothing instead of fading,
  so it stays crisp on a dark background instead of turning into brown discs.

### Fixed

- **The magnifying glass sweeps the page.** A finished review's glass now zigzags over the page
  line by line and stays in the picture, where it used to sweep below and to the right of it.
- **A review's "!" marks never overlap.** Each sits just after the line it flags and pops as the
  glass reaches that line, for one to four findings.
- **The gauge's yellow starts at 75%,** where the yellow zone does, rather than 60%.
- **Long words stay in the picture.** A long title or subtitle, such as a long branch name after
  "Pushed!", shrinks to fit, and past a readable size ends in "…". "Bugs squashed!" and the
  labels at the bottom of a drawing no longer run off its edges, and the stamp's AMENDED fits
  inside its frame.

## [0.10.3] — 2026-10-28

### Fixed

- **A command that only names a test runner no longer plays "All green!".** Reading
  `jest.config.js`, `npm ls vitest` or installing Playwright's browsers counted as a passing test
  run. A run counts now when a command, or a part of one after `&&`, `;` or `|`, starts with the
  runner, after any environment variables or a launcher such as `npx`, `uv run` or `python -m`.
  Wrappers such as `timeout 600`, `bash -c` or `{ …; }` and a launcher's flags (`npx -y`) may
  come first too.
- **A test run must also say it passed.** Its output needs a passed count, or a runner's own
  word for a pass (go's `ok`, Swift's "with 0 failures"). A run that prints nothing plays
  nothing.

## [0.10.2] — 2026-10-25

### Fixed

- **A code review and its fixes now play in the conversation, in the desktop app.** The app draws
  a review's report as its own card, which can't show an animation, so "Reviewed!" and "Bugs
  squashed!" play under the reply or the tool call just before that card. With nothing before it,
  they play in the strip above the prompt after about a second.
- **An animation still playing after many others no longer plays a second time in the strip.**

## [0.10.1] — 2026-10-25

cartoon-fx came into this repository at 0.10.1. Its earlier versions came before the repository
and are not recorded. The entry below lists what it does at this version.

### Added

- **An accepted plan claps a film clapperboard shut.** "Action!", once you approve a plan; a plan
  you turn down plays nothing.
- **A commit stamps its short hash.** A rubber stamp says SAVED, or AMENDED for an amend.
- **A push throws confetti** with the name of the branch it updated. A failed push, a dry run or
  one with nothing to push plays nothing.
- **A passing test run shows a checkmark** with the number of tests passed. It knows the common
  test and verify commands, and a run that reports any failure plays nothing.
- **A finished code review sweeps a magnifying glass over a page of code,** with its number of
  findings, or "no findings, all clear".
- **Review fixes squash a bug.** Fixes applied after a review show how many were fixed, and a
  commit of review fixes plays this in place of the stamp.
- **A compaction squishes a pile of pages into a cube,** with the tokens before and after.
- **Subagents dash out as ninja helpers.** Several started together play once, with their count.
- **A gauge marks the context window filling up.** It swings into the yellow zone at 75% and slams
  into the red at 90%. Each plays once on the way in, and again only after the window drops
  below 70% for the yellow or 85% for the red.
- **Effects play where they happened.** In the desktop app each one plays under the conversation
  row that set it off, or under the folded group that holds it. One with no row on screen moves
  to the strip above the prompt. The terminal shows a row of coloured glyphs around the words in
  that strip.
- **`/fx` replays the animations.** `/fx <name>` plays one, and `/fx` or `/fx all` plays them all
  in turn, each in that run's own output row. A name it does not have gets the list of the ones
  it has.
- **`/fx place bottom` keeps every effect in the strip above the prompt,** and
  `/fx place conversation` (or `/fx place middle`) puts them back under their rows. The choice is
  remembered across sessions.

[0.12.0]: https://github.com/FairCat-GD/claude-code-mods/commit/0bd5d6ee32213ddf9d0916208b02e6dd1cb46547
[0.11.1]: https://github.com/FairCat-GD/claude-code-mods/commit/b3621a1d2af7e4b3fcc26d6bcf7fecb773f3af3b
[0.11.0]: https://github.com/FairCat-GD/claude-code-mods/commit/58c85f94813e1d8d755f020a83535378f7a86a25
[0.10.3]: https://github.com/FairCat-GD/claude-code-mods/commit/ce8ebde090a3e5c4b46fdae209cc0ff7f4f9190d
[0.10.2]: https://github.com/FairCat-GD/claude-code-mods/commit/5f317d83a118bc2a971426d1dc11f86cfd9d5495
[0.10.1]: https://github.com/FairCat-GD/claude-code-mods/commit/8d06df29d90548a3daed1bea4fd5273cef789b45

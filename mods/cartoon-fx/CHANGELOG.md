# Changelog

All notable changes to cartoon-fx are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
`major.minor.fix`.

## [Unreleased]

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
  in turn, each in that run's own output row.
- **`/fx place bottom` keeps every effect in the strip above the prompt,** and
  `/fx place conversation` puts them back under their rows. The choice is remembered across
  sessions.

No round is in progress. Read the root CLAUDE.md, then this mod's CLAUDE.md, *The session cycle* in
the root docs/DEVELOPMENT-WORKFLOW.md, this mod's docs/ARCHITECTURE.md's overview, invariants and
baseline, then this file; then the sections of docs/ARCHITECTURE.md the request touches, and any a
block will point at. The next session is an **intake**: write the owner's request down verbatim,
ask what it leaves open, and plan the round in this mod's `docs/spec/`, a Read line in every block
(see the root `docs/DEVELOPMENT-WORKFLOW.md`, *Rounds*).

## State you need that is not in the docs

- **Round 1's close is still under way, in Session 13's chat,** until the commit
  `docs(possum-squad): close round 1` exists. Before it, this file runs ahead: `docs/spec/` is
  still there, and what is left is the push, the owner's look from the installed 1.0.0, a docs
  commit recording it, then the close. If the chat ended before the close, the next session
  finishes Session 13 from where `git log` shows it stopped, instead of starting an intake. The
  close removes this line.
- **possum-squad 1.0.0 is released.** Round 1 (the agents panel: Sessions 0–13, 7a, 9a and
  12a–12d) is closed. Its spec files are deleted; the last done-note is in `docs/spec/SESSIONS.md`
  as of the commit before the close (`<sha>`, filled in by the close), read with
  `git show <sha>:mods/possum-squad/docs/spec/SESSIONS.md`. The design draft, `SPEC.md` and the
  frozen inputs (`docs/spec/research/`) are in the same commit.
- **Push status:** pushed on 2026-11-27 with the owner's approval: `origin/main` holds
  everything through `review(possum-squad): a handoff ahead of the close, and 5 smaller`, with
  1.0.0's release before it. The look from the installed 1.0.0, its docs commit and the close
  follow, then the next push. List `origin/main..HEAD` before any push, and name any commit
  that is not this mod's.
- **The changelog's 1.0.0 link** points at the commit that bumped the manifest to 1.0.0 until the
  tag `possum-squad-v1.0.0` is pushed; then it points at the tag, and `[Unreleased]` compares the
  tag with `HEAD`. The first commit after the tag's push makes both changes.
- **Open items live in `docs/BACKLOG.md`,** among them what round 1 left: step reports, the
  context badge (T-08), two hypotheses to check (role accuracy, whether the panel earns its
  space), and the looks nobody has made by hand.
- **The engines:** CLI 2.1.330; the desktop app ran engine 2.1.330 at its last reading.
- **Baseline** (`docs/ARCHITECTURE.md`, v1.0.0, CLI 2.1.330): 361 tests in 27 files, about 20 s;
  the tools' specs 10 in 2; `validate` 11 hooks, 4 gating each with a `.catch`, 3 state keys,
  and the calls line the README prints.

## Watch for

- **Requirement ids outlive the design draft** through `docs/ARCHITECTURE.md`'s *Requirement
  ids*: a new id an intake adds goes there, with one line.
- **The standing traps** are in the root `CLAUDE.md` and this mod's `CLAUDE.md`, *Watch for*.

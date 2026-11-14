Read, in the order the root CLAUDE.md gives a mod session:
1. what T1's **Read** line names, in this mod's `docs/spec/`;
2. the root CLAUDE.md, then this mod's CLAUDE.md;
3. *The session cycle* in the root `docs/DEVELOPMENT-WORKFLOW.md`;
4. this mod's `docs/ARCHITECTURE.md`: its overview, invariants and baseline, and the sections
   the Read line names;
5. `docs/spec/SESSIONS.md`'s header, T1's block and Q1's done-note;
6. this file.

Then do Session T1: a cherry picked, and a merge, from the engine's report. Measure first.
Release 0.13.0.

## State you need that is not in the specs

- **Round 3 is fun, a queue, new moments and controls:** A1, D1 and Q1 are done; T1, T2, C1 and
  A2 remain.
- **The repo level runs beside this round,** from the root's `docs/spec/REVIEW-2026-11-14.md`.
  Its Sessions 3a and 3b are done; repo Session 3c (ready for a second mod) and Session 4 (the
  repo's documentation pass, closing its round 1) remain, tracked in the root
  `docs/spec/SESSIONS.md` and `docs/next-session-prompt.md`. Carry this line in every later
  cartoon-fx handoff until both are done.
- **Q1 shipped 0.12.0** (its done-note in `SESSIONS.md`): effects take turns. Three real moments
  wait at most, one whose turn comes more than 12 s late is dropped, `/fx`'s samples wait past
  both, and a collapsed strip drops what would play there. The Bash hook plays each moment it
  found, ordered by `ranAt`. T1's new moments go through `play` like every other, so they queue
  with no extra work; a cherry-pick or merge in the same command as a test run or a push plays
  in the order the command ran them only if `ranAt` places it too (today it knows push, commit
  and tests).
- **The every-tool `tool.call` hook is registered first,** and must stay first: it is the
  outermost, so the context check queues behind the call's own effect. One test guards it.
- **A queue timer goes through `later`,** which skips it after a reset; a new timer that moves
  the queue should too.
- **Review fixes wait for the owner's word.** After `/code-review`, report the findings and ask
  which to fix before any edit.
- **Push status.** Nothing of Q1 is pushed. `origin/main` holds everything through D1's review;
  waiting locally are D1's handoff commit (`docs(cartoon-fx): D1's handoff says 0.11.1 is
  installed`), Q1's commit, its handoff commit naming the repo's remaining sessions, and Q1's
  review commit. The installed release is 0.11.1. List
  `origin/main..HEAD` before any push, and name any commit that is not this mod's; parallel repo
  sessions share this checkout.
- **The desktop check of 0.12.0 waits for the push and the owner's update:** in a new desktop
  session, a command that tests, commits and pushes plays all three under its row, and `/fx all`
  still plays all ten in its row. Record it in the next handoff, or it stays in
  `docs/BACKLOG.md`'s *Not yet checked by hand*.
- **The owner's stored placement is `conversation`.**
- **The CLI on PATH is 2.1.325,** and so is the desktop's engine.
- **Baseline** (`docs/ARCHITECTURE.md`, v0.12.0, CLI 2.1.325):
  - 62 tests;
  - `validate`: 13 hooks, 5 gating (each with a `.catch`), 4 state keys, and no warning but the
    allowed `CLAUDE.md` one;
  - `tsc` and the import scan clean.
- **How earlier sessions checked things live, reusable here:**
  - A terminal check starts from the Terminal panel, from the repository's root:
    `claude --plugin-dir mods/cartoon-fx "<opening prompt>"`. Q1's opening prompt asked the
    session to run one exact command with the Bash tool, in a scratch repository under this
    session's scratchpad with a local bare remote (`git init --bare`), with a fictional git
    identity set in that repository alone. It ran without a permission prompt.
    `read_terminal` reads the strip; closing the tab ends the session.
  - `claude --plugin-dir mods/cartoon-fx "/fx all"` runs `/fx all` as the opening prompt.
  - A desktop check needs the owner to type `/fx`, with no dialog open over the conversation:
    pause, and let them run it.
  - T1's probe hook must be removed before its commit, and print nothing private.
- **Repo Session 3b or 4** repoints this mod's `CLAUDE.md` (the SPEC §8 pointer) and
  `docs/ARCHITECTURE.md` (*Testing strategy*) away from the root `docs/spec/SPEC.md`, in a
  `docs(cartoon-fx):` commit of its own. Leave those lines to it. Follow the root
  `docs/DEVELOPMENT-WORKFLOW.md` as it stands.

## Watch for

- **The standing traps** are in the root `CLAUDE.md` and this mod's `CLAUDE.md`, *Watch for*.
  Q1 moved this mod's there.
- **A new kind is a new name in `FxKind`, `FX_MS`, `drawFx` and `SAMPLES`,** and a word the owner
  types after `/fx`: name it once, with the owner.
- **A pull request is an action on GitHub:** only with the owner's yes for that step, in the
  repository they name (T1's ask).

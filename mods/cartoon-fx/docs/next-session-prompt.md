No round is in progress. Read the root CLAUDE.md, then this mod's CLAUDE.md, *The session cycle* in
the root docs/DEVELOPMENT-WORKFLOW.md, this mod's docs/ARCHITECTURE.md's overview, invariants and
baseline, then this file; then the sections of docs/ARCHITECTURE.md the request touches, and any a
block will point at. The next session is an **intake**: write the owner's request down verbatim,
ask what it leaves open, and plan the round in this mod's `docs/spec/`, a Read line in every block
(see the root `docs/DEVELOPMENT-WORKFLOW.md`, *Rounds*).

## State you need that is not in the docs

- **cartoon-fx 0.16.0 is released.** Round 3 (fun, a queue, new moments and controls: A1, D1, Q1,
  T1, T2, C1 and A2) is closed. Its spec files are deleted; the last done-note is in
  `docs/spec/SESSIONS.md` as of the review commit before the close (sha filled in by the close).
- **The repo's round 1 close comes next.** The owner held it until this round closed; the root
  `docs/next-session-prompt.md` describes it. It is a repo-level session of its own.
- **Push status.** `origin/main` holds everything through C1's review commit
  (`review(cartoon-fx): a failed frame keeps the queue, and 8 smaller`). Waiting for the next
  approved push: C1's handoff commit, A2's release commit, its review commit and the close. List
  `origin/main..HEAD` before any push, and name any commit that is not this mod's; parallel repo
  sessions share this checkout.
- **The round's desktop check waits for the owner.** The installed release stayed at 0.11.1
  through round 3, by the owner's choice. Once the round is pushed and `claude plugin update
  cartoon-fx` installs 0.16.0, the owner runs `/fx all` and the rest of `docs/BACKLOG.md`'s
  *Round 3 in the desktop* in a new desktop session, with no dialog open over the conversation.
  The next handoff, or the backlog, records what they saw.
- **Open items live in `docs/BACKLOG.md`.** They include that desktop check, muting single
  effects (declined at round 3's intake), and whether `docs/ARCHITECTURE.md` moves to the
  workflow's Decided/Built outline, which is the owner's call at an intake.
- **The CLI on PATH is 2.1.325,** and so is the desktop's engine.
- **Baseline** (`docs/ARCHITECTURE.md`, v0.16.0, CLI 2.1.325): 86 tests; `validate` 13 hooks, 5
  gating (each with a `.catch`), 4 state keys, and no warning but the allowed `CLAUDE.md` one; `tsc`
  and the import scan clean.

## Watch for

- **A drawing's design is settled from rendered frames,** never from a description alone. The
  sessions of round 3 showed drafts as inline widgets in plan mode and checked the frames on a
  scratch contact sheet served on 127.0.0.1 in the browser pane (A1's done-note, in the history).
- **An `animateTransform` replaces its element's own `transform`.** A piece that moves sits in a
  group of its own inside the one that places it (`docs/ARCHITECTURE.md`, *The drawings*).
- **The standing traps** are in the root `CLAUDE.md` and this mod's `CLAUDE.md`, *Watch for*.

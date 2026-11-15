No round is in progress. Read CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
docs/ARCHITECTURE.md's overview, invariants and baseline, then this file; then the sections of
docs/ARCHITECTURE.md the request touches, and any a block will point at. The next session is
an **intake**: write the owner's request down verbatim, ask what it leaves open, and plan the
round in `docs/spec/`, a Read line in every block (see `docs/DEVELOPMENT-WORKFLOW.md`, *Rounds*).
A new mod is not a repo-level round: it starts with `npm run new-mod` and its own intake
(`docs/USER-GUIDE.md`, *Starting a new mod*).

## State you need that is not in the docs

- **Round 1, the repository setup (Sessions 1–3, 3a–3c and 4), is closed.** Its spec files are
  deleted; the last done-note is in `docs/spec/SESSIONS.md` as of Session 4's review commit
  (`390faa627af40e76253a0609aa7066f5212b8b33`).
- **Push status:** Pushed on 2026-11-15 with the owner's approval: `origin/main` holds everything
  through this close (`docs: close round 1`). Nothing waits locally. List `origin/main..HEAD`
  before any push, and name any commit that is not the session's.
- **Open items live in `docs/BACKLOG.md`**, including whether the gate's `claude` stages should
  run with a scratch home, and what going public needs.
- **The owner may remove `~/.claude/mods/cartoon-fx`** when they choose; nothing loads it.
- **Baseline** (`docs/ARCHITECTURE.md`, CLI 2.1.325): `npm run verify` 14 stages PASS; tooling
  tests 166 in 10 files; the template 1 test, 2 hooks, 0 gating; each mod's counts in its own
  baseline.

## Watch for

- **The repo-level docs never describe a mod's internals.** They point at the mod's own
  `docs/ARCHITECTURE.md`, and a mod session cannot edit them.
- **A mod's session may be running beside a repo session.** Its folder is not yours; its
  uncommitted work can turn the full gate red for its folder.
- **cartoon-fx's handoff still names the repo's close as next.** That file is the mod's: its
  next session drops the line when it rewrites the handoff.

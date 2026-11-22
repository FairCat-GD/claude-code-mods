No round is in progress. Read CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
docs/ARCHITECTURE.md's overview, invariants and baseline, then this file; then the sections of
docs/ARCHITECTURE.md the request touches, and any a block will point at. The next session is
an **intake**: write the owner's request down verbatim, ask what it leaves open, and plan the
round in `docs/spec/`, a Read line in every block (see `docs/DEVELOPMENT-WORKFLOW.md`, *Rounds*).
A new mod is not a repo-level round: it starts with `npm run new-mod` and its own intake
(`docs/USER-GUIDE.md`, *Starting a new mod*).

## State you need that is not in the docs

- **Round 2, the gate taking a mod's `tools/` (Session G1), is closed.** Its spec files are
  deleted; the last done-note is in `docs/spec/SESSIONS.md` as of G1's review commit
  (`<sha>`, filled in by the close).
- **possum-squad's Session 6 can run.** The gate now takes a mod's `tools/`: the import scan
  allows a tool's `node:` imports behind the wall, `types` types it, and `tests` runs its
  `*.spec.ts`. Its handoff names this round's close as what it waits for.
- **Push status:** `origin/main` holds everything through `65c36b2` (possum-squad's Session 8
  review). Waiting locally, none pushed, in order:
  - `7b9e3be`, a possum-squad docs commit;
  - `dd87acc`, this round's intake;
  - `61e6d3e`, a possum-squad docs commit;
  - `72d0324`, the intake's review;
  - G1's `feat: the gate takes a mod's tools/`, its `review:` commit, and `docs: close round 2`.

  List `origin/main..HEAD` before any push, and name any commit that is not the session's.
- **Open items live in `docs/BACKLOG.md`;** round 2 added none.
- **Baseline** (`docs/ARCHITECTURE.md`, CLI 2.1.330): `npm run verify` 18 stages PASS; tooling
  tests 180 in 11 files; the template 1 test, 2 hooks, 0 gating; each mod's counts in its own
  baseline.

## Watch for

- **The repo-level docs never describe a mod's internals.** They point at the mod's own
  `docs/ARCHITECTURE.md`, and a mod session cannot edit them.
- **A mod's session may be running beside a repo session.** Its folder is not yours; its
  uncommitted work can turn the full gate red for its folder.
- **The tools' halves have run only on fixtures.** No mod has a `tools/` yet; possum-squad's
  converter will be the first. A failure there that comes from the gate, not the tool, is
  repo-level work.
- **cartoon-fx's handoff still names the repo's round 1 close as next.** That file is the mod's:
  its next session drops the line when it rewrites the handoff.

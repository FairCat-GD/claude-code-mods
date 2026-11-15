Read CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md (and *Rounds*, step 5, the
close), docs/ARCHITECTURE.md's overview, invariants and baseline, docs/spec/SESSIONS.md's header
and Session 4's block with its done-note, then this file, and close round 1. No version.

**Not before cartoon-fx's round 3 is done.** The owner holds the close until cartoon-fx's T2, C1
and A2 are finished, with A2's review committed: check `mods/cartoon-fx/docs/next-session-prompt.md`
says no round is in progress there. Until then a small repo-level fix the owner asks for can
still run, and so can a new mod's intake, at its own level; a new repo-level round waits for the
close, since `docs/spec/` still holds round 1.

## State you need that is not in the specs

- **Round 1 is the repository setup.** Sessions 1–3, 3a, 3b, 3c and 4 are done, each with its
  review. Only the close remains.
- **Push status.** Pushed on 2026-11-15 with the owner's approval: `origin/main` holds
  everything through Session 4's review commit
  (`review: the close's grep gate can pass, and 8 smaller`), cartoon-fx's `ca97ca2` included.
  Nothing waits locally. List `origin/main..HEAD` before any push, and name any commit that is
  not this session's.
- **What the close does,** in one `docs: close round 1` commit:
  1. the entry gate: the tree clean, cartoon-fx's round 3 closed, and no line outside
     `docs/spec/` that sends a reader into the root's spec to read it
     (`grep -rn 'docs/spec/SPEC.md'`). These hits are meant and stay: `docs/ARCHITECTURE.md`'s
     decision log and `docs/BACKLOG.md`'s *Going public*, which name it in history;
     `docs/MOD-KICKOFF.md`, whose paths are a mod's own; and this file's own steps;
  2. `claude --version`; if it moved since 2.1.325, run `npm run types` and the full
     `npm run verify`, and correct `docs/ARCHITECTURE.md`'s baseline line if a count moved;
  3. delete `docs/spec/SPEC.md`, `docs/spec/SESSIONS.md` and `docs/spec/REVIEW-2026-11-14.md`;
  4. replace this file with the between-rounds handoff below, filling in Session 4's review
     commit's sha, the push status and anything the later sessions changed;
  5. the docs-only command with the drafted message, then the commit. The close has no review;
     its message records anything its last read of the diff found.
- **Decisions written down nowhere else:**
  - **The owner may remove `~/.claude/mods/cartoon-fx`** when they choose; nothing loads it.
  - **cartoon-fx's `ARCHITECTURE.md` predates the Decided/Built outline.** Whether it moves to it
    is the owner's call, at a cartoon-fx intake; its backlog says so.
- **Baseline** (`docs/ARCHITECTURE.md`, CLI 2.1.325): `npm run verify` 14 stages PASS; tooling
  tests 166 in 10 files; the template 1 test, 2 hooks, 0 gating; each mod's counts in its own
  baseline.

## The between-rounds handoff the close writes

```markdown
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
  (`<sha>`).
- **Push status:** <what `origin/main` holds, and what waits for the next approved push>.
- **Open items live in `docs/BACKLOG.md`**, including whether the gate's `claude` stages should
  run with a scratch home, and what going public needs.
- **The owner may remove `~/.claude/mods/cartoon-fx`** when they choose; nothing loads it.
- **Baseline** (`docs/ARCHITECTURE.md`, CLI <version>): `npm run verify` <n> stages PASS; tooling
  tests 166 in 10 files; the template 1 test, 2 hooks, 0 gating; each mod's counts in its own
  baseline.

## Watch for

- **The repo-level docs never describe a mod's internals.** They point at the mod's own
  `docs/ARCHITECTURE.md`, and a mod session cannot edit them.
- **A mod's session may be running beside a repo session.** Its folder is not yours; its
  uncommitted work can turn the full gate red for its folder.
```

## Watch for

- **The close changes only docs,** so it runs the docs-only command; nothing in it is read by
  `validate`.
- **A cartoon-fx session may be running beside this one.** Its folder is not yours.

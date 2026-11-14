Read docs/spec/SPEC.md in full, docs/spec/REVIEW-2026-11-14.md, CLAUDE.md, every done-note in
docs/spec/SESSIONS.md (3a–3c's included), mods/cartoon-fx/docs/ARCHITECTURE.md, *The session
cycle* in docs/DEVELOPMENT-WORKFLOW.md, docs/spec/SESSIONS.md's header and Session 4's block with
its amendment, then this file, and do Session 4: the repo's documentation pass; close the round.

No version. The close comes after the review: the review commit carries the last done-note, then
`docs: close round 1` deletes `docs/spec/` and fills in that commit's sha.

## State you need that is not in the specs

- **Round 1 is the repository setup.** Sessions 1–3, 3a, 3b and 3c are done; Session 4 closes
  the round.
- **Push status.** `origin/main` holds everything through 3b's review commit, plus cartoon-fx's
  commits since. 3c's commits are local. List `origin/main..HEAD` before any push, and name any
  commit that is not this session's.
- **What 3c left that Session 4 builds on:**
  - **`npm run new-mod -- <name> "<description>"`** makes a mod: the template renamed throughout,
    0.1.0 dated today, the marketplace entry in name order. It prints the README row, `npm run
    types`, `verify` and the intake. `docs/USER-GUIDE.md` and `docs/MOD-KICKOFF.md` start a mod
    with it.
  - **The template ships `docs/ARCHITECTURE.md`** in the kit's outline, with what every mod
    shares filled in, and a short `docs/USER-GUIDE.md`. A mod's Session 0 writes the rest of its
    architecture from the intake; `MOD-KICKOFF.md` says so.
  - **`scripts/repo.ts` is where the scripts share:** finding and running `claude`, its version,
    the declarations' checks, `report`. The root `ARCHITECTURE.md`'s gate section can name it.
- **Carry to Session 4:**
  - **Pointers to the deleted spec.** The root `CLAUDE.md` (decision 14, §6, §8), the template's
    `CLAUDE.md` and `mods/cartoon-fx/CLAUDE.md` (§8) point at `docs/spec/SPEC.md`, which the close
    deletes. §8 is the practices' one home until Session 4 moves it into `CLAUDE.md`. The template's
    `ARCHITECTURE.md` points into no spec file.
  - **3a's done-note lists what hygiene cannot see,** for `ARCHITECTURE.md`'s testing strategy.
  - **cartoon-fx's `ARCHITECTURE.md` was written as built,** before the kit kept Decided apart
    from Built. Whether it moves to the new outline is the owner's call, at a cartoon-fx intake.
- **cartoon-fx.** Its own state is in its handoff; the repo docs never describe its internals. At
  3c's end, its session had `mods/cartoon-fx/hooks/register.tsx` uncommitted, which turned its
  `validate`, `types` and `tests` red; check its state before measuring the baseline.
- **The owner's term file** is read only through the stage. Never print it, and never let a test
  read it.
- **Decisions written down nowhere else:**
  - **The plugin-authoring skill writes the desktop build's declarations beside itself,** one
    file, not what `tsc` uses here.
  - **`gh` is signed in** as `FairCat-GD`, and git's helper for github.com is
    `gh auth git-credential`. The marketplace clone uses SSH.
  - **The owner may remove `~/.claude/mods/cartoon-fx`** when they choose; nothing loads it.
- **Baseline.** Measure it; do not copy it. At 3c's end, CLI 2.1.325: tooling tests 162 in 10
  files; the template 1 test, `validate` 2 hooks, 0 gating, and `$.command.register`; the 6 repo
  stages and the template's 4 PASS. cartoon-fx's own table is in its `ARCHITECTURE.md`.

## Watch for

- **The baseline is measured, not copied,** and counts 3a's and 3c's tooling tests.
- **The repo-level docs never describe a mod's internals.** They point at the mod's own
  `ARCHITECTURE.md`.
- **Don't make a real mod to try the script.** Try it in a scratch copy of the repository.
- **A cartoon-fx session may be running beside this one.** Its folder is not yours.

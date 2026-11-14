Read docs/spec/REVIEW-2026-11-14.md (F5–F8 and §5), docs/spec/SPEC.md §2 (decisions 4, 7 and
16), §4 (*The layout*, *What a mod is*) and §6 (invariants 2–4), templates/mod-template/,
scripts/repo.ts, scripts/validate.ts, scripts/verify.ts, scripts/types.ts,
scripts/marketplace.ts, scripts/imports.ts and their tests, CLAUDE.md, *The session cycle* in
docs/DEVELOPMENT-WORKFLOW.md, docs/spec/SESSIONS.md's header, your block and 3b's done-note,
then this file, and do Session 3c: ready for a second mod. 3c covers:
- `npm run new-mod -- <name>`, a script that makes a mod from the template;
- the template completed with what a mod's Session 0 builds on;
- `scripts/validate.ts` scrubbing its own environment, and one helper that finds and runs
  `claude`, folding in F8's smaller duplicates where they touch the same code.

No version. Ask the block's two questions at the start.

## State you need that is not in the specs

- **Round 1 is the repository setup.** Sessions 1–3, 3a and 3b are done; 3c and Session 4
  remain. Session 4 closes the round.
  - On 2026-11-14 the owner asked for a review of the repository and of cartoon-fx, then for the
    updated workflow kit to be checked. The review is `docs/spec/REVIEW-2026-11-14.md`; 3a–3c
    are the sessions it inserted, and Session 4's block is amended for them.
- **Push status.** Pushed at the owner's word: `origin/main` holds everything through
  `review: the read order covers an intake and a new mod, and 4 smaller`, 3b's review commit.
  That push carried 3a's commits, cartoon-fx's 0.11.0 and its review, and 3b's four. Nothing
  waits locally. List `origin/main..HEAD` before any push, and name any commit that is not this
  session's.
- **What 3b left that 3c builds on:**
  - **The workflow is the kit's current one,** with this repository's *In this repository*
    paragraph. Its cycle has twelve steps, and step 4, parallel parts, is not used here. The
    chat ends with the one-line opener, never the handoff.
  - **Standing traps live in `CLAUDE.md`'s *Watch for*,** which took in the old *Do not*. A
    handoff carries only its session's own traps now.
  - **`templates/mod-template/CLAUDE.md`** points at the root's read order and has a *Watch for*
    placeholder. Its copy instructions (lines 5–7, through "and the changelog.") are 3c's to
    replace with the script. The SPEC §8 pointer and the sentence after them are Session 4's.
- **What 3a left that 3c builds on:**
  - **`verify` takes stage names and mod names,** and `--message` and `--all` for hygiene. A
    name that is both a stage and a mod exits 2.
  - **`tests/support.ts` has `git` and `scratchRepo`.** Scratch repositories read no git config
    but their own.
- **Carry to 3c:**
  - **The new-mod script must refuse a stage's name** for a mod: `format`, `lint`, `types`,
    `tooling-tests`, `marketplace`, `hygiene`, `validate`, `tests` or `imports`.
  - **`tests/marketplace.test.ts`'s own git calls** are F8's to fold into `tests/support.ts`.
- **Carry to Session 4:**
  - **Pointers to the deleted spec.** The root `CLAUDE.md` (decision 14, §6, §8), the template's
    `CLAUDE.md` and `mods/cartoon-fx/CLAUDE.md` (§8) point at `docs/spec/SPEC.md`, which the
    close deletes. 3b left them: §8 is the practices' one home until Session 4 moves it into
    `CLAUDE.md`.
  - **3a's done-note lists what hygiene cannot see,** for `ARCHITECTURE.md`'s testing strategy.
  - **cartoon-fx's `ARCHITECTURE.md` was written as built,** before the kit kept Decided apart
    from Built. Whether it moves to the new outline is the owner's call, at a cartoon-fx intake.
- **cartoon-fx.** The installed release is 0.10.3, at user scope; 0.11.0 is pushed, and reaches
  the owner on `claude plugin update cartoon-fx`. Its own state is in its handoff, which still
  carries the standing traps until its next rewrite; its `CLAUDE.md` says to move the recurring
  ones there. The repo docs never describe its internals.
- **The owner's term file** is read only through the stage. Never print it, and never let a test
  read it.
- **Decisions written down nowhere else:**
  - **The plugin-authoring skill writes the desktop build's declarations beside itself,** one
    file, not what `tsc` uses here.
  - **`gh` is signed in** as `FairCat-GD`, and git's helper for github.com is
    `gh auth git-credential`. The marketplace clone uses SSH.
  - **The owner may remove `~/.claude/mods/cartoon-fx`** when they choose; nothing loads it.
- **Baseline.** 3b changed docs only and ran the docs-only command, not the full gate. Measure it
  again; do not copy it.
  - At 3a's review, CLI 2.1.325: `npm run verify` 14 stages, all PASS (6 repo, 4 for cartoon-fx,
    4 for `mod-template`); tooling tests 156 in 9 files (hygiene 109 in 4, verify 15); template
    1 test, its `validate` listing 2 hooks, 0 gating, and `$.command.register`.
  - cartoon-fx's own table (its `ARCHITECTURE.md`, v0.11.0): 43 tests; `validate` 13 hooks, 5
    gating (each with a `.catch`), 4 state keys.

## Watch for

- **The script writes only under `mods/<name>/` and the marketplace file,** and its tests only in
  scratch roots. It never touches `~/.claude` (invariant 7).
- **The name chosen at creation is the mod's install id and store key for good** (decision 14).
- **Don't make a real mod to test it.** A real one starts with its own intake, after Session 4.
- **A test of `validate.ts`'s environment must not run the owner's `claude` against their
  setup.** Give it a scratch folder and an environment of its own.
- **A cartoon-fx session may be running beside this one.** Its folder is not yours.

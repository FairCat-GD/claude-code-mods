Read docs/spec/FEATURE-review-effects.md, the root CLAUDE.md, this mod's CLAUDE.md,
docs/ARCHITECTURE.md, then this file. Session C1 of docs/spec/SESSIONS.md is under way: its
reformat is committed, and two parts remain, both in C1's own chat:
- the owner's `/code-review high` of the reformat commit, which is also the 0.10.2 check in the
  desktop, then a `review(cartoon-fx): …` commit with the done-note's *Review* section;
- the close, only if the check passes: anything open moves to `docs/BACKLOG.md`, the spec files
  are deleted, and this file says no round is in progress.

C1 cuts no version. All paths here are inside `mods/cartoon-fx/`; run
`npm run verify -- cartoon-fx` from the repository's root.

## State you need that is not in the specs

- **Round 2 is the code-review effects that never show.** F1 is done (0.10.2). C1's reformat is
  done (`refactor(cartoon-fx): format the copied files with Biome`); its review and the close
  remain.
- **The close follows the review** (amended in the C1 block, with the owner). If the review's
  check shows the effects still hidden, the round stays open, and a fix session is inserted with
  the owner (*Rounds*, step 4) before the close.
- **The 0.10.2 check, by hand in the desktop, under `placement: conversation`:**
  - "Reviewed!" plays under the reply or call just before the findings card;
  - with fixes applied, "Bugs squashed! N review defects fixed" plays the same way. The review
    commit's own "Bugs squashed! review fixes · <sha>", under its Bash row, is a different
    trigger.
  - If the review finds nothing, only "Reviewed!" is seen. That is recorded, the round closes
    anyway, and the fixes effect stays under *Not yet checked by hand* (decided with the owner).
  - It closes *A review's effects beside its card*, *A new session runs an update*, and the
    `/code-review` part of *Real triggers on the installed release*, as far as each was seen.
- **For the close, beyond decision 8's two items:** one F1 measurement goes to *Not yet checked by
  hand*. With the desktop window not in front, a turn's rows came in one burst about 39 s late
  (desktop 2.1.308), past the 900 ms fallback. What plays then was not looked at.
- **Push status.** `origin/main` holds everything through `ed3aaa6`, F1's review commit. The
  `docs(cartoon-fx)` commit that records the update (`b8ab073`, from F1) and C1's commits are
  local. List `origin/main..HEAD` before any push: parallel sessions share this checkout.
- **The installed 0.10.2 keeps the old layout.** C1 cuts no version, so the release differs from
  `HEAD` in layout only.
- **Repo Session 4** has not yet repointed this mod's `CLAUDE.md` at the root `CLAUDE.md` (lines
  9–10, the root SPEC §8 pointer). Leave that line to it.
- **Baseline** (`docs/ARCHITECTURE.md`, v0.10.2, CLI 2.1.310):
  - 35 tests in `tests/cartoon-fx.test.tsx`;
  - `validate`: 13 hooks, 5 gating (each with a `.catch`), 4 state keys, and no warning but the
    allowed `CLAUDE.md` one;
  - `tsc` and the import scan are clean.

## Watch for

- **The standing traps:**
  - **Never `git checkout <path>`.** Falsify by copying the file aside and back.
  - **Stage explicit paths.** Parallel sessions share this checkout.
  - **Give stdin-reading commands `< /dev/null`.** A bare `cat > file` with no heredoc hangs.
  - **The CLI and the desktop engine are different builds,** and the CLI updates itself. Record
    the version each check ran on, and run `npm run types` again when the `types` stage asks.
- **The installed release runs in every session the owner starts,** this mod's own development
  sessions included. So a commit stamps, and `npm run verify` shows the checkmark.
- **Biome now formats every file in this folder.** There is no folder `biome.json` any more.
- **`placement` and `fxTakes` are the owner's data** in `$.store`. Read them forward-only.
- **Comments state the present.** No session ids, no "used to", no review stories.
- **Every push needs its own approval.** List `origin/main..HEAD` first, because parallel
  sessions share this checkout.

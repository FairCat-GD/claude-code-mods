No round is in progress for cartoon-fx. Read the root CLAUDE.md, this mod's CLAUDE.md,
`docs/ARCHITECTURE.md`, then this file. The next session is this mod's round 3 **intake**, when
the owner brings a new idea: write the owner's request down verbatim, ask what it leaves open, and
plan the round in this mod's `docs/spec/` (see the root `docs/DEVELOPMENT-WORKFLOW.md`, *Rounds*).

## State you need that is not in the docs

- **0.10.3 is committed locally, not pushed: `fix(cartoon-fx): naming a test runner is no test
  run (0.10.3)`.** The owner spotted the bug and had it fixed directly, outside any round. A small
  fix the owner points out skips the intake, which is kept for new ideas. So no `docs/spec/` file
  or done-note records it. Its commit message records what was measured and falsified.
  - A test run now counts only when a part of the command starts with its runner, after any
    `VAR=value` words, a `(`, or a launcher. Before, `cat jest.config.js`, `npm ls vitest` and
    `npx playwright install` played "All green!". Playwright counts only as `playwright test`.
  - `parts` in `hooks/detect.ts` is the one split that `gitPart` and `testsPassed` share. Its
    quoting limit is in `docs/BACKLOG.md`.
  - The owner still runs 0.10.2 until a push and `claude plugin update cartoon-fx`.
- **cartoon-fx 0.10.2 is the installed release.** Round 2 (the code-review effects that never
  show: F1, C1) is closed.
  - F1 shipped 0.10.2: a review and its fixes play in the conversation, beside the desktop's
    findings card.
  - C1 formatted the four copied files with Biome and deleted the folder's `biome.json`. Its
    commits are `refactor(cartoon-fx): format the copied files with Biome` and
    `review(cartoon-fx): the handoff keeps the stored placement, and 4 smaller`. The review
    commit holds the round's last done-note in full, in `docs/spec/SESSIONS.md`.
  - The round's spec files are deleted; git history keeps them.
- **The installed 0.10.2 keeps the old layout.** C1 cut no version. 0.10.3 is the first version
  to ship the new layout, beside its fix.
- **0.10.2 is checked in the desktop** (desktop 2.1.308, `placement: conversation`). A
  `/code-review` with findings played "Reviewed!" beside its card, and its fixes played "Bugs
  squashed!" there too.
- **The owner's stored placement is `conversation`.**
- **Push status.** `origin/main` holds everything through `ed3aaa6`, F1's review commit. These
  are local:
  - `b8ab073`, F1's record of the update;
  - C1's three commits;
  - the 0.10.3 fix.

  List `origin/main..HEAD` before any push: parallel sessions share this checkout.
- **Repo Session 4** (the repo's documentation pass) has not run yet. It repoints this mod's
  `CLAUDE.md` (lines 9–10) and `docs/ARCHITECTURE.md` (*Testing strategy*) away from the root
  `docs/spec/SPEC.md`, which it deletes. Leave those lines to it.
- **Open items live in `docs/BACKLOG.md`:**
  - *Deferred:* detection by printed output, the `awaitingLeaderApproval` cast, and commands
    split without parsing quoting;
  - *Not yet checked by hand:* the other real triggers on the installed release, and a review
    with nothing before its card. Also the folded group, the move to the strip, the zones, a
    compaction and live subagents, and `/fx place bottom` across sessions. Also effects while
    the desktop window is not in front.
- **Baseline** (`docs/ARCHITECTURE.md`, v0.10.3, CLI 2.1.310; the fix moved no count):
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
- **A `--plugin-dir mods/cartoon-fx` session replaces the release** for that session
  (`docs/ARCHITECTURE.md`, *Packaging*). Type it as a shell command in a terminal, from the
  repository's root.
- **Biome formats every file in this folder.** There is no folder `biome.json` any more.
- **`placement` and `fxTakes` are the owner's data** in `$.store` (`docs/ARCHITECTURE.md`,
  *Values*). Read them forward-only, and never drop one without a changelog line.
- **The owner's update path is `claude plugin update cartoon-fx`,** and it installs only a new
  `plugin.json` version (`docs/ARCHITECTURE.md`, *Packaging*). A change meant for the owner cuts a
  version, or it never reaches their sessions.
- **Comments state the present.** No session ids, no "used to", no review stories.
- **Every push needs its own approval.** List `origin/main..HEAD` first.

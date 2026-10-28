No round is in progress for cartoon-fx. Read the root CLAUDE.md, this mod's CLAUDE.md,
`docs/ARCHITECTURE.md`, then this file. The next session is this mod's round 3 **intake**, when
the owner brings a new idea: write the owner's request down verbatim, ask what it leaves open, and
plan the round in this mod's `docs/spec/` (see the root `docs/DEVELOPMENT-WORKFLOW.md`, *Rounds*).

## State you need that is not in the docs

- **0.10.3 is pushed: `fix(cartoon-fx): naming a test runner is no test run (0.10.3)`.** The
  owner spotted the bug and had it fixed directly, outside any round. A small
  fix the owner points out skips the intake, which is kept for new ideas. So no `docs/spec/` file
  or done-note records it. Its commit message records what was measured and falsified.
  - A test run now counts only when a part of the command starts with its runner (after
    `VAR=value` words, wrappers, or a launcher and its flags), and its output shows a pass: a
    count or a runner's own mark. Before, `cat jest.config.js`, `npm ls vitest` and
    `npx playwright install` played "All green!". Playwright counts only as `playwright test`.
  - `parts` in `hooks/detect.ts` is the one split that `gitPart` and `testsPassed` share. Its
    quoting limit is in `docs/BACKLOG.md`.
  - **The owner's `/code-review high` found 8 issues, and all 8 are fixed** in
    `review(cartoon-fx): wrappers and launcher flags count again, and 7 smaller`:
    - the first anchor dropped real runs behind `timeout`, `bash -c`, `{ …; }`, `npx -y`,
      `bun run`, `uvx`, a `node_modules/.bin` path, and quoted env values;
    - a pass in the output is now required, not only the absence of a failure;
    - a part starting `jest.config.js` no longer counts;
    - a positive piped-run test, and the pattern built from named pieces (`LEAD`, `FLAGS`,
      `LAUNCHER`, `RUNNERS`);
    - changelog links for 0.10.2 and 0.10.3.
- **0.10.3 is the installed release** (2026-10-28, CLI 2.1.310). `claude plugin update
  cartoon-fx` reported `updated from 0.10.2 to 0.10.3 for scope user. Restart to apply changes.`
  - It added a `0.10.3/` folder beside `0.10.1/` and `0.10.2/`. That folder is byte for byte
    the pushed commit's `mods/cartoon-fx/`, 15 files, apart from the engine's `.in_use`
    markers.
  - `installed_plugins.json` names that folder and the review commit's sha.
  - The store file's checksum was the same before and after, so `placement` and `fxTakes` are
    unchanged.
  - Sessions opened before the update keep 0.10.2 until restarted.
  - Nobody has checked 0.10.3 by hand in a live session yet. In a new session, `cat` a config
    file should play nothing, and `npm run verify` should still play "All green!" with its count.
- **Round 2** (the code-review effects that never show: F1, C1) is closed.
  - F1 shipped 0.10.2: a review and its fixes play in the conversation, beside the desktop's
    findings card.
  - C1 formatted the four copied files with Biome and deleted the folder's `biome.json`. Its
    commits are `refactor(cartoon-fx): format the copied files with Biome` and
    `review(cartoon-fx): the handoff keeps the stored placement, and 4 smaller`. The review
    commit holds the round's last done-note in full, in `docs/spec/SESSIONS.md`.
  - The round's spec files are deleted; git history keeps them.
- **0.10.2 is checked in the desktop** (desktop 2.1.308, `placement: conversation`). A
  `/code-review` with findings played "Reviewed!" beside its card, and its fixes played "Bugs
  squashed!" there too.
- **The owner's stored placement is `conversation`.**
- **Push status.** `origin/main` holds everything through
  `docs(cartoon-fx): record what the update to 0.10.3 installed`. Nothing is local.

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
- **Baseline** (`docs/ARCHITECTURE.md`, v0.10.3, CLI 2.1.310; the review added one test):
  - 36 tests in `tests/cartoon-fx.test.tsx`;
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

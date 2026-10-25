No round is in progress for cartoon-fx. Read the root CLAUDE.md, this mod's CLAUDE.md,
`docs/ARCHITECTURE.md`, then this file. The next session is this mod's round 2 **intake**: write
the owner's request down verbatim, ask what it leaves open, and plan the round in this mod's
`docs/spec/` (see the root `docs/DEVELOPMENT-WORKFLOW.md`, *Rounds*).

## State you need that is not in the docs

- **cartoon-fx 0.10.1 is in the repository, and the owner runs it as the installed release.**
  - It came in byte for byte from the folder it was built in, plus `author` and `license` in
    `plugin.json`.
  - Its round 1 ran before this repository and outside the workflow. It counts as finished, so the
    next round is round 2.
  - It is installed at user scope as `cartoon-fx@claude-code-mods`, from commit `3f79906`. The
    folder copy that ran before (`~/.claude/mods/cartoon-fx`, through `CLAUDE_CODE_PLUGIN_DIRS`)
    no longer loads; the owner may remove that folder.
- **Its as-built docs exist:** `docs/ARCHITECTURE.md` and `docs/USER-GUIDE.md`, written from the
  code alone. No note from the chat that built it was available.
- **The intake may start now.** The repository's round 1 has one session left (repo Session 4,
  its documentation pass). That session touches this mod only to repoint its `CLAUDE.md` at the
  root `CLAUDE.md` once the root SPEC §8 is gone.
- **Push status** is in the root `docs/next-session-prompt.md`, which every repo session
  rewrites.
- **Open items live in `docs/BACKLOG.md`:**
  - *Deferred:* the Biome reformat, detection by printed output, the `drawnRows` clear, and the
    casts;
  - *Not yet checked by hand:* the real triggers on the installed release, and the update path.
- **Baseline** (`docs/ARCHITECTURE.md`; CLI 2.1.310):
  - 28 tests in `tests/cartoon-fx.test.tsx`;
  - `validate`: 12 hooks, 5 gating (each with a `.catch`), 4 state keys, and no warning but the
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
- **`placement` and `fxTakes` are the owner's data** in `$.store` (`docs/ARCHITECTURE.md`,
  *Values*). Read them forward-only, and never drop one without a changelog line.
- **The owner's update path is `claude plugin update cartoon-fx`,** after a push. What they run
  every day is what was pushed.
- **This folder has its own `biome.json`** (see this mod's `CLAUDE.md`).
- **Comments state the present.** No session ids, no "used to", no review stories.

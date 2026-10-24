No round is in progress for cartoon-fx. Read the root CLAUDE.md, this mod's CLAUDE.md,
`docs/ARCHITECTURE.md` once it exists, then this file. The next session is this mod's round 2
**intake**: write the owner's request down verbatim, ask what it leaves open, and plan the round in
this mod's `docs/spec/` (see the root `docs/DEVELOPMENT-WORKFLOW.md`, *Rounds*).

## State you need that is not in the docs

- **cartoon-fx 0.10.1 is in the repository.**
  - It came in byte for byte from the folder it was built in, plus `author` and `license` in
    `plugin.json`.
  - Its round 1 ran before this repository and outside the workflow. It counts as finished, so the
    next round is round 2.
- **The repository's own round 1 has work on this mod before the intake.** Its Session 3:
  - switches the owner from the live folder copy to the installed release;
  - measures how `$.store` values are keyed;
  - writes this mod's `docs/ARCHITECTURE.md` and `docs/USER-GUIDE.md`.

  Start the intake only once the root `docs/next-session-prompt.md` says that session is done.
- **Push status** is in the root `docs/next-session-prompt.md`, which every repo session
  rewrites.
- **Open items live in `docs/BACKLOG.md`.** The one there: reformat with Biome and delete this
  folder's `biome.json`.
- **Baseline** (measured at the import, CLI 2.1.310):
  - 28 tests in `tests/cartoon-fx.test.tsx`;
  - `validate`: 12 hooks, 5 gating (each with a `.catch`), 4 state keys, and no warning but the
    allowed `CLAUDE.md` one;
  - `tsc` and the import scan are clean.

## Watch for

- **The standing traps:**
  - **Never `git checkout <path>`.** Falsify by copying the file aside and back.
  - **Stage explicit paths.** Parallel sessions share this checkout.
  - **Give stdin-reading commands `< /dev/null`.** A bare `cat > file` with no heredoc hangs.
  - **A shell in the desktop app exports `CLAUDE_CODE_PLUGIN_DIRS`.** A `claude` started from it
    loads the owner's live mods. The gate and `npm run types` remove it; by hand, run
    `env -u CLAUDE_CODE_PLUGIN_DIRS claude …`.
  - **The CLI and the desktop engine are different builds,** and the CLI updates itself. Record
    the version each check ran on, and run `npm run types` again when the `types` stage asks.
- **`placement` and `fxTakes` are the owner's data** in `$.store`. Read them forward-only, and
  never drop one without a changelog line.
- **This folder has its own `biome.json`** (see this mod's `CLAUDE.md`).
- **Comments state the present.** No session ids, no "used to", no review stories.

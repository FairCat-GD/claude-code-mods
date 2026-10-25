Read docs/spec/FEATURE-review-effects.md, the root CLAUDE.md, this mod's CLAUDE.md,
docs/ARCHITECTURE.md, then this file. Then do Session F1 of docs/spec/SESSIONS.md: a
`/code-review`'s "Reviewed!" and "Bugs squashed!" play in the conversation, as every other effect
does. F1 has four parts:
- measure what the desktop draws for a `ReportFindings` call;
- draw the two effects there, with the fallback intact;
- one named type for the report's input;
- `drawnRows` evicts its oldest row past 200.

Release 0.10.2. All paths here are inside `mods/cartoon-fx/`; run `npm run verify -- cartoon-fx`
from the repository's root.

## State you need that is not in the specs

- **Round 2 is the code-review effects that never show.** Its intake is done: F1 and C1 remain.
- **Push status.** `origin/main` held everything through `d23450f` when the intake started. The
  intake's commit and its review commit are local, not pushed. List `origin/main..HEAD` before any
  push: parallel sessions share this checkout.
- **The installed release is 0.10.1,** `cartoon-fx@claude-code-mods`, from commit `3f79906`. It
  runs in every session the owner starts, this one included.
- **What the intake established** (`FEATURE-review-effects.md` has the detail):
  - The trigger fires. Both reports come from the main conversation, shaped as the hook reads
    them.
  - Under `/fx place bottom`, the owner saw "Reviewed!" in the strip, in the desktop app.
  - Under `conversation`, nothing shows. The desktop draws the report as its own findings card,
    and the `ToolUse` hook still marks the row drawn, so the 900 ms fallback never runs.
  - Still inferred, not measured: what the desktop raises around the card, and that "Bugs
    squashed!" fails the same way.
- **The code F1 touches, as it is now** (`hooks/register.tsx`):
  - `rowOf` at `:83`, `drawnRows`/`noteDrawn` at `:86-92`, `play` at `:103-113`, and
    `toStripUnlessDrawn` at `:115-124`;
  - `reviewReported` at `:143-156`, and the every-tool `tool.call` hook at `:253-265`, with the
    two casts at `:259-260`;
  - the `ToolUse` render hook at `:344-357`.
  - The tests that mount a review's effect under its `ToolUse` row are at
    `tests/cartoon-fx.test.tsx:190-220`.
- **Decisions written down nowhere else:** the owner does not want the review effects moved to
  the strip as the fix ("i don't like them playing in that bottom mode"). The strip stays a
  fallback and the `bottom` placement, as for every effect.
- **Baseline** (`docs/ARCHITECTURE.md`, v0.10.1, CLI 2.1.310):
  - 28 tests in `tests/cartoon-fx.test.tsx`;
  - `validate`: 12 hooks, 5 gating (each with a `.catch`), 4 state keys, and no warning but the
    allowed `CLAUDE.md` one;
  - `tsc` and the import scan are clean.
  - F1 adds tests, and may add a render hook.
- **Repo Session 4** (the repo's documentation pass) may still be open. It touches this mod only
  to repoint its `CLAUDE.md`. Leave that file's uncommitted changes alone.

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
- **The owner's update path is `claude plugin update cartoon-fx`,** and it installs only a new
  `plugin.json` version (`docs/ARCHITECTURE.md`, *Packaging*). A change meant for the owner cuts a
  version, or it never reaches their sessions.
- **This folder has its own `biome.json`** (see this mod's `CLAUDE.md`).
- **A terminal session cannot show the desktop's rows.** `--plugin-dir` runs only in a terminal,
  and the terminal draws every effect in the strip. Settle how F1 sees the desktop's findings card
  at the start (the block's *Ask at the start*). A probe in the session mods folder touches the
  owner's setup and needs their OK.
- **Comments state the present.** No session ids, no "used to", no review stories.
- **Every push needs its own approval.** List `origin/main..HEAD` first, because parallel
  sessions share this checkout.

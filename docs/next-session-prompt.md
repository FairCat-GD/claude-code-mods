Read docs/spec/SPEC.md (§2 decisions 11, 13, 14, with their amendments; §6 invariant 7; §7; §8),
CLAUDE.md, mods/cartoon-fx/CLAUDE.md and cartoon-fx's sources, then this file, and do Session 3
of docs/spec/SESSIONS.md: cartoon-fx as an installed release, and its as-built docs. Session 3 has
two parts:
- the switch: record the owner's stored values, measure how `$.store` is keyed, install from the
  marketplace, remove the `CLAUDE_CODE_PLUGIN_DIRS` entry with the owner's OK, check by hand, and
  measure what the installed copy holds and what a `--plugin-dir` session does beside it;
- the as-built docs: cartoon-fx's `docs/ARCHITECTURE.md` and `docs/USER-GUIDE.md`, its backlog,
  and its `CLAUDE.md`'s ARCHITECTURE paragraph.

No code changes and no version: cartoon-fx stays at 0.10.1.

## State you need that is not in the specs

- **Round 1 is the repository setup.** Sessions 0, 1 and 2 are done; Sessions 3 and 4 remain.
- **Push status.** `origin/main` holds everything through `review: types re-reads the CLI after
  its session, and 9 smaller`. Session 2's commits wait for the owner's push approval at its end:
  - `feat(cartoon-fx): import cartoon-fx as it runs today, at 0.10.1`;
  - `docs: Session 2 done-note and handoff`;
  - its review commit.

  List `origin/main..HEAD` before any push. **If they are not on `origin/main`,** the install
  cannot run. The owner then chooses (the block's *Ask at the start*): push now, or run the docs
  half alone and move the switch to a session inserted after it. Either way, log the choice as an
  amendment.
- **What Session 2 left that Session 3 builds on:**
  - **`mods/cartoon-fx/`** is the live mod byte for byte, plus two lines of `plugin.json`
    (`author`, `license`) and these new files:
    - `CLAUDE.md`, `CHANGELOG.md` (one `[0.10.1]` entry) and `README.md`;
    - `docs/BACKLOG.md` and `docs/next-session-prompt.md`;
    - its own `biome.json`.
  - **Its `biome.json`** (`root: false`, `extends: "//"`) turns off the formatter and
    `noUnusedFunctionParameters` for the folder. The owner chose this over reformatting the
    copied code; the reformat is in its backlog.
  - **`.claude-plugin/marketplace.json`** lists cartoon-fx, source `./mods/cartoon-fx`. The
    install line is
    `claude plugin install cartoon-fx --marketplace FairCat-GD/claude-code-mods`, or the
    `cartoon-fx@claude-code-mods` id.
  - **The README's table of mods** is `Mod | What it does`. It no longer has a Version column.
  - **cartoon-fx's machine identifiers** are in its `CLAUDE.md`:
    - the `$.state` keys `shown`, `isYellow`, `isRed` and `placement`;
    - the `$.store` keys `placement` and `fxTakes`, which are the owner's data.
  - **cartoon-fx's handoff** says that its next session is its round 2 intake, after this one.
- **What the spec said that turned out wrong or harder:**
  - **`npx biome format mods/cartoon-fx` on its own exits 1** ("no files were processed"), because
    its formatter is off. `verify` passes it with the tooling's paths beside it.
  - **An `eval` at module load fails `claude plugin test` too:** the engine refuses it, so that
    falsification fails `lint` and `tests` together.
- **Decisions written down nowhere else:**
  - **To falsify the hygiene stage,** add a throwaway word and its hash to
    `scripts/hygiene_terms.txt`, watch the stage fail, then remove both. The terms are never
    written into the repository.
  - **cartoon-fx as found at intake** is at `~/.claude/mods/cartoon-fx`. It loads live in every
    session through `CLAUDE_CODE_PLUGIN_DIRS` in `~/.claude/settings.json`. It is eight files, and
    it has no `.claude-plugin/types/`, which Session 2 checked again after `npm run types`.
  - **The plugin-authoring skill writes the desktop build's declarations beside itself** under
    `/private/tmp/claude-501/bundled-skills/<version>/…/plugin-authoring/types/claude-code.d.ts`.
    It is one file, and is not what `tsc` uses here. The `<version>` folder there names the
    desktop build: 2.1.308.
  - **`gh` is signed in** as `FairCat-GD` (HTTPS, `repo` scope). `~/.claude/settings.json` already
    sets `includeCoAuthoredBy: false` and empty `attribution`.
- **Baseline** (Session 2's done-note, CLI 2.1.310):
  - `npm run verify`: 14 stages, all PASS (6 repo, 4 for cartoon-fx, 4 for `mod-template`).
  - Tooling tests: 48 in 6 files.
  - Template tests: 1.
  - cartoon-fx: 28 tests in one file. `validate` reports:
    - 12 hooks, 5 gating (all with `.catch`) and 4 state keys;
    - no warning but the allowed `CLAUDE.md` one.

    Session 3 moves none of these.
- **Not done:** nothing in Session 2's scope.

## Watch for

- **The standing traps:**
  - **Never `git checkout <path>`.** Falsify by copying the file aside and back.
  - **Stage explicit paths.** Parallel sessions share this checkout.
  - **Give stdin-reading commands `< /dev/null`.** A bare `cat > file` with no heredoc hangs.
  - **The toolchain on this Mac:**
    - node 26.7.0 and npm 11.19.0 in `/opt/homebrew/bin`;
    - `claude` at `~/.local/bin/claude`, a link to the newest of `~/.local/share/claude/versions/`
      (2.1.310 at Session 2's end);
    - `gh` 2.97.0 and uv 0.12.3 in `~/.local/bin`;
    - git 2.50.1;
    - no global `tsc` or bun; use `npx tsc` and `npx biome`.
  - **The CLI and the desktop engine are different builds,** and the CLI updates itself. Record
    the version each check ran on, from `claude --version`.
  - **A shell in the desktop app exports `CLAUDE_CODE_PLUGIN_DIRS`.** A `claude` started from it
    loads the owner's live cartoon-fx, and an interactive one would lay declarations into
    `~/.claude/mods/cartoon-fx`. The gate and `npm run types` remove it; by hand, run
    `env -u CLAUDE_CODE_PLUGIN_DIRS claude …`.
  - **The owner's Claude Code setup is live:**
    - `~/.claude/settings.json`;
    - `~/.claude/mods/cartoon-fx`, running in every session;
    - the installed plugins.

    No session changes any of it without the owner's OK (invariant 7).
  - **Loading the plugin-authoring skill starts a watch on this session's mods folder.** Write
    nothing under `~/.claude/dev-mods/`.
  - **The file-writing tool writes ` ` and ` ` escapes as the characters themselves.**
    Inside a regex that breaks the line. Check with `od -c`, and fix with
    `perl -CSD -pi -e 's/\x{2028}/\\u2028/g'`.
  - **Nothing private in any file or commit message** (`CLAUDE.md`).
- **Session 3's own traps** are in its block:
  - the owner is at the keyboard for every change to their setup;
  - plugins load when a session starts, so checking the installed copy takes a new session;
  - a private repository installs only where git holds a credential for github.com;
  - the note from cartoon-fx's original chat may name people or projects, so keep the reasons
    and drop the names;
  - where the note and the code disagree, the code wins.
- **The stored values come first.** Record `/fx commit`'s take number and where it played
  before anything changes. Steps 4 and 5 (install, then remove the old entry) run back to back,
  so that no session loads two copies.
- **cartoon-fx reacts to this repo's own work.** In the owner's sessions a commit stamps, and
  `npm run verify` shows the checkmark. That is the live mod working, not a fault.
- **Comments state the present, briefly.** No session ids, no "used to", no review stories, no
  paragraphs.
- **Every push needs its own approval.** List `origin/main..HEAD` first.

Read docs/spec/SPEC.md in full (with its amendments), CLAUDE.md, every done-note in
docs/spec/SESSIONS.md, and mods/cartoon-fx/docs/ARCHITECTURE.md, then this file, and do Session 4
of docs/spec/SESSIONS.md: the repo's documentation pass, then close round 1. It writes
`docs/ARCHITECTURE.md` (with its measured baseline), `docs/USER-GUIDE.md` and
`docs/MOD-KICKOFF.md`, makes the README truthful, and moves SPEC §8 into `CLAUDE.md`. Then
`docs/BACKLOG.md` gets what is still open, and a separate `docs: close round 1` commit deletes
`docs/spec/` and rewrites this handoff between rounds.

## State you need that is not in the specs

- **Round 1 is the repository setup.** Sessions 0–3 are done; Session 4, the last, remains.
- **Push status.** Everything is pushed: `origin/main` holds everything through
  `review: npm run types skips user settings, and 3 smaller`, so `origin/main..HEAD` is empty.
  The installed cartoon-fx stays at `3f79906` until a new version is pushed (SPEC decision 11,
  amended). List `git log origin/main..HEAD` before any push,
  and name any commit that is not this session's.
- **What Session 3 left that Session 4 builds on:**
  - **The owner runs cartoon-fx as the installed release,** `cartoon-fx@claude-code-mods`
    0.10.1, at user scope, from commit `3f79906`. The `CLAUDE_CODE_PLUGIN_DIRS` entry is gone from
    `~/.claude/settings.json`, which now has `"env": {}`. The removed line is in Session 3's
    done-note.
  - **Distribution, as measured** (for `docs/ARCHITECTURE.md` and `docs/USER-GUIDE.md`):
    - the installed copy is every tracked file of the mod's folder at the pushed commit, in
      `~/.claude/plugins/cache/claude-code-mods/<mod>/<version>/` (SPEC §4, amended);
    - the marketplace is a clone of the whole repository, in
      `~/.claude/plugins/marketplaces/claude-code-mods/`, added in user settings by
      `claude plugin install … --marketplace FairCat-GD/claude-code-mods`;
    - `$.store` is keyed by the plugin id (SPEC decision 14, amended);
    - a `claude --plugin-dir mods/<name>` session replaces the installed copy, with its own store
      (root `CLAUDE.md`).
  - **cartoon-fx's as-built docs exist:** `docs/ARCHITECTURE.md` (with its baseline),
    `docs/USER-GUIDE.md` and its backlog. The repo docs point at them and never restate the mod's
    internals.
- **Decisions written down nowhere else:**
  - **To falsify the hygiene stage,** add a throwaway word and its hash to
    `scripts/hygiene_terms.txt`, watch the stage fail, then remove both.
  - **The plugin-authoring skill writes the desktop build's declarations beside itself** under
    `/private/tmp/claude-501/bundled-skills/<version>/…/plugin-authoring/types/claude-code.d.ts`.
    It is one file, and is not what `tsc` uses here.
  - **`gh` is signed in** as `FairCat-GD`, and git's helper for github.com is
    `gh auth git-credential`. The marketplace clone uses SSH.
  - **The owner may remove `~/.claude/mods/cartoon-fx`** when they choose; nothing loads it now.
- **Baseline** (Session 3's done-note, CLI 2.1.310), to measure again, not copy:
  - `npm run verify`: 14 stages, all PASS (6 repo, 4 for cartoon-fx, 4 for `mod-template`).
  - Tooling tests: 48 in 6 files.
  - Template tests: 1. Its `validate` lists 2 hooks, 0 gating, and calls `$.command.register`.
  - cartoon-fx: 28 tests in one file. `validate` lists 12 hooks, 5 gating (all with `.catch`) and
    4 state keys, with no warning but the allowed `CLAUDE.md` one.
- **Not done:** nothing in Session 3's scope. An update to a new version is in cartoon-fx's backlog
  under *Not yet checked by hand*.
- **After Session 3:** at the owner's word, `claude plugin update cartoon-fx` ran after the push. It
  refreshed the marketplace clone to `49a3d50` and left cartoon-fx at 0.10.1 from `3f79906`,
  because the version had not changed. Decision 11 is amended. Session 4's `docs/ARCHITECTURE.md`
  and `docs/USER-GUIDE.md` describe updating this way: a change reaches the owner only with a
  version bump.
- **Carry to the close:** `mods/cartoon-fx/CLAUDE.md` points at the root's `docs/spec/SPEC.md` §8
  for the practices, as the template's does. Session 4's block moves §8 into `CLAUDE.md` and
  changes the root's and the template's pointers. cartoon-fx's needs the same change, as a mod
  file touched by a repo session, in its own scoped commit, as in Sessions 2 and 3.

## Watch for

- **The standing traps:**
  - **Never `git checkout <path>`.** Falsify by copying the file aside and back.
  - **Stage explicit paths.** Parallel sessions share this checkout.
  - **Give stdin-reading commands `< /dev/null`.** A bare `cat > file` with no heredoc hangs.
  - **The toolchain on this Mac:**
    - node 26.7.0 and npm 11.19.0 in `/opt/homebrew/bin`;
    - `claude` at `~/.local/bin/claude`, a link to the newest of `~/.local/share/claude/versions/`
      (2.1.310 at Session 3's end);
    - `gh` 2.97.0 and uv 0.12.3 in `~/.local/bin`;
    - git 2.50.1;
    - no global `tsc` or bun; use `npx tsc` and `npx biome`.
  - **The CLI and the desktop engine are different builds,** and the CLI updates itself. Record
    the version each check ran on, from `claude --version`.
  - **The installed cartoon-fx runs in every session the owner starts.** A commit stamps, and
    `npm run verify` shows the checkmark. That is the release working, not a fault.
  - **A desktop session started before the switch** still exports `CLAUDE_CODE_PLUGIN_DIRS` to its
    shells and runs the folder copy until it ends. The gate and `npm run types` remove the
    variable; leave those guards in place.
  - **The owner's Claude Code setup is live:** `~/.claude/settings.json`, the installed plugins
    and marketplaces, `~/.claude/mods/`, and a mod's stored values. No session changes any of it
    without the owner's OK (invariant 7).
  - **Loading the plugin-authoring skill starts a watch on this session's mods folder.** Write
    nothing under `~/.claude/dev-mods/`.
  - **The file-writing tool writes the `\u2028` and `\u2029` escapes as the characters
    themselves.** Inside a regex that breaks the line. Check with `od -c`, and fix with
    `perl -CSD -pi -e 's/\x{2028}/\\u2028/g'`.
  - **Nothing private in any file or commit message** (`CLAUDE.md`).
- **Session 4's own traps** are in its block:
  - the baseline is measured, not copied;
  - the repo docs never describe a mod's internals;
  - the review follows the close, so its findings go in the review commit and the handoff.
- **Every path and command the new docs name** is checked to exist or to run.
- **Comments state the present, briefly.** No session ids, no "used to", no review stories, no
  paragraphs.
- **Every push needs its own approval.** List `origin/main..HEAD` first.

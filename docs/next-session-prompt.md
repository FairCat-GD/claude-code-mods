Read docs/spec/REVIEW-2026-11-14.md (F3, F4, F10 and §5), the SPEC.md sections Session 3a's
Read line names, CLAUDE.md, then this file, and do Session 3a of docs/spec/SESSIONS.md: the gate
per the updated workflow kit. Hygiene reads the owner's term file instead of hashes in the
repository, checks the drafted message before the commit, secrets and conflict markers, and
`verify` runs named stages. Ask the owner to attach the workflow kit's `KICKOFF.md` and
`DEVELOPMENT-WORKFLOW.md` at the start. No version.

## State you need that is not in the specs

- **Round 1 is the repository setup.** Sessions 1–3 are done. On 2026-11-14 the owner asked for
  a review of the repository and of cartoon-fx, then for the updated workflow kit to be checked.
  The review is `docs/spec/REVIEW-2026-11-14.md`. From it, 3a, 3b and 3c were inserted before
  Session 4, which closes the round; Session 4's block is amended for them.
- **This review broke one-level-per-chat once, with the owner's OK:** its evidence existed only
  in that chat, so it wrote the repository's plan and cartoon-fx's round 3 intake, each in
  commits of its own level. cartoon-fx's round 3 (A1 first) runs beside 3a–4, in the same
  checkout.
- **Push status.** `origin/main` holds everything through
  `docs(cartoon-fx): record what the update to 0.10.3 installed`. The review's three commits wait
  for the next approved push: this level's, cartoon-fx's test-only fix, and cartoon-fx's
  round 3 intake. List `origin/main..HEAD` before any push and name any commit that
  is not this session's.
- **cartoon-fx** is the installed release 0.10.3, at user scope; its own state is in its
  handoff, and the repo docs never describe its internals.
- **The owner's term file exists** at `~/.config/hygiene/terms.txt`. Read it only through the
  stage; never print it, and never let a test read it.
- **Decisions written down nowhere else:**
  - **The plugin-authoring skill writes the desktop build's declarations beside itself,** one
    file, not what `tsc` uses here.
  - **`gh` is signed in** as `FairCat-GD`, and git's helper for github.com is
    `gh auth git-credential`. The marketplace clone uses SSH.
  - **The owner may remove `~/.claude/mods/cartoon-fx`** when they choose; nothing loads it.
- **Baseline**, measured at the review on CLI 2.1.325, to measure again, not copy:
  - `npm run verify`: 14 stages, all PASS (6 repo, 4 for cartoon-fx, 4 for `mod-template`).
  - Tooling tests: 48 in 6 files.
  - Template tests: 1. Its `validate` lists 2 hooks, 0 gating, and calls `$.command.register`.
  - cartoon-fx: 36 tests. `validate` lists 13 hooks, 5 gating (all with `.catch`) and 4 state
    keys, with no warning but the allowed `CLAUDE.md` one.
- **The CLI moved twice during the review** (2.1.323, then 2.1.325 during `npm run types`), and
  2.1.325's new `isCollapsed` prop turned cartoon-fx's gate red until a test-only fix
  (the review's F11). Expect a CLI update to need more than `npm run types` now and then.
- **Carry to Session 4:** `mods/cartoon-fx/CLAUDE.md` and the template's `CLAUDE.md` point at the
  root's `docs/spec/SPEC.md` §8, which the close deletes; 3b or Session 4 repoints them, the
  former in its own scoped commit.

## Watch for

- **The standing traps:**
  - **Never `git checkout <path>`.** Falsify by copying the file aside and back.
  - **Stage explicit paths.** Parallel sessions share this checkout.
  - **Give stdin-reading commands `< /dev/null`.** A bare `cat > file` with no heredoc hangs.
  - **The toolchain on this Mac:** node 26.7.0 and npm 11.19.0 in `/opt/homebrew/bin`; `claude`
    at `~/.local/bin/claude`, a link to the newest of `~/.local/share/claude/versions/`; `gh`
    2.97.0 and uv 0.12.3 in `~/.local/bin`; git 2.50.1; no global `tsc` or bun, so use
    `npx tsc` and `npx biome`.
  - **The CLI and the desktop engine are different builds,** and the CLI updates itself, even
    during `npm run types`. Record the version each check ran on, from `claude --version`.
  - **The installed cartoon-fx runs in every session the owner starts.** A commit stamps, and
    `npm run verify` shows the checkmark.
  - **The owner's Claude Code setup is live:** `~/.claude/settings.json`, the installed plugins
    and marketplaces, `~/.claude/mods/`, and a mod's stored values. No session changes any of it
    without the owner's OK (invariant 7). The owner's term file joins that list for 3a.
  - **Loading the plugin-authoring skill starts a watch on this session's mods folder.** Write
    nothing under `~/.claude/dev-mods/`.
  - **The file-writing tool writes the ` ` and ` ` escapes as the characters
    themselves.** Inside a regex that breaks the line. Check with `od -c`, and fix with
    `perl -CSD -pi -e 's/\x{2028}/\\u2028/g'`.
  - **Nothing private in any file or commit message** (`CLAUDE.md`).
- **3a's own traps** are in its block: tests never read the owner's term file or the real stamp,
  and the stage's source never holds what it bans.
- **A cartoon-fx session may be running beside this one.** Its folder is not yours.
- **Comments state the present, briefly.** No session ids, no "used to", no review stories.
- **Every push needs its own approval.** List `origin/main..HEAD` first.

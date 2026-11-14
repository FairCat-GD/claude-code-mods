Read docs/spec/REVIEW-2026-11-14.md (F2, F12 and §5), the SPEC.md sections Session 3b's Read
line names, CLAUDE.md, then this file, and do Session 3b of docs/spec/SESSIONS.md: the workflow
per the updated workflow kit. `docs/DEVELOPMENT-WORKFLOW.md` is re-copied verbatim but for its
*In this repository* paragraph; `CLAUDE.md`'s protocol follows the new cycle and takes a *Watch
for* section. Ask the owner at the start where the kit's `DEVELOPMENT-WORKFLOW.md` is, or to
attach it; 3a read the kit from its folder on this Mac, with the owner's OK. Docs only, so the
gate is the docs-only command. No version.

## State you need that is not in the specs

- **Round 1 is the repository setup.** Sessions 1–3 and 3a are done.
  - On 2026-11-14 the owner asked for a review of the repository and of cartoon-fx, then for the
    updated workflow kit to be checked. The review is `docs/spec/REVIEW-2026-11-14.md`.
  - From it, 3a, 3b and 3c were inserted before Session 4, which closes the round. Session 4's
    block is amended for them.
- **3a rebuilt the gate.** Its done-note has the detail. What 3b needs:
  - **Hygiene reads the owner's term file,** `~/.config/hygiene/terms.txt`.
    - A routine run reads what a commit could still change, the drafted message included.
    - A full scan runs on `--all`, and whenever the stamp `.git/hygiene-scanned` is older than
      the term file or `scripts/hygiene.ts`.
    - The first full scan was clean: 0 hits in files, 0 in pushed history.
  - **`verify` takes stage names and mod names,** and `--message` and `--all` for hygiene.
  - **The docs-only command** is
    `npm run verify -- hygiene --message "$(git rev-parse --git-dir)/COMMIT_DRAFT"`.
  - **`CLAUDE.md` already holds:**
    - the hygiene paragraph of the privacy section;
    - rule 1's draft and docs-only lines;
    - the Commands rows;
    - *Git*'s commit step.

    3b builds the new protocol around them. It adds the kit's "no names of the owner's other
    projects, and none of their data" to the privacy rules, and does not rewrite the stage's
    description.
- **This review broke one-level-per-chat once, with the owner's OK.** Its evidence existed only
  in that chat, so it wrote the repository's plan and cartoon-fx's round 3 intake, each in
  commits of its own level. cartoon-fx's round 3 (A1 first) runs beside 3a–4, in the same
  checkout.
- **Push status.**
  - `origin/main` holds everything through
    `review(cartoon-fx): desktop checks wait for the push, and 7 smaller`.
  - Local and unpushed: 3a's commit, its review commit, and any commits from a cartoon-fx session.
  - List `origin/main..HEAD` before any push, and name any commit that is not this session's.
- **cartoon-fx.**
  - It is the installed release 0.10.3, at user scope. Its own state is in its handoff, and the
    repo docs never describe its internals.
  - During 3a a cartoon-fx session had uncommitted work in `mods/cartoon-fx/`.
- **The owner's term file** is read only through the stage. Never print it, and never let a test
  read it.
- **Decisions written down nowhere else:**
  - **The plugin-authoring skill writes the desktop build's declarations beside itself,** one
    file, not what `tsc` uses here.
  - **`gh` is signed in** as `FairCat-GD`, and git's helper for github.com is
    `gh auth git-credential`. The marketplace clone uses SSH.
  - **The owner may remove `~/.claude/mods/cartoon-fx`** when they choose; nothing loads it.
- **Baseline**, measured at 3a on CLI 2.1.325. Measure it again; do not copy it.
  - `npm run verify`: 14 stages, all PASS (6 repo, 4 for cartoon-fx, 4 for `mod-template`).
  - Tooling tests: 148 in 6 files (hygiene 101, verify 15).
  - Template: 1 test. Its `validate` lists 2 hooks, 0 gating, and calls `$.command.register`.
  - cartoon-fx: 36 tests. Its `validate` lists 13 hooks, 5 gating (all with `.catch`) and 4
    state keys, with no warning but the allowed `CLAUDE.md` one.
- **A CLI update can turn the gate red.** It moved twice during the review, and 2.1.325's new
  `isCollapsed` prop failed cartoon-fx's tests until a test-only fix. Expect an update to need
  more than `npm run types` now and then.
- **Carry to 3c:**
  - **Its new-mod script must refuse a stage's name** for a mod: `format`, `lint`, `types`,
    `tooling-tests`, `marketplace`, `hygiene`, `validate`, `tests` or `imports`. `verify` reads
    such a name as the stage.
  - **`tests/support.ts` now has `git` and `scratchRepo`.** `tests/marketplace.test.ts`'s own git
    calls are F8's to fold into them.
- **Carry to Session 4:**
  - **Pointers to the deleted spec.** `mods/cartoon-fx/CLAUDE.md` and the template's `CLAUDE.md`
    point at the root's `docs/spec/SPEC.md` §8, which the close deletes. 3b or Session 4 repoints
    them, the former in its own scoped commit.
  - **3a's done-note lists what hygiene cannot see,** for `ARCHITECTURE.md`'s testing strategy.

## Watch for

- **The standing traps:**
  - **Never `git checkout <path>`.** Falsify by copying the file aside and back.
  - **Stage explicit paths.** Parallel sessions share this checkout.
  - **Commit through the draft.**
    - Write the message to `"$(git rev-parse --git-dir)/COMMIT_DRAFT"`.
    - Run the docs-only command, or `verify` with `--message`.
    - Commit with `git commit -F` from the draft, then delete it.
    - A message that quotes an attribution form fails: describe the rule in words.
  - **Give stdin-reading commands `< /dev/null`.** A bare `cat > file` with no heredoc hangs.
  - **The toolchain on this Mac:**
    - node 26.7.0 and npm 11.19.0 in `/opt/homebrew/bin`;
    - `claude` at `~/.local/bin/claude`, a link to the newest of
      `~/.local/share/claude/versions/`;
    - `gh` 2.97.0 and uv 0.12.3 in `~/.local/bin`;
    - git 2.50.1;
    - no global `tsc` or bun, so use `npx tsc` and `npx biome`.
  - **The CLI and the desktop engine are different builds,** and the CLI updates itself, even
    during `npm run types`. Record the version each check ran on, from `claude --version`.
  - **The installed cartoon-fx runs in every session the owner starts.** A commit stamps, and
    `npm run verify` shows the checkmark.
  - **The owner's Claude Code setup is live.** It is `~/.claude/settings.json`, the installed
    plugins and marketplaces, `~/.claude/mods/`, a mod's stored values, and the owner's term
    file. No session changes any of it without the owner's OK (invariant 7).
  - **Loading the plugin-authoring skill starts a watch on this session's mods folder.** Write
    nothing under `~/.claude/dev-mods/`.
  - **The file-writing tool writes the `\u2028` and `\u2029` escapes as the characters
    themselves.**
    - Check with `od -c`, and fix with `perl -CSD -pi -e 's/\x{2028}/\\u2028/g'`.
    - The handoff before this one held the raw characters, and so does 3b's block in
      `SESSIONS.md`, where it names "the escape".
  - **Nothing private in any file or commit message** (`CLAUDE.md`).
- **3b's own traps** are in its block: verbatim means verbatim, and keep `CLAUDE.md` lean.
- **A cartoon-fx session may be running beside this one.** Its folder is not yours, and that
  includes `mods/cartoon-fx/CLAUDE.md` while it has uncommitted changes.
- **Comments state the present, briefly.** No session ids, no "used to", no review stories.
- **Every push needs its own approval.** List `origin/main..HEAD` first.

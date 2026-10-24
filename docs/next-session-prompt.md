Read docs/spec/SPEC.md (§2 decisions 8–10, 12–14, with their amendments; §4; §5; §6; §8), CLAUDE.md,
templates/mod-template/, then this file, and do Session 2 of docs/spec/SESSIONS.md: import
cartoon-fx. Session 2 has four parts:
- the copy, byte for byte, plus `author` and `license` in its `plugin.json`;
- the shared files: `.claude-plugin/marketplace.json`, which this session creates, and the README's
  table of mods;
- cartoon-fx's workflow files, from the template;
- the gate green with `npm run verify -- cartoon-fx`, then the full `npm run verify`.

No release: cartoon-fx stays at 0.10.1 (decision 13).

## State you need that is not in the specs

- **Round 1 is the repository setup.** Sessions 0 and 1 are done; Sessions 2–4 remain.
- **Push status.** Everything is pushed: `origin/main` holds everything through `review: types
  re-reads the CLI after its session, and 9 smaller`, so `origin/main..HEAD` is empty. List it
  again before any push.
- **What Session 1 left that Session 2 builds on:**
  - **`npm run verify -- <name>`.** It runs `format`, `lint`, `types`, `tooling-tests`,
    `marketplace` and `hygiene`, then the folder's `validate`, `types`, `tests` and `imports`.
    Every mod under `mods/` is picked up by its folder; nothing is listed by hand.
  - **The marketplace stage** (`scripts/marketplace.ts`) wants:
    - `name` `claude-code-mods`, `owner.name` `FairCat-GD`, and a top-level `description` (§5,
      amended);
    - one entry per folder, in folder order, each `{ "name", "source": "./mods/<name>",
      "description" }` with no version;
    - every `plugin.json` with §5's fields;
    - each `CHANGELOG.md`'s newest `## [x.y.z]` naming the version.

    Once the file exists, the stage also runs `claude plugin validate --strict .`.
  - **`validate`** (`scripts/validate.ts`) fails on every error and warning, except "CLAUDE.md at
    the plugin root is not loaded as project context", which a mod's own `CLAUDE.md` always
    draws (decision 7, amended).
  - **The template** is `templates/mod-template/`. Its `CLAUDE.md`, `CHANGELOG.md`, `README.md`,
    `docs/BACKLOG.md` and `docs/next-session-prompt.md` are the skeletons for cartoon-fx's
    workflow files.
  - **`npm run types`** lays the API declarations in every folder.
- **What the spec said that turned out wrong or harder:**
  - **No marketplace file was committed.** `validate --strict` fails an empty `plugins` list, which
    is a warning, not an error. So this session creates `.claude-plugin/marketplace.json`, with
    `description` and cartoon-fx's entry as its first. The CLI's validate does not check that an
    entry's folder exists; the marketplace stage does.
  - **The declarations come only from an interactive session.**
    - No `claude plugin` command, `claude -p` or desktop session writes them.
    - `npm run types` starts an interactive `claude` loading every folder. Type `/exit` once its
      prompt shows. Ctrl-C sent from a tool does not end it. It reads `claude --version` again
      afterwards, and asks for another run when the CLI updated itself meanwhile.
    - It keeps the owner's live mods out. With cartoon-fx under `mods/`, it loads the repo copy
      alone. Its hooks run in that session: read its `session.start` (it reads `$.store`
      `placement`) and decide whether that is acceptable before running it.
  - **`claude-code-tools/` and `claude-code-mcp/` are folders of additions to `claude-code`, not
    modules.** The engine declares two: `claude-code` and `claude-code/testing`. They are about
    22,700 lines at 2.1.310, not 14,000.
  - **The `.gitignore` line `.claude-plugin/types/` ignored no mod's declarations.** It held a
    slash, so git anchored it to the root. It is now `**/.claude-plugin/types/`.
  - **The CLI updates itself.** It went from 2.1.296 to 2.1.310 during Session 1. A folder's
    `types` stage then fails, naming both versions, until `npm run types` runs again.
- **The inputs to Session 2's *Ask at the start*,** measured on scratch copies of cartoon-fx at CLI
  2.1.310:
  - **Formatting.** Biome would change 51 lines and add 88 at the chosen width, 160, in
    `detect.ts`, `fx.ts`, `register.tsx` and the test file:
    - it joins arrow bodies cartoon-fx breaks after `=>`;
    - it splits `+` chains it groups several to a line;
    - it expands short tuple arrays.

    The table for every width is in Session 1's done-note. No width changes nothing.
  - **Lint.** 5 `noUnusedFunctionParameters` in `register.tsx` (lines 236, 251, 265, 283, 301),
    from `.catch(($, e, next) => next(e))`-style handlers. Nothing else.
  - **Type errors: none.** `tsc` is clean, and so is the import scan.
  - **validate** counts one warning, no author, which the `author` field fixes. It reports 12
    hooks, 5 gating (all with `.catch`) and 4 state keys. `claude plugin test`: 28 pass.
  - The block prefers changing the config over reformatting the mod; it is the owner's call.
- **Decisions written down nowhere else:**
  - **To falsify the hygiene stage,** add a throwaway word and its hash to
    `scripts/hygiene_terms.txt`, watch the stage fail, then remove both. The terms are never
    written into the repository.
  - **cartoon-fx as found at intake** is at `~/.claude/mods/cartoon-fx`. It loads live in every
    session through `CLAUDE_CODE_PLUGIN_DIRS` in `~/.claude/settings.json`.
    - It is eight files.
    - It has no `.claude-plugin/types/`, which Session 1 checked before and after each
      interactive run.
    - Its style: single quotes, no semicolons (the one `;` ends a comment), lines up to 282
      characters.
  - **The plugin-authoring skill writes the desktop build's declarations beside itself** under
    `/private/tmp/claude-501/bundled-skills/<version>/…/plugin-authoring/types/claude-code.d.ts`.
    It is one file, and is not what `tsc` uses here.
  - **`gh` is signed in** as `FairCat-GD` (HTTPS, `repo` scope). `~/.claude/settings.json` already
    sets `includeCoAuthoredBy: false` and empty `attribution`.
- **Baseline** (Session 1's done-note):
  - `npm run verify`: 10 stages, all PASS. With cartoon-fx: 14.
  - Tooling tests: 48 in 6 files.
  - Template tests: 1.
  - cartoon-fx must keep 28 tests in one file.
- **Not done:** nothing in Session 1's scope.

## Watch for

- **The standing traps:**
  - **Never `git checkout <path>`.** Falsify by copying the file aside and back.
  - **Stage explicit paths.** Parallel sessions share this checkout.
  - **Give stdin-reading commands `< /dev/null`.** A bare `cat > file` with no heredoc hangs.
  - **The toolchain on this Mac:**
    - node 26.7.0 and npm 11.19.0 in `/opt/homebrew/bin`;
    - `claude` at `~/.local/bin/claude`, a link to the newest of `~/.local/share/claude/versions/`
      (2.1.310 at Session 1's end);
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
  - **The file-writing tool writes `\u2028` and `\u2029` escapes as the characters themselves.**
    Inside a regex that breaks the line. Check with `od -c`, and fix with
    `perl -CSD -pi -e 's/\x{2028}/\\u2028/g'`.
  - **Nothing private in any file or commit message** (`CLAUDE.md`).
- **Session 2's own traps** are in its block:
  - byte for byte, with no "while I'm here" fixes;
  - the hygiene stage runs over the copy first;
  - `diff -r` against the source afterwards;
  - the changelog link is added by the review commit;
  - ask for the push approval at the end, since Session 3 installs from GitHub.
- **Leave out `.claude-plugin/types/`** when copying: the engine may have laid it by then. Git
  ignores it, and the marketplace stage fails if it is ever tracked.
- **Comments state the present, briefly.** No session ids, no "used to", no review stories, no
  paragraphs.
- **Every push needs its own approval.** List `origin/main..HEAD` first.

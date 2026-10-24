Read docs/spec/SPEC.md (§2 decisions 3–10, 12, 14; §4; §5; §6; §7), CLAUDE.md, then this file, and
do Session 1 of docs/spec/SESSIONS.md: the scaffold. Session 1 has six parts:
- the toolchain: `package.json` with exact pins, `tsconfig.json` and `biome.json`;
- `npm run verify`, with its repo stages and per-mod stages, and `verify -- <mod>`;
- hygiene, ported from krita-art-mcp with its tests;
- the marketplace file, the marketplace stage and the import scan;
- `templates/mod-template/`, checked by the gate;
- `LICENSE`, `README.md`, `tests/fixtures/`, and the Commands table in `CLAUDE.md`.

Before planning, measure how the API declarations reach a fresh checkout for `tsc`, then ask the
owner (the block's *Ask at the start*). No release: repo-level sessions cut no version (decision 8).

## State you need that is not in the specs

- **Round 1 is the repository setup.** Session 0, the intake, is done. Sessions 1–4 remain.
- **Everything is pushed.** `origin` is the private GitHub repository
  `FairCat-GD/claude-code-mods`, created at Session 0's close with the owner's approval.
  `origin/main` holds everything through `review: the switch records stored values first, and 9
  smaller`, so `origin/main..HEAD` is empty. List it again before any push.
- **What exists is documents only:**
  - `docs/spec/SPEC.md` and `docs/spec/SESSIONS.md`; there is no `PDD.md` (decision 2);
  - `CLAUDE.md`, `docs/DEVELOPMENT-WORKFLOW.md`, `docs/BACKLOG.md` and `.gitignore`.

  There is no `package.json` and no code.
- **What the spec said that turned out wrong or harder:** nothing yet. Two things are open for
  this session to measure:
  - how `tsc` gets the API declarations in a checkout that no engine has loaded;
  - whether `claude plugin validate` accepts a marketplace with an empty `plugins` list. If it
    does not, this session commits no marketplace file (see the block).
- **The intake's review** (`/code-review high`) found ten gaps, all fixed in the plan before this
  session:
  - the template's folder is now `templates/mod-template/`, so its name follows the mod rule;
  - `tooling-tests` takes the top level of `tests/` only;
  - the import scan allows every module the engine declares, read from the declarations;
  - the empty marketplace is measured first;
  - changelog links are added by the review commit;
  - Session 3 records the owner's stored values before switching, measures how `$.store` is
    keyed, and has a fallback if Session 2 is not pushed;
  - SPEC §8 is the one home of the mod practices.
- **Decisions written down nowhere else:**
  - **The hygiene term hashes.** These are krita-art-mcp's seven, unchanged. Each is the SHA-256 of
    a lowercase term's UTF-8 bytes, and they go into `scripts/hygiene_terms.txt`. The terms
    themselves are never written into the repository.
    ```
    7879acd0c06ad5508da8bd92f64eae02ea49d8681bc7ba9d6b7692a2cffed4b4
    3d63a063d40fd1c12ed33a4646c93a46a92b63b2514d7d048cf567fe193e465f
    bbeecfb575fb00c6cd1c207fef73046db883ecdfcee36977c67dccf040a53284
    36d0d93528bc79cd69ea96893aea78115ab4bc5cc56216bc58aaaf82b70333fc
    dbf2a89b11004ff7f063b1f68bb09bee706f08b25591048d0f7eda30ad0366f5
    693b286515bd1dd00865e7b60e4e53556537bbe4b1cc90ab608d94eb7c56fdc6
    ef7f91a0a1a9ca33056b5c2599d1fcf280ea84cf8cded8f28583b555e5ed786b
    ```
  - **To falsify the hygiene stage,** add a throwaway word and its hash, watch the stage fail, then
    remove both.
  - **What to port.** krita-art-mcp's `scripts/hygiene.py` and `tests/test_hygiene.py`, in the
    owner's checkout beside this one (`../krita-art-mcp`). Read them; never edit that repository.
  - **cartoon-fx as found at intake.**
    - It is at `~/.claude/mods/cartoon-fx`, and loads live in every session through
      `CLAUDE_CODE_PLUGIN_DIRS` in `~/.claude/settings.json`.
    - `claude plugin validate`: pass, with one warning (no author). It reports 12 hooks, 5 of
      them gating, all with `.catch`, and 4 state keys.
    - `claude plugin test`: 28 pass, 0 fail, in one file.
    - It has no `.claude-plugin/types/`, so the base its `tsconfig.json` extends is missing.
    - **Its code style.** It uses single quotes, and no semicolons except at the end of one line in
      `register.tsx`.
    - **Its lines run long:** up to 282 characters in the test file, 252 in `detect.ts`, and about
      170 in `fx.ts` and `register.tsx`.
    - Any line width will likely make Biome reflow some of it, joining short lines as well as
      breaking long ones. Measure that with `biome format` on a scratch copy, and record the
      result for Session 2's *Ask at the start*.
  - **The plugin-authoring skill writes this build's declarations beside itself as it loads,** in
    a temp folder named for the build:
    `…/bundled-skills/<version>/…/plugin-authoring/types/claude-code.d.ts`, whose header carries a
    `tsconfig.json` that fits a hooks module.
  - **`gh` is signed in** as `FairCat-GD` (HTTPS, `repo` scope). `~/.claude/settings.json`
    already sets `includeCoAuthoredBy: false` and empty `attribution`.
- **Baseline:** none yet. Session 1 records the first counts in its done-note: stages, tooling
  tests, and the template's tests.
- **Not done:** nothing.

## Watch for

- **The standing traps:**
  - **Never `git checkout <path>`.** Falsify by copying the file aside and back.
  - **Stage explicit paths.** Parallel sessions share this checkout.
  - **Give stdin-reading commands `< /dev/null`.** A bare `cat > file` with no heredoc hangs.
  - **The toolchain on this Mac:**
    - node 26.7.0 and npm 11.19.0 in `/opt/homebrew/bin`;
    - `claude` 2.1.296 at `~/.local/bin/claude`;
    - `gh` 2.97.0 and uv 0.12.3 in `~/.local/bin`;
    - git 2.50.1;
    - no global `tsc` or bun.
  - **The CLI and the desktop engine are different builds** (2.1.296 and 2.1.308 at intake).
    Record the version each check ran on.
  - **The owner's Claude Code setup is live:** `~/.claude/settings.json`,
    `~/.claude/mods/cartoon-fx` (running in every session), and the installed plugins. No session
    changes any of it without the owner's OK (invariant 7).
  - **Loading the plugin-authoring skill starts a watch on this session's mods folder.** Write
    nothing under `~/.claude/dev-mods/`.
  - **Nothing private in any file or commit message** (`CLAUDE.md`).
- **Session 1's own traps** are in its block:
  - `node --test` must not reach the mods', the template's or the fixtures' tests;
  - the import scan reads the engine's module list from the declarations;
  - only erasable TypeScript runs under Node;
  - a mod's `tsconfig.json` extends an engine-written file;
  - hygiene must not flag itself;
  - JSX against `h`, not React;
  - stop before loosening `validate` to warnings;
  - no dependency before it is used.
- **Comments state the present, briefly.** No session ids, no "used to", no review stories, no
  paragraphs.
- **Every push needs its own approval.** List `origin/main..HEAD` first.

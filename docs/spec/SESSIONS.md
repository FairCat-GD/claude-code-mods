# The session plan: round 1, the repository setup

One chat per session. Never run two sessions in one chat: the point of the split is that no
session inherits stale context.

- **Scope** lives here, fixed in advance. The request and its resolved decisions are in `SPEC.md`
  beside this file, which is read-only; do not re-litigate them. If a session finds a block wrong,
  it amends the block and records the reason both in the block and in
  `docs/next-session-prompt.md`.
- **State** is `docs/next-session-prompt.md`: what the next session needs that the docs do not say.
  Every session rewrites it as its last act. The repo level keeps no changelog (decision 8); what
  shipped to cartoon-fx is in `mods/cartoon-fx/CHANGELOG.md`.
- **When this round closes,** Session 4 deletes this file and `SPEC.md`. Git history keeps them,
  and anything left open moves to `docs/BACKLOG.md`.

**Before starting**, confirm that the session's own paths are clean (decision 10) and that
`docs/next-session-prompt.md` names the session you are about to do. **Read order:** the `SPEC.md`
sections the block names, `CLAUDE.md`, then the prompt. **Then plan, in plan mode,** and ask the
block's *Ask at the start* questions before any edit.

**Every session ends the same way:**
1. `npm run verify` green (from Session 1 on), plus the hand checks the block names.
2. Every new check falsified, once. Checks that already existed are not falsified again.
3. A `CHANGELOG.md` entry for anything a mod's user would see, in that mod's changelog. No session
   in this round cuts a version.
4. The docs the block names kept true. Until Session 4 writes `docs/ARCHITECTURE.md`, the done-note
   carries what it will need: the deliberate decisions and the counts.
5. A done-note appended to the block, then the prompt rewritten, then a local commit.
6. The owner's `/code-review high`, then a review-fixes commit.
7. The next prompt printed as the chat's last message.

Never push without being asked.

| Session | Scope | Decisions | Version |
|---|---|---|---|
| 1 | Scaffold: the toolchain, `verify`, hygiene, the marketplace, the mod template | 3–10, 12, 14 | — |
| 2 | Import cartoon-fx: the files byte for byte, its workflow files, the gate green | 8–10, 12–14 | cartoon-fx stays **0.10.1** |
| 3 | cartoon-fx as an installed release, and its as-built docs | 11, 13, 14 | — |
| 4 | The repo's documentation pass; close the round | 2, 3, 15, 16 | — |

---

## 1: Scaffold

**Read:** `SPEC.md` §2 (decisions 3–10, 12, 14), §4, §5, §6, §7; `docs/DEVELOPMENT-WORKFLOW.md`
(*Day one*). Also krita-art-mcp's `scripts/hygiene.py` and `tests/test_hygiene.py`, in the owner's
checkout beside this one (`../krita-art-mcp`), read-only.

- **The toolchain** (decision 5).
  - `package.json`: `private`, `"type": "module"`, `engines.node` `>=26`, and exact pins for
    `typescript` (5.4 or newer) and `@biomejs/biome`. Commit `package-lock.json`.
  - A root `tsconfig.json` for the tooling: strict, `noEmit`, and `erasableSyntaxOnly`, so `tsc`
    refuses what Node's type stripping cannot run.
  - `biome.json`. Format settings match cartoon-fx's current style as closely as they can: its
    quotes, semicolons, indent and line width. Read its source at `~/.claude/mods/cartoon-fx`, and
    never edit it.
    - Run `biome format` on a scratch copy, and record in the done-note what Biome would still
      change. That is the input to Session 2's *Ask at the start*.
    - `docs/` and `.claude-plugin/types/` are left out.
- **`verify`** (decision 7).
  - A script under `scripts/` runs the stages of decision 7 by name, each failing on its own. Every
    command runs even after one fails. A summary follows, with each stage's time, and the exit code
    is 1 on any failure.
  - `npm run verify` runs everything, and `npm run verify -- <mod>` runs the repo stages and that
    mod's stages. Format and lint cover the tooling and the folders being verified; hygiene covers
    the whole tree.
  - A stage that cannot start fails, with a message naming the fix.
- **Hygiene** (decision 6, invariant 1).
  - A port of krita's `hygiene.py` into `scripts/`, with `scripts/hygiene_terms.txt` holding the
    seven hashes from the handoff.
  - Its tests port krita's `test_hygiene.py` case for case, using the same probe-term approach.
- **The marketplace and the mod checks** (decision 12, invariants 2–5).
  - `.claude-plugin/marketplace.json`: `name` `claude-code-mods`, `owner` `FairCat-GD`, and an
    empty `plugins` list (cartoon-fx joins in Session 2).
    - **Measure first** whether `claude plugin validate` accepts an empty `plugins` list.
    - If it does not, Session 1 commits no marketplace file. Its stage is tested against fixtures
      only, and treats "no marketplace file and no folders under `mods/`" as consistent. Session 2
      then writes the file with cartoon-fx's entry.
    - No placeholder entry is ever committed.
  - **The `marketplace` stage:**
    - every folder under `mods/` has exactly one entry, and every entry has its folder;
    - names agree with folders and `plugin.json`, and each source is `./mods/<name>`;
    - no entry carries a version;
    - each mod's `plugin.json` version is named by the newest entry of its `CHANGELOG.md`;
    - each `plugin.json` has the fields of SPEC §5;
    - no tracked path lies under `.claude-plugin/types/`.
  - **The import scan,** over a mod's or the template's sources:
    - every relative import resolves inside that folder;
    - every bare import names a module the engine declares. At intake those were `claude-code`,
      `claude-code/testing`, `claude-code-tools` and `claude-code-mcp`, plus the contract of each
      plugin under the mod's `dependencies`.
    - The scan reads that list from the laid declarations, not from a list kept in the script, so
      a new build's modules pass without an edit.
  - **Measure** whether `claude plugin validate .` at the root checks the marketplace file. If it
    does, add it to the stage.
- **The mod template** (decision 4). `templates/mod-template/` is a minimal working mod:
  - **The plugin:** a `plugin.json` with every field of SPEC §5, the name `mod-template` and
    version `0.1.0`; `hooks/hooks.json`; and a small hooks module (one fictional slash command
    that answers with text).
  - **Its gate:** one test of that command, written to SPEC §8's test practices, and its
    `tsconfig.json`.
  - **Its workflow files:** skeletons of `CLAUDE.md`, `CHANGELOG.md` (an empty `[Unreleased]` and
    `[0.1.0]`), `README.md` and `docs/`. The `docs/` skeleton has `BACKLOG.md` and a handoff
    saying the mod's next session is its intake.
  - The per-mod stages run on it. The marketplace stage does not list it, because it is not under
    `mods/`.
- **The API declarations for `tsc`.** See *Ask at the start*.
- **Fixtures.** `tests/fixtures/` holds the fictional inputs the tooling's tests need:
  - a well-formed mod, which may carry its own `*.test.ts` (`tooling-tests` never collects it);
  - a marketplace that disagrees with its folders;
  - a mod importing from outside itself;
  - a `README.md` saying that fixtures are fictional and that tests never read `docs/`.
- **Repository files.**
  - `LICENSE`: the MIT text, copyright `FairCat-GD`.
  - `README.md`: what the repository is, its layout, how to run `verify`, where the docs are, and
    a table of mods, empty until Session 2.
- **Docs.**
  - `CLAUDE.md`: the Commands table filled in, with what a session would otherwise learn the hard
    way about running each command.
  - README: written.
- **Ask at the start of 1: how the API declarations reach a fresh checkout for `tsc`.**
  - Measure the options in plan mode before proposing one:
    - whether an interactive `claude --plugin-dir <folder>` terminal session lays
      `.claude-plugin/types/` in that folder;
    - whether the declarations the plugin-authoring skill writes beside itself can be used through
      a `tsconfig` kept outside the mod folder;
    - whether any `claude plugin` command writes them.
  - The desktop app watches a folder only with `CLAUDE_CODE_PLUGIN_DIR_WATCH=1`, which is a change
    to the owner's settings. Ask before trying it.
  - Then propose how `verify` finds them, and the one documented step a fresh clone needs.

**Gates:**
- `npm run verify` green, with these tests:
  - every ported hygiene case;
  - the marketplace stage: a missing entry, an extra entry, a mismatched name, a version in an
    entry, a `plugin.json` missing a field, a changelog that does not name the version, and a
    tracked file under `.claude-plugin/types/`;
  - the import scan: a relative import that leaves the folder, one that stays inside, a bare
    import of `claude-code-tools` (passes), and a bare import of an unknown module (fails);
  - `tooling-tests` collects nothing under `tests/fixtures/`, even where a fixture holds a
    `*.test.ts`;
  - `verify -- <mod>` scoping: a mod's stages run only for the mod named.
- Each stage falsified once, failing at its own step and nowhere else:
  - a misformatted line, and a lint error;
  - a type error in the tooling, and one in the template;
  - a failing tooling test, and a failing template test;
  - a `validate` error in the template;
  - a private term, using a throwaway word and its hash;
  - a bad marketplace entry;
  - an import that leaves the template's folder.

  Each new test falsified once.

**Watch for:**
- **The CLI and the desktop engine are different builds** (2.1.296 and 2.1.308 at intake).
  `validate` and `test` run the CLI on PATH. Record its version in the done-note.
- **`node --test` with no arguments finds every `*.test.ts` in the tree.** That includes the mods',
  the template's and any fixture mod's, which import `claude-code/testing` and fail in Node.
  - Give it the top level of `tests/` only (a pattern like `tests/*.test.ts`, never
    `tests/**`).
  - The mods' tests run under `claude plugin test`, in the engine's environment, not in Node.
- **Node strips types, and only erasable syntax survives.** No enums, namespaces or parameter
  properties. Relative imports name their `.ts` extension.
- **A mod's `tsconfig.json` extends `./.claude-plugin/types/tsconfig.json`,** which the engine
  writes and a fresh clone lacks.
- **Hygiene must not flag itself.** Assemble its attribution patterns from pieces, as krita does,
  and keep the hashes in one data file.
- **A mod's sources use JSX compiled against the global `h`.** Configure Biome's JSX handling for
  that, not React's.
- **Loading the plugin-authoring skill starts the engine's watch on this session's mods folder**
  (`~/.claude/dev-mods/<session id>/`). The first file written there asks the owner whether to turn
  on hot-reloaded mods. Write nothing there.
- **The owner's setup is live** (invariant 7). cartoon-fx runs in every session from
  `~/.claude/mods/cartoon-fx`; read it, never change it.
- **If `validate` warns about something a mod cannot fix,** stop and ask before loosening the stage
  to warnings.
- **Don't add a dependency before it is used.**

**Done (2026-10-24, no version).**
- **Decided with the owner at the start:**
  - **The declarations come from the engine.** `npm run types` starts an interactive `claude`
    with one `--plugin-dir` per mod and the template. It keeps the owner's live mods out three ways:
    `CLAUDE_CODE_PLUGIN_DIRS` removed from its env, `--setting-sources project,local`, and
    `--settings` emptying the variable. The owner types `/exit`, and the script checks every
    folder. It is the one step a fresh clone needs after `npm ci`.
  - **`@types/node` is a third exact pin** (SPEC decision 5, amended).
  - **Stale declarations fail.** A folder's `types` stage fails when the laid declarations'
    `// Written by Claude Code X` line differs from `claude --version`, naming both and the fix.
  - **Mid-session, the marketplace gets a top-level `description`** (SPEC §5, amended).
  - **Mid-session, `validate` allows one warning by name** (SPEC decision 7, amended):
    "CLAUDE.md at the plugin root is not loaded as project context". The owner asked for the
    best practice, and the session advised a named exception over moving each plugin down a
    level or dropping `--strict`.
- **The toolchain.**
  - `package.json`: `private`, `"type": "module"`, `engines.node` `>=26`, scripts `verify` and
    `types`.
  - Exact pins: `typescript` 6.0.3, `@biomejs/biome` 2.5.15 and `@types/node` 26.6.5;
    `package-lock.json` committed.
  - The tooling's `tsconfig.json`: strict, `noEmit`, `erasableSyntaxOnly`,
    `verbatimModuleSyntax`, `allowImportingTsExtensions`, `nodenext`; `tests/fixtures` excluded.
  - `biome.json`: spaces, indent 2, width 160, single quotes, double quotes in JSX, semicolons
    and arrow parens as needed; `jsxRuntime` `transparent` with `h` and `Fragment` as globals;
    recommended lint rules; `docs`, every `.claude-plugin/types` and the lockfile left out.
- **`verify`** (`scripts/verify.ts`).
  - Repo stages: `format`, `lint` (`--error-on-warnings`), `types`, `tooling-tests`
    (`node --test "tests/*.test.ts"`), `marketplace` and `hygiene`.
  - Then `validate`, `types`, `tests` and `imports` for each `mods/<name>` and for
    `mod-template`.
  - `-- <name>` scopes `format` and `lint` to the tooling plus that folder, and runs that
    folder's four only. An unknown name exits 2.
  - Every command runs; a stage that cannot start fails alone with its fix; a summary with each
    stage's time follows.
  - The `claude` stages run with `CLAUDE_CODE_PLUGIN_DIRS` removed.
  - `scripts/repo.ts` holds what the scripts share: the root, the folders, and the
    declarations' versions and messages.
- **Hygiene** (`scripts/hygiene.ts`, `scripts/hygiene_terms.txt`).
  - A port of krita-art-mcp's `hygiene.py`: the same tokens, scans, attribution patterns
    (assembled from pieces) and messages.
  - Python's `splitlines` boundaries, so the line numbers agree.
  - The terms file is krita's, byte for byte: its comment and the seven hashes.
- **The marketplace stage** (`scripts/marketplace.ts`).
  - The marketplace file: its name, owner and description, one entry per folder in folder
    order, names, sources, no versions.
  - Every `plugin.json` (the template's too) against §5, and its changelog's newest entry.
  - No tracked path under any `.claude-plugin/types/`.
  - When a marketplace file exists, the stage also runs `claude plugin validate --strict .`.
- **The import scan** (`scripts/imports.ts`). Specifiers come from `ts.preProcessFile`.
  - A relative import must resolve to a file inside the folder.
  - A bare import must name a module some top-level `declare module` in the folder's laid
    declarations declares, read with TypeScript's parser.
- **`validate`** (`scripts/validate.ts`). It prints the readable report, then judges
  `--json`: every error and warning fails, but the named one.
  - The report's `directory.findings`, which are checks for submitting to Anthropic's plugin
    directory, are not judged, as the CLI's own result does not count them.
- **`npm run types`** (`scripts/types.ts`). It exits 0 and says so when every folder is fresh,
  and refuses without a terminal.
- **The template** (`templates/mod-template/`).
  - `plugin.json` at 0.1.0 with §5's fields, `hooks/hooks.json`, and `hooks/register.ts`.
    The module registers `/hello` at `session.start` and answers it in its own `command.run`
    hook.
  - One test of both, and `tsconfig.json` extending the laid one.
  - Skeleton `CLAUDE.md`, `CHANGELOG.md`, `README.md`, `docs/BACKLOG.md`, and a handoff saying
    the next session is the mod's intake.
- **Fixtures** (`tests/fixtures/`): `well-formed/`, `disagreeing/`, `leaky-mod/`,
  `declarations/` and a README, all fictional.
- **Repository files.** `LICENSE` (MIT, FairCat-GD), `README.md`, `CLAUDE.md` (the Commands
  table, and the declarations paragraph as measured).
  - **The `.gitignore` fix.** Its `.claude-plugin/types/` line held a slash, so git anchored it to
    the root and it ignored no mod's declarations. It is now `**/.claude-plugin/types/`.
- **No marketplace file is committed.** See the marketplace measurements below.
- **Amendments:**
  - **`@types/node` added; the marketplace's `description`; `validate`'s named exception.**
    Amended in the session, with the owner (SPEC decisions 5 and 7, and §5).
  - **The import scan's passing bare import is `claude-code/testing`, not
    `claude-code-tools`.** The engine declares two modules, `claude-code` and
    `claude-code/testing`; `claude-code-tools/` and `claude-code-mcp/` are folders of
    additions to `claude-code`. A test now shows `claude-code-tools` is refused, and another
    that a module only the fixture declares passes, so the list is read, not kept. This was the
    session's own finding, from the laid files.
  - **Script names chosen:** `scripts/repo.ts` and `scripts/validate.ts` beside the planned
    four, and `tests/support.ts` for the temp folders.
- **Measured** (CLI 2.1.296, then 2.1.310 after it updated itself mid-session; desktop 2.1.308):
  - **The declarations.**
    - **Where they come from.** No `claude plugin` command writes them. An interactive
      `claude --plugin-dir <folder>` lays `.claude-plugin/types/` in that folder: on 2.1.296,
      `claude-code/index.d.ts` (15,990 lines), `claude-code-tools/` (5,471) and
      `claude-code-mcp/` (10). It also lays a `tsconfig.json` (`typeRoots` `.`, types those
      three, include `../../hooks`, `../../types` and `../../tests`) and a `.gitignore` of `*`,
      and writes the mod's own top-level `tsconfig.json` when it has none.
    - **At 2.1.310** they are 16,981, 5,590 and 109 lines. The MCP file lists the session's
      connected servers.
    - **The skill's copy** (2.1.308) is one 22,511-line file, wiped at reboot.
    - **The guard held.** With the three guards, `~/.claude/mods/cartoon-fx` stayed unchanged
      through both interactive runs (`ls -la` before and after).
    - **The trust prompt.** The first interactive run in this checkout asked Claude Code's
      folder-trust question, which the owner answered.
  - **The marketplace.**
    - `claude plugin validate .` at a root reads `.claude-plugin/marketplace.json`.
    - An empty `plugins` list is a warning, not an error, so `--strict` fails it. So Session 1
      commits no marketplace file, and "no file and no mods" is consistent.
    - A missing top-level `description` is a warning too.
    - validate checks neither that an entry's folder exists nor that it has no version; the
      marketplace stage does.
  - **The shell's environment.** It carries `CLAUDE_CODE_PLUGIN_DIRS=~/.claude/mods/cartoon-fx`
    from the desktop app. A `claude` started from it loads the live mod.
  - **TypeScript 7.0.2** exposes its JS API only under `unstable/`; 6.0.3 has `preProcessFile`.
  - **Biome on a scratch copy of cartoon-fx.** These are the lines it would change, removed and
    added, by width:

    | Width | Removed | Added | Files |
    |---|---|---|---|
    | 100 | 111 | 558 | 5 |
    | 120 | 52 | 226 | 5 |
    | 160 | 51 | 88 | 4 |
    | 200 | 94 | 96 | 4 |
    | 240 | 139 | 106 | 4 |
    | 282 | 174 | 107 | 4 |
    | 320 | 213 | 110 | 4 |

    - **At 160,** the changes are in `detect.ts`, `fx.ts`, `register.tsx` and the test file.
      Biome joins arrow bodies that cartoon-fx breaks after `=>`, splits `+` chains it groups
      several to a line, and expands short tuple arrays.
    - **Lint** (recommended, warnings failing): 5 `noUnusedFunctionParameters` in
      `register.tsx` (lines 236, 251, 265, 283, 301; `.catch(($, e, next) => next(e))`-style
      handlers), and nothing else.
    - This is the input to Session 2's *Ask at the start*.
  - **cartoon-fx at 2.1.310, on a scratch copy** with the template's laid declarations:
    - `tsc` clean;
    - the import scan clean;
    - `validate` counts one warning, no author, which Session 2 fixes;
    - 12 hooks, 5 gating, all with `.catch`, and 4 state keys;
    - `claude plugin test`: 28 pass.
  - **The template at 2.1.310:** `validate` lists 2 hooks, 1 that answers its own command, 0
    gating, and calls `$.command.register`.
- **Checked by hand:** the owner answered the trust prompt in the probe's terminal. Nothing else
  in Session 1 has a hand check.
- **Falsified,** each stage once on `verify -- mod-template`, copying files aside and back:
  - **Failed alone at their own stage:**
    - a mis-indented line (`format`);
    - `eval('1')` (`lint`);
    - a tooling type error (`types`);
    - a template type error (`mod-template: types`);
    - a wrong expected version (`tooling-tests`);
    - a wrong expected greeting (`mod-template: tests`);
    - an unknown `plugin.json` field (`mod-template: validate`, as a warning);
    - a throwaway word and its hash (`hygiene`, naming only the hash);
    - a marketplace entry with no folder (`marketplace`; the CLI's validate passed it).
  - **An import leaving the template's folder** failed `mod-template: imports`, and also
    `validate` and `tests`: the engine refuses it too, the second layer of invariant 2.
  - **Missing declarations** made `mod-template: types` and `imports` fail, naming
    `npm run types`.
  - **Each new test:** with every assertion in `tests/*.test.ts` flipped, all 40 tooling tests
    failed; restored, all 40 passed. The template's one test was falsified with its stage.
- **Numbers.**
  - `npm run verify`: 10 stages (6 repo, 4 for `mod-template`), all PASS.
  - Tooling tests: 40 in 6 files (hygiene 8, marketplace 12, imports 7, verify 6, types 3,
    validate 4).
  - Template tests: 1.
- **Review (`/code-review high`), 10 findings: 10 fixed and 0 skipped.** The owner chose to fix
  all.
  - **`npm run types` read the CLI's version only before its session.** A CLI that updates itself
    mid-session (as it did in the probe) was missed. It now reads it again afterwards, and asks
    for another run when it changed.
  - **A start error other than `SetupError` crashed all of verify,** for example a failing
    `claude --version`. Now any error that stops a stage starting fails that stage alone.
  - **The import scan:**
    - `./x.js` naming `x.ts` now resolves to that source, as bundler resolution allows;
    - a path starting `..name` inside the folder is no longer taken as leaving it;
    - `/// <reference types>` is checked as a module, and `/// <reference path>` as a file.
  - **`validate` runs once per folder.** It prints the readable lines from the same `--json`
    report it judges, marking the allowed warning.
  - **`findClaude` passes over a directory named `claude`** on PATH.
  - **The changelog check skips fenced examples** when it looks for the newest entry.
  - **One home each** in `scripts/repo.ts` for the env guard (`hermeticEnv`), `isFile`, `Folder`,
    and the stale-folder list that `npm run types` uses before and after its session.
  - **Falsified:** each fix was undone alone, and its own test failed, and no other.
  - **Numbers after the review:**
    - `npm run verify` 10 stages, all PASS (CLI 2.1.310);
    - tooling tests 48 (+8: types 4, verify 8, imports 10, validate 5, marketplace 13; hygiene
      unchanged at 8);
    - template tests 1.

---

## 2: Import cartoon-fx

**Read:** `SPEC.md` §2 (decisions 8–10, 12–14), §4, §5, §6, §8; `CLAUDE.md`;
`templates/mod-template/`.

- **The copy** (decision 13).
  - Copy `~/.claude/mods/cartoon-fx/` into `mods/cartoon-fx/` byte for byte. At intake it held
    eight files:
    - `.claude-plugin/plugin.json`;
    - `hooks/hooks.json`, `hooks/register.tsx`, `hooks/detect.ts` and `hooks/fx.ts`;
    - `types/index.d.ts`;
    - `tests/cartoon-fx.test.tsx`;
    - `tsconfig.json`.

    Leave out `.claude-plugin/types/` if it has appeared.
  - Run the hygiene stage over the copy before anything else reads it.
  - Compare with `diff -r` after the copy. The source folder stays untouched.
- **`plugin.json`** (decision 12). Add `author` and `license`, and nothing else; the version stays
  `0.10.1`. `validate`'s warnings go from one to none.
- **The shared files** (decision 10): cartoon-fx's entry in `.claude-plugin/marketplace.json`, and
  its row in the root `README.md`. If Session 1 could not commit an empty marketplace, this session
  writes the file, with this entry as its first.
- **The mod's workflow files,** from the template.
  - **`mods/cartoon-fx/CLAUDE.md`:**
    - what the mod is;
    - its machine identifiers: `cartoon-fx`, `/fx`, its `$.state` keys, and its `$.store` keys;
    - its commands (`npm run verify -- cartoon-fx`);
    - its read order.
  - **`CHANGELOG.md`.** One `[0.10.1]` entry, with the lead paragraph decision 13 describes. Under
    *Added* it lists what the mod does at 0.10.1, written for the person using it.
    - Its link reference points at this session's import commit, the first that holds the
      manifest at 0.10.1 (decision 8).
    - The import commit is not final until committed, so the review commit adds the link. Without
      a review commit, the next commit adds it.
  - **`README.md`:** what it does, the install lines, and `/fx`.
  - **`docs/BACKLOG.md`**, and **`docs/next-session-prompt.md`** from the between-rounds template.
    The handoff says no round is in progress, and that the next cartoon-fx session is the round 2
    intake.
  - `ARCHITECTURE.md` and `USER-GUIDE.md` are Session 3's.
- **The gate.** `npm run verify -- cartoon-fx` is green, using Session 1's way of providing the API
  declarations.
- **Docs.**
  - The root README: its table of mods.
  - cartoon-fx's files, above.
- **Ask at the start of 2:**
  - **Formatting.** Would Biome change any line of the copied code? Show the owner the diff.
    Changing the config is preferred over reformatting the mod.
  - **Type errors.** Does `tsc` report any errors in cartoon-fx? A fix changes the mod's code and
    would be a 0.10.2 release, so it is the owner's call.

**Gates:**
- `npm run verify` green:
  - cartoon-fx's `validate` passes with no warnings, and its hook list matches the one recorded at
    intake;
  - 28 tests pass in one file, unmoved;
  - `tsc` is clean.
- `diff -r` against `~/.claude/mods/cartoon-fx` shows only the two new `plugin.json` fields, plus
  the new files.
- The marketplace stage falsified against the real entry, once: remove the entry, watch the stage
  fail, and restore it.

**Watch for:**
- **cartoon-fx is running in the owner's sessions** from `~/.claude/mods/cartoon-fx`, through
  `CLAUDE_CODE_PLUGIN_DIRS`. Leave both alone; Session 3 switches it over.
- **Byte for byte means no "while I'm here" fixes.** Whatever the session notices goes to
  cartoon-fx's `docs/BACKLOG.md`.
- **Don't load the repo copy beside the live one.** No `--plugin-dir` session on `mods/cartoon-fx`
  while the live copy runs under the same name. This session needs no live run.
- **Session 3 installs from GitHub,** so it needs this session's work pushed. Ask for the push
  approval at the end, after the review. If the owner declines, the handoff says so, and names the
  choice Session 3 then starts with.

**Done (2026-10-25, no version; cartoon-fx stays 0.10.1).**
- **Decided with the owner at the start:**
  - **Formatting and lint: the mod's own `biome.json`.** The inputs were measured again,
    read-only, on the live source (Biome 2.5.15, width 160). `format` would change 139 lines (51
    removed, 88 added) in `detect.ts`, `fx.ts`, `register.tsx` and the test file. `lint` flags 5
    `noUnusedFunctionParameters` in `register.tsx`, and nothing else. The owner chose a nested
    `mods/cartoon-fx/biome.json` (`root: false`, `extends: "//"`) that turns off the formatter and
    that one rule for the folder, over a root `overrides` entry or reformatting the mod. The config
    lives with the mod, so its round 2 can reformat and delete it.
  - **Type errors: none.** `tsc` is clean at 2.1.310, so no 0.10.2.
  - **Two commits, one level each.** The import commit holds the mod, the marketplace file and the
    README table. The done-note and the handoff follow in a `docs:` commit.
  - **The README's table of mods drops its Version column**, because decision 8 puts a mod's
    version in `plugin.json` alone, and nothing checks the column.
  - **`npm run types` with cartoon-fx is acceptable.** Its `session.start` sets the session's
    `shown` to null, reads the stored `placement` and registers `/fx`. `$.store` is written only
    when `/fx` runs, and the owner types only `/exit` there.
- **The copy.** `rsync -a --exclude '.claude-plugin/types'` from `~/.claude/mods/cartoon-fx/`:
  - the eight files of the block, with SHA-256 equal to the source's;
  - hygiene ran over the copy first (0 problems);
  - the source folder was never written.
- **`plugin.json`.** Two lines, `author` and `license`, after `description`; still `0.10.1`.
- **The shared files.**
  - `.claude-plugin/marketplace.json`, new, holds:
    - `name`, `owner` and a top-level `description`;
    - cartoon-fx as its first entry, with its `plugin.json` description.
  - The README's table of mods has cartoon-fx's row.
- **cartoon-fx's workflow files,** from the template:
  - `CLAUDE.md`:
    - what it is;
    - its machine identifiers: `cartoon-fx`, `/fx`, the `$.state` keys `shown`, `isYellow`,
      `isRed` and `placement`, and the `$.store` keys `placement` and `fxTakes`;
    - why it has its own `biome.json`;
    - the read order and the commands.
  - `CHANGELOG.md`: one `[0.10.1]` entry, with decision 13's lead paragraph and twelve *Added*
    lines; the link waits for the review commit.
  - `README.md`: what it does, the install lines, and a `/fx` table.
  - `docs/BACKLOG.md`: the Biome reformat, under *Deferred*.
  - `docs/next-session-prompt.md`, between rounds: the next cartoon-fx session is its round 2
    intake, after repo Session 3.
- **Amendments:**
  - **The README's Version column is gone,** and the table edit rode in the mod commit with the
    first row. Amended at plan time, with the owner.
  - **Two commits, not one.** `CLAUDE.md`'s one-level-per-commit rule and the workflow's
    one-commit-per-session disagreed for a repo session that writes a mod. The owner chose the
    level rule. Amended at plan time, with the owner.
  - **The folder's `biome.json` is a new file** beyond the workflow files. `diff -r` lists it
    with them.
- **Measured** (CLI 2.1.310 throughout; desktop 2.1.308):
  - **Biome's nested config.**
    - It works in 2.5.15: `lint` checks 9 files in the folder, and `format` skips them.
    - `npx biome format mods/cartoon-fx` alone exits 1 ("no files were processed"). The gate
      always passes the tooling's paths beside it, so its `format` passes. The mod's `CLAUDE.md`
      says so.
  - **`validate`.**
    - No warning but the allowed `CLAUDE.md` one; it does not flag `biome.json`.
    - 12 hooks, 5 gating (all with `.catch`) and 4 state keys, the same as at intake.
  - **`npm run types`** laid 2.1.310's declarations in `mods/cartoon-fx` alone (the template's
    were fresh), as soon as its session loaded. The live folder gained no declarations (`ls -la`
    of its `.claude-plugin`).
  - **`diff -r` against the source** shows:
    - the two `plugin.json` lines;
    - "Only in" for `CHANGELOG.md`, `CLAUDE.md`, `README.md`, `biome.json`, `docs` and the
      git-ignored `.claude-plugin/types`.
- **Checked by hand:** nothing. The declarations were laid as the `npm run types` session loaded,
  and the gate ran while that session still waited for the owner's `/exit`.
- **Falsified,** copying files aside and back:
  - **The marketplace stage, against the real entry.** With `plugins` emptied, `marketplace` alone
    failed ("mods/cartoon-fx has no entry"); restored with `cmp`.
  - **The folder's exception is no wider than meant.** `eval('1')` appended to `register.tsx`
    failed `lint` (`noGlobalEval`). It also failed `cartoon-fx: tests`, since the engine refuses
    `eval` at module load. Restored, the seven code files hash equal to the source again.
- **Numbers.**
  - `npm run verify`: 14 stages (6 repo, 4 for cartoon-fx, 4 for `mod-template`), all PASS (+4).
  - Tooling tests: 48 (±0).
  - cartoon-fx: 28 tests in one file.
  - Template: 1 test (±0).
- **Review (`/code-review high`), 5 findings: 5 fixed and 0 skipped.** The owner chose to fix all.
  - **The folder's `biome.json` was wider than the import needed.** It is now two `overrides`:
    - the formatter is off for `detect.ts`, `fx.ts`, `register.tsx` and the test file;
    - `noUnusedFunctionParameters` is off for `register.tsx`.

    Every other file in the folder, and any new one, is checked. `npx biome format
    mods/cartoon-fx` alone now checks 5 files and passes, and the "no files were processed" quirk
    is gone.
  - **The changelog's `[0.10.1]` link** points at the import commit, `8d06df2` (decision 8).
  - **cartoon-fx's `CLAUDE.md` points at the root `SPEC.md` §8,** which Session 4 deletes. Its
    block changes only the root's and the template's pointers, so the handoff carries this one to
    Session 4.
  - **The handoff said the live folder was checked "after `npm run types`".** That session was
    still open; the handoff now says so, and asks Session 3 to check again.
  - **`/fx` did two things nobody documented:** an unknown name lists the names it has, and
    `/fx place middle` works like `place conversation`. Both are now in the changelog's entry and
    the README.
  - **Falsified,** copying files aside and back:
    - a misformatted line in `types/index.d.ts` failed `format`;
    - an unused parameter in `detect.ts` failed `lint`;
    - both failed in the same run, and no other stage failed.

    Restored, `diff -r` against the source again shows only the two `plugin.json` lines.
  - **Numbers after the review:** `npm run verify` 14 stages, all PASS (CLI 2.1.310); tooling tests
    48; cartoon-fx 28; template 1.

---

## 3: cartoon-fx as an installed release, and its as-built docs

**Read:** `SPEC.md` §2 (decisions 11, 13, 14), §6 (invariant 7), §7, §8;
`mods/cartoon-fx/CLAUDE.md`; cartoon-fx's sources.

- **The switch to the installed release** (decision 11). The owner is at the keyboard, and every
  step that changes their setup waits for their OK.
  1. **Record what the owner has now,** before anything changes. The owner runs `/fx commit` in a
     current session. The done-note keeps two things:
     - the take number its row shows (`(take N)`, from `$.store` key `fxTakes`);
     - where it played: in the conversation, or in the strip above the prompt (the stored
       `placement`).
  2. **Measure how `$.store` values are keyed,** from the declarations: by the plugin's name, or by
     its id, which differs between a folder copy and `cartoon-fx@claude-code-mods`. If they are
     keyed by id, stop and ask the owner before installing: the stored values would not carry
     over, and decision 14 needs an amendment.
  3. `gh auth status`. A private repository installs only where git holds a credential for
     github.com; whether to run `gh auth setup-git` is the owner's call.
  4. The owner installs cartoon-fx at user scope:
     `claude plugin install cartoon-fx --marketplace FairCat-GD/claude-code-mods`.
  5. **Remove the old entry.** With the owner's OK, remove the `CLAUDE_CODE_PLUGIN_DIRS` entry
     that names `~/.claude/mods/cartoon-fx` from `~/.claude/settings.json`, so that one copy loads.
     - Show the exact edit first, and keep the removed line in the done-note, so it can be put
       back.
     - Steps 4 and 5 run back to back, before any new session starts, so that no session loads two
       copies.
  6. **Checked by hand.** The owner starts a new session, in the desktop app and in a terminal,
     and runs `/fx all`. Each outcome goes in the done-note:
     - every effect plays;
     - it plays where step 1's did, and its take number follows step 1's.

     If the stored values did not carry over, stop. The owner chooses: set the placement again with
     `/fx place`, or put the removed line back and uninstall.
  7. **Measure what the installed copy holds.** List the install path that `claude plugin list`
     shows, and record which of the mod's files it holds. Correct SPEC §4's "How a mod reaches the
     owner" by amendment if it differs.
  8. **Measure the unpushed-build path** of decision 11. What does a
     `claude --plugin-dir mods/cartoon-fx` terminal session do beside the installed copy: load
     both, replace it, or refuse? Record the answer in the root `CLAUDE.md`, in cartoon-fx's
     `CLAUDE.md` and in the done-note.
  9. `~/.claude/mods/cartoon-fx` stays. The done-note says the owner may remove it.
- **The as-built docs.**
  - **`mods/cartoon-fx/docs/ARCHITECTURE.md`**, from the template:
    - the overview, and each hook and what it reacts to;
    - the detection rules, the drawings, and placement with its fallback to the strip;
    - its `$.state` and `$.store` values;
    - its invariants, and its testing strategy with what the kit cannot see;
    - deliberate decisions and known debt;
    - a baseline table: tests, plus `validate`'s counts of hooks, gating hooks and state keys.
  - **`mods/cartoon-fx/docs/USER-GUIDE.md`:**
    - what plays when;
    - `/fx` and its arguments;
    - placement;
    - how the terminal and the desktop app differ.
  - **`mods/cartoon-fx/docs/BACKLOG.md`:** the note's ideas under *Directions*, its debt under
    *Deferred*, and what nobody checked under *Not yet checked by hand*.
  - The mod's `CLAUDE.md` gets the ARCHITECTURE read paragraph, and the README stays true.
- **No code changes, and no version.** cartoon-fx stays at 0.10.1.
- **Ask at the start of 3:**
  - **The note.** The owner pastes the note from cartoon-fx's original chat. Without one, the docs
    come from the code alone, and the done-note says so.
  - **If Session 2's work is not on `origin/main`,** the switch cannot run. The owner chooses: push
    now, or run the docs half alone and move the switch to a session inserted after it. Either way
    the choice is logged as an amendment.

**Gates:**
- `npm run verify` green, with cartoon-fx's counts unmoved.
- The hand checks of step 6, recorded, against the values recorded in step 1.

**Watch for:**
- **`~/.claude/settings.json` belongs to the owner.** Change only the one entry, and only after
  showing the edit.
- **Plugins load when a session starts.** Checking the installed copy takes a new session; this
  chat keeps whatever it started with.
- **The install never prompts for a credential.** A private repository with no git credential
  fails with a missing-marketplace message.
- **Don't copy the note's private details.** It may name people, chats or the owner's projects.
  The docs keep the reasons and drop the names.
- **Docs describe the code as it is.** Where the note and the code disagree, the code wins, and the
  done-note records the difference.

**Done (2026-10-25, no version; cartoon-fx stays 0.10.1).**
- **Decided with the owner at the start:**
  - **The store is keyed by id, so install and start fresh.** Measured in plan mode, before
    anything changed (below). Nothing was stored, so nothing could carry over. The owner chose to
    install and amend decision 14 over copying a store file or holding the switch.
  - **No note.** The note from cartoon-fx's original chat was not available, so the as-built docs
    come from the code alone. With no note, nothing disagreed with the code.
  - **Two commits, one level each,** as in Session 2: the mod's docs, then the repo's files.
- **The switch** (CLI 2.1.310; desktop engine 2.1.308):
  1. **Before anything changed,** `~/.claude/plugins/store/` did not exist. The owner ran
     `/fx commit` in this session's chat, on the folder copy: **take 1, played in the
     conversation** under its output row. It created `cartoon-fx_inline-7a58292beebc.json` holding
     `{ "fxTakes": 1 }`, the file name the code predicts for `cartoon-fx@inline`.
  2. **`$.store` keying** (measured from both engines' code, then on disk): above.
  3. **The credential was already in place.** `gh` is signed in, and git's helper for github.com
     is `gh auth git-credential`. The install cloned over SSH anyway
     (`git@github.com:FairCat-GD/claude-code-mods.git`).
  4. **The install**, run from this session with the owner's OK:
     `claude plugin install cartoon-fx --marketplace FairCat-GD/claude-code-mods`. It added the
     marketplace (declared in user settings) and installed `cartoon-fx@claude-code-mods` 0.10.1 at
     user scope, from commit `3f79906`. Against snapshots taken first, it wrote:
     - in `~/.claude/settings.json`, `enabledPlugins: { "cartoon-fx@claude-code-mods": true }`
       and `claude-code-mods` under `extraKnownMarketplaces`;
     - the install's entry in `~/.claude/plugins/installed_plugins.json`;
     - the marketplace's entry in `~/.claude/plugins/known_marketplaces.json`.
  5. **The old entry, removed straight after,** with the owner's OK, the edit shown first. This
     line left `env` in `~/.claude/settings.json`, leaving `"env": {}`:
     `"CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/cartoon-fx"`.
     `env -u CLAUDE_CODE_PLUGIN_DIRS claude plugin list` then showed `cartoon-fx@claude-code-mods`
     alone.
  6. **Checked by hand,** in new sessions, with the session transcripts and the store files backing
     each:
     - **Desktop app:** `/fx all` played all ten effects under its output row, take 1.
     - **Terminal:** `claude` in `~`, `/fx all`, glyphs in the strip above the prompt, take 2.
     - The installed id's store file then held `fxTakes` 2, and the `@inline` file still 1.
  7. **What the installed copy holds:** the 14 tracked files of `mods/cartoon-fx` at `3f79906`,
     byte for byte (`cmp` each), plus the engine's `.in_use` marker.
     - It is in `~/.claude/plugins/cache/claude-code-mods/cartoon-fx/0.10.1/`, docs, handoff,
       `CLAUDE.md`, `biome.json` and tests included.
     - No `.claude-plugin/types/` appeared there after the hand-check sessions.
     - The marketplace is a clone of the whole repository, in
       `~/.claude/plugins/marketplaces/claude-code-mods/`.
     - SPEC §4 point 4 is amended.
  8. **The unpushed-build path.** `claude --plugin-dir mods/cartoon-fx` replaces the installed
     copy:
     - With a debug file, `claude -p --plugin-dir mods/cartoon-fx "/fx push"` at the repository's
       root logged `Plugin "cartoon-fx" from --plugin-dir overrides installed version`.
     - It loaded the hooks module `cartoon-fx@inline` alone, answered once (`playing push
       (take 2)`), and wrote `fxTakes` to the `@inline` store. The installed one's stayed at 3.
     - `claude --plugin-dir … plugin list` shows both copies, which does not show which one runs.
     - Recorded in the root `CLAUDE.md` and cartoon-fx's `CLAUDE.md`.
  9. **`~/.claude/mods/cartoon-fx` was never written,** and the owner may remove it. The `@inline`
     store file is what `--plugin-dir` sessions use. Desktop sessions started before the switch
     keep the folder copy until they end.
- **The as-built docs,** from the code alone:
  - `mods/cartoon-fx/docs/ARCHITECTURE.md`, following the workflow's outline: overview, the 12 hooks,
    detection, the drawings, playing and placement, `$.state` and `$.store`, reach, testing,
    packaging, deliberate decisions, known debt and the baseline;
  - `mods/cartoon-fx/docs/USER-GUIDE.md`: what plays when, `/fx`, where effects play, the terminal
    and the desktop app, and installing, updating and trying a build;
  - `mods/cartoon-fx/docs/BACKLOG.md`:
    - *Deferred:* three items of debt read from the code;
    - *Not yet checked by hand:* seven items;
    - *Directions:* empty, with no note;
  - `mods/cartoon-fx/CLAUDE.md`: the ARCHITECTURE read paragraph, the store's key, *Trying an
    unpushed build*, and the `npm run types` row;
  - its handoff, rewritten: the round 2 intake may start now.
  - The README stays as it was, and there is no changelog entry, since no user sees a change.
- **The repo's files:**
  - SPEC decision 14 and §4 point 4, each with an amendment by the owner;
  - the root `CLAUDE.md`: the store sentence under machine identifiers, and the paragraph after
    Commands on the installed release and `--plugin-dir`;
  - the handoff, for Session 4.
- **Amendments:**
  - **Step 6's expectation.** The block expected the take number to follow step 1's. The store is
    keyed by id, so the installed copy started fresh (take 1). Amended at plan time, with the
    owner.
  - **Step 3 needed nothing.** The credential helper was already set.
  - **Step 8 was measured headless, not in an interactive terminal session.** The owner's attempt
    was typed as a prompt inside a `claude` in `~`, not run as a shell command, so it loaded the
    installed copy alone (take 3, the installed store). The headless run loads plugins the same
    way. The interactive case is under *Not yet checked by hand* in cartoon-fx's backlog.
  - **The install ran from this session,** at the owner's word, rather than in the owner's own
    terminal.
- **Measured, beyond the steps:** `env -u CLAUDE_CODE_PLUGIN_DIRS claude …` never kept the folder
  copy out while `settings.json` set the variable. Settings' `env` applies after the shell's, so
  `claude plugin list` still showed `cartoon-fx@inline` before the switch. With the entry gone,
  this no longer matters. The root `CLAUDE.md` says so.
- **Falsified:** nothing. This session added no checks.
- **Numbers** (CLI 2.1.310):
  - `npm run verify`: 14 stages, all PASS (±0);
  - tooling tests 48 (±0);
  - cartoon-fx 28 tests in one file, and `validate` 12 hooks, 5 gating (each with a `.catch`), 4
    state keys (±0);
  - template 1 (±0).

---

## 4: The repo's documentation pass; close the round

**Read:** `SPEC.md` in full; `CLAUDE.md`; every done-note in this file;
`mods/cartoon-fx/docs/ARCHITECTURE.md`.

- **`docs/ARCHITECTURE.md`**, from the template:
  - the overview, the two levels and who edits what;
  - the invariants, and how each is enforced;
  - the gate's stages, hygiene, the marketplace, the import scan and the template;
  - how the API declarations are provided;
  - the testing strategy and what each layer cannot see;
  - distribution: install, update, and the unpushed-build path;
  - deliberate decisions and known debt;
  - a baseline table: stages, tooling tests, the template's counts, and each mod's counts.
- **`docs/USER-GUIDE.md`**, for the owner:
  - installing, updating and trying out a mod;
  - starting a new mod, from copying the template to opening its intake;
  - running parallel sessions in one checkout.
- **`docs/MOD-KICKOFF.md`.** The workflow kit's `KICKOFF.md`, adapted to a mod in this repository:
  - the mod's files live under `mods/<name>/`;
  - its Session 1 starts from the template;
  - this repository's rules and SPEC §8's practices bind it;
  - the PDD is optional (decision 2);
  - its commits are scoped and its tags namespaced.
- **`README.md`** made truthful: what the repository is, its mods, installing, developing, and the
  docs.
- **`CLAUDE.md`.** The "Read `docs/spec/SPEC.md`" paragraph is replaced by the ARCHITECTURE one,
  and anything in SPEC §8 a session needs every time moves into the rules. The template's
  `CLAUDE.md` gets the same change.
- **`docs/BACKLOG.md`:** everything still open in round 1.
- **The close.** The session's commit carries the last done-note. Then a separate
  `docs: close round 1` commit deletes `docs/spec/` and rewrites the handoff from the between-rounds
  template: no round is in progress, and the next repo-level session is an intake.

**Gates:**
- `npm run verify` green, with every count matching the new baseline table.
- Every path and command the new docs name is checked to exist or to run.

**Watch for:**
- **The baseline is measured, not copied** from the done-notes.
- **The repo-level docs never describe a mod's internals.** They point at the mod's own
  `ARCHITECTURE.md`.
- **The review follows the close,** as the workflow says. `SESSIONS.md` is gone by then, so the
  review's findings go in the review commit's message and in the handoff.

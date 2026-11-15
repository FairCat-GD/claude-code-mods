# claude-code-mods — architecture

How the repository is built. **Decided** is the owner's: what an intake answered or the owner
settled with a session. It changes only with the owner, and each change after round 1's close is
logged in the *Decision log*. **Built** is what exists and how, with the decisions a session made
on its own within its scope, each with its why; every session keeps it true. Until something is
built, its Built part says "Not yet: Session <id>", or "Not yet: backlog, <item>" once the round
that planned it closes without it. In the invariants, each rule and its why are decided and
*Enforced by* is built; the debt and the baseline are built only.

This file is the repo level's. Each mod's own is `mods/<name>/docs/ARCHITECTURE.md`, and nothing
here describes a mod's internals.

## Overview

**Decided.**

```
                 the repo level                                  the mod level
  ┌───────────────────────────────────────────────┐      ┌──────────────────────────┐
  │ scripts/ + tests/   the gate (npm run verify)  │─────▶│ mods/<name>/             │
  │ templates/mod-template/   where a mod starts   │─────▶│   the whole plugin, and  │
  │ .claude-plugin/marketplace.json  one entry per │◀─────│   its own workflow files │
  │                                   mod          │      └──────────────────────────┘
  │ docs/   the repo level's workflow files        │                  │
  └───────────────────────────────────────────────┘                  ▼
              pushed to GitHub, the marketplace ──────▶ the owner's installed release
```

- **The repository is a home for mods** and the marketplace they install from.
- **Each mod is an independent Claude Code plugin** in `mods/<name>/`, with its own tests, docs,
  rounds and versions. No mod depends on another or on the root.
- **The workflow runs at two levels.** The repo level covers the tooling, the gate, hygiene, the
  marketplace and the template; its workflow files are in `docs/`. Each mod is a project of its
  own, with the same workflow files in its folder. `docs/DEVELOPMENT-WORKFLOW.md` exists once, at
  the root.
- **A session works at one level, and on one mod at most.** Who edits what:

  | Path | Edited by |
  |---|---|
  | `mods/<name>/` | that mod's sessions |
  | `<name>`'s entry in `.claude-plugin/marketplace.json`, its row in `README.md` | that mod's sessions |
  | everything else | repo sessions |

**Built.** Eight scripts and their tests, the template, and one mod, cartoon-fx (its
`ARCHITECTURE.md` is in its folder). The marketplace lists it.

## Context

**Decided.**
- **Claude Code's engine** runs every mod, as a plugin of function hooks. Its plugin API is early
  access and changes between releases, so the declarations the running build lays are the
  authority, never memory. Anthropic owns it.
- **Two builds run here.** The `claude` CLI on PATH runs `claude plugin validate`,
  `claude plugin test` and `npm run types`, and updates itself. The desktop app runs its own
  engine, which can be another version. A done-note records the versions its checks ran on.
- **GitHub** holds the private repository `FairCat-GD/claude-code-mods`, private until the owner
  publishes it. Pushed, it is the marketplace the owner installs from.
- **The owner's term file**, `~/.config/hygiene/terms.txt`, is outside every repository. Hygiene
  reads it; a test never does.
- **The owner's Claude Code setup** (invariant 7) is never changed without asking.

**Built.**
- **Versions measured.** The CLI was 2.1.296 at intake, 2.1.310 by Session 1's end, and 2.1.325
  from the 2026-11-14 review on. The desktop engine was 2.1.308 at intake and 2.1.325 by
  2026-11-15.
- **A CLI update can turn the gate red for real.** At 2.1.325 a required prop was added to a
  surface's props, and a mod's test fixture that lacked it failed `validate` and `types` with no
  change of its own.
- **The engine keeps a plugin's stored values in `~/.claude/plugins/store/`,** one JSON file per
  plugin id.
- **The plugin-authoring skill** writes the desktop build's declarations beside itself, as one
  file. That is not what `tsc` uses here.
- **The first interactive `claude` in a new checkout asks Claude Code's folder-trust question.**
  `npm run types` meets it on a fresh clone.
- **`CLAUDE_CODE_PLUGIN_DIRS`** once ran cartoon-fx from a folder copy, through the owner's
  settings. It was removed when the installed release took over (2026-10-25). The tooling still
  removes it from every `claude` it starts, in case a shell exports it.

## Stack and pins

**Decided** (2026-10-24, amended the same day).
- **The tooling is TypeScript on Node 26.** Node runs the `.ts` files directly by stripping their
  types, so there is no build step. Only erasable syntax survives: no enums, namespaces or
  parameter properties, and relative imports name their `.ts` extension.
- **`package.json`** is `private` and `"type": "module"`, needs Node `>=26`, and pins three
  devDependencies exactly:
  - `typescript` 6.0.3: 7.x moves the JS API the import scan parses with under `unstable/`;
  - `@biomejs/biome` 2.5.15, which formats and lints;
  - `@types/node` 26.6.5, without which the tooling's `types` stage cannot type `node:` modules.

  The lockfile is committed, and `npm ci` restores it. No dependency is added before it is used,
  and none is upgraded in passing.
- **Mods are TypeScript too,** typed against the engine's declarations for the CLI's build. Their
  tests run under `claude plugin test`, in the engine's environment, not Node.

**Built.**
- The tooling's `tsconfig.json`: strict, `noEmit`, `erasableSyntaxOnly`, `verbatimModuleSyntax`,
  `allowImportingTsExtensions`, `nodenext`, `noUncheckedIndexedAccess`, over `scripts` and
  `tests` with `tests/fixtures` left out.
- `biome.json`: spaces, indent 2, width 160, single quotes, double quotes in JSX, semicolons and
  arrow parentheses as needed; `jsxRuntime` `transparent` with `h` and `Fragment` as globals;
  recommended lint rules, warnings failing. It reads `.ts`, `.tsx` and `.json`, never Markdown,
  and leaves out every `docs` folder, every `.claude-plugin/types` and the lockfile. It follows
  `.gitignore`.
- Measured on this machine on 2026-11-15: node 26.7.0 and npm 11.19.0, CLI 2.1.325, git 2.50.1.

## Layout and boundaries

**Decided.**
- **Layout:**

  ```
  claude-code-mods/
  ├── .claude-plugin/marketplace.json   the marketplace: one entry per mod
  ├── CLAUDE.md                         the rules every session follows
  ├── README.md                         what this is, its table of mods, how to install one
  ├── LICENSE                           MIT
  ├── package.json, package-lock.json   the tooling's pinned dependencies
  ├── biome.json, tsconfig.json         format, lint and type settings
  ├── scripts/                          the gate and the tooling
  ├── tests/                            the tooling's tests; tests/fixtures/ is fictional
  ├── templates/mod-template/           where a new mod starts; checked by the gate
  ├── docs/                             the repo level's workflow files
  └── mods/<name>/                      one mod: the whole plugin, and its workflow files
  ```

  The names are fixed; the files inside `scripts/` and `tests/` are each session's.
- **Boundaries:**
  - every file a mod imports is inside its folder, and every bare import names a module the
    engine declares;
  - no mod imports from another mod or from the root, and the tooling is never imported by a mod;
  - the template is checked like a mod, and its folder and its `plugin.json` name are both
    `mod-template`;
  - parallel sessions share this one checkout, each editing only its own paths (*Overview*).

**Built.**
- The first two boundaries: *Enforced by* the import scan and `claude plugin validate`, per
  folder.
- The template: *Enforced by* the per-folder stages, which run on it, and the marketplace stage,
  which checks its manifest.
- Who edits what: by rule only (`CLAUDE.md`'s entry gate). Nothing stops a session editing
  another's paths.

## The invariants

1. **Nothing private enters the repository.** Banned: personal names, email handles, the names of
   the owner's other projects, home-directory paths (`~` instead), and AI attribution. Naming
   Claude Code, its plugin API, `CLAUDE.md` and the workflow's review command is allowed.
   Fixtures are fictional. *Why:* the whole history will be published, and history cannot be
   cleaned without a rewrite. *Enforced by* the hygiene stage: the owner's term list against
   every file, path and commit message, attribution against every commit message, secrets by
   their exact shapes, and conflict markers. The last read of each diff covers what it cannot
   see (*Testing strategy*).
2. **A mod is self-contained.** Every file it imports is inside its folder; no mod imports from
   another mod or from the root; each validates, tests and installs alone. *Why:* the installed
   copy holds only the mod's folder, so a reach outside it breaks there. *Enforced by* the import
   scan and `claude plugin validate`.
3. **The marketplace matches `mods/`.** Every folder has exactly one entry and every entry its
   folder; names agree with folders and `plugin.json`; each source is `./mods/<name>`; no entry
   carries a version. *Why:* the marketplace is how the owner installs. *Enforced by* the
   marketplace stage.
4. **A mod's version lives in its `plugin.json` alone, and its `CHANGELOG.md`'s newest entry
   names it.** *Why:* one home per version, so the two cannot drift. *Enforced by* the
   marketplace stage.
5. **What the engine writes is never committed:** `.claude-plugin/types/`, or any copy of Claude
   Code's API declarations. *Why:* they are regenerated for every build, and they are not this
   repository's to publish. *Enforced by* `.gitignore` (`**/.claude-plugin/types/`) and the
   marketplace stage, which fails on any tracked path under one.
6. **Tests use fictional data and read no docs.** Fixtures live in `tests/fixtures/`. *Why:* a
   test that reads a document makes the document undeletable, and the history will be public.
   *Enforced by* review; the fixtures' README states it.
7. **Nothing touches the owner's Claude Code setup without asking:** `~/.claude/settings.json`,
   the installed plugins and marketplaces, `~/.claude/mods/`, the session mods folder the
   plugin-authoring skill watches, a mod's stored values in the owner's sessions, and the owner's
   term file. This binds tests, harnesses and sessions alike. *Why:* all of it runs in every
   session the owner has. *Enforced by* the rule; the engine's test kit has no file, network or
   process access, and the tooling's tests run the CLI with a scratch home. The gate itself does
   not (*Known debt*).
8. **Machine identifiers keep their spelling** (*The repository's data*). *Why:* installs and
   stored data live under them. *Enforced by* the rule; `new-mod` says so when it names a mod.

## What a mod is

**Decided.** A mod is a Claude Code plugin of function hooks.
- **Its files.** `.claude-plugin/plugin.json` is the manifest. `hooks/hooks.json` names one hooks
  module, which exports `register(on, options)`. Every file the module imports is inside the
  mod's folder.
- **Where it runs.** Inside the engine's own environment, with no DOM, no Node and no `import()`.
  It reaches everything outside itself through `$`, and its JSX compiles against the global `h`.
- **How it is tested.** Its tests run under `claude plugin test`, against the engine's kit
  (`claude-code/testing`).
- **Its types.** `tsconfig.json` extends `./.claude-plugin/types/tsconfig.json`, the one the engine
  lays for the build that runs it.
- **What every mod follows** is in `CLAUDE.md`, under that heading.

**Built.** The template's module is `hooks/register.ts`, and cartoon-fx's is `register.tsx`. The
laid `tsconfig.json` types `hooks/`, `types/` and `tests/` against the modules `claude-code`,
`claude-code-tools` and `claude-code-mcp`, for `es2023` with JSX through `h`.

## The repository's data

**Decided.**
- **`plugin.json`** always has `name` (the folder's), `version` (`x.y.z`), `description`,
  `author` (`{ "name": "FairCat-GD" }`) and `license` (`"MIT"`). It has `types` when the mod
  declares `$.state` values or adds a noun to `$`.
- **`.claude-plugin/marketplace.json`** has `name` `claude-code-mods`, `owner`
  `{ "name": "FairCat-GD" }`, a top-level `description`, and `plugins`: one entry per mod in
  folder-name order, each `{ "name", "source": "./mods/<name>", "description" }`, never a
  version.
- **A mod's `CHANGELOG.md`** follows the workflow's template, and its newest entry names the
  version in `plugin.json`. Each version links to the commit that first put it in `plugin.json`
  in this repository, added by the session's review commit, since no commit can name its own sha.
- **Stored data.** A mod's `$.store` values are the owner's data, kept across sessions. The engine
  keys them by the plugin's id, `<name>@<marketplace>`, not its name. It carries a store to a new
  id only for renamed built-in plugins, so a new name or marketplace starts with none, and a
  folder copy (`<name>@inline`) never shares the release's. A change to a stored value's shape
  still reads the old shape: forward-only.
- **Machine identifiers, never renamed:**
  - the marketplace `claude-code-mods` (installs are `<mod>@claude-code-mods`);
  - the repository `FairCat-GD/claude-code-mods`;
  - each mod's name: its folder, its `plugin.json` `name`, its install id and its slash commands.
    A rename breaks installs and loses its stored values.

**Built.** The marketplace stage checks the manifests, the marketplace and the changelogs. The
store's keying was measured in both engines' code and on disk (CLI 2.1.310, desktop 2.1.308).

## The gate (`npm run verify`)

**Decided.**
- **`verify` is the gate.** It runs named stages, each failing on its own; every stage runs even
  after one fails, and a summary follows. It is green before every commit, run with the drafted
  message, or the docs-only command for a commit that changes only docs. The full run comes before
  any push.
- **Repo stages:** `format` and `lint` (Biome), `types` (`tsc` for the tooling), `tooling-tests`
  (`node --test` over the top level of `tests/` only), `marketplace`, and `hygiene`.
- **Per-folder stages,** for each `mods/<name>` and for the template: `validate`, `types`, `tests`
  (`claude plugin test`) and `imports`.
- **Names pick what runs.** Each name is a stage or a mod. Mods alone narrow the folders, and
  `format` and `lint` then cover the tooling and those folders only. Stages alone run just those.
  Both run those stages for those mods. `--message <draft>` and `--all` go to hygiene.
- **A stage that cannot start** (no `claude`, no declarations, no `npm ci`) fails alone, with a
  message naming the fix.
- `docs/` is left out of every stage but hygiene.

**Built.**
- **`scripts/verify.ts`.** `plan` turns the names into stages; `main` runs them and prints the
  summary with each stage's time.
  - Exit codes: 0 green, 1 any stage failed, 2 for a name it does not know, a name that is both a
    stage and a mod, or `--message`/`--all` without hygiene among the stages.
  - `STAGE_NAMES` comes from the stages themselves; `types` names the tooling's and each
    folder's.
  - The draft's path is resolved where npm was run (`INIT_CWD`).
  - `tooling-tests` runs `node --test "tests/*.test.ts"`. The quoted top-level pattern never
    reaches `tests/fixtures/` or a mod's tests, which import `claude-code/testing` and fail in
    Node.
  - Any error that stops a stage starting fails that stage alone; the other stages still run.
- **`scripts/repo.ts` is what the scripts share:**
  - the folders (`modNames`, `modFolders`), the template's name, the marketplace path;
  - finding `claude` on PATH (`findClaude`, passing over a directory of that name), and
    `claudeCommand`, which runs it in the hermetic environment: `CLAUDE_CODE_PLUGIN_DIRS`
    removed, so the owner's live mods never load into a `claude` the tooling starts;
  - `readClaudeVersion`, the one reading of the CLI's version, which `verify` caches for its run;
  - the declarations' checks (`laidVersion`, `declarationsProblem`, `staleFolders`);
  - `report`, the print-and-count tail of `validate`, `marketplace` and `imports`.
- **The folder `types` stage** fails when the laid declarations' first line, `// Written by Claude
  Code X`, names another version than `claude --version`, naming both and the fix.

## Hygiene

**Decided** (2026-10-24, rebuilt 2026-11-14 on the workflow kit's design). The stage holds only
what a script decides with next to no false alarms. Its checks are *A clean repository* in
`docs/DEVELOPMENT-WORKFLOW.md`:
- private terms, from the owner's term file, in the files, paths and messages it reads;
- AI attribution in commit messages;
- secrets in their issuers' exact shapes, and a `.env` file a commit could record;
- conflict markers at the start of a line.

A routine run reads what a commit could still change; a full scan reads everything. A hit never
prints the term or the secret, and the stage never holds what it bans.

**Built** (`scripts/hygiene.ts`; `node scripts/hygiene.ts [--terms <file>] [--message <draft>]
[--all]`).
- **Terms.** One word per line, from `~/.config/hygiene/terms.txt`, or `--terms` for the tests. A
  missing file fails; an empty one passes; a line that is not one word fails, unprinted.
- **Tokens.** Runs of letters, their marks and digits in any script, with their camel-case words
  and digit groups, read before lowercasing. Terms and tokens are NFC-normalised and lowercased.
  Lines split on `\n` alone.
- **Attribution.** The patterns name the tools, not the companies, so "generated with the codegen
  script" passes. Session links match any link on the AI chat hosts. They are assembled from
  pieces, so the stage's own source does not match them.
- **Secrets.** A private-key header; AWS, GitHub (classic and fine-grained), Slack, Anthropic and
  OpenAI tokens, each bounded by characters that cannot belong to it; and a `.env` or `.env.*`
  file a commit could record, in any case, but `.env.example`, `.env.sample` and
  `.env.template`.
- **Conflict markers.** Seven `<` or seven `>` then a space, at a line's start; a line of `=`
  alone is a heading's underline.
- **The routine run** reads the drafted message; each path that differs from `HEAD` in the index
  or the tree, both versions; untracked files that are not ignored; and the commits on no remote
  (`HEAD --not --remotes`), their messages and the paths they changed as those stand at `HEAD`
  (merges by their first parent). Files holding a NUL are skipped as binary, a link is read as
  its target's name, and submodule entries are skipped.
- **The full scan** reads every tracked and untracked-not-ignored file, the staged contents of
  every path (a conflicted path's working copy), every message reachable from `HEAD`, and the
  draft. It runs on `--all`, or when the stamp `hygiene-scanned` in the common git directory is
  missing or older than the term file or `scripts/hygiene.ts`. A hit in a pushed message does
  not fail: the last line counts them. The stamp is renewed after a full scan with no failure.
- **It judges the repository it runs in** (the git top level of its working directory), so a test
  that runs it in a scratch repository never reads this checkout or its stamp.
- Every git call sets `log.showSignature=false`, which would otherwise print into the output it
  parses. Objects are read through one `git cat-file --batch`, and a missing one fails the stage
  by name.

## The marketplace stage

**Decided.** Invariants 3, 4 and 5, and each `plugin.json` against *The repository's data*.

**Built** (`scripts/marketplace.ts`, then `claude plugin validate --strict .`).
- The marketplace's name, owner, description, entries (no duplicates, no versions, the right
  sources, a description each, a folder each) and folder-name order; every folder under `mods/`
  has an entry.
- Every manifest, the template's included, against its fields, and against its changelog's
  newest `## [x.y.z]` entry; a fenced example is no entry.
- No tracked path under any `.claude-plugin/types/`.
- With a marketplace file, `claude plugin validate --strict .` reads it too. An empty `plugins`
  list and a missing top-level `description` are warnings there, so `--strict` fails them. It
  checks neither that an entry's folder exists nor that it carries no version; the script does.

## `validate` and the import scan

**Decided.** A mod's `validate` fails on every error and warning but one, "CLAUDE.md at the plugin
root is not loaded as project context", which every mod draws from the workflow `CLAUDE.md` in
its folder: that file is for the sessions that develop the mod, not context it ships. The import
scan reads the list of declared modules from the laid declarations, never from a list kept in the
script, so a new build's modules pass without an edit.

**Built.**
- **`scripts/validate.ts <folder>`** runs `claude plugin validate --json` in the hermetic
  environment, prints the readable notes from the same report (what each file hooks and calls,
  which hooks gate, marking the allowed warning), and judges it. The report's
  `directory.findings`, checks for submitting to Anthropic's plugin directory, are not judged, as
  the CLI's own result does not count them.
- **`scripts/imports.ts <folder>`** reads every source's specifiers with
  `ts.preProcessFile`.
  - A relative import must resolve to a file inside the folder; `./x.js` may name `x.ts`, as
    bundler resolution allows, and `/// <reference path>` is a file.
  - A bare import, and `/// <reference types>`, must name a module some top-level
    `declare module` in the laid declarations declares. At 2.1.325 those are `claude-code` and
    `claude-code/testing`; `claude-code-tools/` and `claude-code-mcp/` are additions to
    `claude-code`, not modules to import.

## The API declarations (`npm run types`)

**Decided.** The declarations come from the engine, for the CLI's build, and are never committed.
`npm run types` is the one step a fresh clone needs after `npm ci`, and the step after a CLI
update or a new mod.

**Built** (`scripts/types.ts`).
- No `claude plugin` command, `claude -p` or desktop session writes them. An interactive
  `claude --plugin-dir <folder>` lays them in that folder's `.claude-plugin/types/` as soon as
  its session loads: `claude-code/index.d.ts`, `claude-code-tools/`, `claude-code-mcp/` (which
  lists the session's connected servers), a `tsconfig.json`, and a `.gitignore` of `*`. At
  2.1.325 they are about 24,200 lines.
- The script starts that session for every folder whose declarations are missing or from another
  build, and says so and exits when none is. It keeps the owner's live mods out three ways: the
  hermetic environment, `--setting-sources project,local` (user settings, where the release is
  enabled, are skipped) and `--settings` emptying `CLAUDE_CODE_PLUGIN_DIRS`.
- The owner types `/exit`; the script then reads the CLI's version again, since the CLI can update
  itself during the session, asks for another run when it moved, and checks every folder.
- It refuses to run without a terminal.

## The template and `new-mod`

**Decided.**
- **`templates/mod-template/` is where a new mod starts.** The gate checks it like a mod, so it
  never rots.
- **It ships** the plugin (`/hello`, declared on `session.start` and answered on `command.run`),
  one test, `tsconfig.json`, and the workflow files: `CLAUDE.md`, `CHANGELOG.md`, `README.md`,
  `docs/ARCHITECTURE.md` (the workflow's outline, with what every mod shares filled in),
  `docs/USER-GUIDE.md`, `docs/BACKLOG.md`, and a handoff whose next session is the mod's intake.
  `tests/fixtures/`, `types/` and `docs/spec/` are made when first needed: `types/` only with
  `$.state`, `docs/spec/` by the intake.
- **`npm run new-mod -- <name> "<description>"` makes a mod from it.** It writes only
  `mods/<name>/` and the marketplace entry, and prints the README row ready to paste.
- **The mod's intake commits what `new-mod` made,** with its docs, in
  `docs(<name>): open round 1 — <theme>`. `docs/MOD-KICKOFF.md` is that intake's guide.
- **A new mod's Session 1 releases 0.1.0.** It starts from the made mod, replaces `/hello` with
  the mod's first slice, and rewrites the 0.1.0 changelog entry, which no one has installed.
  Round 1 ends at 1.0.0.

**Built** (`scripts/new-mod.ts`).
- It refuses, writing nothing: a name that is not lowercase kebab-case, `mod-template`, a verify
  stage's name, an existing folder, a blank description, a missing template or marketplace. Every
  check runs, and every file is read and renamed, before the first write; a write that fails
  removes the folder.
- It copies the template without `.claude-plugin/types/` or `.DS_Store`, and renames every
  `mod-template` in file names and contents; a file that is not UTF-8 text is copied byte for
  byte. It sets `plugin.json`'s version to 0.1.0 and its description, dates the changelog's
  0.1.0 entry today (local time), and adds the marketplace entry in name order.
- It writes JSON two-space, with a one-field object on one line where it fits in 160 columns, as
  Biome keeps it.
- It prints what is left: the README row (a `|` escaped), `npm run types`,
  `npm run verify -- <name>`, and the intake's handoff.

## Testing strategy — six layers, and what each cannot see

**Decided.** `verify` runs the stages of *The gate*. It is green before every commit, or the
docs-only command (`npm run verify -- hygiene --message <draft>`) for a commit that changes only
docs: Biome reads no Markdown here, so hygiene is the only stage that reads them. A mod's
`CLAUDE.md` is read by `validate`, so a change to one runs that mod's `validate` too. There is no
CI: the session holds the gate, and the owner's review and push approval stand behind it. The
commands are in `CLAUDE.md`.

**Built.**

| Layer | Runs | Covers | Cannot see |
|---|---|---|---|
| `claude plugin validate` | `verify`, per folder | The manifest and the module as the engine reads them: what it hooks and calls, which hooks gate, everything the engine would refuse | Behaviour |
| `tsc` | `verify`: the tooling, and each folder against its laid declarations | Types, against one build | Behaviour; any build but the CLI's, the desktop's included |
| `claude plugin test` | `verify`, per folder | A mod's hooks against the engine's kit, with the clock and the store mocked, on each surface a test names | What a surface actually paints; the real order and timing of events; another plugin above the mod; a desktop engine newer than the CLI |
| Tooling tests | `verify` (`node --test`) | The gate's own scripts, hygiene included, in scratch repositories and roots, with fixture terms and a scratch home for the CLI | The real term file, the real stamp, the owner's config |
| Hygiene and marketplace | `verify`; hygiene with the drafted message, in full when the term file or the stage changes | Private terms in files, paths and messages; attribution in messages; secrets by their exact shapes; conflict markers; the marketplace against the folders | Images and other binaries, their metadata included; a term joined inside one lowercase run; attribution in files; a home-directory path; a secret of any other shape; a submodule entry |
| By hand | Recorded in done-notes | A mod in the app, from the installed release or a `--plugin-dir` session; what a session runs that no harness can | Anything not written down; what nobody checked goes to the level's `docs/BACKLOG.md` |

The last read of each diff covers what hygiene cannot see: a home-directory path, attribution in a
file, the owner's data.

## Packaging

**Decided.**
- **The owner runs each mod as the release installed from this marketplace,** at user scope, so
  what runs every day has passed the review and a push approval. In a terminal:
  `claude plugin install <mod> --marketplace FairCat-GD/claude-code-mods`; in the desktop app, +
  beside the prompt, then Plugins, then Add marketplace.
- **`claude plugin update <mod>` installs a pushed version,** not pushed work, so every change
  meant for the owner cuts a version.
- **An unpushed build is tried** in a terminal session started with
  `claude --plugin-dir mods/<name>` from the repository's root.
- **A mod keeps nothing in its folder it would not publish:** the installed copy holds all of it.
- Sharing mods with anyone else waits for going public (`docs/BACKLOG.md`).

**Built** (measured on CLI 2.1.310 and desktop 2.1.308).
- **The marketplace** is a clone of the whole repository, in
  `~/.claude/plugins/marketplaces/claude-code-mods/`, made over SSH. `gh` is signed in as
  `FairCat-GD`, and git's helper for github.com is `gh auth git-credential`.
- **The installed copy** is every tracked file of the mod's folder at the pushed commit, byte for
  byte (docs, handoff, `CLAUDE.md` and tests included), in
  `~/.claude/plugins/cache/claude-code-mods/<mod>/<version>/`.
- **The install** writes `enabledPlugins` and `extraKnownMarketplaces` in
  `~/.claude/settings.json`, and an entry in each of `installed_plugins.json` and
  `known_marketplaces.json` under `~/.claude/plugins/`.
- **The update** refreshes the clone, then installs only when the pushed `plugin.json` version
  differs from the installed one; otherwise it reports "already at the latest version". A new
  version lands in a folder of its own beside the old, and stored values are untouched. A new
  session loads it.
- **`--plugin-dir`** replaces the installed copy for that session (the engine logs
  `Plugin "<name>" from --plugin-dir overrides installed version`; measured interactive and
  headless). The copy runs as `<name>@inline`, with its own store.

## Deliberate decisions

**Decided.**
- **Versions belong to mods.** The repo level cuts no version and keeps no changelog, because no
  mod's user sees the tooling.
- **No CI.** The workflow holds the gate in the session.
- **One copy of the workflow,** at the root; mods point at it.
- **Parallel sessions share one checkout,** each on its own paths, and parallel parts are not
  used. `.claude/worktrees/` is ignored at the root in case one is.
- **`validate` allows one warning by name** (*`validate` and the import scan*), rather than moving
  each plugin a level down or dropping `--strict`.
- **`docs/` is left out of every stage but hygiene,** so a document never blocks the build and no
  test can read one.
- **No runtime code is shared between mods,** and the engine's declarations are never committed
  (`docs/BACKLOG.md`, *Decided against*).

## Known debt, deliberately deferred

- **The gate's `claude` stages run in the owner's config.** `claude plugin validate` writes
  `.claude.json` and a backup into `~/.claude` on every run. The tooling tests use a scratch
  home; whether the gate should is the owner's call (`docs/BACKLOG.md`, *Deferred*).
- **History holds what the rules now keep out:** the old hashed term list, and the round 1 spec's
  naming of the project hygiene was first ported from. Rewriting history or accepting it is the
  owner's call before going public (`docs/BACKLOG.md`, *Going public*).
- **`directory.findings` are not judged,** so the gate does not hold a mod to the plugin
  directory's requirements (a README, a LICENSE and an icon each). That waits for going public.
- **Hygiene's blind spots** (*Testing strategy*) rest on the last read of each diff.
- **Who edits what is a rule, not a check.** Another session's uncommitted work turns the full
  gate red for its own folder; a session runs `verify -- <mod>` for its commit, and the full gate
  before a push.

## Baseline

| Check | Expected |
|---|---|
| `npm run verify` | green: 14 stages, the 6 repo stages, then 4 for each of cartoon-fx and `mod-template` (4 more per mod) |
| Tooling tests (`node --test "tests/*.test.ts"`) | 166 pass, in 10 files: hygiene 109 in 4, verify 15, marketplace 13, imports 10, new-mod 9, validate 6, types 4 |
| `mod-template`: tests | 1 pass |
| `mod-template`: `validate` | 2 hooks, 0 gating, calls `$.command.register`; no warning but the allowed one |
| Each mod | its 4 stages green; its counts are in its own `docs/ARCHITECTURE.md`'s baseline |
| `npm run verify -- hygiene --all` | clean, 0 hits in pushed history |
| A fresh clone: `npm ci`, `npm run types`, `npm run verify` | green |

Measured on CLI 2.1.325, 2026-11-15. A documentation or refactoring change should not move any of
these; if one moves, that is the finding.

## Decision log

The file starts from round 1's resolved decisions (2026-10-24) as amended during the round; git
history keeps that round's `docs/spec/SPEC.md`. The amendments and the decisions settled since:

- 2026-10-24, *Stack and pins*: `@types/node` joins as a third exact pin, and `typescript` is pinned
  at 6.0.3, instead of 5.4 or newer, because the tooling cannot type `node:` modules without the
  first and 7.x moves the JS API the import scan uses.
- 2026-10-24, *`validate` and the import scan*: one warning is allowed by name, instead of moving
  each plugin a level down or dropping `--strict`, because every mod's workflow `CLAUDE.md` draws
  it.
- 2026-10-24, *The repository's data*: the marketplace has a top-level `description`, because
  `--strict` fails without one.
- 2026-10-25, *The repository's data*: `$.store` is keyed by the plugin id, not its name (measured
  in both engines), so a rename or a new marketplace starts with no stored values.
- 2026-10-25, *Packaging*: the installed copy holds every tracked file of the mod's folder, which
  makes "keep nothing you would not publish" a standing rule rather than a precaution.
- 2026-10-25, *Packaging*: `claude plugin update` picks up a pushed version, not pushed work,
  because it compares versions; so every change meant for the owner cuts one.
- 2026-11-14, *Hygiene*: rebuilt on the workflow kit's design, with the terms in the owner's term
  file instead of hashes in the repository, because short words' hashes are reversible.
- 2026-11-14, *The template and `new-mod`*: a script makes a mod from the template, instead of a
  copy by hand, because the copy missed places and a second mod would have started broken.
- 2026-11-15, *The template and `new-mod`*: a made mod is committed by its intake, with its docs,
  instead of by hand before it.
- 2026-11-15, *The template and `new-mod`*: a new mod's Session 1 releases 0.1.0, rewriting the
  made entry, instead of 0.2.0 after a made scaffold.

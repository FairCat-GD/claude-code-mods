# claude-code-mods

A home for the owner's Claude Code mods: plugins that change Claude Code's own interface or
behaviour through its function-hooks API. Each mod lives in `mods/<name>/` as an independent
plugin, with its own tests, docs, versions and development record. The repository's tooling holds
every mod to the same rules. The repository is also the plugin marketplace the owner installs the
mods from. It is run by one developer, on macOS, in Claude Code's desktop app and terminal.

Machine identifiers keep their spelling, because installs and stored data live under them:
- the marketplace `claude-code-mods` (installs are `<mod>@claude-code-mods`) and the repository
  `FairCat-GD/claude-code-mods`;
- each mod's name: its folder, its `plugin.json` `name`, its install id and its slash commands. A
  rename loses its stored `$.store` values too, which the engine keys by plugin id
  (`docs/ARCHITECTURE.md`, *The repository's data*).

**Read the level's `docs/ARCHITECTURE.md`: its overview, invariants and baseline, and the
sections your block names, before changing code.** It describes how the level is built, and keeps
what is **Decided**, which changes only with the owner, apart from what is **Built**, which every
session keeps true (*The documents* in `docs/DEVELOPMENT-WORKFLOW.md`); cartoon-fx's predates
that outline and is as built throughout. `docs/USER-GUIDE.md`
describes behaviour from the user's side: the owner's use of the repository at the root, a mod's
behaviour in its folder. `docs/MOD-KICKOFF.md` guides a new mod's intake.

**The round's spec files in `docs/spec/` are the contract for what the round delivers:** read the
parts your block's Read line names before changing code. `docs/DEVELOPMENT-WORKFLOW.md` is the
session-based workflow this repo follows, at two levels. `docs/BACKLOG.md` lists what has been
named but not planned at the repo level; each mod keeps its own.

## Two levels

- **The repo level** covers the tooling, the gate, hygiene, the marketplace and the mod template.
  Its workflow files are at the root:
  - `docs/spec/`, `docs/next-session-prompt.md` and `docs/BACKLOG.md`;
  - `docs/ARCHITECTURE.md`, `docs/USER-GUIDE.md` and `docs/MOD-KICKOFF.md`.
- **The mod level** covers one mod. Its workflow files are in `mods/<name>/`: `CLAUDE.md`,
  `CHANGELOG.md`, `README.md`, and a `docs/` holding the same files as the root's. Its rounds,
  session ids, handoff and versions are its own.
- **A session works at one level, and on one mod at most.**
  - It reads that level's spec and handoff, and writes that level's files.
  - A mod session may also edit its own entry in `.claude-plugin/marketplace.json` and its row in
    `README.md`'s table of mods. Everything else outside `mods/` belongs to the repo level.

## Working protocol

Every session runs *The session cycle* in `docs/DEVELOPMENT-WORKFLOW.md`, but for its step 4:
parallel parts are not used here. One session per chat. A push or tag needs explicit approval,
each time.

**Scope lives in the level's `docs/spec/SESSIONS.md`**, one block per session, in order, and in
the round's spec files. A round 1 has `SPEC.md`, beside `PDD.md` only when the owner wrote a design
draft ahead of time. After round 1, each request gets one `FEATURE-*.md`, holding the request
verbatim plus the decisions resolved at intake. A round that comes from a review keeps it beside
them, as `REVIEW-<date>.md`. All of these are read-only and are not re-litigated.

A level's `docs/spec/` holds only its round in progress. The round closes after its last review:
a `docs: close round <N>` commit deletes its files (git history keeps them) and puts the review
commit's sha in the handoff, since that commit holds the last done-note in full. Anything still
open moves to that level's `docs/BACKLOG.md`.

**State lives in the level's `docs/next-session-prompt.md`**, rewritten by every session. The
chat's last message is the one-line opener that points at that file, never the file itself.

**Read order** (the cycle's step 2; the handoff's first line copies it):
- a repo session reads:
  1. what its block's **Read** line names;
  2. this file;
  3. *The session cycle* in `docs/DEVELOPMENT-WORKFLOW.md`;
  4. `docs/ARCHITECTURE.md`'s overview, invariants and baseline, and the sections the Read line
     names;
  5. `docs/spec/SESSIONS.md`'s header, its block and the previous block's done-note;
  6. `docs/next-session-prompt.md`.
- a mod session reads the same at its level:
  1. what its block's **Read** line names, in `mods/<name>/docs/spec/`;
  2. this file, then `mods/<name>/CLAUDE.md`;
  3. *The session cycle*;
  4. `mods/<name>/docs/ARCHITECTURE.md`'s overview, invariants and baseline, and the sections the
     Read line names;
  5. `mods/<name>/docs/spec/SESSIONS.md`'s header, its block and the previous block's done-note;
  6. `mods/<name>/docs/next-session-prompt.md`.
- an intake has no block yet: it reads what its level's between-rounds handoff names. A new mod's
  intake also reads `docs/MOD-KICKOFF.md`.

**The entry gate in a shared checkout.** Parallel sessions share this checkout. A session's tree is
clean when its own paths and the shared files above have no uncommitted changes. A mod session's
own paths are its mod's folder; a repo session's are everything outside `mods/`. Changes anywhere
else belong to another session: never stage, edit or revert them. A new mod's intake is the one
session that starts with its own paths uncommitted: what `npm run new-mod` made, which it commits.
Until it does, that mod's marketplace entry and README row are the intake's, and another session
neither stages them nor counts them against its clean tree.

**Rules:**

1. `npm run verify` must be green before you commit, run with the drafted message (*Git*).
   - A mod session runs `npm run verify -- <mod>`.
   - A commit that changes only docs runs the docs-only command instead (*Commands*).
   - The full `npm run verify` runs before any push.
   - Expected results are in the level's `ARCHITECTURE.md` baseline table. Until a new mod's
     Session 1 fills in its own, the root's row for `mod-template` holds for it.
2. Falsify each new check once before trusting it: break the assertion, watch it fail at its own
   step, restore it. Checks that already existed are not falsified again.
3. A mod's user-visible changes get a line in its `CHANGELOG.md`.
   - Its version is `major.minor.fix` in its `plugin.json`, which Claude Code's plugin manager
     shows.
   - Repo-level work has no version and no changelog.
4. If a decision is genuinely underdetermined, stop and ask rather than guessing — a guess
   becomes load-bearing for everything after it.
5. Comments state the present: why the code is shaped this way now. No session ids, no "until
   v0.x", no review stories — git history keeps those.
   - Keep comments short: one line where possible, and only where the why is not obvious from the
     code.
   - No paragraphs, and no docstrings that restate the signature.

## Invariants — these are rules, not preferences

The why for each is in `docs/ARCHITECTURE.md`, *The invariants*.

1. **Nothing private enters the repository** (see below). *Enforced by* the hygiene stage.
2. **A mod is self-contained.**
   - Every file it imports is inside its folder.
   - No mod imports from another mod or from the root.
   - Each validates, tests and installs alone.
   - *Enforced by* the import scan and `claude plugin validate`.
3. **The marketplace matches `mods/`.**
   - Every mod folder has exactly one entry, and every entry has its folder.
   - Names agree with folders and with `plugin.json`, and each source is `./mods/<name>`.
   - No entry carries a version.
   - *Enforced by* the marketplace stage.
4. **A mod's version lives in its `plugin.json` alone, and its `CHANGELOG.md`'s newest entry names
   it.** *Enforced by* the marketplace stage.
5. **What the engine writes is never committed:** `.claude-plugin/types/`, or any copy of Claude
   Code's API declarations. *Enforced by* `.gitignore` and the marketplace stage.
6. **Tests use fictional data and read no docs.** Fixtures live in `tests/fixtures/`.
7. **Nothing touches the owner's Claude Code setup without asking.**
   - The setup is `~/.claude/settings.json`, the installed plugins and marketplaces,
     `~/.claude/mods/`, the session mods folder the plugin-authoring skill watches, a mod's
     stored values in the owner's sessions, and the owner's term file.
   - This binds tests, harnesses and sessions alike.
   - Ask for each change, and show it before making it.
8. **Machine identifiers keep their spelling** (above).

## The plugin API is early access: read it from the running build, never from memory

- **It changes between Claude Code releases.**
  - The declarations of the running build are the authority. The engine lays them in
    `<mod>/.claude-plugin/types/` only when an *interactive* session loads the mod from a folder
    it hot-reloads; no `claude plugin` command, `claude -p` or desktop session writes them.
    `npm run types` does it for every mod and the template.
  - They are `claude-code/index.d.ts`, `claude-code-tools/` and `claude-code-mcp/` (additions to
    `claude-code`, not modules to import), and a `tsconfig.json` each mod's own extends. About
    24,200 lines at 2.1.325: grep them for the name at hand (`'tool.call'`, `Pane: {`).
  - They are never committed (invariant 5); the engine writes a `.gitignore` of `*` beside them.
- **Two builds run here.**
  - `claude plugin validate` and `claude plugin test` run the `claude` CLI on PATH, which
    updates itself: 2.1.296 at intake, 2.1.325 by round 1's documentation pass. `tsc` types
    against the declarations that same CLI laid, and verify fails when they are from another
    build.
  - The desktop app runs its own engine: 2.1.308 at intake, 2.1.325 by 2026-11-15.
  - A done-note records the versions its checks ran on.
- **A hooks module runs in the engine's environment.**
  - There is no DOM, no Node and no `import()`; it reaches everything outside itself through `$`.
  - JSX compiles against the global `h`, and elements come from `$.ui.resolve(e)`.
- **A mod's tests run under `claude plugin test`, not Node.** The practices every mod follows,
  its tests included, are below.

## What every mod follows

Whatever a mod does:
1. **The full workflow, at the mod level.** Its `CLAUDE.md` holds its own rules and commands, its
   `docs/` its rounds. A new mod starts from `npm run new-mod` and its intake
   (`docs/MOD-KICKOFF.md`); its round 1 ends at 1.0.0.
2. **The layout, the manifest and the invariants** of `docs/ARCHITECTURE.md`.
3. **Tests.**
   - Every behaviour has a test.
   - A UI test loops over `['terminal', 'desktop']` and never assumes a surface.
   - A test that depends on time pins the clock (`mock.clock`).
   - Fixtures are fictional.
4. **Hooks fail on purpose.** Every hook `claude plugin validate` lists as gating has a `.catch`
   that decides what its failure does. A mod that only reacts to something never refuses it.
5. **Stored values are the owner's data.** They are read forward-only, and never dropped without a
   changelog line.
6. **Reach is named.** A mod uses network, process or file access only where its purpose needs
   it, and its `ARCHITECTURE.md` names each use.
7. **Its `README.md`** says what the mod does, gives the install lines and lists its commands. Its
   `CHANGELOG.md` is written for the person using the mod.

## This repository will be public: nothing private goes in

The repository is private until the owner publishes it, but its whole history will be published.
So every file, test, fixture, done-note, handoff and commit message follows these rules:
- **No personal names or email handles, and no names of the owner's other projects.** Write the
  role: "the owner", "another of the owner's projects". The owner's GitHub handle `FairCat-GD` is
  public, and is used as the author.
- **No home-directory paths.** Write `~`.
- **No AI attribution:** no co-author trailers, no "generated with" lines, no session links, and no
  AI credited as author, co-author or addressee. Naming the tools is fine: Claude Code, its plugin
  API, this file, and the workflow's review command.
- **Fixtures are fictional.**
- **Done-notes and handoffs never name the owner's own data:** their documents, folders and
  settings. Record what was measured, not whose it was.
- **Unsure whether something is public? Ask the owner before writing it.** A word they call
  private goes on the term list, with their yes.

The hygiene stage of `verify` checks for:
- the owner's private terms, from `~/.config/hygiene/terms.txt`, one word per line, outside every
  repository; a missing file fails the stage;
- attribution in commit messages;
- secrets in their issuers' exact shapes, and a `.env` file a commit could record;
- conflict markers at the start of a line.

A routine run reads what a commit could still change: changed and untracked files, the drafted
message, and the commits on no remote. A full scan reads everything. It runs by itself when the
stamp in the git directory is older than the term list or the stage's source, and on `--all`. A
hit in a pushed message does not fail; the last line counts them, for the owner. A hit names the
place, never the term or the secret. A home-directory path and attribution in a file are left to
the last read of the diff.

## Commands

| Command | Does |
|---|---|
| `npm ci` | Restores the pinned toolchain from `package-lock.json`: TypeScript, Biome and Node's types. |
| `npm run types` | Starts an interactive `claude` that loads every mod and the template, so the engine lays this CLI build's declarations beside each; type `/exit` once its prompt shows, then it checks each folder. Run it in a terminal after a clone, a CLI update or a new mod. It keeps the owner's live mods out (no `CLAUDE_CODE_PLUGIN_DIRS`, user settings skipped), and says so and exits when every folder is fresh. A first run in a checkout asks Claude Code's folder-trust question. |
| `npm run new-mod -- <name> "<description>"` | Makes `mods/<name>/` from the template, renamed throughout, at 0.1.0 dated today, and adds its marketplace entry in name order; nothing else is written. It refuses, writing nothing, a name that is not lowercase kebab-case, `mod-template`, a stage's name, an existing folder, or no description. It prints what is left: the README row, `npm run types`, `verify`, and the intake. The name is the install id and store key for good. |
| `npm run verify` | The gate. Repo stages `format`, `lint`, `types`, `tooling-tests`, `marketplace` and `hygiene`, then `validate`, `types`, `tests` and `imports` for each `mods/<name>` and `mod-template`. Every stage runs; a summary follows; exit 1 on any failure. A stage that cannot start names its fix. |
| `npm run verify -- <name> ...` | Each name is a stage or a mod (a folder under `mods/`, or `mod-template`). Mods alone: the repo stages, with `format` and `lint` over the tooling and those folders only, then their four stages each. Stages alone: just those, for every folder. Both: those stages for those mods (`npm run verify -- cartoon-fx tests`). `types` names the tooling's and each folder's. An unknown name, or one naming both a stage and a mod, exits 2. |
| `npm run verify -- --message "$(git rev-parse --git-dir)/COMMIT_DRAFT"` | The gate with the drafted message checked too, before each commit. `--message` and `--all` go to hygiene, so they need it among the stages. |
| `npm run verify -- hygiene --message "$(git rev-parse --git-dir)/COMMIT_DRAFT"` | The docs-only command, for a commit that changes only docs. Biome reads no Markdown here, so hygiene is the only stage that reads them. |
| `npm run verify -- hygiene --all` | Hygiene's full scan, on demand. |
| `npx biome format --write <path>` | Applies the formatting `format` checks. `npx biome lint --write <path>` applies lint's safe fixes. |
| `node --test "tests/*.test.ts"` | The tooling's tests alone. Keep the quotes and the top-level pattern: Node expands it, and it never reaches `tests/fixtures/` or a mod's tests, which run only under `claude plugin test`. |
| `node scripts/hygiene.ts [--message <draft>] [--all] [--terms <file>]` | Hygiene alone, over the repository it runs in. `--terms` is for tests, which point it at `tests/fixtures/hygiene-terms.txt` and never at the owner's file. |
| `node scripts/validate.ts <folder>` | `claude plugin validate` as the gate judges it, in the gate's environment (without `CLAUDE_CODE_PLUGIN_DIRS`): every error and warning fails, but the one a mod's own `CLAUDE.md` draws ("not loaded as project context"). |
| `node scripts/imports.ts <folder>` | The import scan alone, against the folder's laid declarations. |

The owner runs each mod as the release installed from this marketplace, at user scope. It is
enabled in user settings, so every `claude` the owner starts loads it. `npm run types` skips user
settings, so its session loads only the folders it names.
- **Trying an unpushed build.** A terminal session started with `claude --plugin-dir mods/<name>`
  replaces the installed copy of that mod for the session (measured interactive and headless, CLI
  2.1.310). The engine logs `Plugin "<name>" from --plugin-dir overrides installed version`. The
  copy runs as `<name>@inline`, with its own `$.store`, so the release's stored values are left
  alone.
- **`CLAUDE_CODE_PLUGIN_DIRS` is not set** in the owner's settings any more. The gate's `claude`
  stages and `npm run types` still remove it, in case a shell exports it. While the owner's
  settings set it, `env -u CLAUDE_CODE_PLUGIN_DIRS claude plugin list` still listed the folder
  copy; whether other `claude` commands loaded it that way was not measured.

## Git

- **Commit locally;** a push or tag needs explicit approval, each time.
  - Before any push, list `git log origin/main..HEAD`. Parallel sessions share this checkout, so
    name to the owner any commit there that is not this session's.
  - `origin` is the private GitHub repository `FairCat-GD/claude-code-mods`. It stays private
    until the owner publishes it.
- **Stage explicit paths,** never `git add -A`.
- **The message is checked before it exists.** As the last act before each commit, after the
  done-note, the handoff and a last read of the diff for what no script judges (the workflow's
  *A clean repository*):
  1. write the message into `"$(git rev-parse --git-dir)/COMMIT_DRAFT"`, which is never
     committed;
  2. run `verify` with `--message` and that file, or the docs-only command;
  3. commit with `git commit -F` from the file;
  4. delete it, so an old message is never committed again.

  A message that quotes an attribution form fails, even one describing this rule: describe it in
  words.
- **Subjects.** Typed (`feat:`, `fix:`, `refactor:`, `docs:`, `review:`), in plain words, at most
  72 characters, ending `(x.y.z)` when the commit cuts a version.
  - A mod's commits put its name as the scope: `feat(cartoon-fx): … (0.11.0)`.
  - Repo-level commits have no scope.
- **One level per commit.** A commit touches one level, except for a mod session's entry and row
  in the shared files.
- **Bodies.** Short, wrapped at 72: what changed and why.
- **Review commits.** `review: <main finding>, and <n> smaller`, scoped like the session they
  review.
- **Tags.** `<mod>-v<x.y.z>`, at milestones only.
- **Attribution and identity.** No trailers. Commits use the owner's global git identity.

## Watch for

The standing traps and forbidden moves, a line or two each: the trap, then what to do instead.
One goes in once it has cost a session time, and comes out once a check, a script or a pin makes
it impossible. A mod's own go in its `CLAUDE.md`; a session's own, in its block and handoff.

- **Don't:**
  - change the owner's Claude Code setup (invariant 7) without their OK for that change;
  - import into a mod anything from outside its folder, or from one mod into another;
  - commit `.claude-plugin/types/`, or any copy of Claude Code's API declarations;
  - edit another mod's files, or another session's uncommitted changes;
  - edit a level's `docs/spec/` beyond what the workflow gives your session: your block's
    done-note and logged amendments, and in the round's last session, the close;
  - rename a machine identifier, or upgrade a pinned dependency in passing;
  - loosen a stage to make a mod pass;
  - put anything private in a file or a commit message;
  - finish with `npm run verify` red, or with a mod's user-visible changes missing from its
    `CHANGELOG.md`.
- **Never undo with `git checkout <path>`.** It discards changes that may be another session's.
  Revert your own edits by editing, and falsify a check by copying the file aside and back.
- **Give stdin-reading commands `< /dev/null`.** A bare `cat > file` with no heredoc hangs.
- **The toolchain on this Mac:**
  - node 26.7.0 and npm 11.19.0 in `/opt/homebrew/bin`;
  - `claude` at `~/.local/bin/claude`, a link to the newest of `~/.local/share/claude/versions/`;
  - `gh` 2.97.0 in `~/.local/bin`, and git 2.50.1;
  - no global `tsc` or bun, so use `npx tsc` and `npx biome`.
- **The CLI updates itself,** even during `npm run types`, and an update can turn the gate red for
  more than stale declarations. Record the version each check ran on, from `claude --version`
  (*Two builds run here*, above).
- **The installed mods run in every session the owner starts,** this one included: cartoon-fx
  marks a commit and a green `verify`. That is the release, not the tree.
- **The file-writing tool writes the `\u2028` and `\u2029` escapes as the characters
  themselves.** Check with `od -c`, and fix with
  `perl -CSD -pi -e 's/\x{2028}/\\u2028/g; s/\x{2029}/\\u2029/g'`.
- **Loading the plugin-authoring skill starts a watch on this session's mods folder.** Write
  nothing under `~/.claude/dev-mods/`.

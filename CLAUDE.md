# claude-code-mods

A home for the owner's Claude Code mods: plugins that change Claude Code's own interface or
behaviour through its function-hooks API. Each mod lives in `mods/<name>/` as an independent
plugin, with its own tests, docs, versions and development record. The repository's tooling holds
every mod to the same rules. The repository is also the plugin marketplace the owner installs the
mods from. It is run by one developer, on macOS, in Claude Code's desktop app and terminal.

Machine identifiers keep their spelling, because installs and stored data live under them:
- the marketplace `claude-code-mods` (installs are `<mod>@claude-code-mods`) and the repository
  `FairCat-GD/claude-code-mods`;
- each mod's name: its folder, its `plugin.json` `name`, the key its `$.state` and `$.store` values
  live under, and its slash commands.

**Read `docs/spec/SPEC.md` before changing code.** `docs/DEVELOPMENT-WORKFLOW.md` is the
session-based workflow this repo follows, at two levels. `docs/BACKLOG.md` lists what has been
named but not planned at the repo level; each mod keeps its own.

## Two levels

- **The repo level** covers the tooling, the gate, hygiene, the marketplace and the mod template.
  Its workflow files are at the root:
  - `docs/spec/`, `docs/next-session-prompt.md` and `docs/BACKLOG.md`;
  - `docs/ARCHITECTURE.md` and `docs/USER-GUIDE.md`, once round 1 writes them.
- **The mod level** covers one mod. Its workflow files are in `mods/<name>/`: `CLAUDE.md`,
  `CHANGELOG.md`, `README.md`, and a `docs/` holding the same files as the root's. Its rounds,
  session ids, handoff and versions are its own.
- **A session works at one level, and on one mod at most.**
  - It reads that level's spec and handoff, and writes that level's files.
  - A mod session may also edit its own entry in `.claude-plugin/marketplace.json` and its row in
    `README.md`'s table of mods. Everything else outside `mods/` belongs to the repo level.

## Working protocol

Every session runs the cycle in `docs/DEVELOPMENT-WORKFLOW.md`:
1. entry gate;
2. read order;
3. a plan agreed in plan mode;
4. the verify gate;
5. docs kept true;
6. the changelog, for a mod;
7. a done-note in its `SESSIONS.md` block;
8. the handoff prompt for the next session;
9. a local commit;
10. the owner's `/code-review high`, then a review-fixes commit;
11. the next session's prompt, printed as the last message.

One session per chat. A push or tag needs explicit approval, each time.

**Scope lives in the level's `docs/spec/SESSIONS.md`**, one block per session, in order, and in
the round's spec files. A round 1 has `SPEC.md`, beside `PDD.md` only when the owner wrote a design
draft ahead of time. After round 1, each request gets one `FEATURE-*.md`, holding the request
verbatim plus the decisions resolved at intake. All of these are read-only and are not
re-litigated.

A level's `docs/spec/` holds only its round in progress. When a round closes, its files are
deleted (git history keeps them), and anything still open moves to that level's
`docs/BACKLOG.md`.

**State lives in the level's `docs/next-session-prompt.md`**, rewritten by every session as its
last act.

**Read order:**
- a repo session reads:
  1. the spec file(s) its block names;
  2. this file;
  3. `docs/ARCHITECTURE.md`, once it exists;
  4. `docs/next-session-prompt.md`.
- a mod session reads:
  1. the spec file(s) its block names, in `mods/<name>/docs/spec/`;
  2. this file;
  3. `mods/<name>/CLAUDE.md`;
  4. `mods/<name>/docs/ARCHITECTURE.md`, once it exists;
  5. `mods/<name>/docs/next-session-prompt.md`.

**The entry gate in a shared checkout.** Parallel sessions share this checkout. A session's tree is
clean when its own paths and the shared files above have no uncommitted changes. A mod session's
own paths are its mod's folder; a repo session's are everything outside `mods/`. Changes anywhere
else belong to another session: never stage, edit or revert them.

**Rules:**

1. `npm run verify` must be green before you commit.
   - A mod session runs `npm run verify -- <mod>`.
   - The full `npm run verify` runs before any push.
   - Expected results are in the done-notes until the level's `ARCHITECTURE.md` has its baseline
     table.
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

The why for each is in `docs/spec/SPEC.md` §6.

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
     `~/.claude/mods/`, the session mods folder the plugin-authoring skill watches, and a mod's
     stored values in the owner's sessions.
   - This binds tests, harnesses and sessions alike.
   - Ask for each change, and show it before making it.
8. **Machine identifiers keep their spelling** (above).

## The plugin API is early access: read it from the running build, never from memory

- **It changes between Claude Code releases.**
  - The declarations of the running build are the authority. The engine lays them in
    `<mod>/.claude-plugin/types/` when it loads a mod from a folder it watches; the plugin-authoring
    skill writes them beside itself as it loads.
  - About 14,000 lines: grep them for the name at hand (`'tool.call'`, `Pane: {`).
  - They are never committed (invariant 5).
- **Two builds run here.**
  - `claude plugin validate` and `claude plugin test` run the `claude` CLI on PATH, 2.1.296 at
    intake.
  - The desktop app runs its own engine, 2.1.308 at intake.
  - A done-note records the versions its checks ran on.
- **A hooks module runs in the engine's environment.**
  - There is no DOM, no Node and no `import()`; it reaches everything outside itself through `$`.
  - JSX compiles against the global `h`, and elements come from `$.ui.resolve(e)`.
- **A mod's tests run under `claude plugin test`, not Node.**
  - They import their kit from `claude-code/testing`.
  - A UI test names its surface, looping over `['terminal', 'desktop']`.

## This repository will be public: nothing private goes in

The repository is private until the owner publishes it, but its whole history will be published.
So every file, test, fixture, done-note, handoff and commit message follows these rules:
- **No personal names or email handles.** Write "the owner". The owner's GitHub handle
  `FairCat-GD` is public, and is used as the author.
- **No home-directory paths.** Write `~`.
- **No AI attribution:** no co-author trailers, no "generated with" lines, no session links, and no
  AI credited as author, co-author or addressee. Naming the tools is fine: Claude Code, its plugin
  API, this file, and the workflow's review command.
- **Fixtures are fictional.**

The hygiene stage of `verify` checks tracked and untracked files, their paths and the staged
contents against hashed private terms, and checks commit messages for attribution.

## Commands

| Command | Does |
|---|---|
| <filled in by Session 1> | |

## Git

- **Commit locally;** a push or tag needs explicit approval, each time.
  - Before any push, list `git log origin/main..HEAD`. Parallel sessions share this checkout, so
    name to the owner any commit there that is not this session's.
  - `origin` is the private GitHub repository `FairCat-GD/claude-code-mods`. It stays private
    until the owner publishes it.
- **Stage explicit paths,** never `git add -A`. Never undo with `git checkout <path>`.
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

## Do not

- Change the owner's Claude Code setup (invariant 7) without their OK for that change.
- Import into a mod anything from outside its folder, or from one mod into another.
- Commit `.claude-plugin/types/`, or any copy of Claude Code's API declarations.
- Edit another mod's files, or another session's uncommitted changes.
- Edit a level's `docs/spec/` beyond what the workflow gives your session: your block's done-note
  and logged amendments, and in the round's last session, the close.
- Rename a machine identifier, or upgrade a pinned dependency in passing.
- Loosen a stage to make a mod pass.
- Put anything private in a file or a commit message.
- Finish with `npm run verify` red, or with a mod's user-visible changes missing from its
  `CHANGELOG.md`.

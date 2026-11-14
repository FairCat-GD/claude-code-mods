# claude-code-mods — the round 1 contract

Read-only from the first line of Session 1. Session 0 derived it on 2026-10-24 from the owner's
request, quoted in §1, and the intake that followed. Round 1 has no product design draft: it began
from that request (decision 2). "The owner" is the person this repository belongs to (the
workflow's "user").

## 1. The request, verbatim (2026-10-24)

> I need a separate project and repo as a home for my claude code mods.
>
> 1. In the attachments you can find my typical development workflow. to understand it better you
>    can explore krita-art-mcp project. let me know if it fits for Claude Code Mods development as
>    well.
> 2. For now the repo will be private, but the Clean public repository rules must be followed the
>    same way as in krita project.
> 3. I plan creating different independent mods over the time, please structure the repository to
>    support this from the very beginning. e.g. each mode is an independent Claude Code extention
>    with its own placd in the repo, own way how it was developed, its own tests, etc. but the
>    general best practices should be followed no matter what mod we are developing.
>
> There is already one mode available - cartoon-fx. You can move it to the repo after you create
> it yourself, or I can do it from the chat where it was created. your call.
>
> Please proceed with the repo setup planning and ask me any questions you'll have along the way

The attachments were the workflow kit's `DEVELOPMENT-WORKFLOW.md` and `KICKOFF.md`; their paths are
left out. The intake read the krita-art-mcp repository (its `CLAUDE.md`, its hygiene stage, its
verify script and its round 1 documents) and the cartoon-fx mod as it stood. It judged that the
workflow fits Claude Code mods once it runs at two levels (decision 3), and it put eight questions
to the owner in three batches. One was asked twice, after the owner asked what it meant. When the
owner asked why round 1 would need a PDD, the intake agreed that it does not.

## 2. Resolved decisions (2026-10-24, at intake)

The owner answered decisions 1, 2, 3, 5, 6, 10, 11 and 12 at intake. For decision 13 the owner left
the choice to the intake. The intake proposed decisions 4, 7, 8, 9 and 14–16, and the owner
approved them with the Session 0 plan. No implementing session re-litigates them. A change is added
beside the decision it changes, as an **Amended <date> by the owner** note.

1. **The repository** is `claude-code-mods`, in `~/Documents/GitHub Projects/claude-code-mods`.
   - Its remote is the private GitHub repository `FairCat-GD/claude-code-mods`. It is created at
     Session 0's close, and the first push needs the owner's approval like any other.
   - It stays private until the owner publishes it. Every file and commit message is written as if
     public from the first commit (invariant 1).
2. **Round 1 has no PDD.** A PDD is a design draft written ahead of time, and this repository has
   none. `SPEC.md` quotes the request it began from (§1).
   - A mod's own round 1 starts the same way, unless the owner writes a design draft for it.
3. **The workflow runs at two levels.** Every mod uses the full workflow.
   - **The repo level** covers the tooling, the gate, hygiene, the marketplace, the mod template
     and the rules every mod shares. Its files are at the root: `docs/spec/`,
     `docs/next-session-prompt.md`, `docs/BACKLOG.md`, and later `docs/ARCHITECTURE.md` and
     `docs/USER-GUIDE.md`. Its rounds are numbered like any project's; this is round 1.
   - **The mod level** covers one mod, in `mods/<name>/`. A mod has its own `CLAUDE.md`,
     `CHANGELOG.md`, `README.md` and `docs/`, holding the same files the root's `docs/` does.
     Its rounds, session ids, handoff, backlog and versions are its own.
   - `docs/DEVELOPMENT-WORKFLOW.md` exists once, at the root. No mod copies it.
   - **A session works at one level, and on one mod at most.** It reads that level's spec and
     handoff and writes that level's files. Decision 10 gives the one exception.
4. **The layout** is §4's.
   - `mods/<name>/` is the whole plugin, plus its workflow files.
   - `templates/mod-template/` is where a new mod starts. The gate checks it like a mod, so it
     never rots. Its folder and its `plugin.json` name are both `mod-template`, so the template
     follows the same naming rule as every mod.
5. **The tooling is TypeScript on Node 26.**
   - Node runs the `.ts` files directly by stripping their types, so there is no build step and
     no `tsx`.
   - A root `package.json` (`private`, `"type": "module"`) pins its devDependencies exactly:
     `typescript`, at 5.4 or newer, which the API declarations need, and `@biomejs/biome`, which
     formats and lints.
   - The lockfile is committed, and `npm ci` restores it.
   - The tooling's own tests run under `node --test`.
   - No dependency is added before it is used.

   **Amended 2026-10-24 by the owner, in Session 1.** A third exact pin, `@types/node`, joins
   the two: the tooling's `types` stage cannot type `node:` modules without it. TypeScript is
   pinned at 6.0.3, because 7.x moves the JS API the import scan parses with under `unstable/`.
6. **Hygiene is ported from krita-art-mcp with its behaviour unchanged.**
   - **What it checks.** Tracked and untracked files, their paths, and the staged contents are
     checked against hashed private terms. Every commit message on `HEAD` is checked for
     co-author trailers, "generated with" lines and AI session links.
   - **How it tokenises.** It takes lowercase `[a-z0-9]+` runs, plus camel-case and digit
     sub-tokens.
   - **What it reports.** File and line, and a hash prefix, never the term.
   - Its tests port krita's `tests/test_hygiene.py` case for case.
   - The term list is krita's seven SHA-256 hashes, copied as they are; the handoff lists them.
     The terms themselves never enter the repository.

   **Amended 2026-11-14 by the owner, after `REVIEW-2026-11-14.md`.** Hygiene is rebuilt on the
   updated workflow kit's design in Session 3a. Its terms come from the owner's term file outside
   every repository, not from hashes in it, because short words' hashes are reversible. Tokens
   cover every script, normalised to NFC. A routine run reads what a commit could still change,
   the drafted message included, and a full scan runs when it can find something new. Secrets
   and conflict markers are checked too.
7. **`verify` is the gate.** `npm run verify` runs every stage. `npm run verify -- <mod>` runs the
   repo stages and that mod's stages. Each stage fails on its own; every stage runs even after one
   fails, and a summary follows.
   - **Repo stages:**
     - `format` and `lint` (Biome), over the tooling and over the folders being verified;
     - `types` (`tsc`) for the tooling;
     - `tooling-tests` (`node --test`, over the top level of `tests/` only, so it never collects
       a fixture mod's `*.test.ts` under `tests/fixtures/`);
     - `marketplace`, invariants 3 and 4;
     - `hygiene`, over the whole tree.
   - **Per-mod stages,** for each folder under `mods/` and for `templates/mod-template/`:
     - `validate` (`claude plugin validate`, failing on any error or warning);
     - `types` (`tsc -p <mod>`);
     - `tests` (`claude plugin test <mod>`);
     - the import scan, invariant 2.
   - `docs/` is left out of every stage but hygiene.
   - A mod session runs `verify -- <mod>`. The full run is the gate before any push.
   - A stage that cannot start (no `claude`, no API declarations) fails with a message that names
     the fix.

   **Amended 2026-10-24 by the owner, in Session 1.** `validate` fails on every error and warning
   but one: "CLAUDE.md at the plugin root is not loaded as project context", which every mod
   draws from the workflow `CLAUDE.md` decision 3 puts in its folder (CLI 2.1.310). That file
   is for the sessions that develop the mod, not context it ships. The owner left the choice to
   the session's advice, which was a named exception rather than moving each plugin down a
   level or dropping `--strict`.
8. **Versions belong to mods.**
   - **Where the version lives.** In a mod's `plugin.json` only, which is where Claude Code's
     plugin manager shows it from. Marketplace entries carry no version. A mod with a command may
     show its version there too; that is its own choice.
   - **When it changes.** Each mod session is a release under the workflow's rules: a minor bump
     for behaviour, a fix bump for fixes, none for what no user sees.
   - **The changelog.** Each mod keeps its own `CHANGELOG.md`, from the workflow's template, with
     link references to this repository's commits and tags once the remote exists.
     - A version's link points at the commit that first put that version in the mod's
       `plugin.json` in this repository. For cartoon-fx's 0.10.1, that is the import commit.
     - A commit cannot name its own sha, so the session's review commit adds the link. If there is
       no review commit, the next commit adds it.
     - The push note's amend changes only the last commit, which is never the one linked.
   - **The repo level** cuts no version and keeps no changelog, because no mod's user sees the
     tooling.
9. **Commits and tags.**
   - Commits use the owner's global git identity, with no trailers.
   - **Subjects.** Typed and in plain words, at most 72 characters; a version-cutting commit ends
     `(x.y.z)`.
     - A mod's commits put its name as the scope: `feat(cartoon-fx): … (0.11.0)`,
       `review(cartoon-fx): <main finding>, and <n> smaller`,
       `docs(cartoon-fx): open round 2 — <theme>`, `docs(cartoon-fx): close round 2`.
     - Repo-level commits have no scope.
   - A commit touches one level, except as decision 10 allows.
   - **Tags** are `<mod>-v<x.y.z>`, at milestones only, each with its own approval.
10. **Parallel sessions share one checkout.**
    - **What a session owns.** A mod session owns its mod's folder, its own entry in
      `.claude-plugin/marketplace.json`, and its row in the root `README.md`'s table of mods. A
      repo session owns everything else.
    - **The entry gate's clean tree** means the session's own paths and the shared files have no
      uncommitted changes. A change anywhere else belongs to another session, and is never
      staged, edited or reverted.
    - **Before a push:** the full `verify` is green and `git log origin/main..HEAD` is listed.
      Any commit there that is not this session's is named to the owner, who decides.
11. **Daily use is the installed release.**
    - The owner installs each mod once, at user scope, from this repository's marketplace. In a
      terminal that is `claude plugin install <mod> --marketplace FairCat-GD/claude-code-mods`; in
      the desktop app it is + beside the prompt, then Plugins, then Add marketplace.
    - The installed copy changes only on `claude plugin update <mod>`, which picks up pushed work.
      So what the owner runs every day has passed the review and a push approval.
    - The owner tries an unpushed build by hand in a terminal session started with
      `claude --plugin-dir <repo>/mods/<name>`. How that session treats the installed copy of the
      same mod is measured in Session 3.
    - The `CLAUDE_CODE_PLUGIN_DIRS` entry that runs cartoon-fx today is removed once the installed
      release runs (Session 3).

    **Amended 2026-10-25 by the owner, after Session 3.** `claude plugin update <mod>` picks up a
    pushed *version*, not pushed work.
    - It refreshes the marketplace clone to the pushed commit, then compares the version in the
      mod's `plugin.json` with the installed one. When the two are equal it leaves the installed
      copy as it is.
    - Measured on CLI 2.1.310: after Session 3's docs-only push, the clone moved to `49a3d50`,
      while cartoon-fx stayed at 0.10.1 from `3f79906` ("already at the latest version").
    - So a change reaches the owner's daily sessions only with a version bump. That is what
      decision 8 gives every behaviour or fix session, and docs that ship in the folder follow
      with the next version.
    - The other half, an update to a new version, is not yet measured.
12. **License and author.**
    - MIT, as the root `LICENSE` and as `"license": "MIT"` in every `plugin.json`.
    - Each `plugin.json` has `"author": { "name": "FairCat-GD" }`, and the marketplace's
      `owner.name` is `FairCat-GD`.
    - The owner's personal name and email handle stay banned by hygiene.
13. **cartoon-fx is imported, not rebuilt.**
    - **The copy.** Session 2 copies `~/.claude/mods/cartoon-fx` into `mods/cartoon-fx/` byte for
      byte. It adds only `author` and `license` to `plugin.json`, plus the mod's workflow files.
    - **Its behaviour is unchanged in round 1.** It stays at 0.10.1. Its changelog starts with a
      0.10.1 entry whose lead paragraph says that earlier versions came before this repository
      and are not recorded.
    - **Its own workflow.** cartoon-fx counts as having finished its own round 1 outside the
      workflow. Its next round is round 2, opened by an intake in a chat of its own.
    - **Its docs.** Its as-built documents (Session 3) are written from the code, plus a note the
      owner gets from the chat that built it: the design decisions and their reasons, the known
      debt, ideas and traps.
    - `~/.claude/mods/cartoon-fx` is never edited. The owner removes it when they choose.
14. **Machine identifiers, never renamed:**
    - the marketplace `claude-code-mods` (installs are `<mod>@claude-code-mods`);
    - the repository `FairCat-GD/claude-code-mods`;
    - each mod's name: its folder, its `plugin.json` `name`, its install id, its settings key, and
      its slash commands. For cartoon-fx that is `cartoon-fx` and `/fx`. A rename breaks installs.
    - **The `$.store` key is not yet measured.** A mod's `$.store` values (cartoon-fx's are the
      owner's `placement` and `fxTakes`) live under a key the engine derives from the plugin. That
      key is either its name or its id, and the id differs between a folder copy and
      `cartoon-fx@claude-code-mods`.
      - Session 3 measures which, before the switch. A rename very likely loses stored data
        either way.

    **Amended 2026-10-25 by the owner, in Session 3.** `$.store` is keyed by the plugin's id,
    `<name>@<marketplace>`, not its name, in both the CLI (2.1.310) and the desktop engine
    (2.1.308).
    - Each id has one JSON file in `~/.claude/plugins/store/`.
    - The engine carries a store to a new id only for renamed built-in plugins.
    - So a change of the mod's name or of the marketplace it installs from starts it with no stored
      values, and a folder copy (`<name>@inline`) never shares the release's.
    - At the switch, cartoon-fx had no store file at all, so nothing was lost. The owner chose to
      install and start fresh.
15. **Round 1 has four sessions** (`SESSIONS.md`):
    1. the scaffold;
    2. the cartoon-fx import;
    3. cartoon-fx as an installed release, with its as-built docs;
    4. the repo's documentation pass and the close.

    None cuts a version; cartoon-fx stays at 0.10.1 throughout.

    **Amended 2026-11-14 by the owner, after `REVIEW-2026-11-14.md`.** Three sessions are
    inserted before the fourth: 3a, the gate per the updated workflow kit; 3b, the workflow per
    the updated kit; 3c, ready for a second mod. None cuts a version. cartoon-fx's own rounds
    released 0.10.2 and 0.10.3 meanwhile, outside this round.
16. **Out of round 1** (each in `docs/BACKLOG.md`):
    - new cartoon-fx features or fixes, which belong to its own rounds;
    - new mods;
    - a script that starts a mod from the template;
    - CI;
    - going public;
    - sharing mods with anyone but the owner.

    **Decided against:**
    - runtime code shared between mods;
    - a copy of the workflow per mod;
    - committing Claude Code's API declarations;
    - running mods live from the repository in everyday sessions.

    **Amended 2026-11-14 by the owner, after `REVIEW-2026-11-14.md`.** The script that starts a
    mod from the template joins round 1, in Session 3c: the review found the copy by hand misses
    places, so a second mod would start broken.

## 3. What round 1 is, and is not

**It is** the repository as a home for mods:
- the layout, the toolchain, the gate, hygiene, the marketplace and the mod template;
- cartoon-fx moved in, installed by the owner as a release, and documented as built;
- the documents a future mod needs to start with its own intake: `docs/USER-GUIDE.md` and
  `docs/MOD-KICKOFF.md`.

**It is not** a change to what cartoon-fx does, a new mod, CI, or publishing.

## 4. Architecture

### The layout

```
claude-code-mods/
├── .claude-plugin/marketplace.json   the marketplace: one entry per mod
├── CLAUDE.md                         the rules every session follows
├── README.md                         what this is, its table of mods, how to install one
├── LICENSE                           MIT
├── package.json, package-lock.json   the tooling's pinned dependencies
├── biome.json, tsconfig.json         format, lint and type settings
├── scripts/                          verify, hygiene, the marketplace and import checks
├── tests/                            the tooling's tests; tests/fixtures/ is fictional
├── templates/mod-template/           where a new mod starts; checked by the gate
├── docs/                             the repo level's workflow files
│   ├── DEVELOPMENT-WORKFLOW.md       the one copy
│   ├── spec/                         the repo level's round in progress
│   ├── next-session-prompt.md
│   ├── BACKLOG.md
│   └── ARCHITECTURE.md, USER-GUIDE.md, MOD-KICKOFF.md   (Session 4)
└── mods/
    └── <name>/                       one mod: the whole plugin, and its workflow
        ├── .claude-plugin/plugin.json
        ├── hooks/hooks.json          names the one hooks module
        ├── hooks/register.tsx …      the module and the files it imports
        ├── types/index.d.ts          its $.state contract, when it has one
        ├── tests/*.test.ts(x)        run by `claude plugin test`
        ├── tests/fixtures/           fictional
        ├── tsconfig.json
        ├── CLAUDE.md, CHANGELOG.md, README.md
        └── docs/                     spec/, next-session-prompt.md, BACKLOG.md,
                                      ARCHITECTURE.md, USER-GUIDE.md
```

The file names inside `scripts/` and `tests/` are Session 1's to choose.

### What a mod is

A mod is a Claude Code plugin of function hooks.
- **Its files.** `.claude-plugin/plugin.json` is the manifest. `hooks/hooks.json` names one hooks
  module, which exports `register(on, options)`. Every file the module imports is inside the mod's
  folder.
- **Where it runs.** Inside the engine's own environment, with no DOM, no Node and no `import()`.
  It reaches everything outside itself through `$`.
- **How it is tested.** Its tests run under `claude plugin test`, against the engine's kit
  (`claude-code/testing`).
- **Its types.** It is type-checked against the declarations of the Claude Code build that runs
  it.

### Who edits what

| Path | Edited by |
|---|---|
| `mods/<name>/` | that mod's sessions |
| `<name>`'s entry in `.claude-plugin/marketplace.json`, its row in `README.md` | that mod's sessions |
| everything else | repo sessions |

### How a mod reaches the owner

1. The root `.claude-plugin/marketplace.json` lists each mod, with source `./mods/<name>`.
2. Pushed to GitHub, that file makes the repository a marketplace.
3. The owner installs a mod from it, and Claude Code keeps the installed copy in its own plugin
   cache. That copy runs in every desktop and terminal session the owner starts, until
   `claude plugin update`.
4. **What the installed copy holds of the mod's folder is not yet measured.** It may be every file,
   docs and handoffs included. Session 3 lists it and corrects this paragraph by amendment. Until
   then, a mod keeps nothing in its folder that it would not publish.

**Amended 2026-10-25 by the owner, in Session 3.** The installed copy holds every tracked file of
the mod's folder at the pushed commit, byte for byte: docs, handoff, `CLAUDE.md` and tests
included.
- It lives in `~/.claude/plugins/cache/<marketplace>/<mod>/<version>/`.
- The marketplace itself is a clone of the whole repository, in
  `~/.claude/plugins/marketplaces/claude-code-mods/`.
- So everything in a mod's folder ships to whoever installs it, and the rule above stands as a
  rule: a mod keeps nothing in its folder that it would not publish.

### The plugin API

The function-hooks API is early access, and it changes between Claude Code releases.
- **The declarations.** The engine writes the API's declarations, about 14,000 lines, for the
  build that is running. It puts them in `<mod>/.claude-plugin/types/` whenever it loads a mod from
  a folder it watches, and beside the plugin-authoring skill whenever that skill loads.
- **They are never committed** (invariant 5). How they reach a fresh checkout for `tsc` is Session
  1's to measure.
- **Two builds.** `claude plugin validate` and `claude plugin test` run the `claude` CLI on PATH,
  2.1.296 at intake. The desktop app runs its own engine, 2.1.308 at intake. Every done-note
  records the versions its checks ran on.

## 5. The repository's data model

- **`plugin.json`.** It always has:
  - `name`, equal to the folder's name;
  - `version`;
  - `description`;
  - `author` (`{ "name": "FairCat-GD" }`);
  - `license` (`"MIT"`).

  It has `types` when the mod declares `$.state` values or adds a noun to `$`.
- **`.claude-plugin/marketplace.json`.** It has:
  - `name` `claude-code-mods`;
  - `owner` `{ "name": "FairCat-GD" }`;
  - `plugins`, one entry per mod in folder-name order, each `{ "name", "source": "./mods/<name>",
    "description" }`. An entry has no version.

  **Amended 2026-10-24 by the owner, in Session 1.** The marketplace also has a top-level
  `description`. `claude plugin validate --strict` warns without one, and the marketplace stage
  checks it.
- **A mod's `CHANGELOG.md`.** It follows the workflow's template. Its newest version entry names
  the version in `plugin.json`.
- **Stored data.** A mod's `$.store` values persist across the owner's sessions, under a key the
  engine derives from the plugin (decision 14). They are the owner's data. A change to a stored
  value's shape still reads the old shape, which makes it forward-only.

## 6. Invariants

1. **Nothing private enters the repository.**
   - **Banned:** personal names, email handles, home-directory paths (write `~`), and AI
     attribution. Attribution means co-author trailers, "generated with" lines, AI session links,
     and an AI credited as author, co-author or addressee.
   - **Allowed:** naming the tools Claude Code, its plugin API, `CLAUDE.md` and the workflow's
     review command.
   - Fixtures are fictional.
   - *Why:* the whole history will be published. *Enforced by* the hygiene stage.
2. **A mod is self-contained.** Every file it imports is inside its folder. No mod imports from
   another mod or from the root, and each validates, tests and installs alone.
   - *Why:* the installed copy holds only the mod's folder, so a reach outside it breaks there.
   - *Enforced by* the import scan and `claude plugin validate`.
3. **The marketplace matches `mods/`.**
   - Every folder under `mods/` has exactly one entry, and every entry has its folder.
   - An entry's `name` equals its folder's name and its `plugin.json` `name`, and its source is
     `./mods/<name>`.
   - No entry carries a version.
   - *Why:* the marketplace is how the owner installs. *Enforced by* the marketplace stage.
4. **A mod's version lives in its `plugin.json` alone, and the newest entry of its `CHANGELOG.md`
   names it.** *Why:* one home per version, so the two cannot drift. *Enforced by* the marketplace
   stage.
5. **What the engine writes is never committed:** `.claude-plugin/types/`, or any copy of Claude
   Code's API declarations.
   - *Why:* they are regenerated for every build, and they are not this repository's to publish.
   - *Enforced by* `.gitignore`, and by a check that no tracked path lies under
     `.claude-plugin/types/`.
6. **Tests use fictional data and read no docs.** Fixtures live in `tests/fixtures/`.
   - *Why:* a test that reads a document makes the document undeletable, and the history will be
     public.
7. **Nothing touches the owner's Claude Code setup without asking.** This covers tests, harnesses
   and sessions alike. The setup is:
   - `~/.claude/settings.json`;
   - the installed plugins and marketplaces;
   - `~/.claude/mods/`;
   - the session mods folder the plugin-authoring skill watches;
   - a mod's stored values in the owner's sessions.

   *Why:* all of it runs in every session the owner has. *Enforced by* this rule. The test kit
   has no file, network or process access.
8. **Machine identifiers keep their spelling** (decision 14).

## 7. Verification strategy — six layers, and what each cannot see

1. **`claude plugin validate`.** It reads the manifest and the module's source the way the engine
   will. It reports what the module hooks and calls, which hooks gate, and everything the engine
   would refuse. *It cannot see* behaviour.
2. **`tsc`.** It types the mod against the declarations of one build. *It cannot see* behaviour,
   or a build other than the one that wrote those declarations.
3. **`claude plugin test`.** It runs the mod's hooks against the engine's kit, with the clock and
   the store mocked, on each surface a test names. *It cannot see:*
   - what a surface actually paints;
   - the order and timing of events in a live session;
   - another plugin that sits above the mod;
   - a desktop engine newer than the CLI.
4. **The tooling's tests** (`node --test`) cover the gate's own scripts, hygiene included.
5. **The hygiene and marketplace stages** check the whole tree and the commit history.
6. **By hand.** The owner tries the mod in the app, from the installed release or a
   `--plugin-dir` session. The done-note records each outcome. What nobody checked goes to the
   mod's `docs/BACKLOG.md`, under *Not yet checked by hand*.

There is no CI. The session holds the gate, and the owner's review and push approval stand behind
it.

## 8. What every mod follows

These are the general practices of the request, binding on every mod whatever it does.
`docs/USER-GUIDE.md` and `docs/MOD-KICKOFF.md` carry them into each new mod's intake (Session 4).

This section is their one home while round 1 runs. `CLAUDE.md` and the session blocks point here,
rather than restating them. Session 4 then moves them into `CLAUDE.md`, which becomes their home.

1. **The full workflow, at the mod level** (decision 3). The mod's `CLAUDE.md` holds its own
   rules and commands, and its `docs/` hold its rounds.
2. **The folder of §4, the manifest of §5, and the invariants of §6.**
3. **Tests.**
   - Every behaviour has a test.
   - A UI test loops over `['terminal', 'desktop']` and never assumes a surface.
   - A test that depends on time pins the clock (`mock.clock`).
   - Fixtures are fictional.
4. **Hooks fail on purpose.** Every hook that `claude plugin validate` lists as gating has a
   `.catch` that decides what its failure does. A mod that only reacts to something never refuses
   it.
5. **Stored values are the owner's data** (§5). They are read forward-only and never dropped
   without a changelog line.
6. **Reach is named.** A mod uses network, process or file access only where its purpose needs
   it, and its `ARCHITECTURE.md` names each use.
7. **The mod's `README.md`** says what the mod does, gives the install lines, and lists its
   commands. **Its `CHANGELOG.md`** is written for the person using the mod.

## 9. Definition of done for round 1

- From a fresh clone, `npm ci` plus the documented step for the API declarations makes
  `npm run verify` green.
- **cartoon-fx:**
  - it is in `mods/cartoon-fx/` and listed in the marketplace;
  - its `validate` reports no warnings, its 28 tests pass, and `tsc` is clean;
  - the owner runs it from the installed release, checked by hand;
  - the `CLAUDE_CODE_PLUGIN_DIRS` entry is gone.
- `templates/mod-template/` passes the per-mod stages.
- **The docs, as built:**
  - at the root: `ARCHITECTURE.md` with its baseline, `USER-GUIDE.md`, `MOD-KICKOFF.md` and the
    README;
  - for cartoon-fx: `ARCHITECTURE.md` with its baseline, `USER-GUIDE.md`, the README, the
    changelog and the backlog;
  - every `CLAUDE.md` pointed at them.
- Round 1 is closed: `docs/spec/` is emptied, and the handoff says no round is in progress.

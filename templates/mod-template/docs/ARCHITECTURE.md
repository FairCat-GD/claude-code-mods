# mod-template — architecture

How the mod is built. **Decided** is the owner's: what the intake answered or the owner settled
with a session. It changes only with the owner, and each change after Session 0 is logged in the
*Decision log*. **Built** is what exists and how, with the decisions a session made on its own
within its scope, each with its why; every session keeps it true. Until something is built, its
Built part says "Not yet: Session <id>". In the invariants, each rule and its why are decided and
*Enforced by* is built; the debt and the baseline are built only.

The parts every mod in this repository shares are filled in already. Session 0 writes the rest
from the intake, and keeps every section, writing "None" where one has nothing.

## Overview

**Decided.**

```
<What the mod watches or adds, and what it changes in Claude Code's interface or behaviour>
```

<One paragraph: what each part of the mod is for.>

**Built.** One hooks module, `hooks/register.ts`, named by `hooks/hooks.json`. It declares
`/hello` on `session.start` and answers it on `command.run`: the template's starting point, which
Session 1 replaces.

## Context

**Decided.** The mod runs inside Claude Code's engine, as a plugin of function hooks.
- **What crosses.** The engine calls the hooks the module registers with `register(on, options)`.
  The module reaches everything outside itself through `$`: the session, the UI, the store, the
  tools. It has no DOM, no Node and no `import()`, and its JSX compiles against the global `h`.
- **Who owns it.** The engine and its API are Anthropic's, early access, and they change between
  releases. The declarations of the running build are the authority, never memory.
- **Two builds.** The CLI on PATH runs `claude plugin validate` and `claude plugin test`; the
  desktop app runs its own engine, which can be another version.
- **How it fails.** A hook that throws is the engine's to contain. A gating hook carries a
  `.catch` that lets the event go on unchanged, so the mod's fault never costs the owner a call.
- <What the mod must never assume about the engine: a hook's order, a row's shape, a surface.>

**Built.** <The engine versions the mod was measured on, and what was learned about each hook it
uses.>

## Stack and pins

**Decided.** TypeScript, typed against the declarations the engine lays in
`.claude-plugin/types/` for the CLI's build (`npm run types`, from the repository's root), never
committed. Tests run under `claude plugin test`, against the engine's kit (`claude-code/testing`),
not Node. The tooling's own pins are the repository's.

**Built.** <The CLI and desktop versions each check ran on, from `claude --version`, and when.>

## Layout and boundaries

**Decided.**
- **Layout:**
  - `.claude-plugin/plugin.json`: the manifest; its `version` is the mod's one version;
  - `hooks/hooks.json`: names the one hooks module; `hooks/`: the module and the files it
    imports;
  - `types/index.d.ts`: the `$.state` contract, once the mod declares any (`plugin.json` then
    names it under `types`);
  - `tests/`: the tests; `tests/fixtures/`: fictional data, once a test needs any;
  - `tools/`, once the mod needs a script run by hand: TypeScript run from the repository's root
    on its Node (`node mods/mod-template/tools/<tool>.ts`), never loaded by the engine. Each tool
    does its work only under `import.meta.main`, and has Node tests beside it, named `*.spec.ts`,
    never `*.test.ts`, which `claude plugin test` runs in the engine. Their fixtures are in
    `tools/fixtures/`;
  - `CLAUDE.md`, `CHANGELOG.md`, `README.md`, and `docs/` for this mod's workflow files.
- **Boundaries:** every file the module imports is inside this folder, and every bare import names
  a module the engine declares. Nothing is imported from another mod or from the repository's
  root, because the installed copy holds only this folder.
- **`tools/` is walled off both ways:** nothing outside it imports it, and a tool imports only from
  `tools/` and `node:` modules, every source under it `.ts`. What a tool reads, writes or runs is
  named in this file, as all reach is.

**Built.** *Enforced by* the gate's `imports` stage (the import scan, which holds the wall around
`tools/` too) and `validate` (`claude plugin validate`). A `tools/` is typed and its specs run by
the `types` and `tests` stages.

## The invariants

1. **The mod is self-contained.** *Why:* the installed copy holds only its folder. *Enforced by*
   the `imports` and `validate` stages.
2. **The mod's version lives in `plugin.json` alone, and its changelog's newest entry names it.**
   *Why:* one home per version. *Enforced by* the repository's `marketplace` stage.
3. **The mod keeps nothing in its folder it would not publish.** *Why:* the installed copy holds
   every tracked file of it, docs and tests included. *Enforced by* the hygiene stage, for what it
   can see.
4. <The mod's own rules, each with its why and what enforces it.>
5. **Nothing private enters the repository.** *Why:* the repository's whole history will be
   published. *Enforced by* the hygiene stage: the owner's term list against every file, path and
   commit message, attribution against every commit message, and secrets by their exact shapes.

## <The hooks>

**Decided.** <Each event the mod hooks, what it does there, and whether it gates.>

**Built.** Not yet: Session 1.

## <Values: `$.state` and `$.store`>

**Decided.**
- **Entities and storage:** <each `$.state` key, live for a session, and each `$.store` key,
  kept across the owner's sessions>.
- **Evolution:** a stored value's shape changes forward-only: a new version still reads the old
  shape, because stored values are the owner's data.
- **Machine identifiers, never renamed:** the mod's name, `mod-template`, and its install id,
  `mod-template@claude-code-mods`, under which the engine keeps its `$.store`; its slash commands;
  its `$.state` and `$.store` keys.

**Built.** None yet.

## <One section per subsystem>

**Decided.** <What it does and its contracts.>

**Built.** Not yet: Session <id>.

## Testing strategy — the layers, and what each cannot see

**Decided.** `npm run verify -- mod-template`, from the repository's root, runs the repository's
stages, then this mod's: `validate`, `types`, `tests` and `imports`, each failing on its own, then
a summary. It is green before every commit, or the docs-only command for a commit that changes
only docs. The commands are in the root `CLAUDE.md`.

**Built.**

| Layer | Runs | Covers | Cannot see |
|---|---|---|---|
| `validate` | `verify` | The manifest, the hooks the module registers, which gate, and the API calls it makes | Behaviour |
| `types` | `verify` | The module and tests against the CLI build's declarations | Another build's API, the desktop's included |
| `tests` | `verify` | The hooks against the engine's kit, with the clock and `$` stood in | What the app actually draws; real timing and order of events |
| `imports` | `verify` | Every import resolves inside the folder or to a declared module | Anything at run time |
| Hygiene | `verify`, with the drafted commit message; in full when the term list or the stage changes | Private terms in files, paths and messages; attribution in messages; secrets by their exact shapes; conflict markers | Images and binaries; a term joined inside one lowercase run; attribution in files; a home-directory path; a secret of any other shape |
| By hand | Recorded in done-notes | The mod in the app, from the installed release or a `--plugin-dir` session | Anything not written down; what nobody checked goes to `docs/BACKLOG.md` |

## Packaging

**Decided.** The owner installs the release from the repository's marketplace as
`mod-template@claude-code-mods`, at user scope. `claude plugin update mod-template` installs a
pushed version only when `plugin.json`'s differs from the installed one, so every change meant
for the owner cuts a version. A `claude --plugin-dir mods/mod-template` terminal session tries an
unpushed build: it replaces the installed copy for that session and runs as
`mod-template@inline`, with its own `$.store`.

**Built.** Not yet: nothing is pushed or installed.

## Deliberate decisions

**Decided.** None yet.

## Known debt, deliberately deferred

None yet.

## Baseline

Filled in by Session 1, from its first green `verify`.

## Decision log

None yet.

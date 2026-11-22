# The session plan: round 2, the gate takes `tools/`

One block per session, in order, each run by *The session cycle* in
`docs/DEVELOPMENT-WORKFLOW.md`. The request and its resolved decisions are in `FEATURE-tools.md`
beside this file, which is read-only; do not re-litigate them. A session that finds its block
wrong amends it and records the reason in the block and in `docs/next-session-prompt.md`. G1
closes the round: it deletes this file and the feature file, and anything left open moves to
`docs/BACKLOG.md`.

| Session | Scope | Decisions | Version |
|---|---|---|---|
| G1 | The gate takes a mod's `tools/`: the import wall, the type check, the Node tests; the docs; close the round | 1–3; invariants 2 and 6, *Layout and boundaries*, *What a mod is*, *The gate*, *`validate` and the import scan* | — |

---

## G1: The gate takes `tools/`

**Read:** `FEATURE-tools.md` decisions 1–3; `ARCHITECTURE.md` invariants 2 and 6, *Stack and
pins*, *Layout and boundaries*, *What a mod is*, *The gate*, *`validate` and the import scan*,
*The template and `new-mod`*, *Packaging*, *Testing strategy*, *Baseline*, *Decision log* (the
2026-11-22 lines); `DEVELOPMENT-WORKFLOW.md` *Rounds* (the close).

- **First, measure** what the engine makes of a `tools/` folder, before any code.
  - Run `claude plugin validate` and `claude plugin test` on a fixture mod with a tool and its
    spec, in a scratch home, as the tooling's tests run the CLI.
  - Expected: `validate` reports nothing about `tools/`, and `test` collects no `*.spec.ts`. The
    intake read its pattern, `\.test\.tsx?$`, from the CLI 2.1.330 binary.
  - **If `validate` warns or errors on `tools/`, stop and bring it to the owner.**
    `scripts/validate.ts` allows one warning by name, so every mod with `tools/` would fail.
- **The import scan** (*Layout and boundaries*, *`validate` and the import scan*), in
  `scanImports` (`scripts/imports.ts:33`).
  - In `tools/`:
    - a bare import passes only as a `node:` module;
    - a relative import must resolve inside `tools/`;
    - a source that is not `.ts` (`SOURCE`, `:10`, takes `.js`, `.mjs`, `.tsx` and the rest) is
      refused;
    - so is a `/// <reference types>`.
  - Outside `tools/`, an import that resolves into it is refused, saying why. `node:` stays
    refused there, as an undeclared module (`:55`).
  - Each message keeps today's `file:line` form.
- **The tools' type check** (*The gate*, *Stack and pins*).
  - A new script types every `.ts` under `<folder>/tools/` but `tools/fixtures/`, with the
    compiler options of the root `tsconfig.json`, read through the TypeScript API. The script's
    name is G1's.
  - The intake measured the route: `ts.getParsedCommandLineOfConfigFile`, then
    `ts.createProgram(files, options)`, types a file the config does not include against
    `@types/node`. Resolve the config from `ROOT`, not the working directory.
- **The tools' specs** (*What a mod is*, *Testing strategy*), in a new script, or the type
  check's with a word.
  - It lists `tools/**/*.spec.ts` outside `tools/fixtures/`.
  - It fails when `tools/` holds a tool (a `.ts` that is neither a spec nor under `fixtures/`)
    and no spec.
  - It runs `node --test` on those files by name, with `NODE_TEST_CONTEXT` removed from its
    environment.
- **`folderStages`** (`scripts/verify.ts:56`). When `<folder>/tools/` exists:
  - `types` (`:61`) adds the tools' type check, and `tests` (`:66`) the tools' specs;
  - a setup error in the kit's half (stale or missing declarations at `:62-63`, no `claude`)
    still fails the stage, but the tools' commands run anyway. Today a throw in `commands()`
    skips them all (`runStage`, `:113-123`); the mechanism is G1's;
  - a folder without `tools/` runs exactly what it runs today.
- **Fixtures,** fictional and Biome-clean, under `tests/fixtures/`. The root `package.json`
  makes them ES modules to the root options; a `temporaryFolder` would be CommonJS. Cover:
  - a tool with its spec;
  - a hooks file and a test importing the tool;
  - a tool importing `hooks/`;
  - a tool's bare non-`node:` import;
  - a `.mjs` tool;
  - a tool with a type error;
  - a `tools/` with no spec;
  - a spec under `tools/fixtures/`.

  `tests/fixtures/README.md` describes each.
- **Docs.**
  - `ARCHITECTURE.md`:
    - the Built parts of the sections above, each now saying "Not yet: Session G1";
    - *Testing strategy*'s table, a row for the tools' type check and specs;
    - *Overview*'s Built: two mods, and the script count;
    - *Baseline*: the tooling's test counts, and the stage count. 18 since possum-squad joined:
      the 6 repo stages, then 4 for each of two mods and the template.
  - `CLAUDE.md`:
    - invariants 2 and 6, as `ARCHITECTURE.md` now decides them;
    - *The plugin API is early access*: "A mod's tests run under `claude plugin test`, not Node"
      gains the tools;
    - *What every mod follows* 3 (a tool's specs) and 6 (a tool's reach);
    - *Commands*: the new script or scripts, the import scan's line, and `verify`'s per-folder
      stages;
    - *Watch for*: a `*.test.ts` under `tools/` runs in the engine.
  - `USER-GUIDE.md` *Working in the repository*: running a mod's tool.
  - The template's `docs/ARCHITECTURE.md` *Layout and boundaries*: the `tools/` rules, for a mod
    that adds one.
- **The close,** after the review commit (*Rounds*, 5):
  - read the sections this block's Read line names, cold, against the code;
  - move anything open to `docs/BACKLOG.md`;
  - the handoff is the between-rounds one, saying possum-squad's Session 6 can run;
  - `docs: close round 2` deletes this file and `FEATURE-tools.md`, and fills in the review
    commit's sha.
- **Confirms:**
  - *Layout and boundaries* (the wall);
  - *What a mod is* (its tools);
  - *The gate* (the per-folder stages and `tools/`);
  - *`validate` and the import scan* (the `tools/` rules);
  - invariant 6 (a tool's fixtures, and the read-only exception).

**Gates:**
- Full `npm run verify` green, with tooling tests for each rule:
  - **the import scan:**
    - a tool's `node:` import passes;
    - refused in a tool: a bare non-`node:` import, an import of `hooks/`, a `.mjs`, a
      `/// <reference types>`;
    - refused outside `tools/`: an import of it from `hooks/`, from `tests/` and from `types/`,
      and a `node:` import;
  - **the type check:** a tool's type error fails, a clean tool passes, and `tools/fixtures/` is
    left out;
  - **the specs:**
    - a failing spec fails;
    - a spec under `tools/fixtures/` is not run;
    - a `tools/` with no spec fails;
    - each is run from a tooling test, so it proves `NODE_TEST_CONTEXT` is removed;
  - **`plan`:** a folder with `tools/` keeps its tools' commands in `types` and `tests` with no
    declarations and no `claude`; a folder without `tools/` gets no new command.
- Falsify each new check once, each failing at its own step.
- The measurement above, recorded in the done-note with the CLI's version.

**Watch for:**
- **A `node --test` started inside a tooling test runs nothing and exits 0.** It inherits
  `NODE_TEST_CONTEXT`. `tests/verify.test.ts:156` removes the variable for that reason. A spec
  command that keeps it makes every spec test pass.
- **A throw in a stage's `commands()` skips every command of that stage,** not only the one that
  could not start.
- **`claude plugin test` runs every `*.test.ts` and `*.test.tsx` under the mod,** `tools/`
  included. A tool's test named that way runs in the engine and fails to load.
- **`node --test` exits 0 when its pattern matches no file,** and `**` descends into
  `fixtures/`. Both measured at the intake on Node 26.7.0.
- **Biome reads `tools/fixtures/`:** a malformed JSON fixture fails `format`. A spec that needs a
  broken input writes it into a temporary folder.
- **A tool without an `import.meta.main` guard runs** when its spec imports it.
- **possum-squad's folder is not G1's,** and nor are its rows that wait on this round. A
  possum-squad session may be running beside G1, and its uncommitted work can turn the full gate
  red for its folder.

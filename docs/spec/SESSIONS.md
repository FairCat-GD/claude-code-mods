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
  - Type a fixture tool under `tests/fixtures/<mod>/tools/` with the root `tsconfig.json`'s
    options through the TypeScript API, and see it resolve `@types/node` as an ES module.
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
  - The route: `ts.getParsedCommandLineOfConfigFile`, then `ts.createProgram(files, options)`,
    with the files named. The intake ran it on `scripts/repo.ts`, which the config includes:
    `@types/node` resolved, with 0 diagnostics. The plan's reviewer checked a file outside the
    config only in memory. A file under `mods/` is measured at G1's start, above. Resolve the
    config from `ROOT`, not the working directory.
- **The tools' specs** (*What a mod is*, *Testing strategy*), in a new script, or the type
  check's with a word.
  - It lists `tools/**/*.spec.ts` outside `tools/fixtures/`.
  - It fails when `tools/` holds a tool and no spec. A tool is a `.ts` that is neither a spec, a
    declaration file (`.d.ts`) nor under `fixtures/`. A `.d.ts` is allowed under `tools/` and is
    typed, but asks for no spec.
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
  - a `tools/` holding only a `.d.ts`;
  - a spec under `tools/fixtures/`.

  `tests/fixtures/README.md` describes each.
- **Docs.**
  - `ARCHITECTURE.md`:
    - the Built parts of the sections above, each now saying "Not yet: Session G1";
    - *Testing strategy*'s table, a row for the tools' type check and specs;
    - *Overview*'s Built: the script count, if G1 adds a script;
    - *Baseline*: the tooling's test counts. The intake's review already set the stage count to
      18 and the two mods.
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
    - a `tools/` with no spec fails, and one holding only a `.d.ts` passes;
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

**Done (2026-11-22, no version).**
- **Decided with the owner at the start:** the plan as the block gives it, with one script for
  both of the tools' checks. Confirmed as decided, with no change: *Layout and boundaries* (the
  wall), *What a mod is* (its tools), *The gate* (the per-folder stages and `tools/`),
  *`validate` and the import scan* (the `tools/` rules) and invariant 6.
- **The import scan** (`scanImports`, `scripts/imports.ts`). A source is a tool's when its path
  in the folder starts `tools/`, `tools/fixtures/` included, and each reference is a path, a
  module or a types reference.
  - In `tools/`: a source that is not `.ts` is refused at its first line; a module must start
    `node:` and be one Node's `isBuiltin` knows; a types reference is refused; a path that
    resolves inside the folder but outside `tools/` leaves it.
  - Outside `tools/`: a path that resolves into it "reaches into tools/, which runs on Node,
    never in the engine"; `node:` stays an undeclared module.
  - A path is judged in order: it leaves the folder, it crosses the wall, it resolves to no file.
    Every message keeps the `file:line: '<spec>'` form.
- **`scripts/tools.ts`,** `node scripts/tools.ts <types|specs> <folder>`.
  - `toolFiles` lists every `.ts` under `tools/` but `tools/fixtures/`: the specs (`*.spec.ts`)
    and the tools (neither a spec nor a `.d.ts`).
  - `typeProblems` reads the options with `ts.getParsedCommandLineOfConfigFile` from `ROOT`'s
    `tsconfig.json` and hands the list to `ts.createProgram`. A diagnostic prints as
    `<file>:<line>: TS<code> <message>`. The root's `skipLibCheck` holds, so a `.d.ts` is in the
    program but its body is not checked.
  - `specProblems` fails a tool with no spec, naming it. Otherwise it runs `node --test` from
    `ROOT` on the specs by name, with `NODE_TEST_CONTEXT` removed, and never with no file, which
    would collect by Node's own patterns.
- **`scripts/verify.ts`.** `Stage` has an optional `tools`, the tools' half. `folderStages` gives
  `types` and `tests` one when `<folder>/tools/` is a directory, and no folder without one gets
  it. `runStage` starts each half on its own: a half that throws logs `cannot start` and fails
  the stage, and the other half's commands still run.
- **Fixtures,** six under `tests/fixtures/`, each in its README: `tooled-mod`, `walled-mod`,
  `mistyped-mod`, `failing-spec-mod`, `unspecced-mod`, `declarations-only-mod`. `tooled-mod`'s
  `tools/fixtures/never.spec.ts` carries a type error and a failing test, so one file shows if
  either half reads `tools/fixtures/`.
- **Docs.** `ARCHITECTURE.md`: every "Not yet: Session G1" Built part, *Testing strategy*'s tools
  row, *Overview*'s nine scripts, `report`'s users, the baseline. `CLAUDE.md`: invariants 2 and
  6, the tests line, *What every mod follows* 3 and 6, *Commands* (the tools script, running a
  tool, the import scan's line, `verify`'s halves), *Watch for* (a `*.test.ts` under `tools/`).
  `USER-GUIDE.md`: running a mod's tool. The template's `docs/ARCHITECTURE.md`: the `tools/`
  layout and wall. `README.md`: the gate's line and its list of scripts.
- **Amendments:**
  - **A spec whose path holds a glob character is refused, by name, and the others still run.**
    `node --test` reads each path it is given as a glob and passes when one matches no file, so
    running the specs "by name" could skip one without a word. The session's own finding,
    measured below.
  - **`README.md` changed too.** It lists every script and describes the gate; the block's Docs
    line did not name it. The session's own finding.
  - **The *Testing strategy* heading says seven layers.** The intake added the tools row to a
    table headed six. The session's own finding.
- **Measured** (CLI 2.1.330, Node 26.7.0, 2026-11-22):
  - `claude plugin validate --json`, in a scratch home without `CLAUDE_CODE_PLUGIN_DIRS`, on a
    copy of the template with `tools/shout.ts`, its spec and a JSON fixture: the report matched
    the copy's without `tools/`, field for field, `directory.findings` included, and
    `scripts/validate.ts` judged it 0 problems. Nothing to stop for.
  - `claude plugin test` on the same copy ran 1 test in 1 file, the template's, with and without
    `tools/`. A `tools/shout.test.ts` added to it was collected and failed: "the file did not
    load", on its `node:assert/strict` import.
  - The TypeScript API with the root config's options, run from `/tmp`, on `tooled-mod`'s tool,
    its spec and its fixture spec: the config read from `ROOT`, all three ES modules,
    `@types/node` in the program, and no diagnostic but the fixture's planted TS2322.
  - `node --test` on spec paths holding glob characters: `a[1].spec.ts` ran nothing,
    `a\[1\].spec.ts` ran nothing, `a[[]1].spec.ts` ran it, and `b\*.spec.ts` ran 0 tests and
    passed.
  - `main` on `tooled-mod`'s `types` and `tests`: each kit half could not start (no declarations;
    no hooks module), each tools half ran and passed, and both stages failed.
- **Falsified,** each by copying the script aside, breaking one rule and copying it back; each
  failed at its own test:
  - the `.ts`-only rule, the types-reference rule, the wall leaving `tools/` and the wall into
    it: the wall test;
  - the `node:` prefix and `isBuiltin`: the test of a tool naming a module Node has;
  - the `tools/fixtures/` exclusion: the listing, type-check and passing-spec tests;
  - a `.d.ts` counted as a tool: the listing and `.d.ts`-only tests;
  - type errors dropped: the type-error test;
  - `NODE_TEST_CONTEXT` kept: the failing-spec, passing-spec and glob tests;
  - a failed run reported as passing: the failing-spec test;
  - the no-spec rule: the no-spec test;
  - the glob refusal: the glob test;
  - one half only in `runStage`: the halves test;
  - no tools' half in `tests`: the `plan` test.
- **Numbers:** tooling tests 180 in 11 files (+14, +1 file): imports 13 (+3), tools 9 (new),
  verify 17 (+2). `npm run verify` green, 18 stages, as before: no mod has a `tools/` yet. The
  template 1 test, 2 hooks, 0 gating.

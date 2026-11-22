Read what Session G1's **Read** line in docs/spec/SESSIONS.md names, CLAUDE.md, *The session
cycle* in docs/DEVELOPMENT-WORKFLOW.md, docs/ARCHITECTURE.md's overview, invariants and
baseline, docs/spec/SESSIONS.md's header and Session G1's block (the round's first, so there is
no previous done-note), then this file, and do Session G1: the gate takes a mod's `tools/`.
G1 covers:
- the import scan's wall around `tools/`;
- the tools' type check, with the tooling's compiler options;
- the tools' Node specs, `*.spec.ts`, in each folder's `tests` stage;
- the docs, and the round's close.

The repo level cuts no version.

## State you need that is not in the specs

- **Round 2 is the gate taking a mod's `tools/`.** Its intake (2026-11-22) opened it, and G1 is
  its one session, which also closes it. The request and its decisions are in
  `docs/spec/FEATURE-tools.md`.
- **Push status:** `origin/main` holds everything through `65c36b2` (possum-squad's Session 8
  review), pushed on 2026-11-22. Four commits wait locally, none pushed:
  - `7b9e3be`, a possum-squad docs commit recording the owner's desktop check of 0.6.0;
  - `dd87acc`, this intake's `docs: open round 2`;
  - `61e6d3e`, a possum-squad docs commit from the intake's review: its Session 6 waits for this
    round's close;
  - the intake's `review:` commit.

  List `origin/main..HEAD` before any push, and name any commit that is not the session's.
- **Decided parts of `ARCHITECTURE.md` written at the intake,** each with a 2026-11-22 *Decision
  log* line and a Built part saying "Not yet: Session G1". They are G1's Confirms:
  - invariants 2 and 6;
  - *Stack and pins*, *Layout and boundaries*, *What a mod is* and *The gate*;
  - *`validate` and the import scan*, *The template and `new-mod`*, *Packaging* and *Testing
    strategy*.
- **`CLAUDE.md` is behind `ARCHITECTURE.md` until G1.** Its invariants 2 and 6, "A mod's tests
  run under `claude plugin test`, not Node" and *What every mod follows* still describe a mod
  with no `tools/`. G1 brings them into line (its Docs).
- **possum-squad's Session 6 waits for this round's close,** not this intake's commit. Until G1
  lands, the gate still refuses a tool's `node:` imports. Its own handoff says so since
  `61e6d3e`, naming `docs: close round 2`. The between-rounds handoff G1 writes says Session 6
  can run.
- **The intake ran in the chat of a possum-squad session,** after its docs commit `7b9e3be`, at
  the owner's ask. Each commit stays at one level.
- **The intake's review (`/code-review high`), 7 findings, all fixed:**
  - possum-squad's handoff named the round's opening, not its close;
  - the TypeScript API's measurement had run on a file the config includes;
  - *Layout and boundaries*' Built line claimed the tool exception enforced;
  - invariant 2's *Enforced by* lacked "Not yet";
  - a `.d.ts` under `tools/` counted as a tool needing a spec;
  - *Overview* and *Baseline* still counted one mod and 14 stages;
  - this chat's two levels, now noted here.
- **The plan had an adversarial review** before approval, on the owner's word. Its 11 findings
  are folded into G1's block. The two high ones:
  - a nested `node --test` inherits `NODE_TEST_CONTEXT` and runs nothing;
  - a throw in a stage's `commands()` skips the tools' commands with the kit's.
- **Measured at the intake** (CLI 2.1.330, Node 26.7.0):
  - `claude plugin test` collects `\.test\.tsx?$` under the mod;
  - `node --test` exits 0 on a pattern matching nothing, and `**` enters `fixtures/`;
  - the TypeScript API with the root config's options resolves `@types/node` for
    `scripts/repo.ts`, a file the config includes, with 0 diagnostics;
  - Biome reads `tools/fixtures/`.

  Not measured: what `claude plugin validate` makes of `tools/`, and the type check on a file
  under a mod's `tools/`. Both are G1's first step, with a stop for the first.
- **Baseline** (`docs/ARCHITECTURE.md`'s table; the full gate run on 2026-11-22, CLI 2.1.330):
  - `npm run verify` green, 18 stages;
  - tooling tests 166 in 10 files;
  - the template 1 test, 2 hooks, 0 gating;
  - each mod's counts are in its own baseline.

## Watch for

- **The repo-level docs never describe a mod's internals.** They point at the mod's own
  `docs/ARCHITECTURE.md`, and a mod session cannot edit them. possum-squad's rows that wait on
  this round are its own.
- **A mod's session may be running beside G1.** Its folder is not yours, and its uncommitted
  work can turn the full gate red for its folder.
- **cartoon-fx's handoff still names the repo's round 1 close as next.** That file is the mod's:
  its next session drops the line when it rewrites the handoff.

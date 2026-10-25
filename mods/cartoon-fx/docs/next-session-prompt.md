Read docs/spec/FEATURE-review-effects.md, the root CLAUDE.md, this mod's CLAUDE.md,
docs/ARCHITECTURE.md, then this file. Then do Session C1 of docs/spec/SESSIONS.md: the Biome
reformat of the four copied files, and the close of round 2. C1 has two parts:
- the reformat (decision 6), which changes no baseline count;
- the close: anything open moves to `docs/BACKLOG.md`, and the spec files are deleted.

C1 cuts no version. All paths here are inside `mods/cartoon-fx/`; run
`npm run verify -- cartoon-fx` from the repository's root.

## State you need that is not in the specs

- **Round 2 is the code-review effects that never show.** F1 is done (0.10.2); C1 remains.
- **Push status.** `origin/main` holds everything through `ed3aaa6`, F1's review commit. The
  `docs(cartoon-fx)` commit that records the update is local, not pushed. List `origin/main..HEAD`
  before any push: parallel sessions share this checkout.
- **0.10.2 is pushed and installed, but not checked in the desktop yet.**
  - `origin/main` was at `ed3aaa6` after F1's push. `claude plugin update cartoon-fx` installed
    0.10.2 from it, recorded in *Packaging*.
  - Still to do: in a new desktop session, the owner runs a `/code-review` with findings, then its
    fixes. That closes two BACKLOG items, *A review's effects beside its card* and *A new session
    runs an update*.
  - **If that look shows the effects still hidden,** a fix session is inserted before C1
    (*Rounds*, step 4), and C1 waits.
- **What F1 left that C1 touches:**
  - `hooks/register.tsx` (513 lines) gained `OWN_CARDS`, `rowBefore`, `replyRow`, `bound`,
    `markDrawn`, `noteReply`/`isNewestReply` and an `AssistantMessage` render hook;
  - `tests/cartoon-fx.test.tsx` (678 lines) gained `told`, `replyRow` and seven tests.
  - Both still keep the copied layout (2-space, no semicolons, long lines), which C1's reformat
    changes.
- **What the spec said that turned out wrong:**
  - The declarations do name `ReportFindings` (`BuiltinToolInputs`, in the laid
    `claude-code-tools/index.d.ts`). This is amended in the F1 block, and no cast is left for it.
  - Nothing can draw under the desktop's findings card. The review plays in the row just before
    the card instead, which the owner chose.
- **The owner's stored placement is `conversation` again** (they ran `/fx place conversation`
  during F1).
- **Baseline** (`docs/ARCHITECTURE.md`, v0.10.2, CLI 2.1.310):
  - 35 tests in `tests/cartoon-fx.test.tsx`;
  - `validate`: 13 hooks, 5 gating (each with a `.catch`), 4 state keys, and no warning but the
    allowed `CLAUDE.md` one;
  - `tsc` and the import scan are clean.
  - C1 must move none of these.
- **Repo Session 4** (the repo's documentation pass) may still be open. It touches this mod only
  to repoint its `CLAUDE.md`. Start C1 once that change is committed, and leave its uncommitted
  changes alone.

## Watch for

- **The standing traps:**
  - **Never `git checkout <path>`.** Falsify by copying the file aside and back.
  - **Stage explicit paths.** Parallel sessions share this checkout.
  - **Give stdin-reading commands `< /dev/null`.** A bare `cat > file` with no heredoc hangs.
  - **The CLI and the desktop engine are different builds,** and the CLI updates itself. Record
    the version each check ran on, and run `npm run types` again when the `types` stage asks.
- **The installed release runs in every session the owner starts,** this mod's own development
  sessions included. So a commit stamps, and `npm run verify` shows the checkmark.
- **The reformat must not change behaviour.** Run the 35 tests before and after it. A count that
  moves is the finding.
- **`placement` and `fxTakes` are the owner's data** in `$.store`. Read them forward-only.
- **Comments state the present.** No session ids, no "used to", no review stories.
- **Every push needs its own approval.** List `origin/main..HEAD` first, because parallel
  sessions share this checkout.

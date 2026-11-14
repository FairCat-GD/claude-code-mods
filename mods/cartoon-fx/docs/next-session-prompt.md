Read this mod's `docs/spec/FEATURE-fun.md` (decision 1) and `docs/spec/REVIEW-2026-11-14.md`
(F8, F9 and §7), the root CLAUDE.md, this mod's CLAUDE.md, `docs/ARCHITECTURE.md`, then this
file, and do Session D1 of this mod's `docs/spec/SESSIONS.md`: detection that reads what
happened. That is the git subcommand anchored, rejected pushes, a detached HEAD, more test
runners, and quoting. Release 0.11.1.

## State you need that is not in the specs

- **Round 3 is fun, a queue, new moments and controls:** A1 is done; D1, Q1, T1, T2, C1 and A2
  remain. The root's sessions 3a–3c run beside this round, from the root's
  `docs/spec/REVIEW-2026-11-14.md`.
- **A1 shipped 0.11.0** (its done-note in `SESSIONS.md`):
  - the lens, the marks, the gauge's bands from the new `hooks/zones.ts`, and labels that fit;
  - new helpers and a smoke that shrinks away;
  - seven structural tests over `drawFx`'s output.

  D1 touches none of it: its ground is `hooks/detect.ts`, its two tests, and the Bash hook in
  `register.tsx`.
- **Push status.**
  - `origin/main` holds everything through
    `review(cartoon-fx): desktop checks wait for the push, and 7 smaller`.
  - A1's session commit waits locally, and the review commit will join it. List
    `origin/main..HEAD` before any push.
  - `CHANGELOG.md`'s link reference for 0.11.0 waits for the session commit's sha. The review
    commit adds it.
- **0.10.3 is the installed release** until the owner pushes 0.11.0 and runs
  `claude plugin update cartoon-fx`. The desktop check of the redrawn effects waits for that
  (`docs/BACKLOG.md`).
- **The owner's stored placement is `conversation`.**
- **The CLI on PATH is 2.1.325.**
- **Baseline** (`docs/ARCHITECTURE.md`, v0.11.0, CLI 2.1.325):
  - 43 tests;
  - `validate`: 13 hooks, 5 gating (each with a `.catch`), 4 state keys, and no warning but the
    allowed `CLAUDE.md` one;
  - `tsc` and the import scan clean.

  D1 adds a case per row of the review's §7, so the test count may move. Each case is
  falsified.
- **How A1 checked things live, reusable here:**
  - A terminal check can be started from the Terminal panel:
    `claude --plugin-dir mods/cartoon-fx "/fx all"`, from the repository's root, runs `/fx all`
    as its opening prompt. `read_terminal` reads the strip, and closing the tab ends the session.
    An effect lasts about three seconds, so the first one can play out before the first read;
    `/fx <name>` alone with reads in the same batch catches it.
  - A scratch page served on `127.0.0.1` (`python3 -m http.server`, from the scratch folder)
    opens in the app's browser pane with its scripts running. A `file://` page opens only as a
    static snapshot.
  - Node imports `hooks/fx.ts` once a resolve hook adds `.ts` to its extensionless `./zones`.
- **Repo Session 3b or 4** repoints this mod's `CLAUDE.md` (lines 9–10) and
  `docs/ARCHITECTURE.md` (*Testing strategy*) away from the root `docs/spec/SPEC.md`, in a
  `docs(cartoon-fx):` commit of its own. Leave those lines to it. Repo Session 3b may also have
  re-copied the root `docs/DEVELOPMENT-WORKFLOW.md`; follow it as it stands.

## Watch for

- **The standing traps:**
  - **Never `git checkout <path>`.** Falsify by copying the file aside and back.
  - **Stage explicit paths.** Parallel sessions share this checkout.
  - **Give stdin-reading commands `< /dev/null`.** A bare `cat > file` with no heredoc hangs.
  - **The CLI and the desktop engine are different builds,** and the CLI updates itself. Record
    the version each check ran on, and run `npm run types` again when the `types` stage asks.
- **The installed release runs in every session the owner starts,** this mod's own development
  sessions included. So a commit stamps, and `npm run verify` shows the checkmark.
- **A `--plugin-dir mods/cartoon-fx` session replaces the release** for that session
  (`docs/ARCHITECTURE.md`, *Packaging*). Start it from the repository's root.
- **Biome formats every file in this folder.** There is no folder `biome.json`; run
  `npx biome format --write mods/cartoon-fx` before the gate.
- **`placement` and `fxTakes` are the owner's data** in `$.store` (`docs/ARCHITECTURE.md`,
  *Values*). Read them forward-only, and never drop one without a changelog line.
- **The owner's update path is `claude plugin update cartoon-fx`,** and it installs only a new
  `plugin.json` version.
- **D1 is a fix bump** (0.11.1): new runners count as detection that was missing; anything the
  owner would call a feature is a stop.
- **Fictional output only** (root invariant 6): fixtures shaped on what each runner prints,
  with made-up names and counts.
- **Comments state the present.** No session ids, no "used to", no review stories.
- **Every push needs its own approval.** List `origin/main..HEAD` first.

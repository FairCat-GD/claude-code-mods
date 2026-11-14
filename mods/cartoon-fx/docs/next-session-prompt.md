Read, in the order the root CLAUDE.md gives a mod session:
1. what D1's **Read** line names, in this mod's `docs/spec/`;
2. the root CLAUDE.md, then this mod's CLAUDE.md;
3. *The session cycle* in the root `docs/DEVELOPMENT-WORKFLOW.md`;
4. this mod's `docs/ARCHITECTURE.md`: its overview, invariants and baseline, and the sections
   the Read line names;
5. `docs/spec/SESSIONS.md`'s header, D1's block and A1's done-note;
6. this file.

Then do Session D1: detection that reads what happened. That is the git subcommand anchored, rejected pushes, a detached HEAD, more test
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
- **Push status.** A parallel repo session pushed on 2026-11-14 with the owner's approval.
  `origin/main` then held A1's two commits and that session's own, through
  `review: the read order covers an intake and a new mod, and 4 smaller`. This handoff's
  correction, `docs(cartoon-fx): A1's handoff says 0.11.0 is pushed`, was pushed after it with
  the owner's approval, so `origin/main` holds everything through that commit. List
  `origin/main..HEAD` before any push.
- **0.11.0 is pushed, but whether it is installed is unknown.** The desktop check of the redrawn
  effects runs after `claude plugin update cartoon-fx`, in a new desktop session. If the owner
  has run it, D1 asks for its outcome at the start; otherwise it stays in `docs/BACKLOG.md`.
- **This mod's `CLAUDE.md` changed after A1.** Repo session 3b gave it the root's read order and
  a *Watch for* section; the standing traps below move there when they recur.
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

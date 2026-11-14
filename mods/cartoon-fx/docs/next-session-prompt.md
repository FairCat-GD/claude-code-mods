Read, in the order the root CLAUDE.md gives a mod session:
1. what Q1's **Read** line names, in this mod's `docs/spec/`;
2. the root CLAUDE.md, then this mod's CLAUDE.md;
3. *The session cycle* in the root `docs/DEVELOPMENT-WORKFLOW.md`;
4. this mod's `docs/ARCHITECTURE.md`: its overview, invariants and baseline, and the sections
   the Read line names;
5. `docs/spec/SESSIONS.md`'s header, Q1's block and D1's done-note;
6. this file.

Then do Session Q1: the queue. Everything plays in order, three wait at most, and stale ones are
dropped. Release 0.12.0.

## State you need that is not in the specs

- **Round 3 is fun, a queue, new moments and controls:** A1 and D1 are done; Q1, T1, T2, C1 and
  A2 remain. The root's sessions 3a–3c run beside this round, from the root's
  `docs/spec/REVIEW-2026-11-14.md`.
- **D1 shipped 0.11.1** (its done-note in `SESSIONS.md`): detection in `hooks/detect.ts` reads
  the engine's `gitOperation` first (for a push, after git's own `To` report), splits commands with quoting in view, anchors the git
  subcommand, and knows eight more runners. `register.tsx` was not touched. The Bash hook still
  plays one effect, the push before the commit before the tests; Q1 makes it play each, in the
  order the command ran them.
- **The engine's classifier is read, not measured.** D1 read `gitOperation`'s rules from the CLI
  build 2.1.325 (*Detection* in `docs/ARCHITECTURE.md`). T1 still measures a cherry-pick and a
  merge live, as its block says.
- **The 0.11.0 desktop check passed.** In this desktop session, `/fx all` (take 5) played all ten
  in its row. A first run (take 4), made while a question box covered the conversation, looked
  short to the owner. All ten effects share the `/fx` row, so once the row draws the first, the
  rest never fall back to the strip. If the box hid the row, they played out of sight. Q1
  rebuilds `/fx all` on the queue, so it should keep this in view.
- **Push status.** D1's two commits, the session's and its review's, were pushed on 2026-11-14
  with the owner's approval, so `origin/main` holds everything through D1's review. The owner
  then ran `claude plugin update cartoon-fx`, which reported 0.11.0 to 0.11.1 at user scope; a
  session started after it runs 0.11.1. List `origin/main..HEAD` before any push; parallel repo
  sessions share this checkout.
- **The owner's stored placement is `conversation`.**
- **The CLI on PATH is 2.1.325,** and so is the desktop's engine.
- **Baseline** (`docs/ARCHITECTURE.md`, v0.11.1, CLI 2.1.325):
  - 50 tests;
  - `validate`: 13 hooks, 5 gating (each with a `.catch`), 4 state keys, and no warning but the
    allowed `CLAUDE.md` one;
  - `tsc` and the import scan clean.
- **How earlier sessions checked things live, reusable here:**
  - A terminal check can be started from the Terminal panel:
    `claude --plugin-dir mods/cartoon-fx "/fx all"`, from the repository's root, runs `/fx all`
    as its opening prompt. `read_terminal` reads the strip, and closing the tab ends the session.
    An effect lasts about three seconds, so the first one can play out before the first read;
    `/fx <name>` alone with reads in the same batch catches it.
  - A desktop check needs the owner to type `/fx`, with no dialog open over the conversation:
    pause, and let them run it.
- **Repo Session 3b or 4** repoints this mod's `CLAUDE.md` (lines 9–10) and
  `docs/ARCHITECTURE.md` (*Testing strategy*) away from the root `docs/spec/SPEC.md`, in a
  `docs(cartoon-fx):` commit of its own. Leave those lines to it. Follow the root
  `docs/DEVELOPMENT-WORKFLOW.md` as it stands.

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
- **A new `$.state` key is a machine identifier,** named once (Q1's ask).
- **Fictional output only** (root invariant 6).
- **Comments state the present.** No session ids, no "used to", no review stories.
- **Every push needs its own approval.** List `origin/main..HEAD` first.

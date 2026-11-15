Read, in the order the root CLAUDE.md gives a mod session:
1. what T2's **Read** line names, in this mod's `docs/spec/`;
2. the root CLAUDE.md, then this mod's CLAUDE.md;
3. *The session cycle* in the root `docs/DEVELOPMENT-WORKFLOW.md`;
4. this mod's `docs/ARCHITECTURE.md`: its overview, invariants and baseline, and the sections
   the Read line names;
5. `docs/spec/SESSIONS.md`'s header, T2's block and T1's done-note;
6. this file.

Then do Session T2: a pull request opened, and a rebase finished. Release 0.14.0.

## State you need that is not in the specs

- **Round 3 is fun, a queue, new moments and controls:** A1, D1, Q1 and T1 are done; T2, C1 and
  A2 remain.
- **The repo level runs beside this round,** from the root's `docs/spec/REVIEW-2026-11-14.md`.
  Its Sessions 3a and 3b are done, and 3c committed `feat: npm run new-mod makes a mod from the
  template`. Whether 3c is closed, and Session 4 (the repo's documentation pass, closing its
  round 1), are tracked in the root `docs/spec/SESSIONS.md` and `docs/next-session-prompt.md`.
  Carry this line in every later cartoon-fx handoff until both are done.
- **T1 shipped 0.13.0** (its done-note in `SESSIONS.md`): `cherry` and `merge`, read from the
  engine's report alone. Its measurement answers T2's stop rule:
  - **The rebase is reported:** `branch: { ref, action: 'rebased' }`, on `Successfully rebased`.
    Its `ref` is the upstream (`git rebase main` reports `main`), not the branch rebased, and a
    `git rebase -i` or `--onto` reads the first word after `rebase` that is not a flag. What the
    words say is T2's to settle with the owner.
  - **A pull request opened is built from the declarations and the CLI's code** (the owner's
    call at T1). `gh pr create` reports `pr: { number, url, action: 'created' }` from the URL it
    prints, which `gh` prints to stdout either way; not measured live. Its live check goes in
    `docs/BACKLOG.md`, as T1's merged pull request did.
  - **The Bash hook's moments** are a list placed by `ranAt`; T2 adds `pr created` and
    `rebased`, each with a part rule (`gh pr create`, `git rebase`), as T1 added `cherry`,
    `merge` and `pr`.
  - **T1's review found the engine's report is per command, not per part.** It sets a kind from
    words anywhere in the command, reads the next word split at spaces alone, and takes the
    first matching line of the whole output. T1's moments therefore need their own part, take
    their words from it (`mergedName`), and check that the output has a line for each part
    (`madeBy`, the merge's `Fast-forward` count). A rebase's `ref` and a pull request's number
    deserve the same care.
  - `drawFx` reads `DRAWINGS`, a `Record<FxKind, Draw>`, so a new kind with no drawing fails
    `tsc`.
- **The every-tool `tool.call` hook is registered first,** and must stay first: it is the
  outermost, so the context check queues behind the call's own effect. One test guards it.
- **A queue timer goes through `later`,** which skips it after a reset; a new timer that moves
  the queue should too.
- **Review fixes wait for the owner's word.** After `/code-review`, report the findings and ask
  which to fix before any edit.
- **Push status.** `origin/main` holds everything through Q1's review commit. Waiting locally:
  - Q1's push-status handoff commit;
  - repo Session 3c's `feat: npm run new-mod makes a mod from the template` and its review
    commit, which are not this mod's;
  - T1's commit and its review commit.

  List `origin/main..HEAD` before any push, and name any commit that is not this mod's.
- **The owner installs once the round is done.** The installed release stays 0.11.1 while T2,
  C1 and A2 run (the owner's call, 2026-11-15): do not ask for `claude plugin update cartoon-fx`
  after each push. Every desktop check waits for that update and stays in `docs/BACKLOG.md`'s
  *Not yet checked by hand* until then, 0.12.0's and 0.13.0's included. A2 gathers them for the
  round's desktop check.
- **The owner's stored placement is `conversation`.**
- **The CLI on PATH is 2.1.325,** and so is the desktop's engine.
- **Baseline** (`docs/ARCHITECTURE.md`, v0.13.0, CLI 2.1.325):
  - 70 tests;
  - `validate`: 13 hooks, 5 gating (each with a `.catch`), 4 state keys, and no warning but the
    allowed `CLAUDE.md` one;
  - `tsc` and the import scan clean.
- **How earlier sessions checked things live, reusable here:**
  - **Opening prompt from a file.** A terminal check starts from the Terminal panel, from the
    repository's root: `claude --plugin-dir mods/cartoon-fx "$(cat <prompt file>)"`, with the
    prompt in the session's scratchpad. T1's prompt asked for exact commands, one Bash call
    each, in a scratch repository with a fictional git identity set in that repository alone.
    They ran without a permission prompt.
  - **Reading the strip.** `read_terminal` reads it. Read at least 9 lines, since the strip sits
    above the effort line, every 2 s from the start; closing the tab ends the session.
  - **T1's probe.** It was a second `tool.call` `{ tool: 'Bash' }` hook that added
    `PROBE gitOperation=<json>` to the command's stdout, so the session's own reply listed every
    report. It was removed before the commit; a probe never ships.
  - **The contact sheet** of frames: A1's and T1's done-notes. A Node script in the scratchpad
    imports `hooks/fx.ts` with a resolve hook for `./zones`, and the page is served on 127.0.0.1
    and opened in the browser pane.
  - **A desktop check** needs the owner to type `/fx`, with no dialog open over the conversation:
    pause, and let them run it.
- **Repo Session 4** repoints this mod's `CLAUDE.md` (the SPEC §8 pointer) and
  `docs/ARCHITECTURE.md` (*Testing strategy*) away from the root `docs/spec/SPEC.md`, in a
  `docs(cartoon-fx):` commit of its own. Leave those lines to it. Follow the root
  `docs/DEVELOPMENT-WORKFLOW.md` as it stands.

## Watch for

- **The standing traps** are in the root `CLAUDE.md` and this mod's `CLAUDE.md`, *Watch for*.
- **A new kind is a new name in `FxKind`, `FX_MS`, `DRAWINGS` and `SAMPLES`,** and a word the
  owner types after `/fx`: name it once, with the owner.
- **A pull request is an action on GitHub:** only with the owner's yes for that step, in the
  repository they name.

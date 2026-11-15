Read, in the order the root CLAUDE.md gives a mod session:
1. what C1's **Read** line names, in this mod's `docs/spec/`;
2. the root CLAUDE.md, then this mod's CLAUDE.md;
3. *The session cycle* in the root `docs/DEVELOPMENT-WORKFLOW.md`;
4. this mod's `docs/ARCHITECTURE.md`: its overview, invariants and baseline, and the sections
   the Read line names;
5. `docs/spec/SESSIONS.md`'s header, C1's block and T2's done-note;
6. this file.

Then do Session C1: `/fx off` and `on`, `/fx size`, and the terminal's row animated. Release
0.15.0.

## State you need that is not in the specs

- **Round 3 is fun, a queue, new moments and controls:** A1, D1, Q1, T1 and T2 are done; C1 and
  A2 remain.
- **The repo's round 1 closes after this round.** Its sessions are done, Session 4 included, and
  the owner holds its `docs: close round 1` until cartoon-fx's C1 and A2 are done. A2's handoff
  tells the owner the repo's close comes next, as the root `docs/next-session-prompt.md`
  describes. Carry this line in every later cartoon-fx handoff until then.
- **T2 shipped 0.14.0** (its done-note in `SESSIONS.md`): `rebase` (an arcade claw stacks the
  branch's blocks on the tower, "Rebased! topic onto main") and `pr` (a jack-in-the-box, "PR
  opened! #42"). `/fx all` plays fourteen, in the order plan, commit, cherry, rebase, push, pr,
  merge, tests, review, fixes, compact, helpers, context, redzone.
- **C1's ask on the store keys** names two new machine identifiers (mute and size), once, with
  the owner; they go in this mod's `CLAUDE.md`, *Machine identifiers*. `placement` and `fxTakes`
  are the owner's data and stay as they are.
- **Muting empties the queue** (C1's block). The queue is module memory in `hooks/register.tsx`:
  `line`, `onShow`, `isBusy`, and `reset()`, which also bumps `era` so timers set before it do
  nothing. `/fx`'s samples enter through `enter(…, isReplay: true)` and must still play while
  muted.
- **The size** changes `drawFx`'s `width`/`height` (`SCALE` 3.2 gives 832 × 608 today) and is read
  from the store on every play, as the placement is (`syncPlacement`). `svgOf` caches one drawing
  per effect id; a size change must not reuse a drawing made at another size.
- **The terminal's row** is drawn in the `AbovePrompt` hook from `random(effect.seed)`; the
  terminal test checks the glyphs are identical 900 ms later (invariant 3), which the animated row
  must keep true for one seed at one frame.
- **The every-tool `tool.call` hook is registered first,** and must stay first: it is the
  outermost, so the context check queues behind the call's own effect. One test guards it.
- **A queue timer goes through `later`,** which skips it after a reset; a new timer that moves
  the queue, or redraws the terminal's row, should too.
- **Review fixes wait for the owner's word.** After `/code-review`, report the findings and ask
  which to fix before any edit.
- **Push status.** T2's commits were pushed on 2026-11-15 with the owner's approval:
  `origin/main` holds everything through T2's review commit (`review(cartoon-fx): a dry run is
  read outside quoted words, and 6 smaller`). List `origin/main..HEAD` before any push, and name
  any commit that is not this mod's; parallel repo sessions share this checkout.
- **The owner installs once the round is done.** The installed release stays 0.11.1 while C1 and
  A2 run (the owner's call, 2026-11-15): do not ask for `claude plugin update cartoon-fx` after
  each push. Every desktop check waits for that update and stays in `docs/BACKLOG.md`'s *Not yet
  checked by hand* until then, 0.12.0's, 0.13.0's and 0.14.0's included. A2 gathers them for the
  round's desktop check.
- **The owner's stored placement is `conversation`.**
- **The CLI on PATH is 2.1.325,** and so is the desktop's engine.
- **Baseline** (`docs/ARCHITECTURE.md`, v0.14.0, CLI 2.1.325):
  - 75 tests;
  - `validate`: 13 hooks, 5 gating (each with a `.catch`), 4 state keys, and no warning but the
    allowed `CLAUDE.md` one;
  - `tsc` and the import scan clean.
- **How earlier sessions checked things live, reusable here:**
  - **Opening prompt from a file.** A terminal check starts from the Terminal panel, from the
    repository's root: `claude --plugin-dir mods/cartoon-fx "$(cat <prompt file>)"`, with the
    prompt in the session's scratchpad, or a slash command as the prompt
    (`claude --plugin-dir mods/cartoon-fx "/fx pr"`). The session cannot type into a running
    one, so a check of several slash commands runs one session each, or asks the owner to type
    them. A Bash prompt asks for exact commands, one Bash call each, in a scratch repository with
    a fictional git identity set in that repository alone. They ran without a permission prompt.
  - **Reading the strip.** `read_terminal` reads it. Read at least 9 lines, every 2 s from the
    start; an effect can play between reads, so run again for one missed. Closing the tab ends
    the session.
  - **The contact sheet** of frames: A1's and T2's done-notes. A Node script in the scratchpad
    imports a copy of `hooks/fx.ts` with a resolve hook for `./zones`, and the page is served on
    127.0.0.1 and opened in the browser pane. Port 8765 was taken by another process at T2; pick
    a free one. While the pane is hidden its screenshots lag a step: take one more.
  - **A desktop check** needs the owner to type `/fx`, with no dialog open over the conversation:
    pause, and let them run it.

## Watch for

- **The standing traps** are in the root `CLAUDE.md` and this mod's `CLAUDE.md`, *Watch for*.
- **The size defaults to `medium`,** so the owner's sessions shrink at 0.15.0 (decision 7): the
  changelog says so.
- **A missing or unknown stored value** falls back to on and `medium` (read forward-only).

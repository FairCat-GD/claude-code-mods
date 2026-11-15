Read, in the order the root CLAUDE.md gives a mod session:
1. what A2's **Read** line names, in this mod's `docs/spec/`;
2. the root CLAUDE.md, then this mod's CLAUDE.md;
3. *The session cycle* in the root `docs/DEVELOPMENT-WORKFLOW.md`;
4. this mod's `docs/ARCHITECTURE.md`: its overview, invariants and baseline, and the sections
   the Read line names;
5. `docs/spec/SESSIONS.md`'s header, A2's block and C1's done-note;
6. this file.

Then do Session A2: the fun pass over the drawings, the docs read cold, the release and the
close of round 3. The version is confirmed with the owner (decision 8; 0.16.0 proposed).

## State you need that is not in the specs

- **Round 3 is fun, a queue, new moments and controls:** A1, D1, Q1, T1, T2 and C1 are done; A2
  remains, and closes the round.
- **The repo's round 1 closes after this round.** Its sessions are done, Session 4 included, and
  the owner holds its `docs: close round 1` until cartoon-fx's A2 is done. A2's handoff tells the
  owner the repo's close comes next, as the root `docs/next-session-prompt.md` describes.
- **C1 shipped 0.15.0** (its done-note in `SESSIONS.md`): `/fx off` and `on` (store key
  `isMuted`), `/fx size small|medium|large` (store key `size`; `medium`, 546 × 399, is the
  default, so the owner's sessions shrink), and the terminal's row, whose sparks fly outward a
  frame every 250 ms. The structural checks hold at every size: only `width` and `height` change.
- **C1's review** (9 findings, all fixed) is in its done-note; the changelog links 0.15.0.
- **A redone drawing's frames at the three sizes:** the contact sheet draws at whatever size the
  page sets; the owner sees the drawings at `medium` from 0.15.0 unless they choose otherwise.
- **`/fx all` in a `--plugin-dir` session plays in that copy's store** (`cartoon-fx@inline`),
  which C1 left unmuted (`isMuted: false`). A check that plays nothing should first read
  whether a `/fx off` there is still in force.
- **Review fixes wait for the owner's word.** After `/code-review`, report the findings and ask
  which to fix before any edit.
- **Push status.** T2's commits were pushed on 2026-11-15 with the owner's approval:
  `origin/main` holds everything through T2's review commit. C1's commits are local until the
  owner approves a push. List `origin/main..HEAD` before any push, and name any commit that is
  not this mod's; parallel repo sessions share this checkout.
- **The owner installs once the round is done.** The installed release stays 0.11.1 until then
  (the owner's call, 2026-11-15): do not ask for `claude plugin update cartoon-fx` after each
  push. Every desktop check waits for that update and stays in `docs/BACKLOG.md`'s *Not yet
  checked by hand*, 0.12.0's to 0.15.0's included; A2 gathers them for the round's desktop check.
- **The owner's stored placement is `conversation`.**
- **The CLI on PATH is 2.1.325,** and so is the desktop's engine.
- **Baseline** (`docs/ARCHITECTURE.md`, v0.15.0, CLI 2.1.325):
  - 83 tests;
  - `validate`: 13 hooks, 5 gating (each with a `.catch`), 4 state keys, and no warning but the
    allowed `CLAUDE.md` one;
  - `tsc` and the import scan clean.
- **How earlier sessions checked things live, reusable here:**
  - **Opening prompt from a file.** A terminal check starts from the Terminal panel, from the
    repository's root: `claude --plugin-dir mods/cartoon-fx "$(cat <prompt file>)"`, with the
    prompt in the session's scratchpad, or a slash command as the prompt
    (`claude --plugin-dir mods/cartoon-fx "/fx all"`). The session cannot type into a running
    one, so a check of several slash commands runs one session each, or asks the owner to type
    them. A Bash prompt asks for exact commands, one Bash call each, in a scratch repository with
    a fictional git identity set in that repository alone. They ran without a permission prompt.
  - **Reading the strip.** `read_terminal` reads it. Read at least 9 lines, every second from
    the start (every 2 s missed a whole commit once at C1); an effect can play between reads, so
    run again for one missed. Closing the tab ends the session.
  - **The contact sheet** of frames: A1's and T2's done-notes. A Node script in the scratchpad
    imports a copy of `hooks/fx.ts` with a resolve hook for `./zones`, and the page is served on
    127.0.0.1 and opened in the browser pane. Pick a free port. While the pane is hidden its
    screenshots lag a step: take one more.
  - **A live preview in plan mode.** C1 showed the owner three terminal-row variants as a looping
    inline widget (the visualize tool), each on a dark and a light terminal, with a rate picker;
    the owner picked from it. It suits a design question that is about motion.
  - **A desktop check** needs the owner to type `/fx`, with no dialog open over the conversation:
    pause, and let them run it.

## Watch for

- **The standing traps** are in the root `CLAUDE.md` and this mod's `CLAUDE.md`, *Watch for*.
- **The close deletes this folder's spec files** in its own `docs(cartoon-fx): close round 3`
  commit, after the review, and moves anything still open to `docs/BACKLOG.md`.

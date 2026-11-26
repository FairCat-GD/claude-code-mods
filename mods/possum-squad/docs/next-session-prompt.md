Read what Session 13's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 13's block and Session 12d's done-note, then this
file, and do Session 13: the documentation pass and the close of round 1. Its Read line is
everything: `SPEC.md`, `PDD.md`, `ARCHITECTURE.md` whole, `docs/BACKLOG.md`, every done-note.
Its block carries amendments from the review of its plan (2026-11-25): the look from the
installed 1.0.0 before the close, the ids table, the grep before the release commit, the doc
checks no test makes, H1 to H6, the changelog's link references.

Release 1.0.0, tagged `possum-squad-v1.0.0` only on the owner's yes.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–12, 7a, 9a and 12a–12d are done; 13 remains, then
  1.0.0 (the header of `SESSIONS.md`, and `SPEC.md` decision 1's amendment).
- **Push status:** pushed on 2026-11-26 with the owner's approval: `origin/main` holds
  everything through `review(possum-squad): a stale tab title never mended, and 6 smaller`,
  Session 12d's review, with 0.17.0 before it. Nothing waits locally. List `origin/main..HEAD`
  before any push, and name any commit that is not the session's.
- **What 12d left for the cold read:**
  - `runs` is `runs-10` (`Run.failure`); `lead` is `lead-2`; `view` is `view-5`. The mod's
    `CLAUDE.md` names each tag.
  - The tab title's guard and its leftover race are in *Attention* and *Known debt*; `detect`'s
    limits (five kept calls, a shell call's first line) are in *Roles* and *Known debt*.
  - `validate`'s calls line now holds `$.store.delete`; the README states no calls line yet,
    which Session 13 adds (N-08).
- **Open looks in the desktop app:** 12b's `peek` in reach (`minWidth` 0, which the kit cannot
  judge), 12c's moving session line, and 12d's tab title and Detect (`docs/BACKLOG.md`). Only the
  owner's look after a push confirms them; Session 13's amended order puts that look before the
  close.
- **Drift the review of Session 13's plan spotted, for its cold read:** Session 12's done-note
  says 87% of the characters, where *The panel* and *Known debt* now say 89% (12b's longer line
  3); one line gives 225,793 characters where another gives 227,422; *Known debt* still calls
  the sprites unseen in the desktop app.
- **The engines:** CLI 2.1.330; the desktop app ran engine 2.1.330 on 2026-11-23, the last
  reading.
- **Baseline** (ARCHITECTURE's table, v0.17.0, CLI 2.1.330): 361 tests in 27 files, about 19 s;
  the tools' specs 10 in 2; `validate` 11 hooks, 4 gating each with a `.catch`, 3 state keys,
  the calls line with `$.store.delete`.

## Watch for

- **Drive hand checks yourself,** in `screen -U` from the repository's root. At 12d a detached
  session took no keys until it was attached in a Terminal-panel tab (`screen -U -r <name>`) and
  read from there; the mod's `CLAUDE.md`, *Watch for*, has the rest.
  - To wait, run a foreground `ping -c <seconds> 127.0.0.1`, or wait on a process; the harness
    blocks `sleep`.
  - Never allow a permission prompt in a hand check: refuse it, which moves the call on too.
  - A text read does not show which element holds a pane's keys: never guess a press that
    could land on a button writing the store.
- **The look from the installed 1.0.0 changes the owner's setup** (invariant 7): ask before the
  update, and show it.
- **The `@inline` copy keeps its own store,** its `theme` `horror`, `cost` `off`, `toasts`
  unset: ask before a check changes any of it, and put back what it changes.
- **A check that builds its expectation from the module it checks cannot fail:** state each
  expectation in the test, and falsify each new check.
- **`biome check --write` sorts imports in files you did not touch:** use `biome format --write`
  and `biome lint`, as the root CLAUDE.md says.

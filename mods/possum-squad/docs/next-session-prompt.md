Read what Session 13's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names (everything:
`SPEC.md`, `PDD.md`, `ARCHITECTURE.md` whole, `docs/BACKLOG.md`, every done-note), the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
the header of mods/possum-squad/docs/spec/SESSIONS.md, Session 13's block and Session 12's
done-note, then this file, and do Session 13: the documentation pass and the close.

Session 13 covers:
- `ARCHITECTURE.md` read cold against the code: every Built part true, the baseline current;
- `USER-GUIDE.md`, the README (what the mod does, install, commands, `validate`'s calls line
  and the tested Claude Code versions, N-08), and `CLAUDE.md` pointing at both;
- the name check (no other mod named Possum Squad or using `/possums`), by the user;
- anything open moved to `docs/BACKLOG.md`: unchecked by-hand items, H1's outcome, cuts;
- the user's check by hand from the installed 1.0.0, in the desktop app and the terminal.

Release 1.0.0. After the review: the `review(possum-squad):` commit, then the separate
`docs(possum-squad): close round 1` commit, which deletes `docs/spec/`'s files and puts the
review commit's sha in the handoff. The tag `possum-squad-v1.0.0` only on the user's yes, as the
chat's last act.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–12, 7a and 9a are done; Session 13 remains.
- **Push status:** `origin/main` holds everything through Session 11's review commit, 0.12.0
  among it. Session 12's commits (0.13.0, and its review's) are local until the user approves a
  push. List `origin/main..HEAD` before any push, and name any commit that is not the
  session's.
- **The desktop app has seen nothing since 0.11.0 by record:** 0.12.0's install was planned
  after its push, and no look at Peek, the collapsed view, the `widget` seat, the limits, the
  estimate or helpers is recorded (`docs/BACKLOG.md`, *Not yet checked by hand*). Session 11's
  *Confirms* (the `widget` seat draws the collapsed view) waits for that look. Each update
  changes the user's setup, so ask first.
- **The desktop's bound** (*Context* in ARCHITECTURE): fewer than 2,000 nodes, 32 levels and
  262,144 characters. The fullest list, with Peek, every helper nested at its deepest, four
  limits and the estimate, is at 1,845 nodes, 8 deep and 227,422 characters (92% and 87%).
- **What Session 12 left:**
  - **`runs` is `runs-7`, `lead` is `lead-2`, `view` is `view-5`.**
  - **The price table** (`hooks/data/prices.ts`) was read from the published pricing page on
    2026-11-25; it dates, and the docs say so. The engine's own ledger is not read (the user's
    choice at Session 12's plan).
  - **Helpers under a live parent are rare in this build:** a subagent's own Agent call runs in
    the background, so the parent reads finished while its helper works (`docs/BACKLOG.md`,
    *Deferred*, the background-work item, extended at Session 12).
- **The engines:** CLI 2.1.330, which laid every folder's declarations. The desktop app ran
  engine 2.1.330 on 2026-11-23.
- **For the user to decide, when they choose** (each in `docs/BACKLOG.md`, *Deferred*):
  - an agent waiting on its own background work, a shell or a helper, reads "finished";
  - forgetting a remembered role;
  - a long path cut from its start, losing its file name, on the activity line and in Peek's
    last actions.
- **Baseline** (ARCHITECTURE's table, v0.13.0, CLI 2.1.330): see the table; `validate` is
  unchanged at 11 hooks, 4 gating each with a `.catch`, 3 state keys, and the same calls line.

## Watch for

- **Drive hand checks yourself:** `screen -U -dmS <name> env -u CLAUDE_CODE_PLUGIN_DIRS claude
  --plugin-dir mods/possum-squad`, attached in a Terminal-panel tab with `screen -U -r <name>`
  (mods/possum-squad/CLAUDE.md, *Watch for*).
  - Type with `-X stuff $'…\r'`; a prompt needs a second `\r`, and `$'\025'` clears a
    suggested prompt first.
  - The docked pane is as tall as the tab: past a few rows the rest are cut off. `/clear`
    starts the list over when a check needs its rows in view.
  - A subagent asked for a helper may do the work itself instead; asking it to make the Agent
    call its first action got one.
- **The `@inline` copy keeps its own store,** and its `theme` is `horror`, `cost` `off`: put
  back anything a check changes, `collapsed` and `cost` included.
- **The sprite frame check is the slow test** (about 7 s, given `timeoutMs: 30_000`).
- **A check that builds its expectation from the module it checks cannot fail:** state each
  expectation in the test (dollars as millionths, stated by hand), and falsify each new check.
- **The kit draws the desktop's bar as its labelled figure over the figure alone,** and a
  `Box`'s text holds its children's: count `Text` elements, and leave out the labelled copy.

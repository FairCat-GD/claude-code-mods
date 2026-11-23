Read what Session 10's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 10's block and Session 9's done-note, then this
file, and do Session 10: attention.

Session 10 covers:
- Needs you, from `classic.PermissionRequest` by `agent_id`, until that agent's next step or its
  end;
- gone quiet after T-05 with no call in flight;
- toasts while the pane is closed.

Release 0.11.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–9 and 7a are done; Sessions 10–13 remain. 10
  releases 0.11.0.
- **Push status:** `origin/main` holds everything through Session 7a's review commit. Session 9's
  commits wait locally unless the user approved their push. List `origin/main..HEAD` before
  any push, and name any commit that is not the session's.
- **Nothing desktop has been seen since 0.6.0** (`docs/BACKLOG.md`, *Not yet checked by hand*):
  0.7.0 to 0.10.0 wait for the owner's look.
  - A session cannot look for them: computer use never grants control of, or a picture of,
    Claude's own window. Ask at the start whether the owner has looked, and record it.
  - If the gallery's 102 moving sprites are not smooth, that choice returns to the owner.
- **H1's week of use starts after Session 9's push:** each time the owner presses a role's
  name and picks, that is a miss. No counter is stored.
- **What Session 9 left for Session 10:**
  - **The states are wired:** a row draws whatever state its run is in. `needs-you` and `quiet`
    are reached by no event yet. Their F-08 check draws them through `panel` from fixture rows;
    Session 10's events should reach them in a kit test too.
  - **Toasts need `$.ui.toast`,** on the allow-list but not yet among `validate`'s calls: the
    calls line changes, which the done-note records (I-02).
  - **"While the pane is closed"** is the module's `isPaneOpen`, or `$.ui.panes()`. An event
    hook may not await the panes (N-07), so a toast decided in a hook needs the same unawaited
    shape as `autoOpen` in `hooks/register.tsx`.
  - **The kit's `$` has no `ui.close`:** a close by the person is tested through the mod's own
    hooks over a stand-in `$` (`tests/auto-open.test.ts`, `tests/panel.test.ts`).
  - **A pick is `source: 'manual'`,** and nothing else changes a role once settled (I-07).
- **The engines:** CLI 2.1.330, which laid every folder's declarations. The desktop app ran
  engine 2.1.326 on 2026-11-20.
- **For the user to decide, when they choose:**
  - a subagent waiting on its own background shell reads "finished" (`docs/BACKLOG.md`,
    *Deferred*);
  - forgetting a remembered role (`docs/BACKLOG.md`, *Deferred*).
- **Baseline** (ARCHITECTURE's table, v0.10.0, CLI 2.1.330):
  - 192 tests in 18 files, about 13 s, and 10 tool specs in 2 files;
  - `validate`: 11 hooks, 4 gating each with a `.catch`, 3 state keys;
  - calls: `$.clock.every`, `$.clock.now`, `$.command.register`, `$.state.get`, `$.state.set`,
    `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.invalidate`, `$.ui.open`, `$.ui.panes`,
    `$.ui.resolve`.

## Watch for

- **Drive hand checks yourself:** `screen -U -dmS <name> env -u CLAUDE_CODE_PLUGIN_DIRS claude
  --plugin-dir mods/possum-squad`, attached in a Terminal-panel tab with `screen -U -r <name>`
  (mods/possum-squad/CLAUDE.md, *Watch for*).
  - Type with `-X stuff $'…\r'`: the `$'…'` quoting is what makes `\r` an Enter, and a prompt
    may need a second `\r`.
  - The Terminal-panel tab was 120 columns: an unasked open needs 144, or 110 once `/possums`
    has opened the pane, so open and hide it first.
  - A pane's `Button` could not be focused that way.
- **A permission prompt inside a subagent** is what Session 10's hand check needs. The
  `@inline` copy runs in auto mode in a `screen` session started this way, so pick a call auto
  mode asks about, or ask the user to raise one.
- **The `@inline` copy keeps its own store,** and its `theme` is `horror`: a terminal check
  reads that set, not `classic`. Put back anything a check changes.
- **The sprite frame check is the slow test** (about 7 s, given `timeoutMs: 30_000`): a new
  look multiplies it; keep its reader's memos (`rectanglesOf`, `faintness`).
- **A check that builds its expectation from the module it checks cannot fail:** state each
  expectation in the test, and falsify each new check.

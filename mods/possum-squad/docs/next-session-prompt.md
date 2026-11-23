Read what Session 10's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 10's block and Session 9a's done-note, then this
file, and do Session 10: attention.

Session 10 covers:
- Needs you, from `classic.PermissionRequest` to the asking agent's next step or end;
- gone quiet after T-05 with no call in flight;
- toasts while the pane is closed.

Release 0.11.0. Session 11 (Peek and the collapsed view, 0.12.0) follows it.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–9, 7a and 9a are done; Sessions 10–13 remain.
- **Push status:** pushed on 2026-11-23 with the user's approval: `origin/main` holds everything
  through Session 9a's review commit, 0.10.1 among it. Nothing waits locally. List
  `origin/main..HEAD` before any push, and name any commit that is not the session's.
- **0.10.1 is installed** (`claude plugin update possum-squad`, with the user's OK), and the
  owner saw the gallery's parts draw on the desktop. The desktop runs the installed release
  only; each later update changes the owner's setup, so ask first.
- **The desktop's bound** (*Context* in ARCHITECTURE, read from the app's own code, app
  6.28899.6):
  - a pane's answer draws only with fewer than 2,000 nodes, 32 levels and 262,144 characters by
    its count;
  - past it the app drops the answer silently and keeps the last tree;
  - `tests/size.ts` ports the count, and `tests/size.test.ts` holds the gallery's parts and the
    fullest list (60 rows) under it.

  Anything Session 10 adds to a row (the needs-you sign is a sprite; a row line) moves those
  numbers: the fullest list is at 1,613 nodes and 218,861 characters now. The budget is fitted
  on each row's steady look, and moments play after it (`withMoments`).
- **Testing the desktop:** a session cannot see it (computer use refuses Claude's own window).
  - The owner looks at a chat's pane while the session starts agents and the owner types the
    `/possums` commands. The agents are general-purpose, `haiku`, each running
    `ping -c 300 127.0.0.1 > /dev/null` in the foreground, about 67k tokens each.
  - The desktop runs the installed release only, so every check there needs a push and
    `claude plugin update possum-squad`, each with the owner's OK.
  - A `ping` moves to the background after about two minutes, ending that agent's turn.
- **H1's week of use starts once 0.10.x is installed:** each time the owner presses a role's
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
  - **The kit's `$` has no `ui.close` and no `state`:** a close by the person is tested through
    the mod's own hooks over a stand-in `$` (`tests/auto-open.test.ts`, `tests/panel.test.ts`).
  - **A pick is `source: 'manual'`,** and nothing else changes a role once settled (I-07).
- **The engines:** CLI 2.1.330, which laid every folder's declarations. The desktop app ran
  engine 2.1.330 on 2026-11-23.
- **For the user to decide, when they choose:**
  - a subagent waiting on its own background shell reads "finished" (`docs/BACKLOG.md`,
    *Deferred*);
  - forgetting a remembered role (`docs/BACKLOG.md`, *Deferred*).
- **Baseline** (ARCHITECTURE's table, v0.10.1, CLI 2.1.330):
  - 209 tests in 19 files, about 13 s, and 10 tool specs in 2 files;
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
  - A pane's `Button` can be pressed that way (9a): ctrl+x (`$'\030'`), then tab until the
    button has the focus, then Enter; escape returns the focus.
- **A permission prompt inside a subagent** is what this session's hand check needs. The
  `@inline` copy runs in auto mode in a `screen` session started this way, so pick a call auto
  mode asks about, or ask the user to raise one.
- **The `@inline` copy keeps its own store,** and its `theme` is `horror`: a terminal check
  reads that set, not `classic`. Put back anything a check changes.
- **The sprite frame check is the slow test** (about 7 s, given `timeoutMs: 30_000`): a new
  look multiplies it; keep its reader's memos (`rectanglesOf`, `faintness`).
- **A check that builds its expectation from the module it checks cannot fail:** state each
  expectation in the test, and falsify each new check.
- **Some classic costumes share their role's name** (Builder, Bug catcher, Helper): a test
  that finds role names by text must tell them apart by element, as `tests/gallery.test.ts`
  does.

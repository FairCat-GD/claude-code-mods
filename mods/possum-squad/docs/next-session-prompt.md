Read what Session 9a's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 9a's block and Session 9's done-note, then this
file, and do Session 9a: the gallery within what the desktop draws.

Session 9a covers:
- finding the limit the desktop holds a pane's tree to;
- the gallery drawn in parts within it, and the rows within it if it binds them;
- a size test in the kit.

Release 0.10.1. Session 10 (attention, 0.11.0) follows it.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–9 and 7a are done; Sessions 9a and 10–13 remain.
  9a was added after Session 9's commit, with the owner; it releases 0.10.1.
- **Push status:** pushed on 2026-11-23 with the user's approval: `origin/main` holds everything
  through Session 9's review commit, 0.10.0 among it. Nothing waits locally. List
  `origin/main..HEAD` before any push, and name any commit that is not the session's.
- **0.10.0 is not installed yet:** `claude plugin update possum-squad` changes the owner's
  setup, so ask first; the desktop runs the installed release only.
- **What the desktop showed** (Session 9's done-note, installed 0.9.0):
  - fourteen working rows drew, about 118k of tree by the kit's measure, each opossum moving;
  - `/possums roles` drew nothing, with `motion` `auto` (about 945k, 137 sprites, 102 framed)
    or `off` (389k, none framed). The app keeps the last tree it drew, and the gallery flag
    makes every drawing the gallery, so the pane looks frozen until it is closed;
  - so the limit lies between: total size, sprite count, or framed count. The declared bound,
    "20,000 nodes, 32 deep, 100,000 characters serialized" (`ClientElements` in the
    declarations), did not stop 118k;
  - the kit measures a tree as `JSON.stringify(await pane.drawn())`: each working row adds about
    8k, the empty pane about 9k.
- **Testing the desktop:** a session cannot see it (computer use refuses Claude's own window).
  The owner looks at a chat's pane while the session starts agents (general-purpose, `haiku`,
  each running `ping -c 300 127.0.0.1 > /dev/null` in the foreground, about 67k tokens each)
  and the owner types the `/possums` commands. The desktop runs the installed release only, so
  every probe there needs a push and `claude plugin update possum-squad`, each with the
  owner's OK. A `ping` moves to the background after about two minutes, ending that agent's
  turn.
- **H1's week of use starts after Session 9's push:** each time the owner presses a role's
  name and picks, that is a miss. No counter is stored.
- **What Session 9 left for Session 10** (after 9a):
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
  - 197 tests in 18 files, about 13 s, and 10 tool specs in 2 files;
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

Read what Session 11's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 11's block and Session 10's done-note, then this
file, and do Session 11: Peek and the collapsed view.

Session 11 covers:
- Peek: a row press toggles it (`view`); the brief, the last actions, files touched, the
  answer's start, all plain text;
- the collapsed view: the header's button (`prefs.collapsed`), the Lead with joeys and a
  numeral, the needs-you mark, drawn in the `widget` seat too.

Release 0.12.0. Session 12 (plan limits, the cost estimate, nested helpers, 0.13.0) follows it.
Ask at its start whether the owner has redrawn the joey (the block's *Ask at the start*).

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–10, 7a and 9a are done; Sessions 11–13 remain.
- **Push status:** pushed on 2026-11-23 with the user's approval: `origin/main` holds
  everything through Session 10's review commit, 0.11.0 among it. Nothing waits locally but
  what a later commit records. List `origin/main..HEAD` before any push, and name any commit
  that is not the session's.
- **0.11.0 is installed** (`claude plugin update possum-squad`, with the user's OK), and the
  owner saw Needs you and its toast in the desktop app (Session 10's done-note). The desktop
  runs the installed release only; each later update changes the owner's setup, so ask first.
- **Session 10's last commit records that check,** a docs commit made after the push: it waits
  locally until the next approved push.
- **The desktop's bound** (*Context* in ARCHITECTURE, read from the app's own code, app
  6.28899.6): a pane's answer draws only with fewer than 2,000 nodes, 32 levels and 262,144
  characters by its count; past it the app drops the answer silently and keeps the last tree.
  `tests/size.ts` ports the count. The fullest list is at 1,613 nodes and 218,861 characters;
  Session 10 added nothing to a row. Peek adds lines under a row: hold the size test to the
  fullest list with a Peek open.
- **Testing the desktop:** a session cannot see it (computer use refuses Claude's own window).
  The owner looks at a chat's pane while the session starts agents. The desktop runs the
  installed release only, so every check there needs a push and an update, each with the
  owner's OK.
- **What Session 10 left for Session 11:**
  - **Needs you is a stored state** (`needs-you`, with its `ask`), so the collapsed view's
    mark reads it from `runs`. **Quiet is not stored:** `quietMs(run, now)` in
    `hooks/model/runs.ts` works it out where a row is drawn.
  - **`runs` is `runs-5`.** Peek's last actions, files and answer are new `Run` fields: the tag
    moves again, and `view` gains Peek's run (`view-5`).
  - **A step's record comes after the engine has checked its calls** (*Context*, Session 10):
    don't read a step's end as "its calls have not started".
  - **The toasts** are `toastUnseen` and `hooks/view/toasts.ts`; a toast names a run by its
    cut description (I-04, widened at Session 10's plan).
  - **The kit raises `classic.PermissionRequest`** from `$.tool.call({ …, agentId })` with a
    `tool.check` stand-in answering `ask` (`tests/attention.test.ts`).
- **The engines:** CLI 2.1.330, which laid every folder's declarations. The desktop app ran
  engine 2.1.330 on 2026-11-23.
- **For the user to decide, when they choose:**
  - a subagent waiting on its own background shell reads "finished" (`docs/BACKLOG.md`,
    *Deferred*);
  - forgetting a remembered role (`docs/BACKLOG.md`, *Deferred*).
- **Baseline** (ARCHITECTURE's table, v0.11.0, CLI 2.1.330):
  - 232 tests in 20 files, about 14 s, and 10 tool specs in 2 files;
  - `validate`: 11 hooks, 4 gating each with a `.catch`, 3 state keys;
  - calls: `$.clock.every`, `$.clock.now`, `$.command.register`, `$.state.get`, `$.state.set`,
    `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.invalidate`, `$.ui.open`, `$.ui.panes`,
    `$.ui.resolve`, `$.ui.toast`.

## Watch for

- **Drive hand checks yourself:** `screen -U -dmS <name> env -u CLAUDE_CODE_PLUGIN_DIRS claude
  --plugin-dir mods/possum-squad`, attached in a Terminal-panel tab with `screen -U -r <name>`
  (mods/possum-squad/CLAUDE.md, *Watch for*).
  - Type with `-X stuff $'…\r'`; a prompt needs a second `\r`, and `$'\025'` clears a
    suggested prompt first.
  - Add `--permission-mode default` when the check needs a subagent's call to ask.
  - A toast lasts 4 s: catch it with a background loop of `-X hardcopy` while the tab is
    attached, grepping `-a -A3` for the `possum-squad` box (a toast wraps across lines).
  - A pane's `Button` can be pressed: ctrl+x (`$'\030'`), then tab to it, then Enter.
- **A scratch probe plugin** in the scratchpad, loaded with a second `--plugin-dir`, can toast
  what events carry; `$.ui.toast`'s `timeoutMs` is at most 60,000, or the toast is dropped.
- **The `@inline` copy keeps its own store,** and its `theme` is `horror`: a terminal check
  reads that set, not `classic`. Put back anything a check changes.
- **The sprite frame check is the slow test** (about 7 s, given `timeoutMs: 30_000`): a new
  look multiplies it; keep its reader's memos (`rectanglesOf`, `faintness`).
- **A new row's sprite names `starting` in its alt during its arrival:** a test reading alts
  moves the clock past it first (`ARRIVED` in `tests/attention.test.ts`).
- **A check that builds its expectation from the module it checks cannot fail:** state each
  expectation in the test, and falsify each new check.

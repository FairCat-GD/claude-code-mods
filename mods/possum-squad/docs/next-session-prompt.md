Read what Session 12's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 12's block and Session 11's done-note, then this
file, and do Session 12: limits, the cost estimate and nested helpers.

Session 12 covers:
- the plan limits in the header, from `session.measure`;
- the estimate: `hooks/data/`'s dated price table (T-12), "est." on rows and header with `cost`
  at `estimate`, no currency sign with it `off`;
- nested helpers: a spawn whose `parentAgentId` names a known run is drawn under it, its totals
  rolled up.

Release 0.13.0. Session 13 (the documentation pass and the close, 1.0.0) follows it.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–11, 7a and 9a are done; Sessions 12 and 13
  remain.
- **Push status:** `origin/main` holds everything through Session 10's review commit. Waiting
  locally: Session 10's docs commit (the desktop check), and Session 11's commits. Nothing is
  pushed without the user's OK; list `origin/main..HEAD` before any push, and name any commit
  that is not the session's.
- **0.11.0 is installed;** 0.12.0 is not. The desktop runs the installed release only, so
  Peek, the collapsed view and the minimized pane are unseen there until a push and
  `claude plugin update possum-squad`, each with the user's OK (`docs/BACKLOG.md`, *Not yet
  checked by hand*). Session 11's *Confirms* (the `widget` seat draws the collapsed view) waits
  for that look.
- **The desktop's bound** (*Context* in ARCHITECTURE): fewer than 2,000 nodes, 32 levels and
  262,144 characters. The fullest list, with a Peek open at its longest, is at 1,845 nodes and
  225,783 characters (92% and 86%). A row is now 28 to 31 nodes. Nesting draws rows under rows
  and the header gains the limits and the estimate: hold `tests/size.test.ts` to the fullest
  list with nesting at its deepest, and stop and ask before cutting `ROWS_DRAWN` if it passes.
- **What Session 11 left for Session 12:**
  - **`runs` is `runs-6`, `view` is `view-5`.** A run's new fields move the `runs` tag again.
    `Run.parentId` is already kept from the spawn's `parentAgentId`.
  - **The header** is `lead.tsx`'s Lead row, then a row `Box`: `sessionLine` and the `collapse`
    button. The limits and the estimate go into that line or beside it.
  - **The collapsed view counts** the Running section (`countsOf` in `hooks/view/panel.tsx`);
    a nested helper there counts as its own agent unless the session decides otherwise.
  - **Peek's record** keeps a brief, five actions, ten files and an answer per run (*The run
    model*, *Peek's record*); a roll-up of totals reads tokens and time, never these.
- **The engines:** CLI 2.1.330, which laid every folder's declarations. The desktop app ran
  engine 2.1.330 on 2026-11-23.
- **For the user to decide, when they choose:**
  - a subagent waiting on its own background shell reads "finished" (`docs/BACKLOG.md`,
    *Deferred*);
  - forgetting a remembered role (`docs/BACKLOG.md`, *Deferred*);
  - a long path cut from its start, losing its file name, on the activity line and in Peek
    (`docs/BACKLOG.md`, *Deferred*), seen at Session 11's hand check.
- **Baseline** (ARCHITECTURE's table, v0.12.0, CLI 2.1.330): see the table; `validate` is
  unchanged at 11 hooks, 4 gating each with a `.catch`, 3 state keys, and the same calls line.

## Watch for

- **Drive hand checks yourself:** `screen -U -dmS <name> env -u CLAUDE_CODE_PLUGIN_DIRS claude
  --plugin-dir mods/possum-squad`, attached in a Terminal-panel tab with `screen -U -r <name>`
  (mods/possum-squad/CLAUDE.md, *Watch for*).
  - Type with `-X stuff $'…\r'`; a prompt needs a second `\r`, and `$'\025'` clears a
    suggested prompt first.
  - A pane's `Button` can be pressed: ctrl+x (`$'\030'`), then tab to it, then Enter. Each
    row now has two buttons (its role and `peek`), and the header one (`collapse`).
- **The `@inline` copy keeps its own store,** and its `theme` is `horror`: a terminal check
  reads that set, not `classic`. Put back anything a check changes, `collapsed` included.
- **The sprite frame check is the slow test** (about 7 s, given `timeoutMs: 30_000`): a new
  look multiplies it; keep its reader's memos (`rectanglesOf`, `faintness`).
- **A check that builds its expectation from the module it checks cannot fail:** state each
  expectation in the test, and falsify each new check.
- **A test that takes "the first Button" breaks when a button is added before it:** find a
  button by its `key`.

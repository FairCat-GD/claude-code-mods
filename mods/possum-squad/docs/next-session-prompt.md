Read what Session 5's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md, Session 5's block and Session 4's done-note, then this
file, and do Session 5: the Lead, header and sections.

Session 5 covers:
- the Lead, from `session.measure` and `$.session.usage()`, and `lead` in `types/index.d.ts`;
- the header, the sections in order, Finished collapsed with its show button;
- the one-second clock;
- the terminal complete.

Release 0.5.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Sessions 0–4 are done; Sessions 5–13 and 7a remain.
- **Push status:** `origin/main` holds everything through Session 3's review commit. Session
  4's commits wait locally until the user approves a push. List `origin/main..HEAD` before any
  push, and name any commit that is not the session's. Ask whether the user has installed
  0.4.0.
- **The engines:** the CLI is 2.1.329, and every folder's declarations were laid by it. The
  desktop app ran engine 2.1.326 on 2026-11-20. The CLI updated itself twice in one
  `npm run types`; run it again until it says the declarations match.
- **What Session 4 left for Session 5:**
  - **Time moves only on redraws.** A row's time is `(endedAt ?? now) − startedAt`, drawn with
    `$.clock.now()`, so it moves only when an event writes `runs`. The one-second clock is
    yours; it reads the same figures.
  - **One list.** `hooks/view/runs.tsx`'s `runsPanel` draws every run, oldest first, in one
    column, with no section heading. Sections and Finished's collapse replace it.
  - **The window table** (`hooks/data/models.ts`) has Haiku, Opus and Sonnet 5.5 at 1,000,000,
    the same as the main session's `session.measure` window. Read the Lead's window from
    `session.measure`, not the table.
  - **`$.store` is not reactive.** The first session that draws from `prefs` (Finished's
    show button, `prefs.finishedOpen`) also calls `$.ui.invalidate` after a `set`;
    `$.ui.invalidate` is on *Reach*'s list but not yet in the calls.
  - **Main-loop events make no `$` call.** `turn.start`, `turn.step` and `turn.complete` return
    before recording anything without `agentId`. The Lead's numbers come from `session.measure`,
    as the block says, so keep it that way: each main-session request would otherwise wait on a
    state write.
- **What the user should hear first:**
  - **cartoon-fx hooks `tool.call` for every tool** (`mods/cartoon-fx/hooks/register.tsx`). The
    declarations say that turns off a tool's move to the background; Session 4's probe saw a Bash
    command move anyway on 2.1.329, so the cost is unseen for Bash and untried for served calls.
    It is cartoon-fx's to weigh, in its own session; this mod's sessions never edit it.
  - **The 0.3.0 changelog's line on the background** ("earlier versions turned both off") was
    corrected in 0.4.0's entry, under *Changed*.
- **Decisions written down nowhere else:**
  - Whether `/possums` opening the pane again should clear `view.isClosedByPerson` is still
    undecided: today the flag stays set for the session. It matters at Session 9 (auto-open).
- **The repo-level round for `tools/`** (`SPEC.md` decision 9) is still the user's to open, in
  its own chat, before Session 6; no repo-level file records it. Its request, ready to give
  that intake:

  > The gate must take a mod's `tools/` folder: Node scripts run by hand, never loaded by the
  > engine. The import scan should allow `node:` imports there and refuse any import of
  > `tools/` from `hooks/` or `tests/`; `tools/` should be type-checked against Node's types;
  > and the round should say how a tool's own behaviour is tested. possum-squad's sprite
  > converter is the first user.

  If it is not committed when Session 6 opens, Session 8 runs first, logged as an amendment.
- **Baseline** (ARCHITECTURE's table, v0.4.0):
  - 64 tests in 7 files;
  - `validate`: 11 hooks, 4 gating each with a `.catch`, 2 state keys;
  - calls: `$.clock.now`, `$.command.register`, `$.state.get`, `$.state.set`, `$.store.get`,
    `$.store.set`, `$.ui.close`, `$.ui.open`, `$.ui.panes`, `$.ui.resolve`.

  Session 5 adds `lead` as a state key, and likely `$.session.usage`, `$.clock.every` and
  `$.ui.invalidate` to the calls.

## Watch for

- **A probe for the desktop needs another route.** `CLAUDE_CODE_PLUGIN_DIRS` in the user
  settings loaded nothing into a desktop Code session (engine 2.1.326). The desktop runs only
  the installed release; plan desktop checks for after a push.
- **A slash command sent from one session to another arrives as text,** not as a command. A
  hand check that needs `/possums` or a probe's command needs the user at the prompt.
- **The Terminal panel keeps only a screen of a fullscreen session.** Read a hand check's
  output from its transcript under `~/.claude/projects/`, by the session's id.

# The session plan: round 2, the code-review effects that never show

One chat per session. Never run two sessions in one chat: the point of the split is that no
session inherits stale context.

- **Scope** lives here, fixed in advance. The request and its resolved decisions are in
  `FEATURE-review-effects.md` beside this file, which is read-only; do not re-litigate them. If a
  session finds a block wrong, it amends the block and records the reason both in the block and in
  `docs/next-session-prompt.md`.
- **State** is `CHANGELOG.md` (what shipped) and `docs/next-session-prompt.md` (what the next
  session needs that the docs do not say). Every session rewrites the prompt as its last act.
- **When this round closes,** C1 deletes this file and `FEATURE-review-effects.md`. Git history
  keeps them, and anything left open moves to `docs/BACKLOG.md`.

**Before starting**, confirm that this mod's folder and the shared files a mod session may touch
have no uncommitted changes. Confirm too that `docs/next-session-prompt.md` names the session you
are about to do. **Read order:** `FEATURE-review-effects.md`, the root `CLAUDE.md`, this mod's
`CLAUDE.md`, `docs/ARCHITECTURE.md`, then the prompt. **Then plan, in plan mode,** and ask the
block's *Ask at the start* questions before any edit.

**Every session ends the same way:**
1. `npm run verify -- cartoon-fx` green, from the repository's root, plus the hand checks the block
   names.
2. Every new check falsified, once.
3. A `CHANGELOG.md` entry for anything user-visible, and the version bumped as the table says.
4. The docs the block names kept true, and ARCHITECTURE's baseline table updated for any count
   that moved.
5. A done-note appended to the block, then the prompt rewritten, then a local commit.
6. The owner's `/code-review high`, then a review-fixes commit.
7. The next prompt printed as the chat's last message.

Never push without being asked.

| Session | Scope | Decisions | Version |
|---|---|---|---|
| F1 | The review effects play in the conversation; the typed report; `drawnRows` evicts its oldest | 1–5 | **0.10.2** |
| C1 | The Biome reformat; close the round | 6 | — |

---

## F1: the review effects play in the conversation

- **Measure the desktop's findings card first** (decision 3).
  - Find which `ui.render` components the desktop raises for a `ReportFindings` call and around it.
    Look at `ToolUse`, a `ToolGroup` that holds the call, `ToolResult`, and the rows before and
    after it, with the `onScreen` each one carries.
  - Find which hook marks the call's row drawn today, `ToolUse` or `ToolGroup`.
  - Find which of them draws a rewrite the owner can see. The declarations name the components
    (`RenderComponent` in the laid `claude-code/index.d.ts`); grep `ToolResult: {`.
  - Record each answer with the desktop engine's version.
- **Draw the effects there** (decisions 1 and 2).
  - The effect's row and the hooks that draw it are in `hooks/register.tsx`:
    - `rowOf` (`:83`) and `play` (`:103-113`);
    - the fallback, `toStripUnlessDrawn` (`:115-124`);
    - the `ToolUse` hook (`:344-357`) and the `ToolGroup` hook (`:361-374`). Each marks its row
      drawn through `noteDrawn` (`:87-92`).
  - A row that hides the effect must stop counting as drawn. The new anchor marks it drawn
    instead, so the fallback still runs when nothing on screen shows it.
  - `placement: bottom` and the terminal are unchanged: the strip.
  - Invariant 2 holds: the card still draws the engine's own content, with the effect beside it.
- **The typed report** (decision 4). Replace the two casts at `register.tsx:259-260` with one named
  type for the report's input, beside `FxKind` in `types/index.d.ts` or in `register.tsx`. Grep the
  declarations for `ReportFindings` first; at 2.1.310 they name it nowhere.
- **`drawnRows` evicts its oldest row** (decision 5).
  - Replace `drawnRows.clear()` at `register.tsx:90` with removing the oldest entry. A `Set` keeps
    insertion order, so that is its first.
  - Route the strip's direct `drawnRows.add(effect.row)` (`:404-406`) through the same bounded
    helper. Today it has no cap, so on the terminal the set grows for the whole session.
- **Docs.**
  - `CHANGELOG.md`: a 0.10.2 entry under *Fixed*:
    - the review and its fixes now show in the conversation, in the desktop app;
    - an effect playing when many rows have drawn no longer replays in the strip.
  - `plugin.json`: `version` 0.10.2.
  - `ARCHITECTURE.md`:
    - *The hooks*: the new or changed render hook, with the counts `validate` then lists;
    - *Playing and placement*: where a review plays, and the fallback's example list ("a card the
      app draws its own way");
    - *Known debt*: the `drawnRows` and cast items go;
    - the baseline.
  - `USER-GUIDE.md`: where a review's effects play, if it changes from "under the row".
  - `docs/BACKLOG.md`:
    - the `/code-review` part of *Real triggers on the installed release*, once checked by hand;
    - *An update to a new version*, once checked by hand;
    - anything F1 could not check.
- **Ask at the start of F1:** how to see what the desktop draws for a findings card.
  - A `--plugin-dir` copy runs only in a terminal session, and the terminal always draws in the
    strip, so it cannot show the desktop's rows.
  - *Proposed at intake, not yet confirmed:* a throwaway probe mod in the session mods folder the
    plugin-authoring skill watches. It would log each component the desktop raises for the call,
    and would need the owner's OK before it is placed and again before it is removed (root
    invariant 7).
    - Nobody has measured that the desktop app loads mods from that folder. Check that first,
      with a probe that does nothing but announce itself at `session.start`, before writing the
      real one.
    - If the desktop doesn't load it, remove it (with the owner's OK), and the session takes the
      other route.
  - The other route is to push 0.10.2 and have the owner look.
    - The fix is then built against what the code and the declarations say, with `verify` green,
      and its desktop behaviour is checked only after the push.
    - That push needs the owner's approval like any other. If the owner's look then shows the
      effects still hidden, a fix session is inserted with the owner (*Rounds*, step 4), and C1
      waits for it.

**Gates:**
- `npm run verify -- cartoon-fx`, with these tests on the `desktop` surface:
  - a `/code-review` report draws "Reviewed!" where decision 1 puts it, with its count;
  - a re-report with fixes draws "Bugs squashed!" there too, with the exact count; none fixed
    plays nothing;
  - a row that cannot show the effect does not cancel the move to the strip;
  - under `/fx place bottom`, both play in the strip;
  - an effect still playing when `drawnRows` passes 200 keeps its mark and doesn't replay;
  - the strip's adds, on the terminal, keep the set at 200.
  - The two tests at `tests/cartoon-fx.test.tsx:190-220` mount the effect under the report's
    `ToolUse` row, which is the assumption the owner's check disproved. They change with the fix.
- **By hand, in the desktop app:**
  - a `/code-review` that has findings, then its fixes, with `placement: conversation`;
  - on the installed 0.10.2 once pushed, or through the probe route the owner chose.
  - **The first update.** 0.10.2 is the first version since the install, so the update that brings
    it closes the backlog's *An update to a new version*. Record three things:
    - `claude plugin update cartoon-fx` installs a new `0.10.2/` folder in the plugin cache;
    - a new session runs 0.10.2;
    - the stored `placement` and `fxTakes` are kept.
  - Anything not checked goes to `docs/BACKLOG.md`, *Not yet checked by hand*.

**Watch for:**
- **The formatter is still off for `register.tsx` and the test file** until C1. Keep their layout:
  2-space indent, no semicolons, long lines.
- **The desktop and the CLI are different builds.** `claude plugin test` cannot show what the
  desktop draws around a card. The tests prove the hooks' logic against the components the
  measurement found, and the hand check proves the rest.
- **A version that is never pushed never reaches the desktop.** `claude plugin update cartoon-fx`
  installs only a new `plugin.json` version.
- **`placement` and `fxTakes` are the owner's data.** Read them forward-only.

---

## C1: the Biome reformat, and the round's close

- **The reformat** (decision 6).
  - Run `npx biome format --write mods/cartoon-fx` and `npx biome lint --write mods/cartoon-fx`
    once the formatter exclusions are gone.
  - Rename the five unused `$` in the `.catch` handlers to `_$`.
  - Delete `mods/cartoon-fx/biome.json`, and the *Its own Biome settings* section of this mod's
    `CLAUDE.md`.
- **The close.**
  - Anything left open moves to `docs/BACKLOG.md`.
  - The reformat commit (`refactor(cartoon-fx): …`, no version) carries the last done-note.
  - A separate `docs(cartoon-fx): close round 2` commit deletes this folder's files and rewrites
    the handoff to say no round is in progress, naming the reformat commit.
- **Docs.**
  - `ARCHITECTURE.md`: *Deliberate decisions* loses "the four copied source files keep their own
    layout", and *Overview*'s line counts change.
  - `CLAUDE.md`: the section above goes.
  - `docs/BACKLOG.md`: the reformat item is already out.

**Gates:**
- `npm run verify -- cartoon-fx`, with every baseline count unchanged: tests, hooks, gating hooks
  and state keys. A count that moves is the finding.
- No new check, so nothing to falsify.

**Watch for:**
- **Repo Session 4 also edits this mod's `CLAUDE.md`**, to repoint it at the root `CLAUDE.md`.
  Start C1 only once that change is committed, and never edit another session's uncommitted
  change.
- **The installed 0.10.2 keeps the old layout.** C1 cuts no version, so the release in the
  owner's plugin cache differs from `HEAD` in layout only. That is expected.

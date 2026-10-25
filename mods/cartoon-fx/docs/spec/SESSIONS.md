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
  - *Amended in F1:* they do name it, as `BuiltinToolInputs['ReportFindings']` in the laid
    `claude-code-tools/index.d.ts` (CLI 2.1.310, desktop 2.1.308). The intake's grep covered
    `claude-code/index.d.ts` alone.
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

**Done (2026-10-25, 0.10.2).**
- **Decided with the owner at the start:**
  - the measurement went through a throwaway probe mod in this session's mods folder, placed and
    removed with the owner's OK each time;
  - the session made the `ReportFindings` calls itself, with fictional findings;
  - screenshots were to come through computer use, but it refuses Claude's own window, so the
    owner's screenshots stood in;
  - with no row under the card, the owner chose the reply row before it, found by its text.
- **The anchor.** `rowBefore` in `hooks/register.tsx` reads `$.session.messages()` at the report.
  It walks back past thinking and tool results to the nearest earlier call (`tool:<id>`) or
  reply text (`reply:<text>`), and stops at the person's prompt. A new `ui.render`
  `AssistantMessage` hook draws the effect under the reply whose text matches. A call's row
  already drew it under the `ToolUse` or `ToolGroup` hook. With no row before the card, the
  effect keeps the card's row, and the fallback moves it to the strip.
- **The card stops counting as drawn.** `OWN_CARDS` (`ReportFindings`) makes the `ToolUse` hook
  pass the call's row over, neither drawing nor marking it.
- **The typed report.** `e.tool === 'ReportFindings'` narrows `e` through the laid declarations.
  `reviewReported` takes `Findings`, which is `BuiltinToolInputs['ReportFindings']['findings']`.
  No cast is left for it.
- **`drawnRows`.** `markDrawn` moves a row to the newest end and lets the oldest go past 200.
  `noteDrawn` and the strip both go through it.
- **Amendments:**
  - **The declarations name `ReportFindings`.** Logged in the block above; the session's own
    finding.
  - **"Under the card" can't happen.** Decision 1's first choice needs a hook that draws there,
    and none can. The row before is decision 1's second choice, picked with the owner.
- **Measured** (desktop 2.1.308, probe `fx-probe`):
  - The desktop raises no `ToolResult` for a `ReportFindings` call, and no `ToolGroup` holds it.
  - It raises the call's `ToolUse` row while the call runs (`isRunning: true`, no `onScreen`),
    including once just after the effect started. Then its card takes that row's place, and the
    card paints no hook's tree.
  - So 0.10.1's `ToolUse` hook marked the card drawn, and the fallback never ran. Two check
    calls under `placement: conversation` showed nothing, in a row or in the strip (the owner's
    look).
  - A report draws as a card ("Code review low · 2 findings"). A re-report with outcomes draws
    as a summary line ("Code review 1 fixed · 1 skipped"), and the first card takes up the
    outcomes.
  - Reply rows (`AssistantMessage`) and tool rows beside the card paint a hook's tree.
  - `$.session.messages()` holds one message per block: thinking, then text, then the call, each
    alone.
  - No desktop row carries `onScreen`.
  - With the window not in front, the desktop raised a turn's rows in one burst about 39 s
    late. With it in front, rows came at once.
  - A mod's module memory is shared between its `tool.call` and `ui.render` hooks.
  - The CLI runs 2.1.310.
- **Checked by hand:** only the probe runs above. The fix runs in the desktop only once 0.10.2 is
  installed. *A review's effects beside its card*, and *An update to a new version*, stay in
  `docs/BACKLOG.md`.
- **Falsified:** each new check, by one mutation of `register.tsx`, copied aside and back:
  - with `rowBefore` returning nothing, the review and fixes tests failed;
  - with the card counting as drawn again, the strip-move test failed;
  - with rows ignoring the placement, the `/fx place bottom` review test failed;
  - with the wholesale clear back, the 201st-row test failed;
  - with the strip's uncapped add back, the bounded-strip test failed.
- **Numbers:** 32 tests (+4), 13 hooks (+1), 5 gating, 4 state keys; `validate` lists
  `$.session.messages` among the calls.
- **Review (`/code-review high`), 7 findings: 6 fixed and 1 skipped.**
  - **A transcript that can't be read no longer loses the review.** `rowBefore`'s failure falls
    back to the card's row, so the strip still gets it.
  - **Of two replies with the same words, only the newer one plays it.** `noteReply` keeps each
    reply row's text and the order rows first drew, and `isNewestReply` picks the newest.
  - **The reply hook settles most redraws with one read.** It compares `shown`'s row before the
    clock and placement reads, since reply rows redraw on every streamed delta. Every mounted row
    still redraws when an effect starts, because that is how an earlier row picks one up.
  - **`rowBefore` walks once.** One backward pass covers the holder and the messages before it.
  - **Two untested branches are tested:** a call beside the report in its message, and text in
    the message that holds it.
  - **`markDrawn` lets a row go only past the cap,** through one `bound` helper that the reply
    order shares.
  - **Skipped:** running the review beside the report's result. Tried, it made the review tests
    pass or fail on promise timing, since the test kit does not wait for that work. A mutation
    that only changed the number of promise steps flipped a test. The effect stays awaited, at one
    transcript read per review.
  - **Falsified:** each new check, by one mutation copied aside and back: the transcript failure
    uncaught; every same-text reply playing; calls beside the report ignored; the holder's text
    ignored; and the wholesale clear, on the new helper.
  - **Numbers after the review:** 35 tests (+3), 13 hooks, 5 gating, 4 state keys.

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
  - *Amended at plan time, with the owner:* the close follows the review, not the reverse. The
    0.10.2 check in the desktop runs at this session's `/code-review high`, and if it fails, the
    round stays open for an inserted fix session. The review commit carries the done-note's
    *Review* section, and the close names it too.
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

**Done (2026-10-25, no version; cartoon-fx stays 0.10.2).**
- **Decided with the owner at the start:**
  - 0.10.2 had not been checked in the desktop. The check moves into this session: the owner's
    `/code-review high` here runs in a desktop session started after the update.
  - The close follows that check (amendment below).
  - A review with no findings shows only "Reviewed!". That is recorded, the round closes anyway,
    and "Bugs squashed! N review defects fixed" stays under *Not yet checked by hand*.
  - Repo Session 4 is not running, and its repoint of this mod's `CLAUDE.md` is not committed.
    C1 went ahead, and edited only the *Its own Biome settings* section.
- **The reformat.**
  - `biome.json` is deleted, and the five `.catch` handlers name the unused `$` as `_$`.
  - `npx biome format --write mods/cartoon-fx` fixed the four files;
    `npx biome lint --write mods/cartoon-fx` applied nothing.
  - Biome joined arrow bodies broken after `=>`, put `+` chains one term a line, expanded tuple
    arrays and long calls, dropped one `return ( … )`'s parentheses in `fx.ts`, and put the
    strip's `{words}` on its own JSX line.
- **Docs.**
  - This mod's `CLAUDE.md` lost *Its own Biome settings*.
  - `ARCHITECTURE.md`: the line counts, invariant 1's handler, the copied-layout decision and
    the Biome debt gone.
  - It gained one line from F1's measurement: the call's hooks and the rows' hooks share one
    module memory, which the fallback relies on.
- **Amendments:**
  - **The close follows the review.** The block, like the workflow's *Close*, put the close
    first. The 0.10.2 check moved into this session's review, and a failed check must keep the
    round open for an inserted fix session. Amended at plan time, with the owner.
- **Measured** (CLI 2.1.310, Biome 2.5.15):
  - Lines: `detect.ts` 84 → 82, `fx.ts` 801 → 830, `register.tsx` 513 → 514, the test file
    678 → 687. Biome's diff over them, read-only over stdin before the edit, matched.
  - **The same syntax trees.** A one-off script parsed each file at `HEAD` and after, with the
    repo's TypeScript. It compared node kinds and identifier and literal text, skipping
    parentheses, whitespace-only JSX text, and `_$` for `$`. All four were equal (539, 7,064,
    3,472 and 6,119 nodes).
  - `validate`'s listing is identical before and after: hooks, gating hooks, calls and state.
- **Checked by hand:** nothing yet. The 0.10.2 check comes at the review.
- **Falsified:** no new gate check. The one-off tree comparison, once: with `'Reviewed!'` changed
  to `'Reviewed?'` in a scratch copy of `register.tsx`, it named the differing literal and exited
  1.
- **Numbers:** 35 tests (±0), 13 hooks (±0), 5 gating, each with a `.catch` (±0), 4 state keys
  (±0); `tsc` and the import scan clean; no warning but the allowed `CLAUDE.md` one.

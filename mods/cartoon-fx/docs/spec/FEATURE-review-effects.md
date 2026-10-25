# FEATURE: the code-review effects that never show (round 2)

## The request, verbatim (2026-10-25)

> there are two animations that never play - core reviewed and defects fixed

"core reviewed" is the `review` effect ("Reviewed!"). "defects fixed" is the `fixes` effect a
`/code-review` report plays once its fixes are applied ("Bugs squashed! N review defects fixed").
Both come from the `tool.call` hook for every tool (`hooks/register.tsx:253-265`), which watches
`ReportFindings` and hands its findings to `reviewReported` (`register.tsx:143-156`).

The intake did not audit. It traced the request to one cause:
- **The trigger fires** (measured, CLI 2.1.310). A headless `claude -p --plugin-dir mods/cartoon-fx`
  call to `ReportFindings` logged `tool_dispatch_end tool=ReportFindings outcome=ok`, then
  `hooks module cartoon-fx@inline tool.call settled`.
- **What the reports look like.** The owner's own transcripts show `/code-review` sending both of
  them from the main conversation, not from a subagent, so each one has a row. Their input has
  top-level `findings` and `level`, which is what the hook reads. None of them errored, and
  re-reports with `outcome: "fixed"` are common.
- **The owner's hand check** (desktop app, release 0.10.1). Under `/fx place bottom`, a
  `/code-review` played "Reviewed!" in the strip above the prompt. The review found nothing, so
  no second report followed.

So detection works and display fails. The desktop draws a `ReportFindings` call as its own
findings card. The `ToolUse` hook still draws the effect under the row and marks it drawn
(`noteDrawn`, `register.tsx:86-92`), which cancels the 900 ms fallback to the strip. That much is
inferred from the code: what the desktop raises around the card has not been measured. The
`fixes` report goes through the same hook and the same row, so it is taken to fail the same way;
that was not checked by hand.

The owner took three backlog items into the round: the `ReportFindings` cast, the Biome reformat,
and the `drawnRows` clear.

## Resolved decisions (2026-10-25, at intake)

1. **The review effects play in the conversation, like every other effect.** The owner: "It has
   to play as the other ones, i don't like them playing in that bottom mode".
   - Under `placement: conversation`, they draw at the report's place: under the findings card
     where a render hook can draw there, else under the nearest conversation row after it.
   - The strip gets them only as it gets any effect: through the fallback (the row scrolled off,
     or nothing drew it), or under `/fx place bottom`.
   - If the desktop offers no conversation row that can carry them, F1 stops and asks.
2. **The cause is display, not detection** (the owner's hand check). A row that cannot show the
   effect must not count as drawn, so the fallback still runs.
3. **F1 measures before it fixes.**
   - It finds which render components the desktop raises around a `ReportFindings` call
     (`ToolUse`, `ToolResult`, the `AssistantMessage` after it, or others).
   - It finds which of them draws a rewrite where the owner can see it.
   - The done-note records the desktop engine's version beside each answer.
4. **The `ReportFindings` input gets one named type.** This replaces the casts at
   `register.tsx:259-260` (`e.tool as string` and `e as unknown as { findings?: … }`). The type is
   taken from the declarations where they name the tool. Where they don't, the one local type is
   the only cast left.
5. **`drawnRows` evicts its oldest row past 200** (`register.tsx:86-92`), instead of being emptied
   wholesale. An effect still playing keeps its mark, so it never replays in the strip.
6. **The Biome reformat.**
   - Biome formats `hooks/detect.ts`, `hooks/fx.ts`, `hooks/register.tsx` and
     `tests/cartoon-fx.test.tsx`.
   - The five `.catch(($, e, next) => next(e))` handlers name the unused `$` as `_$`.
   - The folder's `biome.json` is deleted, and so is the *Its own Biome settings* section of
     this mod's `CLAUDE.md`.
   - No baseline count moves, and nobody using the mod sees it, so it cuts no version.
7. **The sessions, in order:**
   - **F1** (decisions 1–5) releases **0.10.2**, a fix release.
   - **C1** (decision 6) closes the round and cuts no version.
   - A fix reaches the owner only through a new `plugin.json` version, since
     `claude plugin update` installs nothing else (root SPEC decision 11, amended).
8. **Out of this round:**
   - detection by printed output;
   - the `awaitingLeaderApproval` cast.

   Both stay in `docs/BACKLOG.md`.

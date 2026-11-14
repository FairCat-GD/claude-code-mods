# The session plan: round 3, fun, a queue, new moments and controls

One chat per session. Never run two sessions in one chat: the point of the split is that no
session inherits stale context.

- **Scope** lives here, fixed in advance. The request and its resolved decisions are in
  `FEATURE-fun.md` beside this file, which is read-only; do not re-litigate them. The audit
  behind them is `REVIEW-2026-11-14.md`, which is evidence, not scope. If a session finds a block
  wrong, it amends the block and records the reason both in the block and in
  `docs/next-session-prompt.md`.
- **State** is `CHANGELOG.md` (what shipped) and `docs/next-session-prompt.md` (what the next
  session needs that the docs do not say). Every session rewrites the prompt as its last act.
- **When this round closes,** A2 deletes this file, the feature file and the review. Git history
  keeps them, and anything left open moves to `docs/BACKLOG.md`.

**Before starting**, confirm that this mod's folder and the shared files are clean and that
`docs/next-session-prompt.md` names the session you are about to do. **Read order:** what the
block's Read line names, the root `CLAUDE.md`, this mod's `CLAUDE.md`, `docs/ARCHITECTURE.md`,
then the prompt. **Then plan, in plan mode,** and ask the block's *Ask at the start* questions
before any edit.

**Every session ends the same way:**
1. `npm run verify -- cartoon-fx` green, plus the hand checks the block names.
2. Every new check falsified.
3. A `CHANGELOG.md` entry for anything the owner will notice, and the version in `plugin.json`
   bumped as the table says.
4. The docs the block names kept true, and ARCHITECTURE's baseline table updated for any count
   that moved.
5. A done-note appended to the block, then the prompt rewritten, then a local commit.
6. The owner's `/code-review high`, then a review-fixes commit.
7. The next prompt printed as the chat's last message.

Never push without being asked. A version reaches the owner's sessions only once it is pushed
and `claude plugin update cartoon-fx` installs it; a hand check of a new build before then runs
in a `claude --plugin-dir mods/cartoon-fx` terminal session, which shows the strip's glyphs, not
the drawings. **A hand check in the desktop therefore comes after the commit and the review:**
on the owner's approval of the push and their update, in a new desktop session. Its outcome goes
in the next session's handoff; if the owner does not push, the check goes to `docs/BACKLOG.md`'s
*Not yet checked by hand*. It never holds a commit back.

| Session | Scope | Decisions | Version |
|---|---|---|---|
| A1 | The drawings' faults fixed, the helpers and the smoke redone, and checks that can fail when a drawing is wrong | 1, 2 | **0.11.0** |
| D1 | Detection: the git subcommand anchored, rejected pushes, detached HEAD, more test runners, quoting | 1 | **0.11.1** |
| Q1 | The queue: everything in order, three waiting at most, stale ones dropped | 1, 4, 5 | **0.12.0** |
| T1 | A cherry picked, and a merge, from the engine's report | 3, 6 | **0.13.0** |
| T2 | A pull request opened, and a rebase finished | 6 | **0.14.0** |
| C1 | `/fx off` and `on`, `/fx size`, and the terminal's row animated | 7 | **0.15.0** |
| A2 | A fun pass over the existing drawings; docs and the close | 2, 8, 9 | **0.16.0** (proposed) |

---

## A1: The drawings, fixed and checkable

**Read:** `FEATURE-fun.md` decisions 1 and 2; `REVIEW-2026-11-14.md` F2–F7 and F13–F15;
`hooks/fx.ts`; `hooks/register.tsx:13-19` (the zones); `tests/cartoon-fx.test.tsx`.

- **The faults** (decision 1), each with the review's evidence:
  - the magnifying glass sweeps the page and stays in frame (F2, `hooks/fx.ts:509-523`);
  - the "!" marks never overlap, for one to four findings (F3, `:527`);
  - the gauge's yellow band starts at the yellow zone, from one shared home for the thresholds
    that `register.tsx` and `fx.ts` both read (F5, `fx.ts:748-750`, `register.tsx:16-18`);
  - every title and subtitle stays inside the 260-unit view at its pop's peak, the longest words
    of any effect included (F6, `fx.ts:79`, `:651`);
  - the comments of F14.
- **Redone for fun** (decision 2): the helpers, larger and in front of the smoke, landing in a
  pose rather than vanishing (F4, `fx.ts:402-475`); the smoke, fading as one shape so no edge
  shows through on a dark background (F7, `fx.ts:115-145`). Their designs are settled with the
  owner from rendered frames.
- **Checks that can fail when a drawing is wrong** (F15). Pure tests over `drawFx`'s output, for
  every kind and the extremes of F13:
  - each drawing stays under the `<Svg>` cap of 131,072 characters;
  - the lens's path, the marks and each label's box, at its peak, lie inside the view;
  - the marks do not overlap; the bands' edges equal the zones.
- **Docs.** `CHANGELOG.md` 0.11.0; `docs/ARCHITECTURE.md` (*The drawings*, *Testing strategy*,
  the baseline); `docs/USER-GUIDE.md`, if a drawing it describes changed.
- **Ask at the start of A1:**
  - **Where the frames are rendered for the owner to see.** The import scan allows a mod only
    what the declarations name, so a Node script inside this folder that serves a contact sheet
    fails the gate. A page built once into a scratch folder outside the repository and opened in
    a browser, as the review did, needs no committed code; anything committed would need a
    repo-level session. Proposed at intake: the scratch page, recorded in the done-note.
  - **What the helpers and the smoke become**, from a first rendered draft of each.

**Gates:**
- `npm run verify -- cartoon-fx`, with the structural tests above, each falsified by restoring
  the fault it guards (the lens's double offset, the overlapping marks, the 60% band, the
  clipped subtitle).
- Every drawing's frames, rendered as the first ask settles, seen by the owner before the
  commit: each plays whole and inside the frame.
- `/fx all` in a `--plugin-dir` terminal session: the strip still plays every effect.
- In the desktop, after the push and update (see the header): `/fx all` plays each drawing
  whole, in its row and in the strip.

**Watch for:**
- **`claude plugin test` cannot see what an `<Svg>` paints.** The structural tests check
  geometry the code computes; the frames are checked by eye, and the done-note says which.
- **A label's width is estimated, not measured.** No text metrics exist in the engine; bound it
  by characters and font size with a margin, and test the longest words of every kind.
- **The confetti is the largest drawing.** Polish elsewhere must not push any drawing near the
  cap.

**Done (2026-11-14, 0.11.0).**
- **Decided with the owner at the start:**
  - **Frames:** a scratch contact sheet outside the repository. A Node script in the session's
    scratch folder imported `hooks/fx.ts`, with a resolve hook for its extensionless
    `./zones`. It wrote a page of every kind with `/fx`'s words, the longest words and the
    extremes, each paused at ten times on dark and four on light, plus a debug view of the whole
    440 box with the 260 view outlined. The page was served on `127.0.0.1` from the scratch
    folder and opened in the app's browser pane. A `file://` page opens there only as a static
    snapshot, and a `.claude/launch.json` would be an untracked repo-level file. Nothing of it
    is committed.
  - **Smoke:** puffs that shrink away. Drafts of today, A (fades as one shape) and B (shrinks)
    were rendered inline in plan mode; the owner left the choice to the session, which chose B. The
    owner confirmed it on the contact sheet.
  - **Helpers:** the draft as drawn. A bomb, smoke behind, ninjas at 4× leaping to spread spots,
    then a squash, a hop and a victory pose.
  - **Long words:** shrink to about 70%, then cut with "…".
- **Zones.** `hooks/zones.ts` holds `YELLOW`, `RESET`, `RED` and `RED_RESET`; `register.tsx` plays
  by them and the gauge draws its bands from them.
- **The lens and the marks.**
  - The lens's group is translated to its start, and its `animateMotion` values are offsets
    from it.
  - It pops in, zigzags down the page and pops out.
  - Each "!" sits after the end of its flagged line (`[1, 4, 2, 0]`) and pops when the lens's
    path reaches that line's height.
- **Words that fit.** `textBox` estimates widths by character class, calibrated in the browser
  pane. `fit` shrinks in half steps, then cuts. `label` fits the title and subtitle at `PEAK`
  with its tilt, then moves vertically to keep its peak box inside the view. The stamp fits
  AMENDED (floor 20) and its hash.
- **Scene positions the frames settled:**
  - the fixes' ground at 116 (was 128), so the nudged label clears the flattened bug;
  - the clapperboard at `cy` 84 (was 94);
  - the review's page top at 30 (was 38);
  - the helpers leaving at 0.36 s, once the smoke has swollen.
- **Smoke and helpers.** `cloud` circles drift and shrink to radius 0, with no opacity animation,
  inside `<g class="puff">`. `helpers` draws the bomb and the smoke, then each helper (two
  sprites swapped at landing, `SPOTS` per count, a sparkle), then the label.
- **Tests.** Seven structural tests over `drawFx`'s output, with a small parser and transform
  composer in the test file. They read the pieces by `class` (`label`, `lens`, `mark`, `band`,
  `needle`, `puff`, `helper`). F14's three comments were corrected.
- **Amendments:**
  - **The stamp's imprint is checked as a label too, and AMENDED fits its frame.** At 34 px,
    AMENDED overflowed the imprint's 152-unit frame before this session; the review had seen
    only `/fx`'s SAVED. Its floor is 20 rather than 70%, because cutting it read "AMEND…". The
    session's own finding, within F6's "every title".
  - **Four scenes moved** (above) so the labels' new vertical fit does not cover them. The
    session's own finding, from the frames.
- **Measured** (Chromium 156 in the app's browser pane, macOS):
  - the label font stack resolves to Arial Rounded MT Bold; SF Pro Rounded is not installed, and
    `ui-rounded` falls through;
  - "Bugs squashed!" is 7.8 em at weight 900, so 267 units at its 1.28 peak against the 260
    view, confirming F6;
  - per-character widths, the larger of Arial Rounded MT Bold and system-ui at 800 and 900, set
    the classes; the estimate runs 6–13% over each measured word, never under.
  - The tests ran on CLI 2.1.325, Node 26.7.0.
- **Checked by hand:**
  - The owner looked at every drawing's frames on the contact sheet before the commit: "All
    good".
  - In `claude --plugin-dir mods/cartoon-fx` terminal sessions (CLI 2.1.325), the strip played
    all ten. The session started them from the Terminal panel at the owner's request, with `/fx all`
    as the opening prompt: SAVED, tests, review, fixes, compact, helpers, yellow and red were
    read off the strip. Plan and push played between samples, so `/fx plan` and `/fx push` were
    each read on their own.
  - The desktop check waits for the push (`docs/BACKLOG.md`).
- **Falsified**, each by copying the file aside, breaking it, and copying it back; each failed
  its own test alone, 42 pass and 1 fail:
  - the cap lowered to 40,000;
  - labels with no fit and no vertical move;
  - the lens's double offset;
  - marks `[1, 3, 4, 2]` at one x;
  - the 60% band;
  - a per-circle opacity fade in the smoke;
  - the crew drawn before the smoke.
- **Numbers:**
  - 43 tests (+7);
  - `validate` 13 hooks, 5 gating, each with a `.catch`, and 4 state keys, unchanged;
  - `tsc` and imports clean;
  - the largest drawing is the confetti at 49,337 characters (−1,406), and five helpers draw
    28,642 (+10,031);
  - 19 tracked files (+1).
- **Review (`/code-review high`), 9 findings: 9 fixed, 0 skipped.**
  - **The marks pop as the glass arrives.** They were timed by the lens's keyTimes alone, but
    the motion eases on keySplines, so a mark could pop before the glass reached its line.
    `timeFor` now inverts each segment's spline, and `fx.ts` writes the splines from the same
    list.
  - **The bottom labels pass the `y` they land at:** review 145, fixes 148, plan 148, tests 145,
    gauge 147, each the highest it reached with any of the tested words. The vertical move
    stays only as a safety net, for words no test covers.
  - **The handoff names every unpushed commit,** the parallel repo session's two included.
  - **`CHANGELOG.md` links 0.11.0** to the session commit.
  - **The done-note says "the session"** where it had credited the AI by name (root
    `CLAUDE.md`, no AI attribution).
  - **Comments in `fx.ts` are one line each,** where they had grown to paragraphs.
  - **The lens test composes its motion in the lens's own frame** (after its translate, before
    what it holds), so it stays right if the lens is ever nested in a transformed group.
  - **The long-branch check reads the label's subtitle,** not the drawing's second text.
  - **`fit` cuts down to "…" alone,** so even the last cut never returns text that it knows
    still overflows.
  - **Falsified:** all seven structural tests again, each failing alone (42 pass, 1 fail), since
    the lens test was rewritten. The branch check failed alone when a cut dropped its "…".
  - **Numbers after the review:** unchanged: 43 tests, `validate` 13 / 5 / 4, `tsc` and
    imports clean.

---

## D1: Detection that reads what happened

**Read:** `FEATURE-fun.md` decision 1; `REVIEW-2026-11-14.md` F8, F9 and §7; `hooks/detect.ts`;
the detection tests (`tests/cartoon-fx.test.tsx:650-722`); `docs/BACKLOG.md`, *Deferred*.

- **The git subcommand is the first word after `git` and its global options** (`-C <dir>`,
  `-c <key=value>`, `--no-pager`), not any later word (F8, `hooks/detect.ts:18`).
- **A push needs the push's own report:** its `To <remote>` line, with a ref line that is not a
  rejection (`!`). With neither and no `gitOperation.push`, nothing plays (F8, `:53-61`).
- **A commit on a detached HEAD counts** (F9, `:71`).
- **More runners and their marks** (F9, `:25-43`): `node --test` (`pass N` / `fail N`), `rspec`
  (`N examples, 0 failures`), `dotnet test`, `gradle` and `./gradlew test`, `mvn test`,
  `xcodebuild test`, `phpunit`, `mix test`. A `FAIL` mark counts only where runners print it,
  at a line's start, so a test named "shows FAIL badge" passes.
- **Commands split with quoting in view:** `&&`, `;`, `|` and newlines inside quotes or a
  heredoc no longer split (the *Deferred* item in `docs/BACKLOG.md`, which leaves it).
- **The engine's report first.** Where `gitOperation` gives a push or a commit, it decides, and
  printed output is the fallback.
- **Docs.** `CHANGELOG.md` 0.11.1; `docs/ARCHITECTURE.md` (*Detection*, *Known debt*, the
  baseline); `docs/BACKLOG.md`.
- **Ask at the start of D1:** whether a tag push (`git push --tags`) plays "Pushed!" with the
  tag's name, as it does today.

**Gates:**
- `npm run verify -- cartoon-fx`, with a case for every row of the review's §7, each falsified.

**Watch for:**
- **A fix bump changes nothing the owner would call a feature.** New runners count as
  detection that was missing, so 0.11.1 holds; anything more is a stop.
- **Fictional output only** (root invariant 6). Shape fixtures on what each runner prints, with
  made-up names and counts.

**Done (2026-11-14, 0.11.1).**
- **Decided with the owner at the start:**
  - **Tag push:** plays "Pushed!" with the tag's name, as before. The recommended answer; the
    question went unanswered and the plan named it as the default, which the owner approved.
  - **The 0.11.0 desktop check:** the owner's first `/fx all` (take 4) ran while a question box
    was open, and looked short of ten. Rerun with nothing open (take 5), all ten played in the
    `/fx` row, on the installed 0.11.0 (desktop engine 2.1.325). The first run's gap is put down
    to the box covering the row; it was not reproduced.
- **The engine's classifier, read from the CLI build 2.1.325** (the desktop's 2.1.325 binary
  holds the same pattern). It anchors `git (-c|-C <v>|--opt=<v>)* <sub>` without `--no-pager`;
  takes a commit from the first `[<branch>|detached HEAD] (root-commit)? <sha>]` line, `kind`
  `cherry-picked` for any `git cherry-pick` in the command and `amended` for `--amend`; takes a
  push only without `-n`/`--dry-run`, from the first ref line shaped `sha..sha` or
  `[new branch]`. A rejected, up-to-date, deleted or `[new tag]` ref is no push.
- **Shipped, in `hooks/detect.ts` alone:**
  - `parts` is a scanner: quotes, `$(…)`, backticks, heredoc bodies, comments and line
    continuations no longer split, and `sh -c '…'`'s string is split as a command of its own;
  - a part's git subcommand is the first word after `git` and its global options;
  - `gitOperation` decides a push or a commit; the printed fallback needs a ref line under `To`
    that is not `!` or `=`, and a commit line may read `detached HEAD`; a `cherry-picked` report
    counts as none;
  - eight new runners, line-start failure marks, and the runners' own tallies and marks.
- **Amendments:**
  - **`sh -c '…'` is split again** (the session's own finding, at plan time with the owner):
    quoting alone would have stopped `bash -c "cd app && npm test"` from counting.
  - **The "Everything up-to-date" check went**, since a push now needs its ref line: a push
    followed by a `git push --tags` with nothing new plays (the session's own finding).
  - **The quoting item had already left `docs/BACKLOG.md`** at the round's opening, so nothing
    left it here; the narrowed printed-output item went back under *Deferred*, so
    `ARCHITECTURE.md`'s *Known debt* points at something true.
- **Measured:** `node --test` on node 26.7.0 prints `ℹ pass N` / `ℹ fail N`, and `# pass N` with
  the TAP reporter. No other new runner is installed here (xcodebuild needs full Xcode), so their
  fixtures follow each runner's documented output (`docs/BACKLOG.md`).
- **Falsified**, each by copying `detect.ts` aside, breaking it and copying it back; each failed
  its own test, 49 pass and 1 fail unless noted:
  - the subcommand matched to any later word;
  - `!` ref lines allowed, and the first `->` anywhere restored (48 and 2: with the hook test);
  - the old commit-line pattern; a `cherry-picked` report counted;
  - each of the eight runners removed in turn;
  - the failure mark matched anywhere; the failure tallies dropped; the pass tallies dropped;
    the new pass marks dropped;
  - the plain split restored; the `sh -c` recursion removed;
  - the "Everything up-to-date" check restored ahead of the engine's report.
- **Numbers:**
  - 50 tests (+7: six of detection, one hook);
  - `validate` 13 hooks, 5 gating, each with a `.catch`, and 4 state keys, unchanged;
  - `tsc` and imports clean;
  - `hooks/detect.ts` 216 lines (+112); 19 tracked files, unchanged.
  - The checks ran on CLI 2.1.325, node 26.7.0.
- **Review (`/code-review high`), 8 findings: 7 fixed, 1 skipped.**
  - **Git's own `To` report outranks the engine's push.** The engine takes the first
    `a..b x -> y` line anywhere in the output, so a pull before a rejected or up-to-date push
    reported "origin/main" as pushed. Where git printed a `To` block, its first good ref decides;
    with none, the engine's branch plays unless git said "Everything up-to-date". An amendment
    of the block's "where `gitOperation` gives a push, it decides", from the review, by the
    session.
  - **`verify: FAIL` and bun's ` 1 fail` read as failures.** The line-start rule had dropped the
    former, which `\bFAIL\b` used to catch; the latter was never read.
  - **`mvn test-compile` and a `gradle test-…` task are no test runs.**
  - **A `<<\EOF` heredoc ends at `EOF`,** where its backslash had kept it open to the command's
    end.
  - **`<<` inside `$((…))` is a shift,** not a heredoc.
  - **One `out` helper** in the tests, beside the fixtures, in place of three.
  - **`CHANGELOG.md` links 0.11.1** to the session commit.
  - **Skipped:** each Bash call scans its command three times (push, commit, tests). The scans
    are linear over one short string per call; passing the parts through would widen three
    exported signatures for no measurable gain.
  - **Falsified,** each failing its own test alone (49 pass, 1 fail): the engine deciding over a
    `To` block; the up-to-date guard dropped; `N fail` dropped from the count; `verify: FAIL`
    dropped; `test-compile` counted; the delimiter's backslash kept; arithmetic read as a
    heredoc.
  - **Numbers after the review:** 50 tests, unchanged; `validate` 13 / 5 / 4; `tsc` and imports
    clean; `hooks/detect.ts` 221 lines.

---

## Q1: The queue

**Read:** `FEATURE-fun.md` decisions 4 and 5; `REVIEW-2026-11-14.md` F1, F12, F17 and §5;
`hooks/register.tsx`; `types/index.d.ts`; the placement and fallback tests.

- **Effects wait their turn** (decision 5). `play` (`hooks/register.tsx:154-164`) puts an
  effect on show when none is; otherwise it waits. At most three wait; one that has waited
  longer than the limit is dropped when its turn comes.
- **One command plays all it did, in the order it ran them** (decision 4): the Bash hook
  (`:273-286`) plays each detected moment, ordered by the part of the command that did it.
- **An effect has an identity of its own,** not the clock's millisecond (F12): the drawing
  cache, the end timer and the fallback key by it (`:55-62`, `:160`, `:166-175`).
- **The fallback keeps its place:** an effect whose row never drew it moves to the strip
  without going to the back of the queue.
- **`/fx all` runs on the queue** in place of its own timers (`:385-394`).
- **A collapsed strip is not a place an effect was seen** (F17, `:469-481`): what plays there
  while `isCollapsed` waits, or is dropped, as the ask below settles.
- **Docs.** `CHANGELOG.md` 0.12.0; `docs/ARCHITECTURE.md` (*Playing and placement*, *Values*,
  the invariants, *Deliberate decisions*, the baseline); `docs/USER-GUIDE.md`.
- **Ask at the start of Q1:**
  - the wait limit; proposed at intake: 10 s;
  - how `/fx all`'s ten samples meet the cap of three; proposed at intake: a replay is the
    owner's own request, so it is exempt, and real moments during it wait behind it, up to
    three;
  - whether the queue lives in module memory or a new `$.state` key (a state key is a machine
    identifier, named once);
  - what a collapsed strip does to an effect: holds it until the strip opens, within the wait
    limit, or drops it.

**Gates:**
- `npm run verify -- cartoon-fx`, with tests, each falsified:
  - a push that crosses 75% plays the confetti whole, then the yellow zone;
  - `npm test && git commit && git push` plays three effects in that order;
  - a fourth waiting effect, and one past the limit, are dropped;
  - two effects in one millisecond both play;
  - a row that never drew its effect hands it to the strip in its place in line.
- A hand check in a `--plugin-dir` terminal session: one command that tests, commits and pushes
  in a scratch repository.

**Watch for:**
- **The pinned clock.** The kit's clock runs only when a test advances it; a queue tested
  without advancing it passes for the wrong reason.
- **Every hook still returns `next`'s result unchanged and waits on nothing the queue holds**
  (invariant 2): queueing is bookkeeping, never a delay of a call.

**Done (2026-11-15, 0.12.0).**
- **Decided with the owner at the start** (each the recommended answer):
  - **Wait limit 12 s,** not the intake's 10: a test, commit and push that also crosses 75% has its
    gauge wait exactly 10.0 s (turns of 3.3, 3.2 and 3.5 s), on the edge.
  - **`/fx`'s samples are exempt** from the cap and the limit; a real moment goes ahead of the
    samples still waiting, so it plays after the sample on show. A new `/fx` run drops an
    earlier run's waiting samples once its sample on show finishes.
  - **The queue lives in module memory.** No new `$.state` key.
  - **A collapsed strip drops** what would play there, when its turn comes.
- **Shipped, in `hooks/register.tsx`, `hooks/detect.ts` and `types/index.d.ts`:**
  - `Shown` has an `id`, a module counter: the drawing cache, the end and the move key by it.
  - `play` starts an effect when nothing is on show, else queues it (`MAX_WAITING` 3, real
    moments ahead of samples). The end clears `shown`, and `GAP_MS` (300 ms, the spacing `/fx all`
    already used) later `advance` starts the next, past real moments older than `WAIT_MS`.
  - The move to the strip keeps the effect on show, same drawing, whole from then, ahead of what
    waits. `drawnId` replaces `drawnRows`: each effect must be drawn itself.
  - The strip notes `isCollapsed`, draws nothing then, and an effect bound for it is dropped at
    its start or its move.
  - `ranAt` places each moment at the first part that did it; the Bash hook plays each, in that
    order. `/fx` plays its samples through the queue; its timers went.
- **Amendments:**
  - **The every-tool `tool.call` hook is registered first,** so it is outermost and the context
    check queues behind the call's own effect. The kit alone could not tell: with the old order,
    the push still queued first (58 pass). A test that holds the push's first store read on the
    clock forces the order, and fails alone with the old order. The session's own finding.
  - **Drawn marks moved from rows to effects** (`drawnId`), within F12's "the fallback keys by
    it". With rows, the second of a command's effects, or any `/fx` sample after the first,
    could play in a row long gone and never move. The two tests of the 200-row bound went with
    the bound; a test of a second effect in a row that is gone took their place.
  - **A fault in the queue's timers empties it** (`reset`), so one failed state write cannot
    leave the queue busy for the rest of the session.
- **Measured:** each test gets a fresh hooks module (a scratch copy whose `session.start` threw
  on effects left from an earlier test: none were). Boundaries are inclusive: a wait due at the
  advance's end resolves in it.
- **Checked by hand:** in a `claude --plugin-dir mods/cartoon-fx` terminal session (CLI 2.1.325),
  started from the Terminal panel, one command in a scratch repository ran `node --test`,
  committed and pushed to a local bare remote. The strip read "All green! 2 passed", then "SAVED
  <sha>", then "Pushed! main". A first run read the first two; the push played between reads, and
  a second run read all three. The desktop check waits for the push (`docs/BACKLOG.md`).
- **Falsified,** each by copying the file aside, breaking it and copying it back:
  - `play` showing at once: 11 fail, the queue tests and the two rewritten `/fx` tests;
  - the hook order restored: the held-read test alone (58 pass, 1 fail);
  - the moments in a fixed order push, commit, tests: the three-in-order test and the gone-row
    test, which plays a commit then a push (57 / 2);
  - `ranAt` taking the last part: its test alone;
  - no cap; no wait limit; real moments to the back; no takeover by a new `/fx`; `isCollapsed`
    ignored: each its own test alone (58 / 1);
  - the id from the clock: the same-millisecond test, with the limit and gone-row tests (56 / 3);
  - the move to the back of the line: its test, and six that read the strip after a move (52 / 7);
  - drawn marks by row: the gone-row test, with the limit test (57 / 2);
  - samples counted toward the cap: `/fx all`'s ten and the cut-in test (57 / 2).
- **Numbers:**
  - 59 tests (+9: ten new, one of detection, and the two bound tests gone);
  - `validate` 13 hooks, 5 gating, each with a `.catch`, and 4 state keys, unchanged;
  - `tsc` and imports clean;
  - `hooks/register.tsx` 615 lines (+109), `hooks/detect.ts` 237 (+16); 19 tracked files,
    unchanged.
  - The checks ran on CLI 2.1.325, node 26.7.0.
- **Review (`/code-review high`), 7 findings: 7 fixed, 0 skipped.** The fixes began before the
  owner was asked, which the cycle does not allow; the owner then said to fix all.
  - **A timer set before a reset does nothing after it.** A gap timer pending across a
    `session.start` could start a waiting effect over the one then on show. `later` records the
    queue's reset count (`era`) and skips its step once it has moved.
  - **The move to the strip checks again that its effect is still on show** after its awaits,
    so it never brings back one that ended meanwhile. No kit test can hold a state read, so this
    one has no test.
  - **`session.start` forgets a collapsed strip,** so a new session's first strip effects are
    not dropped on an earlier session's flag.
  - **`/fx` reads the placement and the clock once per run;** `enter` is `play`'s second half.
  - **One rule for a part's git subcommand** (`subOf`), and one split per command (`partsOf`
    keeps the last command's parts), where each Bash call had split it four times.
  - **`CHANGELOG.md` links 0.12.0** to the session commit.
  - **Tests for a collapsed strip on the terminal,** a session start mid-queue, and a new
    session after a collapsed strip.
  - **Falsified,** each failing its own test alone (61 pass, 1 fail): timers ignoring the reset
    count; `session.start` keeping the queue; the terminal's strip not counted as the strip;
    `session.start` keeping the strip's flag.
  - **Numbers after the review:** 62 tests (+3); `validate` 13 / 5 / 4; `tsc` and imports clean;
    `hooks/register.tsx` 645 lines, `hooks/detect.ts` 249.

---

## T1: A cherry picked, and a merge

**Read:** `FEATURE-fun.md` decisions 2, 3 and 6; `REVIEW-2026-11-14.md` F10 and §5;
`hooks/detect.ts`; `hooks/fx.ts`; the laid declarations' `gitOperation` (grep the
`claude-code-tools` declarations for `gitOperation?:`).

- **Measure first.** In a `--plugin-dir` terminal session, with a probe hook that is removed
  before the commit, run a cherry-pick and a `git merge` in a local scratch repository, and
  record what `gitOperation` holds for each, with the CLI's version. A pull request exists only
  on GitHub, so `gh pr merge` (and T2's `gh pr create`) is measured only as the ask below
  settles. If the engine leaves `gitOperation` empty for one, stop: decision 6 reads only the
  engine's report.
- **A cherry-pick** (`commit.kind === 'cherry-picked'`) plays a cherry picked from its branch
  (decision 3), with the short hash. Today a cherry-pick plays nothing.
- **A merge** (`branch.action === 'merged'`, or `pr.action === 'merged'`) plays a drawing of its
  own, with the branch or the pull request's number. Proposed at intake: two branches zipped
  into one; not yet confirmed.
- **`/fx`** gains both, in `SAMPLES` and its description.
- **Docs.** `CHANGELOG.md` 0.13.0; `docs/ARCHITECTURE.md` (*The hooks*, *Detection*, *The
  drawings*, the baseline); `docs/USER-GUIDE.md`; `README.md`; the marketplace entry's and
  `plugin.json`'s descriptions.
- **Ask at the start of T1:** how a pull request's `gitOperation` is measured. Creating or
  merging one is an action on GitHub, done only with the owner's yes for that step. Proposed at
  intake: the owner names a throwaway repository and runs `gh pr create` and `gh pr merge` there
  in the `--plugin-dir` session, or the PR's moments are left unmeasured and recorded under
  *Not yet checked by hand*. Not yet confirmed.

**Gates:**
- `npm run verify -- cartoon-fx`, with a test per moment from a fictional `gitOperation`, each
  falsified, and A1's structural checks over both new drawings.
- The measurement above, and the cherry-pick and the local merge seen in the `--plugin-dir`
  session's strip; the drawings in the desktop after the push (see the header).

**Watch for:**
- **A new kind is a new name in `FxKind`, `FX_MS`, `drawFx` and `SAMPLES`;** `/fx <kind>` makes
  it a word the owner types, so name it once.
- **The designs are settled from rendered frames** (decision 2).

**Done (2026-11-15, 0.13.0).**
- **Decided with the owner at the start** (each the recommended answer):
  - **The pull request is measured from the CLI's code,** not live on GitHub.
  - **The kinds are `cherry` and `merge`:** `/fx cherry`, `/fx merge`.
  - **The designs, from drafts rendered inline in plan mode:**
    - the cherry: a gloved hand plucks a pair of cherries, and the branch springs back;
    - the merge: a zipper slider closes a blue and a purple strand into one.
  - **A merged pull request is wired, and recorded as unreachable today.** Asked once the code
    reading showed why (below), in place of the block's stop rule.
- **Measured** with a probe hook in a `--plugin-dir` terminal session (CLI 2.1.325), in a
  scratch repository with a fictional identity. The probe added the engine's report to the
  command's output, and was removed before the commit.

  | Command | `gitOperation` |
  |---|---|
  | `git merge ahead` (fast-forward) | `branch: { ref: 'ahead', action: 'merged' }` |
  | `git cherry-pick <sha>` | `commit: { sha, kind: 'cherry-picked', branch: 'main' }` |
  | `git merge --no-ff feature -m "…"` | `branch: { ref: 'feature', action: 'merged' }` |
  | `git merge --no-ff -m "Merge quoted in" quoted` | `branch: { ref: '"Merge', action: 'merged' }` |
  | `git checkout -q topic && git rebase main` | `branch: { ref: 'main', action: 'rebased' }` |
  | `git commit --allow-empty -m … && git cherry-pick <sha>` | one `commit`, `cherry-picked`, with the first commit's sha |
  | `git merge fast` (a merge commit) | `branch: { ref: 'fast', action: 'merged' }` |

- **Read from the CLI's code** (2.1.325, the classifier behind `gitOperation`), and matching
  every row above:
  - a merge needs `git merge` in the command (not `merge-base` and the like), with `Fast-forward`
    or `Merge made by` in the output, so `git pull` reports none;
  - a rebase needs `Successfully rebased`, and its `ref` is the first word after `rebase` that
    does not start with `-`: the upstream, not the branch rebased. **For T2:** "rebased onto
    main" is what the engine can say.
  - `gh pr merge` reports `merged`, or `auto-merge-enabled` with `--auto`; `gh pr create`,
    `created`. The number comes from a pull request's URL, or "pull request …#N", in the output.
  - `gh` prints its merge line only to a terminal (its source: `infof`, gated on
    `isTerminal`), and the Bash tool's stdout is not one (checked). So a pull request Claude
    merges reports no `pr` today. **For T2:** `gh pr create` prints its URL to stdout either way,
    by gh's documented behaviour; not measured.
- **Shipped:**
  - **In `hooks/detect.ts`:**
    - `cherryPicked` returns the engine's cherry-picked sha;
    - `mergesOf` returns the merged branch, with no words for a ref with no branch's shape, and
      a merged pull request's `#N`;
    - `ranAt` places `cherry`, `merge` and `pr`.
  - **In `hooks/register.tsx`:** the Bash hook plays each, in order, and `SAMPLES` has `cherry`
    after `commit` and `merge` after `push`.
  - **In `hooks/fx.ts`:** `cherry` (2600 ms) and `zipper` (2700 ms). `drawFx` reads a
    `Record<FxKind, Draw>` in place of its nested ternary (REVIEW §5).
- **Frames:** A1's contact sheet. A Node script in the session's scratch folder imported
  `hooks/fx.ts`, and the page was served on 127.0.0.1 and opened in the browser pane. It paused
  each kind at ten times on dark and light, with `#42`, no words and the long branch. Nothing of
  it is committed.
- **Checked by hand:**
  - The owner looked at both drawings' frames on the contact sheet before the commit: "All
    good".
  - In `--plugin-dir` terminal sessions (CLI 2.1.325) in the scratch repository, the strip read
    "Merged! side" after `git merge --no-ff side -m "Merge side"`, and "Cherry picked! <sha>"
    after a cherry-pick. Two earlier runs played the cherry between reads.
  - The desktop check waits for the owner's update at the round's end (`docs/BACKLOG.md`).
- **Falsified,** each by copying the file aside, breaking it and copying it back:
  - `cherryPicked` reading nothing: the cherry's hook test, the order test and the detection
    test (65 / 3);
  - the branch merge ignored: its hook test, the order test and the detection test (65 / 3);
  - the pull request ignored: its hook test and the detection test (66 / 2);
  - no ref check, and merges counted in the background: the detection test alone (67 / 1);
  - `ranAt` looking for `cherry`: the order test and the `ranAt` test (66 / 2);
  - the merge placed by the pull request's part: the order test alone (67 / 1);
  - the slider landing at 340, and the cherries lifted 140 to the right: the landing test alone
    (67 / 1). A first break, lifting them 40 higher, left them inside the view and failed
    nothing, so it proved nothing.
- **Numbers:**
  - 68 tests (+6);
  - `validate` 13 hooks, 5 gating, each with a `.catch`, and 4 state keys, unchanged;
  - `tsc` and imports clean;
  - the cherry draws 12,527 characters and the merge 11,571; the confetti is still the largest;
  - `hooks/register.tsx` 660 lines (+15), `hooks/detect.ts` 284 (+35), `hooks/fx.ts` 1113
    (+144); 19 tracked files, unchanged.
  - The checks ran on CLI 2.1.325, node 26.7.0.

---

## T2: A pull request opened, and a rebase finished

**Read:** `FEATURE-fun.md` decisions 2 and 6; T1's done-note (its measurement); `hooks/detect.ts`;
`hooks/fx.ts`.

- **A pull request opened** (`pr.action === 'created'`) plays a drawing of its own, with its
  number.
- **A rebase finished** (`branch.action === 'rebased'`) plays a drawing of its own, with the
  branch. Both designs are settled from rendered frames (decision 2).
- If T1's measurement left the rebase empty, stop. If T1 left the pull request unmeasured, the
  PR's moment is built from the declarations alone, and its live check stays in
  `docs/BACKLOG.md`.
- **Docs.** As T1's, for 0.14.0.

**Gates:**
- `npm run verify -- cartoon-fx`, with a test per moment, each falsified, and the structural
  checks over both drawings.
- The rebase, and the PR where T1's ask allowed it, seen in a `--plugin-dir` session's strip;
  the drawings in the desktop after the push (see the header).

**Watch for:**
- **A pull request is created on GitHub,** an action outside this machine: only on the owner's
  yes for that step, in the repository they name.
- **Only creation plays.** `pr.action` has nine other values; none of them plays this round.

---

## C1: Off and on, a size, and the terminal's row

**Read:** `FEATURE-fun.md` decision 7; `REVIEW-2026-11-14.md` F11 and F16;
`hooks/register.tsx` (`/fx`, `play`, the `AbovePrompt` hook); `hooks/fx.ts:7-16`; this mod's
`CLAUDE.md`, *Machine identifiers*.

- **`/fx off` and `/fx on`**, kept in `$.store`. Muted, nothing plays but what `/fx` replays;
  muting empties the queue.
- **`/fx size small|medium|large`**, kept in `$.store`: `large` is today's 832 × 608
  (`hooks/fx.ts:14`), `medium` about two thirds, `small` about half. `medium` is the default
  (decision 7), so the owner's sessions shrink at this version; the changelog says so. The size
  applies from the next effect, in every open session, as the placement does.
- **The terminal's row moves:** a few frames over the effect's length, the glyphs twinkling and
  shifting, from the same seed.
- **`/fx`'s description, argument hint and unknown-argument reply** name the new words.
- **Docs.** `CHANGELOG.md` 0.15.0; `CLAUDE.md` (*Machine identifiers*: the new store keys);
  `docs/ARCHITECTURE.md` (*Values*, *Playing and placement*, the baseline); `docs/USER-GUIDE.md`;
  `README.md`.
- **Ask at the start of C1:**
  - the store keys' names, which are machine identifiers from then on;
  - the terminal's frame count and rate, and whether its cost is acceptable: each frame
    redraws the strip.

**Gates:**
- `npm run verify -- cartoon-fx`, with tests, each falsified: muted plays nothing and a replay
  still plays; on again plays; a size is stored and drawn at that size in another session; a
  missing or unknown stored value falls back to on and `medium`; the terminal row changes
  between frames and is the same for one seed at one frame.
- By hand in a `--plugin-dir` terminal session: `/fx off`, a commit, `/fx on`, a commit, then
  `/fx all`, its row moving. In the desktop after the push (see the header): `/fx size small`,
  `medium` and `large`, each with `/fx commit`.

**Watch for:**
- **The owner's stored values are read forward-only:** an old store with no new key behaves as
  today, and an unknown value is ignored.

---

## A2: The fun pass, and the close

**Read:** `FEATURE-fun.md` decisions 2, 8 and 9; every done-note above; `hooks/fx.ts`;
`docs/ARCHITECTURE.md` in full; `docs/USER-GUIDE.md`; `README.md`.

- **A fun pass over the drawings A1 left alone** (decision 2). In plan mode, the frames of every
  drawing are shown to the owner, who picks which to redo and how. The intake's own
  suggestion, not yet confirmed: the push, as something sent off (a paper plane or a rocket
  leaving the confetti cloud), which reads "sent" rather than a generic celebration.
- **The docs read cold against the code:** `docs/ARCHITECTURE.md` whole, the user guide, the
  README, and the marketplace entry's description.
- **The release and the close.** The version this round ends on is confirmed with the owner
  (decision 8). Anything left open moves to `docs/BACKLOG.md`. Then a separate
  `docs(cartoon-fx): close round 3` commit deletes this folder's spec files.
- **Docs.** `CHANGELOG.md`; everything above.

**Gates:**
- `npm run verify -- cartoon-fx`, the structural checks over every redone drawing, its frames
  seen by the owner before the commit, and `/fx all` in a `--plugin-dir` terminal session.
- The round's whole `/fx all` in the desktop after the push (see the header), recorded in the
  between-rounds handoff or under *Not yet checked by hand*.

**Watch for:**
- **The review comes before the close** where the workflow the repository runs by then says so
  (repo Session 3b may have re-copied it); follow the root `docs/DEVELOPMENT-WORKFLOW.md` as it
  stands when A2 runs.

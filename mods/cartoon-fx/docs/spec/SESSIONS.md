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

# Backlog

Work that has been named but belongs to no session. Each item needs its own intake before it runs
(a `docs/spec/FEATURE-*.md` with the request verbatim and the decisions resolved, then a block
in `docs/spec/SESSIONS.md`; see the root `docs/DEVELOPMENT-WORKFLOW.md`). When an item is picked
up, it moves out of this file.

## Deferred

- **Muting single effects** (`/fx mute <name>`). Offered at the round 3 intake and declined by the
  owner; `/fx off` mutes them all.
- **Detection reads printed output.** `detect.ts` takes a commit from the call's
  `gitOperation` first, and a push from git's own `To` report first, since the engine also
  reads a fetch's ref line as a push; printed lines also cover what the engine leaves out, such
  as a tag push or `git --no-pager`. Every test run is judged by its runner's wording. A change to either wording breaks it quietly: nothing plays. Narrowed at 0.11.1.
- **Hashes the engine cannot pair.** The engine reports one commit per command, from git's first
  `[<branch> <sha>]` line (measured at T1, CLI 2.1.325). The mod pairs git's lines with the
  commit and cherry-pick parts when there is one line each; otherwise each plays the first
  line's hash, so `git cherry-pick a b` shows `a`'s.
- **A merge beside a pull that moved nothing.** The engine takes a pull's `Fast-forward` for the
  merge's, so a merge plays only when every pull and merge in the command printed one. A
  `git pull && git merge topic` whose pull was up to date plays no merge.
- **A rebase the engine does not report.** It reports a rebase only with a word after
  `git rebase` and `Successfully rebased` in the output (read from its build at T2, CLI 2.1.325),
  so a rebase finished by `git rebase --continue`, and `git pull --rebase`, play nothing. Its
  report holds one `branch`, the rebase read after the merge, so a command that rebases and
  merges plays the rebase alone. Several rebases in one command show the first success line.
- **A GitLab merge request opened.** The engine reports `glab mr create` as a `pr` created too;
  the mod plays only a `gh pr create` part.
- **A cast where the declarations name no shape:** `awaitingLeaderApproval` on `ExitPlanMode`'s
  result. A declarations change would not show in `tsc`. Read from the as-built code, in repo
  Session 3; left out at the round 2 intake, which took the `ReportFindings` cast.
- **`docs/ARCHITECTURE.md` in the workflow's outline.** It was written as built, before the outline
  kept what is Decided apart from what is Built, with a decision log; a new mod's starts in that
  outline. Whether this one moves to it is the owner's call at a cartoon-fx intake. Named by repo
  Session 4.

## Not yet checked by hand

Checks that need a person at the machine. Each has an automated check covering most of it;
these are the parts only a person can see. `/fx all` was checked by hand on the installed release
at 0.10.1, in the desktop app and in a terminal, and at 0.11.0 in the desktop app, where all ten
played in its row. A `/code-review` with findings, and its fixes, were checked at 0.10.2 in the
desktop app: both played beside the findings card.

- **Round 3 in the desktop** (0.12.0 to 0.16.0). The installed release stayed at 0.11.1 through
  the round, by the owner's choice, so none of it has been seen in the desktop app. After
  `claude plugin update cartoon-fx`, in a new desktop session with no dialog open over the
  conversation:
  - `/fx all` plays all fourteen in its row, one after another, each whole: the four redone at
    0.16.0 (the rocket, the clipboard, the suitcase in the yellow and in the red, the googly
    eye), and the cherry, the zipper, the claw and the jack;
  - a command that tests, commits and pushes plays all three under its row, in that order
    (0.12.0);
  - a cherry-pick, a merge and a rebase each play their drawing under their row (0.13.0,
    0.14.0);
  - `/fx size small`, `medium` and `large`, each with `/fx commit`, draw the stamp at
    416 × 304, 546 × 399 and 832 × 608 under its row (0.15.0);
  - after `/fx off`, a commit plays nothing, and `/fx on` plays again (0.15.0).

  Each was checked in `--plugin-dir` terminal sessions' strip, and every new drawing's frames by
  eye on a contact sheet. The tests cover the rows and the sizes each drawing asks for; what the
  app makes of them was not seen.
- **A pull request opened** (0.14.0): never run, since it is an action on GitHub. Built from the
  declarations and the CLI's code (2.1.325): `gh pr create` prints the new URL alone on stdout,
  and the engine reports `pr: { number, action: 'created' }`. Covered by the hook and detection
  tests against fixture output.
- **A merged pull request** (0.13.0): `gh pr merge` prints nothing to the Bash tool, so the
  engine reports no `pr` and nothing plays. Read from the CLI's code (2.1.325) and `gh`'s source;
  never run, since it is an action on GitHub. Should a later engine report it, "Merged! #N" is
  covered by its hook test.
- **A collapsed strip in a live session** (0.12.0): which surfaces let the strip collapse was
  never measured, and nobody has seen an effect skipped there. Covered by the collapsed-strip
  test.
- **The new test runners against real output** (0.11.1): `rspec`, `dotnet test`, gradle,
  `mvn test`, `xcodebuild test`, `phpunit` and `mix test` are none of them installed here, so
  their fixtures follow each runner's documented output; only `node --test` was measured. Each
  has a test for a pass and a failure.
- **A rejected push in a live session** (0.11.1): a push the remote refuses, behind `; echo done`,
  plays nothing. Covered by a hook test and the engine's own pattern, read from its build.
- **Labels in a font other than those measured** (0.11.0): words are fitted by widths measured
  with Arial Rounded MT Bold and system-ui on macOS. A Windows or Linux desktop falls back to
  other fonts, unmeasured; the estimate's margin is all that covers them.
- **The test-run rules in a live session** (0.10.3): `cat` of a config file plays nothing, and
  `npm run verify` still plays "All green!" with its count. The two detection tests cover each
  rule against fixture commands and output.
- **Real triggers on the installed release** (0.10.1): a commit, a push, a passing
  `npm run verify` and an accepted plan, each in a live desktop session. The tests cover each
  against fixture output.
- **A review with nothing before its card** (0.10.2): a report with no reply or call before it
  in its turn plays in the strip after about a second. Covered by the review tests against fixture
  transcripts.
- **The folded group** (0.10.1): a push inside a run of calls the desktop folds into one row plays
  under the group. Covered by the `ToolGroup` test.
- **The move to the strip** (0.10.1): an effect whose row is scrolled out of view plays in the
  strip after about a second. Covered by the fallback tests.
- **The zones in a live session** (0.10.1): the yellow at 75% and the red at 90%, each once. Covered
  by the two zone tests.
- **A compaction and live subagents** (0.10.1): the squish in the strip, and several subagents as
  one "×N helpers!". Covered by their tests.
- **`/fx place bottom` across sessions** (0.10.1): set in one session, it applies in another open
  one from its next effect. Covered by the two placement tests.
- **Effects while the desktop window is not in front** (0.10.2): a probe in round 2 saw the
  desktop raise a turn's rows in one burst about 39 s late (desktop 2.1.308), long past the
  900 ms move to the strip and the effect's own length. Nobody has looked at what plays then, or
  where. No test covers it: the kit raises rows when told.

## Directions

## Decided against

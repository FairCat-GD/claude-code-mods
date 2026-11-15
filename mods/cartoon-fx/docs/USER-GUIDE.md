# cartoon-fx — user guide

cartoon-fx plays a short cartoon when something worth marking happens in a Claude Code session.
It never changes or delays what Claude does; it only watches and draws.

## What plays when

| When | It plays | With the words |
|---|---|---|
| You accept a plan | a clapperboard snaps shut | "Action! let's build!" |
| A commit is made | a rubber stamp | "SAVED" and the short hash, or "AMENDED" for an amend |
| A commit is cherry-picked | a gloved hand plucks a pair of cherries from a branch | "Cherry picked!" and the new commit's short hash |
| A branch is rebased | an arcade claw lifts the branch's blocks off an old base and sets them on top of the main tower | "Rebased!" and the branch onto its new base, such as "topic onto main" |
| A push updates a branch | confetti | "Pushed!" and the branch |
| A pull request is opened | a jack-in-the-box springs open, and the jack wobbles on its spring | "PR opened!" and its number |
| A branch is merged | a zipper closes two strands into one | "Merged!" and the branch |
| A test or verify run passes | a checkmark badge | "All green!" and the number passed |
| A code review finishes | a magnifying glass sweeps a page of code | "Reviewed!" and the number of findings, or "no findings, all clear" |
| Fixes from a review are applied | a bug is swatted | "Bugs squashed!" and how many were fixed |
| A commit of review fixes is made | a bug is swatted, in place of the stamp | "Bugs squashed! review fixes" and the hash |
| The conversation is compacted | a press squishes pages into a cube | "Squished!" and the tokens before → after |
| Subagents start | a smoke bomb bursts and ninja helpers leap out, land and strike a pose | "Helper out!" and its task, or "×N helpers!" |
| The context window reaches 75% | a gauge swings into the yellow | "Yellow zone!" and the percentage |
| The context window reaches 90% | a gauge slams into the red | "Red zone!" and the percentage |

Each stays on screen for about three to four seconds.

- **Effects take turns.** One that comes while another plays waits for it, then plays whole. Up to
  three can wait; a fourth is skipped, and so is one whose turn would come more than 12 seconds
  after it happened.
- **One command plays everything it did, in the order it ran.** `npm test && git commit &&
  git push` plays the checkmark, the stamp, then the confetti. A push that fills the context
  window past 75% plays its confetti, then the gauge.
- **Nothing plays for a failure:** a plan you turn down, a failed or rejected push, a dry run, a
  push with nothing to push, a test run that reports any failure, or fixes where none were fixed.
- **The zones play once on the way in.** The yellow plays again only after the window drops below
  70%, and the red only after it drops below 85%. Going straight past 75% into the red plays the
  red alone.
- **Subagents started together** (within about half a second) play once, with their count.
- **Long words fit the picture.** A long title or subtitle, such as a long branch name, shrinks
  to fit, and past a readable size ends in "…".
- **A push** plays when git reports a branch it updated, or a tag it pushed, which plays with the
  tag's name. A git command that only mentions a push, such as `git log --grep=push`, plays
  nothing.
- **A cherry-pick and a merge** play when Claude Code itself reports one. A merge plays for
  `git merge` when git says it merged, by fast-forward or with a merge commit; `git pull` plays
  no merge, and `git merge --squash` waits for its commit, which stamps. Beside a `git pull`, a
  merge plays only when both say they moved. A pull request merged with
  `gh pr merge` would play "Merged!" and its number, but `gh` says nothing when Claude runs it,
  so today it plays nothing.
- **A rebase** plays when Claude Code reports one: `git rebase <branch>` that git says succeeded.
  It names the branch git updated and the base it now sits on: "topic onto main", "onto main"
  on a detached HEAD, or just the branch for a base such as `HEAD~3`. A branch already up to
  date plays nothing. A rebase finished with `git rebase --continue`, and `git pull --rebase`,
  play nothing, since Claude Code reports neither. A command that rebases and merges plays the
  rebase alone.
- **A pull request opened** with `gh pr create` plays with the number of the pull request it
  printed. A dry run, or a pull request that already exists, plays nothing.
- **A test run** counts when the command, or a part of it after `&&`, `;` or `|` outside quotes,
  starts with one of the common test or verify commands: `npm test`, `npm run verify`, `pytest`,
  `cargo test`, `go test`, `vitest`, `jest`, `playwright test`, `make test`, `node --test`,
  `rspec`, `dotnet test`, `./gradlew test`, `mvn test`, `xcodebuild test`, `phpunit`,
  `mix test` and the like. Environment variables, a wrapper such as `timeout 600` or `bash -c`,
  and a launcher such as `npx`, `uv run` or `python -m` may come before it. Its output must also
  say it passed, with a count or the runner's own word for a pass. A command that only names a
  runner, such as `cat jest.config.js`, or mentions one in quotes or a heredoc, doesn't count.

## `/fx`

| Command | Does |
|---|---|
| `/fx` or `/fx all` | Plays every animation in turn, each after the one before has finished. |
| `/fx <name>` | Plays one: `plan`, `commit`, `cherry`, `rebase`, `push`, `pr`, `merge`, `tests`, `review`, `fixes`, `compact`, `helpers`, `context` or `redzone`. A name it doesn't have gets this list. |
| `/fx place bottom` | Plays every effect in the strip above the prompt, from now on. |
| `/fx place conversation` | Plays effects under the row that set them off again, which is the default. `/fx place middle` does the same. |
| `/fx off` | Turns every effect off, in every open session from its next one, and in later sessions. The one playing stops, and what waits behind it is dropped. `/fx` still plays its replays. |
| `/fx on` | Turns them on again, which is the default. |
| `/fx size small`, `medium` or `large` | Sets how large the desktop app draws effects: 416 × 304, 546 × 399 (the default) or 832 × 608, from the next one, in every open session and later ones. `/fx size` alone says which is in use. The terminal's row has one size. |

- `/fx`'s replays use sample words ("SAVED 5e81772", "42 passed").
- A replay takes its turns like everything else, and none of its samples is skipped. Something
  real that happens during it plays right after the sample on show, then the replay goes on.
- A new `/fx` takes over from an earlier one: the sample on show finishes, and the earlier run's
  other samples are dropped.
- Its answer ends with a take number, such as `playing push (take 3)`. The number counts up across
  sessions, and each run's animations play under that run's own answer.
- Letter case and extra spaces don't matter: `/fx Place  Bottom` works.
- **Your choices are remembered** across sessions: where effects play, whether they are off, and
  their size.

## Where effects play

- **In the conversation (the default).** In the desktop app, each effect plays under the
  conversation row of what set it off. That is the tool call that pushed, committed,
  cherry-picked, rebased, merged, opened a pull request or ran the tests, the plan you accepted, the Agent call that started the
  helpers, or `/fx`'s own answer.
  - When the app folds several calls into one group row, it plays under the group.
  - The app draws a code review's report as its own card, which can't show an animation. So
    "Reviewed!" and "Bugs squashed!" play just above the card: under Claude's reply or the tool
    call that comes right before it.
  - A compaction has no row, so it plays in the strip above the prompt.
  - So does anything a subagent did.
- **Moving to the strip.** If an effect's row isn't on screen within about a second, it plays
  again in the strip, from the start and before anything waiting behind it. That covers a row
  scrolled out of view, a folded-away group, or a review card with nothing just before it.
- **A collapsed strip.** While you have the strip above the prompt collapsed, what would play
  there is skipped. On the terminal, that is every effect. One already playing when you collapse
  it plays out, and shows again if you open the strip before it ends.
- **`/fx place bottom`** keeps every effect in the strip.
- **The choice is remembered.** It applies at once in every open session, from its next effect,
  and in every session after.

## The terminal and the desktop app

| | Desktop app | Terminal |
|---|---|---|
| Where | under the row, or in the strip | always in the strip above the prompt |
| What | the animated cartoon | the words, with a row of coloured glyphs on each side (`✦ • ▪ ✶ …`) that fly outward from the words and twinkle |
| `/fx size` | sets the cartoon's size | stored all the same, but the row has one size |
| `/fx place` | moves effects between rows and the strip | stored all the same, but the terminal always uses the strip |

The strip steps aside while Claude Code shows a survey there.

## Installing, updating, trying a build

- **Install once,** at user scope: `claude plugin install cartoon-fx --marketplace
  FairCat-GD/claude-code-mods`. In the desktop app it's + beside the prompt, then Plugins, then
  Add marketplace.
- **Update** with `claude plugin update cartoon-fx`, then start a new session. It installs a new
  version when one has been pushed; otherwise it says the install is already at the latest
  version and changes nothing.
- **Try an unpushed build** with `claude --plugin-dir <repo>/mods/cartoon-fx`, run as a shell
  command in a terminal. For that session it replaces the installed copy. It keeps its own take
  number, placement, off or on, and size, so trying a build leaves the installed one's alone.
- **Your placement, take number, off or on, and size belong to the install.** A copy loaded
  under another name or from another marketplace starts afresh (`docs/ARCHITECTURE.md`,
  *Values*).

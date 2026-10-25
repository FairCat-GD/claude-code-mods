# cartoon-fx — user guide

cartoon-fx plays a short cartoon when something worth marking happens in a Claude Code session.
It never changes or delays what Claude does; it only watches and draws.

## What plays when

| When | It plays | With the words |
|---|---|---|
| You accept a plan | a clapperboard snaps shut | "Action! let's build!" |
| A commit is made | a rubber stamp | "SAVED" and the short hash, or "AMENDED" for an amend |
| A push updates a branch | confetti | "Pushed!" and the branch |
| A test or verify run passes | a checkmark badge | "All green!" and the number passed |
| A code review finishes | a magnifying glass sweeps a page of code | "Reviewed!" and the number of findings, or "no findings, all clear" |
| Fixes from a review are applied | a bug is swatted | "Bugs squashed!" and how many were fixed |
| A commit of review fixes is made | a bug is swatted, in place of the stamp | "Bugs squashed! review fixes" and the hash |
| The conversation is compacted | a press squishes pages into a cube | "Squished!" and the tokens before → after |
| Subagents start | ninja helpers dash out of a smoke bomb | "Helper out!" and its task, or "×N helpers!" |
| The context window reaches 75% | a gauge swings into the yellow | "Yellow zone!" and the percentage |
| The context window reaches 90% | a gauge slams into the red | "Red zone!" and the percentage |

Each stays on screen for about three to four seconds, and a new one replaces one still playing.

- **Nothing plays for a failure:** a plan you turn down, a failed or rejected push, a dry run, a
  push with nothing to push, a test run that reports any failure, or fixes where none were fixed.
- **The zones play once on the way in.** The yellow plays again only after the window drops below
  70%, and the red only after it drops below 85%. Going straight past 75% into the red plays the
  red alone.
- **Subagents started together** (within about half a second) play once, with their count.
- **A test run** counts when it is one of the common test or verify commands: `npm test`,
  `npm run verify`, `pytest`, `cargo test`, `go test`, `vitest`, `jest`, `make test` and the
  like.

## `/fx`

| Command | Does |
|---|---|
| `/fx` or `/fx all` | Plays every animation in turn, each after the one before has finished. |
| `/fx <name>` | Plays one: `plan`, `commit`, `push`, `tests`, `review`, `fixes`, `compact`, `helpers`, `context` or `redzone`. A name it doesn't have gets this list. |
| `/fx place bottom` | Plays every effect in the strip above the prompt, from now on. |
| `/fx place conversation` | Plays effects under the row that set them off again, which is the default. `/fx place middle` does the same. |

- `/fx`'s replays use sample words ("SAVED 5e81772", "42 passed").
- Its answer ends with a take number, such as `playing push (take 3)`. The number counts up across
  sessions, and each run's animations play under that run's own answer.
- Letter case and extra spaces don't matter: `/fx Place  Bottom` works.

## Where effects play

- **In the conversation (the default).** In the desktop app, each effect plays under the
  conversation row of what set it off. That is the tool call that pushed, committed or ran the
  tests, the plan you accepted, the review's report, the Agent call that started the helpers, or
  `/fx`'s own answer.
  - When the app folds several calls into one group row, it plays under the group.
  - A compaction has no row, so it plays in the strip above the prompt.
  - So does anything a subagent did.
- **Moving to the strip.** If an effect's row isn't on screen within about a second, it plays
  again in the strip. That covers a row scrolled out of view, a folded-away group, or a card the
  app draws its own way.
- **`/fx place bottom`** keeps every effect in the strip.
- **The choice is remembered.** It applies at once in every open session, from its next effect,
  and in every session after.

## The terminal and the desktop app

| | Desktop app | Terminal |
|---|---|---|
| Where | under the row, or in the strip | always in the strip above the prompt |
| What | the animated cartoon | the words, with a row of coloured glyphs on each side (`✦ • ▪ ✶ …`) |
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
  number and placement, so trying a build leaves the installed one's alone.
- **Your placement and take number belong to the install.** A copy loaded under another name or
  from another marketplace starts afresh (`docs/ARCHITECTURE.md`, *Values*).

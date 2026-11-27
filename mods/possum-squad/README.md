# possum-squad

A side pane for Claude Code that lists the main session and every subagent it starts, with
their live numbers and state; in the desktop app each one is drawn as a small animated pixel
opossum dressed for its job. It only watches: it changes nothing Claude does and adds nothing
to what Claude is sent.

This is 1.0.0: the pane opens by itself when a session's first agent starts (the `autoOpen`
setting says when; a pane you close stays closed), and `/possums` opens or hides it. The main session heads it, with its context, then a line
of your plan's limits (such as `5h 40% · 7d 12%`), the session's tokens and work time, which ticks while Claude works, and, with
`/possums set cost estimate`, an estimate in dollars; under it, every subagent Claude starts is a row in Needs you,
Running or Finished, with its state, its role (such as Builder, Scout or Researcher,
worked out from its type, its task's words and its first tool calls), model, what it is doing
(Claude Code's own summary of its progress once it has one, else its last tool call, a file
named first, and in the past once it is done), context, tokens and a time that ticks. In the desktop app each row has its opossum, dressed for
its role in the set the `theme` setting picks (`classic`, `steampunk`, `horror` or
`prehistoric`) and moving for its state: it slides in when it arrives, hops into its outfit,
bobs and blinks while it works, holds up a sign, bobbing, when it needs you, dozes when quiet or
waiting, cheers then falls asleep when it finishes. In a terminal the rows are text. An agent started by another agent sits under it, its tokens
counted in its parent's. A row's role name is a button: press it to pick another
role, which the row takes at once and, for an agent type of your own, every later agent of that
type starts in; its first entry, Detect, works the role out again and forgets that choice. An agent waiting on a permission prompt moves up to Needs you, one that has
gone silent shows as quiet, and one that handed back while its own background work runs waits in
Running until that work is done; while the list is out of sight, a toast says when an agent needs you
or a long one ends, and why one failed (the `toasts` setting keeps only the first, or none). The
pane's tab, beside another pane, counts the agents that need you. A row's `peek` button opens what its agent was asked, its last calls, the
files it changed and the start of its answer. The `collapse` button folds the pane to the main
session's opossum carrying a joey per running agent, with the count; a minimized pane in the
desktop app always shows that. `/possums roles` shows every role of the set in every state, three roles at
a time. `/possums set` keeps its settings.

## Install

In a terminal:

```bash
claude plugin install possum-squad --marketplace FairCat-GD/claude-code-mods
```

In the desktop app: + beside the prompt, then Plugins, then Add marketplace.

## Commands

| Command | Does |
|---|---|
| `/possums` | Shows the Possum Squad pane, or hides it when it is showing. Works mid-turn. |
| `/possums open` | Shows the pane, or brings it forward; never hides it. |
| `/possums roles` | Shows the gallery: every role of the current set in every state, with its costume's name, three roles at a time. |
| `/possums settings` | Lists the settings and their values. |
| `/possums set <name> <value>` | Changes a setting: `autoOpen`, `cost`, `motion`, `theme` or `toasts`. |

## What it can call

These are every call into Claude Code's plugin API it makes, as `claude plugin validate` lists
them: `$.agent.list`, `$.clock.every`, `$.clock.now`, `$.command.register`, `$.state.get`,
`$.state.set`, `$.store.delete`, `$.store.get`, `$.store.set`, `$.ui.close`, `$.ui.invalidate`,
`$.ui.open`, `$.ui.panes`, `$.ui.resolve`, `$.ui.toast`. It makes no network call, starts no
process, reads and writes no file, asks no model and registers no tool. It stores only its
settings, whether Finished is shown and the pane collapsed, and the roles you pick for agent
types of your own.

## Tested with

Claude Code 2.1.330 in the terminal; in the desktop app, on its engine 2.1.330 with 0.13.0, the
last version looked at there. The plugin API is early access and
changes between Claude Code releases, so a later version may need a later possum-squad.

More about how it behaves is in [docs/USER-GUIDE.md](docs/USER-GUIDE.md).

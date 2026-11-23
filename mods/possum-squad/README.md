# possum-squad

A side pane for Claude Code that lists the main session and every subagent it starts, with
their live numbers and state; in the desktop app each one is drawn as a small animated pixel
opossum dressed for its job. It only watches: it changes nothing Claude does and adds nothing
to what Claude is sent.

This is 0.10.1: the pane opens by itself when a session's first agent starts (the `autoOpen`
setting says when; a pane you close stays closed), and `/possums` opens or hides it. The main session heads it, with its context and the
session's tokens and work time; under it, every subagent Claude starts is a row in Needs you,
Running or Finished, with its state, its role (such as Builder, Scout or Researcher,
worked out from its type, its task's words and its first tool calls), model, activity,
context, tokens and a time that ticks. In the desktop app each row has its opossum, dressed for
its role in the set the `theme` setting picks (`classic`, `steampunk`, `horror` or
`prehistoric`) and moving for its state: it slides in when it arrives, hops into its outfit,
bobs and blinks while it works, holds up a sign, bobbing, when it needs you, dozes when quiet, cheers then
falls asleep when it finishes. In a terminal the rows are text. A row's role name is a button: press it to pick another
role, which the row takes at once and, for an agent type of your own, every later agent of that
type starts in. `/possums roles` shows every role of the set in every state, three roles at a time. `/possums set`
keeps its settings.

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
| `/possums set <name> <value>` | Changes a setting: `autoOpen`, `cost`, `motion` or `theme`. |

More about how it behaves is in [docs/USER-GUIDE.md](docs/USER-GUIDE.md).

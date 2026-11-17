# possum-squad

A side pane for Claude Code that lists the main session and every subagent it starts, with
their live numbers and state; in the desktop app each one is drawn as a small animated pixel
opossum dressed for its job. It only watches: it changes nothing Claude does and adds nothing
to what Claude is sent.

This is 0.3.0: `/possums` opens the pane, which for now says no agents have shown up yet, and
`/possums set` keeps its settings. The agents themselves arrive in the releases that follow.

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
| `/possums settings` | Lists the settings and their values. |
| `/possums set <name> <value>` | Changes a setting: `autoOpen`, `cost`, `motion` or `theme`. |

More about how it behaves is in [docs/USER-GUIDE.md](docs/USER-GUIDE.md).

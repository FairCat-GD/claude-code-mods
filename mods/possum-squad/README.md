# possum-squad

A side pane for Claude Code that lists the main session and every subagent it starts, with
their live numbers and state; in the desktop app each one is drawn as a small animated pixel
opossum dressed for its job. It only watches: it changes nothing Claude does and adds nothing
to what Claude is sent.

This is 0.2.0, a test build: `/possums` opens the pane, which for now shows test drawings and
what the mod hears (event field names and types, never their contents) instead of agents. The
agents themselves arrive in the releases that follow.

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

More about how it behaves is in [docs/USER-GUIDE.md](docs/USER-GUIDE.md).

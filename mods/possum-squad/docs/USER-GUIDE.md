# possum-squad — user guide

possum-squad keeps a pane beside the conversation listing the main session and the agents it
starts. It only watches: nothing Claude does changes because it is installed, and it adds
nothing to what Claude is sent. For now the pane is empty; the agents arrive in later versions.

## `/possums`

Type `/possums` to show the Possum Squad pane; type it again to hide it. If the pane is open but
out of sight, behind another pane's tab, `/possums` brings it forward instead of hiding it. It
works while Claude is in the middle of a turn, and prints nothing in the conversation. In a terminal the pane docks
beside the conversation in fullscreen at 110 columns or more, and otherwise sits above the
prompt.

Until an agent starts, the pane says "No agents yet. They show up here when Claude starts one."

If the pane cannot be shown or hidden (another plugin holds a pane of the same name), `/possums`
says so in one line.

Closing the pane yourself, with its close mark or key, is remembered for the rest of the
session. Later versions use that to leave it closed instead of opening it again on their own.

## Installing, updating, trying a build

- **Install once,** at user scope:
  `claude plugin install possum-squad --marketplace FairCat-GD/claude-code-mods`. In the desktop
  app it's + beside the prompt, then Plugins, then Add marketplace.
- **Update** with `claude plugin update possum-squad`, then start a new session. It installs a new
  version when one has been pushed; otherwise it changes nothing.
- **Try an unpushed build** with `claude --plugin-dir <repo>/mods/possum-squad`, run in a
  terminal. For that session it replaces the installed copy, and keeps its own stored values, so
  trying a build leaves the installed one's alone.
- **Turn it off** by disabling the plugin in Claude Code's plugin manager.

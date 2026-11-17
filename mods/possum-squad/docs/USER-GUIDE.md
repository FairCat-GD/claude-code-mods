# possum-squad — user guide

possum-squad keeps a pane beside the conversation listing the main session and the agents it
starts. It only watches: nothing Claude does changes because it is installed, and it adds
nothing to what Claude is sent. For now the pane says only that no agents have shown up yet;
the agents arrive in later versions.

## `/possums`

Type `/possums` to show the Possum Squad pane; type it again to hide it. If the pane is open but
out of sight, behind another pane's tab, `/possums` brings it forward instead of hiding it. It
works while Claude is in the middle of a turn, and prints nothing in the conversation. In a
terminal the pane docks beside the conversation in fullscreen at 110 columns or more, and
otherwise sits above the prompt.

`/possums open` does the same, except that it never hides the pane: use it when you want the
pane in view whatever its state.

Until an agent starts, the pane says "No agents yet. They show up here when Claude starts one."

If the pane cannot be shown or hidden (another plugin holds a pane of the same name), `/possums`
says so in one line.

Closing the pane yourself, with its close mark or key, is remembered for the rest of the
session. Later versions use that to leave it closed instead of opening it again on their own.

## Settings

`/possums settings` lists every setting, its value, and the values it takes.
`/possums set <name> <value>` changes one and answers with its new value. If the name or the
value isn't one it knows, it answers with the names or the values it takes, and changes
nothing. Names and values can be typed in any case.

| Setting | Values | Default | What it will do |
|---|---|---|---|
| `autoOpen` | `never`, `first`, `always` | `first` | Open the pane by itself never, when a session's first agent starts, or on every new agent. |
| `cost` | `off`, `estimate` | `off` | Show an estimated dollar figure beside the plan-limit percent. |
| `motion` | `auto`, `off` | `auto` | Animate the opossums, following your system's reduced-motion setting, or keep them still. |
| `theme` | `classic`, `steampunk`, `horror`, `prehistoric` | `classic` | The set of outfits the opossums wear. |

The settings are kept between sessions and shared by every session you have open. Each takes
effect when the part of the pane it controls arrives; for now they are only kept. If two
sessions change a setting at the same moment, one change may be lost: set it again.

Answers in words show only to you. Typed between turns, they are not sent to Claude. Typed
while Claude is working, Claude Code keeps the answer in the conversation, as it does for any
pane's command.

## Installing, updating, trying a build

- **Install once,** at user scope:
  `claude plugin install possum-squad --marketplace FairCat-GD/claude-code-mods`. In the desktop
  app it's + beside the prompt, then Plugins, then Add marketplace.
- **Update** with `claude plugin update possum-squad`, then start a new session. It installs a new
  version when one has been pushed; otherwise it changes nothing.
- **Try an unpushed build** with `claude --plugin-dir <repo>/mods/possum-squad`, run in a
  terminal. For that session it replaces the installed copy, and keeps its own stored values, so
  trying a build leaves the installed one's settings alone.
- **Turn it off** by disabling the plugin in Claude Code's plugin manager.
- **0.2.0's test setting,** "Test setting (does nothing)", is gone. A value you set for it stays
  in your Claude Code settings, unread; you can remove it there.

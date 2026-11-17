# possum-squad — user guide

possum-squad keeps a pane beside the conversation listing the main session and the agents it
starts. It only watches: nothing Claude does changes because it is installed, and it adds
nothing to what Claude is sent. For now the pane shows a test view; the agents arrive in later
versions.

## `/possums`

Type `/possums` to show the Possum Squad pane; type it again to hide it. If the pane is open but
out of sight, behind another pane's tab, `/possums` brings it forward instead of hiding it. It
works while Claude is in the middle of a turn, and prints nothing in the conversation. In a terminal the pane docks
beside the conversation in fullscreen at 110 columns or more, and otherwise sits above the
prompt.

Until an agent starts, the pane says "No agents yet. They show up here when Claude starts one."

## The test view (this version only)

Below that line, the pane shows what the next version is built from:
- in the desktop app, twenty small animated test critters, one drawn as a still picture, and two
  that should turn darker on a light theme and stand still with reduced motion; a terminal says
  they show in the desktop app;
- your plan-limit percents, as asked for and as last measured;
- every kind of event the mod has heard, split by the engine's word where there is one and by
  whether the main session or a subagent raised it: how many, the order their results came
  back in, and their field names and types. It never shows what an agent was asked, answered or
  worked on;
- how many times the clock has redrawn the pane: once a second while it is open.

What the mod has heard starts over when the mod reloads, and after a reload the clock waits
for the next `/possums` that opens the pane.

Among the plugin's settings is "Test setting (does nothing)". It changes nothing; it checks
whether a plugin's settings can be changed there, and goes in the next version. Changing it
reloads the mod.

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

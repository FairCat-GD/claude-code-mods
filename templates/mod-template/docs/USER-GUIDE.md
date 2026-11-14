# mod-template — user guide

<What the mod does, as the person using it sees it.>

## `/hello`

Type `/hello` in a session: the mod answers that it is loaded, so you can see it runs.

## Installing, updating, trying a build

- **Install once,** at user scope:
  `claude plugin install mod-template --marketplace FairCat-GD/claude-code-mods`. In the desktop
  app it's + beside the prompt, then Plugins, then Add marketplace.
- **Update** with `claude plugin update mod-template`, then start a new session. It installs a new
  version when one has been pushed; otherwise it changes nothing.
- **Try an unpushed build** with `claude --plugin-dir <repo>/mods/mod-template`, run in a
  terminal. For that session it replaces the installed copy, and keeps its own stored values, so
  trying a build leaves the installed one's alone.
